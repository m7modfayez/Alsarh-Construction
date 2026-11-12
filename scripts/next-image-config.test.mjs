import assert from "node:assert/strict";
import { createRequire } from "node:module";
import test from "node:test";
import nextConfig from "../next.config.mjs";

const require = createRequire(import.meta.url);
const { hasRemoteMatch } = require("next/dist/shared/lib/match-remote-pattern");

test("allows the production Cloudinary WebP delivery URL and rejects other Cloudinary paths", () => {
  const allowed = new URL("https://res.cloudinary.com/rpoookqu/image/upload/v1730000000/project/image.webp");
  const otherCloud = new URL("https://res.cloudinary.com/another-cloud/image/upload/project/image.webp");
  const otherResource = new URL("https://res.cloudinary.com/rpoookqu/video/upload/project/image.webp");

  assert.equal(hasRemoteMatch([], nextConfig.images.remotePatterns, allowed), true);
  assert.equal(hasRemoteMatch([], nextConfig.images.remotePatterns, otherCloud), false);
  assert.equal(hasRemoteMatch([], nextConfig.images.remotePatterns, otherResource), false);
});

test("permits the failing 640-wide quality-80 optimizer request", () => {
  assert.ok(nextConfig.images.deviceSizes.includes(640));
  assert.ok(nextConfig.images.qualities.includes(80));
});
