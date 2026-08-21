import { useState } from "react";

import type { LeagueFilters } from "../api/types";
import type { LeagueFilterValues } from "./types";

export const createEmptyFilterValues = (): LeagueFilterValues => ({
  isMegaOnly: false,
  minAggregatedIgFollowers: null,
  minTrackedAthletes: null,
  name: "",
  sport: null,
});

export const toFilterQuery = (values: LeagueFilterValues): LeagueFilters => {
  const filters: LeagueFilters = {};
  const name = values.name.trim();

  if (name !== "") filters.name = name;
  if (values.sport !== null) filters.sports = [values.sport];
  if (values.minTrackedAthletes !== null) {
    filters.minTrackedAthletes = values.minTrackedAthletes;
  }
  if (values.minAggregatedIgFollowers !== null) {
    filters.minAggregatedIgFollowers = values.minAggregatedIgFollowers;
  }
  if (values.isMegaOnly) filters.megaOnly = true;

  return filters;
};

export const useLeagueFilterValues = (
  onChange: (filters: LeagueFilters) => void,
): {
  filterValues: LeagueFilterValues;
  updateFilters: (next: LeagueFilterValues) => void;
} => {
  const [filterValues, setFilterValues] = useState(createEmptyFilterValues);
  const updateFilters = (next: LeagueFilterValues): void => {
    setFilterValues(next);
    onChange(toFilterQuery(next));
  };

  return { filterValues, updateFilters };
};
