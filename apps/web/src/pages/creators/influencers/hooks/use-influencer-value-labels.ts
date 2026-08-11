import { useLingui } from "@lingui/react/macro";
import { useMemo } from "react";

export interface InfluencerValueLabels {
  formatAgeGroup: (ageGroup: string) => string;
  formatGender: (gender: string) => string;
}

export const useInfluencerValueLabels = (): InfluencerValueLabels => {
  const { t } = useLingui();

  return useMemo(() => {
    const genderLabels: Record<string, string> = {
      female: t`Female`,
      male: t`Male`,
      "non-binary": t`Non-binary`,
    };

    return {
      formatAgeGroup: (ageGroup) =>
        ageGroup === "18-" ? t`Under 18` : ageGroup,
      formatGender: (gender) => genderLabels[gender] ?? gender,
    };
  }, [t]);
};
