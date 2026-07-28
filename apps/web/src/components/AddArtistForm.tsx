import type { FC } from "react";

import { Trans, useLingui } from "@lingui/react/macro";
import { Button, PasswordInput, Stack, TextInput } from "@mantine/core";
import { isEmail, isNotEmpty, useForm } from "@mantine/form";
import { modals } from "@mantine/modals";

interface AddArtistFormValues {
  email: string;
  name: string;
  password: string;
}

export const AddArtistForm: FC = () => {
  const { t } = useLingui();
  const form = useForm<AddArtistFormValues>({
    initialValues: { email: "", name: "", password: "" },
    validate: {
      email: isEmail(t`Invalid email`),
      name: isNotEmpty(t`Name is required`),
      password: isNotEmpty(t`Password is required`),
    },
  });

  return (
    <form
      onSubmit={form.onSubmit(() => {
        modals.closeAll();
      })}
    >
      <Stack>
        <TextInput
          label={t`Artist name`}
          placeholder={t`Tame Impala`}
          withAsterisk
          {...form.getInputProps("name")}
        />
        <TextInput
          label={t`Contact email`}
          placeholder={t`artist@example.com`}
          withAsterisk
          {...form.getInputProps("email")}
        />
        <PasswordInput
          label={t`Password`}
          withAsterisk
          {...form.getInputProps("password")}
        />
        <Button type="submit">
          <Trans>Save</Trans>
        </Button>
      </Stack>
    </form>
  );
};
