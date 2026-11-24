import { describe, expect, it } from 'vitest';
import { MockAiService } from './mockAiService';
import { FormField } from './types';

describe('MockAiService Answer Interpretation', () => {
  const checkboxField: FormField = {
    id: 'fld-consent',
    name: 'consent',
    label: 'I accept terms and conditions',
    type: 'checkbox',
    required: true,
    isSensitive: false,
    value: '',
    status: 'pending',
    selector: '#terms',
    plainQuestion: { en: 'Do you accept terms?', kn: 'ನೀವು ನಿಯಮಗಳನ್ನು ಒಪ್ಪುತ್ತೀರಾ?' },
    contextNote: { en: 'Checkbox', kn: 'ಚೆಕ್‌ಬಾಕ್ಸ್' },
    exampleAnswer: 'Yes',
  };

  const selectField: FormField = {
    id: 'fld-accommodation',
    name: 'accommodation',
    label: 'Accommodation Type',
    type: 'select',
    required: true,
    options: [
      { label: 'Hostel', value: 'hostel' },
      { label: 'Day Scholar', value: 'day_scholar' },
      { label: 'Paying Guest', value: 'pg' },
    ],
    isSensitive: false,
    value: '',
    status: 'pending',
    selector: '#acc',
    plainQuestion: { en: 'Accommodation?', kn: 'ವಸತಿ?' },
    contextNote: { en: 'Select', kn: 'ಆಯ್ಕೆ' },
    exampleAnswer: 'Hostel',
  };

  const dateField: FormField = {
    id: 'fld-dob',
    name: 'dob',
    label: 'Date of Birth',
    type: 'date',
    required: true,
    isSensitive: false,
    value: '',
    status: 'pending',
    selector: '#dob',
    plainQuestion: { en: 'Date of birth?', kn: 'ಹುಟ್ಟಿದ ದಿನಾಂಕ?' },
    contextNote: { en: 'Date', kn: 'ದಿನಾಂಕ' },
    exampleAnswer: '15 August 2004',
  };

  const numberField: FormField = {
    id: 'fld-income',
    name: 'income',
    label: 'Annual Family Income',
    type: 'number',
    required: true,
    isSensitive: false,
    value: '',
    status: 'pending',
    selector: '#income',
    plainQuestion: { en: 'Annual income?', kn: 'ವಾರ್ಷಿಕ ಆದಾಯ?' },
    contextNote: { en: 'Number', kn: 'ಸಂಖ್ಯೆ' },
    exampleAnswer: '450000',
  };

  describe('Checkbox Interpretation', () => {
    it('accepts clear affirmative consent in English and Kannada', async () => {
      const enYes = await MockAiService.interpretAnswer(checkboxField, 'yes', 'en');
      expect(enYes.interpretedValue).toBe('true');
      expect(enYes.confidence).toBeGreaterThan(0.9);

      const knYes = await MockAiService.interpretAnswer(checkboxField, 'ಹೌದು', 'kn');
      expect(knYes.interpretedValue).toBe('true');

      const knAgree = await MockAiService.interpretAnswer(checkboxField, 'ಒಪ್ಪುತ್ತೇನೆ', 'kn');
      expect(knAgree.interpretedValue).toBe('true');
    });

    it('accepts clear negative response and marks false', async () => {
      const enNo = await MockAiService.interpretAnswer(checkboxField, 'no', 'en');
      expect(enNo.interpretedValue).toBe('false');

      const knNo = await MockAiService.interpretAnswer(checkboxField, 'ಇಲ್ಲ', 'kn');
      expect(knNo.interpretedValue).toBe('false');
    });

    it('rejects ambiguous responses without assuming consent', async () => {
      const result = await MockAiService.interpretAnswer(checkboxField, 'maybe later', 'en');
      expect(result.interpretedValue).toBe('');
      expect(result.confidence).toBeLessThan(0.5);
    });
  });

  describe('Option Selection', () => {
    it('matches exact options accurately', async () => {
      const res = await MockAiService.interpretAnswer(selectField, 'hostel', 'en');
      expect(res.interpretedValue).toBe('hostel');
    });

    it('matches Kannada equivalents for known options', async () => {
      const res = await MockAiService.interpretAnswer(selectField, 'ವಿದ್ಯಾರ್ಥಿನಿಲಯ', 'kn');
      expect(res.interpretedValue).toBe('hostel');
    });

    it('rejects unrecognized options without falling back to first option', async () => {
      const res = await MockAiService.interpretAnswer(selectField, 'astronomy club', 'en');
      expect(res.interpretedValue).toBe('');
      expect(res.confidence).toBeLessThan(0.5);
    });
  });

  describe('Date Interpretation', () => {
    it('formats spoken natural date to standard ISO 8601', async () => {
      const res = await MockAiService.interpretAnswer(dateField, '15th August 2004', 'en');
      expect(res.interpretedValue).toBe('2004-08-15');
    });

    it('formats DD-MM-YYYY to ISO 8601', async () => {
      const res = await MockAiService.interpretAnswer(dateField, '25-12-2003', 'en');
      expect(res.interpretedValue).toBe('2003-12-25');
    });

    it('rejects unparseable dates instead of returning arbitrary defaults', async () => {
      const res = await MockAiService.interpretAnswer(dateField, 'some day in summer', 'en');
      expect(res.interpretedValue).toBe('');
      expect(res.confidence).toBeLessThan(0.5);
    });
  });

  describe('Number / Scale Interpretation', () => {
    it('parses raw digits and formatted numbers', async () => {
      const res = await MockAiService.interpretAnswer(numberField, '4,50,000', 'en');
      expect(res.interpretedValue).toBe('450000');
    });

    it('parses spoken Indian scales (lakh, crore, ಸಾವಿರ)', async () => {
      const resLakh = await MockAiService.interpretAnswer(numberField, '4.5 lakh', 'en');
      expect(resLakh.interpretedValue).toBe('450000');

      const resCrore = await MockAiService.interpretAnswer(numberField, '1.2 crore', 'en');
      expect(resCrore.interpretedValue).toBe('12000000');

      const resKn = await MockAiService.interpretAnswer(numberField, '೫ ಲಕ್ಷ', 'kn');
      expect(resKn.interpretedValue).toBe('500000');
    });

    it('rejects non-numeric inputs', async () => {
      const res = await MockAiService.interpretAnswer(numberField, 'not applicable', 'en');
      expect(res.interpretedValue).toBe('');
      expect(res.confidence).toBeLessThan(0.5);
    });
  });
});
