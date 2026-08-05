export interface ColumnPickerOption {
  /** Source or platform the column comes from, shown as a badge. */
  group?: string;
  key: string;
  label: string;
}

export interface ColumnPickerPreset {
  keys: readonly string[];
  name: string;
}

export interface ColumnPickerLabels {
  cancel: string;
  configureDescription: string;
  configureTitle: string;
  deleteGroup: (name: string) => string;
  empty: string;
  groupNamePlaceholder: string;
  hiddenSection: string;
  moveDown: (label: string) => string;
  moveUp: (label: string) => string;
  presetsSection: string;
  reset: string;
  save: string;
  saveAsGroup: string;
  searchPlaceholder: string;
  trigger: string;
  visibleSection: string;
}

export const isSamePreset = (
  value: readonly string[],
  keys: readonly string[],
): boolean =>
  keys.length === value.length && keys.every((key) => value.includes(key));

export const moveKey = (
  keys: readonly string[],
  from: number,
  to: number,
): string[] => {
  const next = [...keys];
  const [moved] = next.splice(from, 1);

  if (moved !== undefined) next.splice(to, 0, moved);

  return next;
};
