import React from 'react';
import { Sparkles, CheckCircle2, ShieldCheck, Settings } from 'lucide-react';
import { ActiveScreen, SupportedLanguage } from '../../shared/types';
import { getTranslation } from '../../shared/i18n';
import { FormSaathiLogo } from './OrganicSurfaces';
import { LanguageSegment } from './LanguageSegment';

interface HeaderProps {
  activeScreen: ActiveScreen;
  onNavigate: (screen: ActiveScreen) => void;
  formTitle?: string;
  completedCount: number;
  totalFields: number;
  language: SupportedLanguage;
  onToggleLanguage: (lang: SupportedLanguage) => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeScreen,
  onNavigate,
  formTitle,
  completedCount,
  totalFields,
  language,
  onToggleLanguage,
}) => {
  const t = getTranslation(language);

  return (
    <header className="sticky top-0 z-30 bg-paper-ivory/95 backdrop-blur-sm border-b border-line-border px-3.5 py-2.5">
      {/* Top Brand Bar */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2 min-w-0">
          <FormSaathiLogo size={24} />
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <h1 className="font-bold text-[13.5px] tracking-tight text-ink-deep leading-none">
                {t.brand.name}
              </h1>
              <span className="text-[9.5px] font-semibold text-sage-secondary bg-sage-soft/60 px-1.5 py-0.5 rounded-[4px] border border-sage-soft">
                {t.brand.voiceAssistantBadge}
              </span>
            </div>
            {formTitle && (
              <p className="text-[10px] text-ink-muted truncate max-w-[170px] mt-0.5 font-normal">
                {formTitle}
              </p>
            )}
          </div>
        </div>

        {/* Right Tools: Language Segment & Progress Counter */}
        <div className="flex items-center gap-1.5 shrink-0">
          <LanguageSegment
            selectedLanguage={language}
            onChange={onToggleLanguage}
            size="sm"
          />

          {totalFields > 0 && (
            <div className="text-[10.5px] font-semibold bg-paper-card border border-line-border px-2 py-0.5 rounded-full text-ink-deep shadow-fine">
              <span className="text-teal-brand">{completedCount}</span>
              <span className="text-ink-subtle mx-0.5">/</span>
              <span>{totalFields}</span>
            </div>
          )}
        </div>
      </div>

      {/* Navigation Pills */}
      <nav className="flex items-center gap-1 bg-paper-card/90 p-0.5 rounded-lg border border-line-border">
        <button
          onClick={() => onNavigate('assistant')}
          className={`flex-1 flex items-center justify-center gap-1 py-1 text-[11px] font-medium rounded-md transition-all ${
            activeScreen === 'assistant'
              ? 'bg-teal-brand text-white shadow-fine'
              : 'text-ink-body hover:text-ink-deep hover:bg-sage-subtle'
          }`}
          title={t.nav.assistant}
        >
          <Sparkles className="w-3 h-3" />
          <span>{t.nav.assistant}</span>
        </button>

        <button
          onClick={() => onNavigate('review')}
          className={`flex-1 flex items-center justify-center gap-1 py-1 text-[11px] font-medium rounded-md transition-all ${
            activeScreen === 'review'
              ? 'bg-teal-brand text-white shadow-fine'
              : 'text-ink-body hover:text-ink-deep hover:bg-sage-subtle'
          }`}
          title={t.nav.review}
        >
          <CheckCircle2 className="w-3 h-3" />
          <span>{t.nav.review}</span>
        </button>

        <button
          onClick={() => onNavigate('privacy')}
          className={`flex-1 flex items-center justify-center gap-1 py-1 text-[11px] font-medium rounded-md transition-all ${
            activeScreen === 'privacy'
              ? 'bg-teal-brand text-white shadow-fine'
              : 'text-ink-body hover:text-ink-deep hover:bg-sage-subtle'
          }`}
          title={t.nav.privacy}
        >
          <ShieldCheck className="w-3 h-3" />
          <span>{t.nav.privacy}</span>
        </button>

        <button
          onClick={() => onNavigate('settings')}
          className={`p-1 text-[11px] font-medium rounded-md transition-all ${
            activeScreen === 'settings'
              ? 'bg-teal-brand text-white shadow-fine'
              : 'text-ink-body hover:text-ink-deep hover:bg-sage-subtle'
          }`}
          title={t.nav.settings}
        >
          <Settings className="w-3.5 h-3.5" />
        </button>
      </nav>
    </header>
  );
};
