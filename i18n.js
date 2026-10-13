(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  root.CodexI18n = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const MESSAGES = {
    en: {
      extName: 'Codex Reset Alert',
      brandSubtitle: 'Stay ahead of Codex engine resets.',
      badgeGuideButtonTitle: 'Icon Badge Meanings',
      refreshButtonTitle: 'Refresh now',
      langToggleTitle: 'Switch to Arabic / التبديل إلى العربية',
      langToggleLabel: 'عربي',
      labelRecentReset: 'RECENT RESET',
      labelResetScheduled: 'RESET SCHEDULED',
      labelBankedResetScheduled: 'BANKED RESET SCHEDULED',
      labelResetWatch: 'RESET WATCH',
      labelStrongResetSignal: 'STRONG RESET SIGNAL',
      labelNoActiveWatch: 'NO ACTIVE RESET WATCH',
      labelUnavailable: 'UNAVAILABLE',
      labelStandby: 'STANDBY',
      headlineRecentReset: 'A reset was recently reported',
      headlineResetScheduled: 'Reset scheduled',
      headlineWithin: 'Within {time}',
      headlineWatch: 'Reset may be coming soon',
      headlineNoReset: 'No reset currently announced',
      headlineCouldNotRefresh: 'Could not refresh status',
      headlineNoCachedStatus: 'No cached status yet',
      textRecentResetFallback: 'A public reset event was reported.',
      textNoResetWatch: 'We will notify you when a new public reset watch appears.',
      textScheduledFallback: 'An upcoming reset has been announced.',
      textWatchFallback: 'A public reset signal is active.',
      textApiErrorFallback: 'The public reset API could not be reached.',
      textStandbyFallback: 'Refresh to check the public reset tracker.',
      statusOfflineError: 'Offline / Error',
      expiresPrefix: 'Expires {time}',
      observedPrefix: 'Observed {time}',
      btnCopy: 'Copy',
      btnCopied: 'Copied! ✓',
      btnCopyTitle: 'Copy formatted alert summary',
      btnViewOnX: 'View on X ↗',
      btnViewSignalOnX: 'View Signal on X ↗',
      btnViewSource: 'View Source ↗',
      btnViewSignal: 'View Signal ↗',
      btnOpenTracker: 'Open codex-resets.com ↗',
      statLatestResetLabel: 'LATEST RESET',
      statNoCachedReset: 'No cached reset yet.',
      statRecordedResets: 'recorded resets',
      statSinceLast: 'since last',
      statAvgInterval: 'avg interval',
      daysUnit: '{days}d',
      settingsTitle: 'Notifications',
      settingsDesc: 'Get notified about scheduled and completed resets.',
      settingWatchTitle: 'Watches & Schedules',
      settingWatchDesc: 'Notify when a reset is scheduled or expected.',
      settingResetTitle: 'Completed resets',
      settingResetDesc: 'Notify when a reset is confirmed as completed.',
      settingSoundTitle: 'Audio chime alert',
      settingSoundDesc: 'Play a short sound when a notification is received.',
      settingLangTitle: 'Language',
      settingLangDesc: 'Choose English or Arabic interface.',
      langAuto: 'Auto (System)',
      langEn: 'English',
      langAr: 'العربية',
      checkEvery: 'Check every',
      interval5m: '5m',
      interval15m: '15m',
      interval30m: '30m',
      interval1h: '1h',
      btnTestNotification: 'Test notification',
      checkedPrefix: 'Checked {time}',
      notCheckedYet: 'Not checked yet',
      byAuthor: 'by Ahmed Adli',
      modalTitle: 'Icon Badge Meanings',
      modalCloseAria: 'Close guide',
      modalDesc: 'Overview of what the extension icon badges indicate on your browser toolbar:',
      badgeRecentTitle: 'Recent Reset Complete',
      badgeActiveTag: 'Active Now',
      badgeRecentDesc: 'A Codex reset event occurred or was announced within the last 24 hours.',
      badgeScheduledTitle: 'Reset Scheduled',
      badgeScheduledDesc: 'An upcoming reset has been scheduled with an announced target date or time.',
      badgeWatchTitle: 'Reset Watch Active',
      badgeWatchDesc: 'A public reset signal or elevated chance window is currently active.',
      badgeIdleTitle: 'Monitoring / Standby',
      badgeIdleDesc: 'No active watch or recent reset; periodically checking in the background.',
      modalCreditDevelopedBy: 'Developed by',
      modalBtnGotIt: 'Got it',
      notifScheduledTitle: 'Codex reset scheduled',
      notifBankedScheduledTitle: 'Codex banked reset scheduled',
      notifWatchLikelySoon: 'Codex reset likely soon',
      notifWatchAnnounced: 'Codex reset watch announced',
      notifBankedAnnouncedTitle: 'Codex banked reset announced',
      notifResetUpdateTitle: 'Codex reset update',
      notifTestTitle: 'Codex Reset Alert is ready',
      notifTestMessage: 'You will be notified when a new reset watch or reset event appears.',
      notifScheduledPrefix: 'Scheduled {relative}',
      notifSignalSuffix: '{windowText} · {chance}% signal',
      badgeTitleScheduled: 'Codex Reset Alert: Reset scheduled (!)',
      badgeTitleWatch: 'Codex Reset Alert: Reset watch active (!)',
      badgeTitleRecent: 'Codex Reset Alert: Reset completed recently (✓)',
      badgeTitleMonitoring: 'Codex Reset Alert: Monitoring for resets',
      shareScheduledBanked: '🚨 Banked Codex Reset Scheduled',
      shareScheduledRegular: '🚨 Codex Reset Scheduled',
      shareWatchStrong: '👀 Codex Strong Reset Signal',
      shareWatchRegular: '👀 Codex Reset Watch Active',
      shareRecentCompleted: '✅ Codex Reset Completed',
      shareTrackerFallback: 'Codex Reset Tracker: Monitoring for resets.',
    },
    ar: {
      extName: 'منبه إعادة تعيين Codex',
      brandSubtitle: 'تابع إعادات تعيين استخدام Codex أولاً بأول.',
      badgeGuideButtonTitle: 'معاني شارات الأيقونة',
      refreshButtonTitle: 'تحديث الآن',
      langToggleTitle: 'Switch to English / التبديل إلى الإنجليزية',
      langToggleLabel: 'EN',
      labelRecentReset: 'إعادة تعيين حديثة',
      labelResetScheduled: 'إعادة تعيين مجدولة',
      labelBankedResetScheduled: 'إعادة تعيين مجمعة مجدولة',
      labelResetWatch: 'مراقبة إعادة التعيين',
      labelStrongResetSignal: 'إشارة قوية لإعادة التعيين',
      labelNoActiveWatch: 'لا توجد مراقبة نشطة',
      labelUnavailable: 'غير متوفر',
      labelStandby: 'في وضع الاستعداد',
      headlineRecentReset: 'تم الإبلاغ عن إعادة تعيين مؤخراً',
      headlineResetScheduled: 'تمت جدولة إعادة التعيين',
      headlineWithin: 'خلال {time}',
      headlineWatch: 'قد تتم إعادة التعيين قريباً',
      headlineNoReset: 'لم يُعلن عن أي إعادة تعيين حالياً',
      headlineCouldNotRefresh: 'تعذر تحديث الحالة',
      headlineNoCachedStatus: 'لا توجد حالة محفوظة بعد',
      textRecentResetFallback: 'تم الإبلاغ عن حدث إعادة تعيين عام.',
      textNoResetWatch: 'سنقوم بإشعارك فور ظهور أي مراقبة جديدة لإعادة التعيين.',
      textScheduledFallback: 'تم الإعلان عن إعادة تعيين قادمة.',
      textWatchFallback: 'إشارة إعادة تعيين عامة نشطة حالياً.',
      textApiErrorFallback: 'تعذر الاتصال بواجهة API العامة لإعادة التعيين.',
      textStandbyFallback: 'قم بالتحديث للتحقق من متتبع إعادة التعيين العام.',
      statusOfflineError: 'غير متصل / خطأ',
      expiresPrefix: 'ينتهي {time}',
      observedPrefix: 'لوحظ {time}',
      btnCopy: 'نسخ',
      btnCopied: 'تم النسخ! ✓',
      btnCopyTitle: 'نسخ ملخص التنبيه المنسق',
      btnViewOnX: 'عرض على X ↗',
      btnViewSignalOnX: 'عرض الإشارة على X ↗',
      btnViewSource: 'عرض المصدر ↗',
      btnViewSignal: 'عرض الإشارة ↗',
      btnOpenTracker: 'فتح codex-resets.com ↗',
      statLatestResetLabel: 'آخر إعادة تعيين',
      statNoCachedReset: 'لا توجد إعادة تعيين محفوظة بعد.',
      statRecordedResets: 'إعادات مسجلة',
      statSinceLast: 'منذ الأخيرة',
      statAvgInterval: 'متوسط الفارق',
      daysUnit: '{days} يوم',
      settingsTitle: 'الإشعارات',
      settingsDesc: 'احصل على تنبيهات بشأن إعادات التعيين المجدولة والمكتملة.',
      settingWatchTitle: 'المراقبة والمواعيد',
      settingWatchDesc: 'تنبيه عند جدولة موعد أو توقع إعادة تعيين.',
      settingResetTitle: 'الإعادات المكتملة',
      settingResetDesc: 'تنبيه عند تأكيد اكتمال إعادة التعيين.',
      settingSoundTitle: 'تنبيه صوتي نغمي',
      settingSoundDesc: 'تشغيل نغمة خفيفة عند استلام أي إشعار.',
      settingLangTitle: 'اللغة',
      settingLangDesc: 'اختيار واجهة باللغة الإنجليزية أو العربية.',
      langAuto: 'تلقائي (حسب النظام)',
      langEn: 'English',
      langAr: 'العربية',
      checkEvery: 'الفحص كل',
      interval5m: '٥ دقائق',
      interval15m: '١٥ دقيقة',
      interval30m: '٣٠ دقيقة',
      interval1h: 'ساعة واحدة',
      btnTestNotification: 'اختبار التنبيه',
      checkedPrefix: 'تم الفحص {time}',
      notCheckedYet: 'لم يتم الفحص بعد',
      byAuthor: 'تطوير أحمد عدلي',
      modalTitle: 'معاني شارات الأيقونة',
      modalCloseAria: 'إغلاق الدليل',
      modalDesc: 'دليل يوضح دلالات الشارات على أيقونة الإضافة في شريط الأدوات:',
      badgeRecentTitle: 'اكتمال إعادة تعيين حديثة',
      badgeActiveTag: 'نشط الآن',
      badgeRecentDesc: 'حدثت إعادة تعيين أو تم الإعلان عنها خلال آخر 24 ساعة.',
      badgeScheduledTitle: 'إعادة تعيين مجدولة',
      badgeScheduledDesc: 'تمت جدولة موعد لإعادة التعيين مع تحديد تاريخ أو وقت مستهدف.',
      badgeWatchTitle: 'مراقبة إعادة التعيين نشطة',
      badgeWatchDesc: 'إشارة عامة أو احتمالية مرتفعة لإعادة التعيين نشطة حالياً.',
      badgeIdleTitle: 'مراقبة / وضع الاستعداد',
      badgeIdleDesc: 'لا توجد مراقبة نشطة أو إعادة حديثة؛ يجري الفحص دورياً في الخلفية.',
      modalCreditDevelopedBy: 'تطوير',
      modalBtnGotIt: 'فهمت',
      notifScheduledTitle: 'تمت جدولة إعادة تعيين Codex',
      notifBankedScheduledTitle: 'تمت جدولة إعادة تعيين مجمعة لـ Codex',
      notifWatchLikelySoon: 'إعادة تعيين Codex محتملة قريباً',
      notifWatchAnnounced: 'تم الإعلان عن مراقبة إعادة تعيين Codex',
      notifBankedAnnouncedTitle: 'إعلان عن إعادة تعيين مجمعة لـ Codex',
      notifResetUpdateTitle: 'تحديث إعادة تعيين Codex',
      notifTestTitle: 'منبه إعادة تعيين Codex جاهز',
      notifTestMessage: 'سيصلك إشعار فور ظهور أي إشارة مراقبة أو إعادة تعيين جديدة.',
      notifScheduledPrefix: 'مجدول {relative}',
      notifSignalSuffix: '{windowText} · إشارة {chance}%',
      badgeTitleScheduled: 'منبه إعادة تعيين Codex: تمت جدولة إعادة تعيين (!)',
      badgeTitleWatch: 'منبه إعادة تعيين Codex: مراقبة إعادة التعيين نشطة (!)',
      badgeTitleRecent: 'منبه إعادة تعيين Codex: اكتملت إعادة التعيين مؤخراً (✓)',
      badgeTitleMonitoring: 'منبه إعادة تعيين Codex: جاري المراقبة',
      shareScheduledBanked: '🚨 تمت جدولة إعادة تعيين مجمعة لـ Codex',
      shareScheduledRegular: '🚨 تمت جدولة إعادة تعيين Codex',
      shareWatchStrong: '👀 إشارة قوية لإعادة تعيين Codex',
      shareWatchRegular: '👀 مراقبة إعادة تعيين Codex نشطة',
      shareRecentCompleted: '✅ اكتملت إعادة تعيين Codex',
      shareTrackerFallback: 'متتبع إعادة تعيين Codex: جاري المراقبة بحثاً عن إعادات التعيين.',
    },
  };

  function resolveLanguage(setting, fallbackLang = 'en') {
    if (setting === 'ar' || setting === 'en') return setting;
    const candidate = (setting === 'auto' || !setting) ? fallbackLang : setting;
    if (typeof candidate === 'string' && candidate.toLowerCase().startsWith('ar')) {
      return 'ar';
    }
    return 'en';
  }

  function getDirection(lang) {
    return lang === 'ar' ? 'rtl' : 'ltr';
  }

  function t(key, params, lang = 'en') {
    const locale = lang === 'ar' ? 'ar' : 'en';
    let text = (MESSAGES[locale] && MESSAGES[locale][key])
      || (MESSAGES.en && MESSAGES.en[key])
      || key;

    if (params && typeof params === 'object') {
      for (const [k, v] of Object.entries(params)) {
        text = text.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v));
      }
    }
    return text;
  }

  function applyToDOM(lang, doc = (typeof document !== 'undefined' ? document : null)) {
    if (!doc) return;
    const locale = lang === 'ar' ? 'ar' : 'en';
    const dir = getDirection(locale);

    if (doc.documentElement) {
      doc.documentElement.lang = locale;
      doc.documentElement.dir = dir;
    }
    if (doc.body) {
      doc.body.dir = dir;
    }

    doc.querySelectorAll('[data-i18n]').forEach((el) => {
      const key = el.getAttribute('data-i18n');
      if (key) el.textContent = t(key, null, locale);
    });

    doc.querySelectorAll('[data-i18n-title]').forEach((el) => {
      const key = el.getAttribute('data-i18n-title');
      if (key) el.setAttribute('title', t(key, null, locale));
    });

    doc.querySelectorAll('[data-i18n-aria]').forEach((el) => {
      const key = el.getAttribute('data-i18n-aria');
      if (key) el.setAttribute('aria-label', t(key, null, locale));
    });
  }

  return {
    MESSAGES,
    resolveLanguage,
    getDirection,
    t,
    applyToDOM,
  };
});
