"use client";

import React, { useState, useRef } from "react";
import { Camera, Upload, Trash2, CheckCircle2, Image as ImageIcon, Smartphone } from "lucide-react";

export default function FormImageUploader({
  value = "",
  onChange,
  required = false,
  disabled = false,
  label = "Upload Picture",
  placeholder = "Upload your photo from phone or computer",
  className = ""
}) {
  const fileInputRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFile = (file) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      alert("Please upload a valid image file (JPG, PNG, WebP).");
      return;
    }

    // Limit to 5MB
    if (file.size > 5 * 1024 * 1024) {
      alert("Image size must be less than 5MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target.result;
      if (onChange) onChange(dataUrl);
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (disabled) return;
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  return (
    <div className={`space-y-2 ${className}`}>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        disabled={disabled}
        onChange={(e) => {
          if (e.target.files && e.target.files[0]) {
            handleFile(e.target.files[0]);
          }
        }}
        className="hidden"
      />

      {value ? (
        <div className="flex items-center gap-3.5 p-3 bg-slate-50 border border-slate-200 rounded-2xl">
          <div className="relative w-14 h-14 rounded-xl overflow-hidden bg-slate-200 shrink-0 border border-slate-300/80 shadow-2xs">
            <img src={value} alt="Preview" className="w-full h-full object-cover" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
              <CheckCircle2 size={13} className="text-emerald-600" />
              <span>Photo Attached</span>
            </div>
            <p className="text-[11px] text-slate-400 truncate mt-0.5">Ready for form submission</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={disabled}
              onClick={() => fileInputRef.current?.click()}
              className="px-2.5 py-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
            >
              Change
            </button>
            <button
              type="button"
              disabled={disabled}
              onClick={() => onChange && onChange("")}
              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
              title="Remove photo"
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>
      ) : (
        <div
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => !disabled && fileInputRef.current?.click()}
          className={`flex flex-col items-center justify-center p-4 border-2 border-dashed rounded-2xl cursor-pointer transition-all ${
            isDragging
              ? "border-blue-500 bg-blue-50/50"
              : "border-slate-200 hover:border-blue-400 bg-slate-50/60 hover:bg-white"
          }`}
        >
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-blue-50 text-blue-600 mb-2">
            <Camera size={18} />
          </div>
          <p className="text-xs font-bold text-slate-700 text-center">
            {placeholder || "Take a photo or browse from computer"}
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5 text-center flex items-center gap-1.5">
            <Smartphone size={11} className="text-slate-400" />
            <span>Mobile camera & Desktop file upload supported (JPG, PNG, Max 5MB)</span>
          </p>
        </div>
      )}
    </div>
  );
}
