import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'

const loadTranslation = async (lng: string) => {
  switch (lng) {
    case 'de':
      return (await import('./locales/de')).default
    case 'en':
      return (await import('./locales/en')).default
    case 'it':
      return (await import('./locales/it')).default
    case 'fr':
      return (await import('./locales/fr')).default
    default:
      return (await import('./locales/de')).default
  }
}

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng: 'de',
    debug: false,
    
    resources: {},

    interpolation: {
      escapeValue: false
    },

    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage']
    }
  })

i18n.services.resourceStore.on('added', (lng: string) => {
  console.log(`Loaded translations for: ${lng}`)
})

const loadLanguageAsync = async (lng: string) => {
  if (!i18n.hasResourceBundle(lng, 'translation')) {
    const translation = await loadTranslation(lng)
    i18n.addResourceBundle(lng, 'translation', translation)
  }
}

i18n.on('languageChanged', async (lng: string) => {
  await loadLanguageAsync(lng)
})

loadLanguageAsync(i18n.language || 'de')

export default i18n