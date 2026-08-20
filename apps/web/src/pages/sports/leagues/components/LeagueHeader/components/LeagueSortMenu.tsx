import type { FC } from "react";

import { faArrowDown } from "@fortawesome/pro-regular-svg-icons/faArrowDown";
import { faArrowUp } from "@fortawesome/pro-regular-svg-icons/faArrowUp";
import { faChevronDown } from "@fortawesome/pro-regular-svg-icons/faChevronDown";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useLingui } from "@lingui/react/macro";
import { Button, Menu } from "@mantine/core";

import type { LeagueSortBy, LeagueSortDirection } from "../../../api/types";

interface LeagueSortMenuProps {
  onSort: (sortBy: LeagueSortBy) => void;
  sortBy: LeagueSortBy;
  sortDirection: LeagueSortDirection;
}

// Selecting the active column again toggles its direction — changeQuerySort
// owns that rule, so this control only ever reports the chosen column.
export const LeagueSortMenu: FC<LeagueSortMenuProps> = ({
  onSort,
  sortBy,
  sortDirection,
}) => {
  const { t } = useLingui();
  const options: readonly { label: string; value: LeagueSortBy }[] = [
    { label: t`League / Competition`, value: "name" },
    { label: t`Sport`, value: "sport" },
    { label: t`Athletes`, value: "trackedAthletes" },
    { label: t`Total IG Reach`, value: "igReach" },
  ];
  const active = options.find((option) => option.value === sortBy);

  return (
    <Menu position="bottom-end" withinPortal>
      <Menu.Target>
        <Button
          aria-label={t`Change list sorting`}
          leftSection={
            <FontAwesomeIcon
              icon={sortDirection === "asc" ? faArrowUp : faArrowDown}
              size="xs"
            />
          }
          rightSection={<FontAwesomeIcon icon={faChevronDown} size="xs" />}
          size="xs"
          variant="default"
        >
          {active?.label ?? sortBy}
        </Button>
      </Menu.Target>
      <Menu.Dropdown>
        {options.map((option) => (
          <Menu.Item
            key={option.value}
            onClick={() => {
              onSort(option.value);
            }}
          >
            {option.label}
          </Menu.Item>
        ))}
      </Menu.Dropdown>
    </Menu>
  );
};
