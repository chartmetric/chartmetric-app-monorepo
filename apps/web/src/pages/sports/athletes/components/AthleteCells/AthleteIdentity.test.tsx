import { i18n } from "@lingui/core";
import { I18nProvider } from "@lingui/react";
import { MantineProvider } from "@mantine/core";
import { render, screen } from "@testing-library/react";
import { beforeAll, describe, expect, it } from "vitest";

import type { Athlete } from "../../api/types";

import { messages as enSports } from "../../../../../locales/sports/en/messages.po";
import { AthleteIdentity } from "./AthleteIdentity";

beforeAll(() => {
  i18n.load("en", enSports);
  i18n.activate("en");
});

const buildAthlete = (overrides: Partial<Athlete> = {}): Athlete => ({
  age: 26,
  club: "Orlando Pride",
  cmScore: 87.4,
  gpsAtk: null,
  gpsDef: null,
  gpsScore: null,
  id: 1,
  igEngagementRate: null,
  igFollowers: 1_000_000,
  igPosts: 300,
  igVerified: false,
  imageUrl: null,
  lastMatchDate: null,
  leagues: [],
  level: "professional",
  momentumLabel: null,
  momentumScore: null,
  name: "Alex Morgan",
  nationality: "United States",
  nationalTeam: null,
  position: null,
  rank: 1,
  socialLinks: [],
  sport: "Football",
  teamLogoUrl: null,
  tiktokFollowers: null,
  tiktokHearts: null,
  tiktokLikes: null,
  tiktokPosts: null,
  tiktokVideos: null,
  turnedPro: null,
  ...overrides,
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
  it("renders sport on the second line as dimmed text", () => {
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
