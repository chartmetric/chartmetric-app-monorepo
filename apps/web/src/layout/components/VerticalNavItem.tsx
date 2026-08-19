import type { FC } from "react";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useLingui } from "@lingui/react/macro";
import { NavLink } from "@mantine/core";
import { Link, useLocation } from "react-router";

import type { VerticalNavLink } from "../../verticals";

import classes from "./VerticalNavItem.module.css";

interface VerticalNavItemProps {
  link: VerticalNavLink;
  onNavigate: () => void;
}

export const VerticalNavItem: FC<VerticalNavItemProps> = ({
  link,
  onNavigate,
}) => {
  const { t } = useLingui();
  const location = useLocation();
  const icon =
    link.icon === undefined ? undefined : (
      <FontAwesomeIcon aria-hidden icon={link.icon} />
    );

  // No Link means no href, so a click on a not-yet-built destination cannot
  // navigate; Mantine's `disabled` supplies the muting.
  if (link.disabled === true) {
    return (
      <NavLink
        aria-disabled
        c="white"
        disabled
        label={t(link.label)}
        leftSection={icon}
      />
    );
  }

  return (
    <NavLink
      active={location.pathname === link.path}
      c="white"
      className={classes["navLink"]}
      color="teal.7"
      component={Link}
      label={t(link.label)}
      leftSection={icon}
      onClick={onNavigate}
      to={link.path}
      variant="filled"
    />
  );
};
