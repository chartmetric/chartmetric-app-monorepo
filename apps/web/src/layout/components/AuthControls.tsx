import type { FC } from "react";

import { Trans } from "@lingui/react/macro";
import { Anchor, Button, Group } from "@mantine/core";
import { useAuthInfo, useLogoutFunction } from "@propelauth/react";
import { Link } from "react-router";

export const AuthControls: FC = () => {
  const authInfo = useAuthInfo();
  const logout = useLogoutFunction();

  // RequiredAuthProvider only renders the app for authenticated users; this
  // guard exists for type narrowing, not as a reachable state.
  if (authInfo.loading || !authInfo.isLoggedIn) {
    return null;
  }

  return (
    <Group gap="xs" wrap="nowrap">
      <Anchor component={Link} fw={500} size="sm" to="/account">
        {authInfo.user.email}
      </Anchor>
      <Button
        onClick={() => {
          void logout(true);
        }}
        size="xs"
        variant="default"
      >
        <Trans>Log out</Trans>
      </Button>
    </Group>
  );
};
