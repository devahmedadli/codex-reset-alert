(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  root.CodexReset = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const STATUS_URL = 'https://codex-resets.com/api/v1/status';
  const SITE_URL = 'https://codex-resets.com/';

  function isHttpUrl(value) {
    if (typeof value !== 'string' || !value) return false;
    try {
      const url = new URL(value);
      return url.protocol === 'https:' || url.protocol === 'http:';
    } catch {
      return false;
    }
  }

  function normalizeSource(raw) {
    if (!raw || typeof raw !== 'object') return null;
    const url = isHttpUrl(raw.url) ? raw.url : null;
    if (!url) return null;
    return {
      type: typeof raw.type === 'string' ? raw.type : '',
      author: typeof raw.author === 'string' ? raw.author : '',
      url,
    };
  }

  function parseIso(value) {
    if (typeof value !== 'string') return null;
    const ms = Date.parse(value);
    return Number.isFinite(ms) ? new Date(ms).toISOString() : null;
  }

  function normalizeWindow(value) {
    if (typeof value !== 'string') return '';
    return value.replace(/\s+/g, ' ').trim().replace(/[.。]+$/, '').trim();
  }

  function normalizeText(value) {
    return typeof value === 'string' ? value.replace(/\s+/g, ' ').trim() : '';
  }

  function clampChance(value) {
    if (typeof value !== 'number' || !Number.isFinite(value)) return null;
    return Math.max(0, Math.min(100, Math.round(value)));
  }

  function parseStatusResponse(payload) {
    if (!payload || typeof payload !== 'object' || !payload.data || typeof payload.data !== 'object') {
      throw new Error('Unexpected response shape from codex-resets.com');
    }

    const data = payload.data;
    let latestReset = null;
    let scheduledReset = null;
    let activeWatch = null;
    let stats = null;

    if (data.latest_reset && typeof data.latest_reset === 'object') {
      const announcedAt = parseIso(data.latest_reset.announced_at);
      if (announcedAt) {
        const resetType = typeof data.latest_reset.reset_type === 'string'
          ? data.latest_reset.reset_type
          : (typeof data.latest_reset.type === 'string' ? data.latest_reset.type : null);

        latestReset = {
          id: typeof data.latest_reset.id === 'string' ? data.latest_reset.id : null,
          resetType,
          type: resetType,
          announcedAt,
          text: normalizeText(data.latest_reset.text),
          source: normalizeSource(data.latest_reset.source),
        };
      }
    }

    if (data.scheduled_reset && typeof data.scheduled_reset === 'object') {
      const announcedAt = parseIso(data.scheduled_reset.announced_at);
      const scheduledFor = parseIso(data.scheduled_reset.scheduled_for);

      if (announcedAt || scheduledFor) {
        const resetType = typeof data.scheduled_reset.reset_type === 'string'
          ? data.scheduled_reset.reset_type
          : (typeof data.scheduled_reset.type === 'string' ? data.scheduled_reset.type : null);

        scheduledReset = {
          id: typeof data.scheduled_reset.id === 'string' ? data.scheduled_reset.id : null,
          status: typeof data.scheduled_reset.status === 'string' ? data.scheduled_reset.status : 'scheduled',
          resetType,
          type: resetType,
          announcedAt,
          scheduledFor,
          text: normalizeText(data.scheduled_reset.text),
          source: normalizeSource(data.scheduled_reset.source),
        };
      }
    }

    if (data.active_watch && typeof data.active_watch === 'object') {
      const observedAt = parseIso(data.active_watch.observed_at);
      const expiresAt = parseIso(data.active_watch.expires_at);
      const windowText = normalizeWindow(data.active_watch.forecast_window);

      if (observedAt && expiresAt && windowText) {
        activeWatch = {
          level: typeof data.active_watch.level === 'string' ? data.active_watch.level : null,
          chancePercent: clampChance(data.active_watch.reset_chance_percent),
          windowText,
          observedAt,
          expiresAt,
          text: normalizeText(data.active_watch.text),
          source: normalizeSource(data.active_watch.source),
        };
      }
    }

    if (data.stats && typeof data.stats === 'object') {
      stats = {
        total: typeof data.stats.total === 'number' ? data.stats.total : null,
        lastResetAt: parseIso(data.stats.last_reset_at),
        daysSinceLast: typeof data.stats.days_since_last === 'number' ? data.stats.days_since_last : null,
        avgIntervalDays: typeof data.stats.avg_interval_days === 'number' ? data.stats.avg_interval_days : null,
      };
    }

    const generatedAt = parseIso(payload.meta && payload.meta.generated_at)
      || parseIso(payload.generated_at)
      || parseIso(data.generated_at);

    return {
      latestReset,
      scheduledReset,
      activeWatch,
      stats,
      generatedAt,
    };
  }

  function isScheduledResetActive(scheduled, nowMs = Date.now()) {
    if (!scheduled || !scheduled.scheduledFor) return false;
    const target = Date.parse(scheduled.scheduledFor);
    if (!Number.isFinite(target)) return false;
    // Active if the target time is in the future, or was reached within the last 2 hours
    return target > nowMs - 2 * 60 * 60 * 1000;
  }

  function isWatchActive(watch, nowMs = Date.now()) {
    if (!watch || !watch.expiresAt) return false;
    const expires = Date.parse(watch.expiresAt);
    return Number.isFinite(expires) && expires > nowMs;
  }

  function hashString(input) {
    let hash = 0x811c9dc5;
    const text = String(input);
    for (let i = 0; i < text.length; i += 1) {
      hash ^= text.charCodeAt(i);
      hash = Math.imul(hash, 0x01000193);
    }
    return (hash >>> 0).toString(16).padStart(8, '0');
  }

  function eventFingerprint(kind, event) {
    if (!event) return null;
    const id = event.id || '';
    const time = event.announcedAt || event.scheduledFor || event.observedAt || event.expiresAt || '';
    const source = event.source && event.source.url ? event.source.url : '';
    const text = event.text || event.windowText || '';
    return `${kind}-${hashString(`${id}|${time}|${source}|${text}`)}`;
  }

  function formatDateTime(iso, locale) {
    if (!iso) return 'Unknown';
    const date = new Date(iso);
    if (!Number.isFinite(date.getTime())) return 'Unknown';
    return new Intl.DateTimeFormat(locale || undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(date);
  }

  function formatTiboTime(iso) {
    if (!iso) return '';
    const date = new Date(iso);
    if (!Number.isFinite(date.getTime())) return '';
    return new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/Los_Angeles',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      timeZoneName: 'short',
    }).format(date);
  }

  function formatLocalTime(iso, locale) {
    if (!iso) return '';
    const date = new Date(iso);
    if (!Number.isFinite(date.getTime())) return '';
    return new Intl.DateTimeFormat(locale || undefined, {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      timeZoneName: 'short',
    }).format(date);
  }

  function formatRelative(iso, nowMs = Date.now(), locale) {
    if (!iso) return '';
    const target = Date.parse(iso);
    if (!Number.isFinite(target)) return '';
    const delta = target - nowMs;
    const abs = Math.abs(delta);
    let unit = 'minute';
    let divisor = 60 * 1000;
    if (abs >= 24 * 60 * 60 * 1000) {
      unit = 'day';
      divisor = 24 * 60 * 60 * 1000;
    } else if (abs >= 60 * 60 * 1000) {
      unit = 'hour';
      divisor = 60 * 60 * 1000;
    }
    const value = Math.round(delta / divisor);
    return new Intl.RelativeTimeFormat(locale || undefined, { numeric: 'auto' }).format(value, unit);
  }

  function truncate(text, max = 180) {
    const value = normalizeText(text);
    if (value.length <= max) return value;
    return `${value.slice(0, Math.max(0, max - 1)).trim()}…`;
  }

  function parseRetryAfter(value, nowMs = Date.now()) {
    if (!value) return null;
    const seconds = Number(value);
    if (Number.isFinite(seconds) && seconds >= 0) return nowMs + seconds * 1000;
    const date = Date.parse(value);
    return Number.isFinite(date) ? date : null;
  }

  function formatShareText(status, locale, nowMs = Date.now()) {
    const isAr = typeof locale === 'string' && locale.toLowerCase().startsWith('ar');

    if (!status) {
      return isAr
        ? `متتبع إعادة تعيين Codex: جاري المراقبة بحثاً عن إعادات التعيين.\n🔗 ${SITE_URL}`
        : `Codex Reset Tracker: Monitoring for resets.\n🔗 ${SITE_URL}`;
    }

    const scheduled = isScheduledResetActive(status.scheduledReset, nowMs) ? status.scheduledReset : null;
    const watch = isWatchActive(status.activeWatch, nowMs) ? status.activeWatch : null;
    const latest = status.latestReset;

    if (scheduled) {
      const type = (scheduled.resetType || scheduled.type || '').toLowerCase();
      let title;
      if (isAr) {
        title = type.includes('bank') ? 'إعادة تعيين مجمعة مجدولة لـ Codex' : 'تمت جدولة إعادة تعيين Codex';
      } else {
        title = type.includes('bank') ? 'Banked Codex Reset Scheduled' : 'Codex Reset Scheduled';
      }
      const rel = formatRelative(scheduled.scheduledFor, nowMs, locale);
      const local = formatLocalTime(scheduled.scheduledFor, locale);
      const tibo = formatTiboTime(scheduled.scheduledFor);
      let timeStr;
      if (isAr) {
        timeStr = local && tibo ? `${local} (${tibo} PT)` : (local || rel || 'قريباً');
      } else {
        timeStr = local && tibo ? `${local} (${tibo} Tibo PT)` : (local || rel || 'Upcoming');
      }
      const lines = [`🚨 ${title}: ${timeStr}${rel ? ` (${rel})` : ''}`];
      if (scheduled.text) lines.push(`> "${scheduled.text}"`);
      const url = scheduled.source?.url || SITE_URL;
      lines.push(`🔗 ${url}`);
      return lines.join('\n');
    }

    if (watch) {
      let level;
      if (isAr) {
        level = watch.level === 'strong' ? 'إشارة قوية لإعادة التعيين' : 'مراقبة إعادة التعيين نشطة';
      } else {
        level = watch.level === 'strong' ? 'Strong Reset Signal' : 'Reset Watch Active';
      }
      const lines = [isAr ? `👀 مراقبة إعادة تعيين Codex (${level}): ${watch.windowText}` : `👀 Codex ${level}: ${watch.windowText}`];
      if (typeof watch.chancePercent === 'number') {
        lines[0] += isAr ? ` (إشارة ${watch.chancePercent}%)` : ` (${watch.chancePercent}% signal)`;
      }
      if (watch.text) lines.push(`> "${watch.text}"`);
      const url = watch.source?.url || SITE_URL;
      lines.push(`🔗 ${url}`);
      return lines.join('\n');
    }

    if (latest) {
      const isRecent = nowMs - Date.parse(latest.announcedAt) < 24 * 60 * 60 * 1000;
      const rel = formatRelative(latest.announcedAt, nowMs, locale);
      const dt = formatDateTime(latest.announcedAt, locale);
      let prefix;
      if (isAr) {
        prefix = isRecent ? '✅ اكتملت إعادة تعيين Codex' : 'متتبع إعادة تعيين Codex';
      } else {
        prefix = isRecent ? '✅ Codex Reset Completed' : 'Codex Reset Tracker';
      }
      const lines = [`${prefix}: ${dt}${rel ? ` (${rel})` : ''}`];
      if (latest.text) lines.push(`> "${latest.text}"`);
      const url = latest.source?.url || SITE_URL;
      lines.push(`🔗 ${url}`);
      return lines.join('\n');
    }

    return isAr
      ? `متتبع إعادة تعيين Codex: جاري المراقبة بحثاً عن إعادات التعيين.\n🔗 ${SITE_URL}`
      : `Codex Reset Tracker: Monitoring for resets.\n🔗 ${SITE_URL}`;
  }

  function playMelodicChime(audioCtx) {
    try {
      const AudioCtxClass = globalThis.AudioContext || globalThis.webkitAudioContext;
      if (!AudioCtxClass) return;
      const ctx = audioCtx || new AudioCtxClass();
      if (ctx.state === 'suspended') ctx.resume();

      const now = ctx.currentTime;
      // Tone 1: D5 (587.33 Hz)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(587.33, now);
      gain1.gain.setValueAtTime(0.15, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.35);

      // Tone 2: A5 (880.00 Hz)
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(880, now + 0.12);
      gain2.gain.setValueAtTime(0.18, now + 0.12);
      gain2.gain.exponentialRampToValueAtTime(0.0001, now + 0.65);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.12);
      osc2.stop(now + 0.65);
    } catch {
      // Audio playback fails gracefully if unpermitted
    }
  }

  return {
    STATUS_URL,
    SITE_URL,
    parseStatusResponse,
    isScheduledResetActive,
    isWatchActive,
    eventFingerprint,
    formatDateTime,
    formatTiboTime,
    formatLocalTime,
    formatRelative,
    formatShareText,
    playMelodicChime,
    truncate,
    parseRetryAfter,
  };
});
