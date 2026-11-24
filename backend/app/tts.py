import hashlib
import logging
import os
from pathlib import Path
from typing import Optional
import httpx
from app.config import settings

logger = logging.getLogger("formsaathi.tts")

# Recommended ElevenLabs voice IDs per language if desired, or defaults to configured voice
VOICE_MAP = {
    "en-IN": "21m00Tcm4TlvDq8ikWAM",  # Rachel
    "hi-IN": "21m00Tcm4TlvDq8ikWAM",  # Multilingual v2 supports Hindi
    "kn-IN": "21m00Tcm4TlvDq8ikWAM",  # Multilingual v2 supports Kannada
}


async def synthesize_speech(
    text: str,
    language: str = "en-IN",
    voice_id: Optional[str] = None
) -> Optional[str]:
    """
    Synthesizes speech using ElevenLabs API with persistent caching.
    1. Generates sha256 cache key from (text, language, voice_id).
    2. Checks local audio cache directory.
    3. Checks S3 if enabled.
    4. Calls ElevenLabs multilingual v2 API via httpx.
    5. Saves audio to local cache (and S3 if configured).
    6. Returns playable audio URL (/v1/audio/<filename>.mp3) or None on failure.
    """
    if not text or not text.strip():
        return None

    clean_text = text.strip()
    active_voice = voice_id or settings.ELEVENLABS_VOICE_ID or VOICE_MAP.get(language, "21m00Tcm4TlvDq8ikWAM")
    cache_key = hashlib.sha256(f"{clean_text}|{language}|{active_voice}".encode("utf-8")).hexdigest()
    filename = f"{cache_key}.mp3"

    # Ensure local cache dir exists
    cache_dir = Path(settings.AUDIO_CACHE_DIR)
    cache_dir.mkdir(parents=True, exist_ok=True)
    file_path = cache_dir / filename

    # 1. Local cache hit
    if file_path.exists() and file_path.stat().st_size > 0:
        logger.info(f"Local audio cache hit for key: {cache_key}")
        return f"{settings.BASE_URL.rstrip('/')}/v1/audio/{filename}"

    # 2. S3 cache check if enabled
    s3_client = None
    if settings.ENABLE_S3_CACHE and settings.S3_AUDIO_BUCKET:
        try:
            import boto3
            from botocore.exceptions import ClientError
            s3_client = boto3.client("s3", region_name=settings.AWS_REGION)
            try:
                s3_client.head_object(Bucket=settings.S3_AUDIO_BUCKET, Key=f"audio/{filename}")
                # Download to local cache
                s3_client.download_file(settings.S3_AUDIO_BUCKET, f"audio/{filename}", str(file_path))
                logger.info(f"S3 audio cache hit for key: {cache_key}")
                return f"{settings.BASE_URL.rstrip('/')}/v1/audio/{filename}"
            except ClientError:
                pass  # Not in S3 yet
        except Exception as e:
            logger.warning(f"S3 cache check failed: {e}")

    # 3. Call ElevenLabs API
    if not settings.ELEVENLABS_API_KEY or "your_" in settings.ELEVENLABS_API_KEY:
        logger.debug("ElevenLabs API key not configured. Audio synthesis skipped.")
        return None

    api_url = f"https://api.elevenlabs.io/v1/text-to-speech/{active_voice}"
    headers = {
        "xi-api-key": settings.ELEVENLABS_API_KEY,
        "Content-Type": "application/json",
        "Accept": "audio/mpeg"
    }
    payload = {
        "text": clean_text,
        "model_id": settings.ELEVENLABS_MODEL_ID,
        "voice_settings": {
            "stability": 0.5,
            "similarity_boost": 0.8
        }
    }

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.post(api_url, json=payload, headers=headers)
            if resp.status_code == 200 and resp.content:
                # Save locally
                with open(file_path, "wb") as f:
                    f.write(resp.content)

                # Upload to S3 if configured
                if s3_client and settings.ENABLE_S3_CACHE and settings.S3_AUDIO_BUCKET:
                    try:
                        s3_client.upload_file(
                            str(file_path),
                            settings.S3_AUDIO_BUCKET,
                            f"audio/{filename}",
                            ExtraArgs={"ContentType": "audio/mpeg"}
                        )
                        logger.info(f"Uploaded audio cache to S3: audio/{filename}")
                    except Exception as s3_err:
                        logger.warning(f"Failed to upload audio to S3: {s3_err}")

                return f"{settings.BASE_URL.rstrip('/')}/v1/audio/{filename}"
            else:
                logger.warning(f"ElevenLabs TTS returned HTTP {resp.status_code}: {resp.text}")
                return None
    except Exception as e:
        logger.warning(f"ElevenLabs TTS call failed ({e}). Returning audio_url: None.")
        return None
