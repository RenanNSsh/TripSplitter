import { db, isFirebaseConfigured } from "./firebase";
import {
  Timestamp,
  addDoc,
  collection,
  doc,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";

const CLIENT_ID_STORAGE_KEY = "trip-splitter-client-id";
const DISPLAY_NAME_STORAGE_KEY = "trip-splitter-display-name";

const createFallbackId = () => `${Date.now()}-${Math.random().toString(16).slice(2)}`;

const safeGetItem = (key: string): string | null => {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
};

const safeSetItem = (key: string, value: string) => {
  try {
    localStorage.setItem(key, value);
  } catch {
    return;
  }
};

export const getClientId = (): string => {
  const existing = safeGetItem(CLIENT_ID_STORAGE_KEY);
  if (existing) return existing;

  const id =
    typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
      ? crypto.randomUUID()
      : createFallbackId();

  safeSetItem(CLIENT_ID_STORAGE_KEY, id);
  return id;
};

export const getDisplayName = (): string | null => {
  const value = safeGetItem(DISPLAY_NAME_STORAGE_KEY);
  if (!value) return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

export const setDisplayName = (name: string) => {
  safeSetItem(DISPLAY_NAME_STORAGE_KEY, name.trim());
};

export interface ActivityLogInput {
  action: string;
  entity?: string;
  entityId?: string;
  data?: Record<string, unknown>;
}

const withoutUndefined = (obj: Record<string, unknown>) =>
  Object.fromEntries(Object.entries(obj).filter(([, value]) => value !== undefined));

export const logActivity = async ({ action, entity, entityId, data }: ActivityLogInput) => {
  if (!isFirebaseConfigured || !db) return;

  const clientId = getClientId();
  const displayName = getDisplayName();
  const userAgent = typeof navigator !== "undefined" ? navigator.userAgent : null;
  const pathname = typeof window !== "undefined" ? window.location.pathname : null;

  let timezone: string | null = null;
  try {
    timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    timezone = null;
  }

  try {
    await addDoc(collection(db, "activityLogs"),
      withoutUndefined({
        action,
        entity: entity ?? null,
        entityId: entityId ?? null,
        clientId,
        displayName,
        userAgent,
        pathname,
        timezone,
        data: data ? withoutUndefined(data) : null,
        createdAt: serverTimestamp(),
      }),
    );
  } catch (e) {
    console.error("Failed to write activity log:", e);
  }
};

export interface PresenceOptions {
  intervalMs?: number;
  ttlMs?: number;
}

export const startPresenceHeartbeat = (options?: PresenceOptions) => {
  if (!isFirebaseConfigured || !db) return () => {};
  if (typeof window === "undefined") return () => {};

  const intervalMs = options?.intervalMs ?? 30_000;
  const ttlMs = options?.ttlMs ?? 2 * 60_000;

  const clientId = getClientId();

  const writePresence = async () => {
    const displayName = getDisplayName();
    const userAgent = typeof navigator !== "undefined" ? navigator.userAgent : null;
    const expiresAt = Timestamp.fromDate(new Date(Date.now() + ttlMs));

    try {
      await setDoc(
        doc(db, "presence", clientId),
        {
          clientId,
          displayName,
          userAgent,
          lastSeenAt: serverTimestamp(),
          expiresAt,
        },
        { merge: true },
      );
    } catch (e) {
      console.error("Failed to write presence:", e);
    }
  };

  const writeNow = () => {
    void writePresence();
  };

  writeNow();
  const intervalId = window.setInterval(writeNow, intervalMs);

  const handleVisibilityChange = () => {
    if (document.visibilityState === "visible") {
      writeNow();
    }
  };

  document.addEventListener("visibilitychange", handleVisibilityChange);
  window.addEventListener("focus", writeNow);

  return () => {
    window.clearInterval(intervalId);
    document.removeEventListener("visibilitychange", handleVisibilityChange);
    window.removeEventListener("focus", writeNow);
  };
};
