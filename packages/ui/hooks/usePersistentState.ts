import { useCallback, useState } from "react";

const read = <Value>(
  key: string,
  isValid: (candidate: unknown) => candidate is Value,
): Value | null => {
  // Private-mode browsers throw on storage access rather than returning null,
  // and a stored value can be stale JSON from an earlier shape of the setting.
  try {
    const stored = localStorage.getItem(key);

    if (stored === null) return null;

    const parsed: unknown = JSON.parse(stored);

    return isValid(parsed) ? parsed : null;
  } catch {
    return null;
  }
};

// The validator guards against a value persisted by an earlier version of the
// caller; any storage failure degrades to in-memory state rather than breaking
// the page.
export const usePersistentState = <Value>(
  key: string,
  fallback: Value,
  isValid: (candidate: unknown) => candidate is Value,
): readonly [Value, (next: Value) => void] => {
  const [value, setValue] = useState<Value>(
    () => read(key, isValid) ?? fallback,
  );
  const store = useCallback(
    (next: Value) => {
      setValue(next);

      try {
        localStorage.setItem(key, JSON.stringify(next));
      } catch {
        // Storage is unavailable or full; the in-memory value still applies.
      }
    },
    [key],
  );

  return [value, store];
};
