import type { FC } from "react";

import { Trans, useLingui } from "@lingui/react/macro";
import { Button, Stack, TextInput } from "@mantine/core";
import { isEmail, isNotEmpty, useForm } from "@mantine/form";
import { modals } from "@mantine/modals";

interface AddArtistFormValues {
  email: string;
  name: string;
}

export const AddArtistForm: FC = () => {
  const { t } = useLingui();
  const form = useForm<AddArtistFormValues>({
    initialValues: { email: "", name: "" },
    validate: {
      email: isEmail(t`Invalid email`),
      name: isNotEmpty(t`Name is required`),
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
        <Button type="submit">
          <Trans>Save</Trans>
        </Button>
      </Stack>
    </form>
  );
};
