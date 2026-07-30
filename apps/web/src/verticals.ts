import type { MessageDescriptor } from "@lingui/core";

import { msg } from "@lingui/core/macro";

interface VerticalNavLink {
  label: MessageDescriptor;
  path: string;
}

export interface VerticalConfig {
  homePath: string;
  id: "creators" | "music" | "sports";
  label: MessageDescriptor;
  navLinks: VerticalNavLink[];
}

const music: VerticalConfig = {
  homePath: "/music/artists",
  id: "music",
  label: msg`for Music`,
  navLinks: [{ label: msg`Artists`, path: "/music/artists" }],
};

const sports: VerticalConfig = {
  homePath: "/sports/athletes",
  id: "sports",
  label: msg`for Sports`,
  navLinks: [{ label: msg`Athletes`, path: "/sports/athletes" }],
};

const creators: VerticalConfig = {
  homePath: "/creators/influencers",
  id: "creators",
  label: msg`for Creators`,
  navLinks: [{ label: msg`Influencers`, path: "/creators/influencers" }],
};

export const VERTICALS: VerticalConfig[] = [music, sports, creators];

export const DEFAULT_VERTICAL = music;

export const findVerticalByPathname = (pathname: string): VerticalConfig =>
  VERTICALS.find((vertical) => pathname.startsWith(`/${vertical.id}`)) ??
  DEFAULT_VERTICAL;
