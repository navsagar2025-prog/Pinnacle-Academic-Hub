import AsyncStorage from "@react-native-async-storage/async-storage";
import { useCallback, useEffect, useState } from "react";

const KEY = "pinnacle.ai.settings.v1";

export type AISettings = {
  doubtResolverEnabled: boolean;
};

const DEFAULTS: AISettings = {
  doubtResolverEnabled: true,
};

type Listener = (s: AISettings) => void;
const listeners = new Set<Listener>();
let cache: AISettings | null = null;

async function load(): Promise<AISettings> {
  if (cache) return cache;
  try {
    const raw = await AsyncStorage.getItem(KEY);
    cache = raw ? { ...DEFAULTS, ...(JSON.parse(raw) as Partial<AISettings>) } : { ...DEFAULTS };
  } catch {
    cache = { ...DEFAULTS };
  }
  return cache;
}

async function save(next: AISettings): Promise<void> {
  cache = next;
  try {
    await AsyncStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* best-effort */
  }
  listeners.forEach((fn) => fn(next));
}

/**
 * Shared cross-screen settings hook. Admin toggles in (admin)/more.tsx
 * are immediately reflected in the student doubts screen (and any other
 * subscribers) without requiring a refresh.
 */
export function useAISettings() {
  const [settings, setSettings] = useState<AISettings>(cache ?? DEFAULTS);
  const [loaded, setLoaded] = useState(cache !== null);

  useEffect(() => {
    let mounted = true;
    load().then((s) => {
      if (mounted) {
        setSettings(s);
        setLoaded(true);
      }
    });
    const fn: Listener = (s) => {
      if (mounted) setSettings(s);
    };
    listeners.add(fn);
    return () => {
      mounted = false;
      listeners.delete(fn);
    };
  }, []);

  const setDoubtResolverEnabled = useCallback(async (enabled: boolean) => {
    const cur = await load();
    await save({ ...cur, doubtResolverEnabled: enabled });
  }, []);

  return { settings, loaded, setDoubtResolverEnabled };
}
