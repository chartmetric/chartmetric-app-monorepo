import {
  Button,
  Checkbox,
  Combobox,
  Group,
  SegmentedControl,
  Stack,
  Text,
  useCombobox,
} from "@mantine/core";
import { type FC, type ReactNode, useState } from "react";

export type FilterSelectionMode = "exclude" | "include";

export interface MultiSelectFilterValue {
  excluded: string[];
  included: string[];
}

export const emptyMultiSelectValue = (): MultiSelectFilterValue => ({
  excluded: [],
  included: [],
});

export interface MultiSelectFilterOption {
  description?: ReactNode;
  label: string;
  value: string;
}

export const toFilterOptions = (
  values: readonly string[],
): MultiSelectFilterOption[] =>
  values.map((value) => ({ label: value, value }));

/**
 * Options that show how many records carry each value. The caller formats the
 * count, so this package stays free of locale knowledge.
 */
export const toCountedFilterOptions = (
  options: readonly { count: number; value: string }[],
  formatCount: (count: number) => string,
): MultiSelectFilterOption[] =>
  options.map(({ count, value }) => ({
    description: formatCount(count),
    label: value,
    value,
  }));

export interface MultiSelectFilterProps {
  /**
   * Whether the reader can exclude as well as include. Some filters resolve
   * through a lookup that can only answer which values belong to a set, so they
   * have no exclude to offer and must not show the control.
   */
  canExclude?: boolean;
  disabled?: boolean;
  emptyMessage: string;
  excludeLabel: string;
  includeLabel: string;
  label: string;
  onChange: (value: MultiSelectFilterValue) => void;
  options: readonly MultiSelectFilterOption[];
  searchPlaceholder: string;
  value: MultiSelectFilterValue;
}

interface FilterOptionsProps {
  emptyMessage: string;
  excludedValues: ReadonlySet<string>;
  includedValues: ReadonlySet<string>;
  mode: FilterSelectionMode;
  options: readonly MultiSelectFilterOption[];
}

// Each tab is a view of its own list: the include tab only marks included
// options and the exclude tab only marks excluded ones, so a value never
// looks selected on the tab that did not select it.
const FilterOptions: FC<FilterOptionsProps> = ({
  emptyMessage,
  excludedValues,
  includedValues,
  mode,
  options,
}) => {
  const selectedValues = mode === "include" ? includedValues : excludedValues;

  return (
    <Combobox.Options mah={280} style={{ overflowY: "auto" }}>
      {options.length === 0 ? (
        <Combobox.Empty>{emptyMessage}</Combobox.Empty>
      ) : (
        options.map((option) => (
          <Combobox.Option
            active={selectedValues.has(option.value)}
            key={option.value}
            value={option.value}
          >
            <Group gap="sm" justify="space-between" wrap="nowrap">
              <Group gap="sm" wrap="nowrap">
                <Checkbox
                  {...(mode === "exclude" && { color: "red" })}
                  aria-hidden="true"
                  checked={selectedValues.has(option.value)}
                  readOnly
                  tabIndex={-1}
                />
                <Text size="sm">{option.label}</Text>
              </Group>
              {option.description === undefined ? null : (
                <Text c="dimmed" size="xs">
                  {option.description}
                </Text>
              )}
            </Group>
          </Combobox.Option>
        ))
      )}
    </Combobox.Options>
  );
};

interface FilterDropdownProps extends FilterOptionsProps {
  canExclude: boolean;
  excludeLabel: string;
  includeLabel: string;
  mode: FilterSelectionMode;
  onModeChange: (mode: FilterSelectionMode) => void;
  onSearchChange: (search: string) => void;
  search: string;
  searchPlaceholder: string;
}

const FilterDropdown: FC<FilterDropdownProps> = ({
  canExclude,
  emptyMessage,
  excludedValues,
  excludeLabel,
  includedValues,
  includeLabel,
  mode,
  onModeChange,
  onSearchChange,
  options,
  search,
  searchPlaceholder,
}) => (
  <Combobox.Dropdown maw="calc(100vw - var(--mantine-spacing-md) * 2)">
    <Stack gap="xs" p="xs">
      {canExclude ? (
        <SegmentedControl
          data={[
            { label: includeLabel, value: "include" },
            { label: excludeLabel, value: "exclude" },
          ]}
          fullWidth
          onChange={(nextMode) => {
            onModeChange(nextMode === "exclude" ? "exclude" : "include");
          }}
          value={mode}
        />
      ) : null}
      <Combobox.Search
        aria-label={searchPlaceholder}
        onChange={(event) => {
          onSearchChange(event.currentTarget.value);
        }}
        placeholder={searchPlaceholder}
        value={search}
      />
    </Stack>
    <FilterOptions
      emptyMessage={emptyMessage}
      excludedValues={excludedValues}
      includedValues={includedValues}
      mode={mode}
      options={options}
    />
  </Combobox.Dropdown>
);

const filterOptionsBySearch = (
  options: readonly MultiSelectFilterOption[],
  search: string,
): readonly MultiSelectFilterOption[] => {
  const normalizedSearch = search.trim().toLocaleLowerCase();

  return normalizedSearch === ""
    ? options
    : options.filter((option) =>
        option.label.toLocaleLowerCase().includes(normalizedSearch),
      );
};

const without = (values: string[], value: string): string[] =>
  values.filter((currentValue) => currentValue !== value);

const toggleMultiSelectValue = (
  value: MultiSelectFilterValue,
  mode: FilterSelectionMode,
  selectedValue: string,
): MultiSelectFilterValue => {
  if (mode === "include") {
    return {
      excluded: without(value.excluded, selectedValue),
      included: value.included.includes(selectedValue)
        ? without(value.included, selectedValue)
        : [...value.included, selectedValue],
    };
  }

  return {
    excluded: value.excluded.includes(selectedValue)
      ? without(value.excluded, selectedValue)
      : [...value.excluded, selectedValue],
    included: without(value.included, selectedValue),
  };
};

export const MultiSelectFilter: FC<MultiSelectFilterProps> = ({
  canExclude = true,
  disabled = false,
  emptyMessage,
  excludeLabel,
  includeLabel,
  label,
  onChange,
  options,
  searchPlaceholder,
  value,
}) => {
  const [search, setSearch] = useState("");
  const [mode, setMode] = useState<FilterSelectionMode>("include");
  const combobox = useCombobox({
    onDropdownClose: () => {
      combobox.resetSelectedOption();
      setSearch("");
    },
    onDropdownOpen: () => {
      combobox.selectFirstOption();
    },
  });
  const includedValues = new Set(value.included);
  const excludedValues = new Set(value.excluded);
  const selectionCount = value.included.length + value.excluded.length;
  const filteredOptions = filterOptionsBySearch(options, search);

  return (
    <Combobox
      onOptionSubmit={(selectedValue) => {
        onChange(toggleMultiSelectValue(value, mode, selectedValue));
      }}
      position="bottom-start"
      shadow="md"
      store={combobox}
      width={320}
      withinPortal
    >
      <Combobox.Target targetType="button" withExpandedAttribute>
        <Button
          aria-label={label}
          disabled={disabled}
          onClick={() => {
            combobox.toggleDropdown();
          }}
          rightSection={<Combobox.Chevron />}
          type="button"
          variant={selectionCount === 0 ? "default" : "light"}
        >
          {label}
          {selectionCount === 0 ? null : ` (${String(selectionCount)})`}
        </Button>
      </Combobox.Target>
      <FilterDropdown
        canExclude={canExclude}
        emptyMessage={emptyMessage}
        excludedValues={excludedValues}
        excludeLabel={excludeLabel}
        includedValues={includedValues}
        includeLabel={includeLabel}
        mode={mode}
        onModeChange={setMode}
        onSearchChange={(nextSearch) => {
          setSearch(nextSearch);
          combobox.updateSelectedOptionIndex();
        }}
        options={filteredOptions}
        search={search}
        searchPlaceholder={searchPlaceholder}
      />
    </Combobox>
  );
};
