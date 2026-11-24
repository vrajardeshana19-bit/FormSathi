import { SupportedLanguage } from './types';

// Browser Web Speech Recognition Types
interface SpeechRecognitionInstance {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onstart: (() => void) | null;
  onresult: ((event: any) => void) | null;
  onerror: ((event: any) => void) | null;
  onend: (() => void) | null;
}

export interface SpeechSessionCallbacks {
  onStart: () => void;
  onTranscript: (transcript: string, isFinal: boolean) => void;
  onError: (errorMessage: string, isFatal: boolean) => void;
  onEnd: () => void;
}

export class SpeechService {
  private static activeRecognition: SpeechRecognitionInstance | null = null;

  public static isSupported(): boolean {
    return (
      typeof window !== 'undefined' &&
      ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)
    );
  }

  /**
   * Request microphone permission explicitly via navigator.mediaDevices.getUserMedia
   * This is required in Chrome extensions and side panels because Web Speech API
   * fails silently with 'not-allowed' instead of triggering Chrome's permission prompt.
   */
  public static async requestMicrophonePermission(): Promise<boolean> {
    try {
      if (typeof navigator !== 'undefined' && navigator.mediaDevices?.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach((track) => track.stop());
        return true;
      }
    } catch (e) {
      console.warn('getUserMedia permission request failed or was dismissed:', e);
    }
    return false;
  }

  /**
   * Starts live browser speech recognition using the designated language locale.
   */
  public static startListening(
    language: SupportedLanguage,
    callbacks: SpeechSessionCallbacks
  ): boolean {
    if (!this.isSupported()) {
      callbacks.onError(
        language === 'kn'
          ? 'ನಿಮ್ಮ ಬ್ರೌಸರ್‌ನಲ್ಲಿ ಧ್ವನಿ ಗುರುತಿಸುವಿಕೆ ಬೆಂಬಲಿತವಾಗಿಲ್ಲ. ದಯವಿಟ್ಟು ಟೈಪ್ ಮಾಡಿ.'
          : 'Speech recognition is not supported in this browser. Please type your answer.',
        true
      );
      return false;
    }

    this.stopListening();

    try {
      const SpeechRecognitionConstructor =
        (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      const recognition: SpeechRecognitionInstance = new SpeechRecognitionConstructor();

      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = language === 'kn' ? 'kn-IN' : 'en-IN';

      recognition.onstart = () => {
        callbacks.onStart();
      };

      recognition.onresult = (event: any) => {
        let interim = '';
        let final = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            final += transcript;
          } else {
            interim += transcript;
          }
        }

        const activeTranscript = (final || interim).trim();
        if (activeTranscript) {
          callbacks.onTranscript(activeTranscript, Boolean(final));
        }
      };

      recognition.onerror = (event: any) => {
        const errType = event.error;
        let message = 'Speech recognition error';

        if (errType === 'not-allowed') {
          message =
            language === 'kn'
              ? 'ಮೈಕ್ರೊಫೋನ್ ಅನುಮತಿ ನಿರಾಕರಿಸಲಾಗಿದೆ. ದಯವಿಟ್ಟು ಬ್ರೌಸರ್ ಸೆಟ್ಟಿಂಗ್‌ಗಳಲ್ಲಿ ಅನುಮತಿ ನೀಡಿ.'
              : 'Microphone permission denied. Please allow microphone access in browser settings.';
        } else if (errType === 'no-speech') {
          message =
            language === 'kn'
              ? 'ಯಾವುದೇ ಧ್ವನಿ ಕೇಳಿಸಲಿಲ್ಲ. ದಯವಿಟ್ಟು ಮೈಕ್ರೊಫೋನ್ ಬಳಿ ಸ್ಪಷ್ಟವಾಗಿ ಮಾತನಾಡಿ.'
              : 'No speech was detected. Please speak clearly into your microphone.';
        } else if (errType === 'network') {
          message =
            language === 'kn'
              ? 'ನೆಟ್‌ವರ್ಕ್ ಸಂಪರ್ಕ ದೋಷ. ದಯವಿಟ್ಟು ಇಂಟರ್ನೆಟ್ ಪರಿಶೀಲಿಸಿ.'
              : 'Network error occurred during speech recognition. Please check your connection.';
        } else if (errType === 'audio-capture') {
          message =
            language === 'kn'
              ? 'ಮೈಕ್ರೊಫೋನ್ ಹಾರ್ಡ್‌ವೇರ್ ಪತ್ತೆಯಾಗಿಲ್ಲ.'
              : 'No microphone hardware found on your system.';
        }

        callbacks.onError(message, errType === 'not-allowed' || errType === 'audio-capture');
      };

      recognition.onend = () => {
        this.activeRecognition = null;
        callbacks.onEnd();
      };

      this.activeRecognition = recognition;
      recognition.start();
      return true;
    } catch (e: any) {
      callbacks.onError(e?.message || 'Failed to start speech recognition', true);
      callbacks.onEnd();
      return false;
    }
  }

  public static stopListening(): void {
    if (this.activeRecognition) {
      try {
        this.activeRecognition.stop();
      } catch {
        // Ignore stop error
      }
      this.activeRecognition = null;
    }
  }
}
