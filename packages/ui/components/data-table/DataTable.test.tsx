import { MantineProvider } from "@mantine/core";
import { fireEvent, render, screen } from "@testing-library/react";
import { act } from "react";
import { describe, expect, it, vi } from "vitest";

import { DataTable, type DataTableColumn } from "./DataTable";
import { TablePagination } from "./TablePagination";

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

  it("adds scrolled class to the scroll container when scrollLeft > 0", () => {
    renderSticky();
    const scrollDiv = screen.getByRole("table", {
      name: "People",
    }).parentElement;
    if (scrollDiv === null) throw new Error("Table has no parent element");

    scrollDiv.scrollLeft = 50;
    act(() => {
      scrollDiv.dispatchEvent(new Event("scroll"));
    });

    expect(scrollDiv.className).toContain("scrolled");
  });

  it("removes scrolled class when scroll returns to origin", () => {
    renderSticky();
    const scrollDiv = screen.getByRole("table", {
      name: "People",
    }).parentElement;
    if (scrollDiv === null) throw new Error("Table has no parent element");

    scrollDiv.scrollLeft = 50;
    act(() => {
      scrollDiv.dispatchEvent(new Event("scroll"));
    });

    scrollDiv.scrollLeft = 0;
    act(() => {
      scrollDiv.dispatchEvent(new Event("scroll"));
    });

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

describe("TablePagination", () => {
  it("emits previous and next offsets", () => {
    const onPageChange = vi.fn();
    render(
      <MantineProvider>
        <TablePagination
          hasNextPage
          isLoading={false}
          loadingLabel="Updating"
          nextLabel="Next"
          offset={25}
          onPageChange={onPageChange}
          pageLabel={(page) => `Page ${String(page)}`}
          pageSize={25}
          previousLabel="Previous"
        />
      </MantineProvider>,
    );

    expect(screen.getByText("Page 2")).toBeDefined();

    fireEvent.click(screen.getByRole("button", { name: "Previous" }));
    fireEvent.click(screen.getByRole("button", { name: "Next" }));

    expect(onPageChange).toHaveBeenNthCalledWith(1, 0);
    expect(onPageChange).toHaveBeenNthCalledWith(2, 50);
  });
});
