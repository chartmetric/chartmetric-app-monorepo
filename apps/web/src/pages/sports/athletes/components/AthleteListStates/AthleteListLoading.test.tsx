import { i18n } from "@lingui/core";
import { I18nProvider } from "@lingui/react";
import { MantineProvider } from "@mantine/core";
import { render, screen } from "@testing-library/react";
import { beforeAll, describe, expect, it } from "vitest";

import { messages as enSports } from "../../../../../locales/sports/en/messages.po";
import { AthleteListLoading } from "./AthleteListLoading";

beforeAll(() => {
  i18n.load("en", enSports);
  i18n.activate("en");
});

const renderComponent = (): ReturnType<typeof render> =>
  render(
    <I18nProvider i18n={i18n}>
      <MantineProvider>
        <AthleteListLoading />
      </MantineProvider>
    </I18nProvider>,
  );

describe("AthleteListLoading", () => {
  it("renders five Skeleton rows instead of a centered Loader", () => {
    const { container } = renderComponent();

    expect(container.querySelectorAll("[class*='Skeleton-root']")).toHaveLength(
      5,
    );
    expect(screen.queryByRole("progressbar")).toBeNull();
  });

  it("exposes a status role for screen readers", () => {
    renderComponent();

    expect(screen.getByRole("status")).toBeDefined();
  });
});
