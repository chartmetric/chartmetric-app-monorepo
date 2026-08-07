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
