import { useState, useEffect, useRef, useCallback, useMemo } from "react";

// ── Palette (Cyber-Orchid Dark Variant) ──────────────────────────────────────
const C = {
  bg: "#0D0812",
  surface: "#150E1C",
  surface2: "#1C1226",
  border: "#2E1F3A",
  primary: "#FAF0F5",
  secondary: "#C4A8C8",
  accent: "#E8A0BF",
  accentAlt: "#C084D4",
  accentDim: "rgba(232,160,191,0.10)",
  accentGlow: "rgba(232,160,191,0.35)",
  gold: "#E8C99A",
  success: "#A8D8A8",
};

// ── Custom GPU-Accelerated Cursor Trail ────────────────────────────────────
function CursorTrail() {
  const mouseRef = useRef({ x: -200, y: -200 });
  const rafRef = useRef(null);
  const containerRef = useRef(null);
  const COUNT = 18;

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const dots = Array.from(container.children);

    const onMove = e => { 
      mouseRef.current = { x: e.clientX, y: e.clientY }; 
    };
    window.addEventListener("mousemove", onMove, { passive: true });

    let positions = Array(COUNT).fill(null).map(() => ({ x: -200, y: -200 }));

    function animate() {
      positions[0] = { ...mouseRef.current };
      for (let i = 1; i < COUNT; i++) {
        positions[i] = {
          x: positions[i].x + (positions[i-1].x - positions[i].x) * 0.28,
          y: positions[i].y + (positions[i-1].y - positions[i].y) * 0.28,
        };
      }
      
      dots.forEach((dot, i) => {
        const progress = 1 - i / COUNT;
        const baseSize = 6;
        
        // Uses hardware-accelerated transforms rather than triggering layout redraws via top/left
        dot.style.transform = `translate3d(${positions[i].x - baseSize / 2}px, ${positions[i].y - baseSize / 2}px, 0) scale(${progress})`;
        dot.style.opacity = progress * 0.7;
      });
      rafRef.current = requestAnimationFrame(animate);
    }
    animate();
    
    return () => { 
      window.removeEventListener("mousemove", onMove); 
      cancelAnimationFrame(rafRef.current); 
    };
  }, []);

  return (
    <div ref={containerRef} style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 9999 }}>
      {Array(COUNT).fill(null).map((_, i) => (
        <div key={i} style={{
          position: "absolute", 
          top: 0, 
          left: 0, 
          width: "6px", 
          height: "6px", 
          borderRadius: "50%",
          background: `radial-gradient(circle, ${C.accent}, ${C.accentAlt})`,
          pointerEvents: "none",
          willChange: "transform, opacity"
        }}/>
      ))}
    </div>
  );
}

// ── Ripple click effect ───────────────────────────────────────────────────
function useRipple() {
  const [ripples, setRipples] = useState([]);
  useEffect(() => {
    const handler = e => {
      const id = Date.now() + Math.random();
      setRipples(r => [...r, { id, x: e.clientX, y: e.clientY }]);
      setTimeout(() => setRipples(r => r.filter(rp => rp.id !== id)), 800);
    };
    window.addEventListener("click", handler);
    return () => window.removeEventListener("click", handler);
  }, []);
  return ripples;
}

function RippleLayer() {
  const ripples = useRipple();
  return (
    <div style={{ position:"fixed", inset:0, pointerEvents:"none", zIndex:9998 }}>
      {ripples.map(r => (
        <div key={r.id} style={{
          position:"fixed", left: r.x, top: r.y,
          width:0, height:0,
          borderRadius:"50%",
          border:`1.5px solid ${C.accent}`,
          transform:"translate(-50%,-50%)",
          animation:"rippleOut 0.8s ease-out forwards",
        }}/>
      ))}
    </div>
  );
}

// ── Magnetic button wrapper ───────────────────────────────────────────────
function Magnetic({ children, strength = 0.35 }) {
  const ref = useRef(null);
  const handleMove = useCallback(e => {
    const el = ref.current; if (!el) return;
    const { left, top, width, height } = el.getBoundingClientRect();
    const cx = left + width/2, cy = top + height/2;
    const dx = (e.clientX - cx) * strength;
    const dy = (e.clientY - cy) * strength;
    el.style.transform = `translate(${dx}px, ${dy}px)`;
  }, [strength]);
  const handleLeave = useCallback(() => {
    const el = ref.current; if (!el) return;
    el.style.transform = "translate(0,0)";
    el.style.transition = "transform 0.5s cubic-bezier(.23,1,.32,1)";
    setTimeout(() => { if (el) el.style.transition = ""; }, 500);
  }, []);
  return (
    <div ref={ref} onMouseMove={handleMove} onMouseLeave={handleLeave} style={{ display:"inline-block" }}>
      {children}
    </div>
  );
}

// ── Morphing blob ─────────────────────────────────────────────────────────
function MorphBlob({ color, size=300, style={} }) {
  return (
    <div style={{
      width:size, height:size, position:"absolute", pointerEvents:"none",
      background:`radial-gradient(circle at 40% 40%, ${color}22, ${color}08 60%, transparent)`,
      filter:"blur(60px)",
      animation:"morphBlob 8s ease-in-out infinite",
      ...style,
    }}/>
  );
}

// ── useInView ─────────────────────────────────────────────────────────────
function useInView(threshold=0.12) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { setVisible(true); obs.disconnect(); }
    }, { threshold });
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return [ref, visible];
}

// ── Reveal ────────────────────────────────────────────────────────────────
function Reveal({ children, delay=0, direction="up", style={} }) {
  const [ref, visible] = useInView();
  const tx = direction==="up"?"translateY(40px)":direction==="left"?"translateX(-40px)":direction==="right"?"translateX(40px)":"scale(0.92)";
  return (
    <div ref={ref} style={{
      opacity:visible?1:0,
      transform:visible?"none":tx,
      transition:`opacity 0.75s cubic-bezier(.4,0,.2,1) ${delay}ms, transform 0.75s cubic-bezier(.4,0,.2,1) ${delay}ms`,
      ...style,
    }}>{children}</div>
  );
}

// ── Typewriter ────────────────────────────────────────────────────────────
function Typewriter({ words, speed=75, pause=1600 }) {
  const [display, setDisplay] = useState("");
  const [wIdx, setWIdx] = useState(0);
  const [cIdx, setCIdx] = useState(0);
  const [deleting, setDeleting] = useState(false);
  useEffect(() => {
    const word = words[wIdx];
    const delay = deleting ? speed/2 : cIdx===word.length ? pause : speed;
    const t = setTimeout(() => {
      if (!deleting && cIdx<word.length) { setDisplay(word.slice(0,cIdx+1)); setCIdx(c=>c+1); }
      else if (!deleting) { setDeleting(true); }
      else if (cIdx>0) { setDisplay(word.slice(0,cIdx-1)); setCIdx(c=>c-1); }
      else { setDeleting(false); setWIdx(i=>(i+1)%words.length); }
    }, delay);
    return () => clearTimeout(t);
  }, [cIdx, deleting, wIdx, words, speed, pause]);
  return (
    <span>
      {display}
      <span style={{
        display:"inline-block",width:2,height:"0.85em",
        background:`linear-gradient(${C.accent},${C.accentAlt})`,
        marginLeft:3,verticalAlign:"middle",
        animation:"blink 1s step-end infinite",
      }}/>
    </span>
  );
}

// ── CountUp ───────────────────────────────────────────────────────────────
function CountUp({ target, suffix="", duration=1600 }) {
  const [val, setVal] = useState(0);
  const [ref, visible] = useInView();
  useEffect(() => {
    if (!visible) return;
    const isFloat = String(target).includes(".");
    let i=0; const steps=60;
    const id = setInterval(() => {
      i++;
      const ease = 1-Math.pow(1-i/steps,3);
      setVal(isFloat ? parseFloat((ease*target).toFixed(3)) : Math.round(ease*target));
      if (i>=steps) clearInterval(id);
    }, duration/steps);
    return () => clearInterval(id);
  }, [visible, target, duration]);
  return <span ref={ref}>{val}{suffix}</span>;
}

// ── Performance-Optimized Petal Canvas ────────────────────────────────────
function PetalCanvas() {
  const canvasRef = useRef(null);
  const rafRef = useRef(null);
  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let W, H, petals;
    const COLS=[C.accent,C.accentAlt,"#D4A0C8","#F0C0D8","#B090C8","#FFB8D4"];
    function drawPetal(ctx,size,color,alpha) {
      ctx.save(); ctx.globalAlpha=alpha;
      ctx.beginPath();
      ctx.moveTo(0,-size);
      ctx.bezierCurveTo(size*.65,-size*.4,size*.65,size*.4,0,size*.5);
      ctx.bezierCurveTo(-size*.65,size*.4,-size*.65,-size*.4,0,-size);
      ctx.fillStyle=color; ctx.fill();
      ctx.restore();
    }
    function init() {
      W=canvas.width=canvas.offsetWidth; H=canvas.height=canvas.offsetHeight;
      // Trimmed downstream overhead down to 26 fluid nodes for smooth rendering profiles
      petals=Array.from({length:26},()=>({
        x:Math.random()*W, y:Math.random()*H,
        vy:Math.random()*.55+.18, vx:(Math.random()-.5)*.32,
        rot:Math.random()*Math.PI*2, vrot:(Math.random()-.5)*.018,
        size:Math.random()*13+4, alpha:Math.random()*.2+.05,
        color:COLS[Math.floor(Math.random()*COLS.length)],
        sway:Math.random()*Math.PI*2, swayS:Math.random()*.009+.003,
      }));
    }
    function draw() {
      ctx.clearRect(0,0,W,H);
      petals.forEach(p=>{
        p.sway+=p.swayS; p.x+=p.vx+Math.sin(p.sway)*.45;
        p.y+=p.vy; p.rot+=p.vrot;
        if(p.y>H+20){p.y=-20;p.x=Math.random()*W;}
        if(p.x<-20)p.x=W+20; if(p.x>W+20)p.x=-20;
        ctx.save(); ctx.translate(p.x,p.y); ctx.rotate(p.rot);
        drawPetal(ctx,p.size,p.color,p.alpha); ctx.restore();
      });
      rafRef.current=requestAnimationFrame(draw);
    }
    init(); draw();
    const ro=new ResizeObserver(init); ro.observe(canvas);
    return ()=>{cancelAnimationFrame(rafRef.current);ro.disconnect();};
  },[]);
  return <canvas ref={canvasRef} style={{position:"absolute",inset:0,width:"100%",height:"100%",opacity:.95,pointerEvents:"none"}}/>;
}

// ── Animated grid lines (background) ─────────────────────────────────────
function GridLines() {
  return (
    <div style={{
      position:"absolute",inset:0,pointerEvents:"none",overflow:"hidden",
      backgroundImage:`linear-gradient(${C.accent}08 1px, transparent 1px), linear-gradient(90deg, ${C.accent}08 1px, transparent 1px)`,
      backgroundSize:"60px 60px",
      animation:"gridPulse 6s ease-in-out infinite",
      maskImage:"radial-gradient(ellipse 80% 60% at 50% 50%, black 30%, transparent 100%)",
    }}/>
  );
}

// ── Glitter particles ─────────────────────────────────────────────────────
function Glitter() {
  const particles = useMemo(() => Array.from({length:30},(_,i)=>({
    id:i, x:Math.random()*100, y:Math.random()*100,
    size:Math.random()*3+1,
    dur:Math.random()*4+2,
    delay:Math.random()*4,
    color:[C.accent,C.accentAlt,"#FFD6E8","#E8C99A"][Math.floor(Math.random()*4)],
  })),[]);
  return (
    <div style={{position:"absolute",inset:0,pointerEvents:"none",overflow:"hidden"}}>
      {particles.map(p=>(
        <div key={p.id} style={{
          position:"absolute", left:`${p.x}%`, top:`${p.y}%`,
          width:p.size, height:p.size, borderRadius:"50%",
          background:p.color,
          animation:`glitter ${p.dur}s ease-in-out ${p.delay}s infinite`,
          boxShadow:`0 0 ${p.size*2}px ${p.color}`,
        }}/>
      ))}
    </div>
  );
}

// ── Shared UI Styles ──────────────────────────────────────────────────────
const gs = {
  fontFamily: "'Inter', system-ui, sans-serif",
  color: C.primary,
  bg: C.bg,
};

function Tag({children,color}) {
  const col=color||C.accent;
  return <span style={{
    display:"inline-block",padding:"3px 11px",borderRadius:999,
    background:col+"1A",border:`1px solid ${col}45`,
    color:col,fontSize:11,fontWeight:600,
    letterSpacing:"0.07em",textTransform:"uppercase",
    fontFamily:"'Inter',sans-serif",lineHeight:1.7,
    transition:"all 0.2s",cursor:"default",
  }}>{children}</span>;
}

function SectionLabel({children}) {
  return (
    <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:44,justifyContent:"flex-start"}}>
      <span style={{width:22,height:1,background:`linear-gradient(90deg,${C.accent},${C.accentAlt})`,display:"inline-block"}}/>
      <span style={{
        background:`linear-gradient(90deg,${C.accent},${C.accentAlt})`,
        WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",
        fontSize:11,fontWeight:700,letterSpacing:"0.14em",
        textTransform:"uppercase",fontFamily:"'Inter',sans-serif",
      }}>{children}</span>
    </div>
  );
}

// Re-anchored to responsive grid layout structures
function SectionHeading({children}) {
  return <h2 style={{
    fontFamily:"'Space Grotesk',sans-serif",
    fontSize:"clamp(30px,4.5vw,52px)",fontWeight:700,color:C.primary,
    margin:"0 0 14px 0",lineHeight:1.1,letterSpacing:"-0.01em",
    textAlign:"left",
  }}>{children}</h2>;
}

function Card({children,style={},glowColor,onClick}) {
  const [hov,setHov]=useState(false);
  const gc=glowColor||C.accent;
  return (
    <div
      onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}
      onClick={onClick}
      style={{
        background:C.surface,
        border:`1px solid ${hov?gc+"60":C.border}`,
        borderRadius:18,padding:26,
        transition:"all 0.32s cubic-bezier(.4,0,.2,1)",
        boxShadow:hov?`0 0 0 1px ${gc}20,0 12px 48px rgba(0,0,0,0.6),inset 0 1px 0 rgba(255,255,255,0.05)`:"none",
        transform:hov?"translateY(-5px) scale(1.015)":"none",
        cursor:onClick?"pointer":"default",
        textAlign:"left",
        ...style,
      }}
    >{children}</div>
  );
}

function GradText({children,style={}}) {
  return <span style={{
    background:`linear-gradient(135deg,${C.accent},${C.accentAlt})`,
    WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",
    backgroundSize:"200% 200%",animation:"gradientShift 4s ease infinite",
    ...style,
  }}>{children}</span>;
}

function Btn({children,primary,onClick,href,target}) {
  const [hov,setHov]=useState(false);
  const [press,setPress]=useState(false);
  const base={
    display:"inline-flex",alignItems:"center",gap:6,
    padding:"12px 28px",borderRadius:40,
    fontSize:13,fontWeight:600,cursor:"pointer",
    textDecoration:"none",fontFamily:"'Inter',sans-serif",
    transition:"all 0.25s cubic-bezier(.4,0,.2,1)",
    border:"1px solid transparent",position:"relative",overflow:"hidden",
    transform:press?"scale(0.94)":hov?"translateY(-3px) scale(1.02)":"none",
  };
  const s=primary?{
    ...base,
    background:hov?"linear-gradient(135deg,#F0B0CC,#C890E0)":`linear-gradient(135deg,${C.accent},${C.accentAlt})`,
    color:"#1A0820",
    boxShadow:hov?`0 0 32px ${C.accentGlow},0 6px 24px rgba(232,160,191,0.35)`:"none",
  }:{
    ...base,
    background:hov?"rgba(232,160,191,0.08)":"transparent",
    color:C.primary,
    border:`1px solid ${hov?C.accent+"70":C.border}`,
    boxShadow:hov?`0 0 16px ${C.accent}20`:"none",
  };
  const props={
    style:s,
    onMouseEnter:()=>setHov(true),
    onMouseLeave:()=>{setHov(false);setPress(false);},
    onMouseDown:()=>setPress(true),
    onMouseUp:()=>setPress(false),
  };
  return href
    ? <a href={href} target={target} {...props}>{children}</a>
    : <button onClick={onClick} {...props}>{children}</button>;
}

// ── Navigation ────────────────────────────────────────────────────────────────
const NAV_ITEMS=["Home","About","Skills","Projects","Research","Experience","Contact"];
function Nav() {
  const [scrolled,setScrolled]=useState(false);
  const [open,setOpen]=useState(false);
  const [active,setActive]=useState("home");
  const [scrollPct,setScrollPct]=useState(0);

  useEffect(()=>{
    const h=()=>{
      setScrolled(window.scrollY>20);
      const total=document.body.scrollHeight-window.innerHeight;
      setScrollPct(total>0?window.scrollY/total:0);
      const sections=NAV_ITEMS.map(n=>document.getElementById(n.toLowerCase()));
      const cur=sections.reduce((acc,s)=>(s&&window.scrollY>=s.offsetTop-140?s.id:acc),"home");
      setActive(cur);
    };
    window.addEventListener("scroll",h);
    return ()=>window.removeEventListener("scroll",h);
  },[]);

  const go=id=>{document.getElementById(id.toLowerCase())?.scrollIntoView({behavior:"smooth"});setOpen(false);};

  return (
    <>
      <div style={{
        position:"fixed",top:0,left:0,zIndex:200,height:2,
        width:`${scrollPct*100}%`,
        background:`linear-gradient(90deg,${C.accent},${C.accentAlt})`,
        transition:"width 0.1s",
        boxShadow:`0 0 12px ${C.accent}`,
      }}/>

      <nav style={{
        position:"fixed",top:0,left:0,right:0,zIndex:101,
        height:64,display:"flex",alignItems:"center",justifyContent:"space-between",
        padding:"0 clamp(18px,5vw,80px)",
        background:scrolled?"rgba(13,8,18,0.88)":"transparent",
        backdropFilter:scrolled?"blur(24px)":"none",
        borderBottom:`1px solid ${scrolled?C.border:"transparent"}`,
        transition:"all 0.4s cubic-bezier(.4,0,.2,1)",
      }}>
        {/* Typographic Left Logo */}
        <div onClick={()=>go("home")} style={{
          fontFamily:"'Space Grotesk', sans-serif",fontWeight:800,fontSize:20,
          letterSpacing:"-0.03em",cursor:"pointer",display:"flex",alignItems:"center",userSelect:"none"
        }}>
          <span style={{ color: "#FFFFFF" }}>K</span>
          <span style={{ color: "#C4A8C8" }}>F</span>
          <span style={{ color: "#E8A0BF", marginLeft: "2px", textShadow: "0 0 12px rgba(232,160,191,0.6)" }}>•</span>
        </div>

        <div style={{display:"flex",gap:2}} className="nav-desktop">
          {NAV_ITEMS.map(n=>{
            const isA=active===n.toLowerCase();
            return (
              <button key={n} onClick={()=>go(n)} style={{
                background:isA?"rgba(232,160,191,0.10)":"none",
                border:"none",color:isA?C.accent:C.secondary,
                fontSize:13,fontWeight:isA?600:500,
                padding:"6px 13px",cursor:"pointer",borderRadius:8,
                fontFamily:"'Inter',sans-serif",transition:"all 0.2s",position:"relative",
              }}
              onMouseEnter={e=>{e.target.style.color=C.accent;e.target.style.background="rgba(232,160,191,0.08)";}}
              onMouseLeave={e=>{e.target.style.color=isA?C.accent:C.secondary;e.target.style.background=isA?"rgba(232,160,191,0.10)":"transparent";}}>
                {n}
                {isA&&<span style={{
                  position:"absolute",bottom:-1,left:"50%",transform:"translateX(-50%)",
                  width:16,height:2,borderRadius:1,
                  background:`linear-gradient(90deg,${C.accent},${C.accentAlt})`,
                  boxShadow:`0 0 8px ${C.accent}`,
                }}/>}
              </button>
            );
          })}
        </div>

        <button onClick={()=>setOpen(!open)} className="nav-burger" style={{
          display:"none",background:"none",border:`1px solid ${C.border}`,borderRadius:8,
          padding:"6px 10px",cursor:"pointer",color:C.primary,fontSize:18,
          transition:"transform 0.35s, border-color 0.2s",
          transform:open?"rotate(180deg)":"none",
          borderColor:open?C.accent:C.border,
        }}>{open?"✕":"☰"}</button>

        {open&&(
          <div style={{
            position:"fixed",top:64,left:0,right:0,
            background:"rgba(13,8,18,0.97)",backdropFilter:"blur(24px)",
            borderBottom:`1px solid ${C.border}`,padding:"12px 24px",
            display:"flex",flexDirection:"column",gap:4,
          }}>
            {NAV_ITEMS.map((n,i)=>(
              <button key={n} onClick={()=>go(n)} style={{
                background:"none",border:"none",color:active===n.toLowerCase()?C.accent:C.secondary,
                fontSize:15,fontWeight:500,padding:"12px 0",cursor:"pointer",
                textAlign:"left",borderBottom:`1px solid ${C.border}`,
                fontFamily:"'Inter',sans-serif",transition:"color 0.2s, transform 0.2s",
                animation:`slideDown 0.3s ease ${i*50}ms both`,
              }}
              onMouseEnter={e=>{e.target.style.color=C.accent;e.target.style.transform="translateX(6px)";}}
              onMouseLeave={e=>{e.target.style.color=C.secondary;e.target.style.transform="none";}}
              >{n}</button>
            ))}
          </div>
        )}
      </nav>
    </>
  );
}

// ── Hero ──────────────────────────────────────────────────────────────────────
function Hero() {
  const [mounted,setMounted]=useState(false);
  useEffect(()=>{const t=setTimeout(()=>setMounted(true),80);return()=>clearTimeout(t);},[]);

  const chips=["Agentic AI","RAG Systems","LangGraph","GPT-4o","Computer Vision","LangChain","Streamlit"];

  const fadeIn=(delay)=>({
    opacity:mounted?1:0,
    transform:mounted?"none":"translateY(30px)",
    transition:`opacity 0.85s ease ${delay}ms, transform 0.85s cubic-bezier(.4,0,.2,1) ${delay}ms`,
  });

  return (
    <section id="home" style={{
      position:"relative",minHeight:"100vh",display:"flex",alignItems:"center",
      overflow:"hidden",padding:"120px clamp(20px,8vw,120px) 80px",
    }}>
      <PetalCanvas/>
      <GridLines/>
      <Glitter/>

      <MorphBlob color={C.accentAlt} size={500} style={{top:"5%",left:"-10%",animationDelay:"0s"}}/>
      <MorphBlob color={C.accent} size={350} style={{top:"55%",right:"-5%",animationDelay:"3s"}}/>
      <MorphBlob color="#C084D4" size={250} style={{bottom:"10%",left:"30%",animationDelay:"1.5s"}}/>

      {/* PC Ultra-Wide structural layout alignment alignment restraint */}
      <div style={{position:"relative",zIndex:1,maxWidth:1200,margin:"0 auto",width:"100%",textAlign:"left"}}>
        <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:32,...fadeIn(100)}}>
          {chips.map((c,i)=>(
            <div key={c} style={{
              opacity:mounted?1:0,
              transform:mounted?"none":`translateY(20px) scale(0.85)`,
              transition:`opacity 0.6s ease ${200+i*90}ms, transform 0.6s cubic-bezier(.34,1.56,.64,1) ${200+i*90}ms`,
            }}>
              <Tag>{c}</Tag>
            </div>
          ))}
        </div>

        <div style={fadeIn(350)}>
          <h1 style={{
            fontFamily:"'Space Grotesk',sans-serif",
            fontSize:"clamp(44px,7.5vw,88px)",
            fontWeight:700,color:C.primary,
            margin:"0 0 4px 0",lineHeight:.92,letterSpacing:"-0.025em",
          }}>
            {"Konain".split("").map((ch,i)=>(
              <span key={i} style={{
                display:"inline-block",
                animation:`letterBounce 0.5s cubic-bezier(.34,1.56,.64,1) ${500+i*60}ms both`,
              }}>{ch}</span>
            ))}
            <br/>
            <span style={{
              background:`linear-gradient(135deg,${C.accent} 0%,${C.accentAlt} 60%,#FFB8D4 100%)`,
              WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",
              backgroundSize:"200% 200%",animation:"gradientShift 4s ease infinite",
            }}>
              {"Fatima".split("").map((ch,i)=>(
                <span key={i} style={{
                  display:"inline-block",
                  animation:`letterBounce 0.5s cubic-bezier(.34,1.56,.64,1) ${800+i*60}ms both`,
                }}>{ch}</span>
              ))}
            </span>
          </h1>
        </div>

        <div style={{
          fontFamily:"'Space Grotesk',sans-serif",
          fontSize:"clamp(14px,1.8vw,19px)",
          fontWeight:500,color:C.secondary,
          marginTop:22,marginBottom:22,
          letterSpacing:"0.06em",textTransform:"uppercase",minHeight:"1.7em",
          ...fadeIn(600),
        }}>
          <Typewriter words={["AI Engineer","Agentic AI Builder","RAG Systems Developer","ML Engineer","Computer Vision Engineer","AI Researcher"]}/>
        </div>

        <p style={{
          fontSize:"clamp(14px,1.5vw,16px)",color:C.secondary,lineHeight:1.9,
          maxWidth:520,marginBottom:46,fontFamily:"'Inter',sans-serif",
          ...fadeIn(750),
        }}>
          Building intelligent AI systems powered by Agentic AI, Retrieval-Augmented Generation, Machine Learning, Computer Vision, and AI Automation.
        </p>

        <div style={{display:"flex",gap:12,flexWrap:"wrap",...fadeIn(900)}}>
          <Magnetic>
            <Btn primary onClick={()=>document.getElementById("projects")?.scrollIntoView({behavior:"smooth"})}>View Projects →</Btn>
          </Magnetic>
          <Magnetic>
            <Btn href="https://github.com/konainfatima28" target="_blank">GitHub</Btn>
          </Magnetic>
          <Magnetic>
            <Btn href="https://drive.google.com/file/d/1O6hYlJwtFNAbhKzGjPaagQy5EGRIzBiT/view?usp=drivesdk" target="_blank">Download Resume</Btn>
          </Magnetic>
        </div>

        <div style={{marginTop:64,display:"flex",alignItems:"center",gap:12,...fadeIn(1100)}}>
          <div style={{
            width:20,height:34,borderRadius:10,
            border:`1px solid ${C.border}`,
            display:"flex",justifyContent:"center",paddingTop:5,
          }}>
            <div style={{
              width:3,height:8,borderRadius:2,
              background:`linear-gradient(${C.accent},${C.accentAlt})`,
              animation:"scrollDot 2s ease-in-out infinite",
              boxShadow:`0 0 8px ${C.accent}`,
            }}/>
          </div>
          <span style={{fontSize:11,color:C.secondary,fontFamily:"'Inter',sans-serif",letterSpacing:"0.1em",textTransform:"uppercase",animation:"fadeUpDown 2s ease-in-out infinite"}}>
            Scroll to explore
          </span>
        </div>
      </div>
    </section>
  );
}

// ── About ─────────────────────────────────────────────────────────────────
function About() {
  const expertise=[
    {icon:"🧠",label:"Agentic AI",desc:"Multi-agent systems with autonomous decision loops"},
    {icon:"📚",label:"RAG Systems",desc:"Hybrid retrieval with semantic + keyword search"},
    {icon:"✨",label:"Generative AI",desc:"GPT-4o, LangChain, prompt engineering at scale"},
    {icon:"🔬",label:"Machine Learning",desc:"Scikit-learn, TensorFlow, deep learning pipelines"},
    {icon:"👁",label:"Computer Vision",desc:"OpenCV, MediaPipe, FaceNet, pose estimation"},
    {icon:"🤖",label:"AI Automation",desc:"n8n workflows, chatbots, intelligent pipelines"},
    {icon:"🔍",label:"Explainable AI",desc:"SHAP, feature attribution, model interpretability"},
  ];
  return (
    <section id="about" style={{padding:"120px clamp(20px,8vw,120px)",borderTop:`1px solid ${C.border}`,overflow:"hidden",position:"relative"}}>
      <MorphBlob color={C.accent} size={400} style={{top:"-10%",right:"-5%",animationDelay:"2s"}}/>
      <div style={{maxWidth:1200,margin:"0 auto",position:"relative",zIndex:1,width:"100%"}}>
        <Reveal><SectionLabel>About</SectionLabel></Reveal>
        <div className="about-grid" style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:72,alignItems:"start"}}>
          <div style={{textAlign:"left"}}>
            <Reveal delay={100}>
              <SectionHeading>Engineering AI that<br/><GradText>solves real problems</GradText></SectionHeading>
            </Reveal>
            <Reveal delay={200}>
              <p style={{color:C.secondary,lineHeight:1.88,fontSize:15,marginTop:22,fontFamily:"'Inter',sans-serif"}}>
                I'm a final-year B.Tech CSE (AI/ML) student building production-grade AI systems that go beyond demos. My work spans agentic pipelines, document intelligence, healthcare AI, and computer vision — systems designed to be deployed, evaluated, and trusted.
              </p>
            </Reveal>
            <Reveal delay={300}>
              <p style={{color:C.secondary,lineHeight:1.88,fontSize:15,marginTop:16,fontFamily:"'Inter',sans-serif"}}>
                I care about the full stack of AI: not just model accuracy, but retrieval quality, explainability, latency, and the engineering decisions that make systems maintainable in production.
              </p>
            </Reveal>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
            {expertise.map((e,i)=>(
              <Reveal key={e.label} delay={i*70} direction={i%2===0?"left":"right"}>
                <Card style={{padding:"18px 20px"}}>
                  <div style={{
                    fontSize:22,marginBottom:8,display:"inline-block",
                    animation:`float 3s ease-in-out ${i*400}ms infinite`,
                  }}>{e.icon}</div>
                  <div style={{fontFamily:"'Space Grotesk',sans-serif",fontWeight:700,fontSize:13,color:C.primary,marginBottom:4}}>{e.label}</div>
                  <div style={{fontSize:12,color:C.secondary,lineHeight:1.6,fontFamily:"'Inter',sans-serif"}}>{e.desc}</div>
                </Card>
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// ── Skills ────────────────────────────────────────────────────────────────
const SKILLS=[
  {category:"Programming",           items:["Python","SQL","Git"]},
  {category:"AI & Machine Learning", items:["TensorFlow","Keras","Scikit-learn","NLP","Computer Vision","Deep Learning","Generative AI","Agentic AI","RAG"]},
  {category:"Frameworks",            items:["LangChain","LangGraph","Streamlit","OpenCV","MediaPipe"]},
  {category:"Databases",             items:["SQLite","ChromaDB","Firebase"]},
  {category:"Developer Tools",       items:["GitHub","VS Code","Google Colab","Render","n8n"]},
];

function SkillPill({label,delay}) {
  const [hov,setHov]=useState(false);
  const [ref,visible]=useInView(0.05);
  return (
    <span ref={ref}
      onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}
      style={{
        padding:"5px 13px",
        background:hov?C.accentDim:"rgba(255,255,255,0.04)",
        border:`1px solid ${hov?C.accent+"60":C.border}`,
        borderRadius:40,fontSize:12,
        color:hov?C.accent:C.primary,fontFamily:"'Inter',sans-serif",
        cursor:"default",
        opacity:visible?1:0,
        transform:visible?"none":"scale(0.8) translateY(10px)",
        transition:`all ${visible?"0.45s":"0s"} cubic-bezier(.34,1.56,.64,1) ${delay}ms`,
        boxShadow:hov?`0 0 12px ${C.accent}30`:"none",
      }}
    >{label}</span>
  );
}

function Skills() {
  return (
    <section id="skills" style={{
      padding:"120px clamp(20px,8vw,120px)",borderTop:`1px solid ${C.border}`,
      background:`linear-gradient(180deg,${C.surface2}70 0%,transparent 100%)`,
      position:"relative",overflow:"hidden",
    }}>
      <Glitter/>
      <MorphBlob color={C.accentAlt} size={450} style={{bottom:"-10%",right:"-10%",animationDelay:"1s"}}/>
      <div style={{maxWidth:1200,margin:"0 auto",position:"relative",zIndex:1,width:"100%"}}>
        <Reveal><SectionLabel>Skills</SectionLabel></Reveal>
        <Reveal delay={100}><SectionHeading>Technical Expertise</SectionHeading></Reveal>
        <Reveal delay={200}>
          <p style={{color:C.secondary,fontSize:15,marginBottom:50,fontFamily:"'Inter',sans-serif"}}>
            A production-focused stack built around modern AI engineering.
          </p>
        </Reveal>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(300px,1fr))",gap:18}}>
          {SKILLS.map((s,si)=>(
            <Reveal key={s.category} delay={si*90}>
              <Card glowColor={C.accentAlt}>
                <h3 style={{
                  fontFamily:"'Space Grotesk',sans-serif",fontSize:13,fontWeight:700,
                  background:`linear-gradient(90deg,${C.accent},${C.accentAlt})`,
                  WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",
                  marginBottom:16,letterSpacing:"0.1em",textTransform:"uppercase",
                }}>{s.category}</h3>
                <div style={{display:"flex",flexWrap:"wrap",gap:7}}>
                  {s.items.map((item,ii)=><SkillPill key={item} label={item} delay={si*50+ii*35}/>)}
                </div>
              </Card>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Projects ──────────────────────────────────────────────────────────────
const PROJECTS=[
  {
    featured:true,title:"DocuVision AI",subtitle:"Agentic RAG System",
    desc: "Production-grade multi-agent PDF intelligence platform capable of understanding complex documents with tables, charts, figures, and multi-page layouts. Features hybrid retrieval (BM25 + ChromaDB), HyDE, CrossEncoder reranking, agent tracing, confidence scoring, and RAGAS-based evaluation.",
    stack:["LangGraph","GPT-4o","ChromaDB","BM25","LangChain","RAGAS","Streamlit"],
    achievements:["Context Precision: 0.11 → 0.907","Multi-agent LangGraph architecture","4-tab Streamlit interface with trace viewer"],
    github:"https://github.com/konainfatima28/agentic-pdf-rag-3.0",color:C.accent,
  },
  {
    title:"Smart Attendance System",subtitle:"AI Classroom Monitor",
    desc:"AI-powered classroom monitoring platform using real-time face recognition, emotion detection, and pose estimation. Features automated attendance marking, live analytics dashboard, and behavioral insights for educators.",
    stack:["TensorFlow","OpenCV","FaceNet","MediaPipe","Python"],
    achievements:["99.3% validation accuracy","Real-time multi-face recognition","Emotion + pose analytics dashboard"],
    github:"https://github.com/konainfatima28/Learning-Management-System",color:C.accentAlt,
  },
  {
    title:"AI Resume Reviewer",subtitle:"ATS Analyzer",
    desc:"AI-powered resume evaluation platform with ATS compatibility scoring, semantic keyword analysis, role-specific gap detection, and actionable improvement recommendations tailored to job descriptions.",
    stack:["Python","NLP","Streamlit","Sentence-Transformers","ChromaDB"],
    achievements:["Semantic ATS scoring","Keyword gap analysis","Personalized improvement engine"],
    github:"https://github.com/konainfatima28/Live-Projects",color:C.gold,
  },
];

function ProjectCard({p,index}) {
  const [hov,setHov]=useState(false);
  return (
    <Reveal delay={index*110}>
      <div
        onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}
        style={{
          background:C.surface,
          border:`1px solid ${hov?p.color+"60":C.border}`,
          borderRadius:22,padding:"36px 40px",
          display:"flex",
          flexDirection:"column",
          gap:20,
          transition:"all 0.38s cubic-bezier(.4,0,.2,1)",
          boxShadow:hov?`0 0 0 1px ${p.color}18,0 24px 64px rgba(0,0,0,0.65),inset 0 1px 0 rgba(255,255,255,0.05)`:"inset 0 1px 0 rgba(255,255,255,0.03)",
          transform:hov?"translateY(-8px)":"none",
          position:"relative",overflow:"hidden",
          width:"100%",
          textAlign:"left",
        }}
      >
        <div style={{
          position:"absolute",top:-100,right:-80,width:340,height:340,borderRadius:"50%",
          background:`radial-gradient(circle,${p.color}18 0%,transparent 70%)`,
          pointerEvents:"none",
          opacity:hov?1:0.4,
          transition:"opacity 0.4s, transform 0.6s",
          transform:hov?"scale(1.3)":"scale(1)",
          animation:"morphBlob 8s ease-in-out infinite",
        }}/>

        {hov&&<div style={{
          position:"absolute",inset:0,borderRadius:22,pointerEvents:"none",
          background:`linear-gradient(105deg,transparent 40%,${p.color}12 50%,transparent 60%)`,
          animation:"shimmerSlide 1.2s ease-in-out infinite",
        }}/>}

        <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:14,position:"relative",justifyContent:"flex-start"}}>
          {p.featured&&<Tag>✦ Featured</Tag>}
          <span style={{color:C.secondary,fontSize:12,fontFamily:"'Inter',sans-serif"}}>{p.subtitle}</span>
        </div>

        <h3 style={{
          fontFamily:"'Space Grotesk',sans-serif",
          fontSize:"clamp(22px,2.8vw,30px)",fontWeight:700,color:C.primary,
          margin:"0 0 14px 0",letterSpacing:"-0.01em",position:"relative",
        }}>{p.title}</h3>

        <p style={{color:C.secondary,fontSize:14,lineHeight:1.82,marginBottom:20,fontFamily:"'Inter',sans-serif",maxWidth:"100%",position:"relative"}}>
          {p.desc}
        </p>

        <div style={{display:"flex",flexWrap:"wrap",gap:7,marginBottom:22,position:"relative",justifyContent:"flex-start"}}>
          {p.stack.map((s,si)=>(
            <span key={s} style={{
              padding:"4px 12px",background:"rgba(255,255,255,0.04)",
              border:`1px solid ${C.border}`,borderRadius:40,fontSize:11,
              color:C.secondary,fontFamily:"'Inter',sans-serif",transition:"all 0.2s",
              transitionDelay:`${si*30}ms`,
              ...(hov?{borderColor:p.color+"40",color:p.color}:{}),
            }}>{s}</span>
          ))}
        </div>

        <div style={{display:"flex",flexDirection:"column",gap:8,marginBottom:28,position:"relative"}}>
          {p.achievements.map((a,i)=>(
            <div key={a} style={{
              display:"flex",alignItems:"center",gap:10,justifyContent:"flex-start",
              transform:hov?`translateX(${(i+1)*4}px)`:"none",
              transition:`transform 0.3s ease ${i*60}ms`,
            }}>
              <div style={{
                width:5,height:5,borderRadius:"50%",background:p.color,flexShrink:0,
                animation:`pulse 2s ease-in-out ${i*350}ms infinite`,
                boxShadow:`0 0 6px ${p.color}`,
              }}/>
              <span style={{fontSize:13,color:C.secondary,fontFamily:"'Inter',sans-serif"}}>{a}</span>
            </div>
          ))}
        </div>

        <div style={{display:"flex",gap:10,justifyContent:"flex-start",position:"relative"}}>
          <Magnetic>
            <a href={p.github} target="_blank" rel="noreferrer" style={{
              display:"inline-flex",alignItems:"center",gap:6,
              padding:"9px 22px",background:"transparent",
              border:`1px solid ${C.border}`,borderRadius:40,
              color:C.primary,fontSize:13,fontWeight:500,
              textDecoration:"none",fontFamily:"'Inter',sans-serif",
              transition:"all 0.25s",
            }}
            onMouseEnter={e=>{e.currentTarget.style.borderColor=p.color+"80";e.currentTarget.style.color=p.color;e.currentTarget.style.transform="translateY(-2px)";e.currentTarget.style.boxShadow=`0 0 20px ${p.color}30`;}}
            onMouseLeave={e=>{e.currentTarget.style.borderColor=C.border;e.currentTarget.style.color=C.primary;e.currentTarget.style.transform="none";e.currentTarget.style.boxShadow="none";}}
            >GitHub ↗</a>
          </Magnetic>
        </div>
      </div>
    </Reveal>
  );
}

function Projects() {
  return (
    <section id="projects" style={{padding:"120px clamp(20px,8vw,120px)",borderTop:`1px solid ${C.border}`,position:"relative",overflow:"hidden"}}>
      <MorphBlob color={C.accent} size={400} style={{bottom:"5%",left:"-5%",animationDelay:"4s"}}/>
      <div style={{maxWidth:1200,margin:"0 auto",position:"relative",zIndex:1,width:"100%"}}>
        <Reveal><SectionLabel>Projects</SectionLabel></Reveal>
        <Reveal delay={100}><SectionHeading>Featured Work</SectionHeading></Reveal>
        <Reveal delay={200}>
          <p style={{color:C.secondary,fontSize:15,marginBottom:54,fontFamily:"'Inter',sans-serif"}}>
            Production-focused systems designed for real-world deployment.
          </p>
        </Reveal>
        <div style={{display:"flex",flexDirection:"column",gap:22}}>
          {PROJECTS.map((p,i)=><ProjectCard key={p.title} p={p} index={i}/>)}
        </div>
      </div>
    </section>
  );
}

// ── Research ──────────────────────────────────────────────────────────────
function Research() {
  const [hov,setHov]=useState(false);
  return (
    <section id="research" style={{
      padding:"120px clamp(20px,8vw,120px)",borderTop:`1px solid ${C.border}`,
      background:`linear-gradient(180deg,${C.surface2}60 0%,transparent 100%)`,
      position:"relative",overflow:"hidden",
    }}>
      <Glitter/>
      <MorphBlob color={C.accentAlt} size={380} style={{top:"0%",right:"5%",animationDelay:"2.5s"}}/>
      <div style={{maxWidth:1200,margin:"0 auto",position:"relative",zIndex:1,width:"100%"}}>
        <Reveal><SectionLabel>Research</SectionLabel></Reveal>
        <Reveal delay={100}><SectionHeading>Publications</SectionHeading></Reveal>
        <Reveal delay={200}>
          <div
            onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}
            style={{
              marginTop:40,
              background:`linear-gradient(135deg,${C.surface} 0%,rgba(192,132,212,0.08) 100%)`,
              border:`1px solid ${hov?C.accentAlt+"60":C.accentAlt+"35"}`,
              borderRadius:22,padding:"40px 44px",
              transition:"all 0.35s cubic-bezier(.4,0,.2,1)",
              transform:hov?"translateY(-5px)":"none",
              boxShadow:hov?`0 20px 64px rgba(192,132,212,0.18),0 0 0 1px ${C.accentAlt}18`:"none",
              position:"relative",overflow:"hidden",
            }}
          >
            {hov&&<div style={{
              position:"absolute",inset:0,borderRadius:22,pointerEvents:"none",
              background:`linear-gradient(105deg,transparent 40%,${C.accentAlt}10 50%,transparent 60%)`,
              animation:"shimmerSlide 1.5s ease-in-out infinite",
            }}/>}
            <div style={{
              position:"absolute",top:0,right:0,bottom:0,left:0,borderRadius:22,pointerEvents:"none",
              background:`linear-gradient(135deg,${C.accent}06,${C.accentAlt}10,${C.accent}06)`,
              backgroundSize:"200% 200%",animation:"gradientShift 6s ease infinite",
            }}/>
            <div style={{display:"flex",gap:20,alignItems:"flex-start",flexWrap:"wrap",position:"relative",justifyContent:"flex-start"}}>
              <div style={{
                width:56,height:56,borderRadius:14,
                background:`linear-gradient(135deg,${C.accent}22,${C.accentAlt}22)`,
                border:`1px solid ${C.accentAlt}45`,
                display:"flex",alignItems:"center",justifyContent:"center",
                fontSize:26,flexShrink:0,
                animation:"float 4s ease-in-out infinite",
                boxShadow:`0 0 20px ${C.accentAlt}30`,
              }}>📄</div>
              <div style={{flex:1,minWidth:240,textAlign:"left"}}>
                <div style={{display:"flex",gap:8,marginBottom:16,flexWrap:"wrap",justifyContent:"flex-start"}}>
                  <Tag>Under Review</Tag><Tag color={C.success}>IEEE Journal</Tag>
                </div>
                {/* Repositioned text outside of JSX container expression constraints */}
                <h3 style={{
                  fontFamily:"'Space Grotesk',sans-serif",
                  fontSize:"clamp(17px,2.2vw,22px)",fontWeight:700,color:C.primary,
                  margin:"0 0 12px 0",lineHeight:1.4,
                }}>
                  An Explainable AI Framework for Breast Cancer Prediction Using Machine Learning Models and Feature Attribution Methods
                </h3>
                <p style={{color:C.secondary,fontSize:14,marginBottom:18,fontFamily:"'Inter',sans-serif"}}>
                  Submitted to <strong style={{color:C.primary}}>IEEE Journal of Biomedical and Health Informatics</strong>
                </p>
                <div style={{display:"flex",flexWrap:"wrap",gap:7,justifyContent:"flex-start"}}>
                  {["Explainable AI","Healthcare AI","Machine Learning","Feature Attribution","SHAP"].map((t,i)=>(
                    <span key={t} style={{
                      padding:"4px 11px",background:"rgba(255,255,255,0.04)",
                      border:`1px solid ${C.border}`,borderRadius:40,
                      fontSize:11,color:C.secondary,fontFamily:"'Inter',sans-serif",
                      transition:"all 0.2s",cursor:"default",
                      transitionDelay:`${i*40}ms`,
                      ...(hov?{borderColor:C.accentAlt+"50",color:C.accentAlt}:{}),
                    }}>{t}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

// ── Experience ────────────────────────────────────────────────────────────
function Experience() {
  return (
    <section id="experience" style={{padding:"120px clamp(20px,8vw,120px)",borderTop:`1px solid ${C.border}`,position:"relative",overflow:"hidden"}}>
      <MorphBlob color={C.accent} size={350} style={{top:"20%",left:"-8%",animationDelay:"0.5s"}}/>
      <div style={{maxWidth:1200,margin:"0 auto",position:"relative",zIndex:1,width:"100%"}}>
        <Reveal><SectionLabel>Experience & Achievements</SectionLabel></Reveal>
        <div className="exp-grid" style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:56,alignItems:"start"}}>
          <div style={{textAlign:"left"}}>
            <Reveal delay={100}>
              <SectionHeading>Professional<br /><GradText>Experience</GradText></SectionHeading>
            </Reveal>
            <Reveal delay={200}>
              <div style={{marginTop:36}}>
                <Card style={{padding:"28px 32px"}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:18,flexWrap:"wrap",gap:10}}>
                    <div style={{textAlign:"left"}}>
                      <div style={{fontFamily:"'Space Grotesk',sans-serif",fontSize:17,fontWeight:700,color:C.primary,marginBottom:4}}>
                        AI Automation Intern
                      </div>
                      <div style={{fontSize:13,color:C.accent,fontFamily:"'Inter',sans-serif",fontWeight:500}}>AI & Automation</div>
                    </div>
                    <Tag color={C.success}>Completed</Tag>
                  </div>
                  {["Built n8n automation workflows for lead management","Developed production AI chatbots with LLM backends","Deployed services on Render with CI/CD pipelines","Automated multi-step business workflows end-to-end"].map((item,i)=>(
                    <div key={item} style={{display:"flex",gap:10,alignItems:"flex-start",marginBottom:10,justifyContent:"flex-start"}}>
                      <div style={{
                        width:5,height:5,borderRadius:"50%",background:C.accent,
                        flexShrink:0,marginTop:7,
                        animation:`pulse 2s ease-in-out ${i*300}ms infinite`,
                        boxShadow:`0 0 6px ${C.accent}80`,
                      }}/>
                      <span style={{fontSize:13,color:C.secondary,fontFamily:"'Inter',sans-serif",lineHeight:1.68}}>{item}</span>
                    </div>
                  ))}
                </Card>
              </div>
            </Reveal>
          </div>

          <div style={{textAlign:"left"}}>
            <Reveal delay={100} direction="right">
              <SectionHeading>Key<br /><GradText>Achievements</GradText></SectionHeading>
            </Reveal>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginTop:36}}>
              {[
                {stat:0.907,suffix:"",label:"Context Precision (RAGAS)",color:C.accent,isNum:true},
                {stat:99.3,suffix:"%",label:"Validation Accuracy",color:C.success,isNum:true},
                {stat:"IEEE",label:"Research Paper Submitted",color:C.accentAlt,isNum:false},
                {stat:"🥇",label:"Highest Marks — Live Project",color:C.gold,isNum:false},
              ].map((a,i)=>(
                <Reveal key={a.label} delay={i*90}>
                  <Card style={{textAlign:"left",padding:"26px 18px"}} glowColor={a.color}>
                    <div style={{
                      fontFamily:"'Space Grotesk',sans-serif",fontSize:36,fontWeight:700,
                      color:a.color,marginBottom:8,letterSpacing:"-0.02em",
                      textShadow:`0 0 30px ${a.color}50`,
                      animation:`statGlow 3s ease-in-out ${i*500}ms infinite`,
                    }}>
                      {a.isNum?<CountUp target={a.stat} suffix={a.suffix}/>:a.stat}
                    </div>
                    <div style={{fontSize:12,color:C.secondary,fontFamily:"'Inter',sans-serif",lineHeight:1.45}}>{a.label}</div>
                  </Card>
                </Reveal>
              ))}
            </div>
          </div>
        </div>

        <div style={{marginTop:80,textAlign:"left"}}>
          <Reveal>
            <h3 style={{fontFamily:"'Space Grotesk',sans-serif",fontSize:22,fontWeight:700,color:C.primary,marginBottom:28,letterSpacing:"-0.01em"}}>
              Certifications
            </h3>
          </Reveal>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(240px,1fr))",gap:16}}>
            {[
              {title:"IBM Data Analyst Professional Certificate",org:"IBM",icon:"🏆"},
              {title:"Classifying and Sourcing Data",org:"IBM",icon:"📊"},
              {title:"Fundamentals of Digital Marketing",org:"Google",icon:"🎯"},
              {title:"Generative AI Seminar",org:"2024",icon:"✨"},
            ].map((cert,i)=>(
              <Reveal key={cert.title} delay={i*90}>
                <Card style={{padding:"22px 24px",textAlign:"left"}} glowColor={C.accentAlt}>
                  <div style={{fontSize:26,marginBottom:10,display:"inline-block",animation:`float 3s ease-in-out ${i*600}ms infinite`}}>{cert.icon}</div>
                  <div style={{fontFamily:"'Space Grotesk',sans-serif",fontSize:13,fontWeight:600,color:C.primary,marginBottom:4,lineHeight:1.45}}>{cert.title}</div>
                  <GradText style={{fontSize:12,fontWeight:600}}>{cert.org}</GradText>
                </Card>
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// ── Contact ───────────────────────────────────────────────────────────────
function Contact() {
  return (
    <section id="contact" style={{
      padding:"120px clamp(20px,8vw,120px)",borderTop:`1px solid ${C.border}`,
      background:`linear-gradient(180deg,transparent 0%,${C.surface2}80 100%)`,
      position:"relative",overflow:"hidden",
    }}>
      <Glitter/>
      <MorphBlob color={C.accent} size={500} style={{top:"-20%",left:"20%",animationDelay:"1s"}}/>
      <MorphBlob color={C.accentAlt} size={300} style={{bottom:"-10%",right:"10%",animationDelay:"3s"}}/>
      <div style={{maxWidth:1200,margin:"0 auto",textAlign:"left",position:"relative",zIndex:1,width:"100%"}}>
        <Reveal><SectionLabel>Contact</SectionLabel></Reveal>
        <Reveal delay={100}>
          <SectionHeading>
            Let's build something<br/>
            <GradText>remarkable</GradText>
          </SectionHeading>
        </Reveal>
        <Reveal delay={200}>
          <p style={{color:C.secondary,fontSize:15,lineHeight:1.88,marginTop:20,marginBottom:48,fontFamily:"'Inter',sans-serif",maxWidth:680}}>
            Open to AI/ML engineering roles, research collaborations, and freelance AI projects. If you're building something ambitious with AI, I'd love to hear about it.
          </p>
        </Reveal>
        <Reveal delay={300}>
          <div style={{display:"flex",gap:14,justifyContent:"flex-start",flexWrap:"wrap"}}>
            <Magnetic><Btn primary href="mailto:KonainFatima28@gmail.com">Email ↗</Btn></Magnetic>
            <Magnetic><Btn href="https://github.com/konainfatima28" target="_blank">GitHub ↗</Btn></Magnetic>
            <Magnetic><Btn href="https://www.linkedin.com/in/konainfatima" target="_blank">LinkedIn ↗</Btn></Magnetic>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

// ── Footer ────────────────────────────────────────────────────────────────
function Footer() {
  return (
    <footer style={{
      borderTop:`1px solid ${C.border}`,
      padding:"26px clamp(20px,8vw,120px)",
      display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:10,
    }}>
      <div style={{fontSize:13,color:C.secondary,fontFamily:"'Inter',sans-serif"}}>
        Designed & Built by <GradText style={{fontWeight:600}}>Konain Fatima</GradText>
      </div>
      <div style={{fontSize:13,color:C.secondary,fontFamily:"'Inter',sans-serif"}}>© {new Date().getFullYear()}</div>
    </footer>
  );
}

// ── App Configuration Entry ─────────────────────────────────────────────────
export default function App() {
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700;800&family=Inter:wght@400;500;600;700&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
        html{scroll-behavior:smooth;}
        body{background:#0D0812;color:#FAF0F5;}
        ::selection{background:rgba(232,160,191,0.28);}
        ::-webkit-scrollbar{width:4px;}
        ::-webkit-scrollbar-track{background:#0D0812;}
        ::-webkit-scrollbar-thumb{background:linear-gradient(${C.accent},${C.accentAlt});border-radius:2px;}

        @keyframes blink{0%,100%{opacity:1}50%{opacity:0}}
        @keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-9px)}}
        @keyframes fadeUpDown{0%,100%{opacity:0.5;transform:translateY(0)}50%{opacity:1;transform:translateY(-4px)}}
        @keyframes scrollDot{0%{transform:translateY(0);opacity:1}80%{transform:translateY(14px);opacity:0}100%{transform:translateY(0);opacity:0}}
        @keyframes gradientShift{0%{background-position:0% 50%}50%{background-position:100% 50%}100%{background-position:0% 50%}}
        @keyframes shimmer{0%,100%{opacity:1}50%{opacity:0.7}}
        @keyframes shimmerSlide{0%{transform:translateX(-100%)}100%{transform:translateX(200%)}}
        @keyframes slideDown{from{opacity:0;transform:translateY(-14px)}to{opacity:1;transform:translateY(0)}}
        @keyframes rippleOut{0%{width:0;height:0;opacity:0.8}100%{width:120px;height:120px;opacity:0}}
        @keyframes morphBlob{
          0%{border-radius:60% 40% 30% 70%/60% 30% 70% 40%;transform:rotate(0deg) scale(1);}
          33%{border-radius:30% 60% 70% 40%/50% 60% 30% 60%;transform:rotate(120deg) scale(1.05);}
          66%{border-radius:70% 30% 50% 50%/30% 50% 70% 60%;transform:rotate(240deg) scale(0.95);}
          100%{border-radius:60% 40% 30% 70%/60% 30% 70% 40%;transform:rotate(360deg) scale(1);}
        }
        @keyframes gridPulse{0%,100%{opacity:0.6}50%{opacity:1}}
        @keyframes glitter{0%,100%{opacity:0;transform:scale(0)}25%{opacity:1;transform:scale(1)}75%{opacity:0.5;transform:scale(0.8)}}
        @keyframes letterBounce{0%{opacity:0;transform:translateY(20px) scale(0.8)}60%{transform:translateY(-5px) scale(1.05)}100%{opacity:1;transform:none}}
        @keyframes navDot{from{width:0;opacity:0}to{width:16px;opacity:1}}
        @keyframes pulse{0%,100%{transform:scale(1);opacity:1}50%{transform:scale(1.8);opacity:0.5}}
        @keyframes strokePulse{0%,100%{stroke-width:2.5px;opacity:1}50%{stroke-width:4px;opacity:0.6}}
        @keyframes statGlow{0%,100%{filter:brightness(1)}50%{filter:brightness(1.3) drop-shadow(0 0 8px currentColor)}}

        @media(max-width:768px){.nav-desktop{display:none!important}.nav-burger{display:block!important}}
        @media(max-width:900px){.about-grid,.exp-grid{grid-template-columns:1fr!important;gap:40px!important}}
      `}</style>

      <div style={{background:C.bg,minHeight:"100vh",...gs}}>
        <CursorTrail/>
        <RippleLayer/>
        <Nav/>
        <main>
          <Hero/>
          <About/>
          <Skills/>
          <Projects/>
          <Research/>
          <Experience/>
          <Contact/>
        </main>
        <Footer/>
      </div>
    </>
  );
}
