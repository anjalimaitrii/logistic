"use client";

import { useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import CommonTable from "@/components/admin/CommonTable";
import BookingChatPanel from "@/components/admin/BookingChatPanel";
import FinalizeDealDrawer from "@/components/admin/FinalizeDealDrawer";
import { MessageSquare, CheckCircle, XCircle, Clock, ChevronRight } from "lucide-react";
import StatCard from "@/components/admin/StatCard";

type RequestStatus = "Pending" | "Accepted" | "Rejected" | "Finalized";

interface BookingRequest {
  id: string;
  customer: string;
  route: string;
  cargo: string;
  price: string;
  date: string;
  status: RequestStatus;
  weight?: string;
}

export default function BookingRequestsPage() {
  const [requests, setRequests] = useState<BookingRequest[]>([
    { id: "#BR-1001", customer: "John Doe", route: "Lagos → Abuja", cargo: "Furniture", weight: "1.2 Tons", price: "₦150,000", date: "06 Apr 2026", status: "Pending" },
    { id: "#BR-1002", customer: "Sarah Smith", route: "Ibadan → Kano", cargo: "Textiles", weight: "2.5 Tons", price: "₦280,000", date: "06 Apr 2026", status: "Accepted" },
    { id: "#BR-1003", customer: "Michael Chen", route: "Port Har. → Enugu", cargo: "Electronics", weight: "500kg", price: "₦420,000", date: "05 Apr 2026", status: "Pending" },
    { id: "#BR-1004", customer: "Amaka Okafor", route: "Benin → Warri", cargo: "Food Items", weight: "3.1 Tons", price: "₦95,000", date: "05 Apr 2026", status: "Rejected" },
  ]);

  const [selectedRequest, setSelectedRequest] = useState<BookingRequest | null>(null);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isFinalizeDrawerOpen, setIsFinalizeDrawerOpen] = useState(false);

  const handleStatusChange = (id: string, newStatus: RequestStatus) => {
    setRequests(prev => prev.map(req => req.id === id ? { ...req, status: newStatus } : req));
  };

  const columns = [
    {
      label: "Request ID",
      key: "id",
      render: (val: string) => <span className="text-[12px] font-semibold text-primary tracking-tight">{val}</span>
    },
    {
      label: "Customer",
      key: "customer",
      render: (val: string) => (
        <div className="flex flex-col">
          <span className="text-[13px] font-medium text-neutral-900">{val}</span>
          <span className="text-[10px] font-medium text-neutral-400">Regular Client</span>
        </div>
      )
    },
    {
      label: "Route",
      key: "route",
      render: (val: string) => (
        <span className="text-[12px] font-medium text-neutral-600">{val}</span>
      )
    },
    {
      label: "Cargo Detail",
      key: "cargo",
      render: (val: string, row: BookingRequest) => (
        <div className="flex flex-col">
          <span className="text-[12px] font-medium text-neutral-900">{val}</span>
          <span className="text-[10px] font-medium text-neutral-400 uppercase tracking-tighter">{row.weight || "N/A"}</span>
        </div>
      )
    },
    {
      label: "Proposed",
      key: "price",
      render: (val: string) => <span className="text-[12px] font-semibold text-neutral-900">{val}</span>
    },
    {
      label: "Status",
      key: "status",
      render: (val: RequestStatus) => (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-medium uppercase tracking-widest ${val === 'Pending' ? 'bg-amber-50 text-amber-600' :
          val === 'Accepted' ? 'bg-blue-50 text-blue-600' :
            val === 'Rejected' ? 'bg-rose-50 text-rose-500' :
              'bg-emerald-50 text-emerald-600'
          }`}>
          <div className={`w-1 h-1 rounded-full ${val === 'Pending' ? 'bg-amber-500' :
            val === 'Accepted' ? 'bg-blue-600' :
              val === 'Rejected' ? 'bg-rose-500' :
                'bg-emerald-600'
            }`} />
          {val}
        </span>
      )
    },
    {
      label: "Actions",
      key: "actions",
      align: "center" as const,
      render: (_: any, row: BookingRequest) => (
        <div className="flex gap-2 justify-center items-center">
          {row.status === "Pending" && (
            <>
              <button
                onClick={() => handleStatusChange(row.id, "Accepted")}
                className="p-2 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-600 hover:text-white transition-all group"
                title="Accept Request"
              >
                <CheckCircle className="w-4 h-4 group-hover:scale-110 transition-transform" />
              </button>
              <button
                onClick={() => handleStatusChange(row.id, "Rejected")}
                className="p-2 bg-rose-50 text-rose-500 rounded-lg hover:bg-rose-600 hover:text-white transition-all group"
                title="Reject Request"
              >
                <XCircle className="w-4 h-4 group-hover:scale-110 transition-transform" />
              </button>
            </>
          )}

          {(row.status === "Accepted" || row.status === "Pending") && (
            <button
              onClick={() => {
                setSelectedRequest(row);
                setIsChatOpen(true);
              }}
              className="p-2 bg-neutral-50 text-neutral-400 group-hover:text-primary hover:bg-primary/10 rounded-lg transition-all border border-transparent hover:border-primary/20"
              title="Negotiate Chat"
            >
              <MessageSquare className="w-4 h-4" />
            </button>
          )}

          <button
            onClick={() => {
              setSelectedRequest(row);
              setIsFinalizeDrawerOpen(true);
            }}
            className="px-3 py-1.5 bg-slate-900 text-white text-[9px] font-semibold rounded-lg uppercase tracking-widest hover:brightness-110 transition-all shadow-sm flex items-center gap-1.5"
          >
            Finalize Deal
          </button>

          {row.status === "Finalized" && (
            <div className="flex items-center gap-1 text-[9px] font-semibold text-emerald-600 uppercase tracking-widest bg-emerald-50 px-3 py-1 rounded-full">
              <CheckCircle className="w-3 h-3" />
              Completed
            </div>
          )}
        </div>
      )
    }
  ];

  const stats = [
    { label: "Total Submissions", value: "124", icon: "📩", subText: "Last 30 days", trend: "↑ 12%", variant: "primary" as const },
    { label: "Accepted Deals", value: "82", icon: "🤝", subText: "High conversion", trend: "↑ 66%", variant: "success" as const },
    { label: "Pending Review", value: "14", icon: "⏳", subText: "Awaiting action", trend: "↓ 2 today", variant: "warning" as const },
    { label: "Rejections", value: "28", icon: "🚫", subText: "Profile mismatch", trend: "—", variant: "danger" as const },
  ];

  return (
    <AdminLayout>
      <div className="p-6 pb-20 space-y-8 bg-neutral-50 min-h-screen">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-[9px] font-medium text-neutral-400 uppercase tracking-widest mb-1.5">
              <span>Operations</span>
              <ChevronRight className="w-2.5 h-2.5" />
              <span className="text-primary/80">Booking Requests</span>
            </div>
            <h1 className="text-lg md:text-xl font-semibold tracking-tight text-slate-900">Manage Requests</h1>
            <p className="text-[11px] text-neutral-400 mt-0.5">Review and finalize client cargo submissions in real-time.</p>
          </div>

          <div className="flex items-center gap-4 bg-white p-2.5 rounded-2xl border border-neutral-100 shadow-sm">
            <div className="flex -space-x-2.5">
              {[1, 2, 3].map(i => (
                <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-slate-100 flex items-center justify-center text-[9px] font-semibold text-slate-400">
                  U{i}
                </div>
              ))}
              <div className="w-8 h-8 rounded-full border-2 border-white bg-slate-900 text-white text-[9px] flex items-center justify-center font-semibold relative group">
                +2
                <div className="absolute -top-1 -right-1 w-2 h-2 bg-emerald-500 rounded-full border border-white" />
              </div>
            </div>
            <div className="h-8 w-px bg-neutral-100" />
            <div className="flex flex-col">
              <span className="text-[11px] font-semibold text-slate-900 leading-none">5 New Deals</span>
              <span className="text-[9px] font-medium text-neutral-400 uppercase tracking-tighter mt-1">Ready to scale</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((s, i) => (
            <StatCard key={i} {...s} />
          ))}
        </div>

        <CommonTable
          title="Recent Submissions"
          icon="📩"
          columns={columns}
          data={requests}
          onRowClick={(row) => {
            setSelectedRequest(row);
            setIsChatOpen(true);
          }}
          action={
            <div className="flex gap-2">
              <div className="relative group">
                <input
                  type="text"
                  placeholder="Search requests..."
                  className="bg-white border border-neutral-100 rounded-xl px-4 py-2 text-[11px] font-medium outline-none focus:border-primary/20 transition-all w-56 shadow-sm"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-300 group-focus-within:text-primary transition-colors">
                  🔍
                </div>
              </div>
            </div>
          }
        />

        <BookingChatPanel
          isOpen={isChatOpen}
          onClose={() => setIsChatOpen(false)}
          request={selectedRequest}
          onFinalize={() => {
            setIsChatOpen(false);
            setIsFinalizeDrawerOpen(true);
          }}
        />

        <FinalizeDealDrawer
          isOpen={isFinalizeDrawerOpen}
          onClose={() => setIsFinalizeDrawerOpen(false)}
          request={selectedRequest}
          onSubmit={(data) => {
            if (selectedRequest) {
              handleStatusChange(selectedRequest.id, "Finalized");
            }
            // Here we would typically hit an API to create a job
            console.log("Creating job with data:", data);
          }}
        />
      </div>
    </AdminLayout>
  );
}
