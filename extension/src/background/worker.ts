// FormSaathi Background Service Worker (Manifest V3)

chrome.runtime.onInstalled.addListener(() => {
  console.log('[FormSaathi] Background Service Worker registered.');
  if (chrome.sidePanel && chrome.sidePanel.setPanelBehavior) {
    chrome.sidePanel
      .setPanelBehavior({ openPanelOnActionClick: true })
      .catch((error) => console.error('[FormSaathi] Error setting panel behavior:', error));
  }
});

// Explicit action click handler
chrome.action.onClicked.addListener(async (tab) => {
  if (tab.id && chrome.sidePanel && chrome.sidePanel.open) {
    try {
      await chrome.sidePanel.open({ tabId: tab.id });
    } catch (e) {
      console.warn('[FormSaathi] Could not open side panel:', e);
    }
  }
});

function isRestrictedUrl(url?: string): boolean {
  if (!url) return true;
  const restrictedProtocols = ['chrome:', 'chrome-extension:', 'edge:', 'about:', 'devtools:', 'view-source:'];
  return (
    restrictedProtocols.some((protocol) => url.startsWith(protocol)) ||
    url.includes('chrome.google.com/webstore') ||
    url.includes('chromewebstore.google.com')
  );
}

// Unified message router with programmatic content script injection fallback
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.target === 'CONTENT_SCRIPT') {
    handleContentScriptRequest(message.payload, sendResponse);
    return true; // Keep message channel open for async response
  }
});

async function handleContentScriptRequest(payload: any, sendResponse: (res: any) => void) {
  try {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    const activeTab = tabs[0];

    if (!activeTab || !activeTab.id) {
      sendResponse({ success: false, error: 'NO_ACTIVE_TAB', message: 'No active browser tab found.' });
      return;
    }

    if (isRestrictedUrl(activeTab.url)) {
      sendResponse({
        success: false,
        error: 'UNSUPPORTED_PAGE',
        message: 'FormSaathi runs on web pages (http/https). Browser internal and store pages cannot be scanned.',
      });
      return;
    }

    // Try sending message to content script
    chrome.tabs.sendMessage(activeTab.id, payload, async (response) => {
      const err = chrome.runtime.lastError;

      if (err && err.message?.includes('Receiving end does not exist')) {
        // Content script is not yet injected on this tab. Inject programmatically!
        try {
          await chrome.scripting.executeScript({
            target: { tabId: activeTab.id! },
            files: ['assets/content.js'],
          });

          // Wait a tick and retry sending the message
          setTimeout(() => {
            chrome.tabs.sendMessage(activeTab.id!, payload, (retryResponse) => {
              const retryErr = chrome.runtime.lastError;
              if (retryErr) {
                sendResponse({
                  success: false,
                  error: 'INJECTION_FAILED',
                  message: retryErr.message,
                });
              } else {
                sendResponse(retryResponse);
              }
            });
          }, 150);
        } catch (injectError: any) {
          sendResponse({
            success: false,
            error: 'EXECUTE_SCRIPT_ERROR',
            message: injectError?.message || 'Failed to inject content script into tab.',
          });
        }
      } else if (err) {
        sendResponse({ success: false, error: 'MESSAGE_ERROR', message: err.message });
      } else {
        sendResponse(response);
      }
    });
  } catch (globalError: any) {
    sendResponse({ success: false, error: 'SERVICE_WORKER_ERROR', message: globalError?.message });
  }
}
