/*
 * mail.js — 解約のお勧めメール(毎日送る)の差し込み口。今は枠だけで、何も送らない。
 *
 * 静的なページだけでは、実際のメールは送れない。本物にするときは、
 * 下の「mockProvider」と同じ形の provider を作り、Mail.setProvider(...) で差し替える。
 * 送る側(サーバーや外部のメール配信サービス)は、その provider の向こう側に置く。
 *
 * provider が持つ関数(どちらも Promise を返す):
 *   subscribe({ address })   → { ok: true } または { ok: false, message }   お勧めメールの配信を始める
 *   unsubscribe({ address }) → { ok: true } または { ok: false, message }   配信を止める
 *
 * まだ決まっていないこと(docs/decisions.md): 文面、日替わりか、
 * メールアドレスの入力方法、解約後に配信を止めるか。
 * この枠は、今はどの画面からも呼ばれていない。
 */
(function (global) {
  'use strict';

  // 模擬の provider。何も送らず、すぐに成功を返す。
  var mockProvider = {
    name: 'mock',
    subscribe: function (req) { return Promise.resolve({ ok: true }); },
    unsubscribe: function (req) { return Promise.resolve({ ok: true }); }
  };

  var provider = mockProvider;

  global.Mail = {
    isMock: function () { return provider === mockProvider; },
    setProvider: function (p) { provider = p; },
    subscribe: function (req) { return provider.subscribe(req); },
    unsubscribe: function (req) { return provider.unsubscribe(req); }
  };
})(window);
