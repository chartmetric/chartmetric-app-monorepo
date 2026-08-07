import { useLocalStorage } from "@mantine/hooks";

export const usePersistentState = <Value>(
  key: string,
  fallback: Value,
  isValid: (candidate: unknown) => candidate is Value,
): readonly [Value, (next: Value) => void] => {
  const [value, setValue] = useLocalStorage<Value>({
    defaultValue: fallback,
    deserialize: (stored) => {
      if (stored === undefined) return fallback;

      try {
        const parsed: unknown = JSON.parse(stored);

        return isValid(parsed) ? parsed : fallback;
      } catch {
        // Not JSON at all; treat it the same as a value that fails validation.
        return fallback;
      }
    },
    // Read synchronously: deferring to an effect would render the fallback
    // first, flashing default columns before the reader's own selection.
    getInitialValueInEffect: false,
    key,
  });

  return [value, setValue];
};
