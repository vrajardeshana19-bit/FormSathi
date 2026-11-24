import { SupportedLanguage } from './i18n/types';

export type { SupportedLanguage };

export type FieldType =
  | 'text'
  | 'number'
  | 'select'
  | 'radio'
  | 'checkbox'
  | 'date'
  | 'email'
  | 'tel'
  | 'textarea'
  | 'password';

export type FieldStatus =
  | 'pending'
  | 'active'
  | 'completed'
  | 'skipped'
  | 'manual_required';

export interface FormField {
  id: string;
  name: string;
  label: string;
  type: FieldType;
  placeholder?: string;
  required: boolean;
  options?: { label: string; value: string }[];
  isSensitive: boolean;
  value: string;
  status: FieldStatus;
  selector: string;
  helpText?: string;
  plainQuestion: {
    en: string;
    kn: string;
  };
  contextNote: {
    en: string;
    kn: string;
  };
  exampleAnswer: string;
}

export interface FormMetadata {
  id: string;
  title: string;
  detectedAt: string;
  url: string;
  fields: FormField[];
}

export interface UserSettings {
  language: SupportedLanguage; // Interface language: 'en' | 'kn'
  speechLanguage: SupportedLanguage; // Speech recognition language: 'en' | 'kn'
  speechRate: number; // 0.8 to 1.3
  autoPlayVoice: boolean;
  highContrast: boolean;
  fontSize: 'compact' | 'normal' | 'large';
  mockMode: boolean;
}

export type ActiveScreen = 'welcome' | 'assistant' | 'review' | 'privacy' | 'settings';

export interface BilingualAnswer {
  originalText: string;
  originalLanguage: SupportedLanguage;
  translatedText?: string;
  translatedLanguage?: SupportedLanguage;
  transliteratedText?: string;
  interpretedValue: string;
  displayPreview: string;
  confidence: number;
  explanation: string;
  isEdited: boolean;
  isConfirmed: boolean;
}

export interface InterpretationResult {
  rawTranscript: string;
  interpretedValue: string;
  displayPreview: string;
  confidence: number;
  explanation: string;
  bilingual?: BilingualAnswer;
}

export interface VoiceCapabilities {
  ttsSupported: boolean;
  sttSupported: boolean;
  hasDedicatedVoice: boolean;
  voiceName?: string;
  message?: string;
}

export type PageConnectionStatus =
  | 'connecting'
  | 'connected'
  | 'no_form'
  | 'unsupported_page'
  | 'error';
