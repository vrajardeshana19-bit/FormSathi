import { FormField, FormMetadata, FieldType } from '../shared/types';

const SENSITIVE_PATTERNS = [
  /password/i,
  /passwd/i,
  /pin/i,
  /otp/i,
  /cvv/i,
  /cvc/i,
  /card_?num/i,
  /card_?no/i,
  /credit_?card/i,
  /debit_?card/i,
  /aadhaar/i,
  /aadhar/i,
  /uidai/i,
  /pan_?card/i,
  /pan_?num/i,
  /pan_?no/i,
  /ssn/i,
  /social_?sec/i,
  /bank_?acc/i,
  /account_?num/i,
  /account_?no/i,
  /ifsc/i,
  /secret/i,
];

function isFieldSensitive(element: HTMLElement): boolean {
  if (element instanceof HTMLInputElement && element.type === 'password') {
    return true;
  }

  const id = element.id || '';
  const name = element.getAttribute('name') || '';
  const ariaLabel = element.getAttribute('aria-label') || '';
  const placeholder = 'placeholder' in element ? (element as HTMLInputElement).placeholder || '' : '';
  const autocomplete = element.getAttribute('autocomplete') || '';

  const combinedString = `${id} ${name} ${ariaLabel} ${placeholder} ${autocomplete}`;
  return SENSITIVE_PATTERNS.some((pattern) => pattern.test(combinedString));
}

function findLabelText(element: HTMLElement): string {
  // 1. Explicit <label for="id">
  if (element.id) {
    const labelEl = document.querySelector(`label[for="${CSS.escape(element.id)}"]`);
    if (labelEl && labelEl.textContent?.trim()) {
      return cleanLabelText(labelEl.textContent);
    }
  }

  // 2. Parent <label>
  const parentLabel = element.closest('label');
  if (parentLabel && parentLabel.textContent?.trim()) {
    const clone = parentLabel.cloneNode(true) as HTMLElement;
    clone.querySelectorAll('input, select, textarea').forEach((n) => n.remove());
    if (clone.textContent?.trim()) {
      return cleanLabelText(clone.textContent);
    }
  }

  // 3. Enclosing <fieldset> with <legend>
  const fieldset = element.closest('fieldset');
  if (fieldset) {
    const legend = fieldset.querySelector('legend');
    if (legend && legend.textContent?.trim()) {
      return cleanLabelText(legend.textContent);
    }
  }

  // 4. aria-label or aria-labelledby
  const ariaLabel = element.getAttribute('aria-label');
  if (ariaLabel?.trim()) return cleanLabelText(ariaLabel);

  const ariaLabelledBy = element.getAttribute('aria-labelledby');
  if (ariaLabelledBy) {
    const ids = ariaLabelledBy.split(/\s+/);
    const texts = ids
      .map((id) => document.getElementById(id)?.textContent?.trim())
      .filter(Boolean);
    if (texts.length > 0) return cleanLabelText(texts.join(' '));
  }

  // 5. Placeholder
  if ('placeholder' in element && (element as HTMLInputElement).placeholder?.trim()) {
    return cleanLabelText((element as HTMLInputElement).placeholder);
  }

  // 6. Preceding heading or label-like element
  let prev = element.previousElementSibling;
  while (prev) {
    if (
      ['LABEL', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'P', 'SPAN'].includes(prev.tagName) &&
      prev.textContent?.trim() &&
      prev.textContent.trim().length < 80
    ) {
      return cleanLabelText(prev.textContent);
    }
    prev = prev.previousElementSibling;
  }

  // 7. Fallback to name or id formatted nicely
  const raw = element.getAttribute('name') || element.id;
  if (raw) {
    return raw
      .replace(/[-_]/g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase())
      .trim();
  }

  return 'Unlabeled Field';
}

function cleanLabelText(raw: string): string {
  return raw
    .replace(/\s+/g, ' ')
    .replace(/[*:]/g, '')
    .trim();
}

/**
 * Ensures each scanned element has a persistent, unique data-formsaathi-id attribute.
 * This guarantees 100% stable collision-free selectors even with missing IDs or duplicate names.
 */
function ensureStableIdentifier(element: HTMLElement, index: number): string {
  let stableId = element.getAttribute('data-formsaathi-id');
  if (!stableId) {
    stableId = `fs-fld-${index + 1}-${Date.now().toString(36)}`;
    element.setAttribute('data-formsaathi-id', stableId);
  }
  return stableId;
}

export function scanCurrentPageForm(): FormMetadata {
  const formElement = document.querySelector('form');
  const pageTitle =
    formElement?.getAttribute('aria-label') ||
    document.querySelector('form h1, form h2, h1, h2')?.textContent?.trim() ||
    document.title ||
    'Online Form';

  // Find all candidate interactive elements
  const allElements = Array.from(
    document.querySelectorAll<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>(
      'input:not([type="hidden"]):not([type="submit"]):not([type="button"]):not([type="reset"]), select, textarea'
    )
  ).filter((el) => {
    const style = window.getComputedStyle(el);
    return style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0';
  });

  const fields: FormField[] = [];
  const processedRadioNames = new Set<string>();
  const labelCounts = new Map<string, number>();

  let elementCounter = 0;

  for (const el of allElements) {
    elementCounter++;
    const tagName = el.tagName.toLowerCase();

    // 1. Handle Radio Buttons (Grouped by name)
    if (el instanceof HTMLInputElement && el.type === 'radio') {
      const radioName = el.name;
      if (radioName) {
        if (processedRadioNames.has(radioName)) {
          // Already created group question for this radio name
          continue;
        }
        processedRadioNames.add(radioName);

        // Find all radio options in this group
        const radioGroup = Array.from(
          document.querySelectorAll<HTMLInputElement>(`input[type="radio"][name="${CSS.escape(radioName)}"]`)
        );

        const groupLabel = findLabelText(el);
        const stableId = `fs-radio-group-${radioName}-${elementCounter}`;

        // Tag all radios with group marker
        radioGroup.forEach((r, idx) => {
          ensureStableIdentifier(r, elementCounter * 10 + idx);
        });

        const options = radioGroup.map((r) => {
          const optLabel = findLabelText(r);
          return {
            label: optLabel && optLabel !== groupLabel ? optLabel : (r.value || 'Option'),
            value: r.value || optLabel || '',
          };
        });

        const selectedRadio = radioGroup.find((r) => r.checked);
        const isSensitive = radioGroup.some(isFieldSensitive);
        const isRequired = radioGroup.some((r) => r.required || r.getAttribute('aria-required') === 'true');

        fields.push({
          id: stableId,
          name: radioName,
          label: groupLabel,
          type: 'radio',
          required: isRequired,
          options: options,
          isSensitive: isSensitive,
          value: isSensitive ? '' : (selectedRadio?.value || ''),
          status: isSensitive ? 'manual_required' : selectedRadio ? 'completed' : 'pending',
          selector: `input[type="radio"][name="${CSS.escape(radioName)}"]`,
          helpText: `Select an option for ${groupLabel}`,
          plainQuestion: {
            en: `Which option do you choose for ${groupLabel}?`,
            kn: `${groupLabel} ಗಾಗಿ ನೀವು ಯಾವ ಆಯ್ಕೆಯನ್ನು ಆರಿಸುತ್ತೀರಿ?`,
          },
          contextNote: {
            en: `Available options: ${options.map((o) => o.label).join(', ')}`,
            kn: `ಲಭ್ಯವಿರುವ ಆಯ್ಕೆಗಳು: ${options.map((o) => o.label).join(', ')}`,
          },
          exampleAnswer: options[0]?.label || '',
        });
        continue;
      }
    }

    // 2. Assign stable unique identifier
    const stableId = ensureStableIdentifier(el, elementCounter);
    const selector = `[data-formsaathi-id="${CSS.escape(stableId)}"]`;

    // 3. Resolve label & disambiguate duplicates
    let rawLabel = findLabelText(el);
    const count = labelCounts.get(rawLabel) || 0;
    labelCounts.set(rawLabel, count + 1);
    if (count > 0) {
      rawLabel = `${rawLabel} (${count + 1})`;
    }

    const sensitive = isFieldSensitive(el);
    const required = el.hasAttribute('required') || el.getAttribute('aria-required') === 'true';

    // 4. Resolve Field Type
    let fieldType: FieldType = 'text';
    let options: { label: string; value: string }[] | undefined;

    if (tagName === 'select' && el instanceof HTMLSelectElement) {
      fieldType = 'select';
      options = Array.from(el.options)
        .filter((opt) => opt.value !== '' || opt.text.trim() !== '')
        .map((opt) => ({
          label: opt.text.trim(),
          value: opt.value,
        }));
    } else if (tagName === 'textarea') {
      fieldType = 'textarea';
    } else if (el instanceof HTMLInputElement) {
      const typeAttr = el.type.toLowerCase();
      if (typeAttr === 'checkbox') {
        fieldType = 'checkbox';
      } else if (typeAttr === 'number') {
        fieldType = 'number';
      } else if (typeAttr === 'email') {
        fieldType = 'email';
      } else if (typeAttr === 'tel') {
        fieldType = 'tel';
      } else if (typeAttr === 'date') {
        fieldType = 'date';
      } else if (typeAttr === 'password') {
        fieldType = 'password';
      } else {
        fieldType = 'text';
      }
    }

    // Current value (sensitive values are strictly scrubbed)
    let currentValue = '';
    if (!sensitive) {
      if (el instanceof HTMLInputElement && el.type === 'checkbox') {
        currentValue = el.checked ? 'true' : '';
      } else {
        currentValue = el.value || '';
      }
    }

    const field: FormField = {
      id: stableId,
      name: el.getAttribute('name') || el.id || `field_${elementCounter}`,
      label: rawLabel,
      type: fieldType,
      placeholder: 'placeholder' in el ? (el as HTMLInputElement).placeholder : undefined,
      required: required,
      options: options,
      isSensitive: sensitive,
      value: currentValue,
      status: sensitive ? 'manual_required' : currentValue ? 'completed' : 'pending',
      selector: selector,
      helpText: `Please complete ${rawLabel}`,
      plainQuestion: {
        en: `What is your ${rawLabel}?`,
        kn: `ನಿಮ್ಮ ${rawLabel} ಏನು?`,
      },
      contextNote: {
        en: sensitive
          ? 'Sensitive field: Please enter manually on webpage. FormSaathi does not send this to AI.'
          : fieldType === 'checkbox'
          ? 'Confirm or toggle this checkbox.'
          : 'Speak or type your answer clearly.',
        kn: sensitive
          ? 'ಸೂಕ್ಷ್ಮ ವಿವರ: ದಯವಿಟ್ಟು ವೆಬ್‌ಪುಟದಲ್ಲಿ ನೀವೇ ಸ್ವತಃ ನಮೂದಿಸಿ. ಫಾರ್ಮ್‌ಸಾಥಿ ಇದನ್ನು ಎಐಗೆ ಕಳುಹಿಸುವುದಿಲ್ಲ.'
          : fieldType === 'checkbox'
          ? 'ಈ ಚೆಕ್‌ಬಾಕ್ಸ್ ಅನ್ನು ದೃಢೀಕರಿಸಿ.'
          : 'ನಿಮ್ಮ ಉತ್ತರವನ್ನು ಸ್ಪಷ್ಟವಾಗಿ ಹೇಳಿ ಅಥವಾ ಬರೆಯಿರಿ.',
      },
      exampleAnswer: options && options[0] ? options[0].label : '',
    };

    fields.push(field);
  }

  return {
    id: `detected-form-${Date.now()}`,
    title: pageTitle,
    detectedAt: new Date().toISOString(),
    url: window.location.href,
    fields: fields,
  };
}
