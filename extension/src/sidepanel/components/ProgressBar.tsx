import React from 'react';
import { SupportedLanguage } from '../../shared/types';
import { getTranslation } from '../../shared/i18n';

interface ProgressBarProps {
  currentIndex: number;
  totalFields: number;
  completedCount: number;
  skippedCount: number;
  language: SupportedLanguage;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  currentIndex,
  totalFields,
  completedCount,
  skippedCount,
  language,
}) => {
  if (totalFields === 0) return null;

  const t = getTranslation(language);
  const percentComplete = Math.round((completedCount / totalFields) * 100);
  const remainingCount = totalFields - completedCount - skippedCount;

  return (
    <div className="w-full bg-paper-card p-3 rounded-lg border border-line-border shadow-fine">
      <div className="flex items-center justify-between text-xs mb-1.5">
        <span className="font-semibold text-ink-deep text-[11.5px]">
          {t.progress.questionCount(Math.min(currentIndex + 1, totalFields), totalFields)}
        </span>
        <span className="font-medium text-teal-brand bg-sage-subtle border border-sage-soft px-2 py-0.5 rounded text-[10.5px]">
          {t.progress.percentCompleted(percentComplete)}
        </span>
      </div>

      {/* Progress Track */}
      <div className="w-full h-1.5 bg-line-soft rounded-full overflow-hidden flex">
        <div
          className="h-full bg-teal-brand transition-all duration-300 ease-out"
          style={{ width: `${(completedCount / totalFields) * 100}%` }}
        />
        <div
          className="h-full bg-ochre-warm transition-all duration-300 ease-out opacity-80"
          style={{ width: `${(skippedCount / totalFields) * 100}%` }}
        />
      </div>

      <div className="flex items-center justify-between mt-2 text-[10.5px] text-ink-muted">
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-teal-brand inline-block" />
          <span>{t.progress.filledCount(completedCount)}</span>
        </div>
        {skippedCount > 0 && (
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-ochre-warm inline-block" />
            <span>{t.progress.skippedCount(skippedCount)}</span>
          </div>
        )}
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-line-border inline-block" />
          <span>{t.progress.remainingCount(remainingCount)}</span>
        </div>
      </div>
    </div>
  );
};
