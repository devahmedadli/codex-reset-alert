'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');
const CodexReset = require('../shared.js');

test('parses live codex-resets.com API payload with scheduled reset and stats', () => {
  const livePayload = {
    data: {
      latest_reset: {
        id: '2098685367058612394',
        reset_type: 'regular',
        announced_at: '2026-09-12T08:09:17.000Z',
        text: 'Reset all propagated. Sweet dreams. https://t.co/VgKVUixoJG',
        source: {
          type: 'x_post',
          author: 'thsottiaux',
          url: 'https://x.com/thsottiaux/status/2098685367058612394',
        },
      },
      scheduled_reset: {
        id: '2102254445082116335',
        status: 'scheduled',
        reset_type: 'regular',
        announced_at: '2026-09-22T04:31:32.000Z',
        scheduled_for: '2026-09-23T06:59:00.000Z',
        text: 'Ladies and gentlemen... start... your... ENGINES.',
        source: {
          type: 'x_post',
          author: 'thsottiaux',
          url: 'https://x.com/thsottiaux/status/2102254445082116335',
        },
      },
      active_watch: null,
      stats: {
        total: 53,
        last_reset_at: '2026-09-12T08:09:17.000Z',
        days_since_last: 10.1,
        avg_interval_days: 6.9,
      },
    },
    meta: {
      api_version: 'v1',
      generated_at: '2026-09-22T11:11:41.667Z',
    },
  };

  const parsed = CodexReset.parseStatusResponse(livePayload);

  assert.equal(parsed.latestReset.id, '2098685367058612394');
  assert.equal(parsed.latestReset.resetType, 'regular');
  assert.equal(parsed.latestReset.announcedAt, '2026-09-12T08:09:17.000Z');
  assert.equal(parsed.latestReset.source.author, 'thsottiaux');

  assert.ok(parsed.scheduledReset);
  assert.equal(parsed.scheduledReset.id, '2102254445082116335');
  assert.equal(parsed.scheduledReset.status, 'scheduled');
  assert.equal(parsed.scheduledReset.scheduledFor, '2026-09-23T06:59:00.000Z');

  assert.equal(parsed.activeWatch, null);

  assert.ok(parsed.stats);
  assert.equal(parsed.stats.total, 53);
  assert.equal(parsed.stats.daysSinceLast, 10.1);
  assert.equal(parsed.stats.avgIntervalDays, 6.9);

  assert.equal(parsed.generatedAt, '2026-09-22T11:11:41.667Z');

  // Test active scheduled check
  assert.equal(CodexReset.isScheduledResetActive(parsed.scheduledReset, Date.parse('2026-09-22T12:00:00Z')), true);
  assert.equal(CodexReset.isScheduledResetActive(parsed.scheduledReset, Date.parse('2026-09-24T12:00:00Z')), false);
});

test('parses active watch payload correctly', () => {
  const parsed = CodexReset.parseStatusResponse({
    data: {
      latest_reset: {
        announced_at: '2026-09-12T08:09:00Z',
        text: 'Reset all propagated.',
        source: { author: 'Tibo', url: 'https://x.com/thsottiaux/status/123' },
      },
      active_watch: {
        level: 'strong',
        reset_chance_percent: 90.3,
        forecast_window: ' within 24h. ',
        observed_at: '2026-09-22T10:00:00Z',
        expires_at: '2026-09-23T10:00:00Z',
        text: 'Reset later today.',
        source: { author: 'Tibo', url: 'https://x.com/thsottiaux/status/456' },
      },
    },
  });

  assert.equal(parsed.latestReset.announcedAt, '2026-09-12T08:09:00.000Z');
  assert.equal(parsed.activeWatch.windowText, 'within 24h');
  assert.equal(parsed.activeWatch.chancePercent, 90);
  assert.equal(CodexReset.isWatchActive(parsed.activeWatch, Date.parse('2026-09-22T12:00:00Z')), true);
  assert.equal(CodexReset.isWatchActive(parsed.activeWatch, Date.parse('2026-09-24T12:00:00Z')), false);
});

test('formats Tibo time (PT) and local time properly', () => {
  const iso = '2026-09-23T06:59:00.000Z';
  const tibo = CodexReset.formatTiboTime(iso);
  assert.ok(tibo.includes('PDT') || tibo.includes('PST') || tibo.includes('PM'));
  assert.ok(tibo.includes('Sep 22'));

  const local = CodexReset.formatLocalTime(iso, 'en-US');
  assert.ok(typeof local === 'string' && local.length > 0);
});

test('fingerprints are stable and event specific', () => {
  const fp1 = CodexReset.eventFingerprint('scheduled', { id: '123', scheduledFor: '2026-09-23T06:59:00Z' });
  const fp2 = CodexReset.eventFingerprint('scheduled', { id: '123', scheduledFor: '2026-09-23T06:59:00Z' });
  const fp3 = CodexReset.eventFingerprint('scheduled', { id: '999', scheduledFor: '2026-09-23T06:59:00Z' });

  assert.equal(fp1, fp2);
  assert.notEqual(fp1, fp3);
});

test('rejects unexpected response shape', () => {
  assert.throws(() => CodexReset.parseStatusResponse(null), /Unexpected response shape/);
  assert.throws(() => CodexReset.parseStatusResponse({}), /Unexpected response shape/);
});

test('formats share text properly across different status shapes', () => {
  const now = Date.parse('2026-09-22T12:00:00Z');

  // 1. Scheduled reset
  const scheduledPayload = {
    data: {
      scheduled_reset: {
        scheduled_for: '2026-09-23T06:59:00.000Z',
        text: 'Start your engines.',
        source: { url: 'https://x.com/thsottiaux/status/123' },
      },
      latest_reset: null,
      active_watch: null,
    },
  };
  const parsedScheduled = CodexReset.parseStatusResponse(scheduledPayload);
  const scheduledShare = CodexReset.formatShareText(parsedScheduled, 'en-US', now);
  assert.ok(scheduledShare.includes('🚨 Codex Reset Scheduled'));
  assert.ok(scheduledShare.includes('Start your engines.'));
  assert.ok(scheduledShare.includes('https://x.com/thsottiaux/status/123'));

  // 2. Active watch
  const watchPayload = {
    data: {
      active_watch: {
        level: 'strong',
        reset_chance_percent: 85,
        forecast_window: 'within 24h',
        observed_at: '2026-09-22T10:00:00Z',
        expires_at: '2026-09-23T10:00:00Z',
        text: 'Heavy traffic incoming.',
        source: { url: 'https://x.com/thsottiaux/status/456' },
      },
      latest_reset: null,
      scheduled_reset: null,
    },
  };
  const parsedWatch = CodexReset.parseStatusResponse(watchPayload);
  const watchShare = CodexReset.formatShareText(parsedWatch, 'en-US', now);
  assert.ok(watchShare.includes('👀 Codex Strong Reset Signal: within 24h (85% signal)'));
  assert.ok(watchShare.includes('Heavy traffic incoming.'));
  assert.ok(watchShare.includes('https://x.com/thsottiaux/status/456'));

  // 3. Recent completed reset
  const recentPayload = {
    data: {
      latest_reset: {
        announced_at: '2026-09-22T08:00:00.000Z',
        text: 'Reset completed and live.',
        source: { url: 'https://x.com/thsottiaux/status/789' },
      },
    },
  };
  const parsedRecent = CodexReset.parseStatusResponse(recentPayload);
  const recentShare = CodexReset.formatShareText(parsedRecent, 'en-US', now);
  assert.ok(recentShare.includes('✅ Codex Reset Completed'));
  assert.ok(recentShare.includes('Reset completed and live.'));

  // 4. Standby / Empty status
  const emptyShare = CodexReset.formatShareText(null);
  assert.ok(emptyShare.includes('Codex Reset Tracker: Monitoring for resets.'));
  assert.ok(emptyShare.includes('https://codex-resets.com/'));
});

test('parses retry-after header correctly', () => {
  const now = 1000000;
  assert.equal(CodexReset.parseRetryAfter('120', now), now + 120000);
  assert.equal(CodexReset.parseRetryAfter(null, now), null);
});

test('formats share text properly in Arabic', () => {
  const now = Date.parse('2026-09-22T12:00:00Z');

  // Scheduled reset in Arabic
  const scheduledPayload = {
    data: {
      scheduled_reset: {
        scheduled_for: '2026-09-23T06:59:00.000Z',
        text: 'استعدوا لانطلاق المحركات.',
        source: { url: 'https://x.com/thsottiaux/status/123' },
      },
      latest_reset: null,
      active_watch: null,
    },
  };
  const parsedScheduled = CodexReset.parseStatusResponse(scheduledPayload);
  const scheduledShare = CodexReset.formatShareText(parsedScheduled, 'ar', now);
  assert.ok(scheduledShare.includes('🚨 تمت جدولة إعادة تعيين Codex'));
  assert.ok(scheduledShare.includes('استعدوا لانطلاق المحركات.'));
  assert.ok(scheduledShare.includes('https://x.com/thsottiaux/status/123'));

  // Watch in Arabic
  const watchPayload = {
    data: {
      active_watch: {
        level: 'strong',
        reset_chance_percent: 85,
        forecast_window: 'خلال 24 ساعة',
        observed_at: '2026-09-22T10:00:00Z',
        expires_at: '2026-09-23T10:00:00Z',
        text: 'إشارة مرتفعة قادمة.',
        source: { url: 'https://x.com/thsottiaux/status/456' },
      },
      latest_reset: null,
      scheduled_reset: null,
    },
  };
  const parsedWatch = CodexReset.parseStatusResponse(watchPayload);
  const watchShare = CodexReset.formatShareText(parsedWatch, 'ar', now);
  assert.ok(watchShare.includes('👀 مراقبة إعادة تعيين Codex (إشارة قوية لإعادة التعيين): خلال 24 ساعة (إشارة 85%)'));
  assert.ok(watchShare.includes('إشارة مرتفعة قادمة.'));

  // Recent reset in Arabic
  const recentPayload = {
    data: {
      latest_reset: {
        announced_at: '2026-09-22T08:00:00.000Z',
        text: 'اكتملت إعادة التعيين بنجاح.',
        source: { url: 'https://x.com/thsottiaux/status/789' },
      },
    },
  };
  const parsedRecent = CodexReset.parseStatusResponse(recentPayload);
  const recentShare = CodexReset.formatShareText(parsedRecent, 'ar', now);
  assert.ok(recentShare.includes('✅ اكتملت إعادة تعيين Codex'));
  assert.ok(recentShare.includes('اكتملت إعادة التعيين بنجاح.'));

  // Standby in Arabic
  const emptyShare = CodexReset.formatShareText(null, 'ar');
  assert.ok(emptyShare.includes('متتبع إعادة تعيين Codex: جاري المراقبة بحثاً عن إعادات التعيين.'));
});


