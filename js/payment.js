/*
 * payment.js — 決済まわりをここに集める(今は模擬)。
 *
 * 画面側(app.js / plan.js)は、決済について Payment の関数しか呼ばない。
 * 本物に替えるときは、下の「mockProvider」と同じ形の provider を作り、
 * Payment.setProvider(...) で差し替える。画面側は変えなくてよい。
 *
 * provider が持つ関数(どちらも Promise を返す):
 *   startSubscription({ plan })     → { ok: true, subscriptionId, startedAt } または { ok: false, message }
 *   cancelSubscription({ subscriptionId }) → { ok: true } または { ok: false, message }
 *
 * 模擬では、カード番号などは受け取らず、通信もしない。
 */
(function (global) {
  'use strict';

  // 契約できるプランの定義(金額は docs/decisions.md の決定: 月300円)。
  var PLAN = {
    name: 'このサービス(仮称)',
    price: 300,
    period: 'month'
  };

  // 模擬の provider。何も請求せず、すぐに成功を返す。
  var mockProvider = {
    name: 'mock',
    startSubscription: function (req) {
      return Promise.resolve({
        ok: true,
        subscriptionId: 'mock_' + Date.now(),
        startedAt: new Date().toISOString()
      });
    },
    cancelSubscription: function (req) {
      return Promise.resolve({ ok: true });
    }
  };

  var provider = mockProvider;

  global.Payment = {
    PLAN: PLAN,
    isMock: function () { return provider === mockProvider; },
    setProvider: function (p) { provider = p; },
    startSubscription: function (req) { return provider.startSubscription(Object.assign({ plan: PLAN }, req)); },
    cancelSubscription: function (req) { return provider.cancelSubscription(req); }
  };
})(window);
