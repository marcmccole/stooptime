function createSmsHref(userAgent) {
  const separator = /Android/i.test(userAgent) ? '?' : '&';
  const body = encodeURIComponent("so what's the deal with stoop anyway?").replace(/'/g, '%27');
  return 'sms:+14152904186' + separator + 'body=' + body;
}
document.querySelectorAll('.text-stoop').forEach(link => {
  link.href = createSmsHref(navigator.userAgent);
});
