import type { MessageDescriptor } from "@lingui/core";
import type { FC } from "react";

import { msg } from "@lingui/core/macro";
import { useLingui } from "@lingui/react/macro";
import { Box, Text } from "@mantine/core";

import type { VerticalNavLink, VerticalNavSection } from "../../verticals";

import { VerticalNavItem } from "./VerticalNavItem";

const SECTIONS: readonly {
  id: VerticalNavSection;
  label: MessageDescriptor;
}[] = [
  { id: "library", label: msg`Library` },
  { id: "discover", label: msg`Discover` },
  { id: "tools", label: msg`Tools` },
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
      {SECTIONS.map((section) => {
        const sectionLinks = links.filter(
          (link) => link.section === section.id,
        );
        if (sectionLinks.length === 0) {
          return null;
        }

        const headingId = `nav-section-${section.id}`;

        return (
          <Box
            aria-labelledby={headingId}
            key={section.id}
            mt="md"
            role="group"
          >
            <Text
              c="teal.2"
              fw={600}
              id={headingId}
              mb={4}
              px="sm"
              size="xs"
              tt="uppercase"
            >
              {t(section.label)}
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
