"use client";

import AdminLayout from "@/components/admin/AdminLayout";
import TollAccountView from "@/components/admin/TollAccountView";

export default function TollAccountPage() {
  return (
    <AdminLayout>
      <TollAccountView walletOnly />
    </AdminLayout>
  );
}
