export type AnalyticsEventName =
  | "account_created"
  | "search_performed"
  | "keyword_saved"
  | "niche_viewed"
  | "book_analyzed"
  | "cover_created"
  | "cover_exported"
  | "subscription_started"
  | "subscription_cancelled"
  | "ai_request_made"
  | "ai_assistant_request"
  | "user_login";

export type AnalyticsPropertyValue =
  | string
  | number
  | boolean
  | null
  | undefined;

export interface AnalyticsEvent {
  name: AnalyticsEventName;
  properties?: Record<string, AnalyticsPropertyValue>;
  userId?: string;
  anonymousId?: string;
  timestamp: string;
}

export interface AnalyticsProvider {
  track(event: AnalyticsEvent): void;
}

const STORAGE_KEY = "kdp_orbit_analytics_events";
const ANON_ID_KEY = "kdp_orbit_analytics_anonymous_id";

const getAnonymousId = (): string => {
  if (typeof window === "undefined") return "anonymous-server";

  let existing = window.localStorage.getItem(ANON_ID_KEY);
  if (!existing) {
    existing = `anon_${Math.random().toString(36).slice(2, 10)}_${Date.now().toString(36)}`;
    window.localStorage.setItem(ANON_ID_KEY, existing);
  }

  return existing;
};

class LocalStorageAnalyticsProvider implements AnalyticsProvider {
  track(event: AnalyticsEvent): void {
    if (typeof window === "undefined") return;

    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      const existing: AnalyticsEvent[] = raw ? JSON.parse(raw) : [];
      existing.push(event);
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(existing.slice(-200)),
      );
    } catch (error) {
      console.warn("Analytics storage unavailable:", error);
    }
  }
}

class ConsoleAnalyticsProvider implements AnalyticsProvider {
  track(event: AnalyticsEvent): void {
    console.info("[analytics]", event.name, event.properties ?? {});
  }
}

class AnalyticsClient {
  private provider: AnalyticsProvider;

  constructor(provider?: AnalyticsProvider) {
    this.provider = provider ?? new LocalStorageAnalyticsProvider();
  }

  setProvider(provider: AnalyticsProvider): void {
    this.provider = provider;
  }

  identify(userId: string): void {
    if (typeof window === "undefined") return;
    window.localStorage.setItem("kdp_orbit_analytics_user_id", userId);
  }

  track(
    name: AnalyticsEventName,
    properties: Record<string, AnalyticsPropertyValue> = {},
    userId?: string,
  ): void {
    const sanitizedProperties = Object.fromEntries(
      Object.entries(properties)
        .filter(([key, value]) => {
          if (value === undefined || value === null) return false;
          const lowerKey = key.toLowerCase();
          return ![
            "email",
            "password",
            "input",
            "response",
            "query",
            "prompt",
            "content",
            "token",
            "secret",
            "subject",
          ].some((blocked) => lowerKey.includes(blocked));
        })
        .map(([key, value]) => [key, value]),
    );

    const event: AnalyticsEvent = {
      name,
      properties: sanitizedProperties,
      userId: userId ?? undefined,
      anonymousId: getAnonymousId(),
      timestamp: new Date().toISOString(),
    };

    this.provider.track(event);
  }
}

export const analytics = new AnalyticsClient();

export const setAnalyticsProvider = (provider: AnalyticsProvider) => {
  analytics.setProvider(provider);
};

export const useConsoleAnalytics = () => {
  analytics.setProvider(new ConsoleAnalyticsProvider());
};
