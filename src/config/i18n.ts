import { BRAND_CONFIG } from "@/src/config/brand.ts";

export type SupportedLanguage = "en";
export type SupportedCurrency = "NGN" | "USD" | "GBP";

export const APP_I18N = {
  defaultLanguage: "en" as SupportedLanguage,
  defaultRegion: "NG",
  defaultCurrency: "NGN" as SupportedCurrency,
} as const;

const REGION_LOCALES: Record<string, string> = {
  NG: "en-NG",
  US: "en-US",
  UK: "en-GB",
  GB: "en-GB",
};

export const getRegionConfig = (
  regionCode: string = APP_I18N.defaultRegion,
) => {
  return (
    BRAND_CONFIG.regions.find((region) => region.code === regionCode) ??
    BRAND_CONFIG.regions.find((region) => region.code === "NG") ??
    BRAND_CONFIG.regions[0]
  );
};

export const getLocaleForRegion = (
  regionCode: string = APP_I18N.defaultRegion,
) => {
  return REGION_LOCALES[regionCode] ?? "en-NG";
};

export const getLocaleForCurrency = (
  currencyCode: SupportedCurrency = APP_I18N.defaultCurrency,
) => {
  switch (currencyCode) {
    case "NGN":
      return "en-NG";
    case "GBP":
      return "en-GB";
    default:
      return "en-US";
  }
};

export const getCurrencyRateToUSD = (
  currencyCode: SupportedCurrency = APP_I18N.defaultCurrency,
) => {
  const region = BRAND_CONFIG.regions.find(
    (entry) => entry.currency === currencyCode,
  );
  return region?.exchangeRateToUSD ?? 1;
};

export const convertUsdToCurrency = (
  usdAmount: number,
  currencyCode: SupportedCurrency = APP_I18N.defaultCurrency,
) => {
  if (currencyCode === "USD") {
    return usdAmount;
  }

  return usdAmount * getCurrencyRateToUSD(currencyCode);
};

export const formatMoney = (
  amount: number,
  currencyCode: SupportedCurrency = APP_I18N.defaultCurrency,
  locale: string = getLocaleForCurrency(currencyCode),
  options: Intl.NumberFormatOptions = {},
) => {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: currencyCode,
    maximumFractionDigits: currencyCode === "NGN" ? 0 : 2,
    ...options,
  }).format(amount);
};

export const formatDate = (
  value: string | Date,
  locale: string = getLocaleForRegion(APP_I18N.defaultRegion),
  options: Intl.DateTimeFormatOptions = {},
) => {
  return new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    ...options,
  }).format(new Date(value));
};

export const formatDateTime = (
  value: string | Date,
  locale: string = getLocaleForRegion(APP_I18N.defaultRegion),
  options: Intl.DateTimeFormatOptions = {},
) => {
  return new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short",
    ...options,
  }).format(new Date(value));
};
