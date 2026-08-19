import type { MessageDescriptor } from "@lingui/core";
import type { FC } from "react";

import { msg } from "@lingui/core/macro";
import { useLingui } from "@lingui/react/macro";
import { Box, Text } from "@mantine/core";

import type { VerticalNavLink, VerticalNavSection } from "../../verticals";

import { VerticalNavItem } from "./VerticalNavItem";

// Record keyed by the union: adding a VerticalNavSection variant without a
// label is a compile error, unlike an array literal that lets links vanish.
const SECTION_LABELS: Record<VerticalNavSection, MessageDescriptor> = {
  discover: msg`Discover`,
  library: msg`Library`,
  tools: msg`Tools`,
};

const SECTION_ORDER: readonly VerticalNavSection[] = [
  "library",
  "discover",
  "tools",
];

interface VerticalNavProps {
  links: VerticalNavLink[];
  onNavigate: () => void;
}

export const VerticalNav: FC<VerticalNavProps> = ({ links, onNavigate }) => {
  const { t } = useLingui();

  return (
    <>
      {links
        .filter((link) => link.section === undefined)
        .map((link) => (
          <VerticalNavItem
            key={link.path}
            link={link}
            onNavigate={onNavigate}
          />
        ))}
      {SECTION_ORDER.map((section) => {
        const sectionLinks = links.filter((link) => link.section === section);
        if (sectionLinks.length === 0) {
          return null;
        }

        const headingId = `nav-section-${section}`;

        return (
          <Box aria-labelledby={headingId} key={section} mt="md" role="group">
            <Text
              c="teal.2"
              fw={600}
              id={headingId}
              mb={4}
              px="sm"
              size="xs"
              tt="uppercase"
            >
              {t(SECTION_LABELS[section])}
            </Text>
            {sectionLinks.map((link) => (
              <VerticalNavItem
                key={link.path}
                link={link}
                onNavigate={onNavigate}
              />
            ))}
          </Box>
        );
      })}
    </>
  );
};
