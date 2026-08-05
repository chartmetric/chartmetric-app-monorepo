import type { FC } from "react";

import { TextInput, type TextInputProps } from "@mantine/core";

export interface SearchInputProps {
  disabled?: boolean;
  /** Accessible name for the field; the placeholder alone is not one. */
  label: string;
  name?: string;
  onChange: (value: string) => void;
  placeholder: string;
  value: string;
  width?: TextInputProps["w"];
}

const DEFAULT_WIDTH = { base: "100%", sm: 220 };

export const SearchInput: FC<SearchInputProps> = ({
  disabled = false,
  label,
  name,
  onChange,
  placeholder,
  value,
  width = DEFAULT_WIDTH,
}) => (
  <TextInput
    aria-label={label}
    autoComplete="off"
    disabled={disabled}
    name={name}
    onChange={(event) => {
      onChange(event.currentTarget.value);
    }}
    placeholder={placeholder}
    value={value}
    w={width}
  />
);
