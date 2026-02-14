import { useTranslation } from 'react-i18next';

export function AppHeader() {
  const { t, i18n } = useTranslation('common');

  const toggleLanguage = () => {
    const newLang = i18n.language === 'he' ? 'en' : 'he';
    i18n.changeLanguage(newLang);
  };

  return (
    <header className="app-header">
      <h1 className="app-title">{t('header.title')}</h1>
      <button onClick={toggleLanguage} className="language-toggle">
        {t('header.languageToggle')}
      </button>
    </header>
  );
}
