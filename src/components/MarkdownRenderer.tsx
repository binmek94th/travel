// src/components/MarkdownRenderer.tsx
"use client";

type Props = { content: string; isUser?: boolean };

export default function MarkdownRenderer({ content, isUser = false }: Props) {
    const textColor        = isUser ? "rgba(255,255,255,0.95)" : "#0A3D52";
    const mutedColor       = isUser ? "rgba(255,255,255,0.75)" : "#1A6A8A";
    const codeColor        = isUser ? "rgba(255,255,255,0.90)" : "#0A3D52";
    const codeBg           = isUser ? "rgba(255,255,255,0.15)" : "rgba(14,133,178,0.08)";
    const hrColor          = isUser ? "rgba(255,255,255,0.20)" : "rgba(14,133,178,0.12)";
    const blockquoteBorder = isUser ? "rgba(255,255,255,0.35)" : "#1E9DC8";
    const tableBorder      = isUser ? "rgba(255,255,255,0.18)" : "rgba(14,133,178,0.14)";
    const tableHeadBg      = isUser ? "rgba(255,255,255,0.12)" : "rgba(14,133,178,0.06)";
    const tableRowAlt      = isUser ? "rgba(255,255,255,0.05)" : "rgba(14,133,178,0.025)";

    const lines = content.split("\n");
    const elements: React.ReactNode[] = [];
    let i = 0;

    // ── Inline parser ──────────────────────────────────────────────────────────

    function parseInline(text: string, key: string | number): React.ReactNode {
        const parts: React.ReactNode[] = [];
        let remaining = text;
        let k = 0;

        while (remaining.length > 0) {
            // **bold**
            const bold = remaining.match(/^(.*?)\*\*(.+?)\*\*(.*)/s);
            if (bold) {
                if (bold[1]) parts.push(<span key={k++}>{parseInline(bold[1], k)}</span>);
                parts.push(<strong key={k++} style={{ fontWeight:700, color:textColor }}>{bold[2]}</strong>);
                remaining = bold[3];
                continue;
            }
            // *italic*
            const italic = remaining.match(/^(.*?)\*(.+?)\*(.*)/s);
            if (italic) {
                if (italic[1]) parts.push(<span key={k++}>{parseInline(italic[1], k)}</span>);
                parts.push(<em key={k++} style={{ fontStyle:"italic" }}>{italic[2]}</em>);
                remaining = italic[3];
                continue;
            }
            // `code`
            const code = remaining.match(/^(.*?)`(.+?)`(.*)/s);
            if (code) {
                if (code[1]) parts.push(<span key={k++}>{parseInline(code[1], k)}</span>);
                parts.push(
                    <code key={k++} style={{ fontSize:"0.8em", fontFamily:"monospace", background:codeBg, color:codeColor, padding:"1px 5px", borderRadius:4 }}>
                        {code[2]}
                    </code>
                );
                remaining = code[3];
                continue;
            }
            // [text](url)
            const link = remaining.match(/^(.*?)\[(.+?)\]\((.+?)\)(.*)/s);
            if (link) {
                if (link[1]) parts.push(<span key={k++}>{parseInline(link[1], k)}</span>);
                parts.push(
                    <a key={k++} href={link[3]} target="_blank" rel="noopener noreferrer"
                       style={{ color:isUser ? "rgba(255,255,255,0.90)" : "#1E9DC8", textDecoration:"underline" }}>
                        {link[2]}
                    </a>
                );
                remaining = link[4];
                continue;
            }
            parts.push(<span key={k++}>{remaining}</span>);
            break;
        }
        return parts.length === 1 ? parts[0] : <>{parts}</>;
    }

    // ── Table detector ─────────────────────────────────────────────────────────
    // A table block starts with a pipe-delimited header row, then an alignment
    // row (---|:---|:---:), then zero or more data rows — all starting with |

    function isTableRow(line: string) {
        return line.trim().startsWith("|") && line.trim().endsWith("|");
    }

    function isSeparatorRow(line: string) {
        return isTableRow(line) && /^[|\s\-:]+$/.test(line);
    }

    function parseTableRow(line: string): string[] {
        return line
            .trim()
            .replace(/^\||\|$/g, "")   // strip leading/trailing pipes
            .split("|")
            .map(cell => cell.trim());
    }

    function parseAlignment(sepRow: string): ("left" | "center" | "right")[] {
        return parseTableRow(sepRow).map(cell => {
            if (cell.startsWith(":") && cell.endsWith(":")) return "center";
            if (cell.endsWith(":"))                          return "right";
            return "left";
        });
    }

    // ── Main loop ──────────────────────────────────────────────────────────────

    while (i < lines.length) {
        const line = lines[i];

        if (line.trim() === "") { i++; continue; }

        // ── Table ────────────────────────────────────────────────────────────────
        if (isTableRow(line) && i + 1 < lines.length && isSeparatorRow(lines[i + 1])) {
            const headers    = parseTableRow(line);
            const alignments = parseAlignment(lines[i + 1]);
            i += 2; // skip header + separator

            const rows: string[][] = [];
            while (i < lines.length && isTableRow(lines[i])) {
                rows.push(parseTableRow(lines[i]));
                i++;
            }

            elements.push(
                <div key={`table-${i}`} style={{ overflowX:"auto", margin:"8px 0" }}>
                    <table style={{ borderCollapse:"collapse", width:"100%", fontSize:"0.82rem" }}>
                        <thead>
                        <tr>
                            {headers.map((header, j) => (
                                <th
                                    key={j}
                                    style={{
                                        background:   tableHeadBg,
                                        border:       `1px solid ${tableBorder}`,
                                        padding:      "7px 12px",
                                        textAlign:    alignments[j] ?? "left",
                                        fontWeight:   700,
                                        color:        textColor,
                                        whiteSpace:   "nowrap",
                                        letterSpacing:"0.01em",
                                    }}
                                >
                                    {parseInline(header, `th-${j}`)}
                                </th>
                            ))}
                        </tr>
                        </thead>
                        <tbody>
                        {rows.map((row, ri) => (
                            <tr key={ri} style={{ background: ri % 2 === 1 ? tableRowAlt : "transparent" }}>
                                {headers.map((_, ci) => (
                                    <td
                                        key={ci}
                                        style={{
                                            border:    `1px solid ${tableBorder}`,
                                            padding:   "6px 12px",
                                            textAlign: alignments[ci] ?? "left",
                                            color:     ci === 0 ? textColor : mutedColor,
                                            lineHeight:1.55,
                                        }}
                                    >
                                        {parseInline(row[ci] ?? "", `td-${ri}-${ci}`)}
                                    </td>
                                ))}
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>
            );
            continue;
        }

        // ── h1 ───────────────────────────────────────────────────────────────────
        if (line.startsWith("# ")) {
            elements.push(
                <h1 key={i} style={{ fontSize:"1.05rem", fontWeight:700, color:textColor, margin:"6px 0 10px", fontFamily:"'Playfair Display',serif", letterSpacing:"-0.015em" }}>
                    {parseInline(line.slice(2), i)}
                </h1>
            );
            i++; continue;
        }

        // ── h2 ───────────────────────────────────────────────────────────────────
        if (line.startsWith("## ")) {
            elements.push(
                <h2 key={i} style={{ fontSize:"0.95rem", fontWeight:700, color:textColor, margin:"16px 0 5px", fontFamily:"'Playfair Display',serif", letterSpacing:"-0.01em", borderBottom:`1px solid ${hrColor}`, paddingBottom:4 }}>
                    {parseInline(line.slice(3), i)}
                </h2>
            );
            i++; continue;
        }

        // ── h3 ───────────────────────────────────────────────────────────────────
        if (line.startsWith("### ")) {
            elements.push(
                <h3 key={i} style={{ fontSize:"0.87rem", fontWeight:700, color:textColor, margin:"14px 0 4px", fontFamily:"'Playfair Display',serif", letterSpacing:"-0.01em" }}>
                    {parseInline(line.slice(4), i)}
                </h3>
            );
            i++; continue;
        }

        // ── HR ───────────────────────────────────────────────────────────────────
        if (/^---+$/.test(line.trim())) {
            elements.push(<hr key={i} style={{ border:"none", borderTop:`1px solid ${hrColor}`, margin:"10px 0" }}/>);
            i++; continue;
        }

        // ── Blockquote ───────────────────────────────────────────────────────────
        if (line.startsWith("> ")) {
            elements.push(
                <div key={i} style={{ borderLeft:`3px solid ${blockquoteBorder}`, paddingLeft:10, margin:"6px 0", opacity:0.85 }}>
                    <p style={{ margin:0, fontSize:"0.83rem", color:mutedColor, fontStyle:"italic", lineHeight:1.6 }}>
                        {parseInline(line.slice(2), i)}
                    </p>
                </div>
            );
            i++; continue;
        }

        // ── Unordered list ────────────────────────────────────────────────────────
        if (/^[-*] /.test(line)) {
            const items: string[] = [];
            while (i < lines.length && /^[-*] /.test(lines[i])) {
                items.push(lines[i].replace(/^[-*] /, ""));
                i++;
            }
            elements.push(
                <ul key={`ul-${i}`} style={{ margin:"5px 0", padding:0, display:"flex", flexDirection:"column", gap:3 }}>
                    {items.map((item, j) => (
                        <li key={j} style={{ fontSize:"0.83rem", color:textColor, lineHeight:1.6, listStyleType:"none", display:"flex", gap:7, alignItems:"flex-start" }}>
                            <span style={{ color:isUser ? "rgba(255,255,255,0.60)" : "#1E9DC8", flexShrink:0, marginTop:3, fontSize:"0.55rem" }}>●</span>
                            <span>{parseInline(item, j)}</span>
                        </li>
                    ))}
                </ul>
            );
            continue;
        }

        // ── Ordered list ──────────────────────────────────────────────────────────
        if (/^\d+\. /.test(line)) {
            const items: { n: string; text: string }[] = [];
            while (i < lines.length && /^\d+\. /.test(lines[i])) {
                const m = lines[i].match(/^(\d+)\. (.*)/);
                if (m) items.push({ n:m[1], text:m[2] });
                i++;
            }
            elements.push(
                <ol key={`ol-${i}`} style={{ margin:"5px 0", padding:0, display:"flex", flexDirection:"column", gap:4 }}>
                    {items.map((item, j) => (
                        <li key={j} style={{ fontSize:"0.83rem", color:textColor, lineHeight:1.6, listStyleType:"none", display:"flex", gap:8, alignItems:"flex-start" }}>
              <span style={{ minWidth:18, height:18, borderRadius:"50%", background:isUser ? "rgba(255,255,255,0.22)" : "linear-gradient(135deg,#28B8E8,#0A6A94)", color:"white", fontSize:"0.6rem", fontWeight:700, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, marginTop:2 }}>
                {item.n}
              </span>
                            <span>{parseInline(item.text, j)}</span>
                        </li>
                    ))}
                </ol>
            );
            continue;
        }

        // ── Paragraph ─────────────────────────────────────────────────────────────
        elements.push(
            <p key={i} style={{ margin:"3px 0", fontSize:"0.83rem", color:textColor, lineHeight:1.65 }}>
                {parseInline(line, i)}
            </p>
        );
        i++;
    }

    return <div style={{ display:"flex", flexDirection:"column", gap:2 }}>{elements}</div>;
}