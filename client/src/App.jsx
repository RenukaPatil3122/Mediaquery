import { useState, useRef, useEffect } from "react";
import axios from "axios";

function Toggle({ checked, onChange }) {
  return (
    <div
      onClick={onChange}
      style={{
        width: 40,
        height: 22,
        borderRadius: 11,
        flexShrink: 0,
        cursor: "pointer",
        background: checked ? "rgba(56,217,198,0.25)" : "#2E4A60",
        position: "relative",
        transition: "background 0.25s",
      }}
    >
      <div
        style={{
          position: "absolute",
          width: 16,
          height: 16,
          borderRadius: "50%",
          top: 3,
          left: checked ? 21 : 3,
          background: checked ? "#38D9C6" : "#5C7D96",
          transition: "left 0.25s, background 0.25s",
        }}
      />
    </div>
  );
}

export default function App() {
  const [showSettings, setShowSettings] = useState(false);
  const [settings, setSettings] = useState({
    saveHistory: true,
    showRecentDocs: true,
    autoClear: false,
    autoScroll: true,
    showChips: true,
    compactMode: false,
    notifyUpload: true,
    notifyResponse: false,
    notifyError: true,
    fontSize: "medium",
    serverUrl: "http://localhost:8000",
    activeTab: "profile",
  });
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [showAllDocs, setShowAllDocs] = useState(false);
  const [filename, setFilename] = useState("");
  const [uploaded, setUploaded] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [recentDocs, setRecentDocs] = useState([]);
  const [chatSessions, setChatSessions] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
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
      if (messages.length > 1) {
        setChatSessions((prev) =>
          [
            {
              id: Date.now(),
              filename: filename,
              date: new Date().toLocaleString(),
              messages: messages,
            },
            ...prev,
          ].slice(0, 20),
        );
      }
      await axios.post(`${settings.serverUrl}/upload`, form);
      setFilename(file.name);
      setUploaded(true);
      const tag = file.name.toLowerCase().includes("lab")
        ? "LAB"
        : file.name.toLowerCase().includes("mri")
          ? "MRI"
          : file.name.toLowerCase().includes("xray")
            ? "XRAY"
            : file.name.toLowerCase().includes("prescription")
              ? "RX"
              : "DOC";

      const newDoc = {
        name: file.name,
        date: "Just now",
        size: (file.size / 1024 / 1024).toFixed(1) + " MB",
        tag,
      };

      setRecentDocs((prev) => {
        const filtered = prev.filter((d) => d.name !== file.name);
        return [newDoc, ...filtered].slice(0, 5);
      });
      setMessages([
        {
          role: "ai",
          text: `✅ Loaded "${file.name}" successfully.\n\nI've indexed the full contents. Ask me anything — diagnoses, medications, test results, what medical terms mean. I'll explain everything in plain English.`,
        },
      ]);
      setNotifications((prev) =>
        [
          {
            id: Date.now(),
            icon: "📋",
            title: "PDF Uploaded",
            text: file.name,
            time: "Just now",
            unread: true,
          },
          ...prev,
        ].slice(0, 20),
      );
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
      const res = await axios.post(`${settings.serverUrl}/ask`, {
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
  function restoreSession(session) {
    setFilename(session.filename);
    setUploaded(true);
    setMessages(session.messages);
    setShowHistory(false);
  }

  const chips = [
    { icon: "🔬", text: "What is the diagnosis?" },
    { icon: "💊", text: "Medications prescribed?" },
    { icon: "⚠️", text: "Any abnormal results?" },
    { icon: "📋", text: "Summarize simply" },
    { icon: "❓", text: "What to follow up on?" },
  ];

  const templates = [
    {
      icon: "🧪",
      title: "Lab Report Pack",
      desc: "For blood tests & lab results",
      questions: [
        "What are the abnormal values?",
        "What does CBC mean?",
        "Are my kidney levels normal?",
        "What should I do about these results?",
      ],
    },
    {
      icon: "💊",
      title: "Prescription Pack",
      desc: "For medication & prescriptions",
      questions: [
        "Medications prescribed?",
        "What are the side effects?",
        "How often should I take these?",
        "Are there any drug interactions?",
      ],
    },
    {
      icon: "🏥",
      title: "Discharge Summary Pack",
      desc: "For hospital discharge papers",
      questions: [
        "What is the diagnosis?",
        "What are the follow-up instructions?",
        "What symptoms should I watch for?",
        "When should I return to the hospital?",
      ],
    },
    {
      icon: "🧠",
      title: "General Pack",
      desc: "For any medical document",
      questions: [
        "Summarize simply",
        "What to follow up on?",
        "Is anything urgent here?",
        "What should I ask my doctor?",
      ],
    },
  ];
  // Settings style helpers (put above return)
  const sectionLabel = {
    fontSize: "9.5px",
    fontWeight: 700,
    color: "#5C7D96",
    textTransform: "uppercase",
    letterSpacing: "0.14em",
    marginBottom: 10,
  };
  const fieldLabel = { fontSize: "11px", color: "#5C7D96", marginBottom: 4 };
  const rowLabel = { fontSize: "12.5px", color: "#EEF6FF", fontWeight: 500 };
  const rowSub = { fontSize: "11px", color: "#5C7D96", marginTop: 2 };
  const settingRow = {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "11px 13px",
    background: "rgba(15,28,48,0.7)",
    border: "1px solid rgba(56,217,198,0.08)",
    borderRadius: 10,
    marginBottom: 6,
  };
  const inputStyle = {
    background: "#172438",
    border: "1px solid rgba(56,217,198,0.15)",
    borderRadius: 8,
    color: "#EEF6FF",
    fontSize: 12,
    padding: "7px 11px",
    fontFamily: "Plus Jakarta Sans,sans-serif",
    outline: "none",
  };
  const selectStyle = {
    background: "#172438",
    border: "1px solid rgba(56,217,198,0.15)",
    borderRadius: 8,
    color: "#EEF6FF",
    fontSize: 12,
    padding: "6px 10px",
    fontFamily: "Plus Jakarta Sans,sans-serif",
    outline: "none",
    cursor: "pointer",
  };
  const dangerBtn = {
    padding: "6px 14px",
    borderRadius: 8,
    fontSize: 11.5,
    fontWeight: 600,
    cursor: "pointer",
    fontFamily: "Plus Jakarta Sans,sans-serif",
    border: "1px solid rgba(248,113,113,0.25)",
    background: "rgba(248,113,113,0.07)",
    color: "#F87171",
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&family=Outfit:wght@400;600;700;800&display=swap');

        :root {
          --bg:      #070D18;
          --surf:    #0F1C30;
          --surf2:   #132035;
          --card:    #172438;
          --card2:   #1C2C42;
          --border:  rgba(56,217,198,0.10);
          --border2: rgba(56,217,198,0.24);
          --border3: rgba(56,217,198,0.38);
          --pri:     #38D9C6;
          --pri2:    #0FA89A;
          --pri3:    #0D8F83;
          --glow:    rgba(56,217,198,0.22);
          --acc:     #7C8CF8;
          --acc2:    #5EEAD4;
          --warn:    #F59E0B;
          --t1:      #EEF6FF;
          --t2:      #9BB8D0;
          --t3:      #5C7D96;
          --t4:      #2E4A60;
        }

        html,body,#root{width:100%;height:100%;margin:0;padding:0;overflow:hidden;}
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
        body{font-family:'Plus Jakarta Sans',sans-serif;background:var(--bg);color:var(--t1);}
        ::-webkit-scrollbar{width:3px;}
        ::-webkit-scrollbar-thumb{background:rgba(56,217,198,0.18);border-radius:8px;}

        .app{display:flex;width:100vw;height:100vh;overflow:hidden;position:relative;}

        /* BG */
        .bg-layer{
          position:fixed;inset:0;z-index:0;pointer-events:none;
          background:
            radial-gradient(ellipse 70% 50% at 12% 0%,rgba(56,217,198,0.09) 0%,transparent 60%),
            radial-gradient(ellipse 55% 45% at 95% 10%,rgba(124,140,248,0.07) 0%,transparent 55%),
            radial-gradient(ellipse 45% 60% at 85% 95%,rgba(56,217,198,0.06) 0%,transparent 55%),
            radial-gradient(ellipse 35% 35% at 5% 85%,rgba(94,234,212,0.05) 0%,transparent 50%),
            #070D18;
        }
        .grid-layer{
          position:fixed;inset:0;z-index:0;pointer-events:none;
          background-image:
            linear-gradient(rgba(56,217,198,0.028) 1px,transparent 1px),
            linear-gradient(90deg,rgba(56,217,198,0.028) 1px,transparent 1px);
          background-size:52px 52px;
          mask-image:radial-gradient(ellipse 75% 75% at 60% 50%,black 0%,transparent 100%);
        }
        .orb{position:fixed;border-radius:50%;pointer-events:none;filter:blur(90px);animation:orbDrift ease-in-out infinite;z-index:0;}
        .orb1{width:480px;height:480px;background:rgba(56,217,198,0.055);top:-140px;left:-100px;animation-duration:20s;}
        .orb2{width:360px;height:360px;background:rgba(124,140,248,0.045);bottom:-80px;right:-60px;animation-duration:25s;animation-delay:5s;}
        .orb3{width:260px;height:260px;background:rgba(94,234,212,0.038);top:35%;right:22%;animation-duration:17s;animation-delay:10s;}
        @keyframes orbDrift{0%,100%{transform:translate(0,0) scale(1);}33%{transform:translate(28px,-35px) scale(1.04);}66%{transform:translate(-18px,22px) scale(0.97);}}

        /* SIDEBAR */
        .sb{
          width:252px;min-width:252px;height:100vh;z-index:20;
          display:flex;flex-direction:column;overflow:hidden;flex-shrink:0;
          background:rgba(7,13,24,0.96);
          border-right:1px solid var(--border);
          backdrop-filter:blur(40px) saturate(1.8);
          position:relative;
        }
        .sb::after{
          content:'';position:absolute;top:12%;right:-1px;width:1px;height:76%;
          background:linear-gradient(180deg,transparent,rgba(56,217,198,0.35) 35%,rgba(56,217,198,0.35) 65%,transparent);
          pointer-events:none;
        }
        .sbi{flex:1;display:flex;flex-direction:column;padding:20px 14px 16px;gap:0;overflow-y:auto;overflow-x:hidden;}
        .sbi::-webkit-scrollbar{width:0;}

        .logo{display:flex;align-items:center;gap:11px;padding:2px 4px 20px;}
        .logo-ico{
          width:40px;height:40px;border-radius:12px;flex-shrink:0;
          background:linear-gradient(135deg,var(--pri3),var(--pri));
          display:flex;align-items:center;justify-content:center;font-size:19px;
          box-shadow:0 0 0 1px rgba(56,217,198,0.35),0 6px 22px rgba(56,217,198,0.3);
          animation:logoPulse 4s ease-in-out infinite;
        }
        @keyframes logoPulse{0%,100%{box-shadow:0 0 0 1px rgba(56,217,198,0.35),0 6px 22px rgba(56,217,198,0.3);}50%{box-shadow:0 0 0 1px rgba(56,217,198,0.55),0 6px 32px rgba(56,217,198,0.5);}}
        .logo-name{font-size:15px;font-weight:700;color:var(--t1);letter-spacing:-0.4px;}
        .logo-sub{font-size:10.5px;color:var(--t2);margin-top:2px;}

        .sdiv{height:1px;background:linear-gradient(90deg,transparent,var(--border2),transparent);margin:14px 0;}

        /* Upload zone */
        .upload-zone{
          background:linear-gradient(160deg,rgba(56,217,198,0.07) 0%,rgba(15,28,48,0.5) 100%);
          border:1.5px dashed rgba(56,217,198,0.22);border-radius:14px;
          padding:20px 14px 17px;text-align:center;cursor:pointer;display:block;
          position:relative;overflow:hidden;margin-bottom:10px;
          transition:all 0.3s cubic-bezier(0.34,1.56,0.64,1);
        }
        .upload-zone::before{
          content:'';position:absolute;inset:0;
          background:radial-gradient(circle at 50% -10%,rgba(56,217,198,0.14),transparent 65%);
          opacity:0;transition:opacity 0.3s;
        }
        .upload-zone:hover::before,.upload-zone.drag::before{opacity:1;}
        .upload-zone:hover,.upload-zone.drag{border-color:rgba(56,217,198,0.5);transform:translateY(-2px);box-shadow:0 10px 36px rgba(56,217,198,0.12);}
        .upload-zone input{display:none;}
        .uz-icon{font-size:28px;margin-bottom:8px;display:block;animation:iconFloat 3s ease-in-out infinite;}
        @keyframes iconFloat{0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)}}
        .uz-title{font-size:12.5px;font-weight:700;color:var(--pri);margin-bottom:4px;}
        .uz-sub{font-size:11px;color:var(--t2);line-height:1.65;}

        .up-btn{
          width:100%;padding:11px 16px;margin-bottom:7px;
          background:linear-gradient(135deg,var(--pri3),var(--pri));
          border:none;border-radius:11px;color:#fff;
          font-size:13px;font-weight:700;cursor:pointer;font-family:'Plus Jakarta Sans',sans-serif;
          display:flex;align-items:center;justify-content:center;gap:7px;
          box-shadow:0 4px 24px rgba(56,217,198,0.34),inset 0 1px 0 rgba(255,255,255,0.15);
          transition:all 0.22s;
        }
        .up-btn:hover{transform:translateY(-2px);box-shadow:0 8px 36px rgba(56,217,198,0.52),inset 0 1px 0 rgba(255,255,255,0.2);}
        .up-btn:active{transform:scale(0.98);}

        .dh{font-size:10.5px;color:var(--t3);text-align:center;margin-bottom:14px;}

        .up-pill{
          display:flex;align-items:center;gap:9px;
          background:rgba(56,217,198,0.08);border:1px solid rgba(56,217,198,0.22);
          border-radius:10px;padding:10px 12px;margin-bottom:12px;
          animation:popIn 0.4s cubic-bezier(0.34,1.56,0.64,1);
        }
        @keyframes popIn{from{opacity:0;transform:scale(0.9) translateY(-8px)}to{opacity:1;transform:scale(1) translateY(0)}}
        .up-fname{font-size:11.5px;font-weight:600;color:var(--acc2);flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}

        .spin{width:20px;height:20px;border:2px solid rgba(56,217,198,0.12);border-top-color:var(--pri);border-radius:50%;animation:spin 0.7s linear infinite;margin:0 auto 10px;}
        @keyframes spin{to{transform:rotate(360deg)}}

        .sec-label{font-size:9.5px;font-weight:700;color:var(--t3);text-transform:uppercase;letter-spacing:0.14em;display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;}
        .sec-action{font-size:10px;color:var(--pri);cursor:pointer;font-weight:500;text-transform:none;letter-spacing:0;opacity:0.8;}
        .sec-action:hover{opacity:1;}

        .doc-list{display:flex;flex-direction:column;gap:2px;margin-bottom:14px;}
        .doc-item{display:flex;align-items:center;gap:9px;padding:8px 9px;cursor:pointer;border-radius:10px;transition:all 0.18s;}
        .doc-item:hover{background:rgba(56,217,198,0.07);}
        .doc-tag{
          width:32px;height:32px;border-radius:8px;flex-shrink:0;
          background:var(--surf2);border:1px solid var(--border);
          display:flex;align-items:center;justify-content:center;
          font-size:8px;font-weight:800;color:var(--pri);letter-spacing:0.04em;
        }
        .doc-info{flex:1;min-width:0;}
        .doc-name{font-size:11.5px;color:var(--t1);font-weight:500;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
        .doc-meta{font-size:10px;color:var(--t2);margin-top:1.5px;}
        .doc-dots{color:var(--t3);font-size:16px;opacity:0;transition:opacity 0.15s;}
        .doc-item:hover .doc-dots{opacity:1;}

        .nav-list{display:flex;flex-direction:column;gap:1px;margin-bottom:14px;}
        .nav-item{display:flex;align-items:center;gap:9px;padding:9px 10px;border-radius:9px;cursor:pointer;font-size:12.5px;color:var(--t2);font-weight:500;transition:all 0.18s;}
        .nav-item:hover{background:rgba(56,217,198,0.07);color:var(--t1);}
        .nav-ico{font-size:14px;width:18px;text-align:center;}

        .disclaimer{
          margin-top:auto;
          background:rgba(245,158,11,0.06);border:1px solid rgba(245,158,11,0.15);
          border-radius:12px;padding:12px 13px;
          display:flex;gap:9px;align-items:flex-start;cursor:pointer;transition:all 0.2s;
        }
        .disclaimer:hover{background:rgba(245,158,11,0.10);}
        .disc-icon{font-size:14px;flex-shrink:0;margin-top:1px;}
        .disc-title{font-size:11px;font-weight:700;color:#FCD34D;margin-bottom:3px;}
        .disc-text{font-size:10px;color:#B45309;line-height:1.6;}

        /* TOPBAR */
        .topbar{
          height:54px;min-height:54px;
          padding:0 26px;
          background:rgba(7,13,24,0.92);
          border-bottom:1px solid var(--border);
          display:flex;align-items:center;justify-content:space-between;
          flex-shrink:0;backdrop-filter:blur(32px) saturate(1.6);
          position:relative;z-index:5;
        }
        .topbar::after{
          content:'';position:absolute;bottom:0;left:0;right:0;height:1px;
          background:linear-gradient(90deg,transparent,rgba(56,217,198,0.25) 35%,rgba(124,140,248,0.18) 65%,transparent);
          pointer-events:none;
        }
        .tb-left{display:flex;align-items:center;gap:10px;}
        .tb-dot{width:8px;height:8px;border-radius:50%;background:var(--pri);box-shadow:0 0 0 3px rgba(56,217,198,0.15);animation:tbPulse 2.8s infinite;flex-shrink:0;}
        .tb-dot.off{background:var(--t4);box-shadow:none;animation:none;}
        @keyframes tbPulse{0%,100%{box-shadow:0 0 0 3px rgba(56,217,198,0.15);}50%{box-shadow:0 0 0 7px rgba(56,217,198,0.04);}}
        .tb-text{font-size:12.5px;color:var(--t2);}
        .tb-name{color:var(--t1);font-weight:600;}
        .tb-right{display:flex;align-items:center;gap:10px;}
        .tb-bell{width:34px;height:34px;border-radius:9px;background:var(--surf);border:1px solid var(--border);display:flex;align-items:center;justify-content:center;font-size:14px;cursor:pointer;transition:all 0.2s;}
        .tb-bell:hover{background:var(--card);border-color:var(--border2);}
        .tb-user{display:flex;align-items:center;gap:9px;}
        .tb-av{width:34px;height:34px;border-radius:10px;background:linear-gradient(135deg,var(--pri3),var(--pri));display:flex;align-items:center;justify-content:center;font-size:16px;box-shadow:0 4px 16px rgba(56,217,198,0.3);}
        .tb-uname{font-size:12.5px;font-weight:600;color:var(--t1);line-height:1.2;}
        .tb-ustatus{font-size:10px;color:var(--acc2);font-weight:500;}

        /* MAIN */
        .main{flex:1;display:flex;flex-direction:column;overflow:hidden;min-width:0;position:relative;z-index:1;}

        .chat-area{flex:1;overflow-y:auto;padding:36px 56px 24px;display:flex;flex-direction:column;gap:18px;}

        /* EMPTY STATE */
        .empty{
          margin:auto;text-align:center;
          display:flex;flex-direction:column;align-items:center;gap:22px;
          max-width:620px;width:100%;
          animation:fadeUp 0.65s cubic-bezier(0.22,1,0.36,1);
        }
        @keyframes fadeUp{from{opacity:0;transform:translateY(28px)}to{opacity:1;transform:translateY(0)}}

        .hero{position:relative;width:190px;height:190px;display:flex;align-items:center;justify-content:center;}
        .hring{position:absolute;border-radius:50%;border:1px solid rgba(56,217,198,0.14);animation:ringBreath ease-in-out infinite;}
        .hring:nth-child(1){width:190px;height:190px;animation-duration:4.5s;}
        .hring:nth-child(2){width:152px;height:152px;animation-duration:4.5s;animation-delay:0.6s;}
        .hring:nth-child(3){width:116px;height:116px;animation-duration:4.5s;animation-delay:1.2s;}
        @keyframes ringBreath{0%,100%{opacity:0.9;transform:scale(1);}50%{opacity:0.15;transform:scale(1.04);}}
        .hcore{
          width:106px;height:106px;border-radius:50%;z-index:2;position:relative;
          background:radial-gradient(circle at 35% 35%,rgba(56,217,198,0.14),rgba(7,13,24,0.97));
          border:1.5px solid rgba(56,217,198,0.32);
          display:flex;align-items:center;justify-content:center;
          box-shadow:0 0 0 1px rgba(56,217,198,0.08),0 0 60px rgba(56,217,198,0.16),inset 0 0 40px rgba(56,217,198,0.07);
        }
        .hsteth{font-size:46px;filter:drop-shadow(0 0 18px rgba(56,217,198,0.65));animation:stethFloat 3.2s ease-in-out infinite;}
        @keyframes stethFloat{0%,100%{transform:translateY(0) rotate(-5deg) scale(1);}30%{transform:translateY(-10px) rotate(5deg) scale(1.07);}60%{transform:translateY(-5px) rotate(-2deg) scale(1.03);}}
        .hside{position:absolute;font-size:24px;z-index:3;animation:sideBounce ease-in-out infinite;filter:drop-shadow(0 0 12px rgba(56,217,198,0.35));}
        .hside.l{left:-18px;top:50%;animation-duration:3.8s;animation-delay:0.8s;}
        .hside.r{right:-18px;top:50%;animation-duration:4.2s;animation-delay:0.2s;}
        @keyframes sideBounce{0%,100%{transform:translateY(-50%) scale(1);}50%{transform:translateY(calc(-50% - 9px)) scale(1.1);}}

        .hero-title{font-size:36px;font-weight:800;color:var(--t1);letter-spacing:-1.2px;line-height:1.12;font-family:'Outfit',sans-serif;}
        .hero-title em{font-style:normal;background:linear-gradient(135deg,var(--pri) 0%,var(--acc2) 100%);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;}
        .hero-sub{font-size:15px;color:var(--t2);line-height:1.8;}

        .hero-btn{
          padding:14px 42px;background:linear-gradient(135deg,var(--pri3),var(--pri));
          border:none;border-radius:14px;color:#fff;
          font-size:15px;font-weight:700;cursor:pointer;font-family:'Plus Jakarta Sans',sans-serif;
          display:flex;align-items:center;gap:9px;letter-spacing:-0.3px;
          box-shadow:0 4px 36px rgba(56,217,198,0.42),inset 0 1px 0 rgba(255,255,255,0.18);
          transition:all 0.25s;
        }
        .hero-btn:hover{transform:translateY(-3px);box-shadow:0 12px 52px rgba(56,217,198,0.58),inset 0 1px 0 rgba(255,255,255,0.22);}
        .hero-btn:active{transform:scale(0.98);}
        .drop-hint{font-size:12px;color:var(--t3);}

        .feats{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;width:100%;}
        .feat-card{
          background:rgba(15,28,48,0.85);border:1px solid var(--border);
          border-radius:18px;padding:20px 16px 18px;text-align:center;
          backdrop-filter:blur(20px);transition:all 0.26s;position:relative;overflow:hidden;
        }
        .feat-card::before{content:'';position:absolute;inset:0;background:radial-gradient(circle at 50% -5%,rgba(56,217,198,0.08),transparent 60%);opacity:0;transition:opacity 0.26s;}
        .feat-card:hover::before{opacity:1;}
        .feat-card:hover{background:rgba(23,36,56,0.95);border-color:var(--border2);transform:translateY(-4px);box-shadow:0 18px 44px rgba(56,217,198,0.10);}
        .feat-ico{width:44px;height:44px;border-radius:13px;margin:0 auto 13px;background:rgba(56,217,198,0.09);border:1px solid rgba(56,217,198,0.18);display:flex;align-items:center;justify-content:center;font-size:20px;}
        .feat-title{font-size:12.5px;font-weight:700;color:var(--t1);margin-bottom:6px;}
        .feat-sub{font-size:11px;color:var(--t2);line-height:1.62;}

        /* MESSAGES */
        .msg{display:flex;flex-direction:column;gap:6px;animation:msgIn 0.25s ease;}
        .msg.user{align-items:flex-end;}.msg.ai{align-items:flex-start;}
        @keyframes msgIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
        .msg-lbl{font-size:10.5px;font-weight:600;color:var(--t3);padding:0 5px;}
        .bubble{max-width:66%;padding:14px 18px;font-size:13.5px;line-height:1.82;border-radius:20px;white-space:pre-wrap;}
        .msg.user .bubble{background:linear-gradient(135deg,var(--pri3),var(--pri));color:#fff;border-bottom-right-radius:5px;box-shadow:0 4px 24px rgba(56,217,198,0.3);font-weight:500;}
        .msg.ai .bubble{background:rgba(56,217,198,0.05);color:var(--t1);border:1px solid var(--border);border-bottom-left-radius:5px;}
        .typing-bubble{background:rgba(56,217,198,0.05);border:1px solid var(--border);border-radius:20px;border-bottom-left-radius:5px;padding:16px 20px;display:flex;align-items:center;gap:5px;}
        .td{width:7px;height:7px;border-radius:50%;background:var(--pri);animation:tdot 1.4s infinite;}
        .td:nth-child(2){animation-delay:.22s}.td:nth-child(3){animation-delay:.44s}
        @keyframes tdot{0%,60%,100%{transform:translateY(0);opacity:0.2}30%{transform:translateY(-8px);opacity:1}}

        /* INPUT */
        .input-wrap{
          padding:12px 26px 16px;
          background:rgba(7,13,24,0.93);
          border-top:1px solid var(--border);
          flex-shrink:0;backdrop-filter:blur(32px);position:relative;
        }
        .input-wrap::before{content:'';position:absolute;top:0;left:0;right:0;height:1px;background:linear-gradient(90deg,transparent,rgba(56,217,198,0.2) 30%,rgba(124,140,248,0.14) 70%,transparent);pointer-events:none;}
        .chips{display:flex;gap:7px;flex-wrap:nowrap;overflow-x:auto;margin-bottom:10px;padding-bottom:1px;}
        .chips::-webkit-scrollbar{height:0;}
        .chip{background:rgba(56,217,198,0.05);border:1px solid var(--border);border-radius:20px;padding:6px 14px;font-size:11.5px;color:var(--t2);cursor:pointer;white-space:nowrap;font-family:'Plus Jakarta Sans',sans-serif;font-weight:500;display:flex;align-items:center;gap:6px;transition:all 0.2s;flex-shrink:0;}
        .chip:hover{background:rgba(56,217,198,0.10);border-color:var(--border2);color:var(--pri);transform:translateY(-1px);}
        .input-shell{background:var(--surf);border:1.5px solid var(--border);border-radius:16px;padding:5px 7px 5px 5px;display:flex;align-items:flex-end;gap:7px;transition:border-color 0.25s,box-shadow 0.25s;box-shadow:0 2px 20px rgba(0,0,0,0.28);}
        .input-shell:focus-within{border-color:rgba(56,217,198,0.4);box-shadow:0 0 0 4px rgba(56,217,198,0.07),0 2px 20px rgba(0,0,0,0.28);}
        .iatt{width:38px;height:38px;border-radius:10px;flex-shrink:0;background:var(--card);border:1px solid var(--border);display:flex;align-items:center;justify-content:center;font-size:16px;cursor:pointer;transition:all 0.2s;align-self:flex-end;margin-bottom:2px;}
        .iatt:hover{background:rgba(56,217,198,0.09);border-color:var(--border2);}
        .ibox{flex:1;background:transparent;border:none;outline:none;padding:11px 8px;font-size:13.5px;font-family:'Plus Jakarta Sans',sans-serif;color:var(--t1);resize:none;line-height:1.6;max-height:120px;}
        .ibox::placeholder{color:var(--t3);}
        .ibox:disabled{opacity:0.4;}
        .input-right{display:flex;gap:6px;align-items:center;flex-shrink:0;align-self:flex-end;margin-bottom:2px;}
        .hint-text{font-size:10.5px;color:var(--t3);white-space:nowrap;margin-right:3px;}
        .imic{width:38px;height:38px;border-radius:10px;background:var(--card);border:1px solid var(--border);display:flex;align-items:center;justify-content:center;font-size:16px;cursor:pointer;transition:all 0.2s;}
        .imic:hover{background:rgba(56,217,198,0.09);border-color:var(--border2);}
        .isend{width:38px;height:38px;border-radius:10px;background:linear-gradient(135deg,var(--pri3),var(--pri));border:none;cursor:pointer;color:#fff;font-size:15px;display:flex;align-items:center;justify-content:center;transition:all 0.22s;flex-shrink:0;box-shadow:0 4px 18px rgba(56,217,198,0.42),inset 0 1px 0 rgba(255,255,255,0.16);}
        .isend:hover{transform:scale(1.1);box-shadow:0 6px 28px rgba(56,217,198,0.62);}
        .isend:active{transform:scale(0.95);}
        .isend:disabled{background:var(--card);box-shadow:none;cursor:default;transform:none;opacity:0.35;}
        .input-footer{display:flex;justify-content:flex-end;margin-top:7px;}
        .input-notice{font-size:10.5px;color:var(--t3);}
      `}</style>

      <div className="app">
        <div className="bg-layer" />
        <div className="grid-layer" />
        <div className="orb orb1" />
        <div className="orb orb2" />
        <div className="orb orb3" />

        {/* SIDEBAR */}
        <aside className="sb">
          <div className="sbi">
            <div className="logo">
              <div className="logo-ico">🏥</div>
              <div>
                <div className="logo-name">MediQuery AI</div>
                <div className="logo-sub">AI Medical Assistant</div>
              </div>
            </div>

            <label
              className={`upload-zone ${dragOver ? "drag" : ""}`}
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
                  <div className="spin" />
                  <div className="uz-title">Processing…</div>
                  <div className="uz-sub">Extracting & indexing content</div>
                </>
              ) : (
                <>
                  <span className="uz-icon">📂</span>
                  <div className="uz-title">Upload Medical PDF</div>
                  <div className="uz-sub">
                    Lab reports · Discharge summaries
                    <br />
                    Prescriptions · Medical records
                  </div>
                </>
              )}
            </label>

            <button
              className="up-btn"
              onClick={() => fileInputRef.current?.click()}
            >
              ⬆️ Upload PDF
            </button>
            <div className="dh">or drag and drop your file here</div>

            {uploaded && (
              <div className="up-pill">
                <span>📋</span>
                <span className="up-fname">{filename}</span>
                <span style={{ color: "var(--acc2)", fontSize: 14 }}>✓</span>
              </div>
            )}

            <div className="sdiv" />
            <div className="sec-label">
              Recent Documents
              <span className="sec-action" onClick={() => setShowAllDocs(true)}>
                View all
              </span>
            </div>
            <div className="doc-list">
              {recentDocs.map((d, i) => (
                <div key={i} className="doc-item">
                  <div className="doc-tag">{d.tag}</div>
                  <div className="doc-info">
                    <div className="doc-name">{d.name}</div>
                    <div className="doc-meta">
                      {d.date} · {d.size}
                    </div>
                  </div>
                  <span className="doc-dots">⋯</span>
                </div>
              ))}
            </div>

            <div className="sdiv" />
            <div className="nav-list">
              <div className="nav-item" onClick={() => setShowHistory(true)}>
                <span className="nav-ico">💬</span>Chat History
                {chatSessions.length > 0 && (
                  <span
                    style={{
                      marginLeft: "auto",
                      background: "var(--pri)",
                      color: "#000",
                      borderRadius: "10px",
                      fontSize: "10px",
                      fontWeight: 700,
                      padding: "1px 7px",
                    }}
                  >
                    {chatSessions.length}
                  </span>
                )}
              </div>
              <div className="nav-item" onClick={() => setShowTemplates(true)}>
                <span className="nav-ico">📝</span>Templates
              </div>
              <div className="nav-item" onClick={() => setShowSettings(true)}>
                <span className="nav-ico">⚙️</span>Settings
              </div>
            </div>

            <div className="disclaimer">
              <span className="disc-icon">⚠️</span>
              <div>
                <div className="disc-title">Educational use only</div>
                <div className="disc-text">
                  Always consult a qualified doctor for medical decisions.
                </div>
              </div>
            </div>
          </div>
        </aside>

        {/* MAIN */}
        <div className="main">
          <header className="topbar">
            <div className="tb-left">
              <div className={`tb-dot ${uploaded ? "" : "off"}`} />
              <span className="tb-text">
                {uploaded ? (
                  <>
                    <span className="tb-name">{filename}</span> · Ready to
                    answer questions
                  </>
                ) : (
                  "No document loaded — upload a PDF to begin"
                )}
              </span>
            </div>
            <div className="tb-right">
              <div
                className="tb-bell"
                onClick={() => setShowNotifications(true)}
              >
                🔔
              </div>
              <div className="tb-user">
                <div className="tb-av">🤖</div>
                <div>
                  <div className="tb-uname">AI Assistant</div>
                  <div className="tb-ustatus">● Online</div>
                </div>
              </div>
            </div>
          </header>

          <div className="chat-area">
            {messages.length === 0 ? (
              <div className="empty">
                <div className="hero">
                  <div className="hring" />
                  <div className="hring" />
                  <div className="hring" />
                  <div className="hcore">
                    <span className="hsteth">🩺</span>
                  </div>
                  <span className="hside l">💗</span>
                  <span className="hside r">🧪</span>
                </div>
                <div className="hero-title">
                  Upload a <em>medical PDF</em>
                </div>
                <div className="hero-sub">
                  Ask medical questions in plain English.
                  <br />
                  No medical knowledge needed.
                </div>
                <button
                  className="hero-btn"
                  onClick={() => fileInputRef.current?.click()}
                >
                  ⬆️ Upload PDF
                </button>
                <div className="drop-hint">or drag and drop here</div>
                <div className="feats">
                  {[
                    {
                      e: "🧠",
                      t: "AI-Powered Analysis",
                      s: "Advanced AI understands complex medical reports instantly",
                    },
                    {
                      e: "🔒",
                      t: "Secure & Private",
                      s: "Your health data is never stored or shared with anyone",
                    },
                    {
                      e: "⚡",
                      t: "Instant Insights",
                      s: "Get clear, plain-English answers in seconds",
                    },
                  ].map((f, i) => (
                    <div key={i} className="feat-card">
                      <div className="feat-ico">{f.e}</div>
                      <div className="feat-title">{f.t}</div>
                      <div className="feat-sub">{f.s}</div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <>
                {messages.map((m, i) => (
                  <div key={i} className={`msg ${m.role}`}>
                    <span className="msg-lbl">
                      {m.role === "user" ? "You" : "MediQuery AI"}
                    </span>
                    <div className="bubble">{m.text}</div>
                  </div>
                ))}
                {loading && (
                  <div className="msg ai">
                    <span className="msg-lbl">MediQuery AI</span>
                    <div className="typing-bubble">
                      <div className="td" />
                      <div className="td" />
                      <div className="td" />
                    </div>
                  </div>
                )}
              </>
            )}
            <div ref={chatEndRef} />
          </div>

          <div className="input-wrap">
            <div className="chips">
              {chips.map((c, i) => (
                <button
                  key={i}
                  className="chip"
                  onClick={() => {
                    setQuestion(c.text);
                    inputRef.current?.focus();
                  }}
                >
                  {c.icon} {c.text}
                </button>
              ))}
            </div>
            <div className="input-shell">
              <div
                className="iatt"
                onClick={() => fileInputRef.current?.click()}
              >
                📎
              </div>
              <textarea
                ref={inputRef}
                className="ibox"
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
                    ? "Ask anything about your medical report…"
                    : "Upload a PDF first to start asking questions…"
                }
                disabled={loading}
              />
              <div className="input-right">
                <span className="hint-text">Shift+Enter for new line</span>
                <div className="imic">🎤</div>
                <button
                  className="isend"
                  onClick={handleAsk}
                  disabled={loading || !question.trim()}
                >
                  ➤
                </button>
              </div>
            </div>
            <div className="input-footer">
              <span className="input-notice">
                AI can make mistakes. Always verify important medical
                information with a doctor.
              </span>
            </div>
          </div>
        </div>
      </div>
      {showHistory && (
        <div
          style={{ position: "fixed", inset: 0, zIndex: 100, display: "flex" }}
        >
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: "rgba(0,0,0,0.6)",
              backdropFilter: "blur(4px)",
            }}
            onClick={() => setShowHistory(false)}
          />
          <div
            style={{
              position: "relative",
              marginLeft: "auto",
              width: "420px",
              height: "100vh",
              background: "#0F1C30",
              borderLeft: "1px solid rgba(56,217,198,0.15)",
              display: "flex",
              flexDirection: "column",
              zIndex: 1,
            }}
          >
            <div
              style={{
                padding: "20px 20px 16px",
                borderBottom: "1px solid rgba(56,217,198,0.1)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: "15px",
                    fontWeight: 700,
                    color: "#EEF6FF",
                  }}
                >
                  💬 Chat History
                </div>
                <div
                  style={{ fontSize: "11px", color: "#5C7D96", marginTop: 3 }}
                >
                  {chatSessions.length} saved session
                  {chatSessions.length !== 1 ? "s" : ""}
                </div>
              </div>
              <div
                onClick={() => setShowHistory(false)}
                style={{
                  cursor: "pointer",
                  fontSize: "18px",
                  color: "#5C7D96",
                  padding: "4px 8px",
                  borderRadius: 8,
                  background: "rgba(56,217,198,0.06)",
                }}
              >
                ✕
              </div>
            </div>
            <div style={{ flex: 1, overflowY: "auto", padding: "12px" }}>
              {chatSessions.length === 0 ? (
                <div
                  style={{
                    textAlign: "center",
                    marginTop: "60px",
                    color: "#5C7D96",
                  }}
                >
                  <div style={{ fontSize: "32px", marginBottom: 12 }}>💬</div>
                  <div style={{ fontSize: "13px" }}>No history yet</div>
                  <div style={{ fontSize: "11px", marginTop: 6 }}>
                    Sessions are saved when you switch PDFs
                  </div>
                </div>
              ) : (
                chatSessions.map((session) => (
                  <div
                    key={session.id}
                    onClick={() => restoreSession(session)}
                    style={{
                      background: "rgba(56,217,198,0.04)",
                      border: "1px solid rgba(56,217,198,0.10)",
                      borderRadius: 12,
                      padding: "14px",
                      marginBottom: 8,
                      cursor: "pointer",
                      transition: "all 0.2s",
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.background =
                        "rgba(56,217,198,0.09)")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.background =
                        "rgba(56,217,198,0.04)")
                    }
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        marginBottom: 8,
                      }}
                    >
                      <span>📄</span>
                      <span
                        style={{
                          fontSize: "12.5px",
                          fontWeight: 600,
                          color: "#EEF6FF",
                          flex: 1,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {session.filename}
                      </span>
                    </div>
                    <div
                      style={{
                        fontSize: "10.5px",
                        color: "#5C7D96",
                        marginBottom: 10,
                      }}
                    >
                      {session.date} · {session.messages.length} messages
                    </div>
                    {session.messages
                      .filter((m) => m.role === "user")
                      .slice(0, 2)
                      .map((m, i) => (
                        <div
                          key={i}
                          style={{
                            fontSize: "11px",
                            color: "#9BB8D0",
                            padding: "5px 8px",
                            background: "rgba(56,217,198,0.04)",
                            borderRadius: 6,
                            marginBottom: 4,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          ❓ {m.text}
                        </div>
                      ))}
                    <div
                      style={{
                        marginTop: 8,
                        fontSize: "11px",
                        color: "#38D9C6",
                        fontWeight: 600,
                      }}
                    >
                      Tap to restore →
                    </div>
                  </div>
                ))
              )}
            </div>
            {chatSessions.length > 0 && (
              <div
                style={{
                  padding: "12px 16px",
                  borderTop: "1px solid rgba(56,217,198,0.1)",
                }}
              >
                <button
                  onClick={() => {
                    setChatSessions([]);
                    setShowHistory(false);
                  }}
                  style={{
                    width: "100%",
                    padding: "10px",
                    background: "rgba(239,68,68,0.08)",
                    border: "1px solid rgba(239,68,68,0.2)",
                    borderRadius: 10,
                    color: "#F87171",
                    fontSize: "12.5px",
                    fontWeight: 600,
                    cursor: "pointer",
                    fontFamily: "Plus Jakarta Sans,sans-serif",
                  }}
                >
                  🗑️ Clear All History
                </button>
              </div>
            )}
          </div>
        </div>
      )}
      {showTemplates && (
        <div
          style={{ position: "fixed", inset: 0, zIndex: 100, display: "flex" }}
        >
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: "rgba(0,0,0,0.6)",
              backdropFilter: "blur(4px)",
            }}
            onClick={() => setShowTemplates(false)}
          />
          <div
            style={{
              position: "relative",
              marginLeft: "auto",
              width: "420px",
              height: "100vh",
              background: "#0F1C30",
              borderLeft: "1px solid rgba(56,217,198,0.15)",
              display: "flex",
              flexDirection: "column",
              zIndex: 1,
            }}
          >
            {/* Header */}
            <div
              style={{
                padding: "20px 20px 16px",
                borderBottom: "1px solid rgba(56,217,198,0.1)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: "15px",
                    fontWeight: 700,
                    color: "#EEF6FF",
                  }}
                >
                  📝 Templates
                </div>
                <div
                  style={{ fontSize: "11px", color: "#5C7D96", marginTop: 3 }}
                >
                  Click any question to ask it instantly
                </div>
              </div>
              <div
                onClick={() => setShowTemplates(false)}
                style={{
                  cursor: "pointer",
                  fontSize: "18px",
                  color: "#5C7D96",
                  padding: "4px 8px",
                  borderRadius: 8,
                  background: "rgba(56,217,198,0.06)",
                }}
              >
                ✕
              </div>
            </div>

            {/* Packs */}
            <div style={{ flex: 1, overflowY: "auto", padding: "12px" }}>
              {templates.map((pack, pi) => (
                <div key={pi} style={{ marginBottom: 12 }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      padding: "10px 12px",
                      background: "rgba(56,217,198,0.06)",
                      borderRadius: "10px 10px 0 0",
                      border: "1px solid rgba(56,217,198,0.12)",
                      borderBottom: "none",
                    }}
                  >
                    <span style={{ fontSize: "18px" }}>{pack.icon}</span>
                    <div>
                      <div
                        style={{
                          fontSize: "12.5px",
                          fontWeight: 700,
                          color: "#EEF6FF",
                        }}
                      >
                        {pack.title}
                      </div>
                      <div style={{ fontSize: "10.5px", color: "#5C7D96" }}>
                        {pack.desc}
                      </div>
                    </div>
                  </div>
                  <div
                    style={{
                      border: "1px solid rgba(56,217,198,0.12)",
                      borderRadius: "0 0 10px 10px",
                      overflow: "hidden",
                    }}
                  >
                    {pack.questions.map((q, qi) => (
                      <div
                        key={qi}
                        onClick={() => {
                          setQuestion(q);
                          setShowTemplates(false);
                          inputRef.current?.focus();
                        }}
                        style={{
                          padding: "10px 14px",
                          fontSize: "12px",
                          color: "#9BB8D0",
                          cursor: "pointer",
                          borderBottom:
                            qi < pack.questions.length - 1
                              ? "1px solid rgba(56,217,198,0.06)"
                              : "none",
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                          transition: "all 0.15s",
                          background: "rgba(15,28,48,0.8)",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background =
                            "rgba(56,217,198,0.08)";
                          e.currentTarget.style.color = "#38D9C6";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background =
                            "rgba(15,28,48,0.8)";
                          e.currentTarget.style.color = "#9BB8D0";
                        }}
                      >
                        <span style={{ fontSize: "10px", opacity: 0.5 }}>
                          ❓
                        </span>{" "}
                        {q}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      {showSettings && (
        <div
          style={{ position: "fixed", inset: 0, zIndex: 100, display: "flex" }}
        >
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: "rgba(0,0,0,0.6)",
              backdropFilter: "blur(4px)",
            }}
            onClick={() => setShowSettings(false)}
          />
          <div
            style={{
              position: "relative",
              marginLeft: "auto",
              width: "420px",
              height: "100vh",
              background: "#0F1C30",
              borderLeft: "1px solid rgba(56,217,198,0.15)",
              display: "flex",
              flexDirection: "column",
              zIndex: 1,
            }}
          >
            {/* Header */}
            <div
              style={{
                padding: "20px 20px 16px",
                borderBottom: "1px solid rgba(56,217,198,0.1)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                flexShrink: 0,
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: "15px",
                    fontWeight: 700,
                    color: "#EEF6FF",
                  }}
                >
                  ⚙️ Settings
                </div>
                <div
                  style={{ fontSize: "11px", color: "#5C7D96", marginTop: 3 }}
                >
                  Customize your MediQuery experience
                </div>
              </div>
              <div
                onClick={() => setShowSettings(false)}
                style={{
                  cursor: "pointer",
                  fontSize: "18px",
                  color: "#5C7D96",
                  padding: "4px 8px",
                  borderRadius: 8,
                  background: "rgba(56,217,198,0.06)",
                }}
              >
                ✕
              </div>
            </div>

            {/* Tabs */}
            <div
              style={{
                display: "flex",
                gap: 2,
                padding: "10px 12px 0",
                borderBottom: "1px solid rgba(56,217,198,0.1)",
                flexShrink: 0,
                overflowX: "auto",
              }}
            >
              {[
                "profile",
                "appearance",
                "notifications",
                "privacy",
                "about",
              ].map((tab) => (
                <div
                  key={tab}
                  onClick={() => setSettings((s) => ({ ...s, activeTab: tab }))}
                  style={{
                    padding: "7px 14px",
                    borderRadius: "8px 8px 0 0",
                    fontSize: "11.5px",
                    fontWeight: 600,
                    cursor: "pointer",
                    whiteSpace: "nowrap",
                    color: settings.activeTab === tab ? "#38D9C6" : "#5C7D96",
                    background:
                      settings.activeTab === tab ? "#132035" : "transparent",
                    borderBottom:
                      settings.activeTab === tab
                        ? "2px solid #38D9C6"
                        : "2px solid transparent",
                    transition: "all 0.18s",
                    textTransform: "capitalize",
                  }}
                >
                  {tab}
                </div>
              ))}
            </div>

            {/* Body */}
            <div style={{ flex: 1, overflowY: "auto", padding: "16px" }}>
              {/* ── PROFILE ── */}
              {settings.activeTab === "profile" && (
                <>
                  <div style={{ marginBottom: 20 }}>
                    <div style={sectionLabel}>Your profile</div>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 12,
                        marginBottom: 6,
                      }}
                    >
                      <div
                        style={{
                          width: 52,
                          height: 52,
                          borderRadius: 14,
                          flexShrink: 0,
                          background: "linear-gradient(135deg,#0D8F83,#38D9C6)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 24,
                          boxShadow: "0 4px 18px rgba(56,217,198,0.3)",
                        }}
                      >
                        🤖
                      </div>
                      <div style={{ flex: 1 }}>
                        <div
                          style={{
                            fontSize: 14,
                            fontWeight: 700,
                            color: "#EEF6FF",
                          }}
                        >
                          AI Assistant
                        </div>
                        <div
                          style={{
                            fontSize: 10.5,
                            color: "#38D9C6",
                            marginTop: 3,
                          }}
                        >
                          ● Free Plan
                        </div>
                      </div>
                    </div>
                  </div>

                  <div style={{ marginBottom: 20 }}>
                    <div style={sectionLabel}>Account details</div>
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 10,
                      }}
                    >
                      <div>
                        <div style={fieldLabel}>Display name</div>
                        <input style={inputStyle} defaultValue="AI Assistant" />
                      </div>
                      <div>
                        <div style={fieldLabel}>Email</div>
                        <input
                          style={inputStyle}
                          defaultValue="user@example.com"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <div style={sectionLabel}>Danger zone</div>
                    <div style={settingRow}>
                      <div>
                        <div style={rowLabel}>Clear all data</div>
                        <div style={rowSub}>
                          Deletes all chat history and documents
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          setChatSessions([]);
                          setRecentDocs([]);
                          setShowSettings(false);
                        }}
                        style={dangerBtn}
                      >
                        Clear
                      </button>
                    </div>
                  </div>
                </>
              )}

              {/* ── APPEARANCE ── */}
              {settings.activeTab === "appearance" && (
                <>
                  <div style={{ marginBottom: 20 }}>
                    <div style={sectionLabel}>Display</div>
                    <div style={settingRow}>
                      <div>
                        <div style={rowLabel}>Font size</div>
                        <div style={rowSub}>Chat message text size</div>
                      </div>
                      <select
                        style={selectStyle}
                        value={settings.fontSize}
                        onChange={(e) =>
                          setSettings((s) => ({
                            ...s,
                            fontSize: e.target.value,
                          }))
                        }
                      >
                        <option value="small">Small</option>
                        <option value="medium">Medium</option>
                        <option value="large">Large</option>
                      </select>
                    </div>
                    <div style={settingRow}>
                      <div>
                        <div style={rowLabel}>Compact mode</div>
                        <div style={rowSub}>
                          Reduce spacing between messages
                        </div>
                      </div>
                      <Toggle
                        checked={settings.compactMode}
                        onChange={() =>
                          setSettings((s) => ({
                            ...s,
                            compactMode: !s.compactMode,
                          }))
                        }
                      />
                    </div>
                  </div>

                  <div>
                    <div style={sectionLabel}>Chat behavior</div>
                    <div style={settingRow}>
                      <div>
                        <div style={rowLabel}>Auto-scroll to latest</div>
                        <div style={rowSub}>Scroll down on new messages</div>
                      </div>
                      <Toggle
                        checked={settings.autoScroll}
                        onChange={() =>
                          setSettings((s) => ({
                            ...s,
                            autoScroll: !s.autoScroll,
                          }))
                        }
                      />
                    </div>
                    <div style={settingRow}>
                      <div>
                        <div style={rowLabel}>Show quick chips</div>
                        <div style={rowSub}>Suggestion buttons below input</div>
                      </div>
                      <Toggle
                        checked={settings.showChips}
                        onChange={() =>
                          setSettings((s) => ({
                            ...s,
                            showChips: !s.showChips,
                          }))
                        }
                      />
                    </div>
                  </div>
                </>
              )}

              {/* ── NOTIFICATIONS ── */}
              {settings.activeTab === "notifications" && (
                <div>
                  <div style={sectionLabel}>Alerts</div>
                  {[
                    {
                      key: "notifyUpload",
                      label: "Upload complete",
                      sub: "Notify when PDF is indexed",
                    },
                    {
                      key: "notifyResponse",
                      label: "AI response ready",
                      sub: "Notify when answer is available",
                    },
                    {
                      key: "notifyError",
                      label: "Error alerts",
                      sub: "Notify on upload or server errors",
                    },
                  ].map(({ key, label, sub }) => (
                    <div key={key} style={settingRow}>
                      <div>
                        <div style={rowLabel}>{label}</div>
                        <div style={rowSub}>{sub}</div>
                      </div>
                      <Toggle
                        checked={settings[key]}
                        onChange={() =>
                          setSettings((s) => ({ ...s, [key]: !s[key] }))
                        }
                      />
                    </div>
                  ))}
                </div>
              )}

              {/* ── PRIVACY ── */}
              {settings.activeTab === "privacy" && (
                <>
                  <div style={{ marginBottom: 20 }}>
                    <div style={sectionLabel}>Data & storage</div>
                    {[
                      {
                        key: "saveHistory",
                        label: "Save chat history",
                        sub: "Keep sessions when switching PDFs",
                      },
                      {
                        key: "showRecentDocs",
                        label: "Recent documents list",
                        sub: "Show recently uploaded files",
                      },
                      {
                        key: "autoClear",
                        label: "Auto-clear on close",
                        sub: "Wipe session data when tab closes",
                      },
                    ].map(({ key, label, sub }) => (
                      <div key={key} style={settingRow}>
                        <div>
                          <div style={rowLabel}>{label}</div>
                          <div style={rowSub}>{sub}</div>
                        </div>
                        <Toggle
                          checked={settings[key]}
                          onChange={() =>
                            setSettings((s) => ({ ...s, [key]: !s[key] }))
                          }
                        />
                      </div>
                    ))}
                  </div>

                  <div>
                    <div style={sectionLabel}>Server</div>
                    <div
                      style={{
                        ...settingRow,
                        flexDirection: "column",
                        alignItems: "flex-start",
                        gap: 8,
                      }}
                    >
                      <div>
                        <div style={rowLabel}>Backend URL</div>
                        <div style={rowSub}>API endpoint for upload & ask</div>
                      </div>
                      <input
                        style={{ ...inputStyle, width: "100%" }}
                        value={settings.serverUrl}
                        onChange={(e) =>
                          setSettings((s) => ({
                            ...s,
                            serverUrl: e.target.value,
                          }))
                        }
                      />
                    </div>
                  </div>
                </>
              )}

              {/* ── ABOUT ── */}
              {settings.activeTab === "about" && (
                <>
                  <div style={{ marginBottom: 20 }}>
                    <div style={sectionLabel}>App info</div>
                    {[
                      { label: "Version", value: "v1.0.0", highlight: true },
                      {
                        label: "Built with",
                        value: "React · FastAPI · ChromaDB · Groq",
                      },
                      { label: "AI model", value: "Llama 3 via Groq" },
                    ].map(({ label, value, highlight }) => (
                      <div key={label} style={settingRow}>
                        <div style={rowLabel}>{label}</div>
                        <div
                          style={{
                            fontSize: 12,
                            color: highlight ? "#38D9C6" : "#5EEAD4",
                            fontWeight: highlight ? 700 : 500,
                          }}
                        >
                          {value}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div
                    style={{
                      background: "rgba(245,158,11,0.06)",
                      border: "1px solid rgba(245,158,11,0.18)",
                      borderRadius: 10,
                      padding: "13px 14px",
                    }}
                  >
                    <div
                      style={{
                        fontSize: 11.5,
                        fontWeight: 700,
                        color: "#FCD34D",
                        marginBottom: 5,
                      }}
                    >
                      ⚠️ Educational use only
                    </div>
                    <div
                      style={{
                        fontSize: 11,
                        color: "#B45309",
                        lineHeight: 1.65,
                      }}
                    >
                      MediQuery AI is not a substitute for professional medical
                      advice. Always consult a qualified doctor before making
                      any health decisions.
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Save bar */}
            <div
              style={{
                padding: "12px 16px",
                borderTop: "1px solid rgba(56,217,198,0.1)",
                flexShrink: 0,
                background: "#0F1C30",
              }}
            >
              <button
                onClick={() => setShowSettings(false)}
                style={{
                  width: "100%",
                  padding: 10,
                  background: "linear-gradient(135deg,#0D8F83,#38D9C6)",
                  border: "none",
                  borderRadius: 10,
                  color: "#fff",
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: "pointer",
                  fontFamily: "Plus Jakarta Sans,sans-serif",
                  transition: "all 0.2s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.88")}
                onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
              >
                Save changes
              </button>
            </div>
          </div>
        </div>
      )}
      {showNotifications && (
        <div
          style={{ position: "fixed", inset: 0, zIndex: 100, display: "flex" }}
        >
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: "rgba(0,0,0,0.6)",
              backdropFilter: "blur(4px)",
            }}
            onClick={() => setShowNotifications(false)}
          />
          <div
            style={{
              position: "relative",
              marginLeft: "auto",
              width: "420px",
              height: "100vh",
              background: "#0F1C30",
              borderLeft: "1px solid rgba(56,217,198,0.15)",
              display: "flex",
              flexDirection: "column",
              zIndex: 1,
            }}
          >
            {/* Header */}
            <div
              style={{
                padding: "20px 20px 16px",
                borderBottom: "1px solid rgba(56,217,198,0.1)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: "15px",
                    fontWeight: 700,
                    color: "#EEF6FF",
                  }}
                >
                  🔔 Notifications
                </div>
                <div
                  style={{ fontSize: "11px", color: "#5C7D96", marginTop: 3 }}
                >
                  {notifications.filter((n) => n.unread).length} unread
                </div>
              </div>
              <div
                onClick={() => setShowNotifications(false)}
                style={{
                  cursor: "pointer",
                  fontSize: "18px",
                  color: "#5C7D96",
                  padding: "4px 8px",
                  borderRadius: 8,
                  background: "rgba(56,217,198,0.06)",
                }}
              >
                ✕
              </div>
            </div>

            {/* List */}
            <div style={{ flex: 1, overflowY: "auto", padding: "12px" }}>
              {notifications.length === 0 ? (
                <div
                  style={{
                    textAlign: "center",
                    marginTop: "60px",
                    color: "#5C7D96",
                  }}
                >
                  <div style={{ fontSize: "32px", marginBottom: 12 }}>🔔</div>
                  <div style={{ fontSize: "13px" }}>No notifications yet</div>
                  <div style={{ fontSize: "11px", marginTop: 6 }}>
                    Upload a PDF to get started
                  </div>
                </div>
              ) : (
                notifications.map((n) => (
                  <div
                    key={n.id}
                    style={{
                      background: n.unread
                        ? "rgba(56,217,198,0.06)"
                        : "rgba(56,217,198,0.02)",
                      border: "1px solid rgba(56,217,198,0.10)",
                      borderRadius: 12,
                      padding: "12px 14px",
                      marginBottom: 8,
                      display: "flex",
                      gap: 10,
                      alignItems: "flex-start",
                    }}
                  >
                    <span style={{ fontSize: "20px" }}>{n.icon}</span>
                    <div style={{ flex: 1 }}>
                      <div
                        style={{
                          fontSize: "12.5px",
                          fontWeight: 600,
                          color: "#EEF6FF",
                        }}
                      >
                        {n.title}
                      </div>
                      <div
                        style={{
                          fontSize: "11px",
                          color: "#9BB8D0",
                          marginTop: 2,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {n.text}
                      </div>
                      <div
                        style={{
                          fontSize: "10px",
                          color: "#5C7D96",
                          marginTop: 4,
                        }}
                      >
                        {n.time}
                      </div>
                    </div>
                    {n.unread && (
                      <div
                        style={{
                          width: 7,
                          height: 7,
                          borderRadius: "50%",
                          background: "#38D9C6",
                          flexShrink: 0,
                          marginTop: 4,
                        }}
                      />
                    )}
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            {notifications.length > 0 && (
              <div
                style={{
                  padding: "12px 16px",
                  borderTop: "1px solid rgba(56,217,198,0.1)",
                }}
              >
                <button
                  onClick={() => {
                    setNotifications([]);
                    setShowNotifications(false);
                  }}
                  style={{
                    width: "100%",
                    padding: "10px",
                    background: "rgba(239,68,68,0.08)",
                    border: "1px solid rgba(239,68,68,0.2)",
                    borderRadius: 10,
                    color: "#F87171",
                    fontSize: "12.5px",
                    fontWeight: 600,
                    cursor: "pointer",
                    fontFamily: "Plus Jakarta Sans,sans-serif",
                  }}
                >
                  🗑️ Clear All
                </button>
              </div>
            )}
          </div>
        </div>
      )}
      {showAllDocs && (
        <div
          style={{ position: "fixed", inset: 0, zIndex: 100, display: "flex" }}
        >
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: "rgba(0,0,0,0.6)",
              backdropFilter: "blur(4px)",
            }}
            onClick={() => setShowAllDocs(false)}
          />
          <div
            style={{
              position: "relative",
              marginLeft: "auto",
              width: "420px",
              height: "100vh",
              background: "#0F1C30",
              borderLeft: "1px solid rgba(56,217,198,0.15)",
              display: "flex",
              flexDirection: "column",
              zIndex: 1,
            }}
          >
            <div
              style={{
                padding: "20px 20px 16px",
                borderBottom: "1px solid rgba(56,217,198,0.1)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: "15px",
                    fontWeight: 700,
                    color: "#EEF6FF",
                  }}
                >
                  📁 All Documents
                </div>
                <div
                  style={{ fontSize: "11px", color: "#5C7D96", marginTop: 3 }}
                >
                  {recentDocs.length} document
                  {recentDocs.length !== 1 ? "s" : ""}
                </div>
              </div>
              <div
                onClick={() => setShowAllDocs(false)}
                style={{
                  cursor: "pointer",
                  fontSize: "18px",
                  color: "#5C7D96",
                  padding: "4px 8px",
                  borderRadius: 8,
                  background: "rgba(56,217,198,0.06)",
                }}
              >
                ✕
              </div>
            </div>
            <div style={{ flex: 1, overflowY: "auto", padding: "12px" }}>
              {recentDocs.length === 0 ? (
                <div
                  style={{
                    textAlign: "center",
                    marginTop: "60px",
                    color: "#5C7D96",
                  }}
                >
                  <div style={{ fontSize: "32px", marginBottom: 12 }}>📁</div>
                  <div style={{ fontSize: "13px" }}>No documents yet</div>
                </div>
              ) : (
                recentDocs.map((d, i) => (
                  <div
                    key={i}
                    style={{
                      background: "rgba(56,217,198,0.04)",
                      border: "1px solid rgba(56,217,198,0.10)",
                      borderRadius: 12,
                      padding: "12px 14px",
                      marginBottom: 8,
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                    }}
                  >
                    <div
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 9,
                        background: "#132035",
                        border: "1px solid rgba(56,217,198,0.15)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "9px",
                        fontWeight: 800,
                        color: "#38D9C6",
                        flexShrink: 0,
                      }}
                    >
                      {d.tag}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: "12.5px",
                          fontWeight: 600,
                          color: "#EEF6FF",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {d.name}
                      </div>
                      <div
                        style={{
                          fontSize: "10.5px",
                          color: "#5C7D96",
                          marginTop: 2,
                        }}
                      >
                        {d.date} · {d.size}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
            {recentDocs.length > 0 && (
              <div
                style={{
                  padding: "12px 16px",
                  borderTop: "1px solid rgba(56,217,198,0.1)",
                }}
              >
                <button
                  onClick={() => {
                    setRecentDocs([]);
                    setShowAllDocs(false);
                  }}
                  style={{
                    width: "100%",
                    padding: "10px",
                    background: "rgba(239,68,68,0.08)",
                    border: "1px solid rgba(239,68,68,0.2)",
                    borderRadius: 10,
                    color: "#F87171",
                    fontSize: "12.5px",
                    fontWeight: 600,
                    cursor: "pointer",
                    fontFamily: "Plus Jakarta Sans,sans-serif",
                  }}
                >
                  🗑️ Clear All Documents
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
