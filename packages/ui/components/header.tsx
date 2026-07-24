import type { FC } from "react";

interface HeaderProps {
  readonly title: string;
}

export const Header: FC<HeaderProps> = ({ title }) => {
  return (
    <header id="header">
      <h1>{title}</h1>
    </header>
  );
};
