// Shared styles used by both login and signup pages
export const formStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400&family=Lato:wght@300;400;700&display=swap');

  :root {
    --sea-top:   #1E9DC8;
    --sea-mid:   #0E85B2;
    --sea-deep:  #0A6A94;
    --text-dark: #0A3D52;
    --text-mid:  #1A6A8A;
    --sky-light: #C8F0FF;
    --border:    rgba(14,133,178,0.2);
    --border-h:  rgba(14,133,178,0.55);
  }

  /* Tab pills */
  .tab-pills {
    display: flex; gap: 5px;
    background: rgba(255,255,255,0.6);
    border: 1px solid rgba(14,133,178,0.15);
    border-radius: 40px; padding: 4px;
    margin-bottom: 2.2rem;
    backdrop-filter: blur(8px);
    box-shadow: 0 2px 12px rgba(14,133,178,0.08);
  }

  .pill {
    flex: 1; padding: 0.52rem; border-radius: 30px; border: none;
    background: none; color: rgba(10,61,82,0.35);
    font-family: 'Lato', sans-serif; font-size: 0.82rem; font-weight: 400;
    cursor: pointer; transition: all 0.25s; letter-spacing: 0.02em;
    text-align: center; text-decoration: none; display: block;
  }

  .pill.active {
    background: linear-gradient(135deg, var(--sea-top), var(--sea-mid));
    color: #fff;
    box-shadow: 0 3px 10px rgba(14,133,178,0.35);
  }

  /* Card */
  .card { display: flex; flex-direction: column; gap: 1.15rem; animation: rise 0.45s cubic-bezier(0.22,1,0.36,1) both; }

  @keyframes rise {
    from { opacity: 0; transform: translateY(14px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  .card-title {
    font-family: 'Playfair Display', serif;
    font-size: 1.95rem; font-weight: 400;
    color: var(--text-dark); line-height: 1.1;
  }

  .card-sub { margin-top: 0.28rem; font-size: 0.82rem; color: var(--text-mid); font-weight: 300; }

  /* Google */
  .google-btn {
    display: flex; align-items: center; justify-content: center;
    gap: 0.7rem; width: 100%;
    padding: 0.75rem 1.2rem; border-radius: 12px;
    border: 1px solid rgba(14,133,178,0.18);
    background: rgba(255,255,255,0.85);
    color: var(--text-dark);
    font-family: 'Lato', sans-serif; font-size: 0.87rem; font-weight: 400;
    cursor: pointer; transition: all 0.2s;
    backdrop-filter: blur(6px);
    box-shadow: 0 2px 8px rgba(14,133,178,0.08);
  }
  .google-btn:hover:not(:disabled) {
    border-color: rgba(14,133,178,0.4);
    background: rgba(255,255,255,0.95);
    box-shadow: 0 4px 14px rgba(14,133,178,0.14);
    transform: translateY(-1px);
  }
  .google-btn:disabled { opacity: 0.5; cursor: not-allowed; }

  /* Wave divider */
  .wave-div { display: flex; align-items: center; gap: 0.7rem; }
  .wave-line { flex: 1; height: 1px; background: rgba(14,133,178,0.15); }
  .wave-mid {
    display: flex; align-items: center;
    font-size: 0.7rem; color: rgba(10,61,82,0.38);
    white-space: nowrap; font-weight: 400; letter-spacing: 0.04em;
  }

  /* Error */
  .err-box {
    display: flex; align-items: center; gap: 0.55rem;
    padding: 0.65rem 0.85rem; border-radius: 10px;
    border: 1px solid rgba(14,133,178,0.25);
    background: rgba(200,240,255,0.5);
    font-size: 0.8rem; color: var(--text-dark);
    animation: rise 0.3s ease both;
  }
  .err-close { margin-left: auto; background: none; border: none; color: var(--text-mid); cursor: pointer; font-size: 1rem; }

  /* Fields */
  .fields { display: flex; flex-direction: column; gap: 0.85rem; }
  .fg { display: flex; flex-direction: column; gap: 0.38rem; }

  .flabel { font-size: 0.71rem; font-weight: 700; color: var(--text-mid); letter-spacing: 0.06em; text-transform: uppercase; }
  .flabel-row { display: flex; align-items: center; justify-content: space-between; }

  .flink { font-size: 0.71rem; color: var(--sea-top); text-decoration: none; font-weight: 400; transition: color 0.15s; }
  .flink:hover { color: var(--sea-mid); }

  .fw { position: relative; }
  .fw--icon .fi { padding-right: 2.6rem; }

  .fi {
    width: 100%; padding: 0.72rem 0.95rem;
    border-radius: 11px;
    border: 1.5px solid rgba(14,133,178,0.2);
    background: rgba(255,255,255,0.75);
    color: #0A3D52;
    font-family: 'Lato', sans-serif; font-size: 0.88rem; font-weight: 400;
    outline: none;
    transition: border-color 0.2s, box-shadow 0.2s, background 0.2s;
    box-shadow: 0 1px 4px rgba(14,133,178,0.06);
  }
  .fi::placeholder { color: rgba(10,61,82,0.28); }
  .fi:focus {
    border-color: var(--sea-top);
    background: rgba(255,255,255,0.95);
    box-shadow: 0 0 0 3px rgba(30,157,200,0.12), 0 2px 8px rgba(14,133,178,0.1);
  }

  .fi-btn {
    position: absolute; right: 0.75rem; top: 50%; transform: translateY(-50%);
    background: none; border: none;
    color: rgba(14,133,178,0.4); cursor: pointer;
    display: flex; align-items: center; padding: 0.2rem; transition: color 0.15s;
  }
  .fi-btn:hover { color: var(--sea-mid); }

  /* Password strength */
  .sw { display: flex; align-items: center; gap: 0.55rem; margin-top: 0.28rem; }
  .sbars { display: flex; gap: 3px; flex: 1; }
  .sbar { height: 3px; flex: 1; border-radius: 2px; background: rgba(14,133,178,0.12); transition: background 0.3s; }
  .s1 { background: #E07A5F; }
  .s2 { background: #F2CC60; }
  .s3 { background: #3DA88A; }
  .s4 { background: #1A9DC8; }
  .slabel { font-size: 0.68rem; font-weight: 700; letter-spacing: 0.04em; }

  /* Checkbox */
  .chk-label { display: flex; align-items: flex-start; gap: 0.6rem; cursor: pointer; }
  .chk-box {
    width: 18px; height: 18px; border-radius: 6px;
    border: 1.5px solid rgba(14,133,178,0.28);
    background: rgba(255,255,255,0.7);
    flex-shrink: 0; margin-top: 1px;
    display: flex; align-items: center; justify-content: center;
    transition: all 0.2s;
  }
  .chk-box.on { background: var(--sea-top); border-color: var(--sea-top); }
  .chk-text { font-size: 0.79rem; color: var(--text-mid); font-weight: 300; line-height: 1.55; }
  .chk-text a { color: var(--sea-top); text-decoration: none; font-weight: 400; }

  /* Submit */
  .sub-btn {
    width: 100%; padding: 0.82rem 1.2rem; margin-top: 0.1rem;
    border-radius: 12px; border: none;
    background: linear-gradient(135deg, #28B8E8 0%, #0E85B2 60%, #0A6A94 100%);
    color: #fff;
    font-family: 'Lato', sans-serif; font-size: 0.88rem; font-weight: 700;
    letter-spacing: 0.05em; cursor: pointer;
    transition: opacity 0.2s, transform 0.15s, box-shadow 0.2s;
    min-height: 46px; display: flex; align-items: center; justify-content: center;
    box-shadow: 0 4px 20px rgba(14,133,178,0.4);
  }
  .sub-btn:hover:not(:disabled) { opacity: 0.92; transform: translateY(-2px); box-shadow: 0 8px 28px rgba(14,133,178,0.45); }
  .sub-btn:active:not(:disabled) { transform: translateY(0); }
  .sub-btn:disabled { opacity: 0.45; cursor: not-allowed; }

  /* Spinner */
  .spin {
    display: inline-block; width: 16px; height: 16px;
    border: 2px solid rgba(255,255,255,0.35);
    border-top-color: #fff; border-radius: 50%;
    animation: sp 0.7s linear infinite;
  }
  @keyframes sp { to { transform: rotate(360deg); } }

  /* Footer */
  .form-footer { text-align: center; font-size: 0.8rem; color: rgba(10,61,82,0.45); font-weight: 300; padding-top: 0.1rem; }
  .form-link { color: var(--sea-top); text-decoration: none; font-weight: 400; }
  .form-link:hover { color: var(--sea-mid); }
`;

/* ── Shared components ── */

export function WaveDivider() {
  return (
    <div className="wave-div">
      <span className="wave-line" />
      <span className="wave-mid">
        <svg width="20" height="8" viewBox="0 0 20 8" fill="none" style={{ marginRight: 5 }}>
          <path d="M0 4 Q5 0 10 4 Q15 8 20 4" stroke="rgba(14,133,178,0.35)" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
        </svg>
        or continue with email
      </span>
      <span className="wave-line" />
    </div>
  );
}

export function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/>
      <path d="M3.964 10.706A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.706V4.962H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.038l3.007-2.332z" fill="#FBBC05"/>
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.962L3.964 7.294C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
    </svg>
  );
}

export function EyeOn() {
  return <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M1 8s2.5-5 7-5 7 5 7 5-2.5 5-7 5-7-5-7-5z"/><circle cx="8" cy="8" r="2"/></svg>;
}

export function EyeOff() {
  return <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M2 2l12 12M6.7 6.7A2 2 0 008 10a2 2 0 002-2 2 2 0 00-.3-1"/><path d="M9.9 9.9C9.2 10.6 8.6 11 8 11c-4 0-6.5-3-7-5 .3-1 .9-2 1.7-2.8M4 4C5.2 3.4 6.5 3 8 3c4.5 0 7 5 7 5-.4 1-1.1 2.1-2.1 3"/></svg>;
}

export function ErrorBox({ message, onDismiss }: { message: string; onDismiss: () => void }) {
  return (
    <div className="err-box" role="alert">
      <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
        <circle cx="7" cy="7" r="6.5" stroke="#1A6A8A" strokeWidth="1"/>
        <path d="M7 4v3.5M7 10h.01" stroke="#1A6A8A" strokeWidth="1.4" strokeLinecap="round"/>
      </svg>
      <span>{message}</span>
      <button onClick={onDismiss} className="err-close" aria-label="Dismiss">×</button>
    </div>
  );
}
