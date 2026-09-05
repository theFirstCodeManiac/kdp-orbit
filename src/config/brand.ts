/**
 * Core Branding & Localization Configuration
 * Configurable identity to prevent hardcoding brand names across the platform.
 */

export interface BrandConfig {
  name: string;
  shortName: string;
  tagline: string;
  version: string;
  supportEmail: string;
  defaultLanguage: "en";
  defaultLocale: "en-NG";
  supportedLanguages: Array<{
    code: "en";
    label: string;
    defaultRegion: "NG" | "US" | "UK";
  }>;
  regions: {
    code: string;
    label: string;
    currency: string;
    exchangeRateToUSD: number;
    amazonMarketplace: string;
  }[];
  defaultCurrency: "USD" | "NGN";
}

export const BRAND_CONFIG: BrandConfig = {
  name: "KDP Orbit",
  shortName: "Orbit",
  tagline: "Amazon KDP Intelligence & Publishing Studio",
  version: "1.0.0-prod",
  supportEmail: "support@kdporbit.com",
  defaultLanguage: "en",
  defaultLocale: "en-NG",
  supportedLanguages: [{ code: "en", label: "English", defaultRegion: "NG" }],
  regions: [
    {
      code: "NG",
      label: "Nigeria / West Africa",
      currency: "NGN",
      exchangeRateToUSD: 1450,
      amazonMarketplace: "amazon.com",
    },
    {
      code: "US",
      label: "Global / United States",
      currency: "USD",
      exchangeRateToUSD: 1,
      amazonMarketplace: "amazon.com",
    },
    {
      code: "UK",
      label: "United Kingdom",
      currency: "GBP",
      exchangeRateToUSD: 0.78,
      amazonMarketplace: "amazon.co.uk",
    },
  ],
  defaultCurrency: "NGN",
};
