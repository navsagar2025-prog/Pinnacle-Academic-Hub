import { useCallback, useState } from "react";
import { successHaptic } from "./haptics";

export function useRefresh(fetchFn: () => Promise<void>) {
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await fetchFn();
      successHaptic();
    } catch {
      // silently ignore
    } finally {
      setRefreshing(false);
    }
  }, [fetchFn]);

  return { refreshing, onRefresh };
}
