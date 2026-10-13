/* global CodexReset, CodexI18n */
'use strict';

const ext = globalThis.chrome || globalThis.browser;
const $ = (id) => document.getElementById(id);

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

function sendMessage(message) {
  return new Promise((resolve) => {
    ext.runtime.sendMessage(message, (response) => {
      const error = ext.runtime && ext.runtime.lastError;
      if (error) resolve({ ok: false, error: error.message });
      else resolve(response || { ok: false });
    });
  });
}

function openTab(url) {
  ext.tabs.create({ url });
}

let currentSourceUrl = null;
let currentStatus = null;
let currentLastError = null;
let currentLang = 'en';
let currentSettings = {};

function getActiveLanguage(settings) {
  const sysLang = (ext.i18n && typeof ext.i18n.getUILanguage === 'function' ? ext.i18n.getUILanguage() : navigator.language) || 'en';
  return CodexI18n.resolveLanguage(settings?.language, sysLang);
}

function updateLanguageUI(lang) {
  currentLang = lang;
  CodexI18n.applyToDOM(lang, document);

  const langBtn = $('langToggleButton');
  const langText = $('langButtonText');
  if (langBtn && langText) {
    if (lang === 'ar') {
      langText.textContent = 'EN';
      langBtn.title = CodexI18n.t('langToggleTitle', null, 'ar');
      langBtn.setAttribute('aria-label', 'Switch to English');
    } else {
      langText.textContent = 'عربي';
      langBtn.title = CodexI18n.t('langToggleTitle', null, 'en');
      langBtn.setAttribute('aria-label', 'التبديل إلى العربية');
    }
  }

  const langSelect = $('languageSelect');
  if (langSelect && currentSettings.language) {
    langSelect.value = currentSettings.language;
  }
}

function setDot(state) {
  $('statusDot').className = `dot ${state || ''}`.trim();
}

function renderStatus(status, lastError) {
  currentStatus = status;
  currentLastError = lastError;

  const scheduled = status && CodexReset.isScheduledResetActive(status.scheduledReset) ? status.scheduledReset : null;
  const watch = status && CodexReset.isWatchActive(status.activeWatch) ? status.activeWatch : null;
  const latest = status && status.latestReset;
  const stats = status && status.stats;

  if (scheduled) {
    setDot('scheduled');
    const type = (scheduled.resetType || scheduled.type || '').toLowerCase();
    const isBank = type.includes('bank');
    $('statusLabel').textContent = CodexI18n.t(isBank ? 'labelBankedResetScheduled' : 'labelResetScheduled', null, currentLang);

    const relativeTime = CodexReset.formatRelative(scheduled.scheduledFor, Date.now(), currentLang);
    if (relativeTime) {
      if (currentLang === 'ar') {
        const cleanRel = relativeTime.replace(/^(خلال|في غضون|بعد)\s+/i, '');
        $('statusHeadline').textContent = `خلال ${cleanRel}`;
      } else {
        const cleanRel = relativeTime.replace(/^in\s+/i, '');
        $('statusHeadline').textContent = `Within ${cleanRel}`;
      }
    } else {
      $('statusHeadline').textContent = CodexI18n.t('headlineResetScheduled', null, currentLang);
    }

    $('statusText').textContent = scheduled.text || CodexI18n.t('textScheduledFallback', null, currentLang);

    if (scheduled.scheduledFor) {
      const dt = CodexReset.formatDateTime(scheduled.scheduledFor, currentLang);
      const rel = CodexReset.formatRelative(scheduled.scheduledFor, Date.now(), currentLang);
      $('statusTime').textContent = rel ? `${dt} • ${rel}` : dt;
    } else {
      $('statusTime').textContent = scheduled.announcedAt ? CodexReset.formatRelative(scheduled.announcedAt, Date.now(), currentLang) : '';
    }

    currentSourceUrl = scheduled.source?.url || CodexReset.SITE_URL;
    $('sourceButton').classList.remove('hidden');
    const isX = (currentSourceUrl || '').includes('x.com');
    $('sourceButtonText').textContent = CodexI18n.t(isX ? 'btnViewOnX' : 'btnViewSource', null, currentLang);
  } else if (watch) {
    setDot('watch');
    $('statusLabel').textContent = CodexI18n.t(watch.level === 'strong' ? 'labelStrongResetSignal' : 'labelResetWatch', null, currentLang);
    $('statusHeadline').textContent = watch.windowText || CodexI18n.t('headlineWatch', null, currentLang);
    $('statusText').textContent = watch.text || CodexI18n.t('textWatchFallback', null, currentLang);

    if (watch.expiresAt) {
      const rel = CodexReset.formatRelative(watch.expiresAt, Date.now(), currentLang);
      $('statusTime').textContent = CodexI18n.t('expiresPrefix', { time: rel }, currentLang);
    } else if (watch.observedAt) {
      const rel = CodexReset.formatRelative(watch.observedAt, Date.now(), currentLang);
      $('statusTime').textContent = CodexI18n.t('observedPrefix', { time: rel }, currentLang);
    } else {
      $('statusTime').textContent = '';
    }

    currentSourceUrl = watch.source?.url || CodexReset.SITE_URL;
    $('sourceButton').classList.remove('hidden');
    const isX = (currentSourceUrl || '').includes('x.com');
    $('sourceButtonText').textContent = CodexI18n.t(isX ? 'btnViewSignalOnX' : 'btnViewSignal', null, currentLang);
  } else if (latest) {
    const recent = Date.now() - Date.parse(latest.announcedAt) < 24 * 60 * 60 * 1000;
    setDot(recent ? 'reset' : '');
    $('statusLabel').textContent = CodexI18n.t(recent ? 'labelRecentReset' : 'labelNoActiveWatch', null, currentLang);
    $('statusHeadline').textContent = CodexI18n.t(recent ? 'headlineRecentReset' : 'headlineNoReset', null, currentLang);
    $('statusText').textContent = recent
      ? (latest.text || CodexI18n.t('textRecentResetFallback', null, currentLang))
      : CodexI18n.t('textNoResetWatch', null, currentLang);

    if (latest.announcedAt) {
      const dt = CodexReset.formatDateTime(latest.announcedAt, currentLang);
      const rel = CodexReset.formatRelative(latest.announcedAt, Date.now(), currentLang);
      $('statusTime').textContent = rel ? `${dt} • ${rel}` : dt;
    } else {
      $('statusTime').textContent = '';
    }

    currentSourceUrl = recent ? (latest.source?.url || CodexReset.SITE_URL) : null;
    $('sourceButton').classList.toggle('hidden', !currentSourceUrl);
    if (currentSourceUrl) {
      const isX = currentSourceUrl.includes('x.com');
      $('sourceButtonText').textContent = CodexI18n.t(isX ? 'btnViewOnX' : 'btnViewSource', null, currentLang);
    }
  } else if (lastError) {
    setDot('error');
    $('statusLabel').textContent = CodexI18n.t('labelUnavailable', null, currentLang);
    $('statusHeadline').textContent = CodexI18n.t('headlineCouldNotRefresh', null, currentLang);
    $('statusText').textContent = lastError.message || CodexI18n.t('textApiErrorFallback', null, currentLang);
    $('statusTime').textContent = CodexI18n.t('statusOfflineError', null, currentLang);
    currentSourceUrl = CodexReset.SITE_URL;
    $('sourceButton').classList.remove('hidden');
    $('sourceButtonText').textContent = CodexI18n.t('btnOpenTracker', null, currentLang);
  } else {
    setDot('');
    $('statusLabel').textContent = CodexI18n.t('labelStandby', null, currentLang);
    $('statusHeadline').textContent = CodexI18n.t('headlineNoCachedStatus', null, currentLang);
    $('statusText').textContent = CodexI18n.t('textStandbyFallback', null, currentLang);
    $('statusTime').textContent = '—';
    $('sourceButton').classList.add('hidden');
  }

  // Stats Card Population
  if (latest && latest.text) {
    $('lastResetText').textContent = latest.text;
  } else {
    $('lastResetText').textContent = CodexI18n.t('statNoCachedReset', null, currentLang);
  }

  if (stats && typeof stats.total === 'number') {
    $('statTotal').textContent = stats.total.toLocaleString(currentLang);
  } else {
    $('statTotal').textContent = '—';
  }

  if (stats && typeof stats.daysSinceLast === 'number') {
    const d = stats.daysSinceLast.toFixed(1);
    $('statSinceLast').textContent = CodexI18n.t('daysUnit', { days: d }, currentLang);
  } else if (latest && latest.announcedAt) {
    const days = (Date.now() - Date.parse(latest.announcedAt)) / (24 * 60 * 60 * 1000);
    const d = Math.max(0, days).toFixed(1);
    $('statSinceLast').textContent = Number.isFinite(days) ? CodexI18n.t('daysUnit', { days: d }, currentLang) : '—';
  } else {
    $('statSinceLast').textContent = '—';
  }

  if (stats && typeof stats.avgIntervalDays === 'number') {
    const d = stats.avgIntervalDays.toFixed(1);
    $('statAvgInterval').textContent = CodexI18n.t('daysUnit', { days: d }, currentLang);
  } else {
    $('statAvgInterval').textContent = '—';
  }
}

function updateSubsettingsState(enabled) {
  const group = $('subsettingsGroup');
  if (group) {
    group.style.opacity = enabled ? '1' : '0.4';
    group.style.pointerEvents = enabled ? 'auto' : 'none';
    $('notifyWatch').disabled = !enabled;
    $('notifyReset').disabled = !enabled;
    $('soundEnabled').disabled = !enabled;
  }
}

async function load() {
  const data = await getStorage(['status', 'settings', 'lastCheckedAt', 'lastError']);
  const settings = data.settings || {};
  currentSettings = settings;

  const enabled = settings.notificationsEnabled !== false;
  $('notificationsEnabled').checked = enabled;
  $('notifyWatch').checked = settings.notifyWatch !== false;
  $('notifyReset').checked = settings.notifyReset !== false;
  $('soundEnabled').checked = settings.soundEnabled === true;
  $('intervalMinutes').value = String(Number(settings.intervalMinutes) || 15);
  if ($('languageSelect')) {
    $('languageSelect').value = settings.language || 'auto';
  }

  const activeLang = getActiveLanguage(settings);
  updateLanguageUI(activeLang);
  updateSubsettingsState(enabled);

  renderStatus(data.status || null, data.lastError || null);
  highlightActiveBadge(data.status || null);

  $('checkedAt').textContent = data.lastCheckedAt
    ? CodexI18n.t('checkedPrefix', { time: CodexReset.formatRelative(new Date(data.lastCheckedAt).toISOString(), Date.now(), currentLang) }, currentLang)
    : CodexI18n.t('notCheckedYet', null, currentLang);
}

function highlightActiveBadge(status) {
  const scheduled = CodexReset.isScheduledResetActive(status?.scheduledReset);
  const watch = CodexReset.isWatchActive(status?.activeWatch);
  const latest = status?.latestReset;
  const recent = latest && Date.now() - Date.parse(latest.announcedAt) < 24 * 60 * 60 * 1000;

  let activeId = 'guideIdle';
  if (scheduled) activeId = 'guideScheduled';
  else if (watch) activeId = 'guideWatch';
  else if (recent) activeId = 'guideRecent';

  ['guideRecent', 'guideScheduled', 'guideWatch', 'guideIdle'].forEach((id) => {
    const el = $(id);
    if (!el) return;
    const isTarget = id === activeId;
    el.classList.toggle('active', isTarget);
    const tag = el.querySelector('.badge-active-tag');
    if (tag) tag.classList.toggle('hidden', !isTarget);
  });
}

function openBadgeModal() {
  $('badgeModal')?.classList.remove('hidden');
}

function closeBadgeModal() {
  $('badgeModal')?.classList.add('hidden');
}

async function saveSettings() {
  const enabled = $('notificationsEnabled').checked;
  updateSubsettingsState(enabled);

  const selectedLang = $('languageSelect')?.value || currentSettings.language || 'auto';
  const settings = {
    notificationsEnabled: enabled,
    notifyWatch: $('notifyWatch').checked,
    notifyReset: $('notifyReset').checked,
    soundEnabled: $('soundEnabled').checked,
    intervalMinutes: Number($('intervalMinutes').value) || 15,
    language: selectedLang,
  };
  currentSettings = settings;

  const activeLang = getActiveLanguage(settings);
  updateLanguageUI(activeLang);
  renderStatus(currentStatus, currentLastError);

  await setStorage({ settings });
  await sendMessage({ type: 'SETTINGS_CHANGED' });
}

async function toggleLanguageQuick() {
  const nextLang = currentLang === 'ar' ? 'en' : 'ar';
  currentSettings.language = nextLang;
  if ($('languageSelect')) {
    $('languageSelect').value = nextLang;
  }
  await saveSettings();
}

async function copyShareText() {
  const text = CodexReset.formatShareText(currentStatus, currentLang);
  try {
    await navigator.clipboard.writeText(text);
    const btn = $('copyButton');
    const btnText = $('copyButtonText');
    if (btn && btnText) {
      btn.classList.add('copied');
      btnText.textContent = CodexI18n.t('btnCopied', null, currentLang);
      setTimeout(() => {
        btn.classList.remove('copied');
        btnText.textContent = CodexI18n.t('btnCopy', null, currentLang);
      }, 1600);
    }
  } catch (err) {
    console.error('Failed to copy text', err);
  }
}

async function refresh() {
  $('refreshButton').classList.add('loading');
  $('refreshButton').disabled = true;
  try {
    await sendMessage({ type: 'CHECK_NOW' });
    await load();
  } finally {
    $('refreshButton').disabled = false;
    $('refreshButton').classList.remove('loading');
  }
}

$('refreshButton').addEventListener('click', refresh);
$('langToggleButton')?.addEventListener('click', toggleLanguageQuick);
$('copyButton')?.addEventListener('click', copyShareText);
$('badgeGuideButton')?.addEventListener('click', openBadgeModal);
$('closeBadgeModal')?.addEventListener('click', closeBadgeModal);
$('dismissBadgeModal')?.addEventListener('click', closeBadgeModal);
$('badgeModal')?.addEventListener('click', (e) => {
  if (e.target === $('badgeModal')) closeBadgeModal();
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeBadgeModal();
});

$('sourceButton').addEventListener('click', () => openTab(currentSourceUrl || CodexReset.SITE_URL));
$('testButton').addEventListener('click', () => sendMessage({ type: 'TEST_NOTIFICATION' }));
['notificationsEnabled', 'notifyWatch', 'notifyReset', 'soundEnabled', 'intervalMinutes', 'languageSelect'].forEach((id) => {
  $(id)?.addEventListener('change', saveSettings);
});

document.addEventListener('DOMContentLoaded', async () => {
  await load();
  const { lastCheckedAt } = await getStorage(['lastCheckedAt']);
  if (!lastCheckedAt || Date.now() - lastCheckedAt > 5 * 60 * 1000) refresh();
});
