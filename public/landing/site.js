function createSmsHref(userAgent) {
  const separator = /Android/i.test(userAgent) ? '?' : '&';
  const body = encodeURIComponent('hello');
  return 'sms:+14153597743' + separator + 'body=' + body;
}
document.querySelectorAll('.text-stoop').forEach(link => {
  link.href = createSmsHref(navigator.userAgent);
});
