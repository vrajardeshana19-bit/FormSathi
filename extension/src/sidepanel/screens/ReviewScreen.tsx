import React from 'react';
import {
  CheckCircle2,
  Clock,
  AlertCircle,
  Edit2,
  ArrowRight,
  ShieldAlert,
  FileCheck2,
} from 'lucide-react';
import { FormField, SupportedLanguage } from '../../shared/types';
import { getTranslation } from '../../shared/i18n';

interface ReviewScreenProps {
  fields: FormField[];
  onRevisitField: (fieldId: string) => void;
  formTitle: string;
  language: SupportedLanguage;
}

export const ReviewScreen: React.FC<ReviewScreenProps> = ({
  fields,
  onRevisitField,
  formTitle,
  language,
}) => {
  const t = getTranslation(language);

  const completedFields = fields.filter((f) => f.status === 'completed');
  const skippedFields = fields.filter((f) => f.status === 'skipped');
  const manualFields = fields.filter((f) => f.isSensitive || f.status === 'manual_required');

  return (
    <div className="flex flex-col min-h-[calc(100vh-100px)] p-3.5 space-y-3.5 select-none">
      {/* Editorial Overview Header */}
      <div className="bg-paper-card p-3.5 rounded-[14px_4px_14px_4px] border border-line-border shadow-fine space-y-2.5">
        <div className="flex items-center gap-1.5 text-teal-brand">
          <FileCheck2 className="w-4 h-4" />
          <h2 className="font-bold text-xs uppercase tracking-wider">{t.review.title}</h2>
        </div>

        <p className="text-[12.5px] font-bold text-ink-deep leading-snug">
          {formTitle}
        </p>

        {/* Structured Segmented Metrics */}
        <div className="grid grid-cols-3 gap-2 pt-0.5">
          <div className="bg-sage-subtle border border-sage-soft p-2 rounded-lg text-center">
            <span className="text-[15px] font-bold text-teal-brand block leading-tight">{completedFields.length}</span>
            <span className="text-[10px] text-ink-muted font-medium">{t.review.completed}</span>
          </div>
          <div className="bg-ochre-light border border-ochre-pale p-2 rounded-lg text-center">
            <span className="text-[15px] font-bold text-ochre-warm block leading-tight">{skippedFields.length}</span>
            <span className="text-[10px] text-ink-muted font-medium">{t.review.skipped}</span>
          </div>
          <div className="bg-paper-ivory border border-line-border p-2 rounded-lg text-center">
            <span className="text-[15px] font-bold text-ink-deep block leading-tight">{manualFields.length}</span>
            <span className="text-[10px] text-ink-muted font-medium">{t.review.manualEntry}</span>
          </div>
        </div>
      </div>

      {/* Mandatory Manual Submission Guard Banner */}
      <div className="p-3 bg-ochre-light/90 border border-ochre-pale rounded-lg space-y-1">
        <div className="flex items-start gap-2">
          <ShieldAlert className="w-4 h-4 text-ochre-warm mt-0.5 shrink-0" />
          <div>
            <h4 className="text-[11.5px] font-bold text-ink-deep">
              {t.review.manualSubmitTitle}
            </h4>
            <p className="text-[10.5px] text-ink-muted mt-0.5 leading-relaxed">
              {t.review.manualSubmitDesc}
            </p>
          </div>
        </div>
      </div>

      {/* 1. Sensitive Fields Requiring Manual Entry */}
      {manualFields.length > 0 && (
        <section className="space-y-1.5">
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-ink-deep">
            <AlertCircle className="w-3.5 h-3.5 text-ochre-warm" />
            <span>{t.review.sensitiveSectionTitle(manualFields.length)}</span>
          </div>
          <div className="space-y-1.5">
            {manualFields.map((field) => (
              <div
                key={field.id}
                className="bg-paper-card p-2.5 rounded-lg border border-line-border flex items-center justify-between text-xs shadow-fine"
              >
                <div className="min-w-0 pr-2">
                  <div className="font-semibold text-ink-deep text-[11.5px] truncate">{field.label}</div>
                  <div className="text-[10.5px] text-ochre-warm font-medium">
                    {t.review.manualNotice}
                  </div>
                </div>
                <span className="text-[9.5px] font-bold bg-ochre-light text-ochre-warm px-2 py-0.5 rounded border border-ochre-pale shrink-0">
                  {t.review.manualTag}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 2. Skipped Questions */}
      {skippedFields.length > 0 && (
        <section className="space-y-1.5">
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-ink-deep">
            <Clock className="w-3.5 h-3.5 text-ink-muted" />
            <span>{t.review.skippedSectionTitle(skippedFields.length)}</span>
          </div>
          <div className="space-y-1.5">
            {skippedFields.map((field) => (
              <div
                key={field.id}
                className="bg-paper-card p-2.5 rounded-lg border border-line-border flex items-center justify-between text-xs shadow-fine"
              >
                <div className="min-w-0 pr-2">
                  <div className="font-semibold text-ink-deep text-[11.5px] truncate">{field.label}</div>
                  <div className="text-[10.5px] text-ink-muted">{t.review.notFilledYet}</div>
                </div>
                <button
                  onClick={() => onRevisitField(field.id)}
                  className="flex items-center gap-1 text-[10.5px] font-bold text-teal-brand bg-sage-subtle border border-sage-soft px-2.5 py-1 rounded-md shrink-0 transition-all hover:bg-sage-soft"
                >
                  <span>{t.review.answerNow}</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 3. Completed Fields */}
      <section className="space-y-1.5">
        <div className="flex items-center gap-1.5 text-[11px] font-bold text-ink-deep">
          <CheckCircle2 className="w-3.5 h-3.5 text-teal-brand" />
          <span>{t.review.completedSectionTitle(completedFields.length)}</span>
        </div>
        <div className="space-y-1.5">
          {completedFields.length === 0 ? (
            <p className="text-[11px] text-ink-muted italic p-3 bg-paper-card rounded-lg border border-line-border text-center">
              {t.review.noCompletedFields}
            </p>
          ) : (
            completedFields.map((field) => (
              <div
                key={field.id}
                className="bg-paper-card p-2.5 rounded-lg border border-line-border flex items-center justify-between text-xs shadow-fine"
              >
                <div className="min-w-0 pr-2">
                  <div className="font-semibold text-ink-deep text-[11.5px] truncate">{field.label}</div>
                  <div className="text-[10.5px] text-teal-brand font-semibold truncate mt-0.5">
                    {field.value || t.review.filledTag}
                  </div>
                </div>
                <button
                  onClick={() => onRevisitField(field.id)}
                  className="flex items-center gap-1 text-[10.5px] text-ink-muted hover:text-ink-deep bg-paper-ivory hover:bg-sage-subtle px-2 py-1 rounded border border-line-border shrink-0 transition-all"
                  title={t.review.edit}
                >
                  <Edit2 className="w-3 h-3" />
                  <span>{t.review.edit}</span>
                </button>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
};
