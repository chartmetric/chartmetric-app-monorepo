import type { DataTableColumn } from "@repo/ui/data-table";

import { useLingui } from "@lingui/react/macro";
import { createElement, useMemo } from "react";

import type { Actor, ActorSortBy } from "./api/types";

import {
  type NumberFormatter,
  useAbbreviatedNumber,
} from "../../../hooks/use-abbreviated-number";
import { EMPTY_CELL, useListFormatters } from "../../../lib/formatting";
import { ActorIdentity } from "./components/ActorCells/ActorIdentity";
import { InstagramCell } from "./components/ActorCells/InstagramCell";
import { KnownForCell } from "./components/ActorCells/KnownForCell";

export type ActorTableColumn = DataTableColumn<Actor, ActorSortBy>;

type ActorColumnKey =
  | "actor"
  | "index"
  | "instagram"
  | "instagramFollowers"
  | "knownFor"
  | "popularity"
  | "roleCount";

type ActorColumnLabels = Record<ActorColumnKey, string>;

export const INDEX_COLUMN_WIDTH = 64;
export const ACTOR_COLUMN_WIDTH = 240;
export const SCROLLING_COLUMNS_MIN_WIDTH = 720;

const KNOWN_FOR_MIN_WIDTH = 260;
const INSTAGRAM_MIN_WIDTH = 140;
const FOLLOWERS_MIN_WIDTH = 120;
const ROLES_MIN_WIDTH = 90;
const POPULARITY_MIN_WIDTH = 110;

const useActorColumnLabels = (): ActorColumnLabels => {
  const { t } = useLingui();

  return useMemo(
    () => ({
      actor: t`Actor name`,
      index: t`Index`,
      instagram: t`Instagram`,
      instagramFollowers: t`IG Followers`,
      knownFor: t`Known for`,
      popularity: t`Popularity`,
      roleCount: t`Roles`,
    }),
    [t],
  );
};

const profileColumns = (
  labels: ActorColumnLabels,
  formatPosition: (actor: Actor) => string,
): ActorTableColumn[] => [
  {
    align: "left",
    key: "index",
    label: labels.index,
    renderCell: formatPosition,
    sticky: true,
    width: INDEX_COLUMN_WIDTH,
  },
  {
    align: "left",
    key: "actor",
    label: labels.actor,
    renderCell: (actor) => createElement(ActorIdentity, { actor }),
    sortKey: "name",
    sticky: true,
    width: ACTOR_COLUMN_WIDTH,
  },
  {
    align: "left",
    key: "knownFor",
    label: labels.knownFor,
    minWidth: KNOWN_FOR_MIN_WIDTH,
    renderCell: (actor) => createElement(KnownForCell, { actor }),
  },
  {
    align: "left",
    key: "instagram",
    label: labels.instagram,
    minWidth: INSTAGRAM_MIN_WIDTH,
    renderCell: (actor) => createElement(InstagramCell, { actor }),
  },
];

const metricColumns = (
  labels: ActorColumnLabels,
  formatFollowers: NumberFormatter,
  plain: Intl.NumberFormat,
  popularity: Intl.NumberFormat,
): ActorTableColumn[] => [
  {
    align: "right",
    key: "instagramFollowers",
    label: labels.instagramFollowers,
    minWidth: FOLLOWERS_MIN_WIDTH,
    renderCell: (actor) =>
      actor.instagramFollowers === null
        ? EMPTY_CELL
        : formatFollowers(actor.instagramFollowers),
    sortKey: "instagramFollowers",
  },
  {
    align: "right",
    key: "roleCount",
    label: labels.roleCount,
    minWidth: ROLES_MIN_WIDTH,
    renderCell: (actor) => plain.format(actor.roleCount),
    sortKey: "roleCount",
  },
  {
    align: "right",
    key: "popularity",
    label: labels.popularity,
    minWidth: POPULARITY_MIN_WIDTH,
    renderCell: (actor) => popularity.format(actor.popularity),
    sortKey: "popularity",
  },
];

export const useActorTableColumns = (
  actors: readonly Actor[],
  offset: number,
): ActorTableColumn[] => {
  const { i18n } = useLingui();
  const labels = useActorColumnLabels();
  const formatters = useListFormatters();
  const formatFollowers = useAbbreviatedNumber();
  const popularityFormat = useMemo(
    () =>
      new Intl.NumberFormat(i18n.locale, {
        maximumFractionDigits: 1,
        minimumFractionDigits: 1,
      }),
    [i18n.locale],
  );

  return useMemo(() => {
    const positions = new Map(
      actors.map((actor, index) => [actor.id, offset + index + 1]),
    );
    const formatPosition = (actor: Actor): string => {
      const position = positions.get(actor.id);

      return position === undefined
        ? EMPTY_CELL
        : formatters.plain.format(position);
    };

    return [
      ...profileColumns(labels, formatPosition),
      ...metricColumns(
        labels,
        formatFollowers,
        formatters.plain,
        popularityFormat,
      ),
    ];
  }, [actors, formatFollowers, formatters, labels, offset, popularityFormat]);
};
