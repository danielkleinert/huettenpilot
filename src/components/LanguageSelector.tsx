import { useTranslation } from 'react-i18next'
import { Globe } from 'lucide-react'
import { Select } from './ui/select'

const languages = [
  { code: 'de', name: 'languages.de' },
  { code: 'en', name: 'languages.en' },
  { code: 'it', name: 'languages.it' },
  { code: 'fr', name: 'languages.fr' }
]

export function LanguageSelector() {
  const { i18n, t } = useTranslation()

  const handleLanguageChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    await i18n.changeLanguage(e.target.value)
  }

  const currentLanguage = i18n.language.split('-')[0]

  return (
    <div className="flex items-center gap-2">
      <Globe className="h-4 w-4 text-muted-foreground" />
      <Select
        value={currentLanguage}
        onChange={handleLanguageChange}
        className="w-32"
      >
        {languages.map((lang) => (
          <option key={lang.code} value={lang.code}>
            {t(lang.name)}
          </option>
        ))}
      </Select>
    </div>
  )
}