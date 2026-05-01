"use client";

import { useState, useEffect } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import StatCard from "@/components/admin/StatCard";
import CommonTable from "@/components/admin/CommonTable";
import OperationAssignmentDrawer from "@/components/admin/OperationAssignmentDrawer";
import { Truck, Users, Clock, AlertTriangle, Eye, Edit2, ChevronRight } from "lucide-react";
import { bookingService } from "@/services/bookingService";
import { assignmentService } from "@/services/assignmentService";

export default function AdminOperations() {
  const [selectedJob, setSelectedJob] = useState<any | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [bookings, setBookings] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadBookings();
  }, []);

  const loadBookings = async () => {
    try {
      setIsLoading(true);
      const [bookingsData, assignmentsData] = await Promise.all([
        bookingService.getAll(),
        assignmentService.getAll()
      ]);
      
      const finalized = (bookingsData || []).filter((b: any) => b.status === "finalized");
      setBookings(finalized);
      setAssignments(assignmentsData || []);
    } catch (error) {
      console.error("Failed to load operations data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAssignJob = async (assignmentData: any) => {
    if (!selectedJob) return;
    try {
      const payload = {
        bookingId: selectedJob._id,
        driverName: assignmentData.driver,
        truckNumber: assignmentData.truckNumber,
        truckHealth: assignmentData.truckHealth,
        collectionArea: assignmentData.collection
      };

      if (selectedJob.assignment) {
        // Update existing assignment
        await assignmentService.update(selectedJob._id, payload);
      } else {
        // Create new assignment
        await assignmentService.create(payload);
      }
      
      setIsDrawerOpen(false);
      loadBookings();
    } catch (error) {
      console.error("Failed to assign job:", error);
      alert("Failed to assign fleet unit");
    }
  };

  const kpis = [
    { label: "Total Finalized", value: bookings.length.toString(), icon: <Truck className="w-5 h-5 text-primary" />, subText: "Ready for operations", trend: "Live", variant: "primary" as const },
    { label: "Unassigned", value: bookings.filter(b => !assignments.find(a => (a.bookingId?._id || a.bookingId) === b._id)).length.toString(), icon: <AlertTriangle className="w-5 h-5 text-rose-500" />, subText: "Needs driver/truck", trend: "Critical", variant: "danger" as const },
    { label: "Assigned", value: assignments.length.toString(), icon: <Users className="w-5 h-5 text-emerald-500" />, subText: "Fleet coordinated", trend: "Ready", variant: "success" as const },
    { label: "In Transit", value: "0", icon: <Clock className="w-5 h-5 text-amber-500" />, subText: "On the road", trend: "Tracking", variant: "warning" as const },
  ];

  const tableData = bookings.map(b => {
    const assignment = assignments.find(a => (a.bookingId?._id || a.bookingId) === b._id);
    return {
      id: b._id.substring(b._id.length - 6).toUpperCase(),
      route: `${b.pickup?.address?.city || 'N/A'} → ${b.dropoff?.address?.city || 'N/A'}`,
      status: assignment ? "Assigned" : "Unassigned",
      weight: b.cargoDetails?.weight,
      goodsType: b.cargoDetails?.goodsType,
      scheduleDate: b.cargoDetails?.loadingDate,
      type: assignment ? "success" : "unassigned",
      raw: { ...b, assignment }
    };
  });

  const columns = [
    { label: "Job ID", key: "id", render: (val: string) => <span className="font-semibold text-primary">#{val}</span> },
    { label: "Route", key: "route", render: (val: string) => <span className="text-[12px] font-medium text-neutral-500 italic pr-2">{val}</span> },
    {
      label: "Status",
      key: "status",
      render: (val: string, row: any) => (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-medium uppercase tracking-widest ${
            row.type === "success" ? "bg-emerald-50 text-emerald-600" : "bg-neutral-50 text-neutral-400"
          }`}
        >
          <span className={`w-1 h-1 rounded-full ${row.type === "success" ? "bg-emerald-500" : "bg-neutral-400"}`} />
          {val}
        </span>
      ),
    },
    { label: "Payload", key: "weight", render: (val: string, row: any) => (
       <div className="flex flex-col">
          <span className="text-slate-900 font-bold">{val} kg</span>
          <span className="text-[9px] text-neutral-400 uppercase font-bold tracking-tighter">{row.goodsType}</span>
       </div>
    )},
    { label: "Schedule", key: "scheduleDate", render: (val: string) => <span className="font-medium text-neutral-500">{val}</span> },
    {
      label: "Actions",
      key: "actions",
      align: "center" as const,
      render: (val: any, row: any) => (
        <div className="flex gap-2 justify-center">
          {row.raw.assignment ? (
            <button
              onClick={() => {
                setSelectedJob(row.raw);
                setIsDrawerOpen(true);
              }}
              className="px-3 py-1.5 bg-white border border-neutral-100 text-neutral-400 rounded-lg text-[10px] font-bold uppercase tracking-widest hover:text-primary hover:border-primary/20 transition-all flex items-center gap-2"
            >
              <Eye className="w-3 h-3" />
              View
            </button>
          ) : (
            <button
              onClick={() => {
                setSelectedJob(row.raw);
                setIsDrawerOpen(true);
              }}
              className="px-3 py-1.5 bg-primary text-white rounded-lg text-[10px] font-bold uppercase tracking-widest hover:scale-[1.02] active:scale-[0.98] transition-all shadow-md shadow-primary/10 flex items-center gap-2"
            >
              <Edit2 className="w-3 h-3" />
              Assign
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <AdminLayout>
      <div className="p-6 space-y-8 font-sans">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
           <div>
              <div className="flex items-center gap-2 text-[9px] text-neutral-400 mb-1 font-medium uppercase tracking-widest">
                 <span className="hover:text-primary cursor-pointer transition-colors">Admin</span>
                 <ChevronRight className="w-2.5 h-2.5" />
                 <span className="text-primary/80">Operations</span>
              </div>
              <h1 className="text-lg md:text-xl font-semibold tracking-tight text-slate-900">Logistics Operations</h1>
              <p className="text-[11px] text-neutral-400 mt-0.5">Manage driver assignments and fleet coordination.</p>
           </div>
        </div>

        {/* Dashboard Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {kpis.map((kpi, i) => (
            <StatCard key={i} {...kpi} />
          ))}
        </div>

        {/* Active Jobs Table */}
        <CommonTable
          title="Operation Ready Jobs"
          icon="📦"
          columns={columns}
          data={tableData}
          onRowClick={(row) => {
            setSelectedJob(row.raw);
            setIsDrawerOpen(true);
          }}
          action={
             <div className="flex items-center gap-2">
                <div className="bg-emerald-50 text-emerald-600 px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-widest border border-emerald-100 flex items-center gap-2">
                   <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                   {bookings.length} Finalized Jobs
                </div>
             </div>
          }
        />

        {/* Assignment Drawer */}
        {isDrawerOpen && (
          <OperationAssignmentDrawer
            isOpen={isDrawerOpen}
            onClose={() => {
              setIsDrawerOpen(false);
              loadBookings();
            }}
            job={selectedJob}
            onSubmit={handleAssignJob}
          />
        )}
      </div>
    </AdminLayout>
  );
}
