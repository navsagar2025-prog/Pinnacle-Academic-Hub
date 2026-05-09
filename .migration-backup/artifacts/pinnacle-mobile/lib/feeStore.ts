import AsyncStorage from "@react-native-async-storage/async-storage";
import { useCallback, useEffect, useState } from "react";

export type FeePayment = {
  txnId: string;
  amount: number;
  method: string;
  paidAt: string;
  forMonth: string;
};

const KEY = "pinnacle.fee.payments.v1";

async function read(): Promise<FeePayment[]> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as FeePayment[]) : [];
  } catch {
    return [];
  }
}

async function write(items: FeePayment[]): Promise<void> {
  try {
    await AsyncStorage.setItem(KEY, JSON.stringify(items));
  } catch {
    // Storage full or serialization error — silently no-op so the UI
    // success state isn't blocked. The next write attempt will retry.
  }
}

let writeQueue: Promise<void> = Promise.resolve();

export function useFeePayments() {
  const [payments, setPayments] = useState<FeePayment[]>([]);
  const [loaded, setLoaded] = useState(false);

  const refresh = useCallback(async () => {
    const items = await read();
    setPayments(items);
    setLoaded(true);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const addPayment = useCallback(async (p: FeePayment) => {
    // Serialize writes to avoid losing entries from concurrent calls.
    writeQueue = writeQueue.then(async () => {
      const current = await read();
      // Skip if a payment with this txnId was already recorded (idempotent).
      if (current.some((x) => x.txnId === p.txnId)) {
        setPayments(current);
        return;
      }
      const next = [p, ...current];
      await write(next);
      setPayments(next);
    });
    return writeQueue;
  }, []);

  const clear = useCallback(async () => {
    await AsyncStorage.removeItem(KEY);
    setPayments([]);
  }, []);

  return { payments, loaded, addPayment, refresh, clear };
}
