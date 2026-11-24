import { describe, expect, it } from 'vitest';
import { scanCurrentPageForm } from './scanner';

describe('scanCurrentPageForm', () => {
  it('does not classify pincode, opinion, shipping address as sensitive', () => {
    document.body.innerHTML = `
      <form>
        <input id="pincode" name="pincode" placeholder="Enter PIN code">
        <input id="postal_code" name="postal_code">
        <textarea id="opinion" name="user_opinion"></textarea>
        <input id="speed" name="typing_speed">
        <input id="ship" name="shipping_address">
      </form>
    `;

    const form = scanCurrentPageForm();
    const sensitiveFields = form.fields.filter((f) => f.isSensitive);
    expect(sensitiveFields.length).toBe(0);
    expect(form.fields.length).toBe(5);
  });

  it('correctly classifies password, credit card, aadhaar, pan, and security pin as sensitive', () => {
    document.body.innerHTML = `
      <form>
        <input id="pwd" type="password">
        <input id="card" name="credit_card_number">
        <input id="aadhaar" name="aadhaar_no">
        <input id="pan" name="pan_card">
        <input id="mpin" name="security_pin">
      </form>
    `;

    const form = scanCurrentPageForm();
    const sensitiveFields = form.fields.filter((f) => f.isSensitive);
    expect(sensitiveFields.length).toBe(5);
  });

  it('skips disabled and readonly form fields from candidate list', () => {
    document.body.innerHTML = `
      <form>
        <input id="editable" name="editable">
        <input id="disabled" name="disabled" disabled>
        <input id="readonly" name="readonly" readonly>
      </form>
    `;

    const form = scanCurrentPageForm();
    expect(form.fields.length).toBe(1);
    expect(form.fields[0].name).toBe('editable');
  });
});
