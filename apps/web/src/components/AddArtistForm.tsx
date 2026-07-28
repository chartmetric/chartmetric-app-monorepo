import type { FC } from "react";

import { Button, Stack, TextInput } from "@mantine/core";
import { isEmail, isNotEmpty, useForm } from "@mantine/form";
import { modals } from "@mantine/modals";

interface AddArtistFormValues {
  email: string;
  name: string;
}

export const AddArtistForm: FC = () => {
  const form = useForm<AddArtistFormValues>({
    initialValues: { email: "", name: "" },
    validate: {
      email: isEmail("Invalid email"),
      name: isNotEmpty("Name is required"),
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
          label="Artist name"
          placeholder="Tame Impala"
          withAsterisk
          {...form.getInputProps("name")}
        />
        <TextInput
          label="Contact email"
          placeholder="artist@example.com"
          withAsterisk
          {...form.getInputProps("email")}
        />
        <Button type="submit">Save</Button>
      </Stack>
    </form>
  );
};
