"use client";

interface Column {
  label: string;
  key: string;
  render?: (value: any, row: any) => React.ReactNode;
  align?: "left" | "center" | "right";
}

interface CommonTableProps {
  columns: Column[];
  data: any[];
  onRowClick?: (row: any) => void;
  title?: string;
  icon?: string;
  action?: React.ReactNode;
}

export default function CommonTable({ columns, data, onRowClick, title, icon, action }: CommonTableProps) {
  return (
    <div className="bg-white border border-neutral-100 rounded-2xl overflow-hidden shadow-sm">
      {(title || icon || action) && (
        <div className="p-4 border-b border-neutral-100 flex items-center justify-between bg-neutral-50/10">
          <div className="text-[13px] font-semibold text-slate-900 flex items-center gap-2.5">
            {icon && (
              <span className="w-7 h-7 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600 text-xs">
                {icon}
              </span>
            )}
            {title}
          </div>
          {action}
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[600px]">
          <thead className="bg-neutral-50/50 text-[9px] text-neutral-400 uppercase tracking-[0.08em] font-medium">
            <tr>
              {columns.map((col) => (
                <th key={col.key} className={`px-5 py-2.5 ${col.align === "center" ? "text-center" : col.align === "right" ? "text-right" : ""}`}>
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100 text-[11.5px] font-medium text-slate-600">
            {data.length > 0 ? (
              data.map((row, i) => (
                <tr
                  key={i}
                  className={`hover:bg-neutral-50/40 transition-colors group ${onRowClick ? "cursor-pointer" : ""}`}
                  onClick={() => onRowClick && onRowClick(row)}
                >
                  {columns.map((col) => (
                    <td key={col.key} className={`px-5 py-3.5 ${col.align === "center" ? "text-center" : col.align === "right" ? "text-right" : ""}`}>
                      {col.render ? col.render(row[col.key], row) : row[col.key]}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={columns.length} className="px-5 py-10 text-center text-neutral-400 font-medium">
                  No data available
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
