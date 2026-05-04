"use client";

import { useState, useEffect } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import CommonTable from "@/components/admin/CommonTable";
import BookingChatPanel from "@/components/admin/BookingChatPanel";
import FinalizeDealDrawer from "@/components/admin/FinalizeDealDrawer";
import { MessageSquare, CheckCircle, XCircle, Clock, ChevronRight, Package } from "lucide-react";
import StatCard from "@/components/admin/StatCard";
import { bookingService } from "@/services/bookingService";
import { useRouter } from "next/navigation";
import CreateBookingDrawer from "@/components/admin/CreateBookingDrawer";

type RequestStatus = "Pending" | "Accepted" | "Rejected" | "Finalized";

export default function BookingRequestsPage() {
  const router = useRouter();
  const [requests, setRequests] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<any | null>(null);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isFinalizeDrawerOpen, setIsFinalizeDrawerOpen] = useState(false);
  const [isCreateDrawerOpen, setIsCreateDrawerOpen] = useState(false);

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async () => {
    try {
      setIsLoading(true);
      const data = await bookingService.getAll();
      setRequests(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Fetch requests error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateBooking = async (data: any) => {
    try {
      const payload = {
        clientId: data.clientId,
        cargoDetails: {
          goodsType: data.goodsType,
          weight: Number(data.weight),
          loadingDate: data.scheduleDate,
        },
        pickup: {
          contactPerson: data.pickupContactPerson,
          contactNumber: data.pickupContact,
          address: {
            plotNo: data.pickupPlotNo,
            street: data.pickupStreet,
            city: data.pickupCity,
            pincode: data.pickupPincode,
          },
          gpsEnabled: false
        },
        dropoff: {
          contactPerson: data.dropoffContactPerson,
          contactNumber: data.dropoffContact,
          address: {
            plotNo: data.dropoffPlotNo,
            street: data.dropoffStreet,
            city: data.dropoffCity,
            pincode: data.dropoffPincode,
          },
          gpsEnabled: false
        },
        requirement: {
          bodyType: data.truckType
        },
        status: "accepted"
      };
      await bookingService.create(payload);
      loadRequests();
      setIsCreateDrawerOpen(false);
    } catch (error) {
      console.error("Create booking error:", error);
      alert("Failed to create booking.");
    }
  };

  const handleStatusChange = async (id: string, newStatus: string, additionalData: any = {}) => {
    try {
      await bookingService.updateStatus(id, newStatus.toLowerCase(), additionalData);
      loadRequests();
    } catch (error) {
      console.error("Status update error:", error);
    }
  };

  const getStatusLabel = (status: string): RequestStatus => {
    if (!status) return 'Pending';
    const s = status.toLowerCase();
    if (s === 'pending') return 'Pending';
    if (s === 'accepted') return 'Accepted';
    if (s === 'rejected') return 'Rejected';
    if (s === 'finalized' || s === 'delivered') return 'Finalized';
    return 'Pending';
  };

  const tableData = requests.map(req => ({
    id: `#BR-${req._id?.substring(req._id.length - 7).toUpperCase() || "NEW"}`,
    customer: (req.clientId as any)?.name || "Direct Client",
    companyName: (req.clientId as any)?.company?.companyName || "Direct Booking",
    route: `${req.pickup.address.city} → ${req.dropoff.address.city}`,
    cargo: req.cargoDetails.goodsType,
    weight: `${req.cargoDetails.weight} KG`,
    price: req.finalAmount ? `₹${req.finalAmount}` : "TBD",
    date: new Date(req.createdAt || req.metadata?.createdAt || Date.now()).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
    status: getStatusLabel(req.status),
    raw: req
  }));

  const columns = [
    {
      label: "Request ID",
      key: "id",
      render: (val: string) => <span className="text-[12px] font-semibold text-primary tracking-tight">{val}</span>
    },
    {
      label: "Customer",
      key: "customer",
      render: (val: string, row: any) => (
        <div className="flex flex-col gap-0.5">
          <div className="flex items-center gap-2">
            <span className="px-1.5 py-0.5 rounded bg-slate-900 text-white text-[7.5px] font-bold uppercase tracking-wider">{row.companyName}</span>
          </div>
          <span className="text-[12px] font-bold text-slate-700">{val}</span>
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
      render: (val: string, row: any) => (
        <div className="flex flex-col">
          <span className="text-[12px] font-medium text-neutral-900">{val}</span>
          <span className="text-[10px] font-medium text-neutral-400 uppercase tracking-tighter">{row.weight}</span>
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
      render: (_: any, row: any) => (
        <div className="flex gap-2 justify-center items-center">
          {row.status === "Pending" && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleStatusChange(row.raw._id, "Accepted");
                }}
                className="p-2 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-600 hover:text-white transition-all group"
                title="Accept Request"
              >
                <CheckCircle className="w-4 h-4 group-hover:scale-110 transition-transform" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleStatusChange(row.raw._id, "Rejected");
                }}
                className="p-2 bg-rose-50 text-rose-500 rounded-lg hover:bg-rose-600 hover:text-white transition-all group"
                title="Reject Request"
              >
                <XCircle className="w-4 h-4 group-hover:scale-110 transition-transform" />
              </button>
            </>
          )}

          {row.status === "Accepted" && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedRequest(row.raw);
                  setIsChatOpen(true);
                }}
                className="p-2 bg-neutral-50 text-neutral-400 hover:text-primary hover:bg-primary/10 rounded-lg transition-all border border-transparent hover:border-primary/20 group"
                title="Negotiate Chat"
              >
                <MessageSquare className="w-4 h-4 group-hover:scale-110 transition-transform" />
              </button>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedRequest(row.raw);
                  setIsFinalizeDrawerOpen(true);
                }}
                className="px-3 py-1.5 bg-slate-900 text-white text-[9px] font-semibold rounded-lg uppercase tracking-widest hover:brightness-110 transition-all shadow-sm flex items-center gap-1.5"
              >
                Finalize Deal
              </button>
            </>
          )}

          {row.status === "Finalized" && (
            <div className="flex items-center gap-1 text-[9px] font-semibold text-emerald-600 uppercase tracking-widest bg-emerald-50 px-3 py-1 rounded-full">
              <CheckCircle className="w-3 h-3" />
              Completed
            </div>
          )}

          {row.status === "Rejected" && (
            <div className="flex items-center gap-1 text-[9px] font-semibold text-rose-500 uppercase tracking-widest bg-rose-50 px-3 py-1 rounded-full">
              <XCircle className="w-3 h-3" />
              Rejected
            </div>
          )}
        </div>
      )
    }
  ];

  const stats = [
    { label: "Total Submissions", value: requests.length.toString(), icon: "📩", subText: "Overall Requests", trend: "Live", variant: "primary" as const },
    { label: "Accepted Deals", value: requests.filter(r => r.status === 'accepted' || r.status === 'finalized').length.toString(), icon: "🤝", subText: "Active/Accepted", trend: "Sync", variant: "success" as const },
    { label: "Pending Review", value: requests.filter(r => r.status === 'pending').length.toString(), icon: "⏳", subText: "Awaiting Action", trend: "High", variant: "warning" as const },
    { label: "Rejections", value: requests.filter(r => r.status === 'rejected').length.toString(), icon: "🚫", subText: "Closed Requests", trend: "Live", variant: "danger" as const },
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

          <button
            onClick={() => setIsCreateDrawerOpen(true)}
            className="bg-slate-900 text-white px-6 py-2.5 rounded-lg font-bold text-[10px] uppercase tracking-[0.2em] shadow-lg shadow-slate-200 hover:brightness-110 transition-all w-fit"
          >
            ＋ NEW BOOKING
          </button>

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
          data={isLoading ? [] : tableData}
          onRowClick={(row) => {
            if (row.status === "Accepted") {
              setSelectedRequest(row.raw);
              setIsChatOpen(true);
            }
          }}
          emptyState={
            isLoading ? (
              <div className="py-12 flex flex-col items-center justify-center gap-2">
                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-2">Syncing latest submissions...</p>
              </div>
            ) : (
              <div className="py-12 flex flex-col items-center justify-center gap-2">
                <Package className="w-8 h-8 text-neutral-200" />
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-2">No active submissions found</p>
              </div>
            )
          }
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
          request={selectedRequest ? {
            id: `#BR-${selectedRequest._id?.substring(selectedRequest._id.length - 7).toUpperCase()}`,
            customer: (selectedRequest.clientId as any)?.name || "Direct Client",
            route: `${selectedRequest.pickup.address.city} → ${selectedRequest.dropoff.address.city}`,
            cargo: selectedRequest.cargoDetails.goodsType,
            price: "TBD",
            date: new Date(selectedRequest.createdAt || Date.now()).toLocaleDateString(),
            status: getStatusLabel(selectedRequest.status) as any
          } : null}
          onFinalize={() => {
            setIsChatOpen(false);
            setIsFinalizeDrawerOpen(true);
          }}
        />

        <FinalizeDealDrawer
          isOpen={isFinalizeDrawerOpen}
          onClose={() => setIsFinalizeDrawerOpen(false)}
          request={selectedRequest ? {
            ...selectedRequest,
            id: `#BR-${selectedRequest._id?.substring(selectedRequest._id.length - 7).toUpperCase()}`,
            customer: (selectedRequest.clientId as any)?.name || "Direct Client",
            route: `${selectedRequest.pickup.address.city} → ${selectedRequest.dropoff.address.city}`,
            cargo: selectedRequest.cargoDetails.goodsType,
            price: "TBD",
            date: new Date(selectedRequest.createdAt || Date.now()).toLocaleDateString(),
            status: getStatusLabel(selectedRequest.status) as any
          } : null}
          onSubmit={(data) => {
            if (selectedRequest) {
              handleStatusChange(selectedRequest._id, "Finalized", {
                finalAmount: Number(data.amount),
                advancePaid: Number(data.advancePaid),
                specialRequest: data.specialRequest
              });
            }
            setIsFinalizeDrawerOpen(false);
            console.log("Finalizing deal with data:", data);
          }}
        />
        <CreateBookingDrawer
          isOpen={isCreateDrawerOpen}
          onClose={() => setIsCreateDrawerOpen(false)}
          onSubmit={handleCreateBooking}
        />
      </div>
    </AdminLayout>
  );
}
