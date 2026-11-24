export interface FillResult { success: boolean; message: string; filledValue?: string }

const normalize = (value: string) => value.trim().toLowerCase().replace(/[_-]+/g, ' ').replace(/\s+/g, ' ');

function setNativeChecked(element: HTMLInputElement, checked: boolean): void {
  const prototype = Object.getPrototypeOf(element) as HTMLInputElement;
  const setter = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(element), 'checked')?.set;
  if (setter) setter.call(element, checked); else element.checked = checked;
}

function setNativeValue(element: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement, value: string): void {
  const prototype = Object.getPrototypeOf(element);
  const setter = Object.getOwnPropertyDescriptor(prototype, 'value')?.set;
  if (setter) setter.call(element, value); else (element as HTMLInputElement).value = value;
}

function getLabelText(element: HTMLElement): string {
  if (element.id) {
    const label = document.querySelector(`label[for="${CSS.escape(element.id)}"]`);
    if (label?.textContent?.trim()) return label.textContent.trim();
  }
  const label = element.closest('label');
  if (label?.textContent?.trim()) return label.textContent.trim();
  return element.getAttribute('aria-label')?.trim() || '';
}

export function fillFormField(selector: string, value: string): FillResult {
  try {
    const matches = Array.from(document.querySelectorAll<HTMLElement>(selector));
    if (!matches.length) return { success: false, message: `Could not find field with selector: ${selector}` };
    const first = matches[0];
    first.scrollIntoView?.({ behavior: 'smooth', block: 'center' });

    if (first instanceof HTMLInputElement && first.type === 'radio') {
      if (first.disabled || first.readOnly) return { success: false, message: 'Radio field is disabled or readonly.' };
      const name = first.name;
      const radios = name
        ? Array.from(document.querySelectorAll<HTMLInputElement>(`input[type="radio"][name="${CSS.escape(name)}"]`))
        : matches.filter((e): e is HTMLInputElement => e instanceof HTMLInputElement);
      const answer = normalize(value);
      if (!answer) return { success: false, message: 'A radio answer is required.' };

      const exact = radios.filter(r => normalize(r.value) === answer || normalize(getLabelText(r)) === answer);
      if (exact.length === 1) {
        const matched = exact[0];
        matched.focus();
        setNativeChecked(matched, true);
        matched.dispatchEvent(new Event('input', { bubbles: true }));
        matched.dispatchEvent(new Event('change', { bubbles: true }));
        if (!matched.checked) return { success: false, message: 'Radio selection could not be applied.' };
        highlightFilledElement(matched);
        return { success: true, message: `Selected radio option "${matched.value}"`, filledValue: matched.value };
      }
      if (exact.length > 1) return { success: false, message: 'Radio answer is ambiguous. No option was changed.' };

      const normalizedMatches = radios.filter(r => {
        const label = normalize(getLabelText(r));
        return label.length > 0 && (normalize(r.value).includes(answer) || answer.includes(normalize(r.value)) || label.includes(answer) || answer.includes(label));
      });
      if (normalizedMatches.length === 1) {
        const matched = normalizedMatches[0];
        matched.focus();
        setNativeChecked(matched, true);
        matched.dispatchEvent(new Event('input', { bubbles: true }));
        matched.dispatchEvent(new Event('change', { bubbles: true }));
        if (!matched.checked) return { success: false, message: 'Radio selection could not be applied.' };
        highlightFilledElement(matched);
        return { success: true, message: `Selected radio option "${matched.value}"`, filledValue: matched.value };
      }
      return { success: false, message: 'No unambiguous radio option matched the answer. Existing selection was left unchanged.' };
    }

    if (first instanceof HTMLInputElement && first.type === 'checkbox') {
      if (first.disabled || first.readOnly) return { success: false, message: 'Checkbox is disabled or readonly.' };
      const answer = normalize(value);
      if (!['true', 'false', 'yes', 'no', 'check', 'checked', 'uncheck', 'unchecked', '1', '0', 'on', 'off'].includes(answer)) {
        return { success: false, message: 'Checkbox answer must clearly indicate checked or unchecked.' };
      }
      const shouldCheck = ['true', 'yes', 'check', 'checked', '1', 'on'].includes(answer);
      first.focus();
      setNativeChecked(first, shouldCheck);
      first.dispatchEvent(new Event('input', { bubbles: true }));
      first.dispatchEvent(new Event('change', { bubbles: true }));
      if (first.checked !== shouldCheck) return { success: false, message: 'Checkbox state could not be applied.' };
      highlightFilledElement(first);
      return { success: true, message: shouldCheck ? 'Checkbox checked' : 'Checkbox unchecked', filledValue: shouldCheck ? 'true' : 'false' };
    }

    if (first instanceof HTMLSelectElement) {
      if (first.disabled) return { success: false, message: 'Dropdown is disabled.' };
      const answer = normalize(value);
      if (!answer) return { success: false, message: 'A dropdown answer is required.' };
      const usable = Array.from(first.options).filter(opt => !opt.disabled && (opt.value.trim() !== '' || opt.text.trim() !== '') && normalize(opt.text) !== '' && normalize(opt.value) !== '');
      const exact = usable.filter(opt => normalize(opt.value) === answer || normalize(opt.text) === answer);
      if (exact.length === 1) {
        setNativeValue(first, exact[0].value);
        first.dispatchEvent(new Event('input', { bubbles: true }));
        first.dispatchEvent(new Event('change', { bubbles: true }));
        if (first.value !== exact[0].value) return { success: false, message: 'Dropdown selection could not be applied.' };
        highlightFilledElement(first);
        return { success: true, message: `Selected: ${exact[0].text}`, filledValue: exact[0].text };
      }
      if (exact.length > 1) return { success: false, message: 'Dropdown answer is ambiguous. No option was changed.' };
      const partial = usable.filter(opt => normalize(opt.text).includes(answer) || answer.includes(normalize(opt.text)) || normalize(opt.value).includes(answer) || answer.includes(normalize(opt.value)));
      if (partial.length === 1) {
        setNativeValue(first, partial[0].value);
        first.dispatchEvent(new Event('input', { bubbles: true }));
        first.dispatchEvent(new Event('change', { bubbles: true }));
        if (first.value !== partial[0].value) return { success: false, message: 'Dropdown selection could not be applied.' };
        highlightFilledElement(first);
        return { success: true, message: `Selected: ${partial[0].text}`, filledValue: partial[0].text };
      }
      return { success: false, message: 'No unambiguous dropdown option matched the answer. Existing selection was left unchanged.' };
    }

    if (first instanceof HTMLInputElement || first instanceof HTMLTextAreaElement) {
      if (first.disabled || first.readOnly) return { success: false, message: 'Field is disabled or readonly.' };
      first.focus();
      setNativeValue(first, value);
      first.dispatchEvent(new Event('input', { bubbles: true }));
      first.dispatchEvent(new Event('change', { bubbles: true }));
      if (first.value !== value) return { success: false, message: 'Field value could not be verified.' };
      highlightFilledElement(first);
      return { success: true, message: `Filled ${selector}`, filledValue: first.value };
    }
    return { success: false, message: 'Unsupported element type' };
  } catch (error: any) {
    return { success: false, message: error?.message || 'Error occurred while filling field' };
  }
}

export function highlightActiveField(selector: string): void {
  const element = document.querySelector<HTMLElement>(selector);
  if (!element) return;
  element.scrollIntoView?.({ behavior: 'smooth', block: 'center' });
  const state = (element as HTMLElement & { __fsHighlight?: { timer?: number; styles: Record<string,string> } }).__fsHighlight;
  if (state?.timer) window.clearTimeout(state.timer);
  const original = { outline: element.style.outline, transition: element.style.transition, boxShadow: element.style.boxShadow };
  (element as any).__fsHighlight = { styles: original };
  element.style.transition = 'all 0.3s ease-in-out';
  element.style.outline = '2px solid #174B4F';
  element.style.boxShadow = '0 0 0 3px rgba(23, 75, 79, 0.15)';
  const timer = window.setTimeout(() => {
    element.style.outline = original.outline;
    element.style.boxShadow = original.boxShadow;
    element.style.transition = original.transition;
    delete (element as any).__fsHighlight;
  }, 2500);
  (element as any).__fsHighlight.timer = timer;
}

function highlightFilledElement(element: HTMLElement): void {
  const existing = element.parentElement?.querySelector('.formsaathi-filled-badge');
  existing?.remove();
  const originalTransition = element.style.transition;
  const originalBorder = element.style.borderColor;
  const originalBackground = element.style.backgroundColor;
  element.style.transition = 'border-color 0.4s ease, background-color 0.4s ease';
  element.style.borderColor = '#174B4F';
  element.style.backgroundColor = '#EEF4F1';
  window.setTimeout(() => {
    element.style.transition = originalTransition;
    element.style.borderColor = originalBorder;
    element.style.backgroundColor = originalBackground;
  }, 3000);

  const badge = document.createElement('span');
  badge.className = 'formsaathi-filled-badge';
  badge.textContent = '✓ FormSaathi';
  badge.style.cssText = 'position:absolute;right:8px;top:-10px;background:#174B4F;color:#fff;font-size:10px;padding:2px 6px;border-radius:4px;pointer-events:none;z-index:999999;';
  const wrapper = element.parentElement;
  if (wrapper && getComputedStyle(wrapper).position === 'static') wrapper.style.position = 'relative';
  wrapper?.appendChild(badge);
  window.setTimeout(() => badge.remove(), 3000);
}
