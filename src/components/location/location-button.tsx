"use client";

import { Button, cn, iconSize } from "@/components/ui";
import { MapPin, X } from "lucide-react";
import { useId } from "react";
import { CrossedLocationIcon } from "./crossed-location-icon";
import { LocationDisabledDialog } from "./location-disabled-dialog";
import { useBrowserLocation } from "./use-browser-location";

type LocationButtonProps = {
  active: boolean;
  appearance?: "button" | "filter";
  initialEnabled?: boolean;
  onEnabledChange?: (enabled: boolean) => void;
};

/** GPS control with a compact toggle variant for feed filters. */
export function LocationButton({
  active,
  appearance = "button",
  initialEnabled = true,
  onEnabledChange,
}: LocationButtonProps) {
  const id = useId();
  const {
    isEnabled,
    isBusy,
    message,
    isDenied,
    isNoticeOpen,
    toggleLocation,
    closeNotice,
  } = useBrowserLocation({
    active,
    autoEnable: appearance === "filter",
    initialEnabled,
    onEnabledChange,
  });
  if (appearance === "filter") {
    return (
      <div className="contents">
        <Button
          variant="filter"
          size="md"
          role="switch"
          aria-checked={isEnabled}
          aria-busy={isBusy}
          aria-describedby={message && !isDenied ? `${id}-status` : undefined}
          aria-label={
            isDenied ? "Localização desativada: ver aviso" : "Localização"
          }
          onClick={() => void toggleLocation()}
          title={isDenied ? "Localização desativada: ver aviso" : "Localização"}
          className={cn("size-8! min-h-8! p-0!", isDenied && "opacity-75")}
        >
          {isDenied ? (
            <CrossedLocationIcon className="size-3.5 shrink-0" />
          ) : (
            <MapPin className="size-3.5 shrink-0" aria-hidden="true" />
          )}
        </Button>
        <LocationDisabledDialog
          isOpen={isNoticeOpen}
          message={message}
          onDismiss={closeNotice}
        />
        {message && !isDenied ? (
          <p
            id={`${id}-status`}
            role="status"
            className="order-last col-span-full w-full text-xs text-text"
          >
            {message}
          </p>
        ) : null}
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-1">
      <Button
        variant={isEnabled ? "pill" : "secondary"}
        size="sm"
        className="self-start"
        loading={isBusy}
        loadingLabel="LOCALIZANDO..."
        onClick={() => void toggleLocation()}
      >
        {isDenied ? (
          <CrossedLocationIcon className={iconSize.sm} />
        ) : isEnabled ? (
          <X className={iconSize.sm} aria-hidden="true" />
        ) : (
          <MapPin className={iconSize.sm} aria-hidden="true" />
        )}
        {isEnabled
          ? "Parar de usar minha localização"
          : "Usar minha localização"}
      </Button>
      <LocationDisabledDialog
        isOpen={isNoticeOpen}
        message={message}
        onDismiss={closeNotice}
      />
      {message && !isDenied ? (
        <p role="status" className="text-xs text-text">
          {message}
        </p>
      ) : null}
    </div>
  );
}
