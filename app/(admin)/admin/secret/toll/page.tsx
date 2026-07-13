"use client";

import TollAccountView from "@/components/admin/TollAccountView";

// Secret-mode toll account — same screen as /admin/toll, rendered inside the
// secret section's own layout (see secret/layout.tsx).
export default function SecretTollPage() {
  return <TollAccountView />;
}
