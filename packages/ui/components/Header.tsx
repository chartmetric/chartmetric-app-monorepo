import type { FC } from "react";

import { Title } from "@mantine/core";

interface HeaderProps {
  readonly title: string;
}

export const Header: FC<HeaderProps> = ({ title }) => {
  return (
    <header id="header">
      <Title>{title}</Title>
    </header>
  );
};
