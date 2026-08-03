import { MantineProvider } from "@mantine/core";
import { fireEvent, render, screen } from "@testing-library/react";
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
});

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
