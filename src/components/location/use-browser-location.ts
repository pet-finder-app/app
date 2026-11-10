"use client";

import { apiMutations } from "@/lib/api/mutations";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

type UseBrowserLocationOptions = {
  active: boolean;
  autoEnable: boolean;
  initialEnabled: boolean;
  onEnabledChange?: (enabled: boolean) => void;
};

export const LOCATION_DISABLED_MESSAGE =
  "Localização desativada. Para usar, permita o acesso nas configurações do navegador.";

function requestCoordinates(): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    if (!("geolocation" in navigator)) {
      reject(new Error("Seu navegador não permite usar a localização."));
      return;
    }
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      timeout: 10000,
      maximumAge: 600000,
    });
  });
}

function isPermissionDenied(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === 1
  );
}

/** Share GPS persistence, permission handling, and cancellation between controls. */
export function useBrowserLocation({
  active,
  autoEnable,
  initialEnabled,
  onEnabledChange,
}: UseBrowserLocationOptions) {
  const router = useRouter();
  const { mutateAsync: persistLocation } = useMutation(apiMutations.location());
  const [isEnabled, setIsEnabled] = useState(
    autoEnable ? initialEnabled : active,
  );
  const [isBusy, setIsBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [isDenied, setIsDenied] = useState(false);
  const [isNoticeOpen, setIsNoticeOpen] = useState(false);
  const pendingRequest = useRef<AbortController | null>(null);
  const hasRequested = useRef(false);
  const onEnabledChangeRef = useRef(onEnabledChange);

  useEffect(() => {
    onEnabledChangeRef.current = onEnabledChange;
  }, [onEnabledChange]);

  const updateEnabled = useCallback((enabled: boolean) => {
    setIsEnabled(enabled);
    onEnabledChangeRef.current?.(enabled);
  }, []);

  const updateLocation = useCallback(
    async (enabled: boolean) => {
      hasRequested.current = true;
      pendingRequest.current?.abort();
      const controller = new AbortController();
      pendingRequest.current = controller;
      const { signal } = controller;
      updateEnabled(enabled);
      setIsBusy(true);
      setMessage(null);
      try {
        if (enabled) {
          const permission = navigator.permissions
            ? await navigator.permissions
                .query({ name: "geolocation" })
                .catch(() => null)
            : null;
          if (signal.aborted) return;
          if (permission?.state === "denied") {
            throw Object.assign(new Error("Location permission denied"), {
              code: 1,
            });
          }
          const position = await requestCoordinates();
          if (signal.aborted) return;
          await persistLocation({
            coordinates: {
              lat: position.coords.latitude,
              lon: position.coords.longitude,
            },
            signal,
          });
        } else {
          await persistLocation({ coordinates: null, signal });
        }
        if (!signal.aborted) {
          if (enabled) {
            setIsDenied(false);
            setIsNoticeOpen(false);
          }
          router.refresh();
        }
      } catch (error: unknown) {
        if (signal.aborted) return;
        if (isPermissionDenied(error)) {
          updateEnabled(false);
          setIsDenied(true);
          setIsNoticeOpen(true);
          setMessage(LOCATION_DISABLED_MESSAGE);
          try {
            await persistLocation({ coordinates: null, signal });
            if (!signal.aborted) router.refresh();
          } catch {
            if (!signal.aborted)
              setMessage(
                "O acesso à localização foi negado. Não foi possível salvar essa preferência; tente novamente.",
              );
          }
        } else {
          if (!autoEnable || !enabled || !("geolocation" in navigator))
            updateEnabled(!enabled);
          setMessage(
            !("geolocation" in navigator)
              ? "Seu navegador não permite usar a localização."
              : "Não foi possível atualizar a localização. Tente novamente.",
          );
        }
      } finally {
        if (!signal.aborted) setIsBusy(false);
      }
    },
    [autoEnable, router, updateEnabled, persistLocation],
  );

  useEffect(() => {
    if (!autoEnable || hasRequested.current || (!initialEnabled && !active))
      return;
    // Scheduling avoids changing state during mount and survives Strict Mode replay.
    const timer = window.setTimeout(() => {
      if (!hasRequested.current) void updateLocation(initialEnabled);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [active, autoEnable, initialEnabled, updateLocation]);

  useEffect(() => () => pendingRequest.current?.abort(), []);

  useEffect(() => {
    if (!autoEnable || initialEnabled || !navigator.permissions) return;
    let isCanceled = false;
    async function readDeniedPermission() {
      const permission = await navigator.permissions
        .query({ name: "geolocation" })
        .catch(() => null);
      if (!isCanceled && permission?.state === "denied") {
        setIsDenied(true);
        setMessage(LOCATION_DISABLED_MESSAGE);
      }
    }
    // Restore the denied appearance without reopening a previously dismissed notice.
    void readDeniedPermission();
    return () => {
      isCanceled = true;
    };
  }, [autoEnable, initialEnabled]);

  async function toggleLocation() {
    if (isDenied) {
      // Allow recovery after the user changes the browser permission in settings.
      const permission = navigator.permissions
        ? await navigator.permissions
            .query({ name: "geolocation" })
            .catch(() => null)
        : null;
      if (permission && permission.state !== "denied") {
        await updateLocation(true);
      } else {
        setIsNoticeOpen(true);
      }
      return;
    }
    await updateLocation(!isEnabled);
  }

  return {
    isEnabled,
    isBusy,
    message,
    isDenied,
    isNoticeOpen,
    updateLocation,
    toggleLocation,
    closeNotice: () => setIsNoticeOpen(false),
  };
}
