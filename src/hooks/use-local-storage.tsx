import { useState, useEffect } from "react";

export function getLocalStorageOrDefault<T>(key: string, defaultValue: T) {
  if (!window || !window.localStorage) {
    return defaultValue;
  }

  const stored = localStorage.getItem(key);

  if (!stored) {
    return defaultValue;
  }

  return JSON.parse(stored) as T;
}

export function useLocalStorage<T>(key: string, defaultValue: T) {
  const [value, setValue] = useState<T>(
    getLocalStorageOrDefault<T>(key, defaultValue),
  );

  useEffect(() => {
    if (!window || !window.localStorage) {
      return;
    }

    localStorage.setItem(key, JSON.stringify(value));
  }, [key, value]);

  return [value, setValue] as const;
}
