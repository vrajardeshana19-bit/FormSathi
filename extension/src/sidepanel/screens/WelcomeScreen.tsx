import React from 'react';
import { ArrowRight, ShieldCheck, Lock, CheckCircle2, FileText, Settings, Sparkles } from 'lucide-react';
import { SupportedLanguage } from '../../shared/types';
import { getTranslation } from '../../shared/i18n';
import { FormSaathiLogo, FormAssistIllustration, CurvedHeroBoundary } from '../components/OrganicSurfaces';
import { LanguageSegment } from '../components/LanguageSegment';

interface WelcomeScreenProps {
  onStart: () => void;
  selectedLanguage: SupportedLanguage;
  onLanguageChange: (lang: SupportedLanguage) => void;
  onOpenSettings?: () => void;
  formDetected: boolean;
  formTitle?: string;
  fieldCount?: number;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({
  onStart,
  selectedLanguage,
  onLanguageChange,
  onOpenSettings,
  formDetected,
  formTitle,
  fieldCount = 7,
}) => {
  const t = getTranslation(selectedLanguage);

  return (
    <div className="flex flex-col min-h-screen bg-paper-ivory text-ink-deep select-none">
      {/* A. Editorial Top Header */}
      <header className="bg-teal-brand text-white px-4 pt-3.5 pb-2 flex items-center justify-between border-b border-teal-hover/40">
        <div className="flex items-center gap-2">
          <FormSaathiLogo size={24} />
          <div>
            <span className="font-bold text-[14px] tracking-tight leading-none text-white block">
              {t.brand.name}
            </span>
            <span className="text-[9.5px] text-sage-soft font-normal tracking-wide">
              {t.brand.voiceAssistantBadge}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Compact Language Selector */}
          <LanguageSegment
            selectedLanguage={selectedLanguage}
            onChange={onLanguageChange}
            size="sm"
            className="bg-teal-hover/90 border-teal-brand text-white"
          />

          {onOpenSettings && (
            <button
              onClick={onOpenSettings}
              className="p-1 rounded text-sage-soft hover:text-white hover:bg-teal-hover transition-colors"
              title={t.nav.settings}
            >
              <Settings className="w-4 h-4" />
            </button>
          )}
        </div>
      </header>

      {/* B. Organic Hero Section */}
      <section className="bg-teal-brand text-white pt-3 pb-1 px-4 relative">
        <div className="max-w-[360px] mx-auto space-y-2.5">
          {/* Eyebrow Pill */}
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-teal-hover text-sage-soft text-[10.5px] font-medium border border-teal-brand">
            <Sparkles className="w-3 h-3 text-ochre-warm" />
            <span>Voice-guided form assistance</span>
          </div>

          {/* Editorial Display Heading */}
          <h1 className="text-[19px] sm:text-[21px] font-bold tracking-tight leading-[1.25] text-white">
            {t.welcome.title}
          </h1>

          <p className="text-[12px] text-sage-soft/90 leading-relaxed max-w-[330px]">
            {t.welcome.subtitle}
          </p>

          {/* Bespoke Editorial Artwork representing Form Guidance */}
          <div className="pt-1 pb-0.5">
            <FormAssistIllustration />
          </div>
        </div>
      </section>

      {/* Sculptural Organic Curve Transition */}
      <CurvedHeroBoundary className="-mb-1 z-10" />

      {/* C. Application Information Surface (Layered over the curve) */}
      <main className="flex-1 px-3.5 -mt-3.5 z-20 space-y-3 pb-4">
        {/* Overlapping Status Card */}
        <div className="bg-paper-card rounded-[14px_6px_14px_6px] border border-line-border p-3.5 shadow-surface space-y-1.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-teal-brand text-[10.5px] font-bold uppercase tracking-wider">
              <FileText className="w-3.5 h-3.5" />
              <span>{formDetected ? t.welcome.formDetected : t.welcome.readyToAssist}</span>
            </div>
            {fieldCount > 0 && (
              <span className="text-[10px] font-semibold text-teal-brand bg-sage-subtle border border-sage-soft px-2 py-0.5 rounded-full">
                {fieldCount} Fields
              </span>
            )}
          </div>

          <h2 className="text-[13px] font-bold text-ink-deep leading-snug">
            {formTitle || 'National Merit Scholarship Application 2026-27'}
          </h2>

          <p className="text-[11px] text-ink-muted leading-relaxed">
            {t.welcome.fieldsCountText(fieldCount)}
          </p>
        </div>

        {/* D. Language Preference Row */}
        <div className="bg-paper-card/70 rounded-lg border border-line-border p-2.5 flex items-center justify-between shadow-fine">
          <div className="space-y-0.5">
            <span className="text-[11px] font-semibold text-ink-deep block">
              {t.welcome.languageHeading}
            </span>
            <span className="text-[10px] text-ink-muted block">
              {t.welcome.languageSubtitle}
            </span>
          </div>
          <LanguageSegment
            selectedLanguage={selectedLanguage}
            onChange={onLanguageChange}
            size="md"
          />
        </div>

        {/* E. Integrated Editorial Privacy Commitments */}
        <div className="bg-paper-card rounded-lg border border-line-border p-3 space-y-2 shadow-fine">
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-ink-deep">
            <ShieldCheck className="w-3.5 h-3.5 text-teal-brand" />
            <span>{t.welcome.privacyCardTitle}</span>
          </div>

          <div className="space-y-2 text-[10.5px] text-ink-muted divide-y divide-line-soft">
            <div className="flex items-start gap-2 pt-0.5">
              <Lock className="w-3 h-3 text-teal-brand mt-0.5 shrink-0" />
              <div className="leading-snug">
                <span className="font-semibold text-ink-deep">{t.welcome.privacyItem1Bold}</span>
                <span>{t.welcome.privacyItem1Text}</span>
              </div>
            </div>

            <div className="flex items-start gap-2 pt-1.5">
              <CheckCircle2 className="w-3 h-3 text-teal-brand mt-0.5 shrink-0" />
              <div className="leading-snug">
                <span className="font-semibold text-ink-deep">{t.welcome.privacyItem2Bold}</span>
                <span>{t.welcome.privacyItem2Text}</span>
              </div>
            </div>

            <div className="flex items-start gap-2 pt-1.5">
              <ShieldCheck className="w-3 h-3 text-teal-brand mt-0.5 shrink-0" />
              <div className="leading-snug">
                <span className="font-semibold text-ink-deep">{t.welcome.privacyItem3Bold}</span>
                <span>{t.welcome.privacyItem3Text}</span>
              </div>
            </div>
          </div>
        </div>

        {/* F. Primary Action */}
        <div className="pt-1 pb-1">
          <button
            onClick={onStart}
            className="w-full flex items-center justify-center gap-2 bg-teal-brand hover:bg-teal-hover active:scale-[0.99] text-white py-3 px-4 rounded-lg font-bold text-xs tracking-wide shadow-fine transition-all group"
          >
            <span>{t.welcome.startButton}</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>
      </main>
    </div>
  );
};
