'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');
const CodexI18n = require('../i18n.js');

test('resolves language correctly for various settings and system languages', () => {
  assert.equal(CodexI18n.resolveLanguage('en', 'ar'), 'en');
  assert.equal(CodexI18n.resolveLanguage('ar', 'en'), 'ar');
  assert.equal(CodexI18n.resolveLanguage('auto', 'ar-EG'), 'ar');
  assert.equal(CodexI18n.resolveLanguage('auto', 'ar'), 'ar');
  assert.equal(CodexI18n.resolveLanguage('auto', 'en-US'), 'en');
  assert.equal(CodexI18n.resolveLanguage('auto', 'fr'), 'en');
  assert.equal(CodexI18n.resolveLanguage(undefined, 'ar-SA'), 'ar');
  assert.equal(CodexI18n.resolveLanguage(undefined, 'en-GB'), 'en');
});

test('returns proper direction for languages', () => {
  assert.equal(CodexI18n.getDirection('en'), 'ltr');
  assert.equal(CodexI18n.getDirection('ar'), 'rtl');
  assert.equal(CodexI18n.getDirection('fr'), 'ltr');
});

test('translates keys in English and Arabic', () => {
  assert.equal(CodexI18n.t('extName', null, 'en'), 'Codex Reset Alert');
  assert.equal(CodexI18n.t('extName', null, 'ar'), 'منبه إعادة تعيين Codex');

  assert.equal(CodexI18n.t('settingsTitle', null, 'en'), 'Notifications');
  assert.equal(CodexI18n.t('settingsTitle', null, 'ar'), 'الإشعارات');

  assert.equal(CodexI18n.t('labelRecentReset', null, 'en'), 'RECENT RESET');
  assert.equal(CodexI18n.t('labelRecentReset', null, 'ar'), 'إعادة تعيين حديثة');
});

test('interpolates parameters correctly in both languages', () => {
  const enWithin = CodexI18n.t('headlineWithin', { time: '2 hours' }, 'en');
  assert.equal(enWithin, 'Within 2 hours');

  const arWithin = CodexI18n.t('headlineWithin', { time: 'ساعتين' }, 'ar');
  assert.equal(arWithin, 'خلال ساعتين');

  const enDays = CodexI18n.t('daysUnit', { days: '3.5' }, 'en');
  assert.equal(enDays, '3.5d');

  const arDays = CodexI18n.t('daysUnit', { days: '3.5' }, 'ar');
  assert.equal(arDays, '3.5 يوم');
});

test('all English keys have matching Arabic translations and vice-versa', () => {
  const enKeys = Object.keys(CodexI18n.MESSAGES.en).sort();
  const arKeys = Object.keys(CodexI18n.MESSAGES.ar).sort();

  assert.deepEqual(arKeys, enKeys, 'Both English and Arabic should have identical keys');

  for (const key of enKeys) {
    const enVal = CodexI18n.MESSAGES.en[key];
    const arVal = CodexI18n.MESSAGES.ar[key];
    assert.ok(typeof enVal === 'string' && enVal.length > 0, `English key ${key} should not be empty`);
    assert.ok(typeof arVal === 'string' && arVal.length > 0, `Arabic key ${key} should not be empty`);
  }
});

test('applies translations and direction to a mock DOM structure', () => {
  const elements = [
    {
      attrs: { 'data-i18n': 'extName' },
      textContent: '',
      getAttribute(k) { return this.attrs[k]; },
      setAttribute(k, v) { this.attrs[k] = v; },
    },
    {
      attrs: { 'data-i18n-title': 'refreshButtonTitle' },
      getAttribute(k) { return this.attrs[k]; },
      setAttribute(k, v) { this.attrs[k] = v; },
    },
    {
      attrs: { 'data-i18n-aria': 'modalCloseAria' },
      getAttribute(k) { return this.attrs[k]; },
      setAttribute(k, v) { this.attrs[k] = v; },
    },
  ];

  const mockDoc = {
    documentElement: { lang: 'en', dir: 'ltr' },
    body: { dir: 'ltr' },
    querySelectorAll(selector) {
      if (selector === '[data-i18n]') return [elements[0]];
      if (selector === '[data-i18n-title]') return [elements[1]];
      if (selector === '[data-i18n-aria]') return [elements[2]];
      return [];
    },
  };

  CodexI18n.applyToDOM('ar', mockDoc);

  assert.equal(mockDoc.documentElement.lang, 'ar');
  assert.equal(mockDoc.documentElement.dir, 'rtl');
  assert.equal(elements[0].textContent, 'منبه إعادة تعيين Codex');
  assert.equal(elements[1].attrs.title, 'تحديث الآن');
  assert.equal(elements[2].attrs['aria-label'], 'إغلاق الدليل');
});
