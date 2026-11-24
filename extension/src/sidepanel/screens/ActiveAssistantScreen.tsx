import React, { useState, useEffect } from 'react';
import {
  Volume2,
  VolumeX,
  Mic,
  MicOff,
  Check,
  SkipForward,
  RotateCcw,
  Keyboard,
  ShieldCheck,
  AlertTriangle,
  Sparkles,
  Info,
  RefreshCw,
  Edit2,
  Save,
  Languages,
} from 'lucide-react';
import {
  FormField,
  InterpretationResult,
  SupportedLanguage,
  VoiceCapabilities,
  BilingualAnswer,
} from '../../shared/types';
import { ProgressBar } from '../components/ProgressBar';
import { VoiceWave } from '../components/VoiceWave';
import { getTranslation } from '../../shared/i18n';
import { MockAiService } from '../../shared/mockAiService';

interface ActiveAssistantScreenProps {
  currentField: FormField;
  currentIndex: number;
  totalFields: number;
  completedCount: number;
  skippedCount: number;
  selectedLanguage: SupportedLanguage; // UI language
  speechLanguage: SupportedLanguage; // Dedicated voice input language
  onChangeSpeechLanguage: (lang: SupportedLanguage) => void;
  isListening: boolean;
  isSpeaking: boolean;
  liveTranscript?: string;
  voiceError?: string | null;
  voiceCapabilities: VoiceCapabilities;
  onToggleSpeechPlayback: () => void;
  onStartListening: () => void;
  onStopListening: () => void;
  onConfirmAndFill: (fieldId: string, value: string) => void;
  onSkipField: (fieldId: string) => void;
  onRepeatExplanation: () => void;
  onManualTextSubmit: (text: string) => void;
  onRescanPage?: () => void;
  activeInterpretation: InterpretationResult | null;
  onUpdateBilingualAnswer?: (updated: BilingualAnswer) => void;
  isInterpreting: boolean;
}

export const ActiveAssistantScreen: React.FC<ActiveAssistantScreenProps> = ({
  currentField,
  currentIndex,
  totalFields,
  completedCount,
  skippedCount,
  selectedLanguage,
  speechLanguage,
  onChangeSpeechLanguage,
  isListening,
  isSpeaking,
  liveTranscript,
  voiceError,
  voiceCapabilities,
  onToggleSpeechPlayback,
  onStartListening,
  onStopListening,
  onConfirmAndFill,
  onSkipField,
  onRepeatExplanation,
  onManualTextSubmit,
  onRescanPage,
  activeInterpretation,
  onUpdateBilingualAnswer,
  isInterpreting,
}) => {
  const [showTextInput, setShowTextInput] = useState(false);
  const [typedText, setTypedText] = useState('');
  
  // Bilingual preview tab: 'original' | 'translation' | 'transliteration' | 'final'
  const [activeTab, setActiveTab] = useState<'original' | 'translation' | 'transliteration' | 'final'>('original');
  const [isEditing, setIsEditing] = useState(false);
  const [editedText, setEditedText] = useState('');
  const [editedFinalValue, setEditedFinalValue] = useState('');
  const [isSpeakingAudio, setIsSpeakingAudio] = useState(false);

  const t = getTranslation(selectedLanguage);

  // Auto-switch to typed input if voice error occurs
  useEffect(() => {
    if (voiceError) {
      setShowTextInput(true);
    }
  }, [voiceError]);

  // Synchronize local edit buffers when activeInterpretation arrives
  useEffect(() => {
    if (activeInterpretation?.bilingual) {
      setEditedText(
        activeTab === 'original'
          ? activeInterpretation.bilingual.originalText
          : activeInterpretation.bilingual.translatedText || activeInterpretation.bilingual.originalText
      );
      setEditedFinalValue(activeInterpretation.interpretedValue);
      setIsEditing(false);
    }
  }, [activeInterpretation, activeTab]);

  const plainQuestionText =
    currentField.plainQuestion[selectedLanguage] || currentField.plainQuestion.en;
  const contextNoteText =
    currentField.contextNote[selectedLanguage] || currentField.contextNote.en;

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (typedText.trim()) {
      onManualTextSubmit(typedText.trim());
      setTypedText('');
    }
  };

  const handlePlayAudioSnippet = (text: string, lang: SupportedLanguage) => {
    if (isSpeakingAudio) {
      MockAiService.stopSpeaking();
      setIsSpeakingAudio(false);
    } else {
      setIsSpeakingAudio(true);
      MockAiService.speakText(text, lang, 1.0, () => {
        setIsSpeakingAudio(false);
      });
    }
  };

  const handleSaveEdit = () => {
    if (!activeInterpretation?.bilingual) return;
    const current = activeInterpretation.bilingual;
    let updated: BilingualAnswer;

    if (activeTab === 'original') {
      // Re-translate based on edited original
      const otherLang = current.originalLanguage === 'kn' ? 'en' : 'kn';
      const retrans = MockAiService.translateText(editedText, current.originalLanguage, otherLang);
      const translit = MockAiService.generateTransliteration(editedText, current.originalLanguage);
      updated = {
        ...current,
        originalText: editedText,
        translatedText: retrans.translatedText,
        transliteratedText: translit,
        interpretedValue: editedFinalValue || editedText,
        displayPreview: editedFinalValue || editedText,
        isEdited: true,
      };
    } else if (activeTab === 'translation') {
      updated = {
        ...current,
        translatedText: editedText,
        interpretedValue: editedFinalValue || editedText,
        displayPreview: editedFinalValue || editedText,
        isEdited: true,
      };
    } else {
      updated = {
        ...current,
        interpretedValue: editedFinalValue,
        displayPreview: editedFinalValue,
        isEdited: true,
      };
    }

    if (onUpdateBilingualAnswer) {
      onUpdateBilingualAnswer(updated);
    }
    setIsEditing(false);
  };

  const bilingual = activeInterpretation?.bilingual;

  return (
    <div className="flex flex-col min-h-[calc(100vh-100px)] p-3.5 space-y-3.5 select-none">
      {/* 1. Elegant Progress Track & Rescan trigger */}
      <div className="space-y-1.5">
        <ProgressBar
          currentIndex={currentIndex}
          totalFields={totalFields}
          completedCount={completedCount}
          skippedCount={skippedCount}
          language={selectedLanguage}
        />
        {onRescanPage && (
          <div className="flex justify-end pr-1">
            <button
              onClick={onRescanPage}
              className="text-[10px] text-ink-muted hover:text-teal-brand flex items-center gap-1 font-medium transition-colors"
              title="Rescan current webpage for fields"
            >
              <RefreshCw className="w-2.5 h-2.5" />
              <span>Rescan webpage</span>
            </button>
          </div>
        )}
      </div>

      {/* 2. Sensitive Field Protective Notice */}
      {currentField.isSensitive ? (
        <div className="p-3.5 bg-ochre-light border border-ochre-pale rounded-[14px_4px_14px_4px] space-y-2 shadow-fine">
          <div className="flex items-start gap-2 text-ochre-warm">
            <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
            <div>
              <h3 className="font-bold text-xs tracking-tight text-ink-deep">
                {t.assistant.sensitiveWarningTitle}
              </h3>
              <p className="text-[11.5px] text-ink-body mt-0.5 leading-snug">
                {t.assistant.sensitiveWarningDesc(currentField.label)}
              </p>
            </div>
          </div>
          <div className="bg-paper-card p-2.5 rounded border border-line-border text-xs space-y-0.5">
            <p className="font-semibold text-teal-brand text-[11px]">{t.assistant.privacyShieldTitle}</p>
            <p className="text-[11px] text-ink-muted leading-relaxed">
              {t.assistant.privacyShieldDesc}
            </p>
          </div>
          <div className="pt-1">
            <button
              onClick={() => onSkipField(currentField.id)}
              className="w-full py-2.5 px-3 bg-ochre-warm hover:bg-ochre-warm/90 text-white text-xs font-semibold rounded-lg shadow-fine transition-all"
            >
              {t.assistant.manualNextButton}
            </button>
          </div>
        </div>
      ) : (
        /* 3. Primary Visual Focus: Question Area with Organic Layered Surface */
        <section className="relative bg-paper-card rounded-[16px_5px_16px_5px] border border-line-border p-4 shadow-fine space-y-3 overflow-hidden">
          <div
            className="absolute top-0 right-0 w-24 h-24 bg-sage-soft/30 rounded-bl-full pointer-events-none"
            aria-hidden="true"
          />

          {/* Header row: Question badge & Voice trigger */}
          <div className="flex items-start justify-between gap-2 relative z-10">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[10px] font-bold text-teal-brand bg-sage-subtle border border-sage-soft px-2 py-0.5 rounded-full uppercase tracking-wider">
                {t.assistant.fieldBadge(currentIndex + 1)}
              </span>
              <span className="text-[9.5px] font-semibold text-ink-muted bg-paper-ivory px-1.5 py-0.5 rounded border border-line-border">
                {currentField.type}
              </span>
              {currentField.required && (
                <span className="text-[10px] text-ink-muted font-medium">
                  {t.assistant.required}
                </span>
              )}
            </div>

            {/* Read question aloud in current interface language */}
            <button
              onClick={onToggleSpeechPlayback}
              className={`p-1.5 rounded-md border transition-all ${
                isSpeaking
                  ? 'bg-teal-brand text-white border-teal-brand shadow-fine'
                  : 'bg-paper-ivory text-ink-muted hover:text-teal-brand border-line-border hover:bg-sage-subtle'
              }`}
              title={isSpeaking ? t.assistant.stopReading : t.assistant.readAloud}
            >
              {isSpeaking ? (
                <VolumeX className="w-3.5 h-3.5 animate-pulse" />
              ) : (
                <Volume2 className="w-3.5 h-3.5" />
              )}
            </button>
          </div>

          {/* Strong Editorial Question Headline */}
          <h2 className="text-[15.5px] font-bold text-ink-deep leading-snug tracking-tight relative z-10">
            {plainQuestionText}
          </h2>

          {/* Secondary Question in other language if available */}
          {selectedLanguage === 'en' && currentField.plainQuestion.kn && (
            <p className="text-[12px] text-teal-brand font-medium leading-relaxed bg-paper-ivory/80 px-2 py-1 rounded border border-line-border/50">
              {currentField.plainQuestion.kn}
            </p>
          )}
          {selectedLanguage === 'kn' && currentField.plainQuestion.en && (
            <p className="text-[11px] text-ink-muted leading-relaxed italic">
              Original: {currentField.plainQuestion.en}
            </p>
          )}

          {/* Plain Language Explanation & Context Note */}
          <div className="bg-sage-subtle/50 border-l-2 border-sage-secondary p-2.5 rounded-r text-xs space-y-1 relative z-10">
            <div className="flex items-center gap-1 text-sage-secondary font-semibold text-[10.5px]">
              <Info className="w-3 h-3" />
              <span>{t.assistant.formContext}</span>
            </div>
            <p className="text-ink-body text-[11.5px] leading-relaxed">{contextNoteText}</p>
            {currentField.exampleAnswer && (
              <div className="pt-0.5">
                <span className="text-[10.5px] font-medium text-ink-muted">
                  {t.assistant.exampleAnswer(currentField.exampleAnswer)}
                </span>
              </div>
            )}
          </div>
        </section>
      )}

      {/* 4. Missing Voice Alert or Microphone Error */}
      {voiceError && !currentField.isSensitive && (
        <div className="p-2.5 bg-ochre-light border border-ochre-pale rounded-lg text-[10.5px] text-ink-body flex items-start gap-1.5">
          <AlertTriangle className="w-3.5 h-3.5 text-ochre-warm mt-0.5 shrink-0" />
          <p className="leading-snug">{voiceError}</p>
        </div>
      )}

      {selectedLanguage === 'kn' && !voiceCapabilities.hasDedicatedVoice && !currentField.isSensitive && !voiceError && (
        <div className="p-2.5 bg-ochre-light/80 border border-ochre-pale rounded-lg text-[10.5px] text-ink-body flex items-start gap-1.5">
          <Info className="w-3.5 h-3.5 text-ochre-warm mt-0.5 shrink-0" />
          <p className="leading-snug">{t.settings.kannadaVoiceWarning}</p>
        </div>
      )}

      {/* 5. Voice Interaction & Typed Alternative Stage */}
      {!currentField.isSensitive && (
        <div className="space-y-3">
          {/* Central Voice Stage with Dedicated Speech Language Selector */}
          <div className="bg-paper-card rounded-[14px_4px_14px_4px] border border-line-border p-3.5 shadow-fine text-center space-y-2.5 relative">
            <div className="flex items-center justify-between pb-0.5 flex-wrap gap-2">
              {/* Separate Speech Language Selector */}
              <div className="flex items-center gap-1.5">
                <span className="text-[10.5px] font-bold text-ink-deep flex items-center gap-1">
                  <Languages className="w-3 h-3 text-teal-brand" />
                  <span>{t.assistant.speechLangLabel}:</span>
                </span>
                <div className="inline-flex bg-paper-ivory border border-line-border rounded-full p-0.5">
                  <button
                    type="button"
                    onClick={() => onChangeSpeechLanguage('en')}
                    className={`px-2 py-0.5 text-[10px] font-semibold rounded-full transition-all ${
                      speechLanguage === 'en'
                        ? 'bg-teal-brand text-white shadow-fine'
                        : 'text-ink-muted hover:text-ink-deep'
                    }`}
                  >
                    English
                  </button>
                  <button
                    type="button"
                    onClick={() => onChangeSpeechLanguage('kn')}
                    className={`px-2 py-0.5 text-[10px] font-semibold rounded-full transition-all ${
                      speechLanguage === 'kn'
                        ? 'bg-teal-brand text-white shadow-fine'
                        : 'text-ink-muted hover:text-ink-deep'
                    }`}
                  >
                    ಕನ್ನಡ
                  </button>
                </div>
              </div>

              {/* Typed Alternative Toggle */}
              <button
                type="button"
                onClick={() => setShowTextInput(!showTextInput)}
                className="text-[10.5px] text-teal-brand hover:underline flex items-center gap-1 font-medium"
              >
                <Keyboard className="w-3 h-3" />
                <span>{showTextInput ? t.assistant.hideTyping : t.assistant.typeInstead}</span>
              </button>
            </div>

            {/* Live Interim Transcript or Waveform */}
            {isListening && liveTranscript ? (
              <div className="py-2 px-3 bg-sage-subtle rounded border border-sage-soft text-xs text-ink-deep italic">
                "{liveTranscript}"
              </div>
            ) : (
              <VoiceWave
                isListening={isListening}
                isSpeaking={isSpeaking}
                statusLabel={
                  isListening
                    ? `${t.assistant.listening} (${speechLanguage === 'kn' ? 'ಕನ್ನಡ' : 'English'})...`
                    : isInterpreting
                    ? t.assistant.interpreting
                    : `${t.assistant.pressMic} (${speechLanguage === 'kn' ? 'ಕನ್ನಡದಲ್ಲಿ ಮಾತನಾಡಿ' : 'Speak in English'})`
                }
              />
            )}

            {/* Organic Central Mic Button */}
            <div className="flex justify-center pt-0.5">
              <button
                onClick={isListening ? onStopListening : onStartListening}
                className={`w-[52px] h-[52px] rounded-full flex items-center justify-center transition-all ${
                  isListening
                    ? 'bg-semantic-error text-white shadow-fine animate-pulse'
                    : 'bg-teal-brand hover:bg-teal-hover active:scale-95 text-white shadow-fine'
                }`}
                title={isListening ? 'Stop listening' : `Start voice input in ${speechLanguage === 'kn' ? 'Kannada' : 'English'}`}
              >
                {isListening ? (
                  <MicOff className="w-5 h-5" />
                ) : (
                  <Mic className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>

          {/* Alternative Typing Input Form */}
          {showTextInput && (
            <form onSubmit={handleManualSubmit} className="bg-paper-card p-3 rounded-lg border border-line-border space-y-2 shadow-fine">
              <label className="text-[11px] font-semibold text-ink-deep block">
                {t.assistant.typeAnswerLabel}
              </label>
              <div className="flex gap-1.5">
                <input
                  type="text"
                  value={typedText}
                  onChange={(e) => setTypedText(e.target.value)}
                  placeholder={currentField.placeholder || t.assistant.typeAnswerPlaceholder(currentField.label)}
                  className="flex-1 px-3 py-2 text-xs bg-paper-ivory border border-line-border rounded-md focus:outline-none focus:border-teal-brand text-ink-deep"
                />
                <button
                  type="submit"
                  disabled={!typedText.trim()}
                  className="px-3.5 py-2 bg-teal-brand disabled:opacity-40 text-white text-[11px] font-bold rounded-md hover:bg-teal-hover transition-all"
                >
                  {t.assistant.interpretButton}
                </button>
              </div>
            </form>
          )}

          {/* 6. Comprehensive Bilingual Answer Preview (Tabs: Original | Translation | Transliteration | Final) */}
          {activeInterpretation && (
            <div className="bg-sage-soft/70 border border-sage-secondary/30 rounded-[14px_4px_14px_4px] p-3.5 space-y-3 animate-fadeIn shadow-fine">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-teal-brand font-bold text-[11.5px]">
                  <Sparkles className="w-3.5 h-3.5 text-teal-brand" />
                  <span>Bilingual Answer Verification</span>
                </div>
                <span className="text-[10px] font-bold text-teal-brand bg-white px-2 py-0.5 rounded-full border border-sage-soft">
                  {t.assistant.confidenceLabel(Math.round(activeInterpretation.confidence * 100))}
                </span>
              </div>

              {/* Representation Tabs */}
              <div className="flex items-center gap-1 border-b border-sage-secondary/20 pb-1.5 text-[11px] overflow-x-auto">
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('original');
                    setIsEditing(false);
                  }}
                  className={`px-2.5 py-1 rounded-t font-semibold transition-all shrink-0 ${
                    activeTab === 'original'
                      ? 'bg-white text-teal-brand border-b-2 border-teal-brand shadow-fine'
                      : 'text-ink-muted hover:text-ink-deep'
                  }`}
                >
                  {t.assistant.originalTab} ({bilingual?.originalLanguage.toUpperCase() || 'ORIG'})
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('translation');
                    setIsEditing(false);
                  }}
                  className={`px-2.5 py-1 rounded-t font-semibold transition-all shrink-0 ${
                    activeTab === 'translation'
                      ? 'bg-white text-teal-brand border-b-2 border-teal-brand shadow-fine'
                      : 'text-ink-muted hover:text-ink-deep'
                  }`}
                >
                  {t.assistant.translationTab} ({bilingual?.translatedLanguage?.toUpperCase() || 'TRANS'})
                </button>
                {bilingual?.transliteratedText && (
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('transliteration');
                      setIsEditing(false);
                    }}
                    className={`px-2.5 py-1 rounded-t font-semibold transition-all shrink-0 ${
                      activeTab === 'transliteration'
                        ? 'bg-white text-teal-brand border-b-2 border-teal-brand shadow-fine'
                        : 'text-ink-muted hover:text-ink-deep'
                    }`}
                  >
                    {t.assistant.transliterationTab}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('final');
                    setIsEditing(false);
                  }}
                  className={`px-2.5 py-1 rounded-t font-semibold transition-all shrink-0 ${
                    activeTab === 'final'
                      ? 'bg-white text-teal-brand border-b-2 border-teal-brand shadow-fine'
                      : 'text-ink-muted hover:text-ink-deep'
                  }`}
                >
                  {t.assistant.finalValueTab}
                </button>
              </div>

              {/* Tab Content Display Area */}
              <div className="p-3 bg-white rounded-lg border border-line-border space-y-2">
                {/* 1. Original Tab */}
                {activeTab === 'original' && (
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-ink-muted uppercase">
                        Spoken in {bilingual?.originalLanguage === 'kn' ? 'Kannada (ಕನ್ನಡ)' : 'English'}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handlePlayAudioSnippet(bilingual?.originalText || '', bilingual?.originalLanguage || 'en')}
                          className="p-1 rounded text-ink-muted hover:text-teal-brand hover:bg-sage-subtle"
                          title={t.assistant.listenOriginal}
                        >
                          <Volume2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setIsEditing(!isEditing);
                            setEditedText(bilingual?.originalText || '');
                          }}
                          className="p-1 rounded text-ink-muted hover:text-teal-brand hover:bg-sage-subtle flex items-center gap-0.5 text-[10px]"
                        >
                          <Edit2 className="w-3 h-3" />
                          <span>{t.assistant.editAnswer}</span>
                        </button>
                      </div>
                    </div>

                    {isEditing ? (
                      <div className="space-y-1.5 pt-1">
                        <textarea
                          value={editedText}
                          onChange={(e) => setEditedText(e.target.value)}
                          rows={2}
                          className="w-full p-2 text-xs border border-line-border rounded focus:outline-none focus:border-teal-brand"
                        />
                        <div className="flex justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => setIsEditing(false)}
                            className="px-2.5 py-1 text-[10.5px] border border-line-border rounded text-ink-muted"
                          >
                            {t.assistant.cancelEdit}
                          </button>
                          <button
                            type="button"
                            onClick={handleSaveEdit}
                            className="px-2.5 py-1 text-[10.5px] bg-teal-brand text-white font-bold rounded flex items-center gap-1"
                          >
                            <Save className="w-3 h-3" />
                            <span>{t.assistant.saveEdit}</span>
                          </button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-[13.5px] font-semibold text-ink-deep leading-relaxed">
                        "{bilingual?.originalText}"
                      </p>
                    )}
                  </div>
                )}

                {/* 2. Translation Tab */}
                {activeTab === 'translation' && (
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-ink-muted uppercase">
                        Translated into {bilingual?.translatedLanguage === 'kn' ? 'Kannada (ಕನ್ನಡ)' : 'English'}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handlePlayAudioSnippet(bilingual?.translatedText || '', bilingual?.translatedLanguage || 'kn')}
                          className="p-1 rounded text-ink-muted hover:text-teal-brand hover:bg-sage-subtle"
                          title={t.assistant.listenTranslation}
                        >
                          <Volume2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setIsEditing(!isEditing);
                            setEditedText(bilingual?.translatedText || '');
                          }}
                          className="p-1 rounded text-ink-muted hover:text-teal-brand hover:bg-sage-subtle flex items-center gap-0.5 text-[10px]"
                        >
                          <Edit2 className="w-3 h-3" />
                          <span>{t.assistant.editAnswer}</span>
                        </button>
                      </div>
                    </div>

                    {isEditing ? (
                      <div className="space-y-1.5 pt-1">
                        <textarea
                          value={editedText}
                          onChange={(e) => setEditedText(e.target.value)}
                          rows={2}
                          className="w-full p-2 text-xs border border-line-border rounded focus:outline-none focus:border-teal-brand"
                        />
                        <div className="flex justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => setIsEditing(false)}
                            className="px-2.5 py-1 text-[10.5px] border border-line-border rounded text-ink-muted"
                          >
                            {t.assistant.cancelEdit}
                          </button>
                          <button
                            type="button"
                            onClick={handleSaveEdit}
                            className="px-2.5 py-1 text-[10.5px] bg-teal-brand text-white font-bold rounded flex items-center gap-1"
                          >
                            <Save className="w-3 h-3" />
                            <span>{t.assistant.saveEdit}</span>
                          </button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-[13.5px] font-semibold text-teal-brand leading-relaxed">
                        "{bilingual?.translatedText}"
                      </p>
                    )}
                  </div>
                )}

                {/* 3. Transliteration Tab */}
                {activeTab === 'transliteration' && (
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-bold text-ink-muted uppercase">
                      Latin Script Pronunciation (Transliteration)
                    </span>
                    <p className="text-[13px] font-medium text-ink-deep italic leading-relaxed">
                      "{bilingual?.transliteratedText}"
                    </p>
                    <p className="text-[9.5px] text-ink-muted">
                      Note: Transliteration shows phonetic pronunciation, not English translation.
                    </p>
                  </div>
                )}

                {/* 4. Final Form Value Tab */}
                {activeTab === 'final' && (
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-ink-muted uppercase">
                        Value to be Filled into Webpage Field
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setIsEditing(!isEditing);
                          setEditedFinalValue(bilingual?.interpretedValue || activeInterpretation.interpretedValue);
                        }}
                        className="p-1 rounded text-ink-muted hover:text-teal-brand hover:bg-sage-subtle flex items-center gap-0.5 text-[10px]"
                      >
                        <Edit2 className="w-3 h-3" />
                        <span>{t.assistant.editAnswer}</span>
                      </button>
                    </div>

                    {isEditing ? (
                      <div className="space-y-1.5 pt-1">
                        <input
                          type="text"
                          value={editedFinalValue}
                          onChange={(e) => setEditedFinalValue(e.target.value)}
                          className="w-full p-2 text-xs border border-line-border rounded focus:outline-none focus:border-teal-brand"
                        />
                        <div className="flex justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => setIsEditing(false)}
                            className="px-2.5 py-1 text-[10.5px] border border-line-border rounded text-ink-muted"
                          >
                            {t.assistant.cancelEdit}
                          </button>
                          <button
                            type="button"
                            onClick={handleSaveEdit}
                            className="px-2.5 py-1 text-[10.5px] bg-teal-brand text-white font-bold rounded flex items-center gap-1"
                          >
                            <Save className="w-3 h-3" />
                            <span>{t.assistant.saveEdit}</span>
                          </button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-[14px] font-bold text-teal-brand font-mono">
                        {bilingual?.interpretedValue || activeInterpretation.interpretedValue}
                      </p>
                    )}
                    <p className="text-[10px] text-ink-subtle">
                      {activeInterpretation.explanation}
                    </p>
                  </div>
                )}
              </div>

              {/* Primary Action Button: Confirm and Fill */}
              <button
                onClick={() =>
                  onConfirmAndFill(
                    currentField.id,
                    bilingual?.interpretedValue || activeInterpretation.interpretedValue
                  )
                }
                className="w-full flex items-center justify-center gap-1.5 bg-teal-brand hover:bg-teal-hover active:scale-[0.99] text-white py-2.5 px-3.5 rounded-lg font-bold text-xs tracking-wide shadow-fine transition-all"
              >
                <Check className="w-4 h-4 text-softSage" />
                <span>{t.assistant.confirmAndFill}: {bilingual?.interpretedValue || activeInterpretation.interpretedValue}</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* 7. Secondary Actions: Repeat and Skip */}
      <div className="pt-1 flex items-center gap-2 text-xs">
        <button
          onClick={onRepeatExplanation}
          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 bg-paper-card hover:bg-sage-subtle border border-line-border rounded-lg text-ink-body font-semibold transition-all text-[11px] shadow-fine"
        >
          <RotateCcw className="w-3 h-3 text-ink-muted" />
          <span>{t.assistant.repeatQuestion}</span>
        </button>

        <button
          onClick={() => onSkipField(currentField.id)}
          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 bg-paper-card hover:bg-sage-subtle border border-line-border rounded-lg text-ink-body font-semibold transition-all text-[11px] shadow-fine"
        >
          <SkipForward className="w-3 h-3 text-ink-muted" />
          <span>{t.assistant.skipForNow}</span>
        </button>
      </div>

      {/* 8. Quiet Privacy Assurance */}
      <div className="pt-2 pb-1 text-center">
        <div className="inline-flex items-center gap-1.5 text-[10px] text-ink-muted">
          <ShieldCheck className="w-3 h-3 text-teal-brand" />
          <span>FormSaathi Shield: Sensitive data is kept on this device. Never auto-submits.</span>
        </div>
      </div>
    </div>
  );
};
