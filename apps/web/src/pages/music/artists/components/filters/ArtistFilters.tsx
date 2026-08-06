import { useLingui } from "@lingui/react/macro";
import { Button, Drawer, TextInput } from "@mantine/core";
import { useDebouncedCallback, useDisclosure } from "@mantine/hooks";
import { FilterBar } from "@repo/ui/filter-bar";
import {
  MultiSelectFilter,
  type MultiSelectFilterOption,
  type MultiSelectFilterValue,
} from "@repo/ui/multi-select-filter";
import { RangeFilter } from "@repo/ui/range-filter";
import { type FC, useMemo, useState } from "react";

import type {
  ArtistFilterOptionsReply,
  ArtistFilters as ArtistFilterQuery,
} from "../../types";

import { useAbbreviatedNumber } from "../../../../../hooks/use-abbreviated-number";
import { useCountryName } from "../../../../../lib/country-names";
import {
  type ArtistFilterDraft,
  createFilterDraft,
  toFilterQuery,
} from "../../utils/artist-filter-draft";
import { ArtistFiltersDrawerContent } from "./ArtistFiltersDrawer";

interface ArtistFiltersProps {
  isLoading: boolean;
  onChange: (filters: ArtistFilterQuery) => void;
  options: ArtistFilterOptionsReply | undefined;
}

interface FilterOptionLists {
  countries: MultiSelectFilterOption[];
  genres: MultiSelectFilterOption[];
}

const useFilterOptionLists = (
  options: ArtistFilterOptionsReply | undefined,
): FilterOptionLists => {
  const formatCount = useAbbreviatedNumber();
  const formatCountry = useCountryName();

  return useMemo(
    () => ({
      countries: (options?.countries ?? []).map(({ count, value }) => ({
        description: formatCount(count),
        label: formatCountry(value),
        value,
      })),
      genres: (options?.genres ?? []).map(({ count, value }) => ({
        description: formatCount(count),
        label: value,
        value,
      })),
    }),
    [formatCount, formatCountry, options],
  );
};

interface CategoricalFiltersProps {
  disabled: boolean;
  draft: ArtistFilterDraft;
  onChange: (
    key: "countries" | "genres",
    value: MultiSelectFilterValue,
  ) => void;
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
          ["genres", t`Genre`, t`Search genres…`],
          ["countries", t`Country`, t`Search countries…`],
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

const toBoundProps = (
  max: number | null | undefined,
): { max?: number; min?: number } => ({
  ...(typeof max === "number" && { max, min: 0 }),
});

interface ArtistSearchInputProps {
  onChange: (name: string) => void;
  value: string;
}

const ArtistSearchInput: FC<ArtistSearchInputProps> = ({ onChange, value }) => {
  const { t } = useLingui();
  const [text, setText] = useState(value);
  const emit = useDebouncedCallback(onChange, 350);

  return (
    <TextInput
      aria-label={t`Search by name`}
      autoComplete="off"
      maxLength={100}
      name="artist-search"
      onChange={(event) => {
        const name = event.currentTarget.value;

        setText(name);
        emit(name);
      }}
      placeholder={t`Search artists…`}
      value={text}
      w={{ base: "100%", sm: 240 }}
    />
  );
};

interface FollowerRangeFiltersProps {
  disabled: boolean;
  draft: ArtistFilterDraft;
  formatFollowers: (value: number) => string;
  onDraftChange: (draft: ArtistFilterDraft) => void;
  onDraftPreview: (draft: ArtistFilterDraft) => void;
  options: ArtistFilterOptionsReply | undefined;
}

const FollowerRangeFilters: FC<FollowerRangeFiltersProps> = ({
  disabled,
  draft,
  formatFollowers,
  onDraftChange,
  onDraftPreview,
  options,
}) => {
  const { t } = useLingui();

  return (
    <>
      <RangeFilter
        {...toBoundProps(options?.instagramFollowers.max)}
        clearLabel={t`Clear range`}
        disabled={disabled}
        formatValue={formatFollowers}
        label={t`Instagram followers`}
        maximumLabel={t`Maximum Instagram followers`}
        minimumLabel={t`Minimum Instagram followers`}
        onChange={(instagramFollowers) => {
          onDraftPreview({ ...draft, instagramFollowers });
        }}
        onChangeEnd={(instagramFollowers) => {
          onDraftChange({ ...draft, instagramFollowers });
        }}
        value={draft.instagramFollowers}
      />
      <RangeFilter
        {...toBoundProps(options?.tiktokFollowers.max)}
        clearLabel={t`Clear range`}
        disabled={disabled}
        formatValue={formatFollowers}
        label={t`TikTok followers`}
        maximumLabel={t`Maximum TikTok followers`}
        minimumLabel={t`Minimum TikTok followers`}
        onChange={(tiktokFollowers) => {
          onDraftPreview({ ...draft, tiktokFollowers });
        }}
        onChangeEnd={(tiktokFollowers) => {
          onDraftChange({ ...draft, tiktokFollowers });
        }}
        value={draft.tiktokFollowers}
      />
    </>
  );
};

export const ArtistFilters: FC<ArtistFiltersProps> = ({
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
  const formatFollowers = useAbbreviatedNumber();

  // The draft updates immediately so controls stay responsive; the query
  // commit is debounced so bursts of clicks or keystrokes fetch once.
  const applyDraft = useDebouncedCallback((nextDraft: ArtistFilterDraft) => {
    onChange(toFilterQuery(nextDraft));
  }, 350);

  const commitDraft = (nextDraft: ArtistFilterDraft): void => {
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
        <ArtistSearchInput
          key={clearCount}
          onChange={(name) => {
            commitDraft({ ...draft, name });
          }}
          value={draft.name}
        />
        <CategoricalFilters
          disabled={areOptionsDisabled}
          draft={draft}
          onChange={(key, value) => {
            commitDraft({ ...draft, [key]: value });
          }}
          optionLists={optionLists}
        />
        <FollowerRangeFilters
          disabled={isLoading}
          draft={draft}
          formatFollowers={formatFollowers}
          onDraftChange={commitDraft}
          onDraftPreview={setDraft}
          options={options}
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
        <ArtistFiltersDrawerContent
          countryOptions={optionLists.countries}
          disabled={areOptionsDisabled}
          draft={draft}
          formatFollowers={formatFollowers}
          genreOptions={optionLists.genres}
          instagramFollowersMax={options?.instagramFollowers.max ?? undefined}
          onDraftChange={commitDraft}
          onDraftPreview={setDraft}
          tiktokFollowersMax={options?.tiktokFollowers.max ?? undefined}
        />
      </Drawer>
    </>
  );
};
