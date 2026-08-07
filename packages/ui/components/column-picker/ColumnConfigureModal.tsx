import {
  Button,
  Divider,
  Group,
  Modal,
  ScrollArea,
  Stack,
  TextInput,
} from "@mantine/core";
import { type FC, useMemo, useState } from "react";

import type { ColumnPickerLabels, ColumnPickerOption } from "./types";

import { ColumnLists, ColumnSearchResults } from "./ColumnLists";

export interface ColumnConfigureModalProps {
  defaultKeys: readonly string[];
  isOpen: boolean;
  labels: ColumnPickerLabels;
  onChange: (keys: string[]) => void;
  onClose: () => void;
  onSaveGroup?: (name: string) => void;
  options: readonly ColumnPickerOption[];
  value: readonly string[];
}

const MODAL_LIST_MAX_HEIGHT = 360;

const isMatch = (option: ColumnPickerOption, search: string): boolean =>
  option.label.toLocaleLowerCase().includes(search) ||
  (option.group ?? "").toLocaleLowerCase().includes(search);

// Null means "not searching", which is what shows the grouped lists instead.
const findMatches = (
  search: string,
  visibleOptions: readonly ColumnPickerOption[],
  hiddenOptions: readonly ColumnPickerOption[],
): ColumnPickerOption[] | null => {
  const normalized = search.trim().toLocaleLowerCase();

  return normalized === ""
    ? null
    : [...visibleOptions, ...hiddenOptions].filter((option) =>
        isMatch(option, normalized),
      );
};

// Visible columns follow the caller's order, which is also the column order in
// the table, so reordering the list reorders the table.
const usePartitionedOptions = (
  options: readonly ColumnPickerOption[],
  value: readonly string[],
): {
  hiddenOptions: ColumnPickerOption[];
  visibleOptions: ColumnPickerOption[];
} =>
  useMemo(() => {
    const byKey = new Map(options.map((option) => [option.key, option]));

    return {
      hiddenOptions: options.filter((option) => !value.includes(option.key)),
      visibleOptions: value
        .map((key) => byKey.get(key))
        .filter((option): option is ColumnPickerOption => option !== undefined),
    };
  }, [options, value]);

interface SearchInputProps {
  onChange: (search: string) => void;
  placeholder: string;
  value: string;
}

const SearchInput: FC<SearchInputProps> = ({
  onChange,
  placeholder,
  value,
}) => (
  <TextInput
    aria-label={placeholder}
    onChange={(event) => {
      onChange(event.currentTarget.value);
    }}
    placeholder={placeholder}
    value={value}
  />
);

interface SaveGroupFieldProps {
  hasSelection: boolean;
  labels: ColumnPickerLabels;
  onSave: (name: string) => void;
}

const SaveGroupField: FC<SaveGroupFieldProps> = ({
  hasSelection,
  labels,
  onSave,
}) => {
  const [groupName, setGroupName] = useState("");

  return (
    <Group align="flex-end" gap="xs" wrap="nowrap">
      <TextInput
        aria-label={labels.saveAsGroup}
        flex={1}
        onChange={(event) => {
          setGroupName(event.currentTarget.value);
        }}
        placeholder={labels.groupNamePlaceholder}
        value={groupName}
      />
      <Button
        disabled={!hasSelection || groupName.trim() === ""}
        onClick={() => {
          onSave(groupName.trim());
          setGroupName("");
        }}
        variant="light"
      >
        {labels.save}
      </Button>
    </Group>
  );
};

export const ColumnConfigureModal: FC<ColumnConfigureModalProps> = ({
  defaultKeys,
  isOpen,
  labels,
  onChange,
  onClose,
  onSaveGroup,
  options,
  value,
}) => {
  const [search, setSearch] = useState("");
  const { hiddenOptions, visibleOptions } = usePartitionedOptions(
    options,
    value,
  );
  const searchResults = findMatches(search, visibleOptions, hiddenOptions);

  const toggle = (key: string): void => {
    onChange(
      value.includes(key)
        ? value.filter((current) => current !== key)
        : [...value, key],
    );
  };
  const close = (): void => {
    setSearch("");
    onClose();
  };

  return (
    <Modal
      onClose={close}
      opened={isOpen}
      size="md"
      title={labels.configureTitle}
    >
      <Stack gap="sm">
        <SearchInput
          onChange={setSearch}
          placeholder={labels.searchPlaceholder}
          value={search}
        />
        <ScrollArea.Autosize mah={MODAL_LIST_MAX_HEIGHT}>
          {searchResults === null ? (
            <ColumnLists
              hiddenOptions={hiddenOptions}
              labels={labels}
              onChange={onChange}
              onToggle={toggle}
              value={value}
              visibleOptions={visibleOptions}
            />
          ) : (
            <ColumnSearchResults
              emptyMessage={labels.empty}
              onToggle={toggle}
              results={searchResults}
              value={value}
            />
          )}
        </ScrollArea.Autosize>
        <Divider />
        {onSaveGroup === undefined ? null : (
          <SaveGroupField
            hasSelection={value.length > 0}
            labels={labels}
            onSave={onSaveGroup}
          />
        )}
        <ModalFooter
          closeLabel={labels.close}
          onClose={close}
          onReset={() => {
            onChange([...defaultKeys]);
          }}
          resetLabel={labels.reset}
        />
      </Stack>
    </Modal>
  );
};

interface ModalFooterProps {
  closeLabel: string;
  onClose: () => void;
  onReset: () => void;
  resetLabel: string;
}

const ModalFooter: FC<ModalFooterProps> = ({
  closeLabel,
  onClose,
  onReset,
  resetLabel,
}) => (
  <Group justify="space-between">
    <Button onClick={onReset} variant="subtle">
      {resetLabel}
    </Button>
    <Button onClick={onClose} variant="default">
      {closeLabel}
    </Button>
  </Group>
);
