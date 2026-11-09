(function () {
  'use strict';

  // 1か月 = 365.25 / 12 日(docs/decisions.md)
  var DAYS_YEAR = 365.25;
  var DAYS = { week: 7, month: DAYS_YEAR / 12, year: DAYS_YEAR };
  var UNIT_LABEL = { week: '週', month: '月', year: '年' };

  var KEY_ITEMS = 'kaiyaku.items.v1';
  var KEY_CAP = 'kaiyaku.cap.v1';
  var KEY_SELF = 'kaiyaku.self.v1'; // このサービス自身の契約(plan.js が書く)

  // 例の契約(初回だけ入る。名前の頭に「例:」を付けている)
  var SAMPLE = [
    { name: '例: 動画配信A', price: 1490, priceUnit: 'month', usage: 12, usageUnit: 'month' },
    { name: '例: 音楽配信B', price: 980, priceUnit: 'month', usage: 5, usageUnit: 'week' },
    { name: '例: ジムC', price: 8800, priceUnit: 'month', usage: 1, usageUnit: 'month' },
    { name: '例: 学習アプリD', price: 12000, priceUnit: 'year', usage: 0, usageUnit: 'month' },
    { name: '例: ストレージE', price: 400, priceUnit: 'month', usage: 200, usageUnit: 'year' }
  ];

  // ---- 保存 ----
  function load(key) {
    try { return JSON.parse(localStorage.getItem(key)); } catch (e) { return null; }
  }
  function save(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) { /* 保存できなくても動かす */ }
  }

  var items = load(KEY_ITEMS);
  if (!Array.isArray(items)) {
    items = SAMPLE.map(function (s, i) { return Object.assign({ id: 'sample' + i }, s); });
    save(KEY_ITEMS, items);
  }
  var cap = load(KEY_CAP);
  if (typeof cap !== 'number') cap = null;

  // このサービス自身の契約(契約した場合だけ、契約一覧に1件入る)
  var self = load(KEY_SELF);
  if (!self || typeof self.usage !== 'number') self = null;

  function list() {
    if (!self) return items;
    return items.concat([{
      id: 'self',
      name: Payment.PLAN.name,
      price: Payment.PLAN.price,
      priceUnit: Payment.PLAN.period,
      usage: self.usage,
      usageUnit: self.usageUnit
    }]);
  }

  // 上部のボタン(契約前だけ「グレードアップ」、契約後は表示だけ)
  function renderSlot() {
    var slot = document.getElementById('upgrade-slot');
    if (!slot) return;
    slot.textContent = '';
    if (self) {
      slot.appendChild(el('span', 'status', 'ご契約中'));
    } else {
      var a = el('a', 'btn', 'グレードアップ');
      a.href = 'plan.html';
      slot.appendChild(a);
    }
  }

  // ---- 計算 ----
  function monthlyPrice(it) { return it.price * DAYS.month / DAYS[it.priceUnit]; }
  function monthlyUsage(it) { return it.usage * DAYS.month / DAYS[it.usageUnit]; }
  function perUse(it) {
    var u = monthlyUsage(it);
    return u > 0 ? monthlyPrice(it) / u : Infinity; // 0回は最も高い扱い
  }

  var yen = new Intl.NumberFormat('ja-JP', { maximumFractionDigits: 0 });
  var dec = new Intl.NumberFormat('ja-JP', { maximumFractionDigits: 1 });
  function fmtYen(n) { return yen.format(Math.round(n)) + ' 円'; }

  // ---- 表の部品 ----
  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  }
  function head(table, cols) {
    table.textContent = '';
    var tr = el('tr');
    cols.forEach(function (c) { tr.appendChild(el('th', c.num ? 'num' : '', c.label)); });
    var thead = el('thead');
    thead.appendChild(tr);
    table.appendChild(thead);
    return table.appendChild(el('tbody'));
  }
  function emptyRow(tbody, span, text, ok) {
    var tr = el('tr');
    var td = el('td', 'empty' + (ok ? ' ok' : ''), text);
    td.colSpan = span;
    tr.appendChild(td);
    tbody.appendChild(tr);
  }
  function cell(tr, cls, text) { tr.appendChild(el('td', cls, text)); }

  function byNumberDesc(fn, tie) {
    return function (a, b) {
      var x = fn(a), y = fn(b);
      if (x === y) return tie ? tie(a, b) : 0;
      return y > x ? 1 : -1;
    };
  }

  // ---- 描画 ----
  function render() {
    renderSlot();
    var total = list().reduce(function (s, it) { return s + monthlyPrice(it); }, 0);

    document.getElementById('sum-count').textContent = list().length + ' 件';
    document.getElementById('sum-total').textContent = fmtYen(total);
    var diff = document.getElementById('sum-diff');
    diff.className = '';
    if (cap == null) {
      diff.textContent = '-';
    } else if (total > cap) {
      diff.textContent = fmtYen(total - cap) + ' 超過';
      diff.className = 'over';
    } else {
      diff.textContent = '上限内';
      diff.className = 'ok';
    }

    renderAll();
    renderL1(total);
    renderL2();
    renderL3();
  }

  function renderAll() {
    var t = document.getElementById('t-all');
    var tb = head(t, [
      { label: '契約名' },
      { label: '料金', num: true },
      { label: '月額に直すと', num: true },
      { label: '利用回数', num: true },
      { label: '月の回数に直すと', num: true },
      { label: '' }
    ]);
    if (!list().length) { emptyRow(tb, 6, '契約が登録されていません。'); return; }
    list().forEach(function (it) {
      var tr = el('tr');
      cell(tr, 'name', it.name);
      cell(tr, 'num', yen.format(it.price) + ' 円 / ' + UNIT_LABEL[it.priceUnit]);
      cell(tr, 'num', fmtYen(monthlyPrice(it)));
      cell(tr, 'num', dec.format(it.usage) + ' 回 / ' + UNIT_LABEL[it.usageUnit]);
      cell(tr, 'num', dec.format(monthlyUsage(it)) + ' 回');
      var td = el('td', 'num');
      var b = el('button', 'btn-text', '削除');
      b.type = 'button';
      b.setAttribute('aria-label', it.name + ' を削除');
      b.addEventListener('click', function () {
        if (it.id === 'self') {
          Payment.cancelSubscription({ subscriptionId: self.subscriptionId }).then(function () {
            self = null;
            try { localStorage.removeItem(KEY_SELF); } catch (e) { /* 何もしない */ }
            render();
          });
          return;
        }
        items = items.filter(function (x) { return x.id !== it.id; });
        save(KEY_ITEMS, items);
        render();
      });
      td.appendChild(b);
      tr.appendChild(td);
      tb.appendChild(tr);
    });
  }

  function renderL1(total) {
    var note = document.getElementById('note-l1');
    var t = document.getElementById('t-l1');
    var tb = head(t, [
      { label: '順位' },
      { label: '契約名' },
      { label: '月額', num: true },
      { label: '解約した場合の合計', num: true }
    ]);
    if (cap == null) {
      note.textContent = '月の上限を入力すると、上限以下になるまでに解約する契約を、月額の高い順に表示します。';
      emptyRow(tb, 4, '月の上限が未入力です。');
      return;
    }
    if (total <= cap) {
      note.textContent = '月の合計が上限を超えているとき、上限以下になるまでの契約を、月額の高い順に表示します。';
      emptyRow(tb, 4, '上限内です。', true);
      return;
    }
    note.textContent = '月額の高い順に、解約すると合計が上限(' + fmtYen(cap) + ')以下になるところまでを表示しています。';
    var sorted = list().slice().sort(byNumberDesc(monthlyPrice));
    var remain = total;
    for (var i = 0; i < sorted.length; i++) {
      remain -= monthlyPrice(sorted[i]);
      var tr = el('tr');
      cell(tr, 'rank', String(i + 1));
      cell(tr, 'name', sorted[i].name);
      cell(tr, 'num key', fmtYen(monthlyPrice(sorted[i])));
      cell(tr, 'num', fmtYen(Math.max(remain, 0)));
      tb.appendChild(tr);
      if (remain <= cap) break;
    }
  }

  function renderL2() {
    var t = document.getElementById('t-l2');
    var tb = head(t, [
      { label: '順位' },
      { label: '契約名' },
      { label: '1回あたり', num: true },
      { label: '月額', num: true },
      { label: '月の回数', num: true }
    ]);
    if (!list().length) { emptyRow(tb, 5, '契約が登録されていません。'); return; }
    var sorted = list().slice().sort(byNumberDesc(perUse, byNumberDesc(monthlyPrice)));
    sorted.forEach(function (it, i) {
      var zero = monthlyUsage(it) === 0;
      var tr = el('tr', zero ? 'zero' : '');
      cell(tr, 'rank', String(i + 1));
      cell(tr, 'name', it.name);
      cell(tr, 'num key', zero ? '利用なし' : fmtYen(perUse(it)));
      cell(tr, 'num', fmtYen(monthlyPrice(it)));
      cell(tr, 'num', dec.format(monthlyUsage(it)) + ' 回');
      tb.appendChild(tr);
    });
  }

  function renderL3() {
    var t = document.getElementById('t-l3');
    var tb = head(t, [
      { label: '順位' },
      { label: '契約名' },
      { label: '月の回数', num: true },
      { label: '月額', num: true }
    ]);
    if (!list().length) { emptyRow(tb, 4, '契約が登録されていません。'); return; }
    var sorted = list().slice().sort(function (a, b) {
      var x = monthlyUsage(a), y = monthlyUsage(b);
      if (x !== y) return x - y;
      return monthlyPrice(b) - monthlyPrice(a);
    });
    sorted.forEach(function (it, i) {
      var tr = el('tr');
      cell(tr, 'rank', String(i + 1));
      cell(tr, 'name', it.name);
      cell(tr, 'num key', dec.format(monthlyUsage(it)) + ' 回');
      cell(tr, 'num', fmtYen(monthlyPrice(it)));
      tb.appendChild(tr);
    });
  }

  // ---- 入力 ----
  document.getElementById('add-form').addEventListener('submit', function (e) {
    e.preventDefault();
    var name = document.getElementById('in-name').value.trim();
    var price = Number(document.getElementById('in-price').value);
    var usage = Number(document.getElementById('in-usage').value);
    if (!name || !(price > 0) || !(usage >= 0)) return;
    items.push({
      id: 'u' + Date.now() + Math.random().toString(36).slice(2, 6),
      name: name,
      price: price,
      priceUnit: document.getElementById('in-price-unit').value,
      usage: usage,
      usageUnit: document.getElementById('in-usage-unit').value
    });
    save(KEY_ITEMS, items);
    e.target.reset();
    document.getElementById('in-name').focus();
    render();
  });

  var capInput = document.getElementById('cap');
  if (cap != null) capInput.value = cap;
  capInput.addEventListener('input', function () {
    var v = capInput.value.trim();
    cap = v === '' ? null : Math.max(0, Number(v));
    if (cap != null && isNaN(cap)) cap = null;
    save(KEY_CAP, cap);
    render();
  });

  render();
})();
