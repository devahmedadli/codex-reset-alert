/* global CodexReset */
'use strict';

const ext = globalThis.chrome || globalThis.browser;

ext.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message && message.type === 'PLAY_AUDIO') {
    try {
      CodexReset.playMelodicChime();
      sendResponse({ ok: true });
    } catch (err) {
      sendResponse({ ok: false, error: String(err) });
    }
    return true;
  }
  return undefined;
});
