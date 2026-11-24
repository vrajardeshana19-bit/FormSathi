import { en } from './en';
import { kn } from './kn';
import { SupportedLanguage, TranslationSchema } from './types';

export * from './types';

export const translations: Record<SupportedLanguage, TranslationSchema> = {
  en,
  kn,
};

export function getTranslation(lang: SupportedLanguage): TranslationSchema {
  return translations[lang] || translations.en;
}

export const SUPPORTED_LANGUAGES: {
  code: SupportedLanguage;
  label: string;
  native: string;
  ttsLocale: string;
  sttLocale: string;
}[] = [
  {
    code: 'en',
    label: 'English',
    native: 'English',
    ttsLocale: 'en-IN',
    sttLocale: 'en-IN',
  },
  {
    code: 'kn',
    label: 'Kannada',
    native: 'ಕನ್ನಡ',
    ttsLocale: 'kn-IN',
    sttLocale: 'kn-IN',
  },
];
