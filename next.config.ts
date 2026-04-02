import withSerwistInit from "@serwist/next";

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
