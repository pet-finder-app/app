import assert from "node:assert/strict";
import test from "node:test";
import {
  clampTransform,
  scaleTransformAroundPoint,
} from "../src/components/posts/photo-viewer-gestures.ts";

const surface = { width: 400, height: 600 };

test("zoom remains between the fitted size and five times that size", () => {
  for (const scale of [-2, 0.5, 1, 2, 5, 12]) {
    const result = clampTransform(
      { scale, x: 1000, y: -1000 },
      { width: 1200, height: 600 },
      surface,
    );
    assert.ok(result.scale >= 1 && result.scale <= 5);
    if (scale < 1) assert.equal(result.scale, 1);
    if (scale > 5) assert.equal(result.scale, 5);
  }
});

test("panning respects letterboxing for landscape and portrait photos", () => {
  for (const [image, limits] of [
    [
      { width: 1200, height: 600 },
      { x: 200, y: 0 },
    ],
    [
      { width: 600, height: 1200 },
      { x: 100, y: 300 },
    ],
  ]) {
    for (const sign of [-1, 1]) {
      const result = clampTransform(
        { scale: 2, x: 1000 * sign, y: 1000 * sign },
        image,
        surface,
      );
      assert.equal(Math.abs(result.x), limits.x);
      assert.equal(Math.abs(result.y), limits.y);
    }
  }
});

test("resetting or waiting for an image keeps it centered", () => {
  for (const [scale, image] of [
    [1, { width: 1200, height: 600 }],
    [3, { width: 0, height: 0 }],
  ]) {
    const result = clampTransform({ scale, x: 300, y: -100 }, image, surface);
    assert.equal(Math.abs(result.x), 0);
    assert.equal(Math.abs(result.y), 0);
  }
});

test("pinching preserves the image point under the moving finger midpoint", () => {
  const initial = { scale: 1.5, x: 25, y: -10 };
  const origin = { x: 280, y: 220 };
  const current = { x: 300, y: 240 };
  const center = { x: 200, y: 300 };
  for (const scale of [1, 2, 3, 9]) {
    const next = scaleTransformAroundPoint(
      initial,
      origin,
      current,
      center,
      scale,
    );
    for (const axis of ["x", "y"]) {
      const imagePoint =
        (origin[axis] - center[axis] - initial[axis]) / initial.scale;
      const screenPoint = center[axis] + next[axis] + imagePoint * next.scale;
      assert.ok(Math.abs(screenPoint - current[axis]) < 0.000001);
    }
    assert.ok(next.scale >= 1 && next.scale <= 5);
  }
});

test("resizing the viewport reclamps an existing pan", () => {
  const image = { width: 1200, height: 600 };
  const initial = clampTransform({ scale: 3, x: 400, y: 0 }, image, surface);
  const resized = clampTransform(initial, image, { width: 200, height: 600 });
  assert.equal(resized.scale, initial.scale);
  assert.equal(resized.x, 200);
  assert.equal(Math.abs(resized.y), 0);
});
