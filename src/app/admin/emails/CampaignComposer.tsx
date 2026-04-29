// src/app/admin/email/CampaignComposer.tsx
"use client";

import { useState, useCallback } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

type BlockType = "heading" | "text" | "image" | "button" | "divider" | "spacer";

type BlockStyle = {
    fontSize?:    number;
    fontWeight?:  "300" | "400" | "600" | "700";
    fontStyle?:   "normal" | "italic";
    color?:       string;
    bgColor?:     string;
    align?:       "left" | "center" | "right";
    padding?:     number;
    borderRadius?:number;
    height?:      number; // spacer
};

type Block = {
    id:      string;
    type:    BlockType;
    content: string;    // text / url / alt text
    style:   BlockStyle;
};

type CampaignMeta = {
    subject:   string;
    audience:  "all" | "confirmed" | "pending";
    preheader: string;
    headerBg:  string;
    footerText:string;
};

// ─── Defaults ─────────────────────────────────────────────────────────────────

const BLOCK_DEFAULTS: Record<BlockType, Partial<Block>> = {
    heading:  { content:"Your headline here", style:{ fontSize:28, fontWeight:"700", color:"#0A3D52", align:"center", padding:16 } },
    text:     { content:"Write your message here. Use this block to tell your audience about your latest news, offers, or stories.", style:{ fontSize:15, fontWeight:"400", color:"#1A6A8A", align:"left", padding:12 } },
    image:    { content:"", style:{ align:"center", borderRadius:12, padding:0 } },
    button:   { content:"Explore Tours|https://tizitaw.com/tours", style:{ fontSize:15, fontWeight:"700", color:"#ffffff", bgColor:"#0A6A94", align:"center", borderRadius:12, padding:14 } },
    divider:  { content:"", style:{ color:"rgba(14,133,178,0.15)", padding:8 } },
    spacer:   { content:"", style:{ height:24 } },
};

function newBlock(type: BlockType): Block {
    return {
        id:      Math.random().toString(36).slice(2),
        type,
        content: BLOCK_DEFAULTS[type].content ?? "",
        style:   { ...BLOCK_DEFAULTS[type].style },
    };
}

// ─── HTML generator ───────────────────────────────────────────────────────────

function blocksToHtml(blocks: Block[], meta: CampaignMeta, unsubToken = "{{UNSUB_TOKEN}}"): string {
    const BASE_URL = typeof window !== "undefined" ? window.location.origin : "https://tizitaw.com";

    const blockHtml = blocks.map(b => {
        const s = b.style;
        const pad = s.padding ?? 12;

        switch (b.type) {
            case "heading": return `
        <tr><td style="padding:${pad}px 36px;text-align:${s.align ?? "center"};">
          <h2 style="margin:0;font-family:Georgia,serif;font-size:${s.fontSize ?? 28}px;font-weight:${s.fontWeight ?? "700"};font-style:${s.fontStyle ?? "normal"};color:${s.color ?? "#0A3D52"};line-height:1.2;letter-spacing:-0.02em;">
            ${b.content}
          </h2>
        </td></tr>`;

            case "text": return `
        <tr><td style="padding:${pad}px 36px;text-align:${s.align ?? "left"};">
          <p style="margin:0;font-family:Georgia,serif;font-size:${s.fontSize ?? 15}px;font-weight:${s.fontWeight ?? "400"};font-style:${s.fontStyle ?? "normal"};color:${s.color ?? "#1A6A8A"};line-height:1.75;">
            ${b.content.replace(/\n/g, "<br/>")}
          </p>
        </td></tr>`;

            case "image": {
                const url = b.content;
                if (!url) return "";
                return `
        <tr><td style="padding:${pad}px 36px;text-align:${s.align ?? "center"};">
          <img src="${url}" alt="Email image" width="528" style="width:100%;max-width:528px;height:auto;border-radius:${s.borderRadius ?? 12}px;display:block;${s.align === "center" ? "margin:0 auto;" : s.align === "right" ? "margin-left:auto;" : ""}"/>
        </td></tr>`;
            }

            case "button": {
                const [label, href] = b.content.split("|");
                return `
        <tr><td style="padding:${pad}px 36px;text-align:${s.align ?? "center"};">
          <a href="${href ?? "#"}" style="display:inline-block;background:${s.bgColor ?? "#0A6A94"};color:${s.color ?? "#fff"};font-family:Georgia,serif;font-size:${s.fontSize ?? 15}px;font-weight:${s.fontWeight ?? "700"};padding:${s.padding ?? 14}px 32px;border-radius:${s.borderRadius ?? 12}px;text-decoration:none;letter-spacing:0.01em;">
            ${label ?? "Click here"}
          </a>
        </td></tr>`;
            }

            case "divider": return `
        <tr><td style="padding:${pad}px 36px;">
          <div style="height:1px;background:${s.color ?? "rgba(14,133,178,0.15)"};"></div>
        </td></tr>`;

            case "spacer": return `
        <tr><td style="height:${s.height ?? 24}px;line-height:${s.height ?? 24}px;">&nbsp;</td></tr>`;

            default: return "";
        }
    }).join("\n");

    return `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/>
<title>${meta.subject}</title></head>
<body style="margin:0;padding:0;background:#F0F9FF;font-family:Georgia,serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#F0F9FF;padding:32px 16px;">
<tr><td align="center">
<table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;">
  <tr><td style="background:${meta.headerBg};border-radius:20px 20px 0 0;padding:24px 36px;">
    <table width="100%" cellpadding="0" cellspacing="0"><tr>
      <td><a href="${BASE_URL}" style="text-decoration:none;"><span style="font-family:Georgia,serif;font-size:20px;font-weight:700;color:#fff;letter-spacing:-0.02em;">Tizitaw <em style="font-style:italic;color:#28B8E8;">Ethiopia</em></span></a></td>
      <td align="right"><span style="font-size:11px;color:rgba(255,255,255,0.45);letter-spacing:0.1em;text-transform:uppercase;">Your journey awaits</span></td>
    </tr></table>
  </td></tr>
  <tr><td style="background:#fff;padding:8px 0;">
    <table width="100%" cellpadding="0" cellspacing="0">
      ${blockHtml}
    </table>
  </td></tr>
  <tr><td style="background:#F8FCFF;border-radius:0 0 20px 20px;border-top:1px solid rgba(14,133,178,0.10);padding:24px 36px;text-align:center;">
    <p style="margin:0 0 8px;font-size:12px;color:#1A6A8A;font-family:Georgia,serif;">${meta.footerText || "© 2025 Tizitaw Ethiopia. All rights reserved."}</p>
    <p style="margin:0;font-size:11px;color:#CBD5E1;font-family:Georgia,serif;">
      <a href="${BASE_URL}/unsubscribe?token=${unsubToken}" style="color:#CBD5E1;text-decoration:underline;">Unsubscribe</a> from marketing emails
    </p>
  </td></tr>
</table>
</td></tr></table>
</body></html>`;
}

// ─── UI sub-components ────────────────────────────────────────────────────────

function Label({ children }: { children: React.ReactNode }) {
    return <p style={{ fontSize:10, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.1em", color:"#64748B", marginBottom:6 }}>{children}</p>;
}

function Row({ children, gap = 8 }: { children: React.ReactNode; gap?: number }) {
    return <div style={{ display:"flex", gap, alignItems:"center", marginBottom:10 }}>{children}</div>;
}

function Input({ value, onChange, placeholder, type = "text", style: extStyle }: {
    value: string; onChange: (v: string) => void; placeholder?: string; type?: string; style?: React.CSSProperties;
}) {
    return (
        <input
            type={type}
            value={value}
            onChange={e => onChange(e.target.value)}
            placeholder={placeholder}
            style={{ flex:1, border:"1px solid #E2E8F0", borderRadius:8, padding:"6px 10px", fontSize:13, color:"#0F172A", outline:"none", background:"#fff", ...extStyle }}
        />
    );
}

function Select({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: [string, string][] }) {
    return (
        <select
            value={value}
            onChange={e => onChange(e.target.value)}
            style={{ border:"1px solid #E2E8F0", borderRadius:8, padding:"6px 8px", fontSize:12, color:"#0F172A", outline:"none", background:"#fff", cursor:"pointer" }}
        >
            {options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
    );
}

function ColorPicker({ value, onChange, label }: { value: string; onChange: (v: string) => void; label: string }) {
    return (
        <div style={{ display:"flex", alignItems:"center", gap:6 }}>
            <input type="color" value={value?.startsWith("#") ? value : "#0A3D52"} onChange={e => onChange(e.target.value)}
                   style={{ width:28, height:28, border:"1px solid #E2E8F0", borderRadius:6, cursor:"pointer", padding:2 }}/>
            <span style={{ fontSize:11, color:"#64748B" }}>{label}</span>
        </div>
    );
}

// ─── Block type labels ─────────────────────────────────────────────────────────

const BLOCK_ICONS: Record<BlockType, string> = {
    heading: "H", text: "¶", image: "🖼", button: "⬜", divider: "—", spacer: "↕",
};

const BLOCK_LABELS: Record<BlockType, string> = {
    heading: "Heading", text: "Text", image: "Image", button: "Button", divider: "Divider", spacer: "Spacer",
};

// ─── Block style editor ───────────────────────────────────────────────────────

function BlockStyleEditor({ block, onChange }: { block: Block; onChange: (b: Block) => void }) {
    const s = block.style;
    const update = (patch: Partial<BlockStyle>) => onChange({ ...block, style: { ...s, ...patch } });
    const setContent = (content: string) => onChange({ ...block, content });

    return (
        <div style={{ padding:"14px 16px", display:"flex", flexDirection:"column", gap:0 }}>
            <p style={{ fontSize:11, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.12em", color:"#94A3B8", marginBottom:12 }}>
                {BLOCK_LABELS[block.type]} block
            </p>

            {/* Content */}
            {block.type === "heading" && (
                <>
                    <Label>Heading text</Label>
                    <textarea value={block.content} onChange={e => setContent(e.target.value)} rows={2}
                              style={{ border:"1px solid #E2E8F0", borderRadius:8, padding:"6px 10px", fontSize:13, color:"#0F172A", outline:"none", resize:"vertical", marginBottom:10, fontFamily:"Georgia,serif" }}/>
                </>
            )}

            {block.type === "text" && (
                <>
                    <Label>Body text</Label>
                    <textarea value={block.content} onChange={e => setContent(e.target.value)} rows={4}
                              style={{ border:"1px solid #E2E8F0", borderRadius:8, padding:"6px 10px", fontSize:13, color:"#0F172A", outline:"none", resize:"vertical", marginBottom:10, lineHeight:1.6 }}/>
                </>
            )}

            {block.type === "image" && (
                <>
                    <Label>Image URL</Label>
                    <Row>
                        <Input value={block.content} onChange={setContent} placeholder="https://images.unsplash.com/..."/>
                    </Row>
                    <Label>Border radius</Label>
                    <Row>
                        <input type="range" min={0} max={32} value={s.borderRadius ?? 12} onChange={e => update({ borderRadius: +e.target.value })} style={{ flex:1 }}/>
                        <span style={{ fontSize:12, color:"#64748B", minWidth:28 }}>{s.borderRadius ?? 12}px</span>
                    </Row>
                </>
            )}

            {block.type === "button" && (
                <>
                    <Label>Button label</Label>
                    <Row><Input value={block.content.split("|")[0]} onChange={v => setContent(`${v}|${block.content.split("|")[1] ?? ""}`)} placeholder="Explore Tours"/></Row>
                    <Label>Button URL</Label>
                    <Row><Input value={block.content.split("|")[1] ?? ""} onChange={v => setContent(`${block.content.split("|")[0]}|${v}`)} placeholder="https://tizitaw.com/tours"/></Row>
                    <Label>Button colors</Label>
                    <Row gap={16}>
                        <ColorPicker value={s.bgColor ?? "#0A6A94"} onChange={v => update({ bgColor: v })} label="Background"/>
                        <ColorPicker value={s.color ?? "#ffffff"} onChange={v => update({ color: v })} label="Text"/>
                    </Row>
                    <Label>Border radius</Label>
                    <Row>
                        <input type="range" min={0} max={32} value={s.borderRadius ?? 12} onChange={e => update({ borderRadius: +e.target.value })} style={{ flex:1 }}/>
                        <span style={{ fontSize:12, color:"#64748B", minWidth:28 }}>{s.borderRadius ?? 12}px</span>
                    </Row>
                </>
            )}

            {block.type === "divider" && (
                <>
                    <Label>Divider color</Label>
                    <Row><ColorPicker value={s.color ?? "#E2E8F0"} onChange={v => update({ color: v })} label="Color"/></Row>
                </>
            )}

            {block.type === "spacer" && (
                <>
                    <Label>Height</Label>
                    <Row>
                        <input type="range" min={8} max={80} value={s.height ?? 24} onChange={e => update({ height: +e.target.value })} style={{ flex:1 }}/>
                        <span style={{ fontSize:12, color:"#64748B", minWidth:28 }}>{s.height ?? 24}px</span>
                    </Row>
                </>
            )}

            {/* Typography (heading, text, button) */}
            {["heading","text","button"].includes(block.type) && (
                <>
                    <Label>Font size</Label>
                    <Row>
                        <input type="range" min={11} max={48} value={s.fontSize ?? 16} onChange={e => update({ fontSize: +e.target.value })} style={{ flex:1 }}/>
                        <span style={{ fontSize:12, color:"#64748B", minWidth:28 }}>{s.fontSize ?? 16}px</span>
                    </Row>

                    <Label>Weight & style</Label>
                    <Row gap={6}>
                        {(["300","400","600","700"] as const).map(w => (
                            <button key={w} onClick={() => update({ fontWeight: w })}
                                    style={{ padding:"4px 10px", borderRadius:6, fontSize:12, border:`1px solid ${s.fontWeight === w ? "#0A6A94" : "#E2E8F0"}`, background:s.fontWeight === w ? "#EBF8FF" : "transparent", color:s.fontWeight === w ? "#0A6A94" : "#64748B", cursor:"pointer", fontWeight:w as any }}>
                                {w}
                            </button>
                        ))}
                        <button onClick={() => update({ fontStyle: s.fontStyle === "italic" ? "normal" : "italic" })}
                                style={{ padding:"4px 10px", borderRadius:6, fontSize:12, fontStyle:"italic", border:`1px solid ${s.fontStyle === "italic" ? "#0A6A94" : "#E2E8F0"}`, background:s.fontStyle === "italic" ? "#EBF8FF" : "transparent", color:s.fontStyle === "italic" ? "#0A6A94" : "#64748B", cursor:"pointer" }}>
                            <em>I</em>
                        </button>
                    </Row>

                    {block.type !== "button" && (
                        <>
                            <Label>Text color</Label>
                            <Row><ColorPicker value={s.color ?? "#1A6A8A"} onChange={v => update({ color: v })} label="Color"/></Row>
                        </>
                    )}
                </>
            )}

            {/* Alignment (all except divider/spacer) */}
            {!["divider","spacer"].includes(block.type) && (
                <>
                    <Label>Alignment</Label>
                    <Row gap={6}>
                        {(["left","center","right"] as const).map(a => (
                            <button key={a} onClick={() => update({ align: a })}
                                    style={{ flex:1, padding:"5px", borderRadius:6, border:`1px solid ${s.align === a ? "#0A6A94" : "#E2E8F0"}`, background:s.align === a ? "#EBF8FF" : "transparent", cursor:"pointer", display:"flex", justifyContent:"center", alignItems:"center" }}>
                                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke={s.align === a ? "#0A6A94" : "#94A3B8"} strokeWidth="1.5" strokeLinecap="round">
                                    {a === "left"   && <><path d="M2 3h10M2 6h6M2 9h8M2 12h5"/></>}
                                    {a === "center" && <><path d="M2 3h10M4 6h6M3 9h8M4.5 12h5"/></>}
                                    {a === "right"  && <><path d="M2 3h10M6 6h6M4 9h8M7 12h5"/></>}
                                </svg>
                            </button>
                        ))}
                    </Row>
                </>
            )}

            {/* Padding */}
            {block.type !== "spacer" && (
                <>
                    <Label>Padding</Label>
                    <Row>
                        <input type="range" min={0} max={48} value={s.padding ?? 12} onChange={e => update({ padding: +e.target.value })} style={{ flex:1 }}/>
                        <span style={{ fontSize:12, color:"#64748B", minWidth:28 }}>{s.padding ?? 12}px</span>
                    </Row>
                </>
            )}
        </div>
    );
}

// ─── Main composer ────────────────────────────────────────────────────────────

export function CampaignComposer({ onClose }: { onClose: () => void }) {
    const [meta, setMeta] = useState<CampaignMeta>({
        subject:   "",
        audience:  "all",
        preheader: "",
        headerBg:  "linear-gradient(135deg,#061E32,#0A6A94)",
        footerText:"© 2025 Tizitaw Ethiopia. All rights reserved.",
    });

    const [blocks, setBlocks] = useState<Block[]>([
        newBlock("heading"),
        newBlock("text"),
        newBlock("button"),
    ]);

    const [selectedId, setSelectedId]  = useState<string | null>(blocks[0].id);
    const [activeTab, setActiveTab]    = useState<"blocks" | "settings">("blocks");
    const [preview, setPreview]        = useState(false);
    const [loading, setLoading]        = useState(false);
    const [result, setResult]          = useState<{ sent: number; failed: number } | null>(null);
    const [error, setError]            = useState("");

    const selectedBlock = blocks.find(b => b.id === selectedId) ?? null;

    const updateBlock = useCallback((updated: Block) => {
        setBlocks(bs => bs.map(b => b.id === updated.id ? updated : b));
    }, []);

    function addBlock(type: BlockType) {
        const b = newBlock(type);
        setBlocks(bs => [...bs, b]);
        setSelectedId(b.id);
    }

    function removeBlock(id: string) {
        setBlocks(bs => bs.filter(b => b.id !== id));
        setSelectedId(null);
    }

    function moveBlock(id: string, dir: -1 | 1) {
        setBlocks(bs => {
            const i = bs.findIndex(b => b.id === id);
            if (i + dir < 0 || i + dir >= bs.length) return bs;
            const arr = [...bs];
            [arr[i], arr[i + dir]] = [arr[i + dir], arr[i]];
            return arr;
        });
    }

    function duplicateBlock(id: string) {
        setBlocks(bs => {
            const i   = bs.findIndex(b => b.id === id);
            const dup = { ...bs[i], id: Math.random().toString(36).slice(2) };
            const arr = [...bs];
            arr.splice(i + 1, 0, dup);
            return arr;
        });
    }

    const html = blocksToHtml(blocks, meta);

    async function send() {
        if (!meta.subject) { setError("Subject line is required."); return; }
        if (blocks.filter(b => b.type !== "divider" && b.type !== "spacer").length === 0) {
            setError("Add at least one content block."); return;
        }
        setLoading(true); setError("");
        try {
            const res = await fetch("/api/admin/email/campaign", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    subject:  meta.subject,
                    audience: meta.audience,
                    html,       // send the rendered HTML directly
                    isCustomHtml: true,
                }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error ?? "Failed");
            setResult(data);
        } catch (e: any) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    }

    // ── Result screen ────────────────────────────────────────────────────────────

    if (result) return (
        <div style={{ position:"fixed", inset:0, zIndex:50, display:"flex", alignItems:"center", justifyContent:"center", padding:16, background:"rgba(15,23,42,0.5)", backdropFilter:"blur(6px)" }}>
            <div style={{ background:"#fff", borderRadius:20, padding:40, width:"100%", maxWidth:420, textAlign:"center", boxShadow:"0 32px 80px rgba(14,133,178,0.22)" }}>
                <div style={{ width:64, height:64, borderRadius:"50%", background:"#D1FAE5", display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 20px" }}>
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2.2" strokeLinecap="round"><path d="M5 12l5 5L20 7"/></svg>
                </div>
                <h3 style={{ fontFamily:"Georgia,serif", fontSize:22, fontWeight:700, color:"#0A3D52", marginBottom:8 }}>Campaign sent!</h3>
                <p style={{ fontSize:14, color:"#64748B", marginBottom:4 }}>
                    <span style={{ fontWeight:700, color:"#059669" }}>{result.sent}</span> emails delivered
                </p>
                {result.failed > 0 && <p style={{ fontSize:14, color:"#64748B" }}><span style={{ fontWeight:700, color:"#EF4444" }}>{result.failed}</span> failed</p>}
                <button onClick={onClose} style={{ marginTop:24, padding:"10px 28px", background:"#F1F5F9", borderRadius:12, border:"none", fontSize:14, fontWeight:600, color:"#475569", cursor:"pointer" }}>
                    Close
                </button>
            </div>
        </div>
    );

    // ── Preview modal ────────────────────────────────────────────────────────────

    if (preview) return (
        <div style={{ position:"fixed", inset:0, zIndex:50, display:"flex", flexDirection:"column", background:"rgba(15,23,42,0.7)", backdropFilter:"blur(8px)" }}>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"12px 20px", background:"#1E293B", flexShrink:0 }}>
                <p style={{ fontSize:13, fontWeight:600, color:"#fff" }}>Email preview — {meta.subject || "No subject"}</p>
                <button onClick={() => setPreview(false)} style={{ padding:"6px 16px", background:"rgba(255,255,255,0.12)", border:"1px solid rgba(255,255,255,0.15)", borderRadius:8, fontSize:12, fontWeight:600, color:"#fff", cursor:"pointer" }}>
                    ← Back to editor
                </button>
            </div>
            <div style={{ flex:1, overflow:"auto", padding:32, display:"flex", justifyContent:"center" }}>
                <div style={{ width:"100%", maxWidth:640, background:"#fff", borderRadius:16, overflow:"hidden", boxShadow:"0 24px 64px rgba(0,0,0,0.35)" }}>
                    <iframe srcDoc={html} style={{ width:"100%", minHeight:700, border:"none" }} title="Email preview"/>
                </div>
            </div>
        </div>
    );

    // ── Main editor ──────────────────────────────────────────────────────────────

    return (
        <div style={{ position:"fixed", inset:0, zIndex:50, display:"flex", background:"#F8FAFC" }}>

            {/* ── LEFT PANEL: Block canvas ─────────────────────────────────────── */}
            <div style={{ flex:1, display:"flex", flexDirection:"column", minWidth:0 }}>

                {/* Topbar */}
                <div style={{ display:"flex", alignItems:"center", gap:12, padding:"12px 20px", background:"#fff", borderBottom:"1px solid #E2E8F0", flexShrink:0 }}>
                    <button onClick={onClose} style={{ width:32, height:32, borderRadius:8, border:"1px solid #E2E8F0", background:"transparent", display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer" }}>
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="#64748B" strokeWidth="2" strokeLinecap="round"><path d="M2 2l10 10M12 2L2 12"/></svg>
                    </button>
                    <div style={{ flex:1 }}>
                        <input
                            value={meta.subject}
                            onChange={e => setMeta(m => ({ ...m, subject: e.target.value }))}
                            placeholder="Subject line…"
                            style={{ width:"100%", border:"none", outline:"none", fontSize:15, fontWeight:600, color:"#0F172A", background:"transparent" }}
                        />
                        <p style={{ margin:0, fontSize:11, color:"#94A3B8" }}>Campaign subject</p>
                    </div>
                    <div style={{ display:"flex", gap:8 }}>
                        <button onClick={() => setPreview(true)}
                                style={{ padding:"7px 16px", borderRadius:10, border:"1px solid #E2E8F0", fontSize:12, fontWeight:600, color:"#475569", background:"#fff", cursor:"pointer" }}>
                            Preview
                        </button>
                        <button onClick={send} disabled={loading}
                                style={{ padding:"7px 20px", borderRadius:10, border:"none", fontSize:12, fontWeight:700, color:"#fff", background:"linear-gradient(135deg,#28B8E8,#0A6A94)", cursor:"pointer", opacity:loading ? 0.6 : 1, display:"flex", alignItems:"center", gap:6 }}>
                            {loading ? "Sending…" : "Send campaign"}
                        </button>
                    </div>
                </div>

                {/* Canvas */}
                <div style={{ flex:1, overflow:"auto", padding:"32px 24px", display:"flex", justifyContent:"center" }}>
                    <div style={{ width:"100%", maxWidth:600 }}>

                        {/* Email shell preview */}
                        <div style={{ background:"#fff", borderRadius:16, overflow:"hidden", border:"1px solid #E2E8F0", boxShadow:"0 4px 24px rgba(14,133,178,0.08)" }}>

                            {/* Header */}
                            <div style={{ background:meta.headerBg, padding:"20px 32px", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                <span style={{ fontFamily:"Georgia,serif", fontSize:18, fontWeight:700, color:"#fff" }}>
                  Tizitaw <em style={{ fontStyle:"italic", color:"#28B8E8" }}>Ethiopia</em>
                </span>
                                <span style={{ fontSize:10, color:"rgba(255,255,255,0.45)", letterSpacing:"0.1em", textTransform:"uppercase" }}>Your journey awaits</span>
                            </div>

                            {/* Blocks */}
                            <div style={{ padding:"8px 0" }}>
                                {blocks.length === 0 && (
                                    <div style={{ padding:"48px 32px", textAlign:"center", color:"#94A3B8", fontSize:13 }}>
                                        Add blocks from the right panel →
                                    </div>
                                )}
                                {blocks.map((b, i) => (
                                    <div
                                        key={b.id}
                                        onClick={() => setSelectedId(b.id)}
                                        style={{ position:"relative", cursor:"pointer", outline:selectedId === b.id ? "2px solid #1E9DC8" : "2px solid transparent", outlineOffset:"-2px", transition:"outline 0.15s" }}
                                    >
                                        {/* Block actions (show on hover/select) */}
                                        {selectedId === b.id && (
                                            <div style={{ position:"absolute", top:4, right:4, display:"flex", gap:3, zIndex:10 }}>
                                                {[
                                                    { icon:"↑", action:() => moveBlock(b.id, -1), title:"Move up"   },
                                                    { icon:"↓", action:() => moveBlock(b.id, 1),  title:"Move down" },
                                                    { icon:"⎘", action:() => duplicateBlock(b.id),title:"Duplicate" },
                                                    { icon:"✕", action:() => removeBlock(b.id),   title:"Delete",   danger:true },
                                                ].map(({ icon, action, title, danger }) => (
                                                    <button key={icon} onClick={e => { e.stopPropagation(); action(); }} title={title}
                                                            style={{ width:24, height:24, borderRadius:5, border:"1px solid #E2E8F0", background: danger ? "#FEF2F2" : "#fff", color: danger ? "#EF4444" : "#475569", fontSize:12, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}>
                                                        {icon}
                                                    </button>
                                                ))}
                                            </div>
                                        )}

                                        {/* Block render */}
                                        <BlockPreview block={b}/>
                                    </div>
                                ))}
                            </div>

                            {/* Footer */}
                            <div style={{ background:"#F8FCFF", borderTop:"1px solid rgba(14,133,178,0.10)", padding:"20px 32px", textAlign:"center" }}>
                                <p style={{ margin:"0 0 4px", fontSize:12, color:"#1A6A8A", fontFamily:"Georgia,serif" }}>{meta.footerText}</p>
                                <p style={{ margin:0, fontSize:11, color:"#CBD5E1" }}><u>Unsubscribe</u> from marketing emails</p>
                            </div>
                        </div>

                        {error && (
                            <div style={{ marginTop:12, padding:"10px 16px", background:"#FEF2F2", border:"1px solid #FECACA", borderRadius:10, fontSize:13, color:"#DC2626" }}>
                                {error}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* ── RIGHT PANEL: Controls ────────────────────────────────────────── */}
            <div style={{ width:280, background:"#fff", borderLeft:"1px solid #E2E8F0", display:"flex", flexDirection:"column", overflow:"hidden", flexShrink:0 }}>

                {/* Tab bar */}
                <div style={{ display:"flex", borderBottom:"1px solid #E2E8F0", flexShrink:0 }}>
                    {([["blocks","Blocks"],["settings","Settings"]] as const).map(([key, label]) => (
                        <button key={key} onClick={() => setActiveTab(key)}
                                style={{ flex:1, padding:"11px 0", fontSize:12, fontWeight:600, border:"none", background:"transparent", cursor:"pointer", color:activeTab === key ? "#0A6A94" : "#94A3B8", borderBottom:`2px solid ${activeTab === key ? "#0A6A94" : "transparent"}`, transition:"all 0.15s" }}>
                            {label}
                        </button>
                    ))}
                </div>

                <div style={{ flex:1, overflow:"auto" }}>

                    {/* ── Blocks tab ─────────────────────────────────────────────── */}
                    {activeTab === "blocks" && (
                        <>
                            {/* Add block */}
                            <div style={{ padding:"12px 14px", borderBottom:"1px solid #F1F5F9" }}>
                                <p style={{ fontSize:10, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.1em", color:"#94A3B8", marginBottom:8 }}>Add block</p>
                                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:6 }}>
                                    {(Object.keys(BLOCK_LABELS) as BlockType[]).map(type => (
                                        <button key={type} onClick={() => addBlock(type)}
                                                style={{ padding:"7px 6px", borderRadius:8, border:"1px solid #E2E8F0", background:"#F8FAFC", fontSize:11, fontWeight:600, color:"#475569", cursor:"pointer", display:"flex", alignItems:"center", gap:5, transition:"background 0.15s" }}>
                                            <span style={{ fontSize:13 }}>{BLOCK_ICONS[type]}</span> {BLOCK_LABELS[type]}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Block style editor */}
                            {selectedBlock ? (
                                <BlockStyleEditor block={selectedBlock} onChange={updateBlock}/>
                            ) : (
                                <div style={{ padding:20, textAlign:"center", color:"#94A3B8", fontSize:12, marginTop:24 }}>
                                    Click a block to edit its style
                                </div>
                            )}
                        </>
                    )}

                    {/* ── Settings tab ───────────────────────────────────────────── */}
                    {activeTab === "settings" && (
                        <div style={{ padding:"14px 16px", display:"flex", flexDirection:"column", gap:0 }}>

                            <Label>Audience</Label>
                            <div style={{ display:"flex", flexDirection:"column", gap:4, marginBottom:12 }}>
                                {([["all","All users"],["confirmed","Confirmed bookers"],["pending","Pending payment"]] as const).map(([val, label]) => (
                                    <label key={val} style={{ display:"flex", alignItems:"center", gap:8, padding:"7px 10px", borderRadius:8, border:`1px solid ${meta.audience === val ? "#0A6A94" : "#E2E8F0"}`, cursor:"pointer", background:meta.audience === val ? "#EBF8FF" : "transparent" }}>
                                        <input type="radio" name="audience" value={val} checked={meta.audience === val} onChange={() => setMeta(m => ({ ...m, audience: val }))} style={{ accentColor:"#0A6A94" }}/>
                                        <span style={{ fontSize:12, fontWeight:600, color:meta.audience === val ? "#0A6A94" : "#475569" }}>{label}</span>
                                    </label>
                                ))}
                            </div>

                            <Label>Preheader text</Label>
                            <Row>
                                <Input value={meta.preheader} onChange={v => setMeta(m => ({ ...m, preheader: v }))} placeholder="Short preview shown in inbox…"/>
                            </Row>

                            <Label>Header background</Label>
                            <div style={{ display:"flex", gap:6, marginBottom:12, flexWrap:"wrap" }}>
                                {[
                                    { label:"Navy",   val:"linear-gradient(135deg,#061E32,#0A6A94)" },
                                    { label:"Teal",   val:"linear-gradient(135deg,#065F46,#1D9E75)" },
                                    { label:"Dark",   val:"linear-gradient(135deg,#1E1B4B,#4338CA)" },
                                    { label:"Amber",  val:"linear-gradient(135deg,#92400E,#D97706)" },
                                    { label:"Custom", val:"custom" },
                                ].map(({ label, val }) => (
                                    <button key={label} onClick={() => { if (val !== "custom") setMeta(m => ({ ...m, headerBg: val })); }}
                                            style={{ padding:"5px 10px", borderRadius:6, border:`1px solid ${meta.headerBg === val ? "#0A6A94" : "#E2E8F0"}`, fontSize:11, fontWeight:600, color:meta.headerBg === val ? "#0A6A94" : "#64748B", background:meta.headerBg === val ? "#EBF8FF" : "transparent", cursor:"pointer" }}>
                                        {label}
                                    </button>
                                ))}
                            </div>

                            <Label>Footer text</Label>
                            <Row>
                                <Input value={meta.footerText} onChange={v => setMeta(m => ({ ...m, footerText: v }))} placeholder="© 2025 Tizitaw Ethiopia"/>
                            </Row>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

// ─── Block preview renderer ───────────────────────────────────────────────────

function BlockPreview({ block }: { block: Block }) {
    const s = block.style;
    const pad = s.padding ?? 12;
    const align = (s.align ?? "left") as "left" | "center" | "right";

    switch (block.type) {
        case "heading": return (
            <div style={{ padding:`${pad}px 32px`, textAlign:align }}>
                <h2 style={{ margin:0, fontFamily:"Georgia,serif", fontSize:s.fontSize ?? 28, fontWeight:+(s.fontWeight ?? 700) as any, fontStyle:s.fontStyle ?? "normal", color:s.color ?? "#0A3D52", lineHeight:1.2 }}>
                    {block.content || <span style={{ color:"#CBD5E1" }}>Heading text…</span>}
                </h2>
            </div>
        );

        case "text": return (
            <div style={{ padding:`${pad}px 32px`, textAlign:align }}>
                <p style={{ margin:0, fontFamily:"Georgia,serif", fontSize:s.fontSize ?? 15, fontWeight:+(s.fontWeight ?? 400) as any, fontStyle:s.fontStyle ?? "normal", color:s.color ?? "#1A6A8A", lineHeight:1.75, whiteSpace:"pre-line" }}>
                    {block.content || <span style={{ color:"#CBD5E1" }}>Body text…</span>}
                </p>
            </div>
        );

        case "image": return (
            <div style={{ padding:`${pad}px 32px`, textAlign:align }}>
                {block.content ? (
                    <img src={block.content} alt="" style={{ maxWidth:"100%", borderRadius:s.borderRadius ?? 12, display:"block", margin:align === "center" ? "0 auto" : align === "right" ? "0 0 0 auto" : "0" }}
                         onError={e => { (e.target as HTMLImageElement).style.display = "none"; }}/>
                ) : (
                    <div style={{ height:140, borderRadius:s.borderRadius ?? 12, background:"#F1F5F9", border:"2px dashed #CBD5E1", display:"flex", alignItems:"center", justifyContent:"center", color:"#94A3B8", fontSize:13 }}>
                        Paste an image URL in the panel →
                    </div>
                )}
            </div>
        );

        case "button": {
            const [label] = block.content.split("|");
            return (
                <div style={{ padding:`${pad}px 32px`, textAlign:align }}>
          <span style={{ display:"inline-block", background:s.bgColor ?? "#0A6A94", color:s.color ?? "#fff", fontFamily:"Georgia,serif", fontSize:s.fontSize ?? 15, fontWeight:+(s.fontWeight ?? 700) as any, padding:`${s.padding ?? 14}px 32px`, borderRadius:s.borderRadius ?? 12 }}>
            {label || "Button text"}
          </span>
                </div>
            );
        }

        case "divider": return (
            <div style={{ padding:`${pad}px 32px` }}>
                <div style={{ height:1, background:s.color ?? "rgba(14,133,178,0.15)" }}/>
            </div>
        );

        case "spacer": return <div style={{ height:s.height ?? 24 }}/>;

        default: return null;
    }
}