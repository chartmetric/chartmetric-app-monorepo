import type { FC } from "react";

import { useLingui } from "@lingui/react/macro";
import { Stack } from "@mantine/core";
import {
  CheckboxListFilter,
  type CheckboxListFilterOption,
} from "@repo/ui/checkbox-list-filter";

import type { InfluencerFilterDraft } from "../../utils/influencer-filter-draft";
import type { FilterOptionLists } from "./InfluencerFilters";

interface InfluencerFiltersDrawerContentProps {
  disabled: boolean;
  draft: InfluencerFilterDraft;
  onDraftChange: (draft: InfluencerFilterDraft) => void;
  optionLists: FilterOptionLists;
}

export const InfluencerFiltersDrawerContent: FC<
  InfluencerFiltersDrawerContentProps
> = ({ disabled, draft, onDraftChange, optionLists }) => {
  const { t } = useLingui();

  const fields: {
    key: keyof FilterOptionLists;
    label: string;
    options: CheckboxListFilterOption[];
    searchPlaceholder: string;
  }[] = [
    {
      key: "categories",
      label: t`Category`,
      options: optionLists.categories,
      searchPlaceholder: t`Search categories…`,
    },
    {
      key: "countries",
      label: t`Country`,
      options: optionLists.countries,
      searchPlaceholder: t`Search countries…`,
    },
    {
      key: "genders",
      label: t`Gender`,
      options: optionLists.genders,
      searchPlaceholder: t`Search genders…`,
    },
    {
      key: "ageGroups",
      label: t`Age`,
      options: optionLists.ageGroups,
      searchPlaceholder: t`Search age groups…`,
    },
  ];

  return (
    <Stack gap="xl">
      {fields.map(({ key, label, options, searchPlaceholder }) => (
        <CheckboxListFilter
          disabled={disabled}
          emptyMessage={t`No matching options`}
          key={key}
          label={label}
          onChange={(value) => {
            onDraftChange({ ...draft, [key]: value });
          }}
          options={options}
          searchPlaceholder={searchPlaceholder}
          value={draft[key]}
        />
      ))}
    </Stack>
  );
};
