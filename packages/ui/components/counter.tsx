import { type FC, useState } from "react";

export const Counter: FC = () => {
  const [count, setCount] = useState(0);

  return (
    <button
      id="counter"
      onClick={() => {
        setCount(count + 1);
      }}
      type="button"
    >
      {count}
    </button>
  );
};
