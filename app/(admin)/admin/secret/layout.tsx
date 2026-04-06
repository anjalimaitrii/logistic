"use client";

import React from "react";
import SecretLayout from "@/components/admin/SecretLayout";

export default function SecretRootLayout({ children }: { children: React.ReactNode }) {
  return <SecretLayout>{children}</SecretLayout>;
}
