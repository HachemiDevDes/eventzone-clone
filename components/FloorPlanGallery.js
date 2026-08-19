"use client";

import React, { useState } from "react";
import {
  Map, Plus, Edit3, Copy, Archive, RotateCcw, Grid, LayoutGrid,
  Clock, Layers
} from "lucide-react";

// Thumbnail preview: mini SVG representation of element counts
function PlanThumbnail({ plan }) {
  const count = plan.elements?.length ?? 0;
  const hasBlueprint = !!plan.blueprint?.url;

  return (
    <div className="relative w-full h-36 rounded-xl overflow-hidden bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center border border-slate-200 group-hover:border-indigo-200 transition-colors duration-200">
      {hasBlueprint ? (
        // Blueprint image thumbnail
        /* eslint-disable-next-line @next/next/no-img-element */
        <img
          src={plan.blueprint.url}
          alt="Blueprint"
          className="absolute inset-0 w-full h-full object-cover opacity-30"
        />
      ) : (
        // Grid pattern background
        <div className="absolute inset-0 opacity-40 bg-[radial-gradient(#94a3b8_1px,transparent_1px)] [background-size:12px_12px]" />
      )}

      {/* Center badge */}
      <div className="relative z-10 flex flex-col items-center gap-1">
        <div className="w-9 h-9 rounded-xl bg-white/80 backdrop-blur-xs flex items-center justify-center shadow-xs border border-white/60">
          <Map size={18} className="text-indigo-600" />
        </div>
        <span className="text-[10px] font-bold text-slate-500 bg-white/70 backdrop-blur-xs px-2 py-0.5 rounded-full border border-white/60">
          {count} {count === 1 ? "element" : "elements"}
        </span>
      </div>
    </div>
  );
}

// Inline editable plan name
function EditableName({ name, onRename }) {
  const [isEditing, setIsEditing] = useState(false);
  const [value, setValue] = useState(name);

  const handleSubmit = () => {
    setIsEditing(false);
    const trimmed = value.trim();
    if (trimmed && trimmed !== name) {
      onRename(trimmed);
    } else {
      setValue(name);
    }
  };

  if (isEditing) {
    return (
      <input
        type="text"
        autoFocus
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={handleSubmit}
        onKeyDown={(e) => {
          if (e.key === "Enter") handleSubmit();
          if (e.key === "Escape") { setValue(name); setIsEditing(false); }
        }}
        className="text-sm font-bold text-slate-800 border-b-2 border-indigo-500 outline-none bg-transparent w-full py-0.5"
      />
    );
  }

  return (
    <h3
      className="text-sm font-bold text-slate-800 hover:text-indigo-650 cursor-pointer truncate transition-colors flex-1"
      onDoubleClick={() => setIsEditing(true)}
      title="Double-click to rename"
    >
      {name}
    </h3>
  );
}

// Format date nicely
function formatDate(isoString) {
  if (!isoString) return "Recently";
  const d = new Date(isoString);
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

// Single floor plan card
function PlanCard({ plan, onEdit, onDuplicate, onDelete, onArchive, onRestore, onRename }) {
  const [showArchiveConfirm, setShowArchiveConfirm] = useState(false);
  const isArchived = plan.isArchived || plan.status === "archived";

  return (
    <div className={`group bg-white border ${isArchived ? "border-slate-300 opacity-75" : "border-slate-200"} rounded-2xl overflow-hidden shadow-sm hover:shadow-md hover:border-indigo-200 transition-all duration-200 flex flex-col`}>
      {/* Thumbnail */}
      <div
        className="cursor-pointer"
        onClick={() => onEdit(plan.id)}
      >
        <PlanThumbnail plan={plan} />
      </div>

      {/* Card body */}
      <div className="p-4 flex flex-col gap-3 flex-1">
        <div className="flex items-start justify-between gap-2">
          <EditableName name={plan.name} onRename={(n) => onRename(plan.id, n)} />
          {isArchived && (
            <span className="text-[9px] uppercase font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
              Archived
            </span>
          )}
        </div>

        <div className="flex items-center gap-3 text-[10px] font-semibold text-slate-400">
          <span className="flex items-center gap-1">
            <Clock size={10} />
            {formatDate(plan.createdAt)}
          </span>
          <span className="flex items-center gap-1">
            <Layers size={10} />
            {plan.elements?.length ?? 0} items
          </span>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2 mt-auto pt-1">
          <button
            onClick={() => onEdit(plan.id)}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-indigo-650 hover:bg-indigo-700 text-white rounded-xl font-semibold text-xs transition-all duration-200 cursor-pointer shadow-sm hover:shadow"
          >
            <Edit3 size={13} />
            <span>Edit</span>
          </button>

          {!isArchived && (
            <button
              onClick={() => onDuplicate(plan.id)}
              className="p-2 border border-slate-200 hover:border-indigo-200 hover:text-indigo-650 rounded-xl text-slate-500 transition-all duration-200 cursor-pointer"
              title="Duplicate this floor plan"
            >
              <Copy size={14} />
            </button>
          )}

          {isArchived ? (
            <button
              onClick={() => onRestore && onRestore(plan.id)}
              className="p-2 border border-emerald-200 hover:bg-emerald-50 text-emerald-600 rounded-xl transition-all duration-200 cursor-pointer flex items-center gap-1 text-xs font-bold"
              title="Restore floor plan"
            >
              <RotateCcw size={14} />
            </button>
          ) : showArchiveConfirm ? (
            <div className="flex items-center gap-1">
              <button
                onClick={() => { 
                  if (onArchive) onArchive(plan.id);
                  else if (onDelete) onDelete(plan.id);
                  setShowArchiveConfirm(false); 
                }}
                className="p-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl transition-colors cursor-pointer"
                title="Confirm archive (data is preserved)"
              >
                <Archive size={14} />
              </button>
              <button
                onClick={() => setShowArchiveConfirm(false)}
                className="p-2 border border-slate-200 hover:border-slate-300 text-slate-400 rounded-xl transition-colors cursor-pointer text-[10px] font-bold"
              >
                ✕
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowArchiveConfirm(true)}
              className="p-2 border border-slate-200 hover:border-amber-200 hover:text-amber-600 rounded-xl text-slate-500 transition-all duration-200 cursor-pointer"
              title="Archive this floor plan"
            >
              <Archive size={14} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function FloorPlanGallery({
  floorPlans = [],
  onEdit,
  onCreateNew,
  onDuplicate,
  onDelete,
  onArchive,
  onRestore,
  onRename,
}) {
  const [filter, setFilter] = useState("active"); // "active" | "archived" | "all"

  const activePlans = floorPlans.filter(p => !p.isArchived && p.status !== "archived");
  const archivedPlans = floorPlans.filter(p => p.isArchived || p.status === "archived");

  const displayedPlans = filter === "active" ? activePlans : filter === "archived" ? archivedPlans : floorPlans;

  return (
    <div className="flex flex-col gap-8 w-full">
      {/* Page header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex flex-col gap-1">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Floor Plans</h1>
            <p className="text-sm text-slate-500">
              {activePlans.length === 0
                ? "No active floor plans — create your first one below"
                : `${activePlans.length} active plan${activePlans.length !== 1 ? "s" : ""} · Double-click a name to rename`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setFilter("active")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                filter === "active" ? "bg-white text-slate-900 shadow-xs" : "text-slate-500 hover:text-slate-800"
              }`}
            >
              Active ({activePlans.length})
            </button>
            <button
              onClick={() => setFilter("archived")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                filter === "archived" ? "bg-slate-700 text-white shadow-xs" : "text-slate-500 hover:text-slate-800"
              }`}
            >
              Archived ({archivedPlans.length})
            </button>
          </div>

          <button
            onClick={() => onCreateNew && onCreateNew()}
            className="px-5 py-2.5 bg-indigo-650 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs transition-all duration-200 shadow-sm hover:shadow-md hover:-translate-y-0.5 cursor-pointer"
          >
            New Floor Plan
          </button>
        </div>
      </div>

      {/* Empty state */}
      {displayedPlans.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 bg-white border-2 border-dashed border-slate-200 rounded-3xl gap-6">
          <div className="w-20 h-20 bg-indigo-50 rounded-3xl flex items-center justify-center">
            <LayoutGrid size={36} className="text-indigo-400" />
          </div>
          <div className="flex flex-col items-center gap-2 text-center">
            <h2 className="text-lg font-bold text-slate-700">
              {filter === "archived" ? "No archived floor plans" : "No floor plans yet"}
            </h2>
            <p className="text-xs font-semibold text-slate-400 max-w-xs">
              {filter === "archived" ? "Archived floor plans will appear here." : "Create your first venue floor plan to start designing your event layout with booths, stages, and more."}
            </p>
          </div>
          {filter !== "archived" && (
            <button
              onClick={() => onCreateNew && onCreateNew()}
              className="flex items-center gap-2 px-6 py-3 bg-indigo-650 hover:bg-indigo-700 text-white rounded-xl font-bold text-sm transition-all duration-200 shadow-sm hover:shadow-md hover:-translate-y-0.5 cursor-pointer"
            >
              <Plus size={16} />
              <span>Create First Floor Plan</span>
            </button>
          )}
        </div>
      )}

      {/* Plans grid */}
      {displayedPlans.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {displayedPlans.map((plan) => (
            <PlanCard
              key={plan.id}
              plan={plan}
              onEdit={onEdit}
              onDuplicate={onDuplicate}
              onDelete={onDelete}
              onArchive={onArchive || onDelete}
              onRestore={onRestore}
              onRename={onRename}
            />
          ))}

          {/* Quick-add card */}
          {filter !== "archived" && (
            <button
              onClick={() => onCreateNew && onCreateNew()}
              className="min-h-[220px] border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center gap-3 text-slate-400 hover:text-indigo-500 hover:border-indigo-300 hover:bg-indigo-50/30 transition-all duration-200 cursor-pointer group"
            >
              <div className="w-10 h-10 rounded-xl bg-slate-100 group-hover:bg-indigo-100 group-hover:text-indigo-600 flex items-center justify-center transition-colors">
                <Plus size={20} />
              </div>
              <span className="text-xs font-bold">Add Another Plan</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}
