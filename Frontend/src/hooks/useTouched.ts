import { useState } from "react";

/**
 * Tracks which fields in a form the user has already left (blurred), so a
 * field's validation error only appears once they've actually moved on from
 * it - not before they've had a chance to finish typing - while still
 * clearing live the moment they fix it, without needing to blur again.
 */
export function useTouched<T extends string>() {
  const [touched, setTouched] = useState<Partial<Record<T, boolean>>>({});

  const markTouched = (field: T) => () =>
    setTouched((prev) => (prev[field] ? prev : { ...prev, [field]: true }));

  const isTouched = (field: T) => Boolean(touched[field]);

  return { markTouched, isTouched };
}
