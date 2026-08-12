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

  const total = images.length;
  const prev = () => setActiveIndex((activeIndex - 1 + total) % total);
  const next = () => setActiveIndex((activeIndex + 1) % total);

  return (
    <div className="w-full">
      {/* 大图 + 左右箭头 */}
      <div className="relative mb-3 overflow-hidden rounded-lg border bg-slate-50">
        <div className="aspect-[4/3]">
          <img
            src={images[activeIndex]}
            alt={`${name} ${activeIndex + 1}`}
            className="h-full w-full object-cover"
          />
        </div>

        {/* 左箭头 */}
        {total > 1 && (
          <button
            type="button"
            onClick={prev}
            aria-label="上一张"
            className="absolute left-2 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full bg-white/80 text-slate-700 shadow-md hover:bg-white transition-colors"
          >
            ←
          </button>
        )}

        {/* 右箭头 */}
        {total > 1 && (
          <button
            type="button"
            onClick={next}
            aria-label="下一张"
            className="absolute right-2 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full bg-white/80 text-slate-700 shadow-md hover:bg-white transition-colors"
          >
            →
          </button>
        )}

        {/* 图片计数器 */}
        {total > 1 && (
          <span className="absolute bottom-2 right-2 rounded bg-black/50 px-2 py-0.5 text-xs text-white">
            {activeIndex + 1} / {total}
          </span>
        )}
      </div>

      {/* 底部小圆点指示器（可选，替代缩略图） */}
      {total > 1 && (
        <div className="flex justify-center gap-1.5">
          {images.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setActiveIndex(i)}
              aria-label={`第${i + 1}张`}
              className={`h-2 rounded-full transition-all ${
                i === activeIndex ? "w-5 bg-slate-800" : "w-2 bg-slate-300 hover:bg-slate-400"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
