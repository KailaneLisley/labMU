import { Dispatch, SetStateAction, useState } from "react";
import { readJsonFromStorage } from "../lib/storage";

export const usePersistentState = <T,>(key: string, initialValue: T) => {
  const [value, setValue] = useState<T>(() => readJsonFromStorage<T>(key) ?? initialValue);

  const setPersistentValue: Dispatch<SetStateAction<T>> = (nextValue) => {
    const currentValue = readJsonFromStorage<T>(key) ?? value;
    const valueToStore =
      typeof nextValue === "function"
        ? (nextValue as (currentValue: T) => T)(currentValue)
        : nextValue;
    localStorage.setItem(key, JSON.stringify(valueToStore));
    setValue(valueToStore);
  };

  return [value, setPersistentValue] as const;
};
