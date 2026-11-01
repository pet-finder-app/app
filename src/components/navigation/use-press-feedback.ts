"use client";

import { useState, type KeyboardEvent, type PointerEvent } from "react";

/** Respond to contact immediately instead of waiting for touch activation. */
export function usePressFeedback() {
  const [isPressed, setIsPressed] = useState(false);

  function handlePointerDown(event: PointerEvent<HTMLElement>) {
    if (event.isPrimary && event.button === 0) setIsPressed(true);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLElement>) {
    if (event.key === "Enter" || event.key === " ") setIsPressed(true);
  }

  function handleRelease() {
    setIsPressed(false);
  }

  return {
    "data-pressed": isPressed,
    onPointerDown: handlePointerDown,
    onPointerUp: handleRelease,
    onPointerCancel: handleRelease,
    onPointerLeave: handleRelease,
    onKeyDown: handleKeyDown,
    onKeyUp: handleRelease,
    onBlur: handleRelease,
  };
}
