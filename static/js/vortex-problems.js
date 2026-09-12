(function () {
  'use strict';
  var root = document.querySelector('[data-vx-problems]');
  if (!root) return;
  var cards = Array.from(root.querySelectorAll('.vx-problem-card'));
  var bars = Array.from(root.querySelectorAll('[data-problem-axis]'));
  var checks = Array.from(root.querySelectorAll('[data-problem-has]'));
  var search = root.querySelector('#vxProblemSearch');
  var state = { stroke: 'all', category: 'all' };

  function apply() {
    var query = search.value.trim().toLocaleLowerCase();
    var count = 0;
    cards.forEach(function (card) {
      var visible = Object.keys(state).every(function (axis) {
        return state[axis] === 'all' || card.dataset[axis] === state[axis];
      }) && checks.every(function (check) {
        return !check.checked || card.dataset[check.dataset.problemHas] === 'yes';
      }) && (!query || card.dataset.search.includes(query));
      card.classList.toggle('is-hidden', !visible);
      if (visible) count++;
    });
    root.querySelector('[data-problem-count]').textContent = '共 ' + count + ' 個問題';
    root.querySelector('[data-problem-empty]').hidden = count !== 0 || cards.length === 0;
    bars.forEach(function (bar) {
      bar.querySelectorAll('button').forEach(function (button) {
        var active = button.dataset.value === state[bar.dataset.problemAxis];
        button.classList.toggle('is-active', active);
        button.setAttribute('aria-pressed', String(active));
      });
    });
  }
  function reset() {
    state.stroke = state.category = 'all';
    checks.forEach(function (check) { check.checked = false; });
    search.value = '';
    apply();
  }
  bars.forEach(function (bar) {
    bar.addEventListener('click', function (event) {
      var button = event.target.closest('button[data-value]');
      if (!button || !bar.contains(button)) return;
      state[bar.dataset.problemAxis] = button.dataset.value;
      apply();
    });
  });
  checks.forEach(function (check) { check.addEventListener('change', apply); });
  search.addEventListener('input', apply);
  root.querySelector('[data-problem-reset]').addEventListener('click', reset);
  search.value = new URLSearchParams(window.location.search).get('q') || '';
  apply();

  function openHash() {
    var id;
    try { id = decodeURIComponent(window.location.hash.slice(1)); } catch (_) { return; }
    var target = document.getElementById(id);
    if (!target || !cards.includes(target)) return;
    if (target.classList.contains('is-hidden')) reset();
    target.open = true;
    requestAnimationFrame(function () { target.scrollIntoView({ block: 'start', behavior: 'instant' }); });
  }
  window.addEventListener('hashchange', openHash);
  openHash();
}());
