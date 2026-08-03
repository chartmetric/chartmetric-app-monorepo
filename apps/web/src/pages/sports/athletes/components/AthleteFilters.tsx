import { useLingui } from "@lingui/react/macro";
import { TextInput } from "@mantine/core";
import { FilterBar } from "@repo/ui/filter-bar";
import {
  MultiSelectFilter,
  type MultiSelectFilterOption,
  type MultiSelectFilterValue,
} from "@repo/ui/multi-select-filter";
import { type NumericRangeValue, RangeFilter } from "@repo/ui/range-filter";
import { type FC, useMemo, useState } from "react";

import type { AthleteFilterOptionsReply } from "../athlete-filter-options-query";
import type { AthleteFilters as AthleteFilterQuery } from "../athlete-list-query";

interface AthleteFilterDraft {
  cmScore: NumericRangeValue;
  name: string;
  nationalities: MultiSelectFilterValue;
  sports: MultiSelectFilterValue;
  types: MultiSelectFilterValue;
}

interface AthleteFiltersProps {
  isLoading: boolean;
  onChange: (filters: AthleteFilterQuery) => void;
  options: AthleteFilterOptionsReply | undefined;
}

const createFilterDraft = (): AthleteFilterDraft => ({
  cmScore: [null, null],
  name: "",
  nationalities: { mode: "include", values: [] },
  sports: { mode: "include", values: [] },
  types: { mode: "include", values: [] },
});

const addCategoricalFilter = (
  filters: AthleteFilterQuery,
  includeKey: "nationalities" | "sports" | "types",
  excludeKey: "excludeNationalities" | "excludeSports" | "excludeTypes",
  selection: MultiSelectFilterValue,
): void => {
  if (selection.values.length === 0) return;

  if (selection.mode === "include") {
    filters[includeKey] = selection.values;
  } else {
    filters[excludeKey] = selection.values;
  }
};

const toFilterQuery = (draft: AthleteFilterDraft): AthleteFilterQuery => {
  const filters: AthleteFilterQuery = {};
  const name = draft.name.trim();

  if (name !== "") filters.name = name;
  if (draft.cmScore[0] !== null) filters.minCmScore = draft.cmScore[0];
  if (draft.cmScore[1] !== null) filters.maxCmScore = draft.cmScore[1];
  addCategoricalFilter(
    filters,
    "nationalities",
    "excludeNationalities",
    draft.nationalities,
  );
  addCategoricalFilter(filters, "sports", "excludeSports", draft.sports);
  addCategoricalFilter(filters, "types", "excludeTypes", draft.types);

  return filters;
};

const toDropdownOptions = (
  options: readonly { count: number; value: string }[],
  countFormatter: Intl.NumberFormat,
): MultiSelectFilterOption[] =>
  options.map(({ count, value }) => ({
    description: countFormatter.format(count),
    label: value,
    value,
  }));

interface CategoricalFiltersProps {
  disabled: boolean;
  draft: AthleteFilterDraft;
  onChange: (
    key: "nationalities" | "sports" | "types",
    value: MultiSelectFilterValue,
  ) => void;
  options: AthleteFilterOptionsReply | undefined;
}

const CategoricalFilters: FC<CategoricalFiltersProps> = ({
  disabled,
  draft,
  onChange,
  options,
}) => {
  const { i18n, t } = useLingui();
  const countFormatter = useMemo(
    () => new Intl.NumberFormat(i18n.locale, { notation: "compact" }),
    [i18n.locale],
  );
  const filterOptions = useMemo(
    () => ({
      nationalities: toDropdownOptions(
        options?.nationalities ?? [],
        countFormatter,
      ),
      sports: toDropdownOptions(options?.sports ?? [], countFormatter),
      types: toDropdownOptions(options?.types ?? [], countFormatter),
    }),
    [countFormatter, options],
  );
  const sharedLabels = {
    emptyMessage: t`No matching options`,
    excludeLabel: t`Exclude`,
    includeLabel: t`Include`,
  };

  return (
    <>
      {(
        [
          ["sports", t`Sport`, t`Find a sport…`],
          ["nationalities", t`Nationality`, t`Find a nationality…`],
          ["types", t`Type`, t`Find a type…`],
        ] as const
      ).map(([key, label, searchPlaceholder]) => (
        <MultiSelectFilter
          disabled={disabled}
          emptyMessage={sharedLabels.emptyMessage}
          excludeLabel={sharedLabels.excludeLabel}
          includeLabel={sharedLabels.includeLabel}
          key={key}
          label={label}
          onChange={(value) => {
            onChange(key, value);
          }}
          options={filterOptions[key]}
          searchPlaceholder={searchPlaceholder}
          value={draft[key]}
        />
      ))}
    </>
  );
};

export const AthleteFilters: FC<AthleteFiltersProps> = ({
  isLoading,
  onChange,
  options,
}) => {
  const { t } = useLingui();
  const [draft, setDraft] = useState(createFilterDraft);
  const scoreMin = options?.cmScore.min ?? 0;
  const scoreMax = Math.max(scoreMin + 0.1, options?.cmScore.max ?? 100);
  const areCategoricalFiltersDisabled = isLoading || options === undefined;

  const commitDraft = (nextDraft: AthleteFilterDraft): void => {
    setDraft(nextDraft);
    onChange(toFilterQuery(nextDraft));
  };

  return (
    <FilterBar
      clearLabel={t`Clear filters`}
      label={t`Filters`}
      onClear={() => {
        commitDraft(createFilterDraft());
      }}
    >
      <TextInput
        aria-label={t`Search by name`}
        autoComplete="off"
        name="athlete-search"
        onChange={(event) => {
          const name = event.currentTarget.value;

          commitDraft({ ...draft, name });
        }}
        placeholder={t`Search athletes…`}
        value={draft.name}
        w={{ base: "100%", sm: 240 }}
      />
      <CategoricalFilters
        disabled={areCategoricalFiltersDisabled}
        draft={draft}
        onChange={(key, value) => {
          commitDraft({ ...draft, [key]: value });
        }}
        options={options}
      />
      <RangeFilter
        clearLabel={t`Clear range`}
        disabled={isLoading}
        label={t`CM score`}
        max={scoreMax}
        maximumLabel={t`Maximum CM score`}
        min={scoreMin}
        minimumLabel={t`Minimum CM score`}
        onChange={(cmScore) => {
          setDraft((currentDraft) => ({ ...currentDraft, cmScore }));
        }}
        onChangeEnd={(cmScore) => {
          commitDraft({ ...draft, cmScore });
        }}
        step={0.1}
        value={draft.cmScore}
      />
    </FilterBar>
  );
};
