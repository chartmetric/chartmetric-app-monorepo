import { useMemo, useState } from "react";

import type { AthleteFilters } from "./athlete-list-query";

import {
  type AthleteFilterDraft,
  countActiveFilters,
  createFilterDraft,
  toFilterQuery,
} from "./athlete-filter-draft";

export interface AthleteFilterDraftState {
  activeFilterCount: number;
  commit: (next: AthleteFilterDraft) => void;
  draft: AthleteFilterDraft;
  /** Updates the draft without querying, for controls that stream while dragging. */
  preview: (next: Partial<AthleteFilterDraft>) => void;
  reset: () => void;
}

export const useAthleteFilterDraft = (
  onChange: (filters: AthleteFilters) => void,
): AthleteFilterDraftState => {
  const [draft, setDraft] = useState(createFilterDraft);

  return useMemo(
    () => ({
      activeFilterCount: countActiveFilters(draft),
      commit: (next) => {
        setDraft(next);
        onChange(toFilterQuery(next));
      },
      draft,
      preview: (next) => {
        setDraft((current) => ({ ...current, ...next }));
      },
      reset: () => {
        const empty = createFilterDraft();

        setDraft(empty);
        onChange(toFilterQuery(empty));
      },
    }),
    [draft, onChange],
  );
};
