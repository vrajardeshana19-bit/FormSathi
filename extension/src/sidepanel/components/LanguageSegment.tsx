import React from 'react';
import { SupportedLanguage } from '../../shared/types';
import { SUPPORTED_LANGUAGES } from '../../shared/i18n';

interface LanguageSegmentProps {
  selectedLanguage: SupportedLanguage;
  onChange: (lang: SupportedLanguage) => void;
  className?: string;
  size?: 'sm' | 'md';
}

export const LanguageSegment: React.FC<LanguageSegmentProps> = ({
  selectedLanguage,
  onChange,
  className = '',
  size = 'md',
}) => {
  const isSmall = size === 'sm';

  return (
    <div
      role="radiogroup"
      aria-label="Language selection"
      className={`inline-flex items-center bg-paper-card border border-line-border p-1 rounded-full shadow-fine ${className}`}
    >
      {SUPPORTED_LANGUAGES.map((lang) => {
        const isSelected = selectedLanguage === lang.code;
        return (
          <button
            key={lang.code}
            type="button"
            role="radio"
            aria-checked={isSelected}
            onClick={() => onChange(lang.code)}
            className={`relative flex items-center justify-center font-medium transition-all duration-200 rounded-full select-none ${
              isSmall
                ? 'px-2.5 py-0.5 text-[11px]'
                : 'px-4 py-1.5 text-xs'
            } ${
              isSelected
                ? 'bg-teal-brand text-white font-semibold shadow-fine'
                : 'text-ink-body hover:text-ink-deep hover:bg-sage-subtle'
            }`}
          >
            <span>{lang.native}</span>
            <span
              className={`ml-1.5 text-[10px] ${
                isSelected ? 'text-sage-soft opacity-85' : 'text-ink-muted'
              }`}
            >
              {lang.code === 'en' ? 'EN' : 'KN'}
            </span>
          </button>
        );
      })}
    </div>
  );
};
