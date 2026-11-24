import { scanCurrentPageForm } from './scanner';
import { fillFormField, highlightActiveField } from './fill';

// Content script message listener with sender verification and validation
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  // Only accept messages from our own extension
  if (sender.id && sender.id !== chrome.runtime.id) {
    sendResponse({ success: false, error: 'UNAUTHORIZED_SENDER' });
    return false;
  }

  if (!request || typeof request !== 'object' || typeof request.type !== 'string') {
    sendResponse({ success: false, error: 'INVALID_PAYLOAD' });
    return false;
  }

  if (request.type === 'SCAN_FORM') {
    try {
      const formData = scanCurrentPageForm();
      sendResponse({ success: true, data: formData });
    } catch (e: any) {
      sendResponse({ success: false, error: 'SCAN_FAILED', message: e?.message || 'Error scanning form' });
    }
    return true;
  }

  if (request.type === 'FILL_FIELD') {
    if (typeof request.selector !== 'string' || typeof request.value !== 'string') {
      sendResponse({ success: false, message: 'Invalid selector or value provided' });
      return false;
    }
    const result = fillFormField(request.selector, request.value);
    sendResponse(result);
    return true;
  }

  if (request.type === 'HIGHLIGHT_FIELD') {
    if (typeof request.selector !== 'string') {
      sendResponse({ success: false, message: 'Invalid selector provided' });
      return false;
    }
    highlightActiveField(request.selector);
    sendResponse({ success: true });
    return true;
  }

  return false;
});
