import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Header } from './components/Header';
import { WelcomeScreen } from './screens/WelcomeScreen';
import { ActiveAssistantScreen } from './screens/ActiveAssistantScreen';
import { ReviewScreen } from './screens/ReviewScreen';
import { PrivacyCenterScreen } from './screens/PrivacyCenterScreen';
import { SettingsScreen } from './screens/SettingsScreen';
import { ContourLines } from './components/OrganicSurfaces';
import {
  ActiveScreen,
  FormField,
  FormMetadata,
  InterpretationResult,
  UserSettings,
  VoiceCapabilities,
  PageConnectionStatus,
} from '../shared/types';
import { MOCK_SCHOLARSHIP_FORM } from '../shared/mockData';
import { MockAiService } from '../shared/mockAiService';
import { SpeechService } from '../shared/speechService';
import { AlertCircle, RefreshCw } from 'lucide-react';

const DEFAULT_SETTINGS: UserSettings = {
  language: 'en',
  speechLanguage: 'en',
  speechRate: 1.0,
  autoPlayVoice: false,
  highContrast: false,
  fontSize: 'normal',
  mockMode: false,
};

export const App: React.FC = () => {
  const [activeScreen, setActiveScreen] = useState<ActiveScreen>('welcome');
  const [formData, setFormData] = useState<FormMetadata>(MOCK_SCHOLARSHIP_FORM);
  const [currentFieldIndex, setCurrentFieldIndex] = useState<number>(0);
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_SETTINGS);
  const [pageStatus, setPageStatus] = useState<PageConnectionStatus>('connecting');
  const [pageStatusMessage, setPageStatusMessage] = useState<string>('');

  // Voice & Interaction states
  const [isListening, setIsListening] = useState<boolean>(false);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [liveTranscript, setLiveTranscript] = useState<string>('');
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const [isInterpreting, setIsInterpreting] = useState<boolean>(false);
  const [activeInterpretation, setActiveInterpretation] = useState<InterpretationResult | null>(null);

  // Voice capability diagnostics (TTS & STT support for chosen language)
  const voiceCapabilities: VoiceCapabilities = useMemo(() => {
    return MockAiService.checkVoiceCapabilities(settings.language);
  }, [settings.language]);

  // Unified message sender to active tab via Background Service Worker
  const sendContentScriptMessage = useCallback(
    (payload: any, callback?: (response: any) => void) => {
      if (typeof chrome !== 'undefined' && chrome.runtime?.sendMessage) {
        chrome.runtime.sendMessage({ target: 'CONTENT_SCRIPT', payload }, (res) => {
          if (!chrome.runtime.lastError && res && callback) {
            callback(res);
          } else if (chrome.runtime.lastError && callback) {
            callback({ success: false, error: chrome.runtime.lastError.message });
          }
        });
      } else {
        // Localhost / standalone browser preview fallback
        if (payload.type === 'SCAN_FORM' && callback) {
          callback({ success: true, data: MOCK_SCHOLARSHIP_FORM });
        } else if (payload.type === 'FILL_FIELD' && callback) {
          callback({ success: true, message: 'Simulated fill in preview mode' });
        }
      }
    },
    []
  );

  // Scan active page for forms
  const scanWebpage = useCallback(() => {
    setPageStatus('connecting');
    sendContentScriptMessage({ type: 'SCAN_FORM' }, (res) => {
      if (res && res.success && res.data && res.data.fields && res.data.fields.length > 0) {
        setFormData(res.data);
        setPageStatus('connected');
        setPageStatusMessage('');
      } else if (res && res.error === 'UNSUPPORTED_PAGE') {
        setPageStatus('unsupported_page');
        setPageStatusMessage(res.message || 'Cannot scan internal browser pages.');
      } else if (res && res.data && res.data.fields && res.data.fields.length === 0) {
        setPageStatus('no_form');
        setPageStatusMessage('No interactive form fields found on this webpage.');
        // Do not overwrite with mock form in a real browser tab without forms
        setFormData({
          id: 'empty-form',
          title: 'No Form Detected',
          detectedAt: new Date().toISOString(),
          url: '',
          fields: [],
        });
      } else if (res && !res.success && res.error) {
        setPageStatus('no_form');
        setPageStatusMessage(res.message || 'Could not scan page form.');
      } else {
        // Fallback to mock form in dev / preview when outside chrome extension
        if (typeof chrome === 'undefined' || !chrome.runtime?.sendMessage) {
          setFormData(MOCK_SCHOLARSHIP_FORM);
          setPageStatus('connected');
        } else {
          setPageStatus('no_form');
          setPageStatusMessage('No interactive form fields found on this webpage.');
        }
      }
    });
  }, [sendContentScriptMessage]);

  // Initial scan on load
  useEffect(() => {
    scanWebpage();
  }, [scanWebpage]);

  const currentField: FormField | undefined =
    formData.fields[currentFieldIndex] || formData.fields[0];

  const completedCount = formData.fields.filter((f) => f.status === 'completed').length;
  const skippedCount = formData.fields.filter((f) => f.status === 'skipped').length;
  const totalCount = formData.fields.length;

  // Highlight current active field on page & trigger auto-play if enabled
  useEffect(() => {
    if (activeScreen === 'assistant' && currentField) {
      sendContentScriptMessage({
        type: 'HIGHLIGHT_FIELD',
        selector: currentField.selector,
      });

      // Clear previous interpretation and live transcripts
      setActiveInterpretation(null);
      setLiveTranscript('');
      setVoiceError(null);

      // Auto-play voice if setting is enabled and field is not sensitive
      if (settings.autoPlayVoice && !currentField.isSensitive) {
        const text =
          currentField.plainQuestion[settings.language] || currentField.plainQuestion.en;
        setIsSpeaking(true);
        MockAiService.speakText(text, settings.language, settings.speechRate, () => {
          setIsSpeaking(false);
        });
      }
    }
  }, [currentFieldIndex, activeScreen, currentField, settings, sendContentScriptMessage]);

  // Voice playback toggle
  const handleToggleSpeechPlayback = () => {
    if (isSpeaking) {
      MockAiService.stopSpeaking();
      setIsSpeaking(false);
    } else if (currentField) {
      const text =
        currentField.plainQuestion[settings.language] || currentField.plainQuestion.en;
      setIsSpeaking(true);
      MockAiService.speakText(text, settings.language, settings.speechRate, () => {
        setIsSpeaking(false);
      });
    }
  };

  // Start Real Browser Speech Recognition
  const handleStartListening = () => {
    if (!currentField) return;
    MockAiService.stopSpeaking();
    setIsSpeaking(false);
    setVoiceError(null);
    setLiveTranscript('');

    const started = SpeechService.startListening(settings.speechLanguage, {
      onStart: () => {
        setIsListening(true);
      },
      onTranscript: (transcript, isFinal) => {
        setLiveTranscript(transcript);
        if (isFinal) {
          handleVoiceAnswerReceived(transcript);
        }
      },
      onError: (err) => {
        setVoiceError(err);
        setIsListening(false);
      },
      onEnd: () => {
        setIsListening(false);
      },
    });

    if (!started && settings.mockMode) {
      // Mock mode fallback for headless or non-speech testing environments
      setIsListening(true);
      setTimeout(() => {
        setIsListening(false);
        const sampleRawInput = currentField.exampleAnswer || 'Confirmed';
        handleVoiceAnswerReceived(sampleRawInput);
      }, 1500);
    }
  };

  const handleStopListening = () => {
    SpeechService.stopListening();
    setIsListening(false);
    if (liveTranscript.trim()) {
      handleVoiceAnswerReceived(liveTranscript.trim());
    }
  };

  const handleVoiceAnswerReceived = async (transcript: string) => {
    if (!currentField) return;
    setIsInterpreting(true);
    const result = await MockAiService.interpretAnswer(
      currentField,
      transcript,
      settings.speechLanguage,
      settings.language
    );
    setActiveInterpretation(result);
    setIsInterpreting(false);
  };

  // Text input submission
  const handleManualTextSubmit = async (text: string) => {
    if (!currentField) return;
    setIsInterpreting(true);
    const result = await MockAiService.interpretAnswer(
      currentField,
      text,
      settings.speechLanguage,
      settings.language
    );
    setActiveInterpretation(result);
    setIsInterpreting(false);
  };

  // Confirm and Fill Field on Webpage
  const handleConfirmAndFill = (fieldId: string, value: string) => {
    const field = formData.fields.find((f) => f.id === fieldId);
    if (!field) return;

    sendContentScriptMessage(
      {
        type: 'FILL_FIELD',
        selector: field.selector,
        value: value,
      },
      (res) => {
        const finalValue = res?.filledValue || value;
        const updatedFields = formData.fields.map((f) =>
          f.id === fieldId ? { ...f, value: finalValue, status: 'completed' as const } : f
        );

        setFormData((prev) => ({ ...prev, fields: updatedFields }));
        setActiveInterpretation(null);
        advanceToNextField(updatedFields);
      }
    );
  };

  // Skip Field
  const handleSkipField = (fieldId: string) => {
    const updatedFields = formData.fields.map((f) =>
      f.id === fieldId
        ? { ...f, status: f.isSensitive ? ('manual_required' as const) : ('skipped' as const) }
        : f
    );

    setFormData((prev) => ({ ...prev, fields: updatedFields }));
    setActiveInterpretation(null);
    advanceToNextField(updatedFields);
  };

  // Repeat question explanation
  const handleRepeatExplanation = () => {
    if (currentField) {
      const text =
        currentField.plainQuestion[settings.language] || currentField.plainQuestion.en;
      setIsSpeaking(true);
      MockAiService.speakText(text, settings.language, settings.speechRate, () => {
        setIsSpeaking(false);
      });
    }
  };

  // Advance to next pending field, or go to review screen if all answered
  const advanceToNextField = (fields: FormField[]) => {
    const nextIndex = fields.findIndex(
      (f, idx) => idx > currentFieldIndex && f.status === 'pending'
    );

    if (nextIndex !== -1) {
      setCurrentFieldIndex(nextIndex);
    } else {
      const firstPending = fields.findIndex((f) => f.status === 'pending');
      if (firstPending !== -1) {
        setCurrentFieldIndex(firstPending);
      } else {
        setActiveScreen('review');
      }
    }
  };

  // Revisit a specific field from Review
  const handleRevisitField = (fieldId: string) => {
    const targetIndex = formData.fields.findIndex((f) => f.id === fieldId);
    if (targetIndex !== -1) {
      setCurrentFieldIndex(targetIndex);
      setActiveScreen('assistant');
    }
  };

  // Reset session
  const handleResetSession = () => {
    setFormData(MOCK_SCHOLARSHIP_FORM);
    setCurrentFieldIndex(0);
    setActiveInterpretation(null);
    setActiveScreen('welcome');
    scanWebpage();
  };

  return (
    <div
      className={`min-h-screen flex flex-col bg-paper-ivory text-ink-deep relative ${
        settings.highContrast ? 'border-2 border-teal-brand' : ''
      }`}
    >
      {/* Subtle Editorial Contour Lines in Background */}
      <ContourLines />

      {/* Persistent Nav Header (shown on Assistant, Review, Privacy, Settings) */}
      {activeScreen !== 'welcome' && (
        <Header
          activeScreen={activeScreen}
          onNavigate={(screen) => setActiveScreen(screen)}
          formTitle={formData.title}
          completedCount={completedCount}
          totalFields={totalCount}
          language={settings.language}
          onToggleLanguage={(lang) => setSettings((s) => ({ ...s, language: lang }))}
        />
      )}

      {/* Page Status Notice (if unsupported or no form found) */}
      {pageStatus === 'unsupported_page' && (
        <div className="bg-ochre-light border-b border-ochre-pale p-3 text-xs text-ink-deep flex items-start gap-2 relative z-20">
          <AlertCircle className="w-4 h-4 text-ochre-warm shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-bold text-[11px]">System Page Detected</p>
            <p className="text-[10.5px] text-ink-muted mt-0.5">{pageStatusMessage}</p>
          </div>
        </div>
      )}

      {pageStatus === 'no_form' && (
        <div className="bg-paper-card border-b border-line-border p-3 text-xs text-ink-deep flex items-center justify-between relative z-20 shadow-fine">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-ink-muted" />
            <span className="text-[11px] text-ink-muted">No form detected on this page.</span>
          </div>
          <button
            onClick={scanWebpage}
            className="flex items-center gap-1 text-[10.5px] font-bold text-teal-brand bg-sage-subtle px-2 py-1 rounded border border-sage-soft"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Scan Again</span>
          </button>
        </div>
      )}

      {/* Screen Router */}
      <main className="flex-1 relative z-10 overflow-y-auto">
        {activeScreen === 'welcome' && (
          <WelcomeScreen
            onStart={() => setActiveScreen('assistant')}
            selectedLanguage={settings.language}
            onLanguageChange={(lang) => setSettings((s) => ({ ...s, language: lang }))}
            onOpenSettings={() => setActiveScreen('settings')}
            formDetected={pageStatus === 'connected'}
            formTitle={formData.title}
            fieldCount={totalCount}
          />
        )}

        {activeScreen === 'assistant' && currentField && (
          <ActiveAssistantScreen
            currentField={currentField}
            currentIndex={currentFieldIndex}
            totalFields={totalCount}
            completedCount={completedCount}
            skippedCount={skippedCount}
            selectedLanguage={settings.language}
            speechLanguage={settings.speechLanguage}
            onChangeSpeechLanguage={(lang) => setSettings((s) => ({ ...s, speechLanguage: lang }))}
            isListening={isListening}
            isSpeaking={isSpeaking}
            liveTranscript={liveTranscript}
            voiceError={voiceError}
            voiceCapabilities={voiceCapabilities}
            onToggleSpeechPlayback={handleToggleSpeechPlayback}
            onStartListening={handleStartListening}
            onStopListening={handleStopListening}
            onConfirmAndFill={handleConfirmAndFill}
            onSkipField={handleSkipField}
            onRepeatExplanation={handleRepeatExplanation}
            onManualTextSubmit={handleManualTextSubmit}
            onRescanPage={scanWebpage}
            activeInterpretation={activeInterpretation}
            onUpdateBilingualAnswer={(updatedBilingual) => {
              setActiveInterpretation((prev) =>
                prev
                  ? {
                      ...prev,
                      interpretedValue: updatedBilingual.interpretedValue,
                      displayPreview: updatedBilingual.displayPreview,
                      bilingual: updatedBilingual,
                    }
                  : null
              );
            }}
            isInterpreting={isInterpreting}
          />
        )}

        {activeScreen === 'review' && (
          <ReviewScreen
            fields={formData.fields}
            onRevisitField={handleRevisitField}
            formTitle={formData.title}
            language={settings.language}
          />
        )}

        {activeScreen === 'privacy' && (
          <PrivacyCenterScreen
            fields={formData.fields}
            language={settings.language}
          />
        )}

        {activeScreen === 'settings' && (
          <SettingsScreen
            settings={settings}
            voiceCapabilities={voiceCapabilities}
            onUpdateSettings={(newVals) => setSettings((s) => ({ ...s, ...newVals }))}
            onResetSession={handleResetSession}
          />
        )}
      </main>
    </div>
  );
};

export default App;
