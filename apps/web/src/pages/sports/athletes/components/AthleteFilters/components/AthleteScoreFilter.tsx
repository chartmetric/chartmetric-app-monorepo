import type { FC } from "react";

import { useLingui } from "@lingui/react/macro";
import { type NumericRangeValue, RangeFilter } from "@repo/ui/range-filter";

const CM_SCORE_STEP = 0.1;

const DEFAULT_SCORE_MAX = 100;

export interface AthleteScoreFilterProps {
  bounds: { max: number | null; min: number | null } | undefined;
  isLoading: boolean;
  onChange: (value: NumericRangeValue) => void;
  onChangeEnd: (value: NumericRangeValue) => void;
  value: NumericRangeValue;
}

export const AthleteScoreFilter: FC<AthleteScoreFilterProps> = ({
  bounds,
  isLoading,
  onChange,
  onChangeEnd,
  value,
}) => {
  const { t } = useLingui();
  const min = bounds?.min ?? 0;
  const max = Math.max(min + CM_SCORE_STEP, bounds?.max ?? DEFAULT_SCORE_MAX);

  return (
    <RangeFilter
      clearLabel={t`Clear range`}
      disabled={isLoading}
      label={t`CM score`}
      max={max}
      maximumLabel={t`Maximum CM score`}
      min={min}
      minimumLabel={t`Minimum CM score`}
      onChange={onChange}
      onChangeEnd={onChangeEnd}
      step={CM_SCORE_STEP}
      value={value}
    />
  );
};
