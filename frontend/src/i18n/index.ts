import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import en from './locales/en.json'
import zh from './locales/zh.json'
import { lsSet, lsGet } from '../lib/storage'

const LOCALE_KEY = 'Caijing_locale'

function getInitialLocale(): string {
  const stored = lsGet(LOCALE_KEY)
  if (stored && ['en', 'zh'].includes(stored)) return stored
  // Chinese-first brand (财经今日): Chinese is the default UI language for every
  // first-time visitor. English is a secondary, toggleable + persisted choice.
  return 'zh'
}

i18n.use(initReactI18next).init({
  resources: { en: { translation: en }, zh: { translation: zh } },
  lng: getInitialLocale(),
  fallbackLng: 'zh',
  interpolation: { escapeValue: false },
})

i18n.on('languageChanged', (lng) => {
  lsSet(LOCALE_KEY, lng)
  // Keep the document's declared language in sync — a page served as zh but
  // announcing lang="zh" while the reader is reading English breaks
  // screen readers, hyphenation and translation prompts.
  if (typeof document !== 'undefined') document.documentElement.lang = lng
})

// Apply the initial language to <html lang="..."> as well (index.html ships
// the Chinese default; a stored 'en' preference must override it).
if (typeof document !== 'undefined') document.documentElement.lang = i18n.language

export default i18n
