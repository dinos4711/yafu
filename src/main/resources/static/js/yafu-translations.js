
i18next.init({
  lng: 'de',
  debug: true,
  resources: {
    en: {
      translation: {
        "key": "hello world"
      }
    }
  }
}, function(err, t) {
  // initialized and ready to go!
  document.getElementById('output1').innerHTML = i18next.t('key');
});

i18next.addResourceBundle('de', 'translation', {
  'Docked': 'Angedockt',
  'Absent': 'Abwesend'
}, true, true);
