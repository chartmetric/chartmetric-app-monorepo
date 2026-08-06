import { emptyToNull } from "./strings.ts";

/** A value a reader can filter by, and how many records carry it. */
export interface CountedOption {
  count: number;
  value: string;
}

/**
 * Orders display names for a response payload.
 *
 * The locale is pinned rather than left to `localeCompare`'s default, which
 * follows the server's own locale: two machines with different environments
 * would otherwise return the same options in a different order.
 */
export const compareNames = (left: string, right: string): number =>
  left.localeCompare(right, "en");

/**
 * Tallies raw column values into options, most common first and alphabetical
 * within a count. Absent and empty values are not options, so they are dropped
 * rather than counted under a blank label.
 */
export const countValues = (
  values: readonly (string | null | undefined)[],
): CountedOption[] => {
  const counts = new Map<string, number>();

  for (const value of values) {
    const option = emptyToNull(value);

    if (option === null) continue;
    counts.set(option, (counts.get(option) ?? 0) + 1);
  }

  return [...counts]
    .map(([value, count]) => ({ count, value }))
    .toSorted((left, right) => {
      const countDifference = right.count - left.count;

      return countDifference === 0
        ? compareNames(left.value, right.value)
        : countDifference;
    });
};

/** Adds `value` to the set at `key`, creating the set on first use. */
export const addToGroup = <Key>(
  target: Map<Key, Set<string>>,
  key: Key,
  value: string,
): void => {
  const existing = target.get(key);

  if (existing === undefined) {
    target.set(key, new Set([value]));
  } else {
    existing.add(value);
  }
};

// Spreads entries rather than `source.keys()`: the iterator-helper form the
// lint rule prefers is not in this project's TypeScript lib.
export const sortedKeys = (source: ReadonlyMap<string, unknown>): string[] =>
  [...source].map(([key]) => key).toSorted(compareNames);

/** Flattens grouped values into the sorted record a JSON response returns. */
export const toSortedRecord = (
  source: ReadonlyMap<string, ReadonlySet<string>>,
): Record<string, string[]> => {
  const result: Record<string, string[]> = {};

  for (const key of sortedKeys(source)) {
    result[key] = [...(source.get(key) ?? [])].toSorted(compareNames);
  }

  return result;
};
