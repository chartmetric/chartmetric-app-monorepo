export interface ColumnPickerOption {
  group?: string;
  key: string;
  label: string;
  locked?: boolean;
}

export interface ColumnPickerPreset {
  keys: readonly string[];
  name: string;
}

export interface ColumnPickerLabels {
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
