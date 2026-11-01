"use client";

import { LocationButton } from "@/components/location/location-button";
import { Button, cn } from "@/components/ui";
import { ArrowLeft, EyeOff, Grid2X2, ScrollText } from "lucide-react";
import type { Ref } from "react";
import styles from "./home-feed-filters.module.css";

export type FeedDisplayMode = "scroll" | "grid";

type HomeFeedFiltersProps = {
  ref?: Ref<HTMLDivElement>;
  onReturnToGrid?: () => void;
  displayMode: FeedDisplayMode;
  onDisplayModeChange: (mode: FeedDisplayMode) => void;
  showHidden: boolean;
  onShowHiddenChange: (show: boolean) => void;
  isLocationActive: boolean;
  isLocationEnabled: boolean;
  onLocationEnabledChange?: (enabled: boolean) => void;
};

const MODE_BUTTON_CLASS =
  "relative z-10 h-full! min-h-6! gap-1! border-0! bg-transparent! px-2! py-0! text-[11px]! shadow-none! active:scale-100!";

export function HomeFeedFilters({
  ref,
  onReturnToGrid,
  displayMode,
  onDisplayModeChange,
  showHidden,
  onShowHiddenChange,
  isLocationActive,
  isLocationEnabled,
  onLocationEnabledChange,
}: HomeFeedFiltersProps) {
  return (
    <div
      ref={ref}
      aria-label="Filtros do feed"
      className="sticky top-[calc(3rem+env(safe-area-inset-top))] z-20 grid grid-cols-[2rem_minmax(0,1fr)_2rem] items-center gap-2 border-b border-border-light bg-white px-3 py-2 text-text"
    >
      <LocationButton
        active={isLocationActive}
        appearance="filter"
        initialEnabled={isLocationEnabled}
        onEnabledChange={onLocationEnabledChange}
      />
      {onReturnToGrid ? (
        <Button
          variant="filter"
          size="md"
          onClick={onReturnToGrid}
          className="h-8! min-h-8! gap-1.5! py-0! text-[11px]!"
        >
          <ArrowLeft className="size-3.5" aria-hidden="true" />
          Voltar à grade
        </Button>
      ) : (
        <div
          role="group"
          aria-label="Modo de exibição"
          className={styles.modeSwitch}
          data-mode={displayMode}
        >
          <span aria-hidden="true" className={styles.selection} />
          <Button
            variant="filter"
            size="md"
            aria-pressed={displayMode === "scroll"}
            onClick={() => onDisplayModeChange("scroll")}
            className={cn(MODE_BUTTON_CLASS, styles.modeButton)}
          >
            <ScrollText className="size-3.5 shrink-0" aria-hidden="true" />
            Rolagem
          </Button>
          <Button
            variant="filter"
            size="md"
            aria-pressed={displayMode === "grid"}
            onClick={() => onDisplayModeChange("grid")}
            className={cn(MODE_BUTTON_CLASS, styles.modeButton)}
          >
            <Grid2X2 className="size-3.5 shrink-0" aria-hidden="true" />
            Grade
          </Button>
        </div>
      )}
      <Button
        variant="filter"
        size="md"
        role="switch"
        aria-label="Mostrar ocultos"
        aria-checked={showHidden}
        title="Mostrar ocultos"
        onClick={() => onShowHiddenChange(!showHidden)}
        className="size-8! min-h-8! p-0!"
      >
        <EyeOff className="size-3.5" aria-hidden="true" />
      </Button>
    </div>
  );
}
