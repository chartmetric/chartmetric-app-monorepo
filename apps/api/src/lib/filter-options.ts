import { emptyToNull } from "./strings.ts";

export interface CountedOption {
  count: number;
  value: string;
}

export const compareNames = (left: string, right: string): number =>
  left.localeCompare(right, "en");

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

export const sortedKeys = (source: ReadonlyMap<string, unknown>): string[] =>
  [...source].map(([key]) => key).toSorted(compareNames);

export const toSortedRecord = (
  source: ReadonlyMap<string, ReadonlySet<string>>,
): Record<string, string[]> => {
  const result: Record<string, string[]> = {};

  for (const key of sortedKeys(source)) {
    result[key] = [...(source.get(key) ?? [])].toSorted(compareNames);
  }

  return result;
};
