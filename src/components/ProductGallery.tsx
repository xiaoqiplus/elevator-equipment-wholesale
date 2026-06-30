"use client";

import { useState } from "react";

interface Props {
  images: string[];
  name: string;
}

export default function ProductGallery({ images, name }: Props) {
  const [activeIndex, setActiveIndex] = useState(0);

  if (!images || images.length === 0) {
    return (
      <div className="flex aspect-square items-center justify-center rounded-lg border bg-slate-100 text-6xl text-slate-300">
        🔧
      </div>
    );
  }

  return (
    <div>
      {/* Main image */}
      <div className="mb-4 overflow-hidden rounded-lg border bg-slate-50">
        <img
          src={images[activeIndex]}
          alt={`${name} ${activeIndex + 1}`}
          className="h-full w-full object-cover cursor-pointer"
          onClick={() => {
            const next = (activeIndex + 1) % images.length;
            setActiveIndex(next);
          }}
        />
      </div>

      {/* Thumbnails */}
      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto">
          {images.map((img, i) => (
            <button
              key={i}
              onClick={() => setActiveIndex(i)}
              className={`h-16 w-16 flex-shrink-0 overflow-hidden rounded border transition-all ${
                i === activeIndex
                  ? "border-slate-800 ring-1 ring-slate-800"
                  : "border-slate-200 opacity-60 hover:opacity-100"
              }`}
            >
              <img src={img} alt={`${name} ${i + 1}`} className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
