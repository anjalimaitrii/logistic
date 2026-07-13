// Shared between the trucks page ("Renewals Due" button) and the global
// AlertsSidebar so both always show the same list.

export interface ComplianceAlert { truckId: string; label: string; days: number; }

export function daysUntil(dateStr: string): number | null {
  if (!dateStr) return null;
  const diff = new Date(dateStr).setHours(0, 0, 0, 0) - new Date().setHours(0, 0, 0, 0);
  return Math.ceil(diff / 86400000);
}

// Compliance docs + next service due within 20 days (or already expired).
export function getComplianceAlerts(trucks: any[]): ComplianceAlert[] {
  const alerts: ComplianceAlert[] = [];
  trucks.forEach(t => {
    (t.complianceDocs || []).forEach((doc: any) => {
      const d = daysUntil(doc.dueDate);
      if (d !== null && d <= 20) alerts.push({ truckId: t.truckId, label: doc.type, days: d });
    });
    const sd = daysUntil(t.nextServiceDate);
    if (sd !== null && sd <= 20) alerts.push({ truckId: t.truckId, label: "Service", days: sd });
  });
  return alerts.sort((a, b) => a.days - b.days);
}
