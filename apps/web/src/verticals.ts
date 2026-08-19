import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import type { MessageDescriptor } from "@lingui/core";

import { faCalendarDays } from "@fortawesome/pro-solid-svg-icons/faCalendarDays";
import { faGauge } from "@fortawesome/pro-solid-svg-icons/faGauge";
import { faListCheck } from "@fortawesome/pro-solid-svg-icons/faListCheck";
import { faPeopleGroup } from "@fortawesome/pro-solid-svg-icons/faPeopleGroup";
import { faPersonRunning } from "@fortawesome/pro-solid-svg-icons/faPersonRunning";
import { faScaleBalanced } from "@fortawesome/pro-solid-svg-icons/faScaleBalanced";
import { faStopwatch } from "@fortawesome/pro-solid-svg-icons/faStopwatch";
import { msg } from "@lingui/core/macro";

export type VerticalNavSection = "discover" | "library" | "tools";

export interface VerticalNavLink {
  disabled?: boolean;
  icon?: IconDefinition;
  label: MessageDescriptor;
  path: string;
  section?: VerticalNavSection;
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
  navLinks: [
    {
      disabled: true,
      icon: faGauge,
      label: msg`Dashboard`,
      path: "/sports/dashboard",
    },
    {
      icon: faPersonRunning,
      label: msg`Athletes`,
      path: "/sports/athletes",
      section: "library",
    },
    {
      disabled: true,
      icon: faPeopleGroup,
      label: msg`Teams`,
      path: "/sports/teams",
      section: "discover",
    },
    {
      disabled: true,
      icon: faStopwatch,
      label: msg`Games`,
      path: "/sports/games",
      section: "discover",
    },
    {
      disabled: true,
      icon: faCalendarDays,
      label: msg`Events`,
      path: "/sports/events",
      section: "discover",
    },
    {
      disabled: true,
      icon: faListCheck,
      label: msg`Shortlists`,
      path: "/sports/shortlists",
      section: "tools",
    },
    {
      disabled: true,
      icon: faScaleBalanced,
      label: msg`Compare`,
      path: "/sports/compare",
      section: "tools",
    },
  ],
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
