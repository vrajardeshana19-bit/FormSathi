export interface FillResult { success: boolean; message: string; filledValue?: string }

type HighlightState = { timer?: number; styles: { outline: string; transition: string; boxShadow: string } };
const normalize = (value: string) => value.trim().toLowerCase().replace(/[_-]+/g, ' ').replace(/\s+/g, ' ');

function setNativeChecked(element: HTMLInputElement, checked: boolean): void {
  const setter = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(element), 'checked')?.set;
  if (setter) setter.call(element, checked); else element.checked = checked;
}

function setNativeValue(element: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement, value: string): void {
  const setter = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(element), 'value')?.set;
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
      const radios = first.name
        ? Array.from(document.querySelectorAll<HTMLInputElement>(`input[type="radio"][name="${CSS.escape(first.name)}"]`))
        : matches.filter((el): el is HTMLInputElement => el instanceof HTMLInputElement);
      const answer = normalize(value);
      if (!answer) return { success: false, message: 'A radio answer is required.' };
      const exact = radios.filter(r => normalize(r.value) === answer || normalize(getLabelText(r)) === answer);
      let matched = exact.length === 1 ? exact[0] : undefined;
      if (exact.length > 1) return { success: false, message: 'Radio answer is ambiguous. No option was changed.' };
      if (!matched) {
        const partial = radios.filter(r => {
          const label = normalize(getLabelText(r));
          const optionValue = normalize(r.value);
          return label.length > 0 && ((optionValue.length > 0 && (optionValue.includes(answer) || answer.includes(optionValue))) || label.includes(answer) || answer.includes(label));
        });
        if (partial.length === 1) matched = partial[0];
        else return { success: false, message: 'No unambiguous radio option matched the answer. Existing selection was left unchanged.' };
      }
      if (matched.disabled) return { success: false, message: 'Matching radio option is disabled.' };
      matched.focus();
      setNativeChecked(matched, true);
      matched.dispatchEvent(new Event('input', { bubbles: true }));
      matched.dispatchEvent(new Event('change', { bubbles: true }));
      if (!matched.checked) return { success: false, message: 'Radio selection could not be applied.' };
      highlightFilledElement(matched);
      return { success: true, message: `Selected radio option "${matched.value}"`, filledValue: matched.value };
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
      const usable = Array.from(first.options).filter(opt => !opt.disabled && opt.value.trim() !== '' && opt.text.trim() !== '');
      const exact = usable.filter(opt => normalize(opt.value) === answer || normalize(opt.text) === answer);
      if (exact.length > 1) return { success: false, message: 'Dropdown answer is ambiguous. No option was changed.' };
      let selected = exact[0];
      if (!selected) {
        const partial = usable.filter(opt => normalize(opt.text).includes(answer) || answer.includes(normalize(opt.text)) || normalize(opt.value).includes(answer) || answer.includes(normalize(opt.value)));
        if (partial.length !== 1) return { success: false, message: 'No unambiguous dropdown option matched the answer. Existing selection was left unchanged.' };
        selected = partial[0];
      }
      setNativeValue(first, selected.value);
      first.dispatchEvent(new Event('input', { bubbles: true }));
      first.dispatchEvent(new Event('change', { bubbles: true }));
      if (first.value !== selected.value) return { success: false, message: 'Dropdown selection could not be applied.' };
      highlightFilledElement(first);
      return { success: true, message: `Selected: ${selected.text}`, filledValue: selected.text };
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
  const target = element as HTMLElement & { __fsHighlight?: HighlightState };
  const state = target.__fsHighlight;
  if (state?.timer) window.clearTimeout(state.timer);
  const original = state?.styles || { outline: element.style.outline, transition: element.style.transition, boxShadow: element.style.boxShadow };
  element.style.transition = 'all 0.3s ease-in-out';
  element.style.outline = '2px solid #174B4F';
  element.style.boxShadow = '0 0 0 3px rgba(23, 75, 79, 0.15)';
  const timer = window.setTimeout(() => {
    element.style.outline = original.outline;
    element.style.boxShadow = original.boxShadow;
    element.style.transition = original.transition;
    delete target.__fsHighlight;
  }, 2500);
  target.__fsHighlight = { timer, styles: original };
}

function highlightFilledElement(element: HTMLElement): void {
  const existing = element.parentElement?.querySelector('.formsaathi-filled-badge');
  existing?.remove();
  const original = { transition: element.style.transition, borderColor: element.style.borderColor, backgroundColor: element.style.backgroundColor };
  element.style.transition = 'border-color 0.4s ease, background-color 0.4s ease';
  element.style.borderColor = '#174B4F';
  element.style.backgroundColor = '#EEF4F1';
  window.setTimeout(() => {
    element.style.transition = original.transition;
    element.style.borderColor = original.borderColor;
    element.style.backgroundColor = original.backgroundColor;
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
