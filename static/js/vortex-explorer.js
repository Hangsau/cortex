/* vortex-explorer.js — 技術組件磚塊：點開／收合 */

(function () {
  const explorer = document.getElementById('vx-explorer');
  if (!explorer) return;

  explorer.querySelectorAll('.vxe-tile').forEach(function (tile) {
    tile.addEventListener('click', function () {
      const wasOpen = tile.classList.contains('is-open');
      // 一次只開一個：先收合全部，再開當前（若原本就開著則純收合）
      explorer.querySelectorAll('.vxe-tile.is-open').forEach(function (t) {
        t.classList.remove('is-open');
      });
      if (!wasOpen) {
        tile.classList.add('is-open');
        tile.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    });
  });
})();
