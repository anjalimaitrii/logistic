"use client";

import { useState, useEffect } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import CommonTable from "@/components/admin/CommonTable";
import {
  Package,
  Plus,
  Search,
  Trash2,
  ChevronRight,
  Info,
  ShieldCheck,
  Pencil,
  X
} from "lucide-react";
import { collectionService } from "@/services/collectionService";
import { motion, AnimatePresence } from "framer-motion";

export default function AdminCollectionPage() {
  const [items, setItems] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Form state
  const [formData, setFormData] = useState({ name: "", description: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadItems();
  }, []);

  const loadItems = async () => {
    try {
      setIsLoading(true);
      const data = await collectionService.getAll();
      setItems(data);
    } catch (error) {
      console.error("Failed to load collections:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.description) return;

    try {
      setIsSubmitting(true);
      if (editingItem) {
        await collectionService.update(editingItem._id, formData);
      } else {
        await collectionService.create(formData);
      }
      setFormData({ name: "", description: "" });
      setEditingItem(null);
      setIsDrawerOpen(false);
      loadItems();
    } catch (error) {
      console.error("Save error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEdit = (item: any) => {
    setEditingItem(item);
    setFormData({ name: item.name, description: item.description });
    setIsDrawerOpen(true);
  };

  const openAdd = () => {
    setEditingItem(null);
    setFormData({ name: "", description: "" });
    setIsDrawerOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this item?")) return;
    try {
      await collectionService.delete(id);
      loadItems();
    } catch (error) {
      console.error("Delete error:", error);
    }
  };

  const filteredItems = items.filter(item =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const columns = [
    {
      label: "Material Name",
      key: "name",
      render: (val: string) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary/5 flex items-center justify-center text-primary">
            <Package className="w-4 h-4" />
          </div>
          <span className="font-bold text-slate-900">{val}</span>
        </div>
      )
    },
    {
      label: "Description / Usage",
      key: "description",
      render: (val: string) => (
        <div className="flex items-start gap-2 max-w-md">
          <Info className="w-3.5 h-3.5 text-slate-300 mt-0.5 flex-shrink-0" />
          <span className="text-[11px] text-slate-500 leading-relaxed font-medium">{val}</span>
        </div>
      )
    },
    {
      label: "Added Date",
      key: "createdAt",
      render: (val: string) => (
        <span className="text-[11px] font-medium text-slate-400">
          {new Date(val).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
        </span>
      )
    },
    {
      label: "Actions",
      key: "actions",
      align: "center" as const,
      render: (_: any, row: any) => (
        <div className="flex items-center justify-center gap-1">
          <button
            onClick={() => openEdit(row)}
            className="p-2 text-blue-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
          >
            <Pencil className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleDelete(row._id)}
            className="p-2 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      )
    }
  ];

  return (
    <AdminLayout>
      <div className="p-6 pb-20 space-y-8 bg-neutral-50 min-h-screen font-sans">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-[10px] font-semibold text-neutral-400 uppercase tracking-[0.15em]">
              <span className="hover:text-primary cursor-pointer transition-colors">Resources</span>
              <ChevronRight className="w-3 h-3 text-neutral-300" />
              <span className="text-primary/80">Collection Management</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Safety & Packaging Materials</h1>
            <p className="text-[12px] text-neutral-400 font-medium italic">Manage items required for safe loading and transportation of goods.</p>
          </div>

          <button
            onClick={openAdd}
            className="bg-slate-900 text-white px-6 py-3 rounded-2xl font-bold text-[10px] uppercase tracking-[0.2em] shadow-xl shadow-slate-200 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-2 w-fit"
          >
            <Plus className="w-4 h-4" />
            Add Material
          </button>
        </div>

        {/* Table View */}
        <CommonTable
          title="Safety Materials List"
          icon="📦"
          isLoading={isLoading}
          columns={columns}
          data={filteredItems}
          action={
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-300" />
              <input
                type="text"
                placeholder="Search materials..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-white border border-neutral-100 rounded-xl px-9 py-2 text-[11px] font-medium outline-none focus:ring-2 focus:ring-primary/10 transition-all w-64 shadow-sm"
              />
            </div>
          }
        />

        {/* Add Item Drawer */}
        <AnimatePresence>
          {isDrawerOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsDrawerOpen(false)}
                className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[99]"
              />
              <motion.div
                initial={{ x: "100%" }}
                animate={{ x: 0 }}
                exit={{ x: "100%" }}
                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                className="fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl z-[100] flex flex-col"
              >
                <div className="p-6 border-b border-slate-50 flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">{editingItem ? "Edit Safety Material" : "Add Safety Material"}</h2>
                    <p className="text-[11px] text-slate-400 font-medium">{editingItem ? "Update item details." : "Create a new item for your resource collection."}</p>
                  </div>
                  <button
                    onClick={() => setIsDrawerOpen(false)}
                    className="p-2 hover:bg-slate-50 rounded-full transition-colors"
                  >
                    <X className="w-5 h-5 text-slate-400" />
                  </button>
                </div>

                <form onSubmit={handleSave} className="p-6 space-y-6 flex-1 overflow-y-auto">
                  <div className="space-y-4">
                    <div className="p-4 bg-primary/5 rounded-2xl flex items-center gap-3 border border-primary/10">
                      <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-sm text-primary">
                        <ShieldCheck className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-primary uppercase tracking-wider">Item Details</p>
                        <p className="text-[12px] font-medium text-slate-600">Ensure descriptions are clear for staff.</p>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Material Name</label>
                      <input
                        required
                        placeholder="e.g., Thermacol, Cardboard, Bubble Wrap"
                        value={formData.name}
                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-[13px] font-medium focus:bg-white focus:border-primary/20 transition-all outline-none"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Usage Description</label>
                      <textarea
                        required
                        rows={5}
                        placeholder="Describe when and how to use this material (e.g., Used for packing glass items to prevent breakage during transit)."
                        value={formData.description}
                        onChange={e => setFormData({ ...formData, description: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-[13px] font-medium focus:bg-white focus:border-primary/20 transition-all outline-none resize-none"
                      />
                    </div>
                  </div>

                  <div className="pt-6">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full bg-slate-900 text-white py-4 rounded-2xl font-bold text-[11px] uppercase tracking-[0.2em] shadow-lg shadow-slate-200 hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-2"
                    >
                      {isSubmitting ? "Saving..." : editingItem ? "Update Material" : "Save Material"}
                    </button>
                  </div>
                </form>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    </AdminLayout>
  );
}
