/**
 * Adds `value` to the set stored at `key`, creating the set on first use.
 *
 * Grouping into a `Map` of `Set`s is the usual way to collect the distinct
 * values behind a key while reading rows once, and the insert-or-create step is
 * the part that is easy to write twice.
 */
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
