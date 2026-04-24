// src/app/community/CommunityClient.tsx
"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import { toast } from "sonner";

// ── Types ─────────────────────────────────────────────────────────────────────
type PostType = "question" | "story" | "tip" | "route" | "discussion";
type Post = {
    id: string; type: PostType; title: string; body: string;
    authorId: string; authorName: string; authorPhotoURL?: string;
    region?: string; tags?: string[]; isPinned?: boolean;
    likeCount: number; commentCount: number;
    createdAt: string; updatedAt?: string;
};

type Comment = {
    id: string; body: string;
    authorId: string; authorName: string; authorPhotoURL?: string;
    likeCount: number; createdAt: string;
};

type CurrentUser = { uid: string; name?: string; displayName?: string; photoURL?: string; email?: string } | null;

// ── Constants ─────────────────────────────────────────────────────────────────
const POST_TYPES: { key: PostType; label: string; icon: string; color: string; bg: string }[] = [
    { key: "question",   label: "Question",    icon: "❓", color: "#7C3AED", bg: "#EDE9FE" },
    { key: "story",      label: "Trip story",  icon: "✈️", color: "#0A6A94", bg: "#EBF8FF" },
    { key: "tip",        label: "Tip",         icon: "💡", color: "#D97706", bg: "#FEF3C7" },
    { key: "route",      label: "Route",       icon: "🗺", color: "#10B981", bg: "#D1FAE5" },
    { key: "discussion", label: "Discussion",  icon: "💬", color: "#64748B", bg: "#F1F5F9" },
];

const REGIONS = [
    "All regions", "Amhara", "Tigray", "Oromia", "Afar",
    "Southern Nations", "Addis Ababa", "Dire Dawa", "Somali",
];

const TABS = [
    { key: "all",        label: "All posts"  },
    { key: "question",   label: "Questions"  },
    { key: "story",      label: "Stories"    },
    { key: "tip",        label: "Tips"       },
    { key: "route",      label: "Routes"     },
    { key: "discussion", label: "Discussion" },
];

// ── Helpers ───────────────────────────────────────────────────────────────────
function typeConfig(type: PostType) {
    return POST_TYPES.find(t => t.key === type) ?? POST_TYPES[4];
}

function timeAgo(iso: string) {
    const diff = Date.now() - new Date(iso).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 1)  return "just now";
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    const d = Math.floor(h / 24);
    if (d < 30) return `${d}d ago`;
    return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function Avatar({ name, photoURL, size = 36 }: { name: string; photoURL?: string; size?: number }) {
    const initials = (name || "?").split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
    if (photoURL) return <img src={photoURL} alt={name} style={{ width:size, height:size, borderRadius:"50%", objectFit:"cover", flexShrink:0 }}/>;
    return (
        <div style={{ width:size, height:size, borderRadius:"50%", background:"linear-gradient(135deg,#28B8E8,#0A6A94)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:size*0.32, fontWeight:700, color:"#fff", flexShrink:0 }}>
            {initials}
        </div>
    );
}

function useReveal() {
    const ref = useRef<HTMLDivElement>(null);
    const [v, setV] = useState(false);
    useEffect(() => {
        const el = ref.current; if (!el) return;
        const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setV(true); obs.disconnect(); } }, { threshold: 0.05 });
        obs.observe(el); return () => obs.disconnect();
    }, []);
    return { ref, visible: v };
}

// ── COMPOSE MODAL ─────────────────────────────────────────────────────────────
function ComposeModal({ currentUser, onClose, onPost }: {
    currentUser: CurrentUser; onClose: () => void; onPost: (post: Post) => void;
}) {
    const [type,    setType]    = useState<PostType>("question");
    const [title,   setTitle]   = useState("");
    const [body,    setBody]    = useState("");
    const [region,  setRegion]  = useState("");
    const [tags,    setTags]    = useState("");
    const [posting, setPosting] = useState(false);

    useEffect(() => {
        document.body.style.overflow = "hidden";
        return () => { document.body.style.overflow = ""; };
    }, []);

    const tc = typeConfig(type);
    const authorName = currentUser?.displayName ?? currentUser?.name ?? "Traveler";

    async function submit() {
        if (!title.trim()) { toast.error("Please add a title"); return; }
        if (!body.trim())  { toast.error("Please add some content"); return; }
        setPosting(true);
        try {
            const res = await fetch("/api/community/posts", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    type, title: title.trim(), body: body.trim(),
                    region: region || undefined,
                    tags: tags.split(",").map(t => t.trim()).filter(Boolean),
                }),
            });
            const json = await res.json();
            if (!res.ok) throw new Error(json.error ?? "Failed");
            onPost(json.post);
            toast.success("Post published!");
            onClose();
        } catch (err: any) {
            toast.error(err.message ?? "Failed to post");
        } finally {
            setPosting(false);
        }
    }

    return (
        <div style={{ position:"fixed", inset:0, zIndex:500, display:"flex", alignItems:"center", justifyContent:"center", padding:"1rem" }}
             onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
            <div style={{ position:"absolute", inset:0, background:"rgba(10,61,82,0.55)", backdropFilter:"blur(6px)" }}/>
            <div style={{ position:"relative", width:"100%", maxWidth:580, maxHeight:"90vh", overflowY:"auto", background:"#fff", borderRadius:20, boxShadow:"0 32px 80px rgba(14,133,178,0.22)", animation:"modal-pop 0.25s cubic-bezier(0.22,1,0.36,1) both" }}>

                {/* Header */}
                <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"1.25rem 1.5rem", borderBottom:"1px solid rgba(14,133,178,0.08)" }}>
                    <div style={{ display:"flex", alignItems:"center", gap:"0.65rem" }}>
                        <Avatar name={authorName} photoURL={currentUser?.photoURL} size={36}/>
                        <div>
                            <p style={{ fontSize:"0.83rem", fontWeight:700, color:"#0A3D52" }}>{authorName}</p>
                            <p style={{ fontSize:"0.68rem", color:"#1A6A8A" }}>Creating a post</p>
                        </div>
                    </div>
                    <button onClick={onClose} style={{ background:"rgba(14,133,178,0.08)", border:"none", borderRadius:8, width:32, height:32, display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer" }}>
                        <svg width="13" height="13" viewBox="0 0 14 14" fill="none" stroke="#1A6A8A" strokeWidth="2" strokeLinecap="round"><path d="M2 2l10 10M12 2L2 12"/></svg>
                    </button>
                </div>

                <div style={{ padding:"1.25rem 1.5rem", display:"flex", flexDirection:"column", gap:"1rem" }}>

                    {/* Post type selector */}
                    <div>
                        <p style={{ fontSize:"0.72rem", fontWeight:700, letterSpacing:"0.1em", textTransform:"uppercase", color:"#1A6A8A", marginBottom:"0.5rem" }}>Post type</p>
                        <div style={{ display:"flex", gap:"0.4rem", flexWrap:"wrap" }}>
                            {POST_TYPES.map(t => (
                                <button key={t.key} onClick={() => setType(t.key)}
                                        style={{ display:"flex", alignItems:"center", gap:"0.35rem", padding:"0.35rem 0.75rem", borderRadius:20, border:`1.5px solid ${type === t.key ? t.color : "rgba(14,133,178,0.14)"}`, background: type === t.key ? t.bg : "white", color: type === t.key ? t.color : "#1A6A8A", fontSize:"0.78rem", fontWeight: type === t.key ? 700 : 400, cursor:"pointer", transition:"all 0.15s" }}>
                                    {t.icon} {t.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Title */}
                    <div>
                        <label style={{ fontSize:"0.72rem", fontWeight:700, letterSpacing:"0.1em", textTransform:"uppercase", color:"#1A6A8A", display:"block", marginBottom:"0.4rem" }}>Title *</label>
                        <input value={title} onChange={e => setTitle(e.target.value)} maxLength={120}
                               placeholder={type === "question" ? "What do you want to know?" : type === "story" ? "Tell us about your trip…" : type === "tip" ? "Share your tip…" : type === "route" ? "Describe your route…" : "What's on your mind?"}
                               style={{ width:"100%", borderRadius:12, border:"1.5px solid rgba(14,133,178,0.18)", padding:"0.75rem 1rem", fontSize:"0.9rem", color:"#0A3D52", outline:"none", boxSizing:"border-box", fontFamily:"inherit", transition:"border-color 0.15s" }}
                               onFocus={e => (e.target.style.borderColor = "#1E9DC8")}
                               onBlur={e  => (e.target.style.borderColor = "rgba(14,133,178,0.18)")}
                        />
                        <p style={{ fontSize:"0.65rem", color:"#1A6A8A", marginTop:"0.25rem", textAlign:"right" }}>{title.length}/120</p>
                    </div>

                    {/* Body */}
                    <div>
                        <label style={{ fontSize:"0.72rem", fontWeight:700, letterSpacing:"0.1em", textTransform:"uppercase", color:"#1A6A8A", display:"block", marginBottom:"0.4rem" }}>Content *</label>
                        <textarea value={body} onChange={e => setBody(e.target.value)} rows={5} maxLength={2000}
                                  placeholder="Share more details, context, or your full story…"
                                  style={{ width:"100%", borderRadius:12, border:"1.5px solid rgba(14,133,178,0.18)", padding:"0.75rem 1rem", fontSize:"0.87rem", color:"#0A3D52", outline:"none", resize:"vertical", minHeight:120, boxSizing:"border-box", fontFamily:"inherit", lineHeight:1.6, transition:"border-color 0.15s" }}
                                  onFocus={e => (e.target.style.borderColor = "#1E9DC8")}
                                  onBlur={e  => (e.target.style.borderColor = "rgba(14,133,178,0.18)")}
                        />
                    </div>

                    {/* Region + tags row */}
                    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"0.75rem" }}>
                        <div>
                            <label style={{ fontSize:"0.72rem", fontWeight:700, letterSpacing:"0.1em", textTransform:"uppercase", color:"#1A6A8A", display:"block", marginBottom:"0.4rem" }}>Region <span style={{ fontWeight:400, opacity:0.6 }}>(optional)</span></label>
                            <select value={region} onChange={e => setRegion(e.target.value)}
                                    style={{ width:"100%", borderRadius:12, border:"1.5px solid rgba(14,133,178,0.18)", padding:"0.65rem 0.85rem", fontSize:"0.83rem", color:region?"#0A3D52":"#1A6A8A", outline:"none", background:"white", boxSizing:"border-box", fontFamily:"inherit" }}>
                                <option value="">Select region…</option>
                                {REGIONS.slice(1).map(r => <option key={r} value={r}>{r}</option>)}
                            </select>
                        </div>
                        <div>
                            <label style={{ fontSize:"0.72rem", fontWeight:700, letterSpacing:"0.1em", textTransform:"uppercase", color:"#1A6A8A", display:"block", marginBottom:"0.4rem" }}>Tags <span style={{ fontWeight:400, opacity:0.6 }}>(comma separated)</span></label>
                            <input value={tags} onChange={e => setTags(e.target.value)} placeholder="lalibela, hiking, food…"
                                   style={{ width:"100%", borderRadius:12, border:"1.5px solid rgba(14,133,178,0.18)", padding:"0.65rem 0.85rem", fontSize:"0.83rem", color:"#0A3D52", outline:"none", boxSizing:"border-box", fontFamily:"inherit", transition:"border-color 0.15s" }}
                                   onFocus={e => (e.target.style.borderColor = "#1E9DC8")}
                                   onBlur={e  => (e.target.style.borderColor = "rgba(14,133,178,0.18)")}
                            />
                        </div>
                    </div>

                    {/* Submit */}
                    <button onClick={submit} disabled={posting || !title.trim() || !body.trim()}
                            style={{ width:"100%", padding:"0.9rem", borderRadius:12, border:"none", background: posting || !title.trim() || !body.trim() ? "rgba(14,133,178,0.15)" : "linear-gradient(135deg,#28B8E8,#0A6A94)", color: posting || !title.trim() || !body.trim() ? "#1A6A8A" : "#fff", fontSize:"0.9rem", fontWeight:700, cursor: posting ? "wait" : !title.trim() || !body.trim() ? "not-allowed" : "pointer", transition:"all 0.2s", boxShadow: posting || !title.trim() || !body.trim() ? "none" : "0 4px 16px rgba(14,133,178,0.32)" }}>
                        {posting ? (
                            <span style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:"0.5rem" }}>
                <div style={{ width:14, height:14, borderRadius:"50%", border:"2px solid rgba(255,255,255,0.3)", borderTop:"2px solid white", animation:"spin 0.7s linear infinite" }}/>
                Publishing…
              </span>
                        ) : `Publish ${typeConfig(type).icon} ${typeConfig(type).label}`}
                    </button>
                </div>
            </div>
        </div>
    );
}

// ── COMMENTS PANEL ────────────────────────────────────────────────────────────
function CommentsPanel({ post, currentUser, onClose }: {
    post: Post; currentUser: CurrentUser; onClose: () => void;
}) {
    const [comments,   setComments]   = useState<Comment[]>([]);
    const [loading,    setLoading]    = useState(true);
    const [body,       setBody]       = useState("");
    const [submitting, setSubmitting] = useState(false);
    const textRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        document.body.style.overflow = "hidden";
        fetch(`/api/community/posts/${post.id}/comments`)
            .then(r => r.json())
            .then(d => { setComments(d.comments ?? []); setLoading(false); })
            .catch(() => setLoading(false));
        return () => { document.body.style.overflow = ""; };
    }, [post.id]);

    async function submitComment() {
        if (!body.trim()) return;
        if (!currentUser) { toast.error("Sign in to comment"); return; }
        setSubmitting(true);
        try {
            const res = await fetch(`/api/community/posts/${post.id}/comments`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ body: body.trim() }),
            });
            const json = await res.json();
            if (!res.ok) throw new Error(json.error ?? "Failed");
            setComments(c => [...c, json.comment]);
            setBody("");
        } catch (err: any) {
            toast.error(err.message ?? "Failed");
        } finally {
            setSubmitting(false);
        }
    }

    const tc = typeConfig(post.type);

    return (
        <div style={{ position:"fixed", inset:0, zIndex:500, display:"flex", alignItems:"flex-end", justifyContent:"flex-end" }}
             onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
            <div style={{ position:"absolute", inset:0, background:"rgba(10,61,82,0.45)", backdropFilter:"blur(4px)" }} onClick={onClose}/>
            <div style={{ position:"relative", width:"100%", maxWidth:480, height:"90vh", background:"#fff", borderRadius:"20px 0 0 20px", boxShadow:"-20px 0 60px rgba(14,133,178,0.18)", display:"flex", flexDirection:"column", animation:"slide-in-right 0.28s cubic-bezier(0.22,1,0.36,1) both" }}>

                {/* Header */}
                <div style={{ padding:"1.25rem 1.5rem", borderBottom:"1px solid rgba(14,133,178,0.08)", flexShrink:0 }}>
                    <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", gap:"0.75rem" }}>
                        <div style={{ flex:1, minWidth:0 }}>
                            <div style={{ display:"inline-flex", alignItems:"center", gap:4, background:tc.bg, borderRadius:20, padding:"0.2rem 0.6rem", marginBottom:"0.4rem" }}>
                                <span style={{ fontSize:"0.65rem", fontWeight:700, color:tc.color }}>{tc.icon} {tc.label}</span>
                            </div>
                            <p style={{ fontFamily:"'Playfair Display',serif", fontSize:"0.95rem", fontWeight:700, color:"#0A3D52", lineHeight:1.3 }}>{post.title}</p>
                            <p style={{ fontSize:"0.72rem", color:"#1A6A8A", marginTop:"0.2rem" }}>{comments.length} comment{comments.length !== 1 ? "s" : ""}</p>
                        </div>
                        <button onClick={onClose} style={{ background:"rgba(14,133,178,0.08)", border:"none", borderRadius:8, width:32, height:32, display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", flexShrink:0 }}>
                            <svg width="13" height="13" viewBox="0 0 14 14" fill="none" stroke="#1A6A8A" strokeWidth="2" strokeLinecap="round"><path d="M2 2l10 10M12 2L2 12"/></svg>
                        </button>
                    </div>
                </div>

                {/* Comments list */}
                <div style={{ flex:1, overflowY:"auto", padding:"1rem 1.5rem", display:"flex", flexDirection:"column", gap:"1rem" }}>
                    {loading ? (
                        <div style={{ display:"flex", justifyContent:"center", padding:"2rem" }}>
                            <div style={{ width:24, height:24, borderRadius:"50%", border:"2.5px solid rgba(14,133,178,0.15)", borderTop:"2.5px solid #1E9DC8", animation:"spin 0.7s linear infinite" }}/>
                        </div>
                    ) : comments.length === 0 ? (
                        <div style={{ textAlign:"center", padding:"2rem", color:"#1A6A8A" }}>
                            <p style={{ fontSize:"1.5rem", marginBottom:"0.5rem" }}>💬</p>
                            <p style={{ fontSize:"0.83rem" }}>No comments yet — be the first!</p>
                        </div>
                    ) : comments.map(c => (
                        <div key={c.id} style={{ display:"flex", gap:"0.65rem" }}>
                            <Avatar name={c.authorName} photoURL={c.authorPhotoURL} size={30}/>
                            <div style={{ flex:1 }}>
                                <div style={{ display:"flex", alignItems:"center", gap:"0.5rem", marginBottom:"0.25rem" }}>
                                    <span style={{ fontSize:"0.78rem", fontWeight:700, color:"#0A3D52" }}>{c.authorName}</span>
                                    <span style={{ fontSize:"0.65rem", color:"#1A6A8A" }}>{timeAgo(c.createdAt)}</span>
                                </div>
                                <div style={{ background:"#F8FCFF", borderRadius:"4px 12px 12px 12px", padding:"0.6rem 0.85rem" }}>
                                    <p style={{ fontSize:"0.83rem", color:"#0A3D52", lineHeight:1.55 }}>{c.body}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Comment input */}
                <div style={{ padding:"1rem 1.5rem", borderTop:"1px solid rgba(14,133,178,0.08)", flexShrink:0 }}>
                    {currentUser ? (
                        <div style={{ display:"flex", gap:"0.6rem", alignItems:"flex-end" }}>
                            <Avatar name={currentUser.displayName ?? currentUser.name ?? "You"} photoURL={currentUser.photoURL} size={32}/>
                            <div style={{ flex:1, position:"relative" }}>
                <textarea ref={textRef} value={body} onChange={e => setBody(e.target.value)} rows={1} placeholder="Add a comment…"
                          onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submitComment(); } }}
                          style={{ width:"100%", borderRadius:12, border:"1.5px solid rgba(14,133,178,0.18)", padding:"0.6rem 2.8rem 0.6rem 0.85rem", fontSize:"0.83rem", color:"#0A3D52", outline:"none", resize:"none", fontFamily:"inherit", lineHeight:1.5, boxSizing:"border-box", transition:"border-color 0.15s" }}
                          onFocus={e => (e.target.style.borderColor = "#1E9DC8")}
                          onBlur={e  => (e.target.style.borderColor = "rgba(14,133,178,0.18)")}
                />
                                <button onClick={submitComment} disabled={submitting || !body.trim()}
                                        style={{ position:"absolute", right:8, bottom:8, width:26, height:26, borderRadius:8, border:"none", background: body.trim() ? "linear-gradient(135deg,#28B8E8,#0A6A94)" : "rgba(14,133,178,0.10)", cursor: body.trim() ? "pointer" : "default", display:"flex", alignItems:"center", justifyContent:"center", transition:"all 0.15s" }}>
                                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke={body.trim() ? "white" : "#1A6A8A"} strokeWidth="2" strokeLinecap="round">
                                        <path d="M11 1L1 5.5l4 1.5M11 1L6 11l-1-4"/>
                                    </svg>
                                </button>
                            </div>
                        </div>
                    ) : (
                        <Link href="/auth/login?returnUrl=/community" style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:6, padding:"0.75rem", borderRadius:12, background:"linear-gradient(135deg,#28B8E8,#0A6A94)", color:"#fff", fontSize:"0.83rem", fontWeight:700, textDecoration:"none" }}>
                            Sign in to comment
                        </Link>
                    )}
                </div>
            </div>
        </div>
    );
}

// ── POST CARD ─────────────────────────────────────────────────────────────────
function PostCard({ post, liked, currentUser, onLike, onComment }: {
    post: Post; liked: boolean; currentUser: CurrentUser;
    onLike: (id: string) => void; onComment: (post: Post) => void;
}) {
    const { ref, visible } = useReveal();
    const tc    = typeConfig(post.type);
    const [likeCount, setLikeCount] = useState(post.likeCount);
    const [isLiked,   setIsLiked]   = useState(liked);
    const [liking,    setLiking]    = useState(false);
    const [copied,    setCopied]    = useState(false);

    async function handleLike() {
        if (!currentUser) { toast.error("Sign in to like posts"); return; }
        if (liking) return;
        setLiking(true);
        const newLiked = !isLiked;
        setIsLiked(newLiked);
        setLikeCount(c => newLiked ? c + 1 : c - 1);
        try {
            await fetch(`/api/community/posts/${post.id}/like`, { method: newLiked ? "POST" : "DELETE" });
            onLike(post.id);
        } catch {
            setIsLiked(!newLiked);
            setLikeCount(c => newLiked ? c - 1 : c + 1);
        } finally {
            setLiking(false);
        }
    }

    async function handleShare() {
        const url = `${window.location.origin}/community?post=${post.id}`;
        await navigator.clipboard.writeText(url);
        setCopied(true);
        toast.success("Link copied!");
        setTimeout(() => setCopied(false), 2000);
    }

    return (
        <div ref={ref} style={{ opacity:visible?1:0, transform:visible?"translateY(0)":"translateY(20px)", transition:"opacity 0.5s ease, transform 0.5s cubic-bezier(0.22,1,0.36,1)" }}>
            <div style={{ background:"#fff", borderRadius:16, border: post.isPinned ? "1.5px solid rgba(30,157,200,0.30)" : "1px solid rgba(14,133,178,0.10)", boxShadow: post.isPinned ? "0 4px 20px rgba(14,133,178,0.10)" : "0 2px 8px rgba(14,133,178,0.05)", overflow:"hidden", transition:"box-shadow 0.2s, border-color 0.2s" }}>

                {/* Pinned banner */}
                {post.isPinned && (
                    <div style={{ background:"linear-gradient(90deg,rgba(14,133,178,0.08),rgba(40,184,232,0.05))", padding:"0.35rem 1rem", borderBottom:"1px solid rgba(14,133,178,0.08)", display:"flex", alignItems:"center", gap:6 }}>
                        <svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="#1E9DC8" strokeWidth="1.8" strokeLinecap="round"><path d="M6 1v7M4 11h4M3 4l3-3 3 3"/></svg>
                        <span style={{ fontSize:"0.65rem", fontWeight:700, letterSpacing:"0.1em", textTransform:"uppercase", color:"#1E9DC8" }}>Pinned</span>
                    </div>
                )}

                <div style={{ padding:"1.1rem 1.25rem" }}>
                    {/* Author + type + time */}
                    <div style={{ display:"flex", alignItems:"center", gap:"0.6rem", marginBottom:"0.75rem" }}>
                        <Avatar name={post.authorName} photoURL={post.authorPhotoURL} size={32}/>
                        <div style={{ flex:1, minWidth:0 }}>
                            <div style={{ display:"flex", alignItems:"center", gap:"0.5rem", flexWrap:"wrap" }}>
                                <span style={{ fontSize:"0.8rem", fontWeight:700, color:"#0A3D52" }}>{post.authorName}</span>
                                <span style={{ fontSize:"0.65rem", color:"#1A6A8A" }}>{timeAgo(post.createdAt)}</span>
                            </div>
                            <div style={{ display:"flex", alignItems:"center", gap:"0.4rem", marginTop:"0.1rem" }}>
                <span style={{ display:"inline-flex", alignItems:"center", gap:3, background:tc.bg, borderRadius:20, padding:"0.1rem 0.5rem", fontSize:"0.62rem", fontWeight:700, color:tc.color }}>
                  {tc.icon} {tc.label}
                </span>
                                {post.region && (
                                    <span style={{ display:"inline-flex", alignItems:"center", gap:3, background:"#F8FCFF", borderRadius:20, padding:"0.1rem 0.5rem", fontSize:"0.62rem", color:"#1A6A8A" }}>
                    📍 {post.region}
                  </span>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Title */}
                    <h3 style={{ fontFamily:"'Playfair Display',serif", fontSize:"1rem", fontWeight:700, color:"#0A3D52", marginBottom:"0.4rem", lineHeight:1.35 }}>
                        {post.title}
                    </h3>

                    {/* Body */}
                    <p style={{ fontSize:"0.83rem", color:"#1A6A8A", lineHeight:1.65, marginBottom:"0.85rem", display:"-webkit-box", WebkitLineClamp:4, WebkitBoxOrient:"vertical", overflow:"hidden" }}>
                        {post.body}
                    </p>

                    {/* Tags */}
                    {post.tags && post.tags.length > 0 && (
                        <div style={{ display:"flex", gap:"0.35rem", flexWrap:"wrap", marginBottom:"0.85rem" }}>
                            {post.tags.slice(0, 5).map(tag => (
                                <span key={tag} style={{ fontSize:"0.65rem", fontWeight:600, color:"#1E9DC8", background:"#EBF8FF", borderRadius:20, padding:"0.15rem 0.55rem" }}>#{tag}</span>
                            ))}
                        </div>
                    )}

                    {/* Actions */}
                    <div style={{ display:"flex", alignItems:"center", gap:"0.25rem", paddingTop:"0.65rem", borderTop:"1px solid rgba(14,133,178,0.07)" }}>
                        {/* Like */}
                        <button onClick={handleLike}
                                style={{ display:"flex", alignItems:"center", gap:5, padding:"0.4rem 0.75rem", borderRadius:20, border:"none", background: isLiked ? "rgba(239,68,68,0.08)" : "transparent", color: isLiked ? "#EF4444" : "#1A6A8A", fontSize:"0.78rem", fontWeight: isLiked ? 700 : 400, cursor:"pointer", transition:"all 0.15s" }}
                                onMouseEnter={e => { if (!isLiked) (e.currentTarget as HTMLElement).style.background = "rgba(239,68,68,0.06)"; }}
                                onMouseLeave={e => { if (!isLiked) (e.currentTarget as HTMLElement).style.background = "transparent"; }}>
                            <svg width="14" height="14" viewBox="0 0 16 16" fill={isLiked?"#EF4444":"none"} stroke={isLiked?"#EF4444":"currentColor"} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"
                                 style={{ transform:isLiked?"scale(1.15)":"scale(1)", transition:"transform 0.2s cubic-bezier(0.22,1,0.36,1)" }}>
                                <path d="M8 13.5S1.5 9.5 1.5 5.5a3.5 3.5 0 0 1 6.5-1.8A3.5 3.5 0 0 1 14.5 5.5c0 4-6.5 8-6.5 8z"/>
                            </svg>
                            {likeCount > 0 && likeCount}
                        </button>

                        {/* Comment */}
                        <button onClick={() => onComment(post)}
                                style={{ display:"flex", alignItems:"center", gap:5, padding:"0.4rem 0.75rem", borderRadius:20, border:"none", background:"transparent", color:"#1A6A8A", fontSize:"0.78rem", cursor:"pointer", transition:"background 0.15s" }}
                                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "rgba(14,133,178,0.06)"; }}
                                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}>
                            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
                                <path d="M14 10c0 1.1-.9 2-2 2H5l-3 3V4c0-1.1.9-2 2-2h8c1.1 0 2 .9 2 2v6z"/>
                            </svg>
                            {post.commentCount > 0 && post.commentCount}
                        </button>

                        {/* Share */}
                        <button onClick={handleShare}
                                style={{ display:"flex", alignItems:"center", gap:5, padding:"0.4rem 0.75rem", borderRadius:20, border:"none", background: copied ? "rgba(16,185,129,0.08)" : "transparent", color: copied ? "#10B981" : "#1A6A8A", fontSize:"0.78rem", cursor:"pointer", transition:"all 0.15s", marginLeft:"auto" }}
                                onMouseEnter={e => { if (!copied) (e.currentTarget as HTMLElement).style.background = "rgba(14,133,178,0.06)"; }}
                                onMouseLeave={e => { if (!copied) (e.currentTarget as HTMLElement).style.background = "transparent"; }}>
                            {copied ? (
                                <svg width="13" height="13" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M2 6l3 3 5-5"/></svg>
                            ) : (
                                <svg width="13" height="13" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
                                    <circle cx="11" cy="3" r="1.5"/><circle cx="3" cy="7" r="1.5"/><circle cx="11" cy="11" r="1.5"/>
                                    <path d="M4.5 7.5L9.5 3.5M4.5 7.5L9.5 11"/>
                                </svg>
                            )}
                            {copied ? "Copied!" : "Share"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ── MAIN ─────────────────────────────────────────────────────────────────────
export default function CommunityClient({ initialPosts, likedIds, currentUser }: {
    initialPosts: Post[]; likedIds: string[]; currentUser: CurrentUser;
}) {
    const [posts,          setPosts]          = useState(initialPosts);
    const [likedSet,       setLikedSet]       = useState(new Set(likedIds));
    const [tab,            setTab]            = useState("all");
    const [region,         setRegion]         = useState("All regions");
    const [showCompose,    setShowCompose]    = useState(false);
    const [commentPost,    setCommentPost]    = useState<Post | null>(null);

    const filtered = posts.filter(p => {
        const matchTab    = tab === "all" || p.type === tab;
        const matchRegion = region === "All regions" || p.region === region;
        return matchTab && matchRegion;
    });

    const pinned  = filtered.filter(p => p.isPinned);
    const regular = filtered.filter(p => !p.isPinned);

    function onLike(id: string) {
        setLikedSet(s => {
            const next = new Set(s);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
        });
    }

    function onNewPost(post: Post) {
        setPosts(ps => [post, ...ps]);
    }

    const authorName = currentUser?.displayName ?? currentUser?.name ?? "";

    return (
        <div style={{ minHeight:"100vh", background:"linear-gradient(160deg,#F0F9FF 0%,#fff 50%,#F0F9FF 100%)", paddingTop:64 }}>
            <style>{`
        @keyframes spin              { to{transform:rotate(360deg)} }
        @keyframes modal-pop         { from{opacity:0;transform:scale(0.95) translateY(16px)} to{opacity:1;transform:scale(1) translateY(0)} }
        @keyframes slide-in-right    { from{opacity:0;transform:translateX(32px)} to{opacity:1;transform:translateX(0)} }
        @keyframes float             { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
        .hide-scrollbar::-webkit-scrollbar { display:none }
        .hide-scrollbar { -ms-overflow-style:none; scrollbar-width:none }
      `}</style>

            {/* ── HERO ── */}
            <div style={{ background:"linear-gradient(135deg,#0A3D52 0%,#0E85B2 100%)", padding:"3rem 2rem 0", position:"relative", overflow:"hidden" }}>
                {/* BG orbs */}
                {[{x:"85%",y:"20%",s:300},{x:"5%",y:"60%",s:200},{x:"50%",y:"-10%",s:400}].map((o,i)=>(
                    <div key={i} style={{ position:"absolute", left:o.x, top:o.y, width:o.s, height:o.s, borderRadius:"50%", background:"rgba(40,184,232,0.08)", transform:"translate(-50%,-50%)", pointerEvents:"none" }}/>
                ))}

                <div style={{ maxWidth:900, margin:"0 auto", position:"relative" }}>
                    <div style={{ display:"flex", alignItems:"flex-end", justifyContent:"space-between", gap:"1rem", flexWrap:"wrap", paddingBottom:"1.5rem" }}>
                        <div>
                            <div style={{ display:"inline-flex", alignItems:"center", gap:6, background:"rgba(255,255,255,0.12)", borderRadius:20, padding:"0.3rem 0.8rem", fontSize:"0.68rem", fontWeight:700, letterSpacing:"0.14em", color:"rgba(235,248,255,0.85)", textTransform:"uppercase", marginBottom:"0.75rem" }}>
                                🌍 Community
                            </div>
                            <h1 style={{ fontFamily:"'Playfair Display',serif", fontSize:"clamp(2rem,4vw,3rem)", fontWeight:700, color:"#fff", letterSpacing:"-0.025em", lineHeight:1.1, marginBottom:"0.5rem" }}>
                                Traveler<br/><em style={{ color:"#28B8E8" }}>community</em>
                            </h1>
                            <p style={{ fontSize:"0.9rem", fontWeight:300, color:"rgba(235,248,255,0.75)", maxWidth:400 }}>
                                Ask questions, share stories, discover tips and routes from fellow Ethiopia explorers.
                            </p>
                        </div>

                        {/* Compose button */}
                        {currentUser ? (
                            <button onClick={() => setShowCompose(true)}
                                    style={{ display:"flex", alignItems:"center", gap:8, background:"rgba(255,255,255,0.15)", border:"1.5px solid rgba(255,255,255,0.25)", borderRadius:14, padding:"0.75rem 1.25rem", color:"#fff", fontSize:"0.87rem", fontWeight:700, cursor:"pointer", transition:"all 0.2s", backdropFilter:"blur(8px)", flexShrink:0 }}
                                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.25)"; }}
                                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.15)"; }}>
                                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M7 1v12M1 7h12"/></svg>
                                Create post
                            </button>
                        ) : (
                            <Link href="/auth/signup?returnUrl=/community"
                                  style={{ display:"flex", alignItems:"center", gap:8, background:"linear-gradient(135deg,#28B8E8,#0A6A94)", border:"none", borderRadius:14, padding:"0.75rem 1.25rem", color:"#fff", fontSize:"0.87rem", fontWeight:700, textDecoration:"none", flexShrink:0, boxShadow:"0 4px 16px rgba(40,184,232,0.35)" }}>
                                Join the community
                            </Link>
                        )}
                    </div>

                    {/* Tabs */}
                    <div className="hide-scrollbar" style={{ display:"flex", gap:"0.25rem", overflowX:"auto" }}>
                        {TABS.map(t => {
                            const active = tab === t.key;
                            const count  = initialPosts.filter(p => t.key === "all" || p.type === t.key).length;
                            return (
                                <button key={t.key} onClick={() => setTab(t.key)}
                                        style={{ display:"flex", alignItems:"center", gap:"0.4rem", padding:"0.6rem 1rem", borderRadius:"10px 10px 0 0", border:"none", cursor:"pointer", fontSize:"0.82rem", fontWeight: active ? 700 : 400, whiteSpace:"nowrap", transition:"all 0.15s", background: active ? "#fff" : "transparent", color: active ? "#0A3D52" : "rgba(235,248,255,0.7)", borderBottom: active ? "none" : "2px solid transparent", flexShrink:0 }}>
                                    {t.label}
                                    {count > 0 && (
                                        <span style={{ display:"inline-flex", alignItems:"center", justifyContent:"center", minWidth:18, height:18, borderRadius:20, padding:"0 5px", background: active ? "rgba(14,133,178,0.10)" : "rgba(255,255,255,0.12)", color: active ? "#1E9DC8" : "rgba(235,248,255,0.6)", fontSize:"0.62rem", fontWeight:700 }}>
                      {count}
                    </span>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* ── CONTENT ── */}
            <div style={{ maxWidth:900, margin:"0 auto", padding:"1.5rem 2rem" }}>

                {/* Region filter + post count */}
                <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:"1.25rem", flexWrap:"wrap", gap:"0.75rem" }}>
                    <div className="hide-scrollbar" style={{ display:"flex", gap:"0.4rem", overflowX:"auto", flex:1 }}>
                        {REGIONS.map(r => {
                            const active = region === r;
                            return (
                                <button key={r} onClick={() => setRegion(r)}
                                        style={{ padding:"0.35rem 0.85rem", borderRadius:20, border:`1.5px solid ${active ? "#1E9DC8" : "rgba(14,133,178,0.14)"}`, background: active ? "linear-gradient(135deg,#28B8E8,#0A6A94)" : "white", color: active ? "#fff" : "#1A6A8A", fontSize:"0.72rem", fontWeight: active ? 700 : 400, cursor:"pointer", whiteSpace:"nowrap", transition:"all 0.15s", flexShrink:0 }}>
                                    {r === "All regions" ? "🌍 All regions" : r}
                                </button>
                            );
                        })}
                    </div>
                    <span style={{ fontSize:"0.72rem", color:"#1A6A8A", flexShrink:0 }}>{filtered.length} post{filtered.length !== 1 ? "s" : ""}</span>
                </div>

                {/* Quick compose bar (logged in) */}
                {currentUser && (
                    <button onClick={() => setShowCompose(true)}
                            style={{ width:"100%", display:"flex", alignItems:"center", gap:"0.75rem", padding:"0.85rem 1.1rem", borderRadius:14, border:"1.5px solid rgba(14,133,178,0.14)", background:"#fff", cursor:"pointer", marginBottom:"1.25rem", boxShadow:"0 2px 8px rgba(14,133,178,0.06)", transition:"border-color 0.15s, box-shadow 0.15s" }}
                            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(14,133,178,0.30)"; (e.currentTarget as HTMLElement).style.boxShadow = "0 4px 16px rgba(14,133,178,0.10)"; }}
                            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(14,133,178,0.14)"; (e.currentTarget as HTMLElement).style.boxShadow = "0 2px 8px rgba(14,133,178,0.06)"; }}>
                        <Avatar name={authorName} photoURL={currentUser.photoURL} size={32}/>
                        <span style={{ fontSize:"0.85rem", color:"rgba(26,106,138,0.5)", flex:1, textAlign:"left" }}>
              What's on your mind, {authorName.split(" ")[0]}?
            </span>
                        <span style={{ display:"flex", alignItems:"center", gap:4, fontSize:"0.75rem", fontWeight:700, color:"#1E9DC8", background:"#EBF8FF", borderRadius:8, padding:"0.3rem 0.65rem" }}>
              <svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M6 1v10M1 6h10"/></svg>
              Post
            </span>
                    </button>
                )}

                {/* Feed */}
                {filtered.length === 0 ? (
                    <div style={{ textAlign:"center", padding:"4rem 1rem" }}>
                        <div style={{ width:70, height:70, borderRadius:"50%", background:"linear-gradient(135deg,#EBF8FF,#D6F0FA)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"1.8rem", margin:"0 auto 1rem", animation:"float 3s ease-in-out infinite" }}>💬</div>
                        <p style={{ fontFamily:"'Playfair Display',serif", fontSize:"1.1rem", fontWeight:600, color:"#0A3D52", marginBottom:"0.4rem" }}>No posts yet</p>
                        <p style={{ fontSize:"0.83rem", color:"#1A6A8A", marginBottom:"1.25rem" }}>Be the first to start a conversation.</p>
                        {currentUser && (
                            <button onClick={() => setShowCompose(true)}
                                    style={{ display:"inline-flex", alignItems:"center", gap:6, background:"linear-gradient(135deg,#28B8E8,#0A6A94)", color:"#fff", fontSize:"0.83rem", fontWeight:700, padding:"0.7rem 1.4rem", borderRadius:12, border:"none", cursor:"pointer", boxShadow:"0 4px 14px rgba(14,133,178,0.32)" }}>
                                + Create the first post
                            </button>
                        )}
                    </div>
                ) : (
                    <div style={{ display:"flex", flexDirection:"column", gap:"0.85rem" }}>
                        {/* Pinned first */}
                        {pinned.map(p => (
                            <PostCard key={p.id} post={p} liked={likedSet.has(p.id)} currentUser={currentUser} onLike={onLike} onComment={setCommentPost}/>
                        ))}
                        {/* Regular */}
                        {regular.map(p => (
                            <PostCard key={p.id} post={p} liked={likedSet.has(p.id)} currentUser={currentUser} onLike={onLike} onComment={setCommentPost}/>
                        ))}
                    </div>
                )}
            </div>

            {/* ── MODALS ── */}
            {showCompose && (
                <ComposeModal currentUser={currentUser} onClose={() => setShowCompose(false)} onPost={onNewPost}/>
            )}
            {commentPost && (
                <CommentsPanel post={commentPost} currentUser={currentUser} onClose={() => setCommentPost(null)}/>
            )}
        </div>
    );
}