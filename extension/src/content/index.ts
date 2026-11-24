import { scanCurrentPageForm } from './scanner';
import { fillFormField, highlightActiveField } from './fill';

// Content script message listener
chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
  if (request.type === 'SCAN_FORM') {
    const formData = scanCurrentPageForm();
    sendResponse({ success: true, data: formData });
    return true;
  }

  if (request.type === 'FILL_FIELD') {
    const result = fillFormField(request.selector, request.value);
    sendResponse(result);
    return true;
  }

  if (request.type === 'HIGHLIGHT_FIELD') {
    highlightActiveField(request.selector);
    sendResponse({ success: true });
    return true;
  }

  return false;
});
