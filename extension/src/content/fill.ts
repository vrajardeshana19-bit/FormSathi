export function fillFormField(selector: string, value: string): { success: boolean; message: string; filledValue?: string } {
  try {
    // 1. Check for Radio Group or single element
    const allMatches = Array.from(document.querySelectorAll<HTMLElement>(selector));

    if (allMatches.length === 0) {
      return { success: false, message: `Could not find field with selector: ${selector}` };
    }

    const firstElement = allMatches[0];

    // Smoothly bring element into viewport
    firstElement.scrollIntoView({ behavior: 'smooth', block: 'center' });

    // A. Handle Radio Buttons (Single or Group)
    if (firstElement instanceof HTMLInputElement && firstElement.type === 'radio') {
      const radioName = firstElement.name;
      const radios = radioName
        ? Array.from(document.querySelectorAll<HTMLInputElement>(`input[type="radio"][name="${CSS.escape(radioName)}"]`))
        : (allMatches as HTMLInputElement[]);

      const lowerVal = value.trim().toLowerCase();
      let matchedRadio: HTMLInputElement | undefined;

      // Match by value or associated label text
      for (const r of radios) {
        if (r.value.toLowerCase() === lowerVal) {
          matchedRadio = r;
          break;
        }
        // Check label text
        const labelText = getElementLabelText(r)?.toLowerCase() || '';
        if (labelText.includes(lowerVal) || lowerVal.includes(labelText)) {
          matchedRadio = r;
          break;
        }
      }

      if (!matchedRadio && radios.length > 0) {
        matchedRadio = radios[0]; // Fallback to first option if no exact match
      }

      if (matchedRadio) {
        matchedRadio.focus();
        matchedRadio.checked = true;
        matchedRadio.dispatchEvent(new MouseEvent('click', { bubbles: true }));
        matchedRadio.dispatchEvent(new Event('input', { bubbles: true }));
        matchedRadio.dispatchEvent(new Event('change', { bubbles: true }));
        matchedRadio.dispatchEvent(new Event('blur', { bubbles: true }));

        highlightFilledElement(matchedRadio);

        if (!matchedRadio.checked) {
          return { success: false, message: 'Radio selection could not be toggled.' };
        }
        return { success: true, message: `Selected radio option "${matchedRadio.value}"`, filledValue: matchedRadio.value };
      }
    }

    // B. Handle Checkbox
    if (firstElement instanceof HTMLInputElement && firstElement.type === 'checkbox') {
      firstElement.focus();
      const shouldCheck =
        value === 'true' ||
        value === 'yes' ||
        value === '1' ||
        value === 'on' ||
        value.toLowerCase() === firstElement.value.toLowerCase();

      firstElement.checked = shouldCheck;
      firstElement.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      firstElement.dispatchEvent(new Event('input', { bubbles: true }));
      firstElement.dispatchEvent(new Event('change', { bubbles: true }));
      firstElement.dispatchEvent(new Event('blur', { bubbles: true }));

      highlightFilledElement(firstElement);
      return {
        success: true,
        message: shouldCheck ? 'Checkbox checked' : 'Checkbox unchecked',
        filledValue: shouldCheck ? 'true' : 'false',
      };
    }

    // C. Handle Select Dropdown
    if (firstElement instanceof HTMLSelectElement) {
      firstElement.focus();
      const lowerVal = value.trim().toLowerCase();
      let matchIndex = -1;

      for (let i = 0; i < firstElement.options.length; i++) {
        const opt = firstElement.options[i];
        if (opt.value.toLowerCase() === lowerVal || opt.text.trim().toLowerCase() === lowerVal) {
          matchIndex = i;
          break;
        }
      }

      // Fuzzy / partial match if exact match not found
      if (matchIndex === -1) {
        for (let i = 0; i < firstElement.options.length; i++) {
          const optText = firstElement.options[i].text.trim().toLowerCase();
          if (optText.includes(lowerVal) || lowerVal.includes(optText)) {
            matchIndex = i;
            break;
          }
        }
      }

      if (matchIndex !== -1) {
        firstElement.selectedIndex = matchIndex;
        firstElement.value = firstElement.options[matchIndex].value;
      } else {
        // Direct value assignment fallback
        firstElement.value = value;
      }

      firstElement.dispatchEvent(new Event('input', { bubbles: true }));
      firstElement.dispatchEvent(new Event('change', { bubbles: true }));
      firstElement.dispatchEvent(new Event('blur', { bubbles: true }));

      highlightFilledElement(firstElement);
      const chosenText = firstElement.options[firstElement.selectedIndex]?.text || firstElement.value;
      return { success: true, message: `Selected: ${chosenText}`, filledValue: chosenText };
    }

    // D. Handle Standard Input & Textarea (text, number, email, tel, date, textarea)
    if (firstElement instanceof HTMLInputElement || firstElement instanceof HTMLTextAreaElement) {
      firstElement.focus();

      // Set value using native property descriptor to trigger React / Angular / Vue reactive watchers
      const prototype = Object.getPrototypeOf(firstElement);
      const nativeValueSetter = Object.getOwnPropertyDescriptor(prototype, 'value')?.set;

      if (nativeValueSetter) {
        nativeValueSetter.call(firstElement, value);
      } else {
        firstElement.value = value;
      }

      // Dispatch input, change, and blur events
      firstElement.dispatchEvent(new Event('input', { bubbles: true }));
      firstElement.dispatchEvent(new Event('change', { bubbles: true }));
      firstElement.dispatchEvent(new Event('blur', { bubbles: true }));

      highlightFilledElement(firstElement);

      return { success: true, message: `Filled ${selector}`, filledValue: firstElement.value };
    }

    return { success: false, message: 'Unsupported element type' };
  } catch (error: any) {
    return { success: false, message: error?.message || 'Error occurred while filling field' };
  }
}

export function highlightActiveField(selector: string): void {
  const element = document.querySelector<HTMLElement>(selector);
  if (!element) return;

  element.scrollIntoView({ behavior: 'smooth', block: 'center' });

  // Subtle pulsing border
  const originalOutline = element.style.outline;
  const originalTransition = element.style.transition;
  const originalBoxShadow = element.style.boxShadow;

  element.style.transition = 'all 0.3s ease-in-out';
  element.style.outline = '2px solid #174B4F';
  element.style.boxShadow = '0 0 0 3px rgba(23, 75, 79, 0.15)';

  setTimeout(() => {
    element.style.outline = originalOutline;
    element.style.boxShadow = originalBoxShadow;
    element.style.transition = originalTransition;
  }, 2500);
}

function highlightFilledElement(element: HTMLElement): void {
  // Remove any previous badge
  const existingBadge = element.parentElement?.querySelector('.formsaathi-filled-badge');
  if (existingBadge) existingBadge.remove();

  // Apply subtle permanent success indicator style
  element.style.transition = 'border-color 0.4s ease, background-color 0.4s ease';
  element.style.borderColor = '#174B4F';
  element.style.backgroundColor = '#EEF4F1';

  // Add temporary badge
  const badge = document.createElement('span');
  badge.className = 'formsaathi-filled-badge';
  badge.textContent = '✓ FormSaathi';
  badge.style.cssText = `
    position: absolute;
    right: 8px;
    top: -10px;
    background: #174B4F;
    color: #ffffff;
    font-size: 10px;
    font-weight: 600;
    font-family: 'Inter', -apple-system, sans-serif;
    padding: 2px 6px;
    border-radius: 4px;
    pointer-events: none;
    z-index: 999999;
    box-shadow: 0 1px 3px rgba(38,52,51,0.2);
    opacity: 0;
    transition: opacity 0.3s ease;
  `;

  const wrapper = element.parentElement;
  if (wrapper && window.getComputedStyle(wrapper).position === 'static') {
    wrapper.style.position = 'relative';
  }
  wrapper?.appendChild(badge);

  requestAnimationFrame(() => {
    badge.style.opacity = '1';
  });

  setTimeout(() => {
    badge.style.opacity = '0';
    setTimeout(() => badge.remove(), 400);
  }, 3000);
}

function getElementLabelText(element: HTMLElement): string | null {
  if (element.id) {
    const l = document.querySelector(`label[for="${CSS.escape(element.id)}"]`);
    if (l?.textContent?.trim()) return l.textContent.trim();
  }
  const parent = element.closest('label');
  if (parent?.textContent?.trim()) return parent.textContent.trim();
  return element.getAttribute('aria-label') || null;
}
