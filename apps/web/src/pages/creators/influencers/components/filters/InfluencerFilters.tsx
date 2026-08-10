import { useLingui } from "@lingui/react/macro";
import { Button, Drawer, TextInput } from "@mantine/core";
import { useDebouncedCallback, useDisclosure } from "@mantine/hooks";
import { FilterBar } from "@repo/ui/filter-bar";
import {
  MultiSelectFilter,
  type MultiSelectFilterOption,
  type MultiSelectFilterValue,
} from "@repo/ui/multi-select-filter";
import { type FC, useMemo, useState } from "react";

import type {
  InfluencerFilterOptionsReply,
  InfluencerFilters as InfluencerFilterQuery,
} from "../../types";

import { useAbbreviatedNumber } from "../../../../../hooks/use-abbreviated-number";
import { useCountryName } from "../../../../../lib/country-names";
import { useInfluencerValueLabels } from "../../use-influencer-value-labels";
import {
  createFilterDraft,
  type InfluencerFilterDraft,
  toFilterQuery,
} from "../../utils/influencer-filter-draft";
import { InfluencerFiltersDrawerContent } from "./InfluencerFiltersDrawer";

type CategoricalFilterKey =
  "ageGroups" | "categories" | "countries" | "genders";

interface InfluencerFiltersProps {
  isLoading: boolean;
  onChange: (filters: InfluencerFilterQuery) => void;
  options: InfluencerFilterOptionsReply | undefined;
}

export type FilterOptionLists = Record<
  CategoricalFilterKey,
  MultiSelectFilterOption[]
>;

const useFilterOptionLists = (
  options: InfluencerFilterOptionsReply | undefined,
): FilterOptionLists => {
  const formatCount = useAbbreviatedNumber();
  const formatCountry = useCountryName();
  const { formatAgeGroup, formatGender } = useInfluencerValueLabels();

  return useMemo(
    () => ({
      ageGroups: (options?.ageGroups ?? []).map(({ count, value }) => ({
        description: formatCount(count),
        label: formatAgeGroup(value),
        value,
      })),
      categories: (options?.categories ?? []).map(({ count, value }) => ({
        description: formatCount(count),
        label: value,
        value,
      })),
      countries: (options?.countries ?? []).map(({ count, value }) => ({
        description: formatCount(count),
        label: formatCountry(value),
        value,
      })),
      genders: (options?.genders ?? []).map(({ count, value }) => ({
        description: formatCount(count),
        label: formatGender(value),
        value,
      })),
    }),
    [formatAgeGroup, formatCount, formatCountry, formatGender, options],
  );
};

interface CategoricalFiltersProps {
  disabled: boolean;
  draft: InfluencerFilterDraft;
  onChange: (key: CategoricalFilterKey, value: MultiSelectFilterValue) => void;
  optionLists: FilterOptionLists;
}

const CategoricalFilters: FC<CategoricalFiltersProps> = ({
  disabled,
  draft,
  onChange,
  optionLists,
}) => {
  const { t } = useLingui();

  return (
    <>
      {(
        [
          ["categories", t`Category`, t`Search categories…`],
          ["countries", t`Country`, t`Search countries…`],
          ["genders", t`Gender`, t`Search genders…`],
          ["ageGroups", t`Age`, t`Search age groups…`],
        ] as const
      ).map(([key, label, searchPlaceholder]) => (
        <MultiSelectFilter
          disabled={disabled}
          emptyMessage={t`No matching options`}
          excludeLabel={t`Exclude`}
          includeLabel={t`Include`}
          key={key}
          label={label}
          onChange={(value) => {
            onChange(key, value);
          }}
          options={optionLists[key]}
          searchPlaceholder={searchPlaceholder}
          value={draft[key]}
        />
      ))}
    </>
  );
};

interface HandleSearchInputProps {
  onChange: (handle: string) => void;
  value: string;
}

const HandleSearchInput: FC<HandleSearchInputProps> = ({ onChange, value }) => {
  const { t } = useLingui();
  const [text, setText] = useState(value);
  const emit = useDebouncedCallback(onChange, 350);

  return (
    <TextInput
      aria-label={t`Search by handle`}
      autoComplete="off"
      maxLength={100}
      name="influencer-handle-search"
      onChange={(event) => {
        const handle = event.currentTarget.value;

        setText(handle);
        emit(handle);
      }}
      placeholder={t`Search handles…`}
      value={text}
      w={{ base: "100%", sm: 240 }}
    />
  );
};

export const InfluencerFilters: FC<InfluencerFiltersProps> = ({
  isLoading,
  onChange,
  options,
}) => {
  const { t } = useLingui();
  const [draft, setDraft] = useState(createFilterDraft);
  const [clearCount, setClearCount] = useState(0);
  const [isDrawerOpen, drawer] = useDisclosure(false);
  const optionLists = useFilterOptionLists(options);
  const areOptionsDisabled = isLoading || options === undefined;

  // The draft updates immediately so controls stay responsive; the query
  // commit is debounced so bursts of clicks or keystrokes fetch once.
  const applyDraft = useDebouncedCallback(
    (nextDraft: InfluencerFilterDraft) => {
      onChange(toFilterQuery(nextDraft));
    },
    350,
  );

  const commitDraft = (nextDraft: InfluencerFilterDraft): void => {
    setDraft(nextDraft);
    applyDraft(nextDraft);
  };

  return (
    <>
      <FilterBar
        clearLabel={t`Clear filters`}
        label={t`Filters`}
        onClear={() => {
          setClearCount((count) => count + 1);
          commitDraft(createFilterDraft());
        }}
      >
        <HandleSearchInput
          key={clearCount}
          onChange={(handle) => {
            commitDraft({ ...draft, handle });
          }}
          value={draft.handle}
        />
        <CategoricalFilters
          disabled={areOptionsDisabled}
          draft={draft}
          onChange={(key, value) => {
            commitDraft({ ...draft, [key]: value });
          }}
          optionLists={optionLists}
        />
        <Button onClick={drawer.open} type="button" variant="default">
          {t`All filters`}
        </Button>
      </FilterBar>
      <Drawer
        onClose={drawer.close}
        opened={isDrawerOpen}
        position="right"
        title={t`Filters`}
      >
        <InfluencerFiltersDrawerContent
          disabled={areOptionsDisabled}
          draft={draft}
          onDraftChange={commitDraft}
          optionLists={optionLists}
        />
      </Drawer>
    </>
  );
};
