import React from 'react';
import { ShieldCheck, Lock, EyeOff, FileText, AlertTriangle } from 'lucide-react';
import { FormField, SupportedLanguage } from '../../shared/types';
import { getTranslation } from '../../shared/i18n';

interface PrivacyCenterScreenProps {
  fields: FormField[];
  language: SupportedLanguage;
}

export const PrivacyCenterScreen: React.FC<PrivacyCenterScreenProps> = ({ fields, language }) => {
  const t = getTranslation(language);
  const sensitiveFields = fields.filter((f) => f.isSensitive);

  return (
    <div className="flex flex-col min-h-[calc(100vh-100px)] p-3.5 space-y-3.5 select-none">
      {/* Privacy Guarantee Editorial Hero Banner */}
      <div className="bg-sage-subtle p-3.5 rounded-[14px_4px_14px_4px] border border-sage-soft space-y-1.5 shadow-fine">
        <div className="flex items-center gap-1.5 text-teal-brand">
          <ShieldCheck className="w-4 h-4" />
          <h2 className="font-bold text-xs uppercase tracking-wider">{t.privacy.title}</h2>
        </div>
        <p className="text-[11.5px] text-ink-body leading-relaxed">
          {t.privacy.subtitle}
        </p>
      </div>

      {/* Core Architectural Commitments (Structured Section) */}
      <section className="space-y-2">
        <h3 className="text-[10.5px] font-bold text-ink-deep uppercase tracking-wider">
          {t.privacy.commitmentsTitle}
        </h3>

        <div className="bg-paper-card rounded-lg border border-line-border divide-y divide-line-soft shadow-fine">
          {/* Commitment 1 */}
          <div className="p-3 space-y-1">
            <div className="flex items-center gap-2 text-[11.5px] font-bold text-ink-deep">
              <Lock className="w-3.5 h-3.5 text-teal-brand shrink-0" />
              <span>{t.privacy.exclusionTitle}</span>
            </div>
            <p className="text-[11px] text-ink-muted leading-relaxed pl-5">
              {t.privacy.exclusionDesc}
            </p>
          </div>

          {/* Commitment 2 */}
          <div className="p-3 space-y-1">
            <div className="flex items-center gap-2 text-[11.5px] font-bold text-ink-deep">
              <EyeOff className="w-3.5 h-3.5 text-teal-brand shrink-0" />
              <span>{t.privacy.noSubmitTitle}</span>
            </div>
            <p className="text-[11px] text-ink-muted leading-relaxed pl-5">
              {t.privacy.noSubmitDesc}
            </p>
          </div>

          {/* Commitment 3 */}
          <div className="p-3 space-y-1">
            <div className="flex items-center gap-2 text-[11.5px] font-bold text-ink-deep">
              <FileText className="w-3.5 h-3.5 text-teal-brand shrink-0" />
              <span>{t.privacy.confirmTitle}</span>
            </div>
            <p className="text-[11px] text-ink-muted leading-relaxed pl-5">
              {t.privacy.confirmDesc}
            </p>
          </div>
        </div>
      </section>

      {/* Sensitive Fields in Current Form */}
      <section className="space-y-2 pt-0.5">
        <div className="flex items-center justify-between text-[11px] font-bold text-ink-deep">
          <span>{t.privacy.currentFormTitle}</span>
          <span className="font-semibold text-teal-brand bg-sage-subtle border border-sage-soft px-2 py-0.5 rounded-full text-[10px]">
            {t.privacy.detectedCount(sensitiveFields.length)}
          </span>
        </div>

        {sensitiveFields.length === 0 ? (
          <div className="p-3 bg-paper-card rounded-lg border border-line-border text-center text-[11px] text-ink-muted shadow-fine">
            {t.privacy.noSensitiveDetected}
          </div>
        ) : (
          <div className="space-y-2">
            {sensitiveFields.map((field) => (
              <div
                key={field.id}
                className="bg-ochre-light p-3 rounded-lg border border-ochre-pale flex items-start gap-2 shadow-fine"
              >
                <AlertTriangle className="w-4 h-4 text-ochre-warm mt-0.5 shrink-0" />
                <div className="flex-1 text-[11px]">
                  <div className="font-bold text-ink-deep">{field.label}</div>
                  <p className="text-[10.5px] text-ink-muted mt-0.5 leading-snug">
                    {t.privacy.excludedFromAiNotice}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};
