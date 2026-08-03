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
  mode: FilterSelectionMode;
  values: string[];
}

export interface MultiSelectFilterOption {
  description?: ReactNode;
  label: string;
  value: string;
}

export interface MultiSelectFilterProps {
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
  options: readonly MultiSelectFilterOption[];
  selectedValues: ReadonlySet<string>;
}

const FilterOptions: FC<FilterOptionsProps> = ({
  emptyMessage,
  options,
  selectedValues,
}) => (
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

interface FilterDropdownProps extends FilterOptionsProps {
  excludeLabel: string;
  includeLabel: string;
  mode: FilterSelectionMode;
  onModeChange: (mode: FilterSelectionMode) => void;
  onSearchChange: (search: string) => void;
  search: string;
  searchPlaceholder: string;
}

const FilterDropdown: FC<FilterDropdownProps> = ({
  emptyMessage,
  excludeLabel,
  includeLabel,
  mode,
  onModeChange,
  onSearchChange,
  options,
  search,
  searchPlaceholder,
  selectedValues,
}) => (
  <Combobox.Dropdown maw="calc(100vw - var(--mantine-spacing-md) * 2)">
    <Stack gap="xs" p="xs">
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
      options={options}
      selectedValues={selectedValues}
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

export const MultiSelectFilter: FC<MultiSelectFilterProps> = ({
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
  const combobox = useCombobox({
    onDropdownClose: () => {
      combobox.resetSelectedOption();
      setSearch("");
    },
    onDropdownOpen: () => {
      combobox.selectFirstOption();
    },
  });
  const selectedValues = new Set(value.values);
  const filteredOptions = filterOptionsBySearch(options, search);

  const selectValue = (selectedValue: string): void => {
    onChange({
      mode: value.mode,
      values: selectedValues.has(selectedValue)
        ? value.values.filter((currentValue) => currentValue !== selectedValue)
        : [...value.values, selectedValue],
    });
  };

  return (
    <Combobox
      onOptionSubmit={selectValue}
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
          variant={value.values.length === 0 ? "default" : "light"}
        >
          {label}
          {value.values.length === 0
            ? null
            : ` (${String(value.values.length)})`}
        </Button>
      </Combobox.Target>
      <FilterDropdown
        emptyMessage={emptyMessage}
        excludeLabel={excludeLabel}
        includeLabel={includeLabel}
        mode={value.mode}
        onModeChange={(mode) => {
          onChange({ mode, values: value.values });
        }}
        onSearchChange={(nextSearch) => {
          setSearch(nextSearch);
          combobox.updateSelectedOptionIndex();
        }}
        options={filteredOptions}
        search={search}
        searchPlaceholder={searchPlaceholder}
        selectedValues={selectedValues}
      />
    </Combobox>
  );
};
