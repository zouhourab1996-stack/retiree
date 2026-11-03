(function () {
  var DAY = 86400000;
  function RC() {}
  RC.parseYMD = function (s) { var p = s.split('-'); return new Date(+p[0], +p[1] - 1, +p[2]); };
  RC.daysUntil = function (t) { var n = new Date(); n.setHours(0,0,0,0); return Math.round((t - n) / DAY); };
  RC.weeksUntil = function (t) { return Math.floor(RC.daysUntil(t) / 7); };
  RC.workdaysUntil = function (t) {
    var d = new Date(); d.setHours(0,0,0,0);
    var n = 0, guard = 0;
    while (d < t && guard < 20000) { d.setDate(d.getDate() + 1); var w = d.getDay(); if (w !== 0 && w !== 6) n++; guard++; }
    return n;
  };
  RC.weekendDaysUntil = function (t) { return Math.max(0, RC.daysUntil(t) - RC.workdaysUntil(t)); };
  RC.paychecksUntil = function (t) { var n = new Date(); n.setHours(0,0,0,0); return Math.max(0, Math.floor((t - n) / (14 * DAY))); };
  RC.fraFor = function (y) { if (y >= 1943 && y <= 1954) return [66, 0]; var t = { 1955: [66, 2], 1956: [66, 4], 1957: [66, 6], 1958: [66, 8], 1959: [66, 10] }; return t[y] || [67, 0]; };
  // Social Security counts you as reaching an age on the day BEFORE the anniversary (20 CFR 404.2(c)(4)).
  // SSA table notes: born on January 1 -> use the previous year's row; born on the 1st -> as if born in the previous month;
  // you must be 62 for the entire month to be paid for it.
  RC.effYear = function (b) { return (b.getMonth() === 0 && b.getDate() === 1) ? b.getFullYear() - 1 : b.getFullYear(); };
  RC.addMonthsClamped = function (b, n) {
    var t = b.getFullYear() * 12 + b.getMonth() + n, y = Math.floor(t / 12), m = t % 12;
    var last = new Date(y, m + 1, 0).getDate();
    return new Date(y, m, Math.min(b.getDate(), last));
  };
  RC.fraAttained = function (b) {
    var f = RC.fraFor(RC.effYear(b)), a = RC.addMonthsClamped(b, f[0] * 12 + f[1]);
    return new Date(a.getFullYear(), a.getMonth(), a.getDate() - 1);
  };
  RC.fraDate = function (b) { var a = RC.fraAttained(b); return new Date(a.getFullYear(), a.getMonth(), 1); };
  RC.claim62Month = function (b) {
    var a = RC.addMonthsClamped(b, 62 * 12); a = new Date(a.getFullYear(), a.getMonth(), a.getDate() - 1);
    return a.getDate() === 1 ? new Date(a.getFullYear(), a.getMonth(), 1) : new Date(a.getFullYear(), a.getMonth() + 1, 1);
  };
  RC.monthName = function (d) { return ['January','February','March','April','May','June','July','August','September','October','November','December'][d.getMonth()]; };
  RC.fmt = function (n) { return n.toLocaleString('en-US'); };

  // generic renderer
  RC.renderCount = function (target) {
    var out = { days: RC.daysUntil(target), weeks: RC.weeksUntil(target), work: RC.workdaysUntil(target), pay: RC.paychecksUntil(target), weekend: RC.weekendDaysUntil(target) };
    var map = { 'rc-days': out.days, 'rc-weeks': out.weeks, 'rc-work': out.work, 'rc-pay': out.pay, 'rc-weekend': out.weekend };
    Object.keys(map).forEach(function (id) {
      var el = document.getElementById(id);
      if (el) el.textContent = RC.fmt(Math.max(0, map[id]));
    });
    return out;
  };
  RC.tickClock = function (target) {
    function upd() {
      var ms = target - new Date();
      if (ms < 0) ms = 0;
      var s = Math.floor(ms / 1000), d = Math.floor(s / 86400); s -= d * 86400;
      var h = Math.floor(s / 3600); s -= h * 3600;
      var m = Math.floor(s / 60); s -= m * 60;
      var el = document.getElementById('rc-clock');
      if (el) el.textContent = d + 'd ' + String(h).padStart(2, '0') + ':' + String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0');
    }
    upd(); setInterval(upd, 1000);
  };
  RC.personal = function () {
    var saved = null;
    try { saved = localStorage.getItem('retiree-date'); } catch (e) {}
    var input = document.getElementById('rc-date');
    function run(v) {
      if (!v) return;
      try { localStorage.setItem('retiree-date', v); } catch (e) {}
      var t = RC.parseYMD(v);
      RC.renderCount(t); RC.tickClock(t);
      var box = document.getElementById('rc-live'); if (box) box.style.display = 'block';
      var form = document.getElementById('rc-setup'); if (form) form.style.display = 'none';
    }
    if (input) input.addEventListener('change', function () { run(input.value); });
    var btn = document.getElementById('rc-go');
    if (btn) btn.addEventListener('click', function () { run(input.value); });
    if (saved) run(saved); else if (input && !input.value) { input.value = ''; }
  };
  RC.bornCalc = function () {
    var input = document.getElementById('rc-birth');
    function run(v) {
      if (!v) return;
      var b = RC.parseYMD(v), t = RC.fraDate(b), f = RC.fraFor(RC.effYear(b));
      var el = document.getElementById('rc-fra');
      if (el) el.innerHTML = 'Your full retirement age is <b>' + f[0] + (f[1] ? ' and ' + f[1] + ' months' : '') + '</b> — you reach it in <b>' + RC.monthName(t) + ' ' + t.getFullYear() + '</b>. Counting from today:';
      RC.renderCount(t); RC.tickClock(t);
      var box = document.getElementById('rc-live'); if (box) box.style.display = 'block';
    }
    if (input) input.addEventListener('change', function () { run(input.value); });
    var btn = document.getElementById('rc-go2');
    if (btn) btn.addEventListener('click', function () { run(input.value); });
  };
  document.addEventListener('DOMContentLoaded', function () {
    if (document.getElementById('rc-date')) RC.personal();
    if (document.getElementById('rc-birth')) RC.bornCalc();
  });
  window.RC = RC;
})();
  RC.wa = function () {
    var r = document.getElementById('gift-ref'), n = document.getElementById('gift-name');
    if (!r || !r.value.trim()) { r && r.focus(); return; }
    var msg = 'Hello Hedi! I sent a gift via MoneyGram for retiree.bond — Reference: ' + r.value.trim() +
      ((n && n.value.trim()) ? ' — from ' + n.value.trim() : '') + '. Thank you for the countdown!';
    window.open('https://wa.me/21693816607?text=' + encodeURIComponent(msg), '_blank', 'noopener');
  };
  document.addEventListener('DOMContentLoaded', function () {
    var b = document.getElementById('gift-send');
    if (b) b.addEventListener('click', function () { RC.wa(); });
    var r = document.getElementById('gift-ref');
    if (r) r.addEventListener('keydown', function (e) { if (e.key === 'Enter') RC.wa(); });
  });
