import withSerwistInit from "@serwist/next";

// Dev-mode env selection: when NODE_ENV !== 'production', each DEV_* key
// overrides its base key (e.g. DEV_NEXT_PUBLIC_API_URL -> NEXT_PUBLIC_API_URL).
// Skipped in production builds, so deploys use the value set in the workflow.
if (process.env.NODE_ENV !== "production") {
  for (const key of Object.keys(process.env)) {
    if (!key.startsWith("DEV_")) continue;
    const base = key.slice(4);
    const val = process.env[key];
    if (base && val !== undefined) process.env[base] = val;
  }
}

const withSerwist = withSerwistInit({
  swSrc: "app/sw.ts",
  swDest: "public/sw.js",
  disable: process.env.NODE_ENV === "development",
});

const nextConfig: import("next").NextConfig = {
  /* config options here */
  turbopack: {},
};

export default withSerwist(nextConfig);
