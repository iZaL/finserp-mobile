import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { Language, translations, TranslationKey } from './translations'
import Cookies from 'js-cookie'

interface LanguageStore {
  language: Language
  setLanguage: (lang: Language) => void
  t: (key: TranslationKey) => string
  dir: 'ltr' | 'rtl'
}

export const useLanguageStore = create<LanguageStore>()(
  persist(
    (set, get) => ({
      language: 'en',
      dir: 'ltr',
      setLanguage: (lang: Language) => {
        Cookies.set('language', lang, { expires: 365 })
        // NOTE: DOM manipulation removed - next-intl handles this via server-side rendering
        // document.documentElement.lang = lang
        // document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr'
        set({
          language: lang,
          dir: lang === 'ar' ? 'rtl' : 'ltr'
        })
      },
      t: (key: TranslationKey) => {
        const { language } = get()
        return translations[language][key] || key
      },
    }),
    {
      name: 'language-storage',
      storage: createJSONStorage(() => ({
        getItem: (name) => {
          // Try to get from cookie first
          const cookieValue = Cookies.get('language')
          if (cookieValue) {
            return JSON.stringify({ state: { language: cookieValue } })
          }
          return localStorage.getItem(name)
        },
        setItem: (name, value) => {
          const parsed = JSON.parse(value)
          Cookies.set('language', parsed.state.language, { expires: 365 })
          localStorage.setItem(name, value)
        },
        removeItem: (name) => {
          Cookies.remove('language')
          localStorage.removeItem(name)
        },
      })),
    }
  )
)
