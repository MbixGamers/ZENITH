const transition = document.querySelector('.page-transition');

window.addEventListener('pageshow', () => {
  document.body.classList.remove('is-navigating');
  if (transition) {
    transition.hidden = true;
    transition.setAttribute('aria-hidden', 'true');
  }
});

document.addEventListener('click', (event) => {
  const link = event.target.closest('a[href]');
  if (!link || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
  if (link.target && link.target !== '_self' || link.hasAttribute('download')) return;

  const destination = new URL(link.href, window.location.href);
  if (destination.origin !== window.location.origin || destination.pathname === window.location.pathname || !transition) return;

  event.preventDefault();
  transition.hidden = false;
  transition.setAttribute('aria-hidden', 'false');
  document.body.classList.add('is-navigating');
  window.setTimeout(() => window.location.assign(destination.href), 540);
});