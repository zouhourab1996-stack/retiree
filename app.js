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
  RC.fraFor = function (y) { var t = { 1955: [66, 2], 1956: [66, 4], 1957: [66, 6], 1958: [66, 8], 1959: [66, 10] }; return t[y] || [67, 0]; };
  RC.fraDate = function (b) {
    var f = RC.fraFor(b.getFullYear());
    var m = b.getMonth() + f[1], y = b.getFullYear() + f[0];
    return new Date(y + Math.floor(m / 12), m % 12, 1);
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
      var b = RC.parseYMD(v), t = RC.fraDate(b);
      var el = document.getElementById('rc-fra');
      if (el) el.innerHTML = 'Your full retirement age is <b>' + t.getFullYear() + '</b> — you reach it in <b>' + RC.monthName(t) + ' ' + t.getFullYear() + '</b>. Counting from today:';
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