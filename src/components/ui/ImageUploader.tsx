"use client";

import { useRef, useState } from "react";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { storage } from "@/src/lib/firebase";

type UploadedImage = { url: string; path: string };

type Props = {
    value: string[];                    // current URLs (from RHF field)
    onChange: (urls: string[]) => void; // RHF field.onChange
    folder?: string;                    // storage folder e.g. "destinations"
    maxImages?: number;
};

export default function ImageUploader({
                                          value = [],
                                          onChange,
                                          folder = "destinations",
                                          maxImages = 10,
                                      }: Props) {
    const inputRef = useRef<HTMLInputElement>(null);
    const [uploading, setUploading] = useState<{ name: string; progress: number }[]>([]);
    const [error, setError] = useState<string | null>(null);

    async function handleFiles(files: FileList | null) {
        if (!files || files.length === 0) return;

        const remaining = maxImages - value.length;
        const toUpload  = Array.from(files).slice(0, remaining);

        if (toUpload.length === 0) {
            setError(`Maximum ${maxImages} images allowed.`);
            return;
        }

        setError(null);
        setUploading(toUpload.map(f => ({ name: f.name, progress: 0 })));

        const newUrls: string[] = [];

        await Promise.all(
            toUpload.map((file, idx) =>
                new Promise<void>((resolve, reject) => {
                    const path      = `${folder}/${Date.now()}_${file.name.replace(/\s+/g, "_")}`;
                    const storageRef = ref(storage, path);
                    const task      = uploadBytesResumable(storageRef, file);

                    task.on(
                        "state_changed",
                        snapshot => {
                            const pct = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
                            setUploading(prev => prev.map((u, i) => i === idx ? { ...u, progress: pct } : u));
                        },
                        err => {
                            setError("Upload failed: " + err.message);
                            reject(err);
                        },
                        async () => {
                            const url = await getDownloadURL(task.snapshot.ref);
                            newUrls.push(url);
                            resolve();
                        }
                    );
                })
            )
        );

        onChange([...value, ...newUrls]);
        setUploading([]);
    }

    function removeImage(i: number) {
        // Removes from the list — does NOT delete from Storage
        // (deletion should happen server-side on save to avoid orphaned files)
        onChange(value.filter((_, idx) => idx !== i));
    }

    function moveUp(i: number) {
        if (i === 0) return;
        const next = [...value];
        [next[i - 1], next[i]] = [next[i], next[i - 1]];
        onChange(next);
    }

    function moveDown(i: number) {
        if (i === value.length - 1) return;
        const next = [...value];
        [next[i], next[i + 1]] = [next[i + 1], next[i]];
        onChange(next);
    }

    const isDragging = useRef(false);

    function onDrop(e: React.DragEvent) {
        e.preventDefault();
        isDragging.current = false;
        handleFiles(e.dataTransfer.files);
    }

    return (
        <div className="flex flex-col gap-3">

            {/* Drop zone */}
            <div
                onDragOver={e => { e.preventDefault(); isDragging.current = true; }}
                onDragLeave={() => { isDragging.current = false; }}
                onDrop={onDrop}
                onClick={() => inputRef.current?.click()}
                className="border-2 border-dashed border-slate-200 rounded-xl p-6 text-center cursor-pointer
          hover:border-cyan-400 hover:bg-cyan-50/40 transition-colors group"
            >
                <div className="flex flex-col items-center gap-2">
                    <div className="w-10 h-10 rounded-full bg-slate-100 group-hover:bg-cyan-100 flex items-center justify-center transition-colors">
                        <svg className="w-5 h-5 text-slate-400 group-hover:text-cyan-500 transition-colors" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                            <polyline points="17 8 12 3 7 8"/>
                            <line x1="12" y1="3" x2="12" y2="15"/>
                        </svg>
                    </div>
                    <div>
                        <p className="text-sm font-medium text-slate-600 group-hover:text-cyan-600 transition-colors">
                            Click to upload or drag & drop
                        </p>
                        <p className="text-xs text-slate-400 mt-0.5">
                            JPG, PNG, WebP · max 10MB · up to {maxImages} images
                        </p>
                    </div>
                </div>
                <input
                    ref={inputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    multiple
                    className="hidden"
                    onChange={e => handleFiles(e.target.files)}
                />
            </div>

            {/* Error */}
            {error && (
                <p className="text-xs text-red-500">{error}</p>
            )}

            {/* Upload progress */}
            {uploading.length > 0 && (
                <div className="flex flex-col gap-2">
                    {uploading.map((u, i) => (
                        <div key={i} className="bg-slate-50 border border-slate-200 rounded-lg p-3">
                            <div className="flex items-center justify-between mb-1.5">
                                <span className="text-xs text-slate-600 truncate max-w-[200px]">{u.name}</span>
                                <span className="text-xs font-semibold text-cyan-600">{u.progress}%</span>
                            </div>
                            <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-gradient-to-r from-cyan-400 to-cyan-600 rounded-full transition-all duration-200"
                                    style={{ width: `${u.progress}%` }}
                                />
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Uploaded images grid */}
            {value.length > 0 && (
                <div className="grid grid-cols-3 gap-2">
                    {value.map((url, i) => (
                        <div key={url} className="group relative rounded-lg overflow-hidden border border-slate-200 aspect-video bg-slate-100">
                            <img src={url} alt={`Image ${i + 1}`} className="w-full h-full object-cover" />

                            {/* Cover label */}
                            {i === 0 && (
                                <div className="absolute top-1.5 left-1.5 bg-cyan-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
                                    Cover
                                </div>
                            )}

                            {/* Overlay actions */}
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5">
                                {/* Move up */}
                                <button
                                    type="button"
                                    onClick={e => { e.stopPropagation(); moveUp(i); }}
                                    disabled={i === 0}
                                    className="w-7 h-7 rounded-full bg-white/90 flex items-center justify-center text-slate-700 hover:bg-white disabled:opacity-30 transition-all"
                                    title="Move left (set as cover)"
                                >
                                    <svg className="w-3.5 h-3.5" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                        <path d="M9 2L4 7l5 5"/>
                                    </svg>
                                </button>
                                {/* Move down */}
                                <button
                                    type="button"
                                    onClick={e => { e.stopPropagation(); moveDown(i); }}
                                    disabled={i === value.length - 1}
                                    className="w-7 h-7 rounded-full bg-white/90 flex items-center justify-center text-slate-700 hover:bg-white disabled:opacity-30 transition-all"
                                    title="Move right"
                                >
                                    <svg className="w-3.5 h-3.5" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                        <path d="M5 2l5 5-5 5"/>
                                    </svg>
                                </button>
                                {/* Remove */}
                                <button
                                    type="button"
                                    onClick={e => { e.stopPropagation(); removeImage(i); }}
                                    className="w-7 h-7 rounded-full bg-red-500/90 flex items-center justify-center text-white hover:bg-red-500 transition-all"
                                    title="Remove"
                                >
                                    <svg className="w-3.5 h-3.5" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                                        <path d="M2 2l10 10M12 2L2 12"/>
                                    </svg>
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {value.length > 0 && (
                <p className="text-xs text-slate-400">
                    {value.length} image{value.length !== 1 ? "s" : ""} · Hover to reorder or remove · First image is the cover
                </p>
            )}
        </div>
    );
}