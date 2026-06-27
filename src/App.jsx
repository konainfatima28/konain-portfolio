import { useState, useEffect, useRef } from "react";

// ── Palette ──────────────────────────────────────────────────────────────────
const C = {
  bg: "#0B0B0F",
  surface: "#14181F",
  border: "#23262D",
  primary: "#FFFFFF",
  secondary: "#AEB4C2",
  accent: "#6C63FF",
  accentDim: "rgba(108,99,255,0.12)",
  accentGlow: "rgba(108,99,255,0.35)",
  success: "#22C55E",
};

// ── Neural Canvas ─────────────────────────────────────────────────────────────
function NeuralCanvas() {
  const canvasRef = useRef(null);
  const rafRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let W, H, nodes;

    const COLORS = ["#6C63FF", "#8B85FF", "#A09AFF", "#22C55E"];

    function init() {
      W = canvas.width = canvas.offsetWidth;
      H = canvas.height = canvas.offsetHeight;
      nodes = Array.from({ length: 52 }, () => ({
        x: Math.random() * W,
        y: Math.random() * H,
        vx: (Math.random() - 0.5) * 0.35,
        vy: (Math.random() - 0.5) * 0.35,
        r: Math.random() * 2.2 + 1,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        pulse: Math.random() * Math.PI * 2,
      }));
    }

    function draw() {
      ctx.clearRect(0, 0, W, H);

      nodes.forEach((n) => {
        n.x += n.vx;
        n.y += n.vy;
        if (n.x < 0 || n.x > W) n.vx *= -1;
        if (n.y < 0 || n.y > H) n.vy *= -1;
        n.pulse += 0.018;
      });

      // edges
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[i].x - nodes[j].x;
          const dy = nodes[i].y - nodes[j].y;
          const d = Math.sqrt(dx * dx + dy * dy);
          if (d < 140) {
            const alpha = (1 - d / 140) * 0.18;
            ctx.beginPath();
            ctx.strokeStyle = `rgba(108,99,255,${alpha})`;
            ctx.lineWidth = 0.8;
            ctx.moveTo(nodes[i].x, nodes[i].y);
            ctx.lineTo(nodes[j].x, nodes[j].y);
            ctx.stroke();
          }
        }
      }

      // nodes
      nodes.forEach((n) => {
        const pulse = Math.sin(n.pulse) * 0.4 + 0.7;
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r * pulse, 0, Math.PI * 2);
        ctx.fillStyle = n.color + "CC";
        ctx.fill();
        // glow
        const grd = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, n.r * 5 * pulse);
        grd.addColorStop(0, n.color + "33");
        grd.addColorStop(1, "transparent");
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r * 5 * pulse, 0, Math.PI * 2);
        ctx.fillStyle = grd;
        ctx.fill();
      });

      rafRef.current = requestAnimationFrame(draw);
    }

    init();
    draw();

    const ro = new ResizeObserver(init);
    ro.observe(canvas);

    return () => {
      cancelAnimationFrame(rafRef.current);
      ro.disconnect();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        opacity: 0.55,
        pointerEvents: "none",
      }}
    />
  );
}

// ── Shared Styles ─────────────────────────────────────────────────────────────
const gs = {
  fontFamily: "'Inter', system-ui, sans-serif",
  color: C.primary,
  bg: C.bg,
};

const tag = (text, color = C.accent) => (
  <span
    key={text}
    style={{
      display: "inline-block",
      padding: "3px 10px",
      borderRadius: 999,
      background: color + "18",
      border: `1px solid ${color}40`,
      color: color,
      fontSize: 11,
      fontWeight: 600,
      letterSpacing: "0.06em",
      textTransform: "uppercase",
      fontFamily: "'Inter', sans-serif",
      lineHeight: 1.6,
    }}
  >
    {text}
  </span>
);

function SectionLabel({ children }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        marginBottom: 48,
        justifyContent: "flex-start",
      }}
    >
      <span
        style={{
          width: 28,
          height: 1,
          background: C.accent,
          display: "inline-block",
          flexShrink: 0,
        }}
      />
      <span
        style={{
          color: C.accent,
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: "0.14em",
          textTransform: "uppercase",
          fontFamily: "'Inter', sans-serif",
        }}
      >
        {children}
      </span>
    </div>
  );
}

function SectionHeading({ children }) {
  return (
    <h2
      style={{
        fontFamily: "'Space Grotesk', sans-serif",
        fontSize: "clamp(28px, 4vw, 44px)",
        fontWeight: 700,
        color: C.primary,
        margin: "0 0 16px 0",
        lineHeight: 1.15,
        letterSpacing: "-0.02em",
        textAlign: "left",
      }}
    >
      {children}
    </h2>
  );
}

function Card({ children, style = {}, hover = true }) {
  const [hov, setHov] = useState(false);
  return (
    <div
      onMouseEnter={() => hover && setHov(true)}
      onMouseLeave={() => hover && setHov(false)}
      style={{
        background: C.surface,
        border: `1px solid ${hov ? C.accent + "60" : C.border}`,
        borderRadius: 16,
        padding: 28,
        transition: "border-color 0.25s, box-shadow 0.25s, transform 0.25s",
        boxShadow: hov ? `0 0 0 1px ${C.accent}20, 0 8px 40px rgba(0,0,0,0.5)` : "none",
        transform: hov ? "translateY(-3px)" : "none",
        textAlign: "left",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

// ── Navigation ────────────────────────────────────────────────────────────────
const NAV = ["Home", "About", "Skills", "Projects", "Research", "Experience", "Contact"];

function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", h);
    return () => window.removeEventListener("scroll", h);
  }, []);

  const scrollTo = (id) => {
    const el = document.getElementById(id.toLowerCase());
    if (el) el.scrollIntoView({ behavior: "smooth" });
    setMenuOpen(false);
  };

  return (
    <nav
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 100,
        height: 64,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 clamp(20px, 5vw, 80px)",
        background: scrolled ? "rgba(11,11,15,0.82)" : "transparent",
        backdropFilter: scrolled ? "blur(20px)" : "none",
        borderBottom: scrolled ? `1px solid ${C.border}` : "1px solid transparent",
        transition: "all 0.35s",
      }}
    >
      {/* Premium Typographic Logo Block */}
      <div 
        onClick={() => scrollTo("home")} 
        style={{ 
          fontFamily: "'Space Grotesk', sans-serif",
          fontWeight: 800,
          fontSize: 20,
          letterSpacing: "-0.03em",
          cursor: "pointer", 
          display: "flex", 
          alignItems: "center",
          userSelect: "none"
        }}
      >
        <span style={{ color: "#FFFFFF" }}>K</span>
        <span style={{ color: "#AEB4C2" }}>F</span>
        <span style={{ color: "#6C63FF", marginLeft: "2px", textShadow: "0 0 12px rgba(108,99,255,0.6)" }}>•</span>
      </div>

      {/* Desktop */}
      <div style={{ display: "flex", gap: 4, alignItems: "center" }} className="nav-desktop">
        {NAV.map((n) => (
          <button
            key={n}
            onClick={() => scrollTo(n)}
            style={{
              background: "none",
              border: "none",
              color: C.secondary,
              fontSize: 13,
              fontWeight: 500,
              padding: "6px 14px",
              cursor: "pointer",
              borderRadius: 8,
              fontFamily: "'Inter', sans-serif",
              transition: "color 0.2s, background 0.2s",
            }}
            onMouseEnter={(e) => {
              e.target.style.color = C.primary;
              e.target.style.background = "rgba(255,255,255,0.06)";
            }}
            onMouseLeave={(e) => {
              e.target.style.color = C.secondary;
              e.target.style.background = "transparent";
            }}
          >
            {n}
          </button>
        ))}
      </div>

      {/* Mobile burger */}
      <button
        onClick={() => setMenuOpen(!menuOpen)}
        style={{
          display: "none",
          background: "none",
          border: `1px solid ${C.border}`,
          borderRadius: 8,
          padding: "6px 10px",
          cursor: "pointer",
          color: C.primary,
          fontSize: 18,
        }}
        className="nav-burger"
      >
        {menuOpen ? "✕" : "☰"}
      </button>

      {menuOpen && (
        <div
          style={{
            position: "fixed",
            top: 64,
            left: 0,
            right: 0,
            background: "rgba(11,11,15,0.96)",
            backdropFilter: "blur(20px)",
            borderBottom: `1px solid ${C.border}`,
            padding: "16px 24px",
            display: "flex",
            flexDirection: "column",
            gap: 4,
          }}
        >
          {NAV.map((n) => (
            <button
              key={n}
              onClick={() => scrollTo(n)}
              style={{
                background: "none",
                border: "none",
                color: C.secondary,
                fontSize: 15,
                fontWeight: 500,
                padding: "12px 0",
                cursor: "pointer",
                textAlign: "left",
                borderBottom: `1px solid ${C.border}`,
                fontFamily: "'Inter', sans-serif",
              }}
            >
              {n}
            </button>
          ))}
        </div>
      )}
    </nav>
  );
}

// ── Hero ──────────────────────────────────────────────────────────────────────
function Hero() {
  const chips = ["Agentic AI", "RAG Systems", "LangGraph", "GPT-4o", "Computer Vision"];

  return (
    <section
      id="home"
      style={{
        position: "relative",
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        overflow: "hidden",
        padding: "120px clamp(20px, 8vw, 120px) 80px",
      }}
    >
      <NeuralCanvas />

      <div
        style={{
          position: "absolute",
          top: "30%",
          left: "50%",
          transform: "translate(-50%,-50%)",
          width: 800,
          height: 500,
          background: `radial-gradient(ellipse at center, ${C.accent}18 0%, transparent 70%)`,
          pointerEvents: "none",
        }}
      />

      <div style={{ position: "relative", maxWidth: 800, textAlign: "left" }}>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 28, justifyContent: "flex-start" }}>
          {chips.map((c) => tag(c))}
        </div>

        <h1
          style={{
            fontFamily: "'Space Grotesk', sans-serif",
            fontSize: "clamp(44px, 7vw, 88px)",
            fontWeight: 800,
            color: C.primary,
            margin: "0 0 8px 0",
            lineHeight: 1.0,
            letterSpacing: "-0.035em",
            textAlign: "left",
          }}
        >
          Konain
          <br />
          <span style={{ color: C.accent }}>Fatima</span>
        </h1>

        <div
          style={{
            display: "inline-block",
            fontFamily: "'Space Grotesk', sans-serif",
            fontSize: "clamp(16px, 2.2vw, 22px)",
            fontWeight: 600,
            color: C.secondary,
            marginBottom: 24,
            letterSpacing: "0.01em",
            textAlign: "left",
          }}
        >
          AI Engineer
        </div>

        <p
          style={{
            fontSize: "clamp(15px, 1.6vw, 17px)",
            color: C.secondary,
            lineHeight: 1.75,
            maxWidth: 560,
            marginBottom: 40,
            fontFamily: "'Inter', sans-serif",
            textAlign: "left",
          }}
        >
          Building intelligent AI systems powered by Agentic AI, Retrieval-Augmented Generation, Machine Learning, Computer Vision, and AI Automation.
        </p>

        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "flex-start" }}>
          <HeroBtn primary onClick={() => document.getElementById("projects").scrollIntoView({ behavior: "smooth" })}>
            View Projects →
          </HeroBtn>
          <HeroBtn href="https://github.com/konainfatima28" target="_blank">
            GitHub
          </HeroBtn>
          <HeroBtn href="https://drive.google.com/file/d/1O6hYlJwtFNAbhKzGjPaagQy5EGRIzBiT/view?usp=drivesdk" target="_blank">
            Download Resume
          </HeroBtn>
        </div>
      </div>
    </section>
  );
}

function HeroBtn({ children, primary, onClick, href, target }) {
  const [hov, setHov] = useState(false);
  const base = {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    padding: "13px 26px",
    borderRadius: 10,
    fontSize: 14,
    fontWeight: 600,
    cursor: "pointer",
    textDecoration: "none",
    fontFamily: "'Inter', sans-serif",
    transition: "all 0.2s",
    border: "1px solid transparent",
  };
  const style = primary
    ? {
        ...base,
        background: hov ? "#7B74FF" : C.accent,
        color: "#fff",
        boxShadow: hov ? `0 0 24px ${C.accentGlow}` : `0 0 0 ${C.accentGlow}`,
        transform: hov ? "translateY(-1px)" : "none",
      }
    : {
        ...base,
        background: hov ? "rgba(255,255,255,0.07)" : "transparent",
        color: C.primary,
        border: `1px solid ${hov ? C.accent + "80" : C.border}`,
      };

  return href ? (
    <a href={href} target={target} style={style} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}>
      {children}
    </a>
  ) : (
    <button onClick={onClick} style={style} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}>
      {children}
    </button>
  );
}

// ── About ─────────────────────────────────────────────────────────────────────
function About() {
  const expertise = [
    { icon: "🧠", label: "Agentic AI", desc: "Multi-agent systems with autonomous decision loops" },
    { icon: "📚", label: "RAG Systems", desc: "Hybrid retrieval with semantic + keyword search" },
    { icon: "⚡", label: "Generative AI", desc: "GPT-4o, LangChain, prompt engineering at scale" },
    { icon: "🔬", label: "Machine Learning", desc: "Scikit-learn, TensorFlow, deep learning pipelines" },
    { icon: "👁", label: "Computer Vision", desc: "OpenCV, MediaPipe, FaceNet, pose estimation" },
    { icon: "🤖", label: "AI Automation", desc: "n8n workflows, chatbots, intelligent pipelines" },
    { icon: "🔍", label: "Explainable AI", desc: "SHAP, feature attribution, model interpretability" },
  ];

  return (
    <section
      id="about"
      style={{
        padding: "120px clamp(20px, 8vw, 120px)",
        borderTop: `1px solid ${C.border}`,
      }}
    >
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <SectionLabel>About</SectionLabel>

        <div className="about-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 80, alignItems: "start" }}>
          <div style={{ textAlign: "left" }}>
            <SectionHeading>
              Engineering AI that
              <br />
              <span style={{ color: C.accent }}>solves real problems</span>
            </SectionHeading>
            <p style={{ color: C.secondary, lineHeight: 1.8, fontSize: 15, marginTop: 20, fontFamily: "'Inter', sans-serif" }}>
              I'm a final-year B.Tech CSE (AI/ML) student building production-grade AI systems that go beyond demos. My work spans agentic pipelines, document intelligence, healthcare AI, and computer vision — systems designed to be deployed, evaluated, and trusted.
            </p>
            <p style={{ color: C.secondary, lineHeight: 1.8, fontSize: 15, marginTop: 16, fontFamily: "'Inter', sans-serif" }}>
              I care about the full stack of AI: not just model accuracy, but retrieval quality, explainability, latency, and the engineering decisions that make systems maintainable in production.
            </p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            {expertise.map((e) => (
              <Card key={e.label} style={{ padding: "18px 20px" }}>
                <div style={{ fontSize: 20, marginBottom: 8 }}>{e.icon}</div>
                <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, fontSize: 13, color: C.primary, marginBottom: 4 }}>
                  {e.label}
                </div>
                <div style={{ fontSize: 12, color: C.secondary, lineHeight: 1.5, fontFamily: "'Inter', sans-serif" }}>
                  {e.desc}
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// ── Skills ────────────────────────────────────────────────────────────────────
const SKILLS = [
  {
    category: "Programming",
    items: ["Python", "SQL", "Git"],
  },
  {
    category: "AI & Machine Learning",
    items: ["TensorFlow", "Keras", "Scikit-learn", "NLP", "Computer Vision", "Deep Learning", "Generative AI", "Agentic AI", "RAG"],
  },
  {
    category: "Frameworks & Libraries",
    items: ["LangChain", "LangGraph", "Streamlit", "OpenCV", "MediaPipe"],
  },
  {
    category: "Databases",
    items: ["SQLite", "ChromaDB", "Firebase"],
  },
  {
    category: "Developer Tools",
    items: ["GitHub", "VS Code", "Google Colab", "Render", "n8n"],
  },
];

function Skills() {
  return (
    <section
      id="skills"
      style={{
        padding: "120px clamp(20px, 8vw, 120px)",
        borderTop: `1px solid ${C.border}`,
        background: `linear-gradient(180deg, ${C.surface}60 0%, transparent 100%)`,
      }}
    >
      <div style={{ maxWidth: 1100, margin: "0 auto", textAlign: "left" }}>
        <SectionLabel>Skills</SectionLabel>
        <SectionHeading>Technical Expertise</SectionHeading>
        <p style={{ color: C.secondary, fontSize: 15, marginBottom: 48, fontFamily: "'Inter', sans-serif" }}>
          A production-focused stack built around modern AI engineering.
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 20 }}>
          {SKILLS.map((s) => (
            <Card key={s.category}>
              <h3
                style={{
                  fontFamily: "'Space Grotesk', sans-serif",
                  fontSize: 14,
                  fontWeight: 700,
                  color: C.accent,
                  marginBottom: 16,
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                }}
              >
                {s.category}
              </h3>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "flex-start" }}>
                {s.items.map((item) => (
                  <span
                    key={item}
                    style={{
                      padding: "5px 12px",
                      background: "rgba(255,255,255,0.05)",
                      border: `1px solid ${C.border}`,
                      borderRadius: 8,
                      fontSize: 13,
                      color: C.primary,
                      fontFamily: "'Inter', sans-serif",
                    }}
                  >
                    {item}
                  </span>
                ))}
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Projects ──────────────────────────────────────────────────────────────────
const PROJECTS = [
  {
    featured: true,
    title: "DocuVision AI",
    subtitle: "Agentic RAG System",
    desc: "Production-grade multi-agent PDF intelligence platform capable of understanding complex documents with tables, charts, figures, and multi-page layouts. Features hybrid retrieval (BM25 + ChromaDB), HyDE, CrossEncoder reranking, agent tracing, confidence scoring, and RAGAS-based evaluation.",
    stack: ["LangGraph", "GPT-4o", "ChromaDB", "BM25", "LangChain", "RAGAS", "Streamlit"],
    achievements: [
      "Context Precision: 0.11 → 0.907",
      "Multi-agent LangGraph architecture",
      "4-tab Streamlit interface with trace viewer",
    ],
    github: "https://github.com/konainfatima28/agentic-pdf-rag-3.0",
    color: C.accent,
  },
  {
    title: "Smart Attendance System",
    subtitle: "AI Classroom Monitor",
    desc: "AI-powered classroom monitoring platform using real-time face recognition, emotion detection, and pose estimation. Features automated attendance marking, live analytics dashboard, and behavioral insights for educators.",
    stack: ["TensorFlow", "OpenCV", "FaceNet", "MediaPipe", "Python"],
    achievements: [
      "99.3% validation accuracy",
      "Real-time multi-face recognition",
      "Emotion + pose analytics dashboard",
    ],
    github: "https://github.com/konainfatima28/Learning-Management-System",
    color: C.success,
  },
  {
    title: "AI Resume Reviewer",
    subtitle: "ATS Analyzer",
    desc: "AI-powered resume evaluation platform with ATS compatibility scoring, semantic keyword analysis, role-specific gap detection, and actionable improvement recommendations tailored to job descriptions.",
    stack: ["Python", "NLP", "Streamlit", "Sentence-Transformers", "ChromaDB"],
    achievements: [
      "Semantic ATS scoring",
      "Keyword gap analysis",
      "Personalized improvement engine",
    ],
    github: "https://github.com/konainfatima28/Live-Projects",
    color: "#F59E0B",
  },
];

function Projects() {
  return (
    <section
      id="projects"
      style={{
        padding: "120px clamp(20px, 8vw, 120px)",
        borderTop: `1px solid ${C.border}`,
      }}
    >
      <div style={{ maxWidth: 1100, margin: "0 auto", textAlign: "left" }}>
        <SectionLabel>Projects</SectionLabel>
        <SectionHeading>Featured Work</SectionHeading>
        <p style={{ color: C.secondary, fontSize: 15, marginBottom: 56, fontFamily: "'Inter', sans-serif" }}>
          Production-focused systems designed for real-world deployment.
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          {PROJECTS.map((p, i) => (
            <ProjectCard key={p.title} project={p} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}

function ProjectCard({ project: p }) {
  const [hov, setHov] = useState(false);

  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background: C.surface,
        border: `1px solid ${hov ? p.color + "50" : C.border}`,
        borderRadius: 20,
        padding: "36px 40px",
        display: "flex",
        flexDirection: "column",
        gap: 20,
        transition: "all 0.3s",
        boxShadow: hov ? `0 0 0 1px ${p.color}20, 0 12px 48px rgba(0,0,0,0.5)` : "none",
        transform: hov ? "translateY(-4px)" : "none",
        position: "relative",
        overflow: "hidden",
        width: "100%",
        textAlign: "left",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: -60,
          right: -60,
          width: 200,
          height: 200,
          background: `radial-gradient(circle, ${p.color}12 0%, transparent 70%)`,
          pointerEvents: "none",
          transition: "opacity 0.3s",
          opacity: hov ? 1 : 0.4,
        }}
      />

      <div style={{ width: "100%" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12, justifyContent: "flex-start" }}>
          {p.featured && (
            <span
              style={{
                padding: "3px 10px",
                background: p.color + "20",
                border: `1px solid ${p.color}50`,
                borderRadius: 999,
                fontSize: 10,
                fontWeight: 700,
                color: p.color,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                fontFamily: "'Inter', sans-serif",
              }}
            >
              Featured
            </span>
          )}
          <span style={{ color: C.secondary, fontSize: 12, fontFamily: "'Inter', sans-serif" }}>
            {p.subtitle}
          </span>
        </div>

        <h3
          style={{
            fontFamily: "'Space Grotesk', sans-serif",
            fontSize: "clamp(20px, 2.5vw, 26px)",
            fontWeight: 700,
            color: C.primary,
            margin: "0 0 14px 0",
            letterSpacing: "-0.01em",
          }}
        >
          {p.title}
        </h3>

        <p style={{ color: C.secondary, fontSize: 14, lineHeight: 1.75, marginBottom: 20, fontFamily: "'Inter', sans-serif", maxWidth: "100%" }}>
          {p.desc}
        </p>

        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 24, justifyContent: "flex-start" }}>
          {p.stack.map((s) => (
            <span
              key={s}
              style={{
                padding: "4px 11px",
                background: "rgba(255,255,255,0.05)",
                border: `1px solid ${C.border}`,
                borderRadius: 6,
                fontSize: 11,
                color: C.secondary,
                fontFamily: "'Inter', sans-serif",
                fontWeight: 500,
              }}
            >
              {s}
            </span>
          ))}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 28 }}>
          {p.achievements.map((a) => (
            <div key={a} style={{ display: "flex", alignItems: "center", gap: 10, justifyContent: "flex-start" }}>
              <div style={{ width: 5, height: 5, borderRadius: "50%", background: p.color, flexShrink: 0 }} />
              <span style={{ fontSize: 13, color: C.secondary, fontFamily: "'Inter', sans-serif" }}>{a}</span>
            </div>
          ))}
        </div>

        <div style={{ display: "flex", gap: 10, justifyContent: "flex-start" }}>
          <a
            href={p.github}
            target="_blank"
            rel="noreferrer"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "9px 18px",
              background: "transparent",
              border: `1px solid ${C.border}`,
              borderRadius: 8,
              color: C.primary,
              fontSize: 13,
              fontWeight: 500,
              textDecoration: "none",
              fontFamily: "'Inter', sans-serif",
              transition: "border-color 0.2s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.borderColor = p.color + "80")}
            onMouseLeave={(e) => (e.currentTarget.style.borderColor = C.border)}
          >
            GitHub ↗
          </a>
        </div>
      </div>
    </div>
  );
}

// ── Research ──────────────────────────────────────────────────────────────────
function Research() {
  return (
    <section
      id="research"
      style={{
        padding: "120px clamp(20px, 8vw, 120px)",
        borderTop: `1px solid ${C.border}`,
        background: `linear-gradient(180deg, ${C.surface}40 0%, transparent 100%)`,
      }}
    >
      <div style={{ maxWidth: 1100, margin: "0 auto", textAlign: "left" }}>
        <SectionLabel>Research</SectionLabel>
        <SectionHeading>Publications</SectionHeading>

        <Card
          style={{
            marginTop: 40,
            padding: "40px 44px",
            borderColor: C.accent + "40",
            background: `linear-gradient(135deg, ${C.surface} 0%, ${C.accentDim} 100%)`,
          }}
        >
          <div style={{ display: "flex", gap: 20, alignItems: "flex-start", flexWrap: "wrap", justifyContent: "flex-start" }}>
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: 12,
                background: C.accentDim,
                border: `1px solid ${C.accent}40`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 24,
                flexShrink: 0,
              }}
            >
              📄
            </div>
            <div style={{ flex: 1, minWidth: 240, textAlign: "left" }}>
              <div style={{ display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap", justifyContent: "flex-start" }}>
                {tag("Under Review")}
                {tag("IEEE Journal", C.success)}
              </div>
              <h3
                style={{
                  fontFamily: "'Space Grotesk', sans-serif",
                  fontSize: "clamp(16px, 2vw, 20px)",
                  fontWeight: 700,
                  color: C.primary,
                  margin: "0 0 12px 0",
                  lineHeight: 1.4,
                  letterSpacing: "-0.01em",
                }}
              >
                An Explainable AI Framework for Breast Cancer Prediction Using Machine Learning Models and Feature Attribution Methods
              </h3>
              <p style={{ color: C.secondary, fontSize: 14, marginBottom: 16, fontFamily: "'Inter', sans-serif" }}>
                Submitted to <strong style={{ color: C.primary }}>IEEE Journal of Biomedical and Health Informatics</strong>
              </p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "flex-start" }}>
                {["Explainable AI", "Healthcare AI", "Machine Learning", "Feature Attribution", "SHAP"].map((t) => (
                  <span
                    key={t}
                    style={{
                      padding: "4px 11px",
                      background: "rgba(255,255,255,0.05)",
                      border: `1px solid ${C.border}`,
                      borderRadius: 6,
                      fontSize: 11,
                      color: C.secondary,
                      fontFamily: "'Inter', sans-serif",
                    }}
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </Card>
      </div>
    </section>
  );
}

// ── Experience ────────────────────────────────────────────────────────────────
function Experience() {
  return (
    <section
      id="experience"
      style={{
        padding: "120px clamp(20px, 8vw, 120px)",
        borderTop: `1px solid ${C.border}`,
      }}
    >
      <div style={{ maxWidth: 1100, margin: "0 auto", textAlign: "left" }}>
        <SectionLabel>Experience & Achievements</SectionLabel>

        <div className="exp-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 48, alignItems: "start" }}>
          {/* Experience */}
          <div style={{ textAlign: "left" }}>
            <SectionHeading>
              Professional
              <br />
              <span style={{ color: C.accent }}>Experience</span>
            </SectionHeading>

            <div style={{ marginTop: 36 }}>
              <Card style={{ padding: "28px 32px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
                  <div style={{ textAlign: "left" }}>
                    <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 17, fontWeight: 700, color: C.primary, marginBottom: 4 }}>
                      AI Automation Intern
                    </div>
                    <div style={{ fontSize: 13, color: C.accent, fontFamily: "'Inter', sans-serif", fontWeight: 500 }}>
                      Internship · AI & Automation
                    </div>
                  </div>
                  <span
                    style={{
                      padding: "3px 10px",
                      background: C.success + "15",
                      border: `1px solid ${C.success}40`,
                      borderRadius: 999,
                      fontSize: 11,
                      color: C.success,
                      fontFamily: "'Inter', sans-serif",
                    }}
                  >
                    Completed
                  </span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {[
                    "Built n8n automation workflows for lead management",
                    "Developed production AI chatbots with LLM backends",
                    "Deployed services on Render with CI/CD pipelines",
                    "Automated multi-step business workflows end-to-end",
                  ].map((item) => (
                    <div key={item} style={{ display: "flex", gap: 10, alignItems: "flex-start", justifyContent: "flex-start" }}>
                      <div style={{ width: 5, height: 5, borderRadius: "50%", background: C.accent, flexShrink: 0, marginTop: 6 }} />
                      <span style={{ fontSize: 13, color: C.secondary, fontFamily: "'Inter', sans-serif", lineHeight: 1.6 }}>{item}</span>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </div>

          {/* Achievements */}
          <div style={{ textAlign: "left" }}>
            <SectionHeading>
              Key
              <br />
              <span style={{ color: C.accent }}>Achievements</span>
            </SectionHeading>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginTop: 36 }}>
              {[
                { stat: "0.907", label: "Context Precision (RAGAS)", color: C.accent },
                { stat: "99.3%", label: "Validation Accuracy", color: C.success },
                { stat: "IEEE", label: "Research Paper Submitted", color: "#F59E0B" },
                { stat: "🥇", label: "Highest Marks — Live Project", color: "#EC4899" },
              ].map((a) => (
                <Card key={a.label} style={{ textAlign: "left", padding: "24px 20px" }}>
                  <div
                    style={{
                      fontFamily: "'Space Grotesk', sans-serif",
                      fontSize: 30,
                      fontWeight: 800,
                      color: a.color,
                      marginBottom: 8,
                      letterSpacing: "-0.02em",
                    }}
                  >
                    {a.stat}
                  </div>
                  <div style={{ fontSize: 12, color: C.secondary, fontFamily: "'Inter', sans-serif", lineHeight: 1.4 }}>
                    {a.label}
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </div>

        {/* Certifications Section Wrapper */}
        <div style={{ marginTop: 80, textAlign: "left" }}>
          <h3
            style={{
              fontFamily: "'Space Grotesk', sans-serif",
              fontSize: 22,
              fontWeight: 700,
              color: C.primary,
              marginBottom: 28,
              letterSpacing: "-0.01em",
            }}
          >
            Certifications
          </h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 16 }}>
            {[
              { title: "IBM Data Analyst Professional Certificate", org: "IBM", icon: "🏆" },
              { title: "Classifying and Sourcing Data", org: "IBM", icon: "📊" },
              { title: "Fundamentals of Digital Marketing", org: "Google", icon: "🎯" },
              { title: "Generative AI Seminar", org: "2024", icon: "🤖" },
            ].map((cert) => (
              <Card key={cert.title} style={{ padding: "20px 22px", textAlign: "left" }}>
                <div style={{ fontSize: 22, marginBottom: 10 }}>{cert.icon}</div>
                <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 13, fontWeight: 600, color: C.primary, marginBottom: 4, lineHeight: 1.4 }}>
                  {cert.title}
                </div>
                <div style={{ fontSize: 12, color: C.accent, fontFamily: "'Inter', sans-serif", fontWeight: 500 }}>
                  {cert.org}
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// ── Contact ───────────────────────────────────────────────────────────────────
function Contact() {
  return (
    <section
      id="contact"
      style={{
        padding: "120px clamp(20px, 8vw, 120px)",
        borderTop: `1px solid ${C.border}`,
        background: `linear-gradient(180deg, transparent 0%, ${C.surface}50 100%)`,
      }}
    >
      <div style={{ maxWidth: 1100, margin: "0 auto", textAlign: "left" }}>
        <SectionLabel>Contact</SectionLabel>
        <SectionHeading>
          Let's build something
          <br />
          <span style={{ color: C.accent }}>remarkable</span>
        </SectionHeading>
        <p style={{ color: C.secondary, fontSize: 15, lineHeight: 1.8, marginTop: 20, marginBottom: 48, fontFamily: "'Inter', sans-serif", maxWidth: 680 }}>
          Open to AI/ML engineering roles, research collaborations, and freelance AI projects. If you're building something ambitious with AI, I'd love to hear about it.
        </p>

        <div style={{ display: "flex", gap: 14, justifyContent: "flex-start", flexWrap: "wrap" }}>
          {[
            { label: "Email", href: "mailto:KonainFatima28@gmail.com", primary: true },
            { label: "GitHub", href: "https://github.com/konainfatima28" },
            { label: "LinkedIn", href: "https://www.linkedin.com/in/konainfatima" },
          ].map((btn) => (
            <a
              key={btn.label}
              href={btn.href}
              target={btn.href.startsWith("http") ? "_blank" : undefined}
              rel={btn.href.startsWith("http") ? "noreferrer" : undefined}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "13px 28px",
                borderRadius: 10,
                fontSize: 14,
                fontWeight: 600,
                cursor: "pointer",
                textDecoration: "none",
                fontFamily: "'Inter', sans-serif",
                transition: "all 0.2s",
                background: btn.primary ? C.accent : "transparent",
                color: C.primary,
                border: btn.primary ? "none" : `1px solid ${C.border}`,
              }}
              onMouseEnter={(e) => {
                if (!btn.primary) {
                  e.currentTarget.style.borderColor = C.accent + "80";
                  e.currentTarget.style.background = C.accentDim;
                }
              }}
              onMouseLeave={(e) => {
                if (!btn.primary) {
                  e.currentTarget.style.borderColor = C.border;
                  e.currentTarget.style.background = "transparent";
                }
              }}
            >
              {btn.label} ↗
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Footer ────────────────────────────────────────────────────────────────────
function Footer() {
  return (
    <footer
      style={{
        borderTop: `1px solid ${C.border}`,
        padding: "28px clamp(20px, 8vw, 120px)",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        flexWrap: "wrap",
        gap: 12,
      }}
    >
      <div style={{ fontSize: 13, color: C.secondary, fontFamily: "'Inter', sans-serif" }}>
        Designed & Built by{" "}
        <span style={{ color: C.primary, fontWeight: 600 }}>Konain Fatima</span>
      </div>
      <div style={{ fontSize: 13, color: C.secondary, fontFamily: "'Inter', sans-serif" }}>
        © {new Date().getFullYear()}
      </div>
    </footer>
  );
}

// ── Global Styles + App ───────────────────────────────────────────────────────
export default function App() {
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700;800&family=Inter:wght@400;500;600;700&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html { scroll-behavior: smooth; }
        body { background: #0B0B0F; color: #fff; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: #0B0B0F; }
        ::-webkit-scrollbar-thumb { background: #23262D; border-radius: 3px; }
        ::-webkit-scrollbar-thumb:hover { background: #6C63FF; }

        @media (max-width: 768px) {
          .nav-desktop { display: none !important; }
          .nav-burger { display: block !important; }
        }

        @media (max-width: 900px) {
          #about .about-grid { grid-template-columns: 1fr !important; gap: 40px !important; }
          #experience .exp-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>

      <div style={{ background: C.bg, minHeight: "100vh", ...gs }}>
        <Nav />
        <main>
          <Hero />
          <About />
          <Skills />
          <Projects />
          <Research />
          <Experience />
          <Contact />
        </main>
        <Footer />
      </div>
    </>
  );
}