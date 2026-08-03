import type { FC } from "react";

import { Trans, useLingui } from "@lingui/react/macro";
import {
  Button,
  Fieldset,
  Group,
  NumberInput,
  SimpleGrid,
  Stack,
  TextInput,
} from "@mantine/core";
import { useForm, type UseFormReturnType } from "@mantine/form";

import type { AthleteFilters as AthleteFilterQuery } from "../athlete-list-query";

interface AthleteFilterValues {
  maxCmScore: number | string;
  minCmScore: number | string;
  name: string;
  nationality: string;
  sport: string;
  type: string;
}

interface AthleteFiltersProps {
  onApply: (filters: AthleteFilterQuery) => void;
}

const optionalText = (value: string): string | undefined => {
  const trimmedValue = value.trim();

  return trimmedValue === "" ? undefined : trimmedValue;
};

const optionalNumber = (value: number | string): number | undefined =>
  typeof value === "number" ? value : undefined;

const toFilterQuery = (values: AthleteFilterValues): AthleteFilterQuery => {
  const filters: AthleteFilterQuery = {};
  const maxCmScore = optionalNumber(values.maxCmScore);
  const minCmScore = optionalNumber(values.minCmScore);
  const name = optionalText(values.name);
  const nationality = optionalText(values.nationality);
  const sport = optionalText(values.sport);
  const type = optionalText(values.type);

  if (maxCmScore !== undefined) filters.maxCmScore = maxCmScore;
  if (minCmScore !== undefined) filters.minCmScore = minCmScore;
  if (name !== undefined) filters.name = name;
  if (nationality !== undefined) filters.nationality = nationality;
  if (sport !== undefined) filters.sport = sport;
  if (type !== undefined) filters.type = type;

  return filters;
};

interface AthleteFilterFieldsProps {
  form: UseFormReturnType<AthleteFilterValues>;
}

const AthleteFilterFields: FC<AthleteFilterFieldsProps> = ({ form }) => {
  const { t } = useLingui();

  return (
    <SimpleGrid cols={{ base: 1, md: 2, xl: 3 }}>
      <TextInput
        key={form.key("name")}
        label={t`Search by name`}
        placeholder={t`Enter an athlete name`}
        {...form.getInputProps("name")}
      />
      <TextInput
        key={form.key("sport")}
        label={t`Sport`}
        placeholder={t`Enter a sport`}
        {...form.getInputProps("sport")}
      />
      <TextInput
        key={form.key("nationality")}
        label={t`Nationality`}
        placeholder={t`Enter a nationality`}
        {...form.getInputProps("nationality")}
      />
      <TextInput
        key={form.key("type")}
        label={t`Type`}
        placeholder={t`Enter a profile type`}
        {...form.getInputProps("type")}
      />
      <NumberInput
        key={form.key("minCmScore")}
        label={t`Minimum CM score`}
        {...form.getInputProps("minCmScore")}
      />
      <NumberInput
        key={form.key("maxCmScore")}
        label={t`Maximum CM score`}
        {...form.getInputProps("maxCmScore")}
      />
    </SimpleGrid>
  );
};

export const AthleteFilters: FC<AthleteFiltersProps> = ({ onApply }) => {
  const { t } = useLingui();
  const form = useForm<AthleteFilterValues>({
    initialValues: {
      maxCmScore: "",
      minCmScore: "",
      name: "",
      nationality: "",
      sport: "",
      type: "",
    },
    mode: "uncontrolled",
    validate: (values) => ({
      maxCmScore:
        typeof values.minCmScore === "number" &&
        typeof values.maxCmScore === "number" &&
        values.maxCmScore < values.minCmScore
          ? t`Maximum CM score must be greater than or equal to the minimum.`
          : null,
    }),
  });

  return (
    <form
      onSubmit={form.onSubmit((values) => {
        onApply(toFilterQuery(values));
      })}
    >
      <Fieldset legend={t`Filters`}>
        <Stack gap="md">
          <AthleteFilterFields form={form} />
          <Group justify="flex-end">
            <Button
              onClick={() => {
                form.reset();
                onApply({});
              }}
              type="button"
              variant="default"
            >
              <Trans>Clear filters</Trans>
            </Button>
            <Button type="submit">
              <Trans>Apply filters</Trans>
            </Button>
          </Group>
        </Stack>
      </Fieldset>
    </form>
  );
};
