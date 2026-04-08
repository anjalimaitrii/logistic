"use client";

import { useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import StatCard from "@/components/admin/StatCard";
import CommonTable from "@/components/admin/CommonTable";
import OperationAssignmentDrawer from "@/components/admin/OperationAssignmentDrawer";
import { Truck, Users, Clock, AlertTriangle, Eye, Edit2, ChevronRight } from "lucide-react";

export default function AdminOperations() {
  const [selectedJob, setSelectedJob] = useState<any | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const kpis = [
    { label: "Total Active Jobs", value: "18", icon: <Truck className="w-5 h-5 text-primary" />, subText: "Active in fleet", trend: "↑ 2 new", variant: "primary" as const },
    { label: "Unassigned", value: "7", icon: <AlertTriangle className="w-5 h-5 text-rose-500" />, subText: "Needs driver & truck", trend: "Critical", variant: "danger" as const },
    { label: "Assigned", value: "11", icon: <Users className="w-5 h-5 text-emerald-500" />, subText: "Ready for transit", trend: "↑ 4 today", variant: "success" as const },
    { label: "Transit Delay", value: "2", icon: <Clock className="w-5 h-5 text-amber-500" />, subText: "Maintenance needed", trend: "Check health", variant: "warning" as const },
  ];

  const operationsData = [
    { 
      id: "#JOB-4001", 
      route: "Lagos (West) → Abuja (Central)", 
      status: "Unassigned",
      pickupStreet: "123 Business Way",
      pickupCity: "Lagos",
      pickupPincode: "100001",
      pickupContact: "+234 812 345 6789",
      dropoffStreet: "45 Capital Road",
      dropoffCity: "Abuja",
      dropoffPincode: "900001",
      dropoffContact: "+234 812 987 6543",
      weight: "5,000",
      goodsType: "Electronics",
      scheduleDate: "2024-04-08",
      scheduleTime: "10:00",
      type: "unassigned" 
    },
    { 
      id: "#JOB-4005", 
      route: "Kano (North) → Port Harcourt", 
      status: "Assigned", 
      driver: "Adaeze O.", 
      truckNumber: "TRK-2201",
      truckHealth: "Excellent",
      collection: "Collection 2",
      pickupStreet: "78 Northern Hub",
      pickupCity: "Kano",
      pickupPincode: "700001",
      pickupContact: "+234 803 111 2222",
      dropoffStreet: "Oil Terminal A",
      dropoffCity: "P.Harcourt",
      dropoffPincode: "500001",
      dropoffContact: "+234 803 333 4444",
      weight: "12,500",
      goodsType: "Oil & Gas Equipment",
      scheduleDate: "2024-04-09",
      scheduleTime: "08:00",
      type: "success" 
    },
    { 
      id: "#JOB-3998", 
      route: "Ibadan (SW) → Enugu (SE)", 
      status: "Unassigned",
      pickupStreet: "9 Industrial Estate",
      pickupCity: "Ibadan",
      pickupPincode: "200001",
      pickupContact: "+234 815 121 2121",
      dropoffStreet: "22 Coal Hill Road",
      dropoffCity: "Enugu",
      dropoffPincode: "400001",
      dropoffContact: "+234 815 343 4343",
      weight: "3,200",
      goodsType: "Textiles",
      scheduleDate: "2024-04-10",
      scheduleTime: "14:30",
      type: "unassigned" 
    },
    { 
      id: "#JOB-3992", 
      route: "Kaduna (NW) → Lagos (SW)", 
      status: "In Transit", 
      driver: "Kwame M.",
      truckNumber: "TRK-9005",
      truckHealth: "Good",
      collection: "Collection 1",
      type: "transit" 
    },
  ];

  const columns = [
    { label: "Job Number", key: "id", render: (val: string) => <span className="font-semibold text-primary">{val}</span> },
    { label: "Route", key: "route", render: (val: string) => <span className="text-[12px] font-medium text-neutral-500 italic pr-2">{val}</span> },
    {
      label: "Status",
      key: "status",
      render: (val: string, row: any) => (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-medium uppercase tracking-widest ${
            row.type === "transit"
              ? "bg-primary/10 text-primary"
              : row.type === "success"
              ? "bg-emerald-50 text-emerald-600"
              : row.type === "unassigned"
              ? "bg-rose-50 text-rose-500 border border-rose-100"
              : "bg-amber-50 text-amber-500"
          }`}
        >
          <span
            className={`w-1 h-1 rounded-full ${
                row.type === "transit" ? "bg-primary animate-pulse" : row.type === "success" ? "bg-emerald-500" : row.type === "unassigned" ? "bg-rose-500" : "bg-amber-500"
            }`}
          />
          {val}
        </span>
      ),
    },
    {
      label: "Action",
      key: "actions",
      align: "center" as const,
      render: (val: any, row: any) => (
        <div className="flex gap-2 justify-center">
          <button 
            onClick={() => {
                setSelectedJob(row);
                setIsDrawerOpen(true);
            }}
            className="px-4 py-1.5 flex items-center gap-2 rounded-lg bg-slate-900 text-white hover:bg-slate-800 transition-all text-[9px] font-semibold uppercase tracking-widest"
          >
            {row.type === 'unassigned' ? <Edit2 className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
            {row.type === 'unassigned' ? "Assign" : "View"}
          </button>
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
           
           <div className="flex items-center gap-3">
              <div className="hidden md:flex flex-col items-end mr-3">
                 <span className="text-[9px] font-medium text-neutral-400 uppercase tracking-widest">Last Update</span>
                 <span className="text-[10px] font-semibold text-slate-900">Today, 10:45 AM</span>
              </div>
              <div className="h-10 w-px bg-neutral-100" />
              <button className="w-10 h-10 flex items-center justify-center rounded-xl bg-white border border-neutral-100 text-neutral-400 hover:text-primary hover:border-primary/20 transition-all shadow-sm">
                 <Users className="w-5 h-5" />
              </button>
           </div>
        </div>

        {/* Dashboard Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {kpis.map((kpi, i) => (
             <div key={i} className="bg-white p-4 rounded-2xl border border-neutral-100 shadow-[0_2px_10px_-3px_rgba(0,0,0,0.05)] hover:shadow-md transition-all group">
                <div className="flex items-center justify-between mb-3">
                   <div className="p-2 rounded-xl bg-neutral-50 group-hover:bg-primary/5 transition-colors">
                      {kpi.icon}
                   </div>
                   <span className={`text-[9px] font-medium px-2 py-0.5 rounded-full ${
                      kpi.variant === 'danger' ? 'bg-rose-50 text-rose-500' : 
                      kpi.variant === 'success' ? 'bg-emerald-50 text-emerald-500' : 'bg-primary/10 text-primary'
                   }`}>
                      {kpi.trend}
                   </span>
                </div>
                <div className="text-lg font-semibold text-slate-900 mb-0.1">{kpi.value}</div>
                <div className="text-[10px] font-medium text-neutral-400 uppercase tracking-wider">{kpi.label}</div>
                <div className="text-[9px] text-neutral-400 mt-2 flex items-center gap-1.5 italic font-normal">
                   <div className="w-1 h-1 rounded-full bg-neutral-300" />
                   {kpi.subText}
                </div>
             </div>
          ))}
        </div>

        {/* Desktop Table View */}
        <div className="hidden md:block">
          <CommonTable 
            title="Current Assignments"
            icon="🚚"
            action={
              <div className="flex items-center gap-2">
                <div className="relative group">
                  <input 
                    type="text" 
                    placeholder="Find Job #..."
                    className="bg-white border border-neutral-200 rounded-lg px-4 py-1.5 text-[10px] font-medium outline-none focus:border-primary/40 transition-all w-48 shadow-inner placeholder:text-neutral-300"
                  />
                </div>
                <button className="p-2 bg-white border border-neutral-200 rounded-xl text-neutral-400 hover:text-primary transition-all shadow-sm">
                  <Users className="w-4 h-4" />
                </button>
              </div>
            }
            columns={columns} 
            data={operationsData} 
            onRowClick={(row) => {
              setSelectedJob(row);
              setIsDrawerOpen(true);
            }}
          />
        </div>

        {/* Mobile Card View */}
        <div className="md:hidden space-y-4">
          <div className="flex items-center justify-between px-1 mb-2">
            <h3 className="text-[13px] font-bold text-slate-900 uppercase tracking-wider">Current Jobs</h3>
            <span className="text-[10px] font-bold text-neutral-400">{operationsData.length} Total</span>
          </div>
          <div className="grid grid-cols-1 gap-4">
            {operationsData.map((job) => (
              <div 
                key={job.id} 
                className="bg-white rounded-3xl border border-neutral-100 shadow-sm overflow-hidden active:scale-[0.98] transition-all"
                onClick={() => {
                  setSelectedJob(job);
                  setIsDrawerOpen(true);
                }}
              >
                <div className="p-5 space-y-4">
                  {/* Card Header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                        <Truck className="w-4 h-4" />
                      </div>
                      <span className="text-[14px] font-bold text-slate-950">{job.id}</span>
                    </div>
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest ${
                        job.type === "transit"
                          ? "bg-primary/10 text-primary"
                          : job.type === "success"
                          ? "bg-emerald-50 text-emerald-600"
                          : job.type === "unassigned"
                          ? "bg-rose-50 text-rose-500"
                          : "bg-amber-50 text-amber-500"
                      }`}
                    >
                      {job.status}
                    </span>
                  </div>

                  {/* Vertical Route Layout */}
                  <div className="relative pl-6 space-y-4">
                    <div className="absolute left-[7px] top-1 bottom-1 w-0.5 bg-dashed border-l border-dashed border-neutral-200" />
                    <div className="relative flex items-center gap-3">
                      <div className="absolute left-[-22px] w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-white shadow-sm" />
                      <div className="text-[12px] font-medium text-neutral-600 italic">
                        {job.route.split(" → ")[0]}
                      </div>
                    </div>
                    <div className="relative flex items-center gap-3">
                      <div className="absolute left-[-22px] w-2.5 h-2.5 rounded-full bg-rose-500 border-2 border-white shadow-sm" />
                      <div className="text-[12px] font-medium text-neutral-600 italic">
                        {job.route.split(" → ")[1]}
                      </div>
                    </div>
                  </div>

                  {/* Metadata Row */}
                  {(job.driver || job.truckNumber) && (
                    <div className="flex items-center gap-4 pt-2">
                       {job.driver && (
                         <div className="flex items-center gap-1.5 text-[10px] font-bold text-neutral-400 uppercase tracking-tight">
                           <Users className="w-3 h-3" /> {job.driver}
                         </div>
                       )}
                       {job.truckNumber && (
                         <div className="flex items-center gap-1.5 text-[10px] font-bold text-neutral-400 uppercase tracking-tight">
                           <Truck className="w-3 h-3" /> {job.truckNumber}
                         </div>
                       )}
                    </div>
                  )}

                  {/* Action Button */}
                  <button 
                    className={`w-full py-4 rounded-2xl flex items-center justify-center gap-2 text-[11px] font-bold uppercase tracking-widest transition-all ${
                      job.type === 'unassigned' 
                        ? 'bg-primary text-white shadow-lg shadow-primary/20' 
                        : 'bg-slate-100 text-slate-600 active:bg-slate-200'
                    }`}
                  >
                    {job.type === 'unassigned' ? <Edit2 className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    {job.type === 'unassigned' ? "Assign Fleet" : "Job Details"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <OperationAssignmentDrawer
        isOpen={isDrawerOpen}
        onClose={() => {
            setIsDrawerOpen(false);
            setSelectedJob(null);
        }}
        job={selectedJob}
        onSubmit={(data) => {
            console.log("Assignment Updated:", data);
            setIsDrawerOpen(false);
            setSelectedJob(null);
        }}
      />
    </AdminLayout>
  );
}
