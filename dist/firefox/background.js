/* global CodexReset, CodexI18n */
'use strict';

if (typeof importScripts === 'function') {
  if (typeof CodexReset === 'undefined') importScripts('shared.js');
  if (typeof CodexI18n === 'undefined') importScripts('i18n.js');
}

const ext = globalThis.chrome || globalThis.browser;
const ALARM_NAME = 'codex-reset-check';
const DEFAULT_INTERVAL_MINUTES = 15;
const MIN_INTERVAL_MINUTES = 5;

function getStorage(keys) {
  return new Promise((resolve, reject) => {
    ext.storage.local.get(keys, (result) => {
      const error = ext.runtime && ext.runtime.lastError;
      if (error) reject(new Error(error.message));
      else resolve(result || {});
    });
  });
}

function setStorage(value) {
  return new Promise((resolve, reject) => {
    ext.storage.local.set(value, () => {
      const error = ext.runtime && ext.runtime.lastError;
      if (error) reject(new Error(error.message));
      else resolve();
    });
  });
}

function createNotification(id, options) {
  return new Promise((resolve, reject) => {
    ext.notifications.create(id, options, (createdId) => {
      const error = ext.runtime && ext.runtime.lastError;
      if (error) reject(new Error(error.message));
      else resolve(createdId || id);
    });
  });
}

function openTab(url) {
  if (!url) return;
  ext.tabs.create({ url });
}

async function getSettings() {
  const stored = await getStorage(['settings']);
  const settings = stored.settings || {};
  const sysLang = (ext.i18n && typeof ext.i18n.getUILanguage === 'function' ? ext.i18n.getUILanguage() : 'en');
  const language = CodexI18n.resolveLanguage(settings.language, sysLang);

  return {
    notificationsEnabled: settings.notificationsEnabled !== false,
    notifyWatch: settings.notifyWatch !== false,
    notifyReset: settings.notifyReset !== false,
    soundEnabled: settings.soundEnabled === true,
    language,
    intervalMinutes: Math.max(
      MIN_INTERVAL_MINUTES,
      Number(settings.intervalMinutes) || DEFAULT_INTERVAL_MINUTES
    ),
  };
}

async function ensureAlarm({ forceRecreate = false } = {}) {
  const settings = await getSettings();
  if (!forceRecreate && ext.alarms && typeof ext.alarms.get === 'function') {
    const existing = await new Promise((resolve) => {
      ext.alarms.get(ALARM_NAME, (alarm) => resolve(alarm || null));
    });
    if (existing && existing.periodInMinutes === settings.intervalMinutes) {
      return;
    }
  }
  ext.alarms.create(ALARM_NAME, {
    delayInMinutes: 0.1,
    periodInMinutes: settings.intervalMinutes,
  });
}

function notificationIcon() {
  return 'icons/icon128.png';
}

function scheduledTitle(scheduled, lang) {
  const type = (scheduled && (scheduled.resetType || scheduled.type) || '').toLowerCase();
  const isBank = type.includes('bank');
  return CodexI18n.t(isBank ? 'notifBankedScheduledTitle' : 'notifScheduledTitle', null, lang);
}

function scheduledMessage(scheduled, lang) {
  const relative = CodexReset.formatRelative(scheduled.scheduledFor, Date.now(), lang);
  let prefix;
  if (relative) {
    prefix = CodexI18n.t('notifScheduledPrefix', { relative }, lang);
  } else {
    prefix = CodexI18n.t('headlineResetScheduled', null, lang);
  }
  const body = scheduled.text ? ` — ${scheduled.text}` : '';
  return CodexReset.truncate(`${prefix}${body}`, 220);
}

function watchTitle(watch, lang) {
  if (watch && watch.level === 'strong') return CodexI18n.t('notifWatchLikelySoon', null, lang);
  return CodexI18n.t('notifWatchAnnounced', null, lang);
}

function watchMessage(watch, lang) {
  let chanceStr = '';
  if (typeof watch.chancePercent === 'number') {
    chanceStr = lang === 'ar'
      ? ` · إشارة ${watch.chancePercent}%`
      : ` · ${watch.chancePercent}% signal`;
  }
  return CodexReset.truncate(`${watch.windowText}${chanceStr}${watch.text ? ` — ${watch.text}` : ''}`, 220);
}

function resetTitle(reset, lang) {
  const type = (reset && (reset.resetType || reset.type) || '').toLowerCase();
  const isBank = type.includes('bank');
  return CodexI18n.t(isBank ? 'notifBankedAnnouncedTitle' : 'notifResetUpdateTitle', null, lang);
}

async function rememberNotificationLink(id, url) {
  const { notificationLinks = {} } = await getStorage(['notificationLinks']);
  const next = { ...notificationLinks, [id]: url || CodexReset.SITE_URL };
  const entries = Object.entries(next);
  if (entries.length > 20) {
    entries.slice(0, entries.length - 20).forEach(([key]) => delete next[key]);
  }
  await setStorage({ notificationLinks: next });
}

async function playNotificationSound() {
  try {
    if (ext.offscreen && typeof ext.offscreen.createDocument === 'function') {
      const hasDoc = ext.offscreen.hasDocument ? await ext.offscreen.hasDocument() : false;
      if (!hasDoc) {
        await ext.offscreen.createDocument({
          url: 'offscreen.html',
          reasons: ['AUDIO_PLAYBACK'],
          justification: 'Play notification sound alert for reset events',
        });
      }
      await ext.runtime.sendMessage({ type: 'PLAY_AUDIO' });
    }
  } catch {
    // Graceful fallback if offscreen not available
  }
}

async function notifyForStatus(status, previous, settings, initializing) {
  const scheduled = CodexReset.isScheduledResetActive(status.scheduledReset) ? status.scheduledReset : null;
  const watch = CodexReset.isWatchActive(status.activeWatch) ? status.activeWatch : null;

  const scheduledId = CodexReset.eventFingerprint('scheduled', scheduled);
  const watchId = CodexReset.eventFingerprint('watch', watch);
  const resetId = CodexReset.eventFingerprint('reset', status.latestReset);

  const previousScheduledId = previous.lastScheduledFingerprint || null;
  const previousWatchId = previous.lastWatchFingerprint || null;
  const previousResetId = previous.lastResetFingerprint || null;

  const lang = settings.language;
  let notified = false;

  if (!initializing && settings.notificationsEnabled) {
    if (settings.notifyWatch && scheduledId && scheduledId !== previousScheduledId) {
      const id = `codex-${scheduledId}`;
      const sourceUrl = scheduled.source?.url || CodexReset.SITE_URL;
      const isX = sourceUrl.includes('x.com');
      await createNotification(id, {
        type: 'basic',
        iconUrl: notificationIcon(),
        title: scheduledTitle(scheduled, lang),
        message: scheduledMessage(scheduled, lang),
        buttons: [
          { title: CodexI18n.t(isX ? 'btnViewOnX' : 'btnViewSource', null, lang) },
          { title: CodexI18n.t('btnOpenTracker', null, lang) },
        ],
        priority: 1,
      });
      await rememberNotificationLink(id, sourceUrl);
      notified = true;
    }

    if (settings.notifyWatch && watchId && watchId !== previousWatchId) {
      const id = `codex-${watchId}`;
      const sourceUrl = watch.source?.url || CodexReset.SITE_URL;
      const isX = sourceUrl.includes('x.com');
      await createNotification(id, {
        type: 'basic',
        iconUrl: notificationIcon(),
        title: watchTitle(watch, lang),
        message: watchMessage(watch, lang),
        buttons: [
          { title: CodexI18n.t(isX ? 'btnViewSignalOnX' : 'btnViewSignal', null, lang) },
          { title: CodexI18n.t('btnOpenTracker', null, lang) },
        ],
        priority: 1,
      });
      await rememberNotificationLink(id, sourceUrl);
      notified = true;
    }

    if (settings.notifyReset && resetId && resetId !== previousResetId) {
      const reset = status.latestReset;
      const id = `codex-${resetId}`;
      const sourceUrl = reset.source?.url || CodexReset.SITE_URL;
      const isX = sourceUrl.includes('x.com');
      const fallbackText = CodexI18n.t('textRecentResetFallback', null, lang);
      await createNotification(id, {
        type: 'basic',
        iconUrl: notificationIcon(),
        title: resetTitle(reset, lang),
        message: CodexReset.truncate(reset.text || fallbackText, 220),
        buttons: [
          { title: CodexI18n.t(isX ? 'btnViewOnX' : 'btnViewSource', null, lang) },
          { title: CodexI18n.t('btnOpenTracker', null, lang) },
        ],
        priority: 1,
      });
      await rememberNotificationLink(id, sourceUrl);
      notified = true;
    }

    if (notified && settings.soundEnabled) {
      await playNotificationSound();
    }
  }

  await setStorage({
    lastScheduledFingerprint: scheduledId,
    lastWatchFingerprint: watchId,
    lastResetFingerprint: resetId,
  });
}

async function updateBadge(status, lang = 'en') {
  const scheduled = CodexReset.isScheduledResetActive(status?.scheduledReset) ? status.scheduledReset : null;
  if (scheduled) {
    await ext.action.setBadgeText({ text: '!' });
    await ext.action.setBadgeBackgroundColor({ color: '#2563EB' });
    await ext.action.setTitle({ title: CodexI18n.t('badgeTitleScheduled', null, lang) });
    return;
  }

  const watch = CodexReset.isWatchActive(status?.activeWatch) ? status.activeWatch : null;
  if (watch) {
    await ext.action.setBadgeText({ text: '!' });
    await ext.action.setBadgeBackgroundColor({ color: '#F59E0B' });
    await ext.action.setTitle({ title: CodexI18n.t('badgeTitleWatch', null, lang) });
    return;
  }

  const latest = status?.latestReset;
  const recent = latest && Date.now() - Date.parse(latest.announcedAt) < 24 * 60 * 60 * 1000;
  if (recent) {
    await ext.action.setBadgeText({ text: '✓' });
    await ext.action.setBadgeBackgroundColor({ color: '#16A34A' });
    await ext.action.setTitle({ title: CodexI18n.t('badgeTitleRecent', null, lang) });
  } else {
    await ext.action.setBadgeText({ text: '' });
    await ext.action.setTitle({ title: CodexI18n.t('badgeTitleMonitoring', null, lang) });
  }
}

async function checkStatus({ force = false } = {}) {
  const now = Date.now();
  const previous = await getStorage([
    'etag',
    'status',
    'initialized',
    'lastScheduledFingerprint',
    'lastWatchFingerprint',
    'lastResetFingerprint',
    'retryAfterAt',
    'lastCheckedAt',
    'settings',
  ]);

  if (!force && previous.retryAfterAt && now < previous.retryAfterAt) {
    return { ok: false, skipped: true, reason: 'backoff' };
  }

  const headers = { accept: 'application/json' };
  if (previous.etag) headers['if-none-match'] = previous.etag;

  try {
    const response = await fetch(CodexReset.STATUS_URL, {
      method: 'GET',
      credentials: 'omit',
      cache: 'no-cache',
      headers,
    });

    const settings = await getSettings();

    if (response.status === 304 && previous.status) {
      const checkedAt = Date.now();
      await setStorage({ lastCheckedAt: checkedAt, lastError: null, retryAfterAt: null });
      await updateBadge(previous.status, settings.language);
      return { ok: true, unchanged: true, status: previous.status, checkedAt };
    }

    if (response.status === 429 || response.status === 503) {
      const retryAfterAt = CodexReset.parseRetryAfter(response.headers.get('retry-after')) || Date.now() + 30 * 60 * 1000;
      throw Object.assign(new Error(`Upstream returned HTTP ${response.status}`), { retryAfterAt });
    }

    if (!response.ok) throw new Error(`Upstream returned HTTP ${response.status}`);

    const status = CodexReset.parseStatusResponse(await response.json());
    const etag = response.headers.get('etag') || previous.etag || null;
    const checkedAt = Date.now();
    const initializing = previous.initialized !== true;

    await notifyForStatus(status, previous, settings, initializing);
    await setStorage({
      status,
      etag,
      initialized: true,
      lastCheckedAt: checkedAt,
      lastError: null,
      retryAfterAt: null,
    });
    await updateBadge(status, settings.language);

    return { ok: true, status, checkedAt, initializing };
  } catch (error) {
    const retryAfterAt = error.retryAfterAt || null;
    const lastError = {
      message: error instanceof Error ? error.message : String(error),
      at: new Date().toISOString(),
    };
    await setStorage({ lastError, ...(retryAfterAt ? { retryAfterAt } : {}) });
    return { ok: false, error: lastError };
  }
}

ext.runtime.onInstalled.addListener(() => {
  ensureAlarm().then(() => checkStatus()).catch(() => {});
});

if (ext.runtime.onStartup) {
  ext.runtime.onStartup.addListener(() => {
    ensureAlarm().then(() => checkStatus()).catch(() => {});
  });
}

ext.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === ALARM_NAME) checkStatus().catch(() => {});
});

ext.notifications.onClicked.addListener(async (notificationId) => {
  const { notificationLinks = {} } = await getStorage(['notificationLinks']);
  openTab(notificationLinks[notificationId] || CodexReset.SITE_URL);
  ext.notifications.clear(notificationId);
});

if (ext.notifications.onButtonClicked) {
  ext.notifications.onButtonClicked.addListener(async (notificationId, buttonIndex) => {
    const { notificationLinks = {} } = await getStorage(['notificationLinks']);
    const sourceUrl = notificationLinks[notificationId] || CodexReset.SITE_URL;
    if (buttonIndex === 0) {
      openTab(sourceUrl);
    } else if (buttonIndex === 1) {
      openTab(CodexReset.SITE_URL);
    }
    ext.notifications.clear(notificationId);
  });
}

ext.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (!message || typeof message !== 'object') return undefined;

  if (message.type === 'CHECK_NOW') {
    checkStatus({ force: true }).then(sendResponse);
    return true;
  }

  if (message.type === 'SETTINGS_CHANGED') {
    (async () => {
      try {
        const settings = await getSettings();
        const { status } = await getStorage(['status']);
        if (status) await updateBadge(status, settings.language);
        await ensureAlarm({ forceRecreate: true });
        sendResponse({ ok: true });
      } catch (error) {
        sendResponse({ ok: false, error: String(error) });
      }
    })();
    return true;
  }

  if (message.type === 'PLAY_TEST_SOUND') {
    playNotificationSound().then(() => sendResponse({ ok: true })).catch((err) => sendResponse({ ok: false, error: String(err) }));
    return true;
  }

  if (message.type === 'TEST_NOTIFICATION') {
    (async () => {
      try {
        const id = `codex-test-${Date.now()}`;
        const settings = await getSettings();
        const lang = settings.language;
        await createNotification(id, {
          type: 'basic',
          iconUrl: notificationIcon(),
          title: CodexI18n.t('notifTestTitle', null, lang),
          message: CodexI18n.t('notifTestMessage', null, lang),
          buttons: [
            { title: CodexI18n.t('btnOpenTracker', null, lang) },
          ],
          priority: 0,
        });
        await rememberNotificationLink(id, CodexReset.SITE_URL);
        if (settings.soundEnabled) {
          await playNotificationSound();
        }
        sendResponse({ ok: true });
      } catch (error) {
        sendResponse({ ok: false, error: String(error) });
      }
    })();
    return true;
  }

  return undefined;
});

ensureAlarm().catch(() => {});
