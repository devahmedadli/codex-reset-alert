'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const CodexReset = require('../shared.js');
const CodexI18n = require('../i18n.js');

const SOURCE = fs.readFileSync(path.join(__dirname, '..', 'background.js'), 'utf8');

function loadBackground({ store = {}, fetchImpl, failNotifications = false } = {}) {
  const notifications = [];
  const chrome = {
    runtime: {
      lastError: null,
      onInstalled: { addListener() {} },
      onStartup: { addListener() {} },
      onMessage: { addListener() {} },
      sendMessage: async () => ({}),
    },
    storage: {
      local: {
        get(keys, cb) {
          const out = {};
          for (const k of [].concat(keys)) if (k in store) out[k] = store[k];
          cb(out);
        },
        set(value, cb) { Object.assign(store, value); cb(); },
      },
    },
    alarms: { onAlarm: { addListener() {} }, get(_n, cb) { cb(null); }, create() {} },
    notifications: {
      onClicked: { addListener() {} },
      onButtonClicked: { addListener() {} },
      clear() {},
      create(id, options, cb) {
        if (failNotifications) {
          chrome.runtime.lastError = { message: 'boom' };
          cb();
          chrome.runtime.lastError = null;
          return;
        }
        notifications.push({ id, options });
        cb(id);
      },
    },
    action: { setBadgeText: async () => {}, setBadgeBackgroundColor: async () => {}, setTitle: async () => {} },
    tabs: { create() {} },
    i18n: { getUILanguage: () => 'en' },
  };
  const sandbox = { chrome, CodexReset, CodexI18n, fetch: fetchImpl, console: { ...console, warn() {} }, Date, URL };
  sandbox.globalThis = sandbox;
  vm.createContext(sandbox);
  vm.runInContext(SOURCE, sandbox);
  return { api: sandbox, store, notifications };
}

const SETTINGS = { notificationsEnabled: true, notifyWatch: true, notifyReset: true, soundEnabled: false, language: 'en' };

function resetStatus(text = 'Reset done') {
  return {
    latestReset: { id: '1', announcedAt: '2026-09-12T08:00:00.000Z', text, source: { url: 'https://x.com/a/status/1' } },
    scheduledReset: null,
    activeWatch: null,
  };
}

test('notifies on a new reset and stores fingerprints', async () => {
  const { api, store, notifications } = loadBackground();
  await api.notifyForStatus(resetStatus(), {}, SETTINGS, false);
  assert.equal(notifications.length, 1);
  assert.equal(notifications[0].options.message, 'Reset done');
  assert.ok(store.lastResetFingerprint);
  assert.ok(store.notificationLinks[notifications[0].id]);
});

test('does not notify while initializing but still stores fingerprints', async () => {
  const { api, store, notifications } = loadBackground();
  await api.notifyForStatus(resetStatus(), {}, SETTINGS, true);
  assert.equal(notifications.length, 0);
  assert.ok(store.lastResetFingerprint);
});

test('does not re-notify for an already seen fingerprint', async () => {
  const { api, store, notifications } = loadBackground();
  await api.notifyForStatus(resetStatus(), {}, SETTINGS, false);
  const previous = { lastResetFingerprint: store.lastResetFingerprint };
  await api.notifyForStatus(resetStatus(), previous, SETTINGS, false);
  assert.equal(notifications.length, 1);
});

test('respects notifyReset and notificationsEnabled toggles', async () => {
  const a = loadBackground();
  await a.api.notifyForStatus(resetStatus(), {}, { ...SETTINGS, notifyReset: false }, false);
  assert.equal(a.notifications.length, 0);
  const b = loadBackground();
  await b.api.notifyForStatus(resetStatus(), {}, { ...SETTINGS, notificationsEnabled: false }, false);
  assert.equal(b.notifications.length, 0);
});

test('a failing notification does not prevent fingerprints from being saved', async () => {
  const { api, store } = loadBackground({ failNotifications: true });
  await api.notifyForStatus(resetStatus(), {}, SETTINGS, false);
  assert.ok(store.lastResetFingerprint);
});

test('watch message uses localized signal suffix', () => {
  const { api } = loadBackground();
  const watch = { windowText: 'next 6 hours', chancePercent: 70, text: 'Hmm' };
  assert.equal(api.watchMessage(watch, 'en'), 'next 6 hours · 70% signal — Hmm');
  assert.equal(api.watchMessage({ ...watch, chancePercent: null, text: '' }, 'en'), 'next 6 hours');
  assert.match(api.watchMessage(watch, 'ar'), /إشارة 70%/);
});

function fakeResponse({ status = 200, body = {}, headers = {} } = {}) {
  return {
    status,
    ok: status >= 200 && status < 300,
    headers: { get: (k) => headers[k.toLowerCase()] ?? null },
    json: async () => body,
  };
}

const API_BODY = {
  data: { latest_reset: { id: '1', announced_at: '2026-09-12T08:00:00.000Z', text: 'x' } },
};

test('checkStatus sends If-None-Match and keeps cache on 304', async () => {
  let seen;
  const store = { etag: 'abc', status: resetStatus(), initialized: true };
  const { api } = loadBackground({
    store,
    fetchImpl: async (_url, opts) => { seen = opts.headers; return fakeResponse({ status: 304 }); },
  });
  const result = await api.checkStatus();
  assert.equal(seen['if-none-match'], 'abc');
  assert.equal(result.unchanged, true);
  assert.equal(store.lastError, null);
});

test('checkStatus backs off on 429 using Retry-After and skips next call', async () => {
  let calls = 0;
  const { api, store } = loadBackground({
    fetchImpl: async () => { calls += 1; return fakeResponse({ status: 429, headers: { 'retry-after': '600' } }); },
  });
  const first = await api.checkStatus();
  assert.equal(first.ok, false);
  assert.ok(store.retryAfterAt > Date.now());
  const second = await api.checkStatus();
  assert.equal(second.skipped, true);
  assert.equal(calls, 1);
  await api.checkStatus({ force: true });
  assert.equal(calls, 2);
});

test('checkStatus records an error on malformed payload', async () => {
  const { api, store } = loadBackground({ fetchImpl: async () => fakeResponse({ body: { nope: 1 } }) });
  const result = await api.checkStatus();
  assert.equal(result.ok, false);
  assert.match(store.lastError.message, /Unexpected response/);
});

test('first successful check initializes without notifying', async () => {
  const { api, store, notifications } = loadBackground({
    fetchImpl: async () => fakeResponse({ body: API_BODY, headers: { etag: 'e1' } }),
  });
  const result = await api.checkStatus();
  assert.equal(result.ok, true);
  assert.equal(result.initializing, true);
  assert.equal(notifications.length, 0);
  assert.equal(store.etag, 'e1');
  assert.equal(store.initialized, true);
});
