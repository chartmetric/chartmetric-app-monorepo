import { Button } from "@mantine/core";
import { type FC, useMemo, useState } from "react";

import type {
  ColumnPickerLabels as Labels,
  ColumnPickerOption as Option,
  ColumnPickerPreset as Preset,
} from "./types";

import { ColumnConfigureModal } from "./ColumnConfigureModal";
import { ColumnPickerMenu } from "./ColumnPickerMenu";

// Re-exported through aliases rather than `export … from`, which reads as a
// barrel file to the lint rule that bans them.
export type ColumnPickerLabels = Labels;
export type ColumnPickerOption = Option;
export type ColumnPickerPreset = Preset;

export interface ColumnPickerProps {
  customPresets?: readonly Preset[];
  defaultKeys: readonly string[];
  labels: Labels;
  onChange: (keys: string[]) => void;
  onCustomPresetsChange?: (presets: Preset[]) => void;
  options: readonly Option[];
  presets?: readonly Preset[];
  value: readonly string[];
}

const ConfigureTrigger: FC<{ label: string; onOpen: () => void }> = ({
  label,
  onOpen,
}) => (
  <Button onClick={onOpen} type="button" variant="default">
    {label}
  </Button>
);

export const ColumnPicker: FC<ColumnPickerProps> = ({
  customPresets = [],
  defaultKeys,
  labels,
  onChange,
  onCustomPresetsChange,
  options,
  presets = [],
  value,
}) => {
  const [isConfigureOpen, setIsConfigureOpen] = useState(false);
  const openConfigure = (): void => {
    setIsConfigureOpen(true);
  };
  const knownKeys = useMemo(
    () => new Set(options.map((option) => option.key)),
    [options],
  );
  const deletePreset =
    onCustomPresetsChange === undefined
      ? undefined
      : (name: string): void => {
          onCustomPresetsChange(
            customPresets.filter((preset) => preset.name !== name),
          );
        };
  const saveGroup = (name: string): void => {
    if (
      onCustomPresetsChange === undefined ||
      name === "" ||
      value.length === 0
    ) {
      return;
    }

    onCustomPresetsChange([
      ...customPresets.filter((preset) => preset.name !== name),
      { keys: [...value], name },
    ]);
  };

  const hasMenu = presets.length > 0 || customPresets.length > 0;

  return (
    <>
      {hasMenu ? (
        <ColumnPickerMenu
          customPresets={customPresets}
          labels={labels}
          onApplyPreset={(keys) => {
            onChange(keys.filter((key) => knownKeys.has(key)));
          }}
          onDeletePreset={deletePreset}
          onOpenConfigure={() => {
            setIsConfigureOpen(true);
          }}
          presets={presets}
          value={value}
        />
      ) : (
        <ConfigureTrigger label={labels.trigger} onOpen={openConfigure} />
      )}
      <ColumnConfigureModal
        defaultKeys={defaultKeys}
        isOpen={isConfigureOpen}
        labels={labels}
        onChange={onChange}
        onClose={() => {
          setIsConfigureOpen(false);
        }}
        options={options}
        value={value}
        {...(onCustomPresetsChange === undefined
          ? {}
          : { onSaveGroup: saveGroup })}
      />
    </>
  );
};
