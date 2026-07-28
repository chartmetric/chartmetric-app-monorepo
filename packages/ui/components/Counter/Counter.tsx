import { Button } from "@mantine/core";
import { type FC, useState } from "react";

export const Counter: FC = () => {
  const [count, setCount] = useState(0);

  return (
    <Button
      id="counter"
      onClick={() => {
        setCount(count + 1);
      }}
    >
      {count}
    </Button>
  );
};
