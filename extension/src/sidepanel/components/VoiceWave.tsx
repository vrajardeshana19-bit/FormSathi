import React from 'react';

interface VoiceWaveProps {
  isListening: boolean;
  isSpeaking: boolean;
  statusLabel?: string;
}

export const VoiceWave: React.FC<VoiceWaveProps> = ({ isListening, isSpeaking, statusLabel }) => {
  return (
    <div className="flex flex-col items-center justify-center py-1">
      <div className="flex items-center gap-1 h-6">
        {[30, 60, 90, 50, 80, 40, 70].map((h, i) => {
          let heightClass = 'h-1.5';
          if (isListening) {
            heightClass = i % 2 === 0 ? 'h-4 animate-pulse' : 'h-6';
          } else if (isSpeaking) {
            heightClass = i % 3 === 0 ? 'h-3.5 animate-pulse' : 'h-5';
          }

          return (
            <span
              key={i}
              className={`w-1 rounded-full transition-all duration-200 ${
                isListening
                  ? 'bg-semantic-error'
                  : isSpeaking
                  ? 'bg-teal-brand'
                  : 'bg-sage-soft'
              } ${heightClass}`}
              style={{
                maxHeight: `${h}%`,
              }}
            />
          );
        })}
      </div>
      {statusLabel && (
        <span className="text-[10px] font-medium tracking-wide mt-1 text-ink-muted">
          {statusLabel}
        </span>
      )}
    </div>
  );
};
