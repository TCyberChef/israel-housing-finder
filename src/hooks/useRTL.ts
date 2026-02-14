import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

/**
 * Hook to sync document direction with i18next language
 * Switches between RTL (Hebrew) and LTR (English)
 */
export function useRTL() {
  const { i18n } = useTranslation();

  useEffect(() => {
    // i18n.dir() returns 'rtl' for Hebrew, 'ltr' for English
    const dir = i18n.dir();
    document.documentElement.dir = dir;
    document.documentElement.lang = i18n.language;
  }, [i18n.language, i18n]);
}
