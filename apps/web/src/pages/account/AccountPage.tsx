import type { FC } from "react";

import { Trans } from "@lingui/react/macro";
import { Card, Stack, Text, Title } from "@mantine/core";
import { useAuthInfo } from "@propelauth/react";

import { AccessSummary } from "./components/AccessSummary";

const displayName = (user: {
  email: string;
  firstName?: string;
  lastName?: string;
}): string => {
  const name = [user.firstName, user.lastName]
    .filter((part) => part !== undefined && part !== "")
    .join(" ");
  return name === "" ? user.email : name;
};

const AccountBody: FC = () => {
  const authInfo = useAuthInfo();

  // RequiredAuthProvider only renders the app for authenticated users; this
  // guard exists for type narrowing, not as a reachable state.
  if (authInfo.loading || !authInfo.isLoggedIn) {
    return null;
  }

  return (
    <Card maw={720} padding="lg" radius="md" withBorder>
      <Stack gap="md">
        <div>
          <Text fw={600}>{displayName(authInfo.user)}</Text>
          <Text c="dimmed" size="sm">
            {authInfo.user.email}
          </Text>
        </div>
        <AccessSummary
          accessToken={authInfo.accessToken}
          userId={authInfo.user.userId}
        />
      </Stack>
    </Card>
  );
};

export const AccountPage: FC = () => (
  <Stack>
    <Title order={1}>
      <Trans>Account</Trans>
    </Title>
    <AccountBody />
  </Stack>
);
