import polyglotI18nProvider from "ra-i18n-polyglot";
import { englishMessages } from "./i18n/en";
import { indonesianMessages } from "./i18n/id";
import type { TranslationMessages } from "ra-core";

const messages: Record<string, TranslationMessages> = {
  id: indonesianMessages,
  en: englishMessages,
};

export const i18nProvider = polyglotI18nProvider(
  (locale: string) => messages[locale] || messages.id,
  "id", // Default to Indonesian
  [
    { locale: "id", name: "🇮🇩 Bahasa Indonesia" },
    { locale: "en", name: "🇬🇧 English" },
  ],
  { allowMissing: true },
);
