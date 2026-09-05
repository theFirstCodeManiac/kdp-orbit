export interface AppEnvironment {
  isProduction: boolean;
  isDevelopment: boolean;
  apiBaseUrl: string;
  appName: string;
  analyticsEnabled: boolean;
}

export const appEnv: AppEnvironment = {
  isProduction: import.meta.env.PROD === true,
  isDevelopment: import.meta.env.DEV === true,
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL ?? "/api",
  appName: import.meta.env.VITE_APP_NAME ?? "KDP Orbit",
  analyticsEnabled: import.meta.env.VITE_ANALYTICS_ENABLED === "true",
};

export const getApiUrl = (path: string) => {
  const normalizedBase = appEnv.apiBaseUrl.replace(/\/$/, "");
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${normalizedBase}${normalizedPath}`;
};
