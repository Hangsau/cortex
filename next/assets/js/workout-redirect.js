(() => {
  const link = document.querySelector('[data-workout-redirect]');
  if (!link) return;
  const url = new URL(link.href);
  url.search = location.search;
  url.hash = location.hash;
  link.href = url.href;
  location.replace(url.href);
})();
