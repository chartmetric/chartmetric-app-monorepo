import { Checkbox, ScrollArea, Stack, Text, TextInput } from "@mantine/core";
import { type FC, type ReactNode, useState } from "react";

import type { MultiSelectFilterValue } from "./MultiSelectFilter";

export interface CheckboxListFilterOption {
  description?: ReactNode;
  label: string;
  value: string;
}

export interface CheckboxListFilterProps {
  disabled?: boolean;
  emptyMessage: string;
  label: string;
  maxListHeight?: number;
  onChange: (value: MultiSelectFilterValue) => void;
  options: readonly CheckboxListFilterOption[];
  searchPlaceholder: string;
  value: MultiSelectFilterValue;
}

const without = (values: string[], value: string): string[] =>
  values.filter((currentValue) => currentValue !== value);

// Each click advances one option through neutral → included → excluded.
const cycleCheckboxValue = (
  value: MultiSelectFilterValue,
  optionValue: string,
): MultiSelectFilterValue => {
  if (value.included.includes(optionValue)) {
    return {
      excluded: [...value.excluded, optionValue],
      included: without(value.included, optionValue),
    };
  }
  if (value.excluded.includes(optionValue)) {
    return { ...value, excluded: without(value.excluded, optionValue) };
  }

  return { ...value, included: [...value.included, optionValue] };
};

export const CheckboxListFilter: FC<CheckboxListFilterProps> = ({
  disabled = false,
  emptyMessage,
  label,
  maxListHeight = 240,
  onChange,
  options,
  searchPlaceholder,
  value,
}) => {
  const [search, setSearch] = useState("");
  const normalizedSearch = search.trim().toLowerCase();
  const visibleOptions =
    normalizedSearch === ""
      ? options
      : options.filter((option) =>
          option.label.toLowerCase().includes(normalizedSearch),
        );

  return (
    <Stack component="fieldset" gap="sm" p={0} style={{ border: 0 }}>
      <Text component="legend" fw={600} size="sm" tt="uppercase">
        {label}
      </Text>
      <TextInput
        aria-label={searchPlaceholder}
        disabled={disabled}
        onChange={(event) => {
          setSearch(event.currentTarget.value);
        }}
        placeholder={searchPlaceholder}
        value={search}
      />
      <ScrollArea.Autosize mah={maxListHeight} type="auto">
        <Stack gap="xs">
          {visibleOptions.length === 0 ? (
            <Text c="dimmed" size="sm">
              {emptyMessage}
            </Text>
          ) : (
            visibleOptions.map((option) => {
              const isExcluded = value.excluded.includes(option.value);

              return (
                <Checkbox
                  key={option.value}
                  {...(isExcluded && { color: "red" })}
                  checked={value.included.includes(option.value)}
                  description={option.description}
                  disabled={disabled}
                  indeterminate={isExcluded}
                  label={option.label}
                  onChange={() => {
                    onChange(cycleCheckboxValue(value, option.value));
                  }}
                />
              );
            })
          )}
        </Stack>
      </ScrollArea.Autosize>
    </Stack>
  );
};
