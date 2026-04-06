"use client";

import { useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import CommonTable from "@/components/admin/CommonTable";
import BookingChatPanel from "@/components/admin/BookingChatPanel";
import CreateJobModal from "@/components/admin/CreateJobModal";

type RequestStatus = "Pending" | "Accepted" | "Rejected" | "Finalized";

interface BookingRequest {
  id: string;
  customer: string;
  route: string;
  cargo: string;
  price: string;
  date: string;
  status: RequestStatus;
}

export default function BookingRequestsPage() {
  const [requests, setRequests] = useState<BookingRequest[]>([
    { id: "#BR-1001", customer: "John Doe", route: "Lagos → Abuja", cargo: "Furniture", price: "₦150,000", date: "06 Apr 2026", status: "Pending" },
    { id: "#BR-1002", customer: "Sarah Smith", route: "Ibadan → Kano", cargo: "Textiles", weight: "2.5 Tons", price: "₦280,000", date: "06 Apr 2026", status: "Accepted" },
    { id: "#BR-1003", customer: "Michael Chen", route: "Port Har. → Enugu", cargo: "Electronics", price: "₦420,000", date: "05 Apr 2026", status: "Pending" },
    { id: "#BR-1004", customer: "Amaka Okafor", route: "Benin → Warri", cargo: "Food Items", price: "₦95,000", date: "05 Apr 2026", status: "Rejected" },
  ]);

  const [selectedRequest, setSelectedRequest] = useState<BookingRequest | null>(null);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const handleStatusChange = (id: string, newStatus: RequestStatus) => {
    setRequests(prev => prev.map(req => req.id === id ? { ...req, status: newStatus } : req));
  };

  const columns = [
    { label: "Request ID", key: "id", render: (val: string) => <span className="font-bold text-primary">{val}</span> },
    { label: "Customer", key: "customer", render: (val: string) => <span className="font-bold text-neutral-900">{val}</span> },
    { label: "Route", key: "route" },
    { label: "Cargo", key: "cargo" },
    { label: "Proposed Price", key: "price", render: (val: string) => <span className="font-bold text-neutral-900">{val}</span> },
    { 
      label: "Status", 
      key: "status",
      render: (val: RequestStatus) => (
        <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${
          val === 'Pending' ? 'bg-amber-50 text-amber-600 border-amber-100' :
          val === 'Accepted' ? 'bg-indigo-50 text-indigo-600 border-indigo-100' :
          val === 'Rejected' ? 'bg-rose-50 text-rose-500 border-rose-100' :
          'bg-success-light text-success border-success/20'
        }`}>
          {val}
        </span>
      )
    },
    {
      label: "Actions",
      key: "actions",
      align: "center" as const,
      render: (_: any, row: BookingRequest) => (
        <div className="flex gap-2 justify-center">
          {row.status === "Pending" && (
            <>
              <button 
                onClick={() => handleStatusChange(row.id, "Accepted")}
                className="px-3 py-1.5 bg-success text-white text-[10px] font-bold rounded-lg uppercase tracking-tight hover:scale-105 transition-all"
              >
                Accept
              </button>
              <button 
                onClick={() => handleStatusChange(row.id, "Rejected")}
                className="px-3 py-1.5 bg-white border border-neutral-100 text-neutral-400 text-[10px] font-bold rounded-lg uppercase tracking-tight hover:bg-rose-50 hover:text-rose-500 transition-all"
              >
                Reject
              </button>
            </>
          )}
          {row.status === "Accepted" && (
            <button 
              onClick={() => {
                setSelectedRequest(row);
                setIsChatOpen(true);
              }}
              className="px-3 py-1.5 bg-indigo-600 text-white text-[10px] font-bold rounded-lg uppercase tracking-tight hover:scale-105 transition-all flex items-center gap-1.5"
            >
              <span>💬</span> Negotiate
            </button>
          )}
          {row.status === "Finalized" && (
            <span className="text-[10px] font-bold text-neutral-400 italic">Job Created</span>
          )}
        </div>
      )
    }
  ];

  return (
    <AdminLayout>
      <div className="p-6 pb-20 space-y-8 bg-[#F8FAFC] min-h-screen">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-neutral-900">Booking Requests</h1>
            <p className="text-[12px] font-medium text-neutral-400 mt-1 uppercase tracking-widest">Review and negotiate client cargo submissions</p>
          </div>
          <div className="flex items-center gap-3">
             <div className="flex -space-x-2">
                {[1,2,3].map(i => (
                  <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-neutral-200" />
                ))}
                <div className="w-8 h-8 rounded-full border-2 border-white bg-primary text-white text-[10px] flex items-center justify-center font-bold">+2</div>
             </div>
             <span className="text-[11px] font-bold text-neutral-500 uppercase tracking-tighter">5 New Requests Today</span>
          </div>
        </div>

        <CommonTable 
          title="Recent Submissions"
          icon="📩"
          columns={columns}
          data={requests}
        />

        <BookingChatPanel 
          isOpen={isChatOpen}
          onClose={() => setIsChatOpen(false)}
          request={selectedRequest}
          onFinalize={() => {
            setIsChatOpen(false);
            setIsCreateModalOpen(true);
          }}
        />

        <CreateJobModal 
          isOpen={isCreateModalOpen}
          initialData={selectedRequest}
          onClose={() => setIsCreateModalOpen(false)}
          onSubmit={(data) => {
            if (selectedRequest) {
              handleStatusChange(selectedRequest.id, "Finalized");
            }
            setIsCreateModalOpen(false);
            alert("Job Created Successfully from Request!");
          }}
        />
      </div>
    </AdminLayout>
  );
}
