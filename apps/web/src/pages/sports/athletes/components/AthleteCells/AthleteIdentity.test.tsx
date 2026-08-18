import { i18n } from "@lingui/core";
import { I18nProvider } from "@lingui/react";
import { MantineProvider } from "@mantine/core";
import { render, screen } from "@testing-library/react";
import { beforeAll, describe, expect, it } from "vitest";

import type { Athlete } from "../../api/types";

import { messages as enSports } from "../../../../../locales/sports/en/messages.po";
import { buildAthlete } from "../athlete.test.helpers";
import { AthleteIdentity } from "./AthleteIdentity";

beforeAll(() => {
  i18n.load("en", enSports);
  i18n.activate("en");
});

const renderComponent = (
  athlete: Athlete = buildAthlete(),
): ReturnType<typeof render> =>
  render(
    <I18nProvider i18n={i18n}>
      <MantineProvider>
        <AthleteIdentity athlete={athlete} />
      </MantineProvider>
    </I18nProvider>,
  );

describe("AthleteIdentity", () => {
  it("renders sport on the second line as colored text, not a badge", () => {
    renderComponent();

    const sportElement = screen.getByText("Football");

    expect(sportElement.tagName.toLowerCase()).toBe("p");
    expect(sportElement.closest("[data-variant]")).toBeNull();
  });

  it("renders the athlete name", () => {
    renderComponent();

    expect(screen.getByText("Alex Morgan")).toBeDefined();
  });

  it("renders nothing for sport when sport is null", () => {
    renderComponent(buildAthlete({ sport: null }));

    expect(screen.queryByRole("listitem")).toBeNull();
  });
});
