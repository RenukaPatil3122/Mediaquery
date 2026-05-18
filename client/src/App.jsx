import { useState, useRef, useEffect } from "react";
import axios from "axios";

export default function App() {
  const [filename, setFilename] = useState("");
  const [uploaded, setUploaded] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [recentDocs, setRecentDocs] = useState([
    {
      name: "Blood Report.pdf",
      date: "Today",
      size: "2.4 MB",
      color: "#ef4444",
    },
    {
      name: "MRI Scan Report.pdf",
      date: "Yesterday",
      size: "4.1 MB",
      color: "#3b82f6",
    },
    {
      name: "Prescription.pdf",
      date: "2 days ago",
      size: "1.2 MB",
      color: "#10b981",
    },
    {
      name: "Chest X-Ray.pdf",
      date: "3 days ago",
      size: "2.8 MB",
      color: "#f59e0b",
    },
  ]);
  const chatEndRef = useRef(null);
  const inputRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function handleUpload(file) {
    if (!file || file.type !== "application/pdf") return;
    setUploading(true);
    const form = new FormData();
    form.append("file", file);
    try {
      await axios.post("http://localhost:8000/upload", form);
      setFilename(file.name);
      setUploaded(true);
      setRecentDocs((prev) => [
        {
          name: file.name,
          date: "Just now",
          size: (file.size / 1024 / 1024).toFixed(1) + " MB",
          color: "#10b981",
        },
        ...prev.slice(0, 4),
      ]);
      setMessages([
        {
          role: "ai",
          text: `✅ Got it! I've fully read "${file.name}" and indexed its contents.\n\nYou can now ask me anything about this document — diagnoses, medications, test results, what terms mean, or anything else. I'll explain it in plain English.`,
        },
      ]);
    } catch {
      alert("Upload failed. Make sure your server is running.");
    }
    setUploading(false);
  }

  async function handleAsk() {
    if (!question.trim() || !uploaded || loading) return;
    const q = question.trim();
    setMessages((prev) => [...prev, { role: "user", text: q }]);
    setQuestion("");
    setLoading(true);
    try {
      const res = await axios.post("http://localhost:8000/ask", {
        question: q,
        filename,
      });
      setMessages((prev) => [...prev, { role: "ai", text: res.data.answer }]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "ai", text: "Something went wrong. Try again." },
      ]);
    }
    setLoading(false);
    inputRef.current?.focus();
  }

  const suggestions = [
    { icon: "🔬", text: "What is the diagnosis?" },
    { icon: "💊", text: "What medications are prescribed?" },
    { icon: "⚠️", text: "Are there any abnormal results?" },
    { icon: "📋", text: "Summarize this report simply" },
    { icon: "❓", text: "What do I need to follow up on?" },
  ];

  const features = [
    {
      icon: "🧠",
      title: "AI-Powered Analysis",
      sub: "Advanced AI understands medical reports",
    },
    {
      icon: "🔒",
      title: "Secure & Private",
      sub: "Your data stays on your machine",
    },
    {
      icon: "⚡",
      title: "Instant Insights",
      sub: "Get answers quickly and accurately",
    },
  ];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&display=swap');
        html, body, #root { width:100%; height:100%; margin:0; padding:0; overflow:hidden; }
        *, *::before, *::after { box-sizing:border-box; margin:0; padding:0; }
        body { font-family:'DM Sans',sans-serif; background:#0b1929; color:#e2e8f0; }
        ::-webkit-scrollbar { width:4px; }
        ::-webkit-scrollbar-thumb { background:#1a3a4a; border-radius:4px; }

        .app { display:flex; width:100vw; height:100vh; overflow:hidden; position:relative; }

        /* animated bg */
        .bg-glow {
          position:fixed; inset:0; pointer-events:none; z-index:0;
          background: radial-gradient(ellipse 80% 60% at 60% 40%, rgba(6,182,212,0.07) 0%, transparent 70%),
                      radial-gradient(ellipse 60% 80% at 20% 80%, rgba(16,185,129,0.05) 0%, transparent 60%);
        }

        /* SIDEBAR */
        .sidebar {
          width:260px; min-width:260px; height:100vh; position:relative; z-index:1;
          background:rgba(10,22,38,0.95);
          border-right:1px solid rgba(6,182,212,0.12);
          display:flex; flex-direction:column;
          overflow-y:auto; overflow-x:hidden;
          backdrop-filter:blur(12px);
        }
        .sidebar-inner { display:flex; flex-direction:column; flex:1; padding:20px 14px; gap:18px; }

        .logo { display:flex; align-items:center; gap:10px; }
        .logo-icon {
          width:40px; height:40px; border-radius:12px; flex-shrink:0;
          background:linear-gradient(135deg,#06b6d4,#10b981);
          display:flex; align-items:center; justify-content:center; font-size:20px;
          box-shadow:0 0 20px rgba(6,182,212,0.35);
          animation:logoPulse 3s ease-in-out infinite;
        }
        @keyframes logoPulse { 0%,100%{box-shadow:0 0 20px rgba(6,182,212,0.35)} 50%{box-shadow:0 0 30px rgba(6,182,212,0.55)} }
        .logo-name { font-size:17px; font-weight:700; color:#f0fdf4; letter-spacing:-0.3px; }
        .logo-tag { font-size:10px; color:#334155; font-weight:400; }

        /* upload card */
        .upload-card {
          background:linear-gradient(135deg,rgba(6,182,212,0.08),rgba(16,185,129,0.05));
          border:1.5px dashed rgba(6,182,212,0.25);
          border-radius:14px; padding:20px 12px; text-align:center;
          cursor:pointer; display:block;
          transition:all 0.25s ease;
        }
        .upload-card:hover, .upload-card.drag {
          border-color:rgba(6,182,212,0.6);
          background:linear-gradient(135deg,rgba(6,182,212,0.14),rgba(16,185,129,0.08));
          transform:translateY(-2px);
          box-shadow:0 8px 24px rgba(6,182,212,0.12);
        }
        .upload-card input { display:none; }
        .upload-card-icon { font-size:28px; margin-bottom:8px; display:block; }
        .upload-card-title { font-size:13px; font-weight:600; color:#06b6d4; margin-bottom:4px; }
        .upload-card-sub { font-size:10px; color:#334155; line-height:1.6; }

        .upload-btn {
          width:100%; padding:11px;
          background:linear-gradient(135deg,#0891b2,#06b6d4);
          border:none; border-radius:10px; color:#fff;
          font-size:13px; font-weight:600; cursor:pointer;
          font-family:'DM Sans',sans-serif;
          display:flex; align-items:center; justify-content:center; gap:7px;
          transition:all 0.2s; position:relative; overflow:hidden;
        }
        .upload-btn::after {
          content:''; position:absolute; inset:0;
          background:linear-gradient(135deg,rgba(255,255,255,0.1),transparent);
          opacity:0; transition:opacity 0.2s;
        }
        .upload-btn:hover { transform:translateY(-1px); box-shadow:0 6px 20px rgba(6,182,212,0.4); }
        .upload-btn:hover::after { opacity:1; }
        .upload-btn:active { transform:translateY(0); }

        .drag-hint { font-size:10px; color:#1e3a4a; text-align:center; }

        .uploaded-pill {
          display:flex; align-items:center; gap:8px;
          background:rgba(16,185,129,0.1); border:1px solid rgba(16,185,129,0.25);
          border-radius:10px; padding:10px 12px;
          animation:slideDown 0.35s cubic-bezier(0.34,1.56,0.64,1);
        }
        @keyframes slideDown { from{opacity:0;transform:translateY(-8px) scale(0.96)} to{opacity:1;transform:translateY(0) scale(1)} }
        .uploaded-pill-name { font-size:11px; font-weight:600; color:#34d399; flex:1; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
        .uploaded-pill-check { color:#34d399; font-size:13px; }

        .spinner { width:22px; height:22px; border:2px solid rgba(6,182,212,0.2); border-top-color:#06b6d4; border-radius:50%; animation:spin 0.7s linear infinite; margin:0 auto 8px; }
        @keyframes spin { to{transform:rotate(360deg)} }

        .section-label { font-size:10px; font-weight:700; color:#1e3a4a; text-transform:uppercase; letter-spacing:0.1em; }

        .recent-list { display:flex; flex-direction:column; gap:2px; }
        .recent-item {
          display:flex; align-items:center; gap:10px;
          padding:9px 10px; cursor:pointer; border-radius:9px;
          transition:all 0.15s;
        }
        .recent-item:hover { background:rgba(6,182,212,0.07); }
        .recent-dot { width:8px; height:8px; border-radius:3px; flex-shrink:0; }
        .recent-info { flex:1; min-width:0; }
        .recent-name { font-size:12px; color:#94a3b8; font-weight:500; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
        .recent-meta { font-size:10px; color:#1e3a4a; margin-top:1px; }
        .recent-more { color:#1e3a4a; font-size:14px; opacity:0; transition:opacity 0.15s; }
        .recent-item:hover .recent-more { opacity:1; }

        .nav-list { display:flex; flex-direction:column; gap:2px; }
        .nav-item {
          display:flex; align-items:center; gap:9px; padding:9px 10px;
          border-radius:9px; cursor:pointer; font-size:13px; color:#334155;
          transition:all 0.15s; font-weight:500;
        }
        .nav-item:hover { background:rgba(6,182,212,0.07); color:#94a3b8; }
        .nav-icon { font-size:14px; }

        .disclaimer {
          margin-top:auto;
          background:rgba(234,179,8,0.06); border:1px solid rgba(234,179,8,0.15);
          border-radius:10px; padding:10px 12px;
          font-size:10px; color:#713f12; line-height:1.6;
        }

        /* MAIN */
        .main { flex:1; display:flex; flex-direction:column; overflow:hidden; min-width:0; position:relative; z-index:1; }

        .topbar {
          padding:13px 24px;
          background:rgba(10,22,38,0.9);
          border-bottom:1px solid rgba(6,182,212,0.1);
          display:flex; align-items:center; justify-content:space-between;
          flex-shrink:0; backdrop-filter:blur(12px);
        }
        .topbar-left { display:flex; align-items:center; gap:10px; }
        .status-dot {
          width:8px; height:8px; border-radius:50%; background:#10b981;
          box-shadow:0 0 0 3px rgba(16,185,129,0.2);
          animation:statusPulse 2s infinite;
        }
        .status-dot.off { background:#1e3a4a; box-shadow:none; animation:none; }
        @keyframes statusPulse { 0%,100%{box-shadow:0 0 0 3px rgba(16,185,129,0.2)} 50%{box-shadow:0 0 0 7px rgba(16,185,129,0.04)} }
        .topbar-text { font-size:13px; color:#334155; font-weight:500; }
        .topbar-file { color:#06b6d4; font-weight:600; }
        .topbar-right { display:flex; align-items:center; gap:10px; }
        .topbar-bell {
          width:34px; height:34px; border-radius:9px;
          background:rgba(6,182,212,0.08); border:1px solid rgba(6,182,212,0.12);
          display:flex; align-items:center; justify-content:center; font-size:15px; cursor:pointer;
          transition:all 0.2s;
        }
        .topbar-bell:hover { background:rgba(6,182,212,0.14); }
        .topbar-avatar {
          width:34px; height:34px; border-radius:10px;
          background:linear-gradient(135deg,#0891b2,#06b6d4);
          display:flex; align-items:center; justify-content:center; font-size:15px;
          box-shadow:0 0 12px rgba(6,182,212,0.3);
        }
        .topbar-user-name { font-size:12px; font-weight:600; color:#cbd5e1; }
        .topbar-user-status { font-size:10px; color:#10b981; }

        /* CHAT */
        .chat-area {
          flex:1; overflow-y:auto;
          padding:28px 32px 16px;
          display:flex; flex-direction:column; gap:16px;
        }

        /* Empty state */
        .empty {
          margin:auto; text-align:center;
          display:flex; flex-direction:column; align-items:center; gap:18px;
          animation:fadeUp 0.5s ease; max-width:520px; width:100%;
        }
        @keyframes fadeUp { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }

        .empty-visual {
          width:130px; height:130px; border-radius:50%;
          background:radial-gradient(circle,rgba(6,182,212,0.12),rgba(11,25,41,0.8));
          border:1px solid rgba(6,182,212,0.2);
          display:flex; align-items:center; justify-content:center; font-size:56px;
          box-shadow:0 0 60px rgba(6,182,212,0.12), inset 0 0 40px rgba(6,182,212,0.05);
          animation:float 3.5s ease-in-out infinite;
          position:relative;
        }
        .empty-visual::before {
          content:''; position:absolute; inset:-12px; border-radius:50%;
          border:1px solid rgba(6,182,212,0.08); animation:ringPulse 3s ease-in-out infinite;
        }
        .empty-visual::after {
          content:''; position:absolute; inset:-24px; border-radius:50%;
          border:1px solid rgba(6,182,212,0.04); animation:ringPulse 3s ease-in-out infinite 0.5s;
        }
        @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)} }
        @keyframes ringPulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.4;transform:scale(1.05)} }

        .empty-icons {
          display:flex; gap:32px; align-items:center; color:#1e3a4a; font-size:22px;
        }

        .empty-title { font-size:26px; font-weight:700; color:#cbd5e1; letter-spacing:-0.5px; line-height:1.2; }
        .empty-title span { color:#06b6d4; }
        .empty-sub { font-size:14px; color:#334155; line-height:1.7; }

        .empty-upload-btn {
          padding:13px 30px;
          background:linear-gradient(135deg,#0891b2,#06b6d4);
          border:none; border-radius:12px; color:#fff;
          font-size:14px; font-weight:600; cursor:pointer;
          font-family:'DM Sans',sans-serif;
          display:flex; align-items:center; gap:8px;
          box-shadow:0 4px 24px rgba(6,182,212,0.35);
          transition:all 0.2s; position:relative; overflow:hidden;
        }
        .empty-upload-btn:hover { transform:translateY(-2px); box-shadow:0 8px 32px rgba(6,182,212,0.5); }
        .empty-upload-btn:active { transform:translateY(0); }

        .drag-drop-label { font-size:12px; color:#1e3a4a; }

        .features { display:flex; gap:10px; width:100%; }
        .feature-card {
          flex:1;
          background:rgba(6,182,212,0.05);
          border:1px solid rgba(6,182,212,0.1);
          border-radius:14px; padding:16px 12px; text-align:center;
          transition:all 0.2s;
        }
        .feature-card:hover { background:rgba(6,182,212,0.09); transform:translateY(-2px); }
        .feature-icon { font-size:22px; margin-bottom:8px; }
        .feature-title { font-size:12px; font-weight:600; color:#4b7a8a; margin-bottom:4px; }
        .feature-sub { font-size:10px; color:#1e3a4a; line-height:1.5; }

        /* Messages */
        .msg { display:flex; flex-direction:column; gap:5px; animation:msgIn 0.25s ease; }
        .msg.user { align-items:flex-end; }
        .msg.ai { align-items:flex-start; }
        @keyframes msgIn { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        .msg-sender { font-size:11px; font-weight:600; color:#1e3a4a; padding:0 4px; }
        .bubble { max-width:70%; padding:13px 16px; font-size:14px; line-height:1.75; border-radius:18px; white-space:pre-wrap; }
        .msg.user .bubble {
          background:linear-gradient(135deg,#0891b2,#06b6d4);
          color:#fff; border-bottom-right-radius:4px;
          box-shadow:0 4px 20px rgba(6,182,212,0.3);
        }
        .msg.ai .bubble {
          background:rgba(6,182,212,0.06);
          color:#cbd5e1; border:1px solid rgba(6,182,212,0.12);
          border-bottom-left-radius:4px;
        }

        .typing-bubble {
          background:rgba(6,182,212,0.06); border:1px solid rgba(6,182,212,0.12);
          border-radius:18px; border-bottom-left-radius:4px;
          padding:14px 18px; display:flex; align-items:center; gap:5px;
        }
        .tdot { width:7px; height:7px; border-radius:50%; background:#06b6d4; animation:tdot 1.2s infinite; }
        .tdot:nth-child(2){animation-delay:.2s} .tdot:nth-child(3){animation-delay:.4s}
        @keyframes tdot{0%,60%,100%{transform:translateY(0);opacity:0.3}30%{transform:translateY(-6px);opacity:1}}

        /* INPUT */
        .input-wrap {
          padding:12px 20px 16px;
          background:rgba(10,22,38,0.95);
          border-top:1px solid rgba(6,182,212,0.1);
          flex-shrink:0; backdrop-filter:blur(12px);
        }
        .suggestions-row { display:flex; gap:7px; flex-wrap:nowrap; overflow-x:auto; margin-bottom:10px; padding-bottom:2px; }
        .suggestions-row::-webkit-scrollbar { height:0; }
        .sug-chip {
          background:rgba(6,182,212,0.07); border:1px solid rgba(6,182,212,0.15);
          border-radius:20px; padding:6px 13px;
          font-size:11px; color:#334155; cursor:pointer; white-space:nowrap;
          font-family:'DM Sans',sans-serif; font-weight:500;
          display:flex; align-items:center; gap:5px;
          transition:all 0.18s; flex-shrink:0;
        }
        .sug-chip:hover { background:rgba(6,182,212,0.14); border-color:rgba(6,182,212,0.35); color:#06b6d4; transform:translateY(-1px); }

        .input-row { display:flex; gap:10px; align-items:flex-end; }
        .input-attach {
          width:42px; height:42px; border-radius:11px; flex-shrink:0;
          background:rgba(6,182,212,0.08); border:1px solid rgba(6,182,212,0.15);
          display:flex; align-items:center; justify-content:center; font-size:18px; cursor:pointer;
          transition:all 0.2s;
        }
        .input-attach:hover { background:rgba(6,182,212,0.14); border-color:rgba(6,182,212,0.35); }
        .input-box {
          flex:1; background:rgba(6,182,212,0.06); border:1.5px solid rgba(6,182,212,0.15);
          border-radius:14px; padding:12px 16px;
          font-size:14px; font-family:'DM Sans',sans-serif;
          color:#e2e8f0; resize:none; outline:none; line-height:1.5; max-height:120px;
          transition:border-color 0.2s, box-shadow 0.2s;
        }
        .input-box:focus { border-color:rgba(6,182,212,0.5); box-shadow:0 0 0 3px rgba(6,182,212,0.08); }
        .input-box::placeholder { color:#1e3a4a; }
        .input-box:disabled { opacity:0.4; }

        .input-right { display:flex; gap:8px; align-items:center; flex-shrink:0; }
        .mic-btn {
          width:42px; height:42px; border-radius:11px;
          background:rgba(6,182,212,0.08); border:1px solid rgba(6,182,212,0.15);
          display:flex; align-items:center; justify-content:center; font-size:18px; cursor:pointer;
          transition:all 0.2s;
        }
        .mic-btn:hover { background:rgba(6,182,212,0.14); }
        .send-btn {
          width:42px; height:42px; border-radius:11px;
          background:linear-gradient(135deg,#0891b2,#06b6d4);
          border:none; cursor:pointer; color:#fff; font-size:18px;
          display:flex; align-items:center; justify-content:center;
          transition:all 0.2s; flex-shrink:0;
          box-shadow:0 4px 14px rgba(6,182,212,0.4);
        }
        .send-btn:hover { transform:scale(1.08); box-shadow:0 6px 22px rgba(6,182,212,0.55); }
        .send-btn:active { transform:scale(0.95); }
        .send-btn:disabled { background:rgba(6,182,212,0.1); box-shadow:none; cursor:default; transform:none; }

        .input-footer { display:flex; justify-content:space-between; margin-top:8px; }
        .input-hint { font-size:10px; color:#1e3a4a; }
        .input-disclaimer { font-size:10px; color:#1e3a4a; }
      `}</style>

      <div className="app">
        <div className="bg-glow" />

        {/* SIDEBAR */}
        <div className="sidebar">
          <div className="sidebar-inner">
            <div className="logo">
              <div className="logo-icon">🏥</div>
              <div>
                <div className="logo-name">MediQuery AI</div>
                <div className="logo-tag">AI Medical Assistant</div>
              </div>
            </div>

            <label
              className={`upload-card ${dragOver ? "drag" : ""}`}
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragOver(false);
                handleUpload(e.dataTransfer.files[0]);
              }}
            >
              <input
                type="file"
                accept=".pdf"
                ref={fileInputRef}
                onChange={(e) => handleUpload(e.target.files[0])}
              />
              {uploading ? (
                <>
                  <div className="spinner" />
                  <div className="upload-card-title">Reading PDF...</div>
                  <div className="upload-card-sub">
                    Extracting and indexing content
                  </div>
                </>
              ) : (
                <>
                  <span className="upload-card-icon">📂</span>
                  <div className="upload-card-title">Upload Medical PDF</div>
                  <div className="upload-card-sub">
                    Lab reports · Discharge summaries
                    <br />
                    Prescriptions · Medical records
                  </div>
                </>
              )}
            </label>

            <button
              className="upload-btn"
              onClick={() => fileInputRef.current?.click()}
            >
              ⬆️ Upload PDF
            </button>
            <div className="drag-hint">or drag and drop your file here</div>

            {uploaded && (
              <div className="uploaded-pill">
                <span>📋</span>
                <span className="uploaded-pill-name">{filename}</span>
                <span className="uploaded-pill-check">✓</span>
              </div>
            )}

            <div className="section-label">Recent Documents</div>
            <div className="recent-list">
              {recentDocs.map((d, i) => (
                <div key={i} className="recent-item">
                  <div className="recent-dot" style={{ background: d.color }} />
                  <div className="recent-info">
                    <div className="recent-name">{d.name}</div>
                    <div className="recent-meta">
                      {d.date} · {d.size}
                    </div>
                  </div>
                  <span className="recent-more">⋯</span>
                </div>
              ))}
            </div>

            <div className="nav-list">
              <div className="nav-item">
                <span className="nav-icon">💬</span> Chat History
              </div>
              <div className="nav-item">
                <span className="nav-icon">📝</span> Templates
              </div>
              <div className="nav-item">
                <span className="nav-icon">⚙️</span> Settings
              </div>
            </div>

            <div className="disclaimer">
              ⚠️ For educational use only. Always consult a qualified doctor for
              medical decisions.
            </div>
          </div>
        </div>

        {/* MAIN */}
        <div className="main">
          <div className="topbar">
            <div className="topbar-left">
              <div className={`status-dot ${uploaded ? "" : "off"}`} />
              <span className="topbar-text">
                {uploaded ? (
                  <>
                    <span className="topbar-file">{filename}</span> · Ready to
                    answer questions
                  </>
                ) : (
                  "No document loaded — upload a PDF to begin"
                )}
              </span>
            </div>
            <div className="topbar-right">
              <div className="topbar-bell">🔔</div>
              <div className="topbar-avatar">🤖</div>
              <div>
                <div className="topbar-user-name">AI Assistant</div>
                <div className="topbar-user-status">● Online</div>
              </div>
            </div>
          </div>

          <div className="chat-area">
            {messages.length === 0 ? (
              <div className="empty">
                <div className="empty-icons">
                  <span>💗</span>
                  <div className="empty-visual">🩺</div>
                  <span>🧪</span>
                </div>
                <div className="empty-title">
                  Upload a <span>medical PDF</span>
                </div>
                <div className="empty-sub">
                  Ask medical questions in plain English.
                  <br />
                  No medical knowledge needed.
                </div>
                <button
                  className="empty-upload-btn"
                  onClick={() => fileInputRef.current?.click()}
                >
                  ⬆️ Upload PDF
                </button>
                <div className="drag-drop-label">or drag and drop here</div>
                <div className="features">
                  {features.map((f, i) => (
                    <div key={i} className="feature-card">
                      <div className="feature-icon">{f.icon}</div>
                      <div className="feature-title">{f.title}</div>
                      <div className="feature-sub">{f.sub}</div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <>
                {messages.map((m, i) => (
                  <div key={i} className={`msg ${m.role}`}>
                    <span className="msg-sender">
                      {m.role === "user" ? "You" : "MediQuery AI"}
                    </span>
                    <div className="bubble">{m.text}</div>
                  </div>
                ))}
                {loading && (
                  <div className="msg ai">
                    <span className="msg-sender">MediQuery AI</span>
                    <div className="typing-bubble">
                      <div className="tdot" />
                      <div className="tdot" />
                      <div className="tdot" />
                    </div>
                  </div>
                )}
              </>
            )}
            <div ref={chatEndRef} />
          </div>

          <div className="input-wrap">
            <div className="suggestions-row">
              {suggestions.map((s, i) => (
                <button
                  key={i}
                  className="sug-chip"
                  onClick={() => {
                    setQuestion(s.text);
                    inputRef.current?.focus();
                  }}
                >
                  {s.icon} {s.text}
                </button>
              ))}
            </div>
            <div className="input-row">
              <div
                className="input-attach"
                onClick={() => fileInputRef.current?.click()}
              >
                📎
              </div>
              <textarea
                ref={inputRef}
                className="input-box"
                rows={1}
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleAsk();
                  }
                }}
                placeholder={
                  uploaded
                    ? "Upload a PDF first or ask a medical question..."
                    : "Upload a PDF first..."
                }
                disabled={loading}
              />
              <div className="input-right">
                <div className="mic-btn">🎤</div>
                <button
                  className="send-btn"
                  onClick={handleAsk}
                  disabled={loading || !question.trim()}
                >
                  ➤
                </button>
              </div>
            </div>
            <div className="input-footer">
              <div className="input-hint">Shift + Enter for new line</div>
              <div className="input-disclaimer">
                AI can make mistakes. Always verify important medical
                information.
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
