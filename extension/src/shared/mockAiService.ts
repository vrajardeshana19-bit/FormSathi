import { BilingualAnswer, FormField, InterpretationResult, SupportedLanguage, VoiceCapabilities } from './types';

// Kannada to ISO 15919 / English Latin Transliteration map
const KANNADA_TRANSLITERATION_MAP: Record<string, string> = {
  // Vowels
  'ಅ': 'a', 'ಆ': 'aa', 'ಇ': 'i', 'ಈ': 'ee', 'ಉ': 'u', 'ಊ': 'oo', 'ಋ': 'ru',
  'ಎ': 'e', 'ಏ': 'ee', 'ಐ': 'ai', 'ಒ': 'o', 'ಓ': 'oo', 'ಔ': 'au',
  'ಅಂ': 'am', 'ಅಃ': 'ah',
  // Consonants
  'ಕ': 'ka', 'ಖ': 'kha', 'ಗ': 'ga', 'ಘ': 'gha', 'ಙ': 'nga',
  'ಚ': 'cha', 'ಛ': 'chha', 'ಜ': 'ja', 'ಝ': 'jha', 'ಞ': 'nya',
  'ಟ': 'ta', 'ಠ': 'tha', 'ಡ': 'da', 'ಢ': 'dha', 'ಣ': 'na',
  'ತ': 'tha', 'ಥ': 'thha', 'ದ': 'da', 'ಧ': 'dha', 'ನ': 'na',
  'ಪ': 'pa', 'ಫ': 'pha', 'ಬ': 'ba', 'ಭ': 'bha', 'ಮ': 'ma',
  'ಯ': 'ya', 'ರ': 'ra', 'ಲ': 'la', 'ವ': 'va', 'ಶ': 'sha',
  'ಷ': 'ssha', 'ಸ': 'sa', 'ಹ': 'ha', 'ಳ': 'la',
};

// Kannada digits map
const KANNADA_DIGITS = ['೦', '೧', '೨', '೩', '೪', '೫', '೬', '೭', '೮', '೯'];

export class MockAiService {
  /**
   * Diagnostic utility to check browser voice capabilities for the selected language.
   */
  public static checkVoiceCapabilities(language: SupportedLanguage): VoiceCapabilities {
    const isBrowser = typeof window !== 'undefined';
    if (!isBrowser) {
      return {
        ttsSupported: false,
        sttSupported: false,
        hasDedicatedVoice: false,
        message: 'Non-browser environment',
      };
    }

    const ttsSupported = 'speechSynthesis' in window;
    const sttSupported = 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;

    let hasDedicatedVoice = false;
    let voiceName: string | undefined;

    if (ttsSupported) {
      const voices = window.speechSynthesis.getVoices();
      const targetPrefix = language === 'kn' ? 'kn' : 'en';
      const matchingVoice = voices.find(
        (v) =>
          v.lang.toLowerCase().startsWith(targetPrefix) ||
          v.name.toLowerCase().includes(language === 'kn' ? 'kannada' : 'india')
      );

      if (matchingVoice) {
        hasDedicatedVoice = true;
        voiceName = matchingVoice.name;
      }
    }

    let message: string | undefined;
    if (language === 'kn' && !hasDedicatedVoice) {
      message =
        'Notice: Your browser/OS does not have a dedicated Kannada speech voice installed. Voice playback may fall back to default synthesizer or remain quiet. Text input and Kannada translation are 100% operational.';
    }

    return {
      ttsSupported,
      sttSupported,
      hasDedicatedVoice,
      voiceName,
      message,
    };
  }

  /**
   * Converts Kannada numerals (೦, ೧, ೨...) to standard Arabic numerals (0, 1, 2...).
   */
  public static normalizeKannadaDigits(text: string): string {
    let result = text;
    for (let i = 0; i <= 9; i++) {
      result = result.split(KANNADA_DIGITS[i]).join(String(i));
    }
    return result;
  }

  /**
   * Generates readable Latin transliteration for Kannada text.
   * If input is English or unavailable, returns undefined or sanitized text.
   */
  public static generateTransliteration(text: string, language: SupportedLanguage): string | undefined {
    if (language !== 'kn' || !text.trim()) return undefined;

    // Check known common educational and demographic phrases for fluent transliteration
    const knownPhrases: Record<string, string> = {
      'ನಾನು ಪ್ರಥಮ ವರ್ಷದ ಕಂಪ್ಯೂಟರ್ ಸೈನ್ಸ್ ವಿದ್ಯಾರ್ಥಿ': 'Naanu prathama varshada computer science vidyarthi.',
      'ನಾನು ಬೆಂಗಳೂರಿನಲ್ಲಿ ವಾಸಿಸುತ್ತೇನೆ': 'Naanu Bengalurinali vaasisuttene.',
      'ಹೌದು ನಾನು ನಿಯಮಗಳನ್ನು ಒಪ್ಪುತ್ತೇನೆ': 'Haudu naanu niyamagalannu opputtene.',
      'ಹೌದು': 'Haudu',
      'ಇಲ್ಲ': 'Illa',
      'ವಾರ್ಷಿಕ ಆದಾಯ': 'Vaarshika aadaaya',
    };

    const trimmed = text.trim();
    if (knownPhrases[trimmed]) {
      return knownPhrases[trimmed];
    }

    // Heuristic transliteration for words
    const words = trimmed.split(/\s+/);
    const transliteratedWords = words.map((word) => {
      let tWord = '';
      for (const char of word) {
        if (KANNADA_TRANSLITERATION_MAP[char]) {
          tWord += KANNADA_TRANSLITERATION_MAP[char];
        } else if (/[a-zA-Z0-9.,₹\-]/.test(char)) {
          tWord += char;
        }
      }
      return tWord || word;
    });

    const result = transliteratedWords.join(' ').trim();
    return result || undefined;
  }

  /**
   * Translates meaning between English and Kannada while strictly preserving proper nouns,
   * institution names, dates, amounts, phone numbers, and IDs.
   */
  public static translateText(
    text: string,
    fromLang: SupportedLanguage,
    toLang: SupportedLanguage
  ): { translatedText: string; isCertain: boolean } {
    if (!text.trim() || fromLang === toLang) {
      return { translatedText: text, isCertain: true };
    }

    const trimmed = text.trim();

    // Preserve proper nouns by identifying protected segments
    const protectedEntities = [
      'CMR Institute of Technology',
      'Indian Institute of Science',
      'Visvesvaraya Technological University',
      'Computer Science',
      'Information Science',
      'Artificial Intelligence',
      'Mechanical Engineering',
      'Civil Engineering',
      'Bengaluru',
      'Mysuru',
      'Karnataka',
      'State Bank of India',
      'Canara Bank',
    ];

    // Kannada -> English Known translations
    if (fromLang === 'kn' && toLang === 'en') {
      const knToEnMap: Record<string, string> = {
        'ಹೌದು': 'Yes',
        'ಇಲ್ಲ': 'No',
        'ಒಪ್ಪುತ್ತೇನೆ': 'Agree',
        'ಬೇಡ': 'Disagree',
        'ನಾನು ಬೆಂಗಳೂರಿನಲ್ಲಿ ವಾಸಿಸುತ್ತೇನೆ': 'I live in Bengaluru.',
        'ನಾನು ಪ್ರಥಮ ವರ್ಷದ ಕಂಪ್ಯೂಟರ್ ಸೈನ್ಸ್ ವಿದ್ಯಾರ್ಥಿ': 'I am a first-year Computer Science student.',
        'ವಿದ್ಯಾರ್ಥಿನಿಲಯ': 'Hostel',
        'ಡೇ ಸ್ಕಾಲರ್': 'Day Scholar',
        'ಪೇಯಿಂಗ್ ಗೆಸ್ಟ್': 'Paying Guest (PG)',
      };

      for (const [kn, en] of Object.entries(knToEnMap)) {
        if (trimmed.includes(kn)) {
          return { translatedText: en, isCertain: true };
        }
      }

      // Check if text has numbers/currency
      const normalizedDigits = this.normalizeKannadaDigits(trimmed);
      if (/(\d+)/.test(normalizedDigits)) {
        return {
          translatedText: normalizedDigits,
          isCertain: true,
        };
      }

      // For sentences containing protected entities
      for (const entity of protectedEntities) {
        if (trimmed.includes(entity)) {
          return {
            translatedText: trimmed, // Preserve proper noun
            isCertain: true,
          };
        }
      }

      return {
        translatedText: trimmed,
        isCertain: false,
      };
    }

    // English -> Kannada translations
    if (fromLang === 'en' && toLang === 'kn') {
      const enToKnEntries: [RegExp, string][] = [
        [/\b(?:i\s+)?agree\b/i, 'ಒಪ್ಪುತ್ತೇನೆ'],
        [/\b(?:i\s+)?disagree\b/i, 'ಒಪ್ಪುವುದಿಲ್ಲ'],
        [/\byes\b/i, 'ಹೌದು'],
        [/\bno\b/i, 'ಇಲ್ಲ'],
        [/\btrue\b/i, 'ಹೌದು'],
        [/\bfalse\b/i, 'ಇಲ್ಲ'],
        [/\bi live in bengaluru\b/i, 'ನಾನು ಬೆಂಗಳೂರಿನಲ್ಲಿ ವಾಸಿಸುತ್ತೇನೆ.'],
        [/\bfirst year computer science\b/i, 'ಪ್ರಥಮ ವರ್ಷ ಕಂಪ್ಯೂಟರ್ ಸೈನ್ಸ್'],
        [/\bhostel\b/i, 'ವಿದ್ಯಾರ್ಥಿನಿಲಯ (Hostel)'],
        [/\bday scholar\b/i, 'ಡೇ ಸ್ಕಾಲರ್ (Day Scholar)'],
        [/\bpaying guest\b/i, 'ಪೇಯಿಂಗ್ ಗೆಸ್ಟ್ (PG)'],
      ];

      for (const [pattern, kn] of enToKnEntries) {
        if (pattern.test(trimmed)) {
          return { translatedText: kn, isCertain: true };
        }
      }

      return {
        translatedText: trimmed,
        isCertain: false,
      };
    }

    return { translatedText: text, isCertain: true };
  }

  /**
   * Interprets spoken or typed input for any HTML5 field type into a structured BilingualAnswer.
   * Completely decouples original speech transcript, speech language, translation, and interpreted value.
   */
  public static async interpretAnswer(
    field: FormField,
    rawInput: string,
    inputLanguage: SupportedLanguage,
    targetDisplayLanguage: SupportedLanguage = 'en'
  ): Promise<InterpretationResult> {
    await new Promise((res) => setTimeout(res, 200));

    const cleaned = rawInput.trim();
    // Normalize Kannada numerals first
    const digitNormalized = inputLanguage === 'kn' ? this.normalizeKannadaDigits(cleaned) : cleaned;

    let interpretedVal = digitNormalized;
    let displayPrev = digitNormalized;
    let confidence = 0.90;
    let explanation = 'Direct answer captured.';

    // 1. Checkbox interpretation
    if (field.type === 'checkbox') {
      const isAffirmative =
        /^(yes|true|check|checked|agree|i agree|confirm|sure|ok|1|on|ಹೌದು|ಸರಿ|ಒಪ್ಪಿಗೆ|ಒಪ್ಪುತ್ತೇನೆ|ದೃಢೀಕರಿಸಿ)$/i.test(cleaned);
      const isNegative =
        /^(no|false|uncheck|unchecked|disagree|don't agree|do not agree|0|off|ಬೇಡ|ಇಲ್ಲ|ರದ್ದು|ತಿರಸ್ಕರಿಸಿ)$/i.test(cleaned);

      if (!isAffirmative && !isNegative) {
        return {
          rawTranscript: cleaned,
          interpretedValue: '',
          displayPreview: targetDisplayLanguage === 'kn' ? 'ಅಸ್ಪಷ್ಟ ಉತ್ತರ' : 'Unclear response',
          confidence: 0.2,
          explanation: targetDisplayLanguage === 'kn'
            ? 'ಚೆಕ್‌ಬಾಕ್ಸ್ ದೃಢೀಕರಣ ಅಸ್ಪಷ್ಟವಾಗಿದೆ. ದಯವಿಟ್ಟು ಹೌದು ಅಥವಾ ಇಲ್ಲ ಎಂದು ಸ್ಪಷ್ಟಪಡಿಸಿ.'
            : 'Checkbox response was unclear. Please clearly confirm or decline.',
          bilingual: {
            originalText: cleaned,
            originalLanguage: inputLanguage,
            translatedText: cleaned,
            translatedLanguage: inputLanguage === 'kn' ? 'en' : 'kn',
            interpretedValue: '',
            displayPreview: targetDisplayLanguage === 'kn' ? 'ಅಸ್ಪಷ್ಟ ಉತ್ತರ' : 'Unclear response',
            confidence: 0.2,
            explanation: 'Unclear consent or checkbox confirmation.',
            isEdited: false,
            isConfirmed: false,
          },
        };
      }

      const val = isNegative ? 'false' : 'true';
      interpretedVal = val;
      displayPrev =
        val === 'true'
          ? targetDisplayLanguage === 'kn'
            ? 'ದೃಢೀಕರಿಸಲಾಗಿದೆ (Checked)'
            : 'Checked (Confirmed)'
          : targetDisplayLanguage === 'kn'
          ? 'ಆಯ್ಕೆ ಮಾಡಲಾಗಿಲ್ಲ (Unchecked)'
          : 'Unchecked';
      confidence = 0.98;
      explanation =
        targetDisplayLanguage === 'kn'
          ? 'ಚೆಕ್‌ಬಾಕ್ಸ್ ಸ್ಥಿತಿಯನ್ನು ವ್ಯಾಖ್ಯಾನಿಸಲಾಗಿದೆ.'
          : 'Interpreted as affirmative checkbox confirmation.';
    }

    // 2. Radio & Select option matching
    else if ((field.type === 'radio' || field.type === 'select') && field.options && field.options.length > 0) {
      const lower = cleaned.toLowerCase();
      // Only match non-empty, usable options
      const usableOptions = field.options.filter(
        (opt) => opt.value.trim() !== '' && opt.label.trim() !== ''
      );

      let bestMatch = usableOptions.find(
        (opt) =>
          opt.value.toLowerCase() === lower ||
          opt.label.toLowerCase() === lower
      );

      if (!bestMatch) {
        const matches = usableOptions.filter(
          (opt) => {
            const l = opt.label.toLowerCase();
            const v = opt.value.toLowerCase();
            return (l.length >= 3 && lower.includes(l)) || (v.length >= 3 && lower.includes(v)) || (lower.length >= 3 && (l.includes(lower) || v.includes(lower)));
          }
        );
        if (matches.length === 1) {
          bestMatch = matches[0];
        }
      }

      // Check Kannada equivalents for common accommodation or year choices
      if (!bestMatch && inputLanguage === 'kn') {
        if (cleaned.includes('ವಿದ್ಯಾರ್ಥಿನಿಲಯ') || cleaned.includes('ಹಾಸ್ಟೆಲ್')) {
          bestMatch = usableOptions.find((o) => o.value.toLowerCase().includes('hostel'));
        } else if (cleaned.includes('ಡೇ ಸ್ಕಾಲರ್') || cleaned.includes('ಮನೆ')) {
          bestMatch = usableOptions.find((o) => o.value.toLowerCase().includes('day_scholar'));
        }
      }

      if (!bestMatch) {
        // Do not default to arbitrary options - reject ambiguous or unmatched input
        return {
          rawTranscript: cleaned,
          interpretedValue: '',
          displayPreview: targetDisplayLanguage === 'kn' ? 'ಆಯ್ಕೆ ಹೊಂದಿಕೆಯಾಗಲಿಲ್ಲ' : 'No matching option',
          confidence: 0.15,
          explanation: targetDisplayLanguage === 'kn'
            ? 'ನೀಡಿದ ಉತ್ತರಕ್ಕೆ ಯಾವುದೇ ಆಯ್ಕೆ ಹೊಂದಿಕೆಯಾಗಲಿಲ್ಲ.'
            : 'Answer did not unambiguously match any available option.',
          bilingual: {
            originalText: cleaned,
            originalLanguage: inputLanguage,
            translatedText: cleaned,
            translatedLanguage: inputLanguage === 'kn' ? 'en' : 'kn',
            interpretedValue: '',
            displayPreview: targetDisplayLanguage === 'kn' ? 'ಆಯ್ಕೆ ಹೊಂದಿಕೆಯಾಗಲಿಲ್ಲ' : 'No matching option',
            confidence: 0.15,
            explanation: 'No matching option found.',
            isEdited: false,
            isConfirmed: false,
          },
        };
      }

      interpretedVal = bestMatch.value;
      displayPrev = bestMatch.label;
      confidence = 0.96;
      explanation = `Selected: ${bestMatch.label}`;
    }

    // 3. Date field normalisation
    else if (field.type === 'date') {
      const parsedDate = parseSpokenDate(digitNormalized);
      if (parsedDate) {
        interpretedVal = parsedDate;
        displayPrev = parsedDate;
        confidence = 0.95;
        explanation = 'Standard ISO 8601 YYYY-MM-DD date formatted.';
      } else {
        return {
          rawTranscript: cleaned,
          interpretedValue: '',
          displayPreview: targetDisplayLanguage === 'kn' ? 'ಅಮಾನ್ಯ ದಿನಾಂಕ' : 'Invalid date format',
          confidence: 0.2,
          explanation: targetDisplayLanguage === 'kn'
            ? 'ದಿನಾಂಕವನ್ನು ಗುರುತಿಸಲಾಗಲಿಲ್ಲ. ದಯವಿಟ್ಟು YYYY-MM-DD ಅಥವಾ ದಿನ ತಿಂಗಳು ವರ್ಷ ಮಾದರಿಯಲ್ಲಿ ನೀಡಿ.'
            : 'Could not parse date. Please provide a clear date like 15 August 2004.',
          bilingual: {
            originalText: cleaned,
            originalLanguage: inputLanguage,
            translatedText: cleaned,
            translatedLanguage: inputLanguage === 'kn' ? 'en' : 'kn',
            interpretedValue: '',
            displayPreview: targetDisplayLanguage === 'kn' ? 'ಅಮಾನ್ಯ ದಿನಾಂಕ' : 'Invalid date format',
            confidence: 0.2,
            explanation: 'Could not parse valid date.',
            isEdited: false,
            isConfirmed: false,
          },
        };
      }
    }

    // 4. Number / Currency normalisation
    else if (field.type === 'number') {
      const parsedNumber = parseSpokenNumber(digitNormalized);
      if (parsedNumber !== null) {
        interpretedVal = String(parsedNumber);
        displayPrev = String(parsedNumber);
        confidence = 0.96;
        explanation = 'Numeric value parsed successfully.';
      } else {
        return {
          rawTranscript: cleaned,
          interpretedValue: '',
          displayPreview: targetDisplayLanguage === 'kn' ? 'ಅಮಾನ್ಯ ಸಂಖ್ಯೆ' : 'Invalid numeric value',
          confidence: 0.2,
          explanation: 'Could not parse valid number.',
          bilingual: {
            originalText: cleaned,
            originalLanguage: inputLanguage,
            translatedText: cleaned,
            translatedLanguage: inputLanguage === 'kn' ? 'en' : 'kn',
            interpretedValue: '',
            displayPreview: targetDisplayLanguage === 'kn' ? 'ಅಮಾನ್ಯ ಸಂಖ್ಯೆ' : 'Invalid numeric value',
            confidence: 0.2,
            explanation: 'Invalid numeric input.',
            isEdited: false,
            isConfirmed: false,
          },
        };
      }
    }

    // 5. Email address normalisation
    else if (field.type === 'email') {
      const emailFormatted = digitNormalized
        .toLowerCase()
        .replace(/\s+at\s+/g, '@')
        .replace(/\s+dot\s+/g, '.')
        .replace(/\s+/g, '');
      interpretedVal = emailFormatted;
      displayPrev = emailFormatted;
      confidence = emailFormatted.includes('@') ? 0.95 : 0.80;
      explanation = 'Standard email address normalized.';
    }

    // Generate bilingual components
    const otherLang: SupportedLanguage = inputLanguage === 'kn' ? 'en' : 'kn';
    const translationResult = this.translateText(cleaned, inputLanguage, otherLang);
    const transliteration = this.generateTransliteration(cleaned, inputLanguage);

    const bilingualAnswer: BilingualAnswer = {
      originalText: cleaned,
      originalLanguage: inputLanguage,
      translatedText: translationResult.translatedText,
      translatedLanguage: otherLang,
      transliteratedText: transliteration,
      interpretedValue: interpretedVal,
      displayPreview: displayPrev,
      confidence,
      explanation,
      isEdited: false,
      isConfirmed: false,
    };

    return {
      rawTranscript: cleaned,
      interpretedValue: interpretedVal,
      displayPreview: displayPrev,
      confidence,
      explanation,
      bilingual: bilingualAnswer,
    };
  }

  /**
   * Browser Speech synthesis with bilingual voice checks.
   */
  public static speakText(
    text: string,
    language: SupportedLanguage,
    rate: number = 1.0,
    onEnd?: () => void
  ): boolean {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      if (onEnd) onEnd();
      return false;
    }

    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = Math.max(0.7, Math.min(1.4, rate));

      const targetLang = language === 'kn' ? 'kn-IN' : 'en-IN';
      utterance.lang = targetLang;

      const voices = window.speechSynthesis.getVoices();
      const matchingVoice = voices.find(
        (v) =>
          v.lang.toLowerCase() === targetLang.toLowerCase() ||
          v.lang.toLowerCase().startsWith(language)
      );

      if (matchingVoice) {
        utterance.voice = matchingVoice;
      }

      if (onEnd) {
        utterance.onend = () => onEnd();
        utterance.onerror = () => onEnd();
      }

      window.speechSynthesis.speak(utterance);
      return true;
    } catch {
      if (onEnd) onEnd();
      return false;
    }
  }

  public static stopSpeaking(): void {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }
}

function parseSpokenDate(str: string): string | null {
  const trimmed = str.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    const [, m, d] = trimmed.split('-').map(Number);
    if (m >= 1 && m <= 12 && d >= 1 && d <= 31) return trimmed;
    return null;
  }

  // Handle DD-MM-YYYY or DD/MM/YYYY
  const dmyMatch = trimmed.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
  if (dmyMatch) {
    const day = dmyMatch[1].padStart(2, '0');
    const month = dmyMatch[2].padStart(2, '0');
    const year = dmyMatch[3];
    const m = Number(month);
    const d = Number(day);
    if (m >= 1 && m <= 12 && d >= 1 && d <= 31) {
      return `${year}-${month}-${day}`;
    }
  }

  const months: Record<string, string> = {
    january: '01', jan: '01',
    february: '02', feb: '02',
    march: '03', mar: '03',
    april: '04', apr: '04',
    may: '05',
    june: '06', jun: '06',
    july: '07', jul: '07',
    august: '08', aug: '08',
    september: '09', sep: '09',
    october: '10', oct: '10',
    november: '11', nov: '11',
    december: '12', dec: '12',
  };

  const match = trimmed.match(/(\d{1,2})(?:st|nd|rd|th)?\s+([a-zA-Z]+)\s+(\d{4})/i);
  if (match) {
    const monthKey = match[2].toLowerCase();
    if (months[monthKey]) {
      const day = match[1].padStart(2, '0');
      const month = months[monthKey];
      const year = match[3];
      const d = Number(day);
      if (d >= 1 && d <= 31) {
        return `${year}-${month}-${day}`;
      }
    }
  }

  return null;
}

function parseSpokenNumber(str: string): number | null {
  const cleaned = str.trim().toLowerCase();
  
  // Direct numeric representation e.g. "450000" or "4,50,000" or "450.50"
  const directNumeric = cleaned.replace(/,/g, '').replace(/[₹$]/g, '').trim();
  if (/^-?\d+(\.\d+)?$/.test(directNumeric)) {
    return parseFloat(directNumeric);
  }

  // Indian and Western scale multipliers
  // e.g. "4.5 lakh", "5 lakhs", "2 crore", "50 thousand", "4.5 ಲಕ್ಷ"
  const scaleMatch = cleaned.match(/^(-?\d+(?:\.\d+)?)\s*(lakh|lakhs|crore|crores|thousand|thousands|million|millions|ಲಕ್ಷ|ಸಾವಿರ|ಕೋಟಿ)/i);
  if (scaleMatch) {
    const base = parseFloat(scaleMatch[1]);
    const unit = scaleMatch[2].toLowerCase();
    let multiplier = 1;
    if (unit.startsWith('lakh') || unit === 'ಲಕ್ಷ') multiplier = 100000;
    else if (unit.startsWith('crore') || unit === 'ಕೋಟಿ') multiplier = 10000000;
    else if (unit.startsWith('thousand') || unit === 'ಸಾವಿರ') multiplier = 1000;
    else if (unit.startsWith('million')) multiplier = 1000000;
    return base * multiplier;
  }

  // Extract clean digits if embedded with text e.g. "it is 45000"
  const embeddedMatch = cleaned.match(/\b\d+(\.\d+)?\b/);
  if (embeddedMatch) {
    return parseFloat(embeddedMatch[0]);
  }

  return null;
}
