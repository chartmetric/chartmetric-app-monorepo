import type { NumericRangeValue } from "@repo/ui/range-filter";
import type { FC } from "react";

import { useLingui } from "@lingui/react/macro";
import {
  Group,
  NumberInput,
  RangeSlider,
  Stack,
  Switch,
  Text,
} from "@mantine/core";
import {
  CheckboxListFilter,
  type CheckboxListFilterOption,
} from "@repo/ui/checkbox-list-filter";

import type { ArtistFilterDraft } from "./artist-filter-draft";

interface FollowerRangeInputsProps {
  formatValue: (value: number) => string;
  label: string;
  max: number | undefined;
  maximumLabel: string;
  minimumLabel: string;
  onChange: (value: NumericRangeValue) => void;
  onPreview: (value: NumericRangeValue) => void;
  value: NumericRangeValue;
}

const toNumberOrNull = (value: number | string | undefined): number | null =>
  typeof value === "number" ? value : null;

const FollowerRangeInputs: FC<FollowerRangeInputsProps> = ({
  formatValue,
  label,
  max,
  maximumLabel,
  minimumLabel,
  onChange,
  onPreview,
  value,
}) => {
  const { t } = useLingui();

  return (
    <Stack component="fieldset" gap="sm" p={0} style={{ border: 0 }}>
      <Text component="legend" fw={600} size="sm" tt="uppercase">
        {label}
      </Text>
      {max === undefined ? null : (
        <RangeSlider
          aria-label={label}
          label={formatValue}
          max={max}
          min={0}
          onChange={onPreview}
          onChangeEnd={onChange}
          value={[value[0] ?? 0, value[1] ?? max]}
        />
      )}
      <Group grow>
        <NumberInput
          aria-label={minimumLabel}
          min={0}
          onChange={(nextValue) => {
            onChange([toNumberOrNull(nextValue), value[1]]);
          }}
          placeholder={t`Min`}
          value={value[0] ?? ""}
        />
        <NumberInput
          aria-label={maximumLabel}
          min={0}
          onChange={(nextValue) => {
            onChange([value[0], toNumberOrNull(nextValue)]);
          }}
          placeholder={t`Max`}
          value={value[1] ?? ""}
        />
      </Group>
    </Stack>
  );
};

interface VerifiedArtistsFilterProps {
  isChecked: boolean;
  onChange: (isChecked: boolean) => void;
}

const VerifiedArtistsFilter: FC<VerifiedArtistsFilterProps> = ({
  isChecked,
  onChange,
}) => {
  const { t } = useLingui();

  return (
    <Stack component="fieldset" gap="sm" p={0} style={{ border: 0 }}>
      <Text component="legend" fw={600} size="sm" tt="uppercase">
        {t`Audience`}
      </Text>
      <Switch
        checked={isChecked}
        description={t`Platform-verified accounts`}
        label={t`Verified artists only`}
        labelPosition="left"
        onChange={(event) => {
          onChange(event.currentTarget.checked);
        }}
      />
    </Stack>
  );
};

interface ArtistFiltersDrawerContentProps {
  countryOptions: CheckboxListFilterOption[];
  disabled: boolean;
  draft: ArtistFilterDraft;
  formatFollowers: (value: number) => string;
  genreOptions: CheckboxListFilterOption[];
  instagramFollowersMax: number | undefined;
  onDraftChange: (draft: ArtistFilterDraft) => void;
  onDraftPreview: (draft: ArtistFilterDraft) => void;
  tiktokFollowersMax: number | undefined;
}

export const ArtistFiltersDrawerContent: FC<
  ArtistFiltersDrawerContentProps
> = ({
  countryOptions,
  disabled,
  draft,
  formatFollowers,
  genreOptions,
  instagramFollowersMax,
  onDraftChange,
  onDraftPreview,
  tiktokFollowersMax,
}) => {
  const { t } = useLingui();

  return (
    <Stack gap="xl">
      <CheckboxListFilter
        disabled={disabled}
        emptyMessage={t`No matching options`}
        label={t`Genre`}
        onChange={(genres) => {
          onDraftChange({ ...draft, genres });
        }}
        options={genreOptions}
        searchPlaceholder={t`Search genres…`}
        value={draft.genres}
      />
      <CheckboxListFilter
        disabled={disabled}
        emptyMessage={t`No matching options`}
        label={t`Country`}
        onChange={(countries) => {
          onDraftChange({ ...draft, countries });
        }}
        options={countryOptions}
        searchPlaceholder={t`Search countries…`}
        value={draft.countries}
      />
      <FollowerRangeInputs
        formatValue={formatFollowers}
        label={t`Instagram followers`}
        max={instagramFollowersMax}
        maximumLabel={t`Maximum Instagram followers`}
        minimumLabel={t`Minimum Instagram followers`}
        onChange={(instagramFollowers) => {
          onDraftChange({ ...draft, instagramFollowers });
        }}
        onPreview={(instagramFollowers) => {
          onDraftPreview({ ...draft, instagramFollowers });
        }}
        value={draft.instagramFollowers}
      />
      <FollowerRangeInputs
        formatValue={formatFollowers}
        label={t`TikTok followers`}
        max={tiktokFollowersMax}
        maximumLabel={t`Maximum TikTok followers`}
        minimumLabel={t`Minimum TikTok followers`}
        onChange={(tiktokFollowers) => {
          onDraftChange({ ...draft, tiktokFollowers });
        }}
        onPreview={(tiktokFollowers) => {
          onDraftPreview({ ...draft, tiktokFollowers });
        }}
        value={draft.tiktokFollowers}
      />
      <VerifiedArtistsFilter
        isChecked={draft.verifiedOnly}
        onChange={(verifiedOnly) => {
          onDraftChange({ ...draft, verifiedOnly });
        }}
      />
    </Stack>
  );
};
