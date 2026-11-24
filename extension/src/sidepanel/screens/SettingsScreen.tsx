import React from 'react';
import {
  Globe,
  Volume2,
  Eye,
  Database,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Activity,
} from 'lucide-react';
import { SupportedLanguage, UserSettings, VoiceCapabilities } from '../../shared/types';
import { getTranslation } from '../../shared/i18n';
import { LanguageSegment } from '../components/LanguageSegment';

interface SettingsScreenProps {
  settings: UserSettings;
  voiceCapabilities: VoiceCapabilities;
  onUpdateSettings: (newSettings: Partial<UserSettings>) => void;
  onResetSession: () => void;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({
  settings,
  voiceCapabilities,
  onUpdateSettings,
  onResetSession,
}) => {
  const t = getTranslation(settings.language);

  return (
    <div className="flex flex-col min-h-[calc(100vh-100px)] p-3.5 space-y-3.5 select-none">
      {/* 1. Language Preferences */}
      <section className="bg-paper-card p-3.5 rounded-[14px_4px_14px_4px] border border-line-border shadow-fine space-y-3">
        <div className="flex items-center gap-1.5 text-teal-brand">
          <Globe className="w-4 h-4" />
          <h3 className="font-bold text-[11px] uppercase tracking-wider">{t.settings.languageTitle}</h3>
        </div>

        <div className="space-y-2">
          <div>
            <label className="text-[10.5px] font-semibold text-ink-deep block mb-1">
              Interface Display Language
            </label>
            <LanguageSegment
              selectedLanguage={settings.language}
              onChange={(lang) => onUpdateSettings({ language: lang as SupportedLanguage })}
              size="md"
            />
          </div>

          <div className="pt-1 border-t border-line-soft">
            <label className="text-[10.5px] font-semibold text-ink-deep block mb-1">
              Speech Input Language (Recognition)
            </label>
            <LanguageSegment
              selectedLanguage={settings.speechLanguage || 'en'}
              onChange={(lang) => onUpdateSettings({ speechLanguage: lang as SupportedLanguage })}
              size="md"
            />
          </div>
        </div>
      </section>

      {/* 2. Browser Voice Diagnostics Card */}
      <section className="bg-paper-card p-3.5 rounded-lg border border-line-border shadow-fine space-y-2.5">
        <div className="flex items-center gap-1.5 text-teal-brand">
          <Activity className="w-4 h-4" />
          <h3 className="font-bold text-[11px] uppercase tracking-wider">
            {t.settings.voiceDiagnosticsTitle}
          </h3>
        </div>

        <div className="space-y-1.5 text-xs text-ink-body">
          <div className="flex items-center justify-between p-2 bg-paper-ivory rounded-md border border-line-soft">
            <span className="text-[11px] font-medium">{t.settings.ttsStatus}</span>
            <span className="flex items-center gap-1 font-bold text-[10.5px] text-teal-brand">
              <CheckCircle className="w-3.5 h-3.5" />
              <span>{voiceCapabilities.ttsSupported ? t.settings.supported : t.settings.unsupported}</span>
            </span>
          </div>

          <div className="flex items-center justify-between p-2 bg-paper-ivory rounded-md border border-line-soft">
            <span className="text-[11px] font-medium">{t.settings.sttStatus}</span>
            <span className="flex items-center gap-1 font-bold text-[10.5px] text-teal-brand">
              <CheckCircle className="w-3.5 h-3.5" />
              <span>{voiceCapabilities.sttSupported ? t.settings.supported : t.settings.unsupported}</span>
            </span>
          </div>
        </div>

        {settings.language === 'kn' && !voiceCapabilities.hasDedicatedVoice && (
          <div className="p-2.5 bg-ochre-light border border-ochre-pale rounded-md text-[10.5px] text-ink-body flex items-start gap-1.5">
            <AlertCircle className="w-3.5 h-3.5 text-ochre-warm mt-0.5 shrink-0" />
            <p className="leading-snug">{t.settings.kannadaVoiceWarning}</p>
          </div>
        )}
      </section>

      {/* 3. Voice & Speech Speed Controls */}
      <section className="bg-paper-card p-3.5 rounded-lg border border-line-border shadow-fine space-y-3">
        <div className="flex items-center gap-1.5 text-teal-brand">
          <Volume2 className="w-4 h-4" />
          <h3 className="font-bold text-[11px] uppercase tracking-wider">{t.settings.voiceTitle}</h3>
        </div>

        {/* Speech Speed Slider */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-[11px] font-medium text-ink-deep">
            <span>{t.settings.readingSpeed(settings.speechRate)}</span>
          </div>
          <input
            type="range"
            min="0.8"
            max="1.3"
            step="0.1"
            value={settings.speechRate}
            onChange={(e) => onUpdateSettings({ speechRate: parseFloat(e.target.value) })}
            className="w-full accent-teal-brand cursor-pointer h-1.5 bg-line-soft rounded"
          />
          <div className="flex justify-between text-[9.5px] text-ink-muted">
            <span>{t.settings.slower}</span>
            <span>{t.settings.normal}</span>
            <span>{t.settings.faster}</span>
          </div>
        </div>

        {/* Auto-play Audio Switch */}
        <label className="flex items-center justify-between text-xs pt-1 cursor-pointer">
          <div className="space-y-0.5 pr-2">
            <span className="font-semibold text-ink-deep text-[11.5px] block">{t.settings.autoPlay}</span>
            <span className="text-[10.5px] text-ink-muted block">
              {t.settings.autoPlayDesc}
            </span>
          </div>
          <input
            type="checkbox"
            checked={settings.autoPlayVoice}
            onChange={(e) => onUpdateSettings({ autoPlayVoice: e.target.checked })}
            className="w-4 h-4 accent-teal-brand rounded cursor-pointer"
          />
        </label>
      </section>

      {/* 4. Accessibility & Testing Preferences */}
      <section className="bg-paper-card p-3.5 rounded-lg border border-line-border shadow-fine space-y-2">
        <div className="flex items-center gap-1.5 text-teal-brand">
          <Eye className="w-4 h-4" />
          <h3 className="font-bold text-[11px] uppercase tracking-wider">{t.settings.accessibilityTitle}</h3>
        </div>

        <label className="flex items-center justify-between text-xs cursor-pointer">
          <div className="space-y-0.5 pr-2">
            <span className="font-semibold text-ink-deep text-[11.5px] block">{t.settings.highContrast}</span>
            <span className="text-[10.5px] text-ink-muted block">
              {t.settings.highContrastDesc}
            </span>
          </div>
          <input
            type="checkbox"
            checked={settings.highContrast}
            onChange={(e) => onUpdateSettings({ highContrast: e.target.checked })}
            className="w-4 h-4 accent-teal-brand rounded cursor-pointer"
          />
        </label>

        <label className="flex items-center justify-between text-xs cursor-pointer pt-2 border-t border-line-soft">
          <div className="space-y-0.5 pr-2">
            <span className="font-semibold text-ink-deep text-[11.5px] block">Simulated Voice Input (Demo Mode)</span>
            <span className="text-[10.5px] text-ink-muted block">
              Instantly simulates voice responses when microphone is blocked by Chrome sandbox permissions.
            </span>
          </div>
          <input
            type="checkbox"
            checked={settings.mockMode}
            onChange={(e) => onUpdateSettings({ mockMode: e.target.checked })}
            className="w-4 h-4 accent-teal-brand rounded cursor-pointer"
          />
        </label>
      </section>

      {/* 5. Session Reset */}
      <section className="bg-paper-card p-3.5 rounded-lg border border-line-border shadow-fine space-y-2">
        <div className="flex items-center gap-1.5 text-teal-brand">
          <Database className="w-4 h-4" />
          <h3 className="font-bold text-[11px] uppercase tracking-wider">{t.settings.sessionTitle}</h3>
        </div>

        <button
          onClick={onResetSession}
          className="w-full flex items-center justify-center gap-1.5 bg-paper-ivory hover:bg-sage-subtle text-ink-deep py-2.5 px-3 rounded-lg text-[11px] font-semibold border border-line-border transition-all"
        >
          <RefreshCw className="w-3.5 h-3.5 text-ink-muted" />
          <span>{t.settings.resetSession}</span>
        </button>
      </section>
    </div>
  );
};
