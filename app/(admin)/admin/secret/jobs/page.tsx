"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import CommonTable from "@/components/admin/CommonTable";
import { bookingService } from "@/services/bookingService";
import { completionService } from "@/services/completionService";
import { Package, ChevronRight } from "lucide-react";
import { formatDate } from "@/lib/datetime";

export default function SecretJobsPage() {
  const router = useRouter();
  const [jobs, setJobs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  // bookingId → CASH-xxx id filed at completion
  const [cashIdByBooking, setCashIdByBooking] = useState<Record<string, string>>({});

  useEffect(() => {
    loadJobs();
  }, []);

  const loadJobs = async () => {
    try {
      setIsLoading(true);
      const [all, cashData] = await Promise.all([
        bookingService.getAll(),
        completionService.getCash().catch(() => []),
      ]);
      // Completed without-tax secret jobs only
      const completed = (all || []).filter(
        (b: any) =>
          (b.isSecret === true || b.metadata?.isSecret === true) &&
          b.withTax === false &&
          ["completed", "delivered"].includes((b.tripStatus || "").toLowerCase())
      );
      setJobs(completed);

      // bookingId → CASH-xxx
      const idMap: Record<string, string> = {};
      (cashData || []).forEach((r: any) => {
        const bId = (r.bookingId?._id || r.bookingId)?.toString();
        if (bId && r.cashId) idMap[bId] = String(r.cashId).toUpperCase();
      });
      setCashIdByBooking(idMap);
    } catch (err) {
      console.error("Failed to load secret jobs:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const tableData = jobs.map((b) => ({
    id: cashIdByBooking[b._id] || b.tripId || `#SL-${b._id?.slice(-4).toUpperCase()}`,
    client: (b.clientId as any)?.name || b.metadata?.client || "—",
    route: `${b.pickupLocations?.[0]?.address?.city || "Origin"} → ${b.dropoffLocations?.[0]?.address?.city || "Dest."}`,
    cargo: Array.isArray(b.cargoDetails?.goodsType) ? b.cargoDetails.goodsType.join(", ") : (b.cargoDetails?.goodsType || "—"),
    weight: b.cargoDetails?.weight ? `${b.cargoDetails.weight} KG` : "—",
    finalAmount: b.finalAmount ? `K${b.finalAmount.toLocaleString()}` : "TBD",
    advancePaid: b.advancePaid ? `K${b.advancePaid.toLocaleString()}` : "TBD",
    date: b.createdAt
      ? formatDate(b.createdAt)
      : "—",
    raw: b,
  }));

  const columns = [
    {
      label: "Job ID",
      key: "id",
      render: (val: string) => <span className="font-bold text-indigo-600 text-[12px]">{val}</span>,
    },
    {
      label: "Client",
      key: "client",
      render: (val: string) => <span className="font-bold text-neutral-900 text-[12px]">{val}</span>,
    },
    {
      label: "Route",
      key: "route",
      render: (val: string) => <span className="text-[12px] font-medium text-neutral-500 italic">{val}</span>,
    },
    {
      label: "Cargo",
      key: "cargo",
      render: (val: string, row: any) => (
        <div>
          <div className="text-[12px] font-medium text-neutral-900">{val}</div>
          <div className="text-[10px] text-neutral-400">{row.weight}</div>
        </div>
      ),
    },
    {
      label: "Final Amount",
      key: "finalAmount",
      render: (val: string) => <span className="text-[12px] font-bold text-slate-900">{val}</span>,
    },
    {
      label: "Advance Paid",
      key: "advancePaid",
      render: (val: string) => <span className="text-[12px] font-medium text-slate-500">{val}</span>,
    },
    {
      label: "Date",
      key: "date",
      render: (val: string) => <span className="text-[11px] text-neutral-400 font-medium">{val}</span>,
    },
    {
      label: "Tax",
      key: "tax",
      render: () => (
        <span className="px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border bg-amber-50 text-amber-600 border-amber-200">
          Without Tax
        </span>
      ),
    },
  ];

  return (
    <div className="p-6 pb-20 space-y-6 bg-neutral-50 min-h-screen">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-[9px] font-medium text-neutral-400 uppercase tracking-widest">
        <Link href="/admin/secret" className="hover:text-indigo-600 transition-colors">Secret Dashboard</Link>
        <ChevronRight className="w-2.5 h-2.5" />
        <span className="text-indigo-600 font-bold">Secret Jobs</span>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between bg-white p-6 rounded-2xl border border-neutral-100 shadow-sm relative overflow-hidden">
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-600 rounded-l-2xl" />
        <div>
          <h1 className="text-xl font-bold tracking-tight text-neutral-900">Secret Jobs</h1>
          <p className="text-[11px] font-medium text-neutral-400 mt-0.5">Completed without-tax secret assignments</p>
        </div>
        <div className="px-3 py-1.5 bg-amber-50 text-amber-600 border border-amber-100 rounded-xl text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
          {jobs.length} Completed
        </div>
      </div>

      {/* Table */}
      <CommonTable
        title="Completed Without Tax Jobs"
        icon="🔒"
        columns={columns}
        data={isLoading ? [] : tableData}
        onRowClick={(row) => router.push(`/admin/jobs/${row.raw._id}`)}
        emptyState={
          isLoading ? (
            <div className="py-12 flex flex-col items-center justify-center gap-2">
              <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-2">Loading...</p>
            </div>
          ) : (
            <div className="py-12 flex flex-col items-center justify-center gap-2">
              <Package className="w-8 h-8 text-neutral-200" />
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-2">No completed jobs yet</p>
            </div>
          )
        }
      />
    </div>
  );
}
