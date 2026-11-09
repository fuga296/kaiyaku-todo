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

  if (load()) {
    document.getElementById('offer').hidden = true;
    document.getElementById('already').hidden = false;
    return;
  }

  var form = document.getElementById('plan-form');
  var errorBox = document.getElementById('error');
  var submit = document.getElementById('submit');

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var usage = Number(document.getElementById('in-usage').value);
    var unit = document.getElementById('in-usage-unit').value;
    if (!(usage >= 0)) return;
    errorBox.hidden = true;
    submit.disabled = true;

    Payment.startSubscription({}).then(function (res) {
      if (!res || !res.ok) {
        errorBox.textContent = (res && res.message) || '契約できませんでした。';
        errorBox.hidden = false;
        submit.disabled = false;
        return;
      }
      try {
        localStorage.setItem(KEY_SELF, JSON.stringify({
          subscriptionId: res.subscriptionId,
          startedAt: res.startedAt,
          usage: usage,
          usageUnit: unit
        }));
      } catch (err) { /* 保存できないときは、一覧に出ない */ }
      location.href = 'index.html';
    });
  });
})();
