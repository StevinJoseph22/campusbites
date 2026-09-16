"use client";

import React, { useState, useRef } from "react";
import { UploadCloud, Image as ImageIcon, X, Link as LinkIcon, Check } from "lucide-react";

interface ImageDropzoneProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  aspectRatio?: "square" | "wide";
  placeholder?: string;
}

export function ImageDropzone({
  value,
  onChange,
  label = "Upload Image",
  aspectRatio = "wide",
  placeholder = "Drag & drop image here or click to browse"
}: ImageDropzoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [mode, setMode] = useState<"upload" | "url">(value && value.startsWith("http") ? "url" : "upload");
  const [urlInput, setUrlInput] = useState(value || "");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileProcess = (file: File) => {
    if (!file.type.startsWith("image/")) {
      alert("Please upload an image file (PNG, JPG, JPEG, WEBP).");
      return;
    }

    // Limit to 5MB
    if (file.size > 5 * 1024 * 1024) {
      alert("File size exceeds 5MB. Please choose a smaller image.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      if (dataUrl) {
        // Optional: Compress large base64 images via canvas
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement("canvas");
          const MAX_WIDTH = 800;
          const MAX_HEIGHT = 800;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            const compressed = canvas.toDataURL("image/jpeg", 0.85);
            onChange(compressed);
            setUrlInput(compressed);
          } else {
            onChange(dataUrl);
            setUrlInput(dataUrl);
          }
        };
        img.src = dataUrl;
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileProcess(file);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileProcess(file);
    }
  };

  const handleUrlSubmit = () => {
    if (urlInput.trim()) {
      onChange(urlInput.trim());
    }
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange("");
    setUrlInput("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-1.5 text-xs">
      <div className="flex items-center justify-between">
        <label className="font-bold text-slate-300 flex items-center gap-1.5">
          <ImageIcon className="w-3.5 h-3.5 text-orange-400" />
          <span>{label}</span>
        </label>
        <div className="flex items-center gap-1 text-[10px]">
          <button
            type="button"
            onClick={() => setMode("upload")}
            className={`px-2 py-0.5 rounded transition-colors ${
              mode === "upload"
                ? "bg-orange-500/20 text-orange-400 font-bold border border-orange-500/40"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Drag & Drop File
          </button>
          <button
            type="button"
            onClick={() => setMode("url")}
            className={`px-2 py-0.5 rounded transition-colors ${
              mode === "url"
                ? "bg-orange-500/20 text-orange-400 font-bold border border-orange-500/40"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Paste URL
          </button>
        </div>
      </div>

      {mode === "upload" ? (
        <div
          onClick={() => fileInputRef.current?.click()}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`relative border-2 border-dashed rounded-2xl p-3 flex flex-col items-center justify-center cursor-pointer transition-all duration-200 overflow-hidden ${
            isDragging
              ? "border-orange-500 bg-orange-500/10 scale-[1.01]"
              : "border-slate-750 bg-slate-950/60 hover:border-slate-600 hover:bg-slate-900/60"
          } ${aspectRatio === "square" ? "h-36" : "h-32"}`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png, image/jpeg, image/jpg, image/webp"
            onChange={handleFileChange}
            className="hidden"
          />

          {value ? (
            <div className="relative w-full h-full group flex items-center justify-center">
              <img
                src={value}
                alt="Uploaded preview"
                className={`w-full h-full object-cover rounded-xl border border-slate-700 ${
                  aspectRatio === "square" ? "aspect-square" : ""
                }`}
              />
              <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity rounded-xl flex items-center justify-center gap-2">
                <span className="text-[11px] font-bold text-white bg-slate-800/80 px-2.5 py-1 rounded-lg border border-slate-600">
                  Change Image
                </span>
                <button
                  type="button"
                  onClick={handleClear}
                  className="p-1.5 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500 hover:text-white border border-red-500/40 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center text-center space-y-1.5 p-2">
              <div className="w-9 h-9 rounded-xl bg-orange-500/10 border border-orange-500/30 flex items-center justify-center text-orange-400">
                <UploadCloud className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-200">{placeholder}</p>
                <p className="text-[10px] text-slate-400">PNG, JPG, WEBP up to 5MB</p>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <LinkIcon className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-3" />
              <input
                type="text"
                value={urlInput}
                onChange={(e) => {
                  setUrlInput(e.target.value);
                  onChange(e.target.value.trim());
                }}
                placeholder="https://images.unsplash.com/..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500 font-mono"
              />
            </div>
            {value && (
              <button
                type="button"
                onClick={handleClear}
                className="p-2 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white border border-red-500/30"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          {value && (
            <div className="flex items-center gap-2 bg-slate-950/60 p-2 rounded-xl border border-slate-800">
              <img
                src={value}
                alt="URL Preview"
                className="w-10 h-10 rounded-lg object-cover border border-slate-700"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = "none";
                }}
              />
              <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1 truncate">
                <Check className="w-3 h-3" /> Live URL preview loaded
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
