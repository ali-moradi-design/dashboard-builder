// Runs before the first paint (a classic script in <head>; the CSP forbids
// inline scripts). Applies the saved theme and language to <html> so the page
// does not flash the wrong theme or direction while the app loads.
// Keep in sync with src/shared/model/settings.ts (storage key "db-settings").
;(function () {
  var theme = 'system'
  var lang = 'en'
  try {
    var saved = JSON.parse(localStorage.getItem('db-settings') || 'null')
    if (saved && saved.state) {
      if (saved.state.theme === 'light' || saved.state.theme === 'dark') theme = saved.state.theme
      if (saved.state.lang === 'fa') lang = 'fa'
    }
  } catch {
    // Storage blocked or corrupt: keep the defaults.
  }
  if (theme === 'system') {
    theme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  }
  var html = document.documentElement
  html.dataset.theme = theme
  html.lang = lang
  html.dir = lang === 'fa' ? 'rtl' : 'ltr'
})()
