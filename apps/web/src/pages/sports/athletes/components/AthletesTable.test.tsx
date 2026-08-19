import { i18n } from "@lingui/core";
import { I18nProvider } from "@lingui/react";
import { MantineProvider } from "@mantine/core";
import { render, screen } from "@testing-library/react";
import { beforeAll, describe, expect, it, vi } from "vitest";

import type {
  Athlete,
  AthleteSortBy,
  AthleteSortDirection,
} from "../api/types";
import type { AthleteColumnKey } from "../columns/types";

import { messages as enSports } from "../../../../locales/sports/en/messages.po";
import { buildAthlete } from "../AthletesPage.test.helpers";
import { AthletesTable } from "./AthletesTable";

beforeAll(() => {
  i18n.load("en", enSports);
  i18n.activate("en");
});

const DEFAULT_PROPS = {
  athletes: [] as Athlete[],
  isFetching: false,
  offset: 0,
  onPageChange: vi.fn(),
  onSort: vi.fn(),
  sortBy: "rank" as AthleteSortBy,
  sortDirection: "asc" as AthleteSortDirection,
  total: 0,
  visibleColumns: [] as AthleteColumnKey[],
};

const renderTable = (
  overrides: Partial<typeof DEFAULT_PROPS> = {},
): ReturnType<typeof render> => {
  const props = { ...DEFAULT_PROPS, ...overrides };

  return render(
    <I18nProvider i18n={i18n}>
      <MantineProvider>
        <AthletesTable {...props} />
      </MantineProvider>
    </I18nProvider>,
  );
};

describe("AthletesTable", () => {
  it("renders Paper with shadow and no withBorder", () => {
    const { container } = renderTable();
    const paper = container.querySelector(".mantine-Paper-root");

    expect(paper).not.toBeNull();
    expect(paper?.hasAttribute("data-with-border")).toBe(false);
  });

  it("replaces body rows with skeleton rows while isFetching is true", () => {
    const { container } = renderTable({
      athletes: [buildAthlete()],
      isFetching: true,
    });

    expect(
      container.querySelector("[class*='LoadingOverlay-root']"),
    ).toBeNull();
    expect(
      container.querySelectorAll(":scope tbody .mantine-Skeleton-root").length,
    ).toBeGreaterThan(0);
    expect(screen.queryByText("Alex Morgan")).toBeNull();
    expect(container.querySelector("thead")).not.toBeNull();
  });

  it("shows the row-count text alongside the pagination controls", () => {
    renderTable({ total: 0 });

    expect(screen.getByText(/Showing/u)).toBeDefined();
  });
});
