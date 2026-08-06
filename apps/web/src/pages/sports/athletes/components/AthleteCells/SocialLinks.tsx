import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import type { FC } from "react";

import { faFacebookF } from "@fortawesome/free-brands-svg-icons/faFacebookF";
import { faInstagram } from "@fortawesome/free-brands-svg-icons/faInstagram";
import { faTiktok } from "@fortawesome/free-brands-svg-icons/faTiktok";
import { faXTwitter } from "@fortawesome/free-brands-svg-icons/faXTwitter";
import { faYoutube } from "@fortawesome/free-brands-svg-icons/faYoutube";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useLingui } from "@lingui/react/macro";
import { Anchor, Group } from "@mantine/core";

import type { Athlete } from "../../api/types";

interface SocialLinksProps {
  athlete: Athlete;
}

type SocialPlatformName = "Facebook" | "Instagram" | "TikTok" | "X" | "YouTube";

const SOCIAL_LABELS: Readonly<Record<string, SocialPlatformName>> = {
  facebook: "Facebook",
  instagram: "Instagram",
  tiktok: "TikTok",
  twitter: "X",
  youtube: "YouTube",
};

const SOCIAL_ICONS: Readonly<Record<string, IconDefinition>> = {
  facebook: faFacebookF,
  instagram: faInstagram,
  tiktok: faTiktok,
  twitter: faXTwitter,
  youtube: faYoutube,
};

export const SocialLinks: FC<SocialLinksProps> = ({ athlete }) => {
  const { t } = useLingui();

  if (athlete.socialLinks.length === 0) return null;

  return (
    <Group gap={6} mt={2} wrap="nowrap">
      {athlete.socialLinks.map((link) => {
        const platform = SOCIAL_LABELS[link.platform] ?? link.platform;
        const handle = link.handle;
        const icon = SOCIAL_ICONS[link.platform];

        return (
          <Anchor
            aria-label={t({
              comment: "Link to an athlete's social profile",
              message: `${platform} profile ${handle}`,
            })}
            c="dimmed"
            href={link.url}
            key={link.platform}
            rel="noopener noreferrer"
            size="xs"
            target="_blank"
          >
            {icon === undefined ? platform : <FontAwesomeIcon icon={icon} />}
          </Anchor>
        );
      })}
    </Group>
  );
};
