"use client";

import ReportView from "@/components/admin/ReportView";

// Overall financial & operations report — includes secret jobs (ReportView pulls
// all bookings via getAll). Rendered inside the secret layout.
export default function SecretReportPage() {
  return <ReportView includeSecret />;
}
