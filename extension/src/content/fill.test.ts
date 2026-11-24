import { afterEach, describe, expect, it, vi } from 'vitest';
import { fillFormField, highlightActiveField } from './fill';

const reset = () => { document.body.innerHTML = ''; vi.restoreAllMocks(); };
afterEach(reset);

describe('fillFormField', () => {
  it('checks and unchecks a checkbox without toggling it back', () => {
    document.body.innerHTML = '<input id="agree" type="checkbox">';
    const checkbox = document.querySelector<HTMLInputElement>('#agree')!;
    const input = vi.fn();
    const change = vi.fn();
    checkbox.addEventListener('input', input);
    checkbox.addEventListener('change', change);
    expect(fillFormField('#agree', 'true').success).toBe(true);
    expect(checkbox.checked).toBe(true);
    expect(fillFormField('#agree', 'false').success).toBe(true);
    expect(checkbox.checked).toBe(false);
    expect(input).toHaveBeenCalledTimes(2);
    expect(change).toHaveBeenCalledTimes(2);
  });

  it('leaves radio selection unchanged on unmatched or ambiguous input', () => {
    document.body.innerHTML = '<label><input type="radio" name="choice" value="a"> Alpha</label><label><input type="radio" name="choice" value="b"> Beta</label>';
    const radios = Array.from(document.querySelectorAll<HTMLInputElement>('input'));
    radios[0].checked = true;
    expect(fillFormField('input[name="choice"]', 'not an option').success).toBe(false);
    expect(radios[0].checked).toBe(true);
    document.body.innerHTML = '<label><input type="radio" name="choice" value="x"> Choice A</label><label><input type="radio" name="choice" value="y"> Choice B</label>';
    expect(fillFormField('input[name="choice"]', 'choice').success).toBe(false);
  });

  it('ignores empty dropdown placeholders and rejects unmatched options', () => {
    document.body.innerHTML = '<select id="degree"><option value="">Select one</option><option value="mech">Mechanical</option></select>';
    const select = document.querySelector<HTMLSelectElement>('#degree')!;
    expect(fillFormField('#degree', 'mechanical').success).toBe(true);
    expect(select.value).toBe('mech');
    expect(fillFormField('#degree', 'unknown').success).toBe(false);
    expect(select.value).toBe('mech');
  });

  it('does not claim success for disabled or readonly fields', () => {
    document.body.innerHTML = '<input id="disabled" disabled><input id="readonly" readonly value="initial">';
    expect(fillFormField('#disabled', 'new').success).toBe(false);
    expect(fillFormField('#readonly', 'new').success).toBe(false);
    expect(document.querySelector<HTMLInputElement>('#readonly')!.value).toBe('initial');
  });
});

describe('highlightActiveField', () => {
  it('restores original style after repeated highlights', () => {
    vi.useFakeTimers();
    document.body.innerHTML = '<input id="target" style="outline: 1px solid red; transition: color 1s; box-shadow: none">';
    const target = document.querySelector<HTMLInputElement>('#target')!;
    highlightActiveField('#target');
    highlightActiveField('#target');
    vi.advanceTimersByTime(2500);
    expect(target.style.outline).toBe('1px solid red');
    expect(target.style.transition).toBe('color 1s');
    vi.useRealTimers();
  });
});
