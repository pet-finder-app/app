export type PhotoPoint = { x: number; y: number };
export type PhotoTransform = PhotoPoint & { scale: number };
export type PhotoSize = { width: number; height: number };

/** Keep the fitted image inside its pan limits at every zoom level. */
export function clampTransform(
  transform: PhotoTransform,
  image: PhotoSize,
  surface: PhotoSize,
): PhotoTransform {
  const scale = Math.max(1, Math.min(5, transform.scale));
  const fit =
    image.width > 0 && image.height > 0
      ? Math.min(surface.width / image.width, surface.height / image.height)
      : 0;
  const limitX = Math.max(0, (image.width * fit * scale - surface.width) / 2);
  const limitY = Math.max(0, (image.height * fit * scale - surface.height) / 2);
  return {
    scale,
    x: Math.max(-limitX, Math.min(limitX, transform.x)),
    y: Math.max(-limitY, Math.min(limitY, transform.y)),
  };
}

/** Zoom around the initial gesture midpoint while tracking its translation. */
export function scaleTransformAroundPoint(
  initial: PhotoTransform,
  origin: PhotoPoint,
  current: PhotoPoint,
  center: PhotoPoint,
  scale: number,
): PhotoTransform {
  const boundedScale = Math.max(1, Math.min(5, scale));
  const ratio = boundedScale / initial.scale;
  return {
    scale: boundedScale,
    x:
      initial.x * ratio +
      current.x -
      origin.x +
      (origin.x - center.x) * (1 - ratio),
    y:
      initial.y * ratio +
      current.y -
      origin.y +
      (origin.y - center.y) * (1 - ratio),
  };
}
