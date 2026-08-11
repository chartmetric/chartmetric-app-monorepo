/* eslint-disable lingui/no-unlocalized-strings --
 * Fixture data and DOM query names, not user-facing copy. The rule's test
 * exemption only matches *.test.tsx, and this module is imported by tests. */
import { i18n } from "@lingui/core";
import { I18nProvider } from "@lingui/react";
import { MantineProvider } from "@mantine/core";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { expect, type Mock } from "vitest";

import type { Actor, ActorListReply, KnownForCredit } from "./api/types";

import { ActorsPage } from "./ActorsPage";

type ActorListMeta = ActorListReply["meta"];

export const MOANA_CREDIT: KnownForCredit = {
  character: "Maui",
  id: 1_108_427,
  kind: "movie",
  name: "Moana",
  network: null,
  popularity: 55.1,
};

export const BALLERS_CREDIT: KnownForCredit = {
  character: "Spencer Strasmore",
  id: 62_704,
  kind: "tv",
  name: "Ballers",
  network: "HBO",
  popularity: 21.4,
};

export const THE_ROCK: Actor = {
  id: 18_918,
  imageUrl: "https://image.tmdb.org/t/p/w185/the-rock.jpg",
  instagramFollowers: 382_300_000,
  instagramHandle: "therock",
  instagramUrl: "https://instagram.com/therock",
  knownFor: [MOANA_CREDIT, BALLERS_CREDIT],
  name: "Dwayne Johnson",
  popularity: 7.2,
  roleCount: 2,
};

export const buildActor = (overrides: Partial<Actor> = {}): Actor => ({
  ...THE_ROCK,
  ...overrides,
});

export const buildActorPage = (count: number, offset: number): Actor[] =>
  Array.from({ length: count }, (_, index) => {
    const position = offset + index + 1;

    return buildActor({ id: position, name: `Actor ${String(position)}` });
  });

export const actorsReply = (
  actors: Actor[],
  meta: ActorListMeta,
): { data: ActorListReply } => ({ data: { data: actors, meta } });

export const DEFAULT_ACTORS_QUERY = {
  limit: 25,
  offset: 0,
  sortBy: "instagramFollowers",
  sortDirection: "desc",
} as const;

export const ACTORS_PATH = "/app/actors";

export const expectActorsQuery = async (
  apiGet: Mock,
  query: Record<string, unknown>,
): Promise<void> => {
  await waitFor(() => {
    expect(apiGet).toHaveBeenLastCalledWith(ACTORS_PATH, { params: { query } });
  });
};

export const busyStateOf = (element: HTMLElement): null | string =>
  element.closest("[aria-busy]")?.getAttribute("aria-busy") ?? null;

export const clickEnabledButton = async (name: string): Promise<void> => {
  const button = await screen.findByRole<HTMLButtonElement>("button", { name });

  await waitFor(() => {
    expect(button.disabled).toBe(false);
  });

  fireEvent.click(button);
};

export const actorsTable = (): HTMLElement =>
  screen.getByRole("table", { name: "Actors" });

export const findActorsTable = async (): Promise<HTMLElement> =>
  await screen.findByRole("table", { name: "Actors" });

export const columnHeaderTexts = (): (null | string)[] =>
  within(actorsTable())
    .getAllByRole("columnheader")
    .map((header) => header.textContent);

export const bodyRowCells = (rowIndex: number): HTMLElement[] => {
  const rows = within(actorsTable()).getAllByRole("row").slice(1);
  const row = rows[rowIndex];
  if (row === undefined) {
    throw new Error(`No body row at index ${String(rowIndex)}`);
  }

  return within(row).getAllByRole("cell");
};

export const bodyRowCell = (
  rowIndex: number,
  cellIndex: number,
): HTMLElement => {
  const cell = bodyRowCells(rowIndex)[cellIndex];
  if (cell === undefined) {
    throw new Error(`No cell at index ${String(cellIndex)}`);
  }

  return cell;
};

export const renderActorsPage = (): void => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  render(
    <I18nProvider i18n={i18n}>
      <QueryClientProvider client={queryClient}>
        <MantineProvider>
          <MemoryRouter>
            <ActorsPage />
          </MemoryRouter>
        </MantineProvider>
      </QueryClientProvider>
    </I18nProvider>,
  );
};
