import { screen, waitFor, within } from "@testing-library/react";
import { expect } from "vitest";

import type { Athlete } from "./api/types";

export const buildAthlete = (overrides: Partial<Athlete> = {}): Athlete => ({
  age: 36,
  club: "Orlando Pride",
  cmScore: 87.4,
  gpsAtk: null,
  gpsDef: null,
  gpsScore: null,
  id: 42,
  igEngagementRate: null,
  igFollowers: 10_000_000,
  igPosts: 1200,
  igVerified: true,
  imageUrl: "https://img/athlete-42.jpg",
  lastMatchDate: "2026-07-06",
  leagues: ["Major League Soccer"],
  level: "professional",
  momentumLabel: null,
  momentumScore: null,
  name: "Alex Morgan",
  nationality: "United States",
  nationalTeam: "United States",
  position: "FW",
  rank: 1,
  socialLinks: [
    {
      handle: "alexmorgan13",
      platform: "instagram",
      url: "https://www.instagram.com/alexmorgan13",
    },
  ],
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

export const findEnabledControl = async (
  role: "button" | "combobox",
  name: string,
): Promise<HTMLButtonElement> => {
  const control = await screen.findByRole<HTMLButtonElement>(role, { name });

  await waitFor(() => {
    expect(control.disabled).toBe(false);
  });

  return control;
};

const getControlledListbox = (control: HTMLButtonElement): HTMLElement => {
  const listboxId = control.getAttribute("aria-controls");
  if (listboxId === null) throw new Error("Combobox has no controlled listbox");

  const listbox = document.querySelector<HTMLElement>(`#${listboxId}`);
  if (listbox === null) throw new Error("Controlled listbox was not rendered");

  return listbox;
};

export const getControlledOption = (
  control: HTMLButtonElement,
  name: RegExp,
): HTMLElement =>
  within(getControlledListbox(control)).getByRole("option", {
    hidden: true,
    name,
  });

export const getControlledRadio = (
  control: HTMLButtonElement,
  name: string,
): HTMLElement => {
  const dropdown = getControlledListbox(control).closest<HTMLElement>(
    '[role="presentation"]',
  );
  if (dropdown === null)
    throw new Error("Controlled dropdown was not rendered");

  return within(dropdown).getByRole("radio", { hidden: true, name });
};
