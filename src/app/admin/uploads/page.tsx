"use client";

import { useState, useRef } from "react";

export default function AdminUpload() {
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<string[]>([]);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    const files = inputRef.current?.files;
    if (!files || files.length === 0) {
      setError("请选择文件");
      return;
    }
    setUploading(true);
    setError("");
    const urls: string[] = [];

    for (const file of Array.from(files)) {
      const formData = new FormData();
      formData.append("file", file);
      try {
        const res = await fetch("/api/admin/upload", { method: "POST", body: formData });
        if (res.ok) {
          const data = await res.json();
          urls.push(data.url);
        } else {
          setError(`上传失败: ${file.name}`);
        }
      } catch {
        setError(`上传错误: ${file.name}`);
      }
    }

    setResult(urls);
    setUploading(false);
  };

  return (
    <div>
      <h1 className="text-lg font-semibold text-slate-800 mb-6">📤 上传图片</h1>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 max-w-lg">
        <form onSubmit={handleUpload} className="space-y-4">
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            multiple
            className="w-full text-sm file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200"
          />
          <button
            type="submit"
            disabled={uploading}
            className="px-4 py-2 text-sm font-medium text-white bg-slate-800 rounded-lg hover:bg-slate-700 transition-colors disabled:opacity-50"
          >
            {uploading ? "⏳ 上传中..." : "上传"}
          </button>
        </form>

        {error && <p className="mt-3 text-xs text-red-500">{error}</p>}

        {result.length > 0 && (
          <div className="mt-4 space-y-2">
            <p className="text-xs font-medium text-slate-600">上传成功：</p>
            {result.map((url, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <code className="text-xs bg-slate-50 px-2 py-1 rounded border flex-1 truncate">{url}</code>
                <button
                  onClick={() => navigator.clipboard.writeText(url)}
                  className="text-xs text-primary-600 hover:text-primary-700 shrink-0"
                >
                  复制
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
