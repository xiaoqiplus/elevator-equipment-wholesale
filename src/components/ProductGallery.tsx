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
    <div className="w-full">
      <div className="mb-3 overflow-hidden rounded-lg border bg-slate-50">
        <div className="aspect-[4/3]">
          <img
            src={images[activeIndex]}
            alt={`${name} ${activeIndex + 1}`}
            className="h-full w-full object-cover cursor-pointer"
            onClick={() => setActiveIndex((activeIndex + 1) % images.length)}
          />
        </div>
      </div>
      {images.length > 1 && (
        <div className="flex flex-col gap-2">
          {images.map((img, i) => (
            <button
              key={i}
              onClick={() => setActiveIndex(i)}
              className={`h-14 w-full flex-shrink-0 overflow-hidden rounded border transition-all ${
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
