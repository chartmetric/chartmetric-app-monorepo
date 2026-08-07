export interface ColumnPickerOption {
  /** Source or platform the column comes from, shown as a badge. */
  group?: string;
  key: string;
  label: string;
  /**
   * Keeps the column visible and in place: it cannot be hidden, moved, or
   * displaced by another column moving onto it. For the identity column a table
   * pins to its left edge, which is unreadable without.
   */
  locked?: boolean;
}

export interface ColumnPickerPreset {
  keys: readonly string[];
  name: string;
}

export interface ColumnPickerLabels {
  /** Dismisses the modal. Changes apply as they are made, so nothing is undone. */
  close: string;
  configureDescription: string;
  configureTitle: string;
  deleteGroup: (name: string) => string;
  dragHandle: (label: string) => string;
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

/**
 * Compares index by index rather than by membership. Order is what the configure
 * modal exists to change, so a preset holding the same columns in a different
 * order is a different preset — and a membership test would also call
 * `["a", "a"]` equal to `["a", "b"]`.
 */
export const isSamePreset = (
  value: readonly string[],
  keys: readonly string[],
): boolean =>
  keys.length === value.length &&
  keys.every((key, index) => value[index] === key);

/**
 * Whether `from` can move to `to`. A locked column neither moves nor gives up
 * its position, so both ends are checked.
 */
export const canMoveTo = (
  options: readonly ColumnPickerOption[],
  from: number,
  to: number,
): boolean =>
  to >= 0 &&
  to < options.length &&
  from !== to &&
  options[from]?.locked !== true &&
  options[to]?.locked !== true;

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
