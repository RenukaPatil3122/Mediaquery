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
          color: "#12D6D6",
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
      emoji: "🧠",
      title: "AI-Powered Analysis",
      sub: "Advanced AI understands medical reports",
    },
    {
      emoji: "🔒",
      title: "Secure & Private",
      sub: "Your data is encrypted and secure",
    },
    {
      emoji: "⚡",
      title: "Instant Insights",
      sub: "Get answers quickly and accurately",
    },
  ];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');

        :root {
          --bg:      #06111F;
          --surf:    #0B1D2E;
          --card:    #10273A;
          --card2:   #0E2135;
          --b1:      rgba(18,214,214,0.10);
          --b2:      rgba(18,214,214,0.18);
          --pri:     #12D6D6;
          --acc:     #1EE6A5;
          --t1:      #EAF4FF;
          --t2:      #8AA4BF;
          --t3:      #3D5A73;
        }

        html,body,#root{width:100%;height:100%;margin:0;padding:0;overflow:hidden;}
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
        body{font-family:'Inter',sans-serif;background:var(--bg);color:var(--t1);}
        ::-webkit-scrollbar{width:3px;}
        ::-webkit-scrollbar-thumb{background:var(--b2);border-radius:8px;}

        .app{display:flex;width:100vw;height:100vh;overflow:hidden;position:relative;}

        /* ambient */
        .amb{
          position:fixed;inset:0;z-index:0;pointer-events:none;
          background:
            radial-gradient(ellipse 65% 55% at 63% 28%, rgba(18,214,214,0.075) 0%,transparent 62%),
            radial-gradient(ellipse 45% 65% at 16% 72%, rgba(30,230,165,0.05) 0%,transparent 55%),
            radial-gradient(ellipse 35% 40% at 88% 84%, rgba(18,214,214,0.04) 0%,transparent 50%);
        }

        /* particles */
        .pts{position:fixed;inset:0;z-index:0;pointer-events:none;overflow:hidden;}
        .pt{position:absolute;border-radius:50%;background:var(--pri);opacity:0;animation:ptR linear infinite;}
        @keyframes ptR{
          0%{transform:translateY(100vh) scale(0);opacity:0;}
          8%{opacity:0.3;}85%{opacity:0.1;}
          100%{transform:translateY(-6vh) scale(1.2);opacity:0;}
        }

        /* ── SIDEBAR ── */
        .sb{
          width:248px;min-width:248px;height:100vh;z-index:3;
          background:rgba(5,12,22,0.97);
          border-right:1px solid var(--b1);
          display:flex;flex-direction:column;
          overflow-y:auto;overflow-x:hidden;
          backdrop-filter:blur(22px) saturate(1.5);
        }
        .sbi{display:flex;flex-direction:column;flex:1;padding:20px 14px 18px;gap:18px;}

        /* logo */
        .logo{display:flex;align-items:center;gap:11px;}
        .logo-ico{
          width:37px;height:37px;border-radius:10px;flex-shrink:0;
          background:linear-gradient(135deg,#0d9488,var(--pri));
          display:flex;align-items:center;justify-content:center;font-size:17px;
          box-shadow:0 0 22px rgba(18,214,214,0.4),inset 0 1px 0 rgba(255,255,255,0.12);
          animation:lp 3.5s ease-in-out infinite;
        }
        @keyframes lp{
          0%,100%{box-shadow:0 0 22px rgba(18,214,214,0.4),inset 0 1px 0 rgba(255,255,255,0.12);}
          50%{box-shadow:0 0 36px rgba(18,214,214,0.65),inset 0 1px 0 rgba(255,255,255,0.16);}
        }
        .logo-name{font-size:15px;font-weight:700;color:var(--t1);letter-spacing:-0.3px;}
        .logo-sub{font-size:10px;color:var(--t3);margin-top:1px;}

        /* upload card */
        .uc{
          background:linear-gradient(160deg,rgba(18,214,214,0.06) 0%,rgba(11,29,46,0.45) 100%);
          border:1px dashed var(--b2);border-radius:16px;
          padding:22px 14px 18px;text-align:center;cursor:pointer;display:block;
          position:relative;overflow:hidden;transition:all 0.28s cubic-bezier(0.34,1.56,0.64,1);
        }
        .uc::before{
          content:'';position:absolute;inset:0;
          background:radial-gradient(circle at 50% 0%,rgba(18,214,214,0.09),transparent 68%);
          opacity:0;transition:opacity 0.28s;
        }
        .uc:hover::before,.uc.drag::before{opacity:1;}
        .uc:hover,.uc.drag{border-color:rgba(18,214,214,0.48);transform:translateY(-2px);box-shadow:0 10px 34px rgba(18,214,214,0.10);}
        .uc input{display:none;}
        .uc-ico{font-size:30px;margin-bottom:10px;display:block;animation:ifloat 2.8s ease-in-out infinite;}
        @keyframes ifloat{0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)}}
        .uc-ttl{font-size:12.5px;font-weight:600;color:var(--pri);margin-bottom:5px;}
        .uc-sub{font-size:10px;color:var(--t3);line-height:1.65;}

        .up-btn{
          width:100%;padding:11px;
          background:linear-gradient(135deg,#0d9488,var(--pri));
          border:none;border-radius:10px;color:#fff;
          font-size:12.5px;font-weight:600;cursor:pointer;font-family:'Inter',sans-serif;
          display:flex;align-items:center;justify-content:center;gap:7px;
          transition:all 0.22s;
          box-shadow:0 4px 20px rgba(18,214,214,0.3),inset 0 1px 0 rgba(255,255,255,0.1);
        }
        .up-btn:hover{transform:translateY(-1px);box-shadow:0 7px 30px rgba(18,214,214,0.45),inset 0 1px 0 rgba(255,255,255,0.14);}
        .up-btn:active{transform:translateY(0);}

        .dh{font-size:10px;color:var(--t3);text-align:center;}

        .up-pill{
          display:flex;align-items:center;gap:8px;
          background:rgba(30,230,165,0.08);border:1px solid rgba(30,230,165,0.22);
          border-radius:10px;padding:10px 12px;
          animation:popIn 0.35s cubic-bezier(0.34,1.56,0.64,1);
        }
        @keyframes popIn{from{opacity:0;transform:scale(0.93) translateY(-6px)}to{opacity:1;transform:scale(1) translateY(0)}}
        .up-pname{font-size:11px;font-weight:600;color:var(--acc);flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
        .up-pchk{color:var(--acc);font-size:13px;}

        .spin{width:20px;height:20px;border:2px solid rgba(18,214,214,0.15);border-top-color:var(--pri);border-radius:50%;animation:sp 0.65s linear infinite;margin:0 auto 10px;}
        @keyframes sp{to{transform:rotate(360deg)}}

        /* section label */
        .sl{font-size:10px;font-weight:700;color:var(--t3);text-transform:uppercase;letter-spacing:0.12em;display:flex;align-items:center;justify-content:space-between;}
        .va{font-size:10px;color:var(--pri);cursor:pointer;font-weight:500;text-transform:none;letter-spacing:0;}
        .va:hover{opacity:0.75;}

        /* recent */
        .rl{display:flex;flex-direction:column;gap:1px;}
        .ri{display:flex;align-items:center;gap:10px;padding:8px 10px;cursor:pointer;border-radius:10px;transition:all 0.15s;}
        .ri:hover{background:rgba(18,214,214,0.06);}
        .rfico{width:30px;height:30px;border-radius:7px;flex-shrink:0;background:var(--card2);border:1px solid var(--b1);display:flex;align-items:center;justify-content:center;font-size:13px;}
        .rinf{flex:1;min-width:0;}
        .rname{font-size:11.5px;color:var(--t1);font-weight:500;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
        .rmeta{font-size:9.5px;color:var(--t3);margin-top:1.5px;}
        .rdots{color:var(--t3);font-size:15px;opacity:0;transition:opacity 0.15s;cursor:pointer;}
        .ri:hover .rdots{opacity:1;}

        /* nav */
        .nl{display:flex;flex-direction:column;gap:1px;}
        .ni{display:flex;align-items:center;gap:9px;padding:9px 10px;border-radius:9px;cursor:pointer;font-size:12.5px;color:var(--t3);transition:all 0.15s;font-weight:500;}
        .ni:hover{background:rgba(18,214,214,0.06);color:var(--t2);}
        .nico{font-size:14px;}

        /* disclaimer */
        .disc{
          margin-top:auto;
          background:rgba(18,214,214,0.04);border:1px solid var(--b1);
          border-radius:12px;padding:12px;
          display:flex;gap:9px;align-items:flex-start;cursor:pointer;transition:all 0.2s;
        }
        .disc:hover{background:rgba(18,214,214,0.08);}
        .dico{font-size:15px;flex-shrink:0;margin-top:1px;}
        .dbody{flex:1;}
        .dttl{font-size:10.5px;font-weight:600;color:var(--pri);margin-bottom:2px;}
        .dtxt{font-size:9.5px;color:var(--t3);line-height:1.6;}
        .darr{color:var(--t3);font-size:14px;align-self:center;flex-shrink:0;}

        /* ── MAIN ── */
        .main{flex:1;display:flex;flex-direction:column;overflow:hidden;min-width:0;position:relative;z-index:1;}

        /* topbar */
        .tb{
          padding:10px 22px;
          background:rgba(6,17,31,0.9);
          border-bottom:1px solid var(--b1);
          display:flex;align-items:center;justify-content:space-between;
          flex-shrink:0;backdrop-filter:blur(20px) saturate(1.4);
        }
        .tbl{display:flex;align-items:center;gap:8px;}
        .tbd{width:6px;height:6px;border-radius:50%;background:var(--pri);box-shadow:0 0 0 2.5px rgba(18,214,214,0.2);animation:tbp 2.2s infinite;flex-shrink:0;}
        .tbd.off{background:var(--t3);box-shadow:none;animation:none;}
        @keyframes tbp{0%,100%{box-shadow:0 0 0 2.5px rgba(18,214,214,0.2);}50%{box-shadow:0 0 0 5px rgba(18,214,214,0.04);}}
        .tbt{font-size:12px;color:var(--t3);font-weight:500;}
        .tbf{color:var(--pri);font-weight:600;}
        .tbr{display:flex;align-items:center;gap:10px;}
        .tbbell{width:32px;height:32px;border-radius:8px;background:var(--card2);border:1px solid var(--b1);display:flex;align-items:center;justify-content:center;font-size:13px;cursor:pointer;transition:all 0.18s;}
        .tbbell:hover{background:var(--card);border-color:var(--b2);}
        .tbu{display:flex;align-items:center;gap:8px;}
        .tbav{width:32px;height:32px;border-radius:9px;background:linear-gradient(135deg,#0d9488,var(--pri));display:flex;align-items:center;justify-content:center;font-size:15px;box-shadow:0 0 14px rgba(18,214,214,0.28);}
        .tbun{font-size:12px;font-weight:600;color:var(--t1);}
        .tbus{font-size:9.5px;color:var(--acc);}
        .tbch{color:var(--t3);font-size:10px;cursor:pointer;}

        /* chat */
        .ca{flex:1;overflow-y:auto;padding:36px 48px 20px;display:flex;flex-direction:column;gap:16px;}

        /* empty */
        .empty{margin:auto;text-align:center;display:flex;flex-direction:column;align-items:center;gap:18px;animation:fu 0.55s cubic-bezier(0.22,1,0.36,1);max-width:580px;width:100%;}
        @keyframes fu{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}

        /* hero */
        .hero{position:relative;width:180px;height:180px;display:flex;align-items:center;justify-content:center;}
        .hr{position:absolute;border-radius:50%;border:1px solid rgba(18,214,214,0.13);animation:hring 3.2s ease-in-out infinite;}
        .hr:nth-child(1){width:180px;height:180px;}
        .hr:nth-child(2){width:148px;height:148px;animation-delay:0.4s;}
        .hr:nth-child(3){width:116px;height:116px;animation-delay:0.8s;}
        @keyframes hring{0%,100%{opacity:0.7;transform:scale(1);}50%{opacity:0.22;transform:scale(1.055);}}
        .hcore{
          width:98px;height:98px;border-radius:50%;z-index:2;position:relative;
          background:radial-gradient(circle at 38% 38%,rgba(18,214,214,0.18),rgba(6,17,31,0.95));
          border:1px solid rgba(18,214,214,0.3);
          display:flex;align-items:center;justify-content:center;
          box-shadow:0 0 55px rgba(18,214,214,0.14),0 0 110px rgba(18,214,214,0.05),inset 0 0 32px rgba(18,214,214,0.06);
        }
        .hsteth{font-size:44px;filter:drop-shadow(0 0 14px rgba(18,214,214,0.55));animation:stA 2.6s cubic-bezier(0.37,0,0.63,1) infinite;}
        @keyframes stA{
          0%,100%{transform:translateY(0) rotate(-6deg) scale(1);}
          28%{transform:translateY(-9px) rotate(6deg) scale(1.06);}
          58%{transform:translateY(-5px) rotate(-3deg) scale(1.02);}
        }
        .hside{position:absolute;font-size:24px;z-index:3;filter:drop-shadow(0 0 10px rgba(18,214,214,0.32));animation:sf ease-in-out infinite;}
        .hside.l{left:-14px;top:50%;animation-duration:3.2s;animation-delay:0.6s;}
        .hside.r{right:-14px;top:50%;animation-duration:3.8s;animation-delay:0.1s;}
        @keyframes sf{0%,100%{transform:translateY(-50%) scale(1);}50%{transform:translateY(calc(-50% - 9px)) scale(1.12);}}

        .et{font-size:30px;font-weight:800;color:var(--t1);letter-spacing:-0.6px;line-height:1.15;}
        .et em{color:var(--pri);font-style:normal;}
        .es{font-size:14px;color:var(--t2);line-height:1.8;}

        .ebtn{
          padding:13px 34px;
          background:linear-gradient(135deg,#0d9488,var(--pri));
          border:none;border-radius:12px;color:#fff;
          font-size:14px;font-weight:600;cursor:pointer;font-family:'Inter',sans-serif;
          display:flex;align-items:center;gap:8px;
          box-shadow:0 4px 28px rgba(18,214,214,0.38),inset 0 1px 0 rgba(255,255,255,0.12);
          transition:all 0.22s;
        }
        .ebtn:hover{transform:translateY(-2px);box-shadow:0 8px 42px rgba(18,214,214,0.52),inset 0 1px 0 rgba(255,255,255,0.16);}
        .ebtn:active{transform:translateY(0);}
        .ddhint{font-size:11.5px;color:var(--t3);}

        .feats{display:flex;gap:10px;width:100%;}
        .fc{
          flex:1;background:rgba(11,29,46,0.72);border:1px solid var(--b1);
          border-radius:16px;padding:18px 14px 16px;text-align:center;
          backdrop-filter:blur(12px);transition:all 0.22s;
        }
        .fc:hover{background:rgba(16,39,58,0.92);border-color:var(--b2);transform:translateY(-3px);box-shadow:0 12px 32px rgba(18,214,214,0.08);}
        .fico{width:40px;height:40px;border-radius:11px;margin:0 auto 12px;background:rgba(18,214,214,0.08);border:1px solid rgba(18,214,214,0.16);display:flex;align-items:center;justify-content:center;font-size:19px;}
        .fttl{font-size:12px;font-weight:600;color:var(--t1);margin-bottom:5px;}
        .fsub{font-size:10.5px;color:var(--t3);line-height:1.55;}

        /* messages */
        .msg{display:flex;flex-direction:column;gap:5px;animation:mi 0.22s ease;}
        .msg.user{align-items:flex-end;}.msg.ai{align-items:flex-start;}
        @keyframes mi{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
        .mlbl{font-size:10.5px;font-weight:600;color:var(--t3);padding:0 4px;}
        .bbl{max-width:68%;padding:12px 16px;font-size:13.5px;line-height:1.78;border-radius:18px;white-space:pre-wrap;}
        .msg.user .bbl{background:linear-gradient(135deg,#0d9488,var(--pri));color:#fff;border-bottom-right-radius:4px;box-shadow:0 4px 22px rgba(18,214,214,0.28);}
        .msg.ai .bbl{background:rgba(18,214,214,0.05);color:var(--t1);border:1px solid var(--b1);border-bottom-left-radius:4px;}
        .tbbl{background:rgba(18,214,214,0.05);border:1px solid var(--b1);border-radius:18px;border-bottom-left-radius:4px;padding:14px 18px;display:flex;align-items:center;gap:5px;}
        .td{width:6px;height:6px;border-radius:50%;background:var(--pri);animation:tda 1.2s infinite;}
        .td:nth-child(2){animation-delay:.2s}.td:nth-child(3){animation-delay:.4s}
        @keyframes tda{0%,60%,100%{transform:translateY(0);opacity:0.25}30%{transform:translateY(-7px);opacity:1}}

        /* input */
        .iw{padding:10px 22px 15px;background:rgba(6,17,31,0.93);border-top:1px solid var(--b1);flex-shrink:0;backdrop-filter:blur(20px);}
        .sr{display:flex;gap:6px;flex-wrap:nowrap;overflow-x:auto;margin-bottom:9px;padding-bottom:1px;}
        .sr::-webkit-scrollbar{height:0;}
        .schip{
          background:rgba(18,214,214,0.05);border:1px solid var(--b1);
          border-radius:20px;padding:5px 13px;
          font-size:11px;color:var(--t3);cursor:pointer;white-space:nowrap;
          font-family:'Inter',sans-serif;font-weight:500;
          display:flex;align-items:center;gap:5px;
          transition:all 0.18s;flex-shrink:0;
        }
        .schip:hover{background:rgba(18,214,214,0.10);border-color:var(--b2);color:var(--pri);transform:translateY(-1px);}

        .ish{
          background:var(--card2);border:1px solid var(--b1);
          border-radius:14px;padding:4px 6px 4px 4px;
          display:flex;align-items:flex-end;gap:6px;
          transition:border-color 0.2s,box-shadow 0.2s;
          box-shadow:0 2px 18px rgba(0,0,0,0.22);
        }
        .ish:focus-within{border-color:rgba(18,214,214,0.36);box-shadow:0 0 0 3px rgba(18,214,214,0.06),0 2px 18px rgba(0,0,0,0.22);}
        .iatt{width:36px;height:36px;border-radius:9px;flex-shrink:0;background:var(--card);border:1px solid var(--b1);display:flex;align-items:center;justify-content:center;font-size:15px;cursor:pointer;transition:all 0.18s;align-self:flex-end;margin-bottom:2px;}
        .iatt:hover{background:rgba(18,214,214,0.08);border-color:var(--b2);}
        .ibox{flex:1;background:transparent;border:none;outline:none;padding:10px 8px;font-size:13px;font-family:'Inter',sans-serif;color:var(--t1);resize:none;line-height:1.55;max-height:110px;}
        .ibox::placeholder{color:var(--t3);}
        .ibox:disabled{opacity:0.4;}
        .irght{display:flex;gap:5px;align-items:center;flex-shrink:0;align-self:flex-end;margin-bottom:2px;}
        .imeta{display:flex;flex-direction:column;align-items:flex-end;margin-right:2px;}
        .ishort{font-size:10px;color:var(--t3);white-space:nowrap;}
        .imic{width:36px;height:36px;border-radius:9px;background:var(--card);border:1px solid var(--b1);display:flex;align-items:center;justify-content:center;font-size:15px;cursor:pointer;transition:all 0.18s;}
        .imic:hover{background:rgba(18,214,214,0.08);border-color:var(--b2);}
        .isend{
          width:36px;height:36px;border-radius:9px;
          background:linear-gradient(135deg,#0d9488,var(--pri));
          border:none;cursor:pointer;color:#fff;font-size:14px;
          display:flex;align-items:center;justify-content:center;
          transition:all 0.2s;flex-shrink:0;
          box-shadow:0 3px 14px rgba(18,214,214,0.38),inset 0 1px 0 rgba(255,255,255,0.12);
        }
        .isend:hover{transform:scale(1.09);box-shadow:0 5px 24px rgba(18,214,214,0.56);}
        .isend:active{transform:scale(0.95);}
        .isend:disabled{background:var(--card);box-shadow:none;cursor:default;transform:none;opacity:0.5;}
        .iftr{display:flex;justify-content:space-between;margin-top:6px;padding:0 2px;}
        .ifl,.ifr{font-size:10px;color:var(--t3);}
      `}</style>

      {/* Particles */}
      <div className="pts">
        {[...Array(14)].map((_, i) => (
          <div
            key={i}
            className="pt"
            style={{
              left: `${Math.random() * 100}%`,
              width: `${Math.random() * 3 + 1.5}px`,
              height: `${Math.random() * 3 + 1.5}px`,
              animationDuration: `${Math.random() * 18 + 12}s`,
              animationDelay: `${Math.random() * 12}s`,
            }}
          />
        ))}
      </div>

      <div className="app">
        <div className="amb" />

        {/* SIDEBAR */}
        <div className="sb">
          <div className="sbi">
            <div className="logo">
              <div className="logo-ico">🏥</div>
              <div>
                <div className="logo-name">MediQuery AI</div>
                <div className="logo-sub">AI Medical Assistant</div>
              </div>
            </div>

            <label
              className={`uc ${dragOver ? "drag" : ""}`}
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
                  <div className="uc-ttl">Processing PDF…</div>
                  <div className="uc-sub">Extracting and indexing</div>
                </>
              ) : (
                <>
                  <span className="uc-ico">📂</span>
                  <div className="uc-ttl">Upload Medical PDF</div>
                  <div className="uc-sub">
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
                <span className="up-pname">{filename}</span>
                <span className="up-pchk">✓</span>
              </div>
            )}

            <div className="sl">
              Recent Documents <span className="va">View all</span>
            </div>

            <div className="rl">
              {recentDocs.map((d, i) => (
                <div key={i} className="ri">
                  <div
                    className="rfico"
                    style={{ borderColor: `${d.color}28` }}
                  >
                    📄
                  </div>
                  <div className="rinf">
                    <div className="rname">{d.name}</div>
                    <div className="rmeta">
                      {d.date} · {d.size}
                    </div>
                  </div>
                  <span className="rdots">⋯</span>
                </div>
              ))}
            </div>

            <div className="nl">
              <div className="ni">
                <span className="nico">💬</span>Chat History
              </div>
              <div className="ni">
                <span className="nico">📝</span>Templates
              </div>
              <div className="ni">
                <span className="nico">⚙️</span>Settings
              </div>
            </div>

            <div className="disc">
              <span className="dico">⚠️</span>
              <div className="dbody">
                <div className="dttl">For educational use only</div>
                <div className="dtxt">
                  Always consult a qualified doctor for medical decisions.
                </div>
              </div>
              <span className="darr">›</span>
            </div>
          </div>
        </div>

        {/* MAIN */}
        <div className="main">
          <div className="tb">
            <div className="tbl">
              <div className={`tbd ${uploaded ? "" : "off"}`} />
              <span className="tbt">
                {uploaded ? (
                  <>
                    <span className="tbf">{filename}</span> · Ready to answer
                    questions
                  </>
                ) : (
                  "No document loaded — upload a PDF to begin"
                )}
              </span>
            </div>
            <div className="tbr">
              <div className="tbbell">🔔</div>
              <div className="tbu">
                <div className="tbav">🤖</div>
                <div>
                  <div className="tbun">AI Assistant</div>
                  <div className="tbus">● Online</div>
                </div>
                <span className="tbch">▾</span>
              </div>
            </div>
          </div>

          <div className="ca">
            {messages.length === 0 ? (
              <div className="empty">
                <div className="hero">
                  <div className="hr" />
                  <div className="hr" />
                  <div className="hr" />
                  <div className="hcore">
                    <span className="hsteth">🩺</span>
                  </div>
                  <span className="hside l">💗</span>
                  <span className="hside r">🧪</span>
                </div>
                <div className="et">
                  Upload a <em>medical PDF</em>
                </div>
                <div className="es">
                  Ask medical questions in plain English.
                  <br />
                  No medical knowledge needed.
                </div>
                <button
                  className="ebtn"
                  onClick={() => fileInputRef.current?.click()}
                >
                  ⬆️ Upload PDF
                </button>
                <div className="ddhint">or drag and drop here</div>
                <div className="feats">
                  {features.map((f, i) => (
                    <div key={i} className="fc">
                      <div className="fico">{f.emoji}</div>
                      <div className="fttl">{f.title}</div>
                      <div className="fsub">{f.sub}</div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <>
                {messages.map((m, i) => (
                  <div key={i} className={`msg ${m.role}`}>
                    <span className="mlbl">
                      {m.role === "user" ? "You" : "MediQuery AI"}
                    </span>
                    <div className="bbl">{m.text}</div>
                  </div>
                ))}
                {loading && (
                  <div className="msg ai">
                    <span className="mlbl">MediQuery AI</span>
                    <div className="tbbl">
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

          <div className="iw">
            <div className="sr">
              {suggestions.map((s, i) => (
                <button
                  key={i}
                  className="schip"
                  onClick={() => {
                    setQuestion(s.text);
                    inputRef.current?.focus();
                  }}
                >
                  {s.icon} {s.text}
                </button>
              ))}
            </div>
            <div className="ish">
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
                    ? "Upload a PDF first or ask a medical question…"
                    : "Upload a PDF first…"
                }
                disabled={loading}
              />
              <div className="irght">
                <div className="imeta">
                  <span className="ishort">Shift + Enter for new line</span>
                </div>
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
            <div className="iftr">
              <span className="ifl"></span>
              <span className="ifr">
                AI can make mistakes. Always verify important medical
                information.
              </span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
