import { MantineProvider } from "@mantine/core";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { TablePagination } from "./TablePagination";

const pageLabel = (page: number, pageCount?: number): string =>
  pageCount === undefined
    ? `Page ${String(page)}`
    : `Page ${String(page)} of ${String(pageCount)}`;

describe("TablePagination without a total", () => {
  it("emits previous and next offsets and labels the page from hasNextPage", () => {
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
          pageLabel={pageLabel}
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

  it("disables next when hasNextPage is false", () => {
    render(
      <MantineProvider>
        <TablePagination
          hasNextPage={false}
          isLoading={false}
          loadingLabel="Updating"
          nextLabel="Next"
          offset={0}
          onPageChange={vi.fn()}
          pageLabel={pageLabel}
          pageSize={25}
          previousLabel="Previous"
        />
      </MantineProvider>,
    );

    expect(
      screen.getByRole("button", { name: "Next" }).hasAttribute("disabled"),
    ).toBe(true);
  });
});

describe("TablePagination with a total", () => {
  it("renders a total-aware page-of-N label", () => {
    render(
      <MantineProvider>
        <TablePagination
          hasNextPage
          isLoading={false}
          loadingLabel="Updating"
          nextLabel="Next"
          offset={25}
          onPageChange={vi.fn()}
          pageLabel={pageLabel}
          pageSize={25}
          previousLabel="Previous"
          total={60}
        />
      </MantineProvider>,
    );

    expect(screen.getByText("Page 2 of 3")).toBeDefined();
    expect(
      screen.getByRole("button", { name: "Next" }).hasAttribute("disabled"),
    ).toBe(false);
  });

  it("disables next on the final page even when hasNextPage stays true", () => {
    render(
      <MantineProvider>
        <TablePagination
          hasNextPage
          isLoading={false}
          loadingLabel="Updating"
          nextLabel="Next"
          offset={50}
          onPageChange={vi.fn()}
          pageLabel={pageLabel}
          pageSize={25}
          previousLabel="Previous"
          total={60}
        />
      </MantineProvider>,
    );

    expect(screen.getByText("Page 3 of 3")).toBeDefined();
    expect(
      screen.getByRole("button", { name: "Next" }).hasAttribute("disabled"),
    ).toBe(true);
  });

  // An exact multiple is where `offset + pageSize >= total` and
  // `offset + pageSize > total` disagree, so this case is what pins the
  // comparison rather than merely exercising it.
  it("disables next on the last page when total is an exact multiple of pageSize", () => {
    render(
      <MantineProvider>
        <TablePagination
          hasNextPage
          isLoading={false}
          loadingLabel="Updating"
          nextLabel="Next"
          offset={25}
          onPageChange={vi.fn()}
          pageLabel={pageLabel}
          pageSize={25}
          previousLabel="Previous"
          total={50}
        />
      </MantineProvider>,
    );

    expect(screen.getByText("Page 2 of 2")).toBeDefined();
    expect(
      screen.getByRole("button", { name: "Next" }).hasAttribute("disabled"),
    ).toBe(true);
  });

  it("reports a single page when the total is zero", () => {
    render(
      <MantineProvider>
        <TablePagination
          hasNextPage
          isLoading={false}
          loadingLabel="Updating"
          nextLabel="Next"
          offset={0}
          onPageChange={vi.fn()}
          pageLabel={pageLabel}
          pageSize={25}
          previousLabel="Previous"
          total={0}
        />
      </MantineProvider>,
    );

    expect(screen.getByText("Page 1 of 1")).toBeDefined();
    expect(
      screen.getByRole("button", { name: "Next" }).hasAttribute("disabled"),
    ).toBe(true);
  });
});
