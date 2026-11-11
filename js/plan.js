(function () {
  'use strict';

  var KEY_SELF = 'kaiyaku.self.v1';
  var UNIT_LABEL = { week: '週', month: '月', year: '年' };

  function load() {
    try { return JSON.parse(localStorage.getItem(KEY_SELF)); } catch (e) { return null; }
  }

  var plan = Payment.PLAN;
  document.getElementById('plan-name').textContent = plan.name;
  document.getElementById('plan-price').textContent =
    new Intl.NumberFormat('ja-JP').format(plan.price) + ' 円 / ' + UNIT_LABEL[plan.period];

  var cur = load();
  if (cur) {
    if (cur.endsAt) {
      var d = new Date(cur.endsAt);
      document.getElementById('already-text').textContent =
        '解約済みです。' + (d.getMonth() + 1) + '月' + d.getDate() + '日まで利用できます。';
    }
    document.getElementById('offer').hidden = true;
    document.getElementById('already').hidden = false;
    return;
  }

  var form = document.getElementById('plan-form');
  var errorBox = document.getElementById('error');

  var DAYS_YEAR = 365.25;
  var DAYS = { week: 7, month: DAYS_YEAR / 12, year: DAYS_YEAR };
  var confirmBox = document.getElementById('confirm');
  var pending = null; // 入力した利用回数

  // 1回目: 確認(恥じさせる)を出す
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var usage = Number(document.getElementById('in-usage').value);
    var unit = document.getElementById('in-usage-unit').value;
    if (!(usage >= 0)) return;
    pending = { usage: usage, usageUnit: unit };

    var monthlyUse = usage * DAYS.month / DAYS[unit];
    var priceText = new Intl.NumberFormat('ja-JP').format(plan.price);
    var text = monthlyUse > 0
      ? '月' + priceText + '円は、あなたの利用だと1回あたり' +
        new Intl.NumberFormat('ja-JP').format(Math.round(plan.price / monthlyUse)) + '円です。それでも契約しますか。'
      : '月' + priceText + '円で、利用は0回の見込みです。それでも契約しますか。';
    document.getElementById('confirm-text').textContent = text;
    document.getElementById('confirm-yes').textContent = 'はい、毎月' + priceText + '円払い続けます';
    form.hidden = true;
    confirmBox.hidden = false;
  });

  // 2回目: 小さいほうを押すと、契約する
  document.getElementById('confirm-yes').addEventListener('click', function () {
    if (!pending) return;
    var yes = document.getElementById('confirm-yes');
    yes.disabled = true;
    Payment.startSubscription({}).then(function (res) {
      if (!res || !res.ok) {
        errorBox.textContent = (res && res.message) || '契約できませんでした。';
        errorBox.hidden = false;
        form.hidden = false;
        confirmBox.hidden = true;
        yes.disabled = false;
        return;
      }
      try {
        localStorage.setItem(KEY_SELF, JSON.stringify({
          subscriptionId: res.subscriptionId,
          startedAt: res.startedAt,
          usage: pending.usage,
          usageUnit: pending.usageUnit
        }));
      } catch (err) { /* 保存できないときは、一覧に出ない */ }
      location.href = 'index.html';
    });
  });
})();
