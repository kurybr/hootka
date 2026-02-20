"use client";

import { useEffect, useState } from "react";
import { useRealTime } from "./useRealTime";

interface UseAnswerCountResult {
  count: number;
  total: number;
  loading: boolean;
  error: string | null;
}

export function useAnswerCount(): UseAnswerCountResult {
  const provider = useRealTime();
  const [count, setCount] = useState(0);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubCount = provider.onAnswerCount((data) => {
      setCount(data.count);
      setTotal(data.total);
    });

    const unsubError = provider.onError((err) => {
      setError(err.message);
    });

    return () => {
      unsubCount();
      unsubError();
    };
  }, [provider]);

  return { count, total, loading: false, error };
}
