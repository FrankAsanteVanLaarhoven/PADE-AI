export const LOCALES = [
  { id: "en", native: "English", english: "English", dir: "ltr", bcp47: "en-GB", timeZone: "Europe/London", city: "London" },
  { id: "zh", native: "中文", english: "Chinese", dir: "ltr", bcp47: "zh-CN", timeZone: "Asia/Shanghai", city: "Shanghai" },
  { id: "hi", native: "हिन्दी", english: "Hindi", dir: "ltr", bcp47: "hi-IN", timeZone: "Asia/Kolkata", city: "Kolkata" },
  { id: "es", native: "Español", english: "Spanish", dir: "ltr", bcp47: "es-ES", timeZone: "Europe/Madrid", city: "Madrid" },
  { id: "fr", native: "Français", english: "French", dir: "ltr", bcp47: "fr-FR", timeZone: "Europe/Paris", city: "Paris" },
  { id: "ar", native: "العربية", english: "Arabic", dir: "rtl", bcp47: "ar-SA", timeZone: "Asia/Riyadh", city: "Riyadh" },
  { id: "bn", native: "বাংলা", english: "Bengali", dir: "ltr", bcp47: "bn-BD", timeZone: "Asia/Dhaka", city: "Dhaka" },
  { id: "pt", native: "Português", english: "Portuguese", dir: "ltr", bcp47: "pt-PT", timeZone: "Europe/Lisbon", city: "Lisbon" },
  { id: "ja", native: "日本語", english: "Japanese", dir: "ltr", bcp47: "ja-JP", timeZone: "Asia/Tokyo", city: "Tokyo" },
  { id: "de", native: "Deutsch", english: "German", dir: "ltr", bcp47: "de-DE", timeZone: "Europe/Berlin", city: "Berlin" },
  { id: "ko", native: "한국어", english: "Korean", dir: "ltr", bcp47: "ko-KR", timeZone: "Asia/Seoul", city: "Seoul" },
  { id: "tr", native: "Türkçe", english: "Turkish", dir: "ltr", bcp47: "tr-TR", timeZone: "Europe/Istanbul", city: "Istanbul" },
  { id: "vi", native: "Tiếng Việt", english: "Vietnamese", dir: "ltr", bcp47: "vi-VN", timeZone: "Asia/Ho_Chi_Minh", city: "Ho Chi Minh City" },
  { id: "pl", native: "Polski", english: "Polish", dir: "ltr", bcp47: "pl-PL", timeZone: "Europe/Warsaw", city: "Warsaw" },
  { id: "uk", native: "Українська", english: "Ukrainian", dir: "ltr", bcp47: "uk-UA", timeZone: "Europe/Kyiv", city: "Kyiv" },
  { id: "id", native: "Bahasa Indonesia", english: "Indonesian", dir: "ltr", bcp47: "id-ID", timeZone: "Asia/Jakarta", city: "Jakarta" },
  { id: "th", native: "ไทย", english: "Thai", dir: "ltr", bcp47: "th-TH", timeZone: "Asia/Bangkok", city: "Bangkok" },
  { id: "fa", native: "فارسی", english: "Persian", dir: "rtl", bcp47: "fa-IR", timeZone: "Asia/Tehran", city: "Tehran" },
  { id: "ur", native: "اردو", english: "Urdu", dir: "rtl", bcp47: "ur-PK", timeZone: "Asia/Karachi", city: "Karachi" },
  { id: "sw", native: "Kiswahili", english: "Swahili", dir: "ltr", bcp47: "sw-KE", timeZone: "Africa/Nairobi", city: "Nairobi" },
  { id: "ru", native: "Русский", english: "Russian", dir: "ltr", bcp47: "ru-RU", timeZone: "Europe/Moscow", city: "Moscow" },
  { id: "nl", native: "Nederlands", english: "Dutch", dir: "ltr", bcp47: "nl-NL", timeZone: "Europe/Amsterdam", city: "Amsterdam" },
  { id: "it", native: "Italiano", english: "Italian", dir: "ltr", bcp47: "it-IT", timeZone: "Europe/Rome", city: "Rome" },
  { id: "sv", native: "Svenska", english: "Swedish", dir: "ltr", bcp47: "sv-SE", timeZone: "Europe/Stockholm", city: "Stockholm" },
  { id: "el", native: "Ελληνικά", english: "Greek", dir: "ltr", bcp47: "el-GR", timeZone: "Europe/Athens", city: "Athens" },
] as const;

export type LocaleId = (typeof LOCALES)[number]["id"];

export function localeById(id: string) {
  return LOCALES.find((item) => item.id === id) ?? LOCALES[0];
}
