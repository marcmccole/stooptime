// A brief stop-motion entrance; the story remains fully visible without JavaScript.
if ('IntersectionObserver' in window && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  const clayObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-arriving');
      clayObserver.unobserve(entry.target);
    });
  }, { threshold: .2 });
  document.querySelectorAll('.clay-step').forEach(step => clayObserver.observe(step));
}
