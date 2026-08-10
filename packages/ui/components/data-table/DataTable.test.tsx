import { MantineProvider } from "@mantine/core";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { DataTable, type DataTableColumn } from "./DataTable";

interface Person {
  id: number;
  name: string;
  score: number;
}

const columns: DataTableColumn<Person, "name" | "score">[] = [
  {
    key: "name",
    label: "Name",
    renderCell: ({ name }) => name,
    sortKey: "name",
  },
  {
    align: "right",
    key: "score",
    label: "Score",
    renderCell: ({ score }) => score,
    sortKey: "score",
  },
];

describe("DataTable", () => {
  it("renders configured cells and emits sortable column keys", () => {
    const onSort = vi.fn();
    render(
      <MantineProvider>
        <DataTable
          ariaLabel="People"
          columns={columns}
          getRowKey={({ id }) => id}
          onSort={onSort}
          rows={[{ id: 1, name: "Alex", score: 87.4 }]}
          sortBy="score"
          sortDirection="desc"
          sortLabel={(label) => `Sort by ${label}`}
        />
      </MantineProvider>,
    );

    expect(screen.getByRole("table", { name: "People" })).toBeDefined();
    expect(screen.getByText("Alex")).toBeDefined();
    expect(
      screen
        .getByRole("columnheader", { name: /Score/ })
        .getAttribute("aria-sort"),
    ).toBe("descending");

    fireEvent.click(screen.getByRole("button", { name: "Sort by Name" }));

    expect(onSort).toHaveBeenCalledWith("name");
  });

  it("keeps a column definition available on hover and to assistive tech", () => {
    const definition = "Sum of tracked athletes' followers.";
    render(
      <MantineProvider>
        <DataTable
          ariaLabel="People"
          columns={[
            {
              align: "right",
              key: "score",
              label: "Score",
              renderCell: ({ score }) => score,
              sortKey: "score",
              tooltip: definition,
            },
          ]}
          getRowKey={({ id }) => id}
          onSort={vi.fn()}
          rows={[{ id: 1, name: "Alex", score: 87.4 }]}
          sortBy="score"
          sortDirection="desc"
          sortLabel={(label) => `Sort by ${label}`}
        />
      </MantineProvider>,
    );

    expect(
      screen.getByRole("columnheader", { name: new RegExp(definition, "u") }),
    ).toBeDefined();
    expect(screen.getByRole("button", { name: "Sort by Score" })).toBeDefined();
  });

  it("opens the column definition on keyboard focus", async () => {
    const definition = "Sum of tracked athletes' followers.";
    render(
      <MantineProvider>
        <DataTable
          ariaLabel="People"
          columns={[
            {
              align: "right",
              key: "score",
              label: "Score",
              renderCell: ({ score }) => score,
              sortKey: "score",
              tooltip: definition,
            },
          ]}
          getRowKey={({ id }) => id}
          onSort={vi.fn()}
          rows={[{ id: 1, name: "Alex", score: 87.4 }]}
          sortBy="score"
          sortDirection="desc"
          sortLabel={(label) => `Sort by ${label}`}
        />
      </MantineProvider>,
    );

    fireEvent.focus(screen.getByRole("button", { name: "Sort by Score" }));

    expect(await screen.findByRole("tooltip")).toBeDefined();
  });

  it("offsets each pinned column by the widths before it", () => {
    renderSticky();

    const cells = screen.getAllByRole("cell");

    expect(cells[0]?.style.left).toBe("0px");
    expect(cells[1]?.style.left).toBe("64px");
  });

  it("pins the header to the same offsets as the body", () => {
    renderSticky();

    const headers = screen.getAllByRole("columnheader");

    expect(headers[0]?.style.left).toBe("0px");
    expect(headers[1]?.style.left).toBe("64px");
  });

  it("leaves columns after the first non-sticky one unpinned", () => {
    renderSticky();

    const cells = screen.getAllByRole("cell");

    expect(cells[2]?.style.left).toBe("");
    expect(cells[2]?.className).not.toContain("stickyCell");
  });

  it("paints pinned cells from a class rather than an inline background", () => {
    renderSticky();

    const [first] = screen.getAllByRole("cell");

    expect(first?.style.backgroundColor).toBe("");
    expect(first?.className).toContain("stickyCell");
  });

  it("marks only the last pinned cell with the shadow carrier class", () => {
    renderSticky();

    const cells = screen.getAllByRole("cell");

    expect(cells[0]?.className).not.toContain("lastStickyCell");
    expect(cells[1]?.className).toContain("lastStickyCell");
    expect(cells[2]?.className).not.toContain("lastStickyCell");
  });

  // The scrolled-state shadow was silently lost once before: a static
  // reference screenshot shows only the rest state, and the vestigial tests
  // were deleted with the old implementation. These two guard the behavior.
  it("marks the scroll container scrolled while horizontally scrolled", () => {
    renderSticky();
    const scrollDiv = screen.getByRole("table", {
      name: "People",
    }).parentElement;
    if (scrollDiv === null) throw new Error("Table has no parent element");

    scrollDiv.scrollLeft = 50;
    fireEvent.scroll(scrollDiv);

    expect(scrollDiv.className).toContain("scrolled");
  });

  it("clears the scrolled mark when scroll returns to origin", () => {
    renderSticky();
    const scrollDiv = screen.getByRole("table", {
      name: "People",
    }).parentElement;
    if (scrollDiv === null) throw new Error("Table has no parent element");

    scrollDiv.scrollLeft = 50;
    fireEvent.scroll(scrollDiv);
    scrollDiv.scrollLeft = 0;
    fireEvent.scroll(scrollDiv);

    expect(scrollDiv.className).not.toContain("scrolled");
  });
});

const stickyColumns: DataTableColumn<Person, "name" | "score">[] = [
  { key: "rank", label: "Rank", renderCell: () => 1, sticky: true, width: 64 },
  {
    key: "name",
    label: "Name",
    renderCell: ({ name }) => name,
    sticky: true,
    width: 240,
  },
  { key: "score", label: "Score", renderCell: ({ score }) => score },
];

const renderSticky = (): ReturnType<typeof render> =>
  render(
    <MantineProvider>
      <DataTable
        ariaLabel="People"
        columns={stickyColumns}
        getRowKey={({ id }) => id}
        onSort={vi.fn()}
        rows={[{ id: 1, name: "Alex", score: 87.4 }]}
        sortBy="score"
        sortDirection="desc"
        sortLabel={(label) => `Sort by ${label}`}
      />
    </MantineProvider>,
  );
