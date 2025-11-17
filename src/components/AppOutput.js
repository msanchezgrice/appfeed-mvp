'use client';

function escapeHtml(unsafe) {
  return String(unsafe)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

// Very small, safe markdown renderer for headings, bold/italic, and code blocks.
// This intentionally supports only a subset we commonly output.
function renderSimpleMarkdown(text) {
  if (!text) return '';
  const escaped = escapeHtml(text);
  const lines = escaped.split('\n');
  const htmlLines = [];
  let inCode = false;
  for (let raw of lines) {
    let line = raw;
    if (line.trim().startsWith('```')) {
      inCode = !inCode;
      if (inCode) {
        htmlLines.push('<pre><code>');
      } else {
        htmlLines.push('</code></pre>');
      }
      continue;
    }
    if (inCode) {
      htmlLines.push(line);
      continue;
    }
    // Headings
    if (/^###\s+/.test(line)) {
      htmlLines.push(`<h3 style="margin: 0 0 12px 0; font-size: 20px;">${line.replace(/^###\s+/, '')}</h3>`);
      continue;
    }
    if (/^##\s+/.test(line)) {
      htmlLines.push(`<h2 style="margin: 0 0 12px 0; font-size: 22px;">${line.replace(/^##\s+/, '')}</h2>`);
      continue;
    }
    if (/^#\s+/.test(line)) {
      htmlLines.push(`<h1 style="margin: 0 0 12px 0; font-size: 24px;">${line.replace(/^#\s+/, '')}</h1>`);
      continue;
    }
    // Bold / italic
    line = line.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    line = line.replace(/\*(.+?)\*/g, '<em>$1</em>');
    // Simple lists: keep as paragraphs with bullets/numbers preserved
    if (/^\s*[-*]\s+/.test(line)) {
      htmlLines.push(`<div style="margin: 6px 0;">• ${line.replace(/^\s*[-*]\s+/, '')}</div>`);
      continue;
    }
    if (/^\s*\d+\.\s+/.test(line)) {
      htmlLines.push(`<div style="margin: 6px 0;">${line}</div>`);
      continue;
    }
    // Paragraph
    if (line.trim().length === 0) {
      htmlLines.push('<div style="height:10px"></div>');
    } else {
      htmlLines.push(`<div>${line}</div>`);
    }
  }
  return htmlLines.join('\n');
}

function AffirmationsOutput({ output, app }) {
  const text = typeof output === 'string' ? output : output?.markdown || '';
  const affirmations = text.split('\n').filter(line => line.trim().match(/^[\d•\-*]|^[IWY]/));

  // Apply design variables from app (remix can change these!)
  const design = app?.design || {};
  const containerColor = design.containerColor || 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
  const fontColor = design.fontColor || 'white';
  const fontFamily = design.fontFamily || 'inherit';

  return (
    <div style={{
      padding: 24,
      borderRadius: 12,
      minHeight: 200,
      background: containerColor, // ← APPLIES remix design!
      color: fontColor,
      fontFamily: fontFamily
    }}>
      <h3 style={{ margin: '0 0 20px 0', fontSize: 20, opacity: 0.9 }}>Your Daily Affirmations ✨</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {affirmations.length > 0 ? affirmations.map((aff, i) => (
          <div key={i} style={{
            background: 'rgba(255,255,255,0.15)',
            padding: 16,
            borderRadius: 8,
            fontSize: 16,
            lineHeight: 1.5,
            backdropFilter: 'blur(10px)'
          }}>
            {aff.replace(/^[\d•\-*]\s*/, '')}
          </div>
        )) : (
          <div style={{ fontSize: 16, lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{text}</div>
        )}
      </div>
    </div>
  );
}

function WeekendActivitiesOutput({ output }) {
  // Handle both formats: { items: [...] } and direct array [...]
  const items = Array.isArray(output) ? output : (output?.items || []);

  return (
    <div style={{
      padding: '24px',
      background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
      borderRadius: 12,
      color: 'white',
      minHeight: 200
    }}>
      <h3 style={{ margin: '0 0 20px 0', fontSize: 20, opacity: 0.9 }}>This Weekend 🎉</h3>
      {items.length === 0 ? (
        <div style={{ fontSize: 16, opacity: 0.9, textAlign: 'center', padding: '40px 20px' }}>
          No activities found. Try a different city!
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {items.map((item, i) => (
            <div key={i} style={{
              background: 'rgba(255,255,255,0.15)',
              padding: 16,
              borderRadius: 8,
              backdropFilter: 'blur(10px)'
            }}>
              <div style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 4 }}>
                {item.name}
              </div>
              {item.description && (
                <div style={{ fontSize: 14, opacity: 0.9 }}>
                  {item.description}
                </div>
              )}
              {item.vibe && (
                <div style={{
                  marginTop: 8,
                  display: 'inline-block',
                  background: 'rgba(255,255,255,0.2)',
                  padding: '4px 8px',
                  borderRadius: 4,
                  fontSize: 12
                }}>
                  {item.vibe}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function TodoOutput({ output }) {
  const data = typeof output === 'object' ? output : {};
  const success = data.ok !== false;

  return (
    <div style={{
      padding: '24px',
      background: success
        ? 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)'
        : 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
      borderRadius: 12,
      color: 'white',
      minHeight: 200
    }}>
      {success ? (
        <>
          <div style={{
            fontSize: 48,
            textAlign: 'center',
            marginBottom: 16,
            animation: 'checkBounce 0.6s ease-out'
          }}>
            ✓
          </div>
          <h3 style={{ margin: '0 0 12px 0', fontSize: 20, textAlign: 'center' }}>
            Task Added!
          </h3>
          {data.title && (
            <div style={{
              background: 'rgba(255,255,255,0.15)',
              padding: 16,
              borderRadius: 8,
              fontSize: 16,
              backdropFilter: 'blur(10px)',
              textAlign: 'center'
            }}>
              {data.title}
            </div>
          )}
          {data.due && (
            <div style={{
              textAlign: 'center',
              marginTop: 12,
              fontSize: 14,
              opacity: 0.9
            }}>
              Due: {data.due}
            </div>
          )}
        </>
      ) : (
        <>
          <div style={{ fontSize: 48, textAlign: 'center', marginBottom: 16 }}>⚠️</div>
          <h3 style={{ margin: '0 0 12px 0', fontSize: 20, textAlign: 'center' }}>
            Oops!
          </h3>
          <div style={{
            background: 'rgba(255,255,255,0.15)',
            padding: 16,
            borderRadius: 8,
            fontSize: 14,
            backdropFilter: 'blur(10px)',
            textAlign: 'center'
          }}>
            {data.error || 'Something went wrong'}
          </div>
        </>
      )}
      <style jsx>{`
        @keyframes checkBounce {
          0% { transform: scale(0); }
          50% { transform: scale(1.2); }
          100% { transform: scale(1); }
        }
      `}</style>
    </div>
  );
}

import { useEffect, useMemo, useRef, useState } from 'react';

function ChatOutput({ app, run }) {
  const initialAssistant = typeof run?.outputs === 'string'
    ? run.outputs
    : (run?.outputs?.markdown || (Array.isArray(run?.trace) ? (run.trace[run.trace.length-1]?.output?.markdown || '') : ''));
  const inputs = run?.inputs || {};
  const [messages, setMessages] = useState([
    ...(initialAssistant ? [{ role: 'assistant', content: initialAssistant }] : [])
  ]);
  const [pending, setPending] = useState(false);
  const [text, setText] = useState('');
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const send = async () => {
    const msg = text.trim();
    if (!msg || pending) return;
    setText('');
    setMessages(m => [...m, { role: 'user', content: msg }]);
    setPending(true);
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          appId: app.id,
          mood: inputs.mood || 'encouraging',
          topic: inputs.topic || 'general',
          tone_strength: inputs.tone_strength || 'medium',
          history: [...messages, { role: 'user', content: msg }]
        })
      });
      const data = await res.json();
      const reply = data?.message || data?.output?.markdown || '...';
      setMessages(m => [...m, { role: 'assistant', content: reply }]);
    } catch (e) {
      setMessages(m => [...m, { role: 'assistant', content: '⚠️ Network error. Try again.' }]);
    } finally {
      setPending(false);
    }
  };

  // Full-height card UX (within modal constraints)
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '70vh',
      maxHeight: 700,
      background: app?.design?.containerColor || '#0b1220',
      color: app?.design?.fontColor || 'white',
      borderRadius: 12,
      overflow: 'hidden'
    }}>
      <div style={{ padding: 12, fontWeight: 700, borderBottom: '1px solid rgba(255,255,255,0.15)' }}>
        {app.name} • {inputs.mood || 'encouraging'}
      </div>
      <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto', padding: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {messages.map((m, i) => (
          <div key={i} style={{
            alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
            maxWidth: '80%',
            background: m.role === 'user' ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.3)',
            padding: 10,
            borderRadius: 10,
            whiteSpace: 'pre-wrap'
          }}>
            {m.content}
          </div>
        ))}
        {pending && (
          <div style={{ opacity: 0.8, fontSize: 12 }}>Agent is typing…</div>
        )}
      </div>
      <div style={{ display: 'flex', gap: 8, padding: 12, borderTop: '1px solid rgba(255,255,255,0.15)' }}>
        <input
          className="input"
          placeholder="Type a message…"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') send(); }}
          style={{ flex: 1, background: '#0f172a', color: 'white', border: '1px solid #223' }}
        />
        <button className="btn primary" onClick={send} disabled={pending || !text.trim()}>
          Send
        </button>
      </div>
    </div>
  );
}

function FlappyOutput({ app, run }) {
  const birdColor = (run?.inputs?.bird_color || 'yellow').toLowerCase();
  const theme = (run?.inputs?.background_theme || 'day').toLowerCase();
  const bg = theme === 'night' ? '#001018' : theme === 'forest' ? '#0b3d0b' : theme === 'ocean' ? '#02223a' : '#87ceeb';
  const html = `
<!DOCTYPE html><html><head><meta name="viewport" content="width=device-width, initial-scale=1" />
<style>
html,body{margin:0;padding:0;background:${bg};height:100%}#c{display:block;width:100vw;height:100vh;}
.hud{position:fixed;top:8px;left:8px;color:white;font-family:system-ui;font-weight:700;text-shadow:0 1px 2px #000}
.btn{position:fixed;bottom:16px;left:50%;transform:translateX(-50%);background:rgba(0,0,0,0.4);color:#fff;padding:10px 16px;border-radius:999px;font-family:system-ui}
</style></head><body>
<canvas id="c"></canvas><div class="hud">Score: <span id="s">0</span></div><div class="btn">Tap or press space to flap</div>
<script>
const canvas = document.getElementById('c'); const ctx = canvas.getContext('2d');
function resize(){ canvas.width=window.innerWidth; canvas.height=window.innerHeight; } window.addEventListener('resize', resize); resize();
let y=canvas.height/2, x=canvas.width*0.25, vy=0, g=0.45, flap=-7, r=14;
let pipes=[], gap=140, speed=2.5, frame=0, score=0, alive=true;
function pipe(){ const top=Math.random()*(canvas.height- gap - 120)+40; pipes.push({x:canvas.width, top, bottom: top+gap}); }
for(let i=0;i<3;i++){ pipes.push({x:canvas.width+i*200, top:100, bottom:240}); }
function color(){ return '${birdColor}'==='red'?'#ff5757':'${birdColor}'==='blue'?'#3aa0ff':'${birdColor}'==='green'?'#28d17c':'#ffd93b'; }
function tick(){
  ctx.fillStyle='${bg}'; ctx.fillRect(0,0,canvas.width,canvas.height);
  if(alive){
    frame++; vy+=g; y+=vy; if(y>canvas.height-r){ y=canvas.height-r; vy=0; }
    if(y<r){ y=r; vy=0; }
    if(frame%90===0) pipe();
    for(const p of pipes){
      p.x-=speed;
      ctx.fillStyle='#2ecc71'; ctx.fillRect(p.x,0,40,p.top);
      ctx.fillRect(p.x,p.bottom,40,canvas.height-p.bottom);
      // collision
      if(x+r>p.x && x-r<p.x+40 && (y-r<p.top || y+r>p.bottom)){ alive=false; }
      // score
      if(!p.passed && p.x+40<x){ p.passed=true; score++; document.getElementById('s').textContent=score; }
    }
    pipes = pipes.filter(p=>p.x>-60);
  } else {
    ctx.fillStyle='rgba(0,0,0,0.5)'; ctx.fillRect(0,0,canvas.width,canvas.height);
    ctx.fillStyle='#fff'; ctx.font='bold 24px system-ui'; ctx.fillText('Game Over - tap to restart', 20, 50);
  }
  // bird
  ctx.beginPath(); ctx.arc(x,y,r,0,Math.PI*2); ctx.fillStyle=color(); ctx.fill(); ctx.closePath();
  requestAnimationFrame(tick);
}
function restart(){ y=canvas.height/2; vy=0; pipes=[]; score=0; document.getElementById('s').textContent=score; alive=true; }
window.addEventListener('mousedown',()=>{ if(!alive){ restart(); } else { vy=flap; }});
window.addEventListener('touchstart', (e)=>{ e.preventDefault(); if(!alive){ restart(); } else { vy=flap; }}, {passive:false});
window.addEventListener('keydown',(e)=>{ if(e.code==='Space'){ if(!alive){ restart(); } else { vy=flap; }}});
tick();
</script></body></html>`;
  const src = 'data:text/html;base64,' + (typeof window==='undefined' ? '' : btoa(unescape(encodeURIComponent(html))));
  return (
    <div style={{ borderRadius: 12, overflow: 'hidden', height: '70vh', maxHeight: 700, background: bg }}>
      <iframe src={src} title="Flappy" style={{ width: '100%', height: '100%', border: 'none' }} />
    </div>
  );
}

function WordleOutput({ app, run }) {
  const theme = (run?.inputs?.theme || 'animals').toLowerCase();
  const WORDS = useMemo(() => ({
    animals: ['tiger','zebra','otter','eagle','whale','panda','camel','rhino','koala','sloth'],
    foods: ['pasta','curry','bagel','pizza','chili','apple','olive','sushi','tacos','bread'],
    cities: ['paris','tokyo','miami','milan','delhi','osaka','sofia','cairo','seoul','perth'],
    verbs: ['build','write','teach','learn','speak','judge','drawn','laugh','dance','throw'],
    brands: ['apple','tesla','nokia','sony','ikea','adobe','gucci','prada','visa','nvidia']
  }), []);
  const list = WORDS[theme] || WORDS.animals;
  const dayIndex = Math.floor(Date.now() / (24*60*60*1000)) % list.length;
  const target = list[dayIndex];
  const [guesses, setGuesses] = useState([]);
  const [input, setInput] = useState('');
  const [status, setStatus] = useState('');
  const length = target.length;

  const evaluate = (guess) => {
    guess = guess.toLowerCase();
    const res = [];
    const used = {};
    for (let i=0;i<length;i++){
      if (guess[i] === target[i]) { res.push('g'); used[i]=true; } else res.push(null);
    }
    for (let i=0;i<length;i++){
      if (res[i]) continue;
      const c = guess[i];
      let found = -1;
      for (let j=0;j<length;j++){
        if (!used[j] && target[j] === c) { found = j; break; }
      }
      res[i] = found !== -1 ? 'y' : 'b';
      if (found !== -1) used[found] = true;
    }
    return res;
  };

  const onSubmit = (e) => {
    e.preventDefault();
    const g = input.trim().toLowerCase();
    if (g.length !== length) { setStatus(`Enter ${length} letters`); return; }
    setStatus('');
    const pattern = evaluate(g);
    const entry = { word: g, pattern };
    const next = [...guesses, entry];
    setGuesses(next);
    setInput('');
    if (g === target) setStatus('🎉 Correct!');
    else if (next.length >= 6) setStatus(`❌ Out of tries. Word was "${target}".`);
  };

  const color = (p) => p==='g' ? '#16a34a' : p==='y' ? '#ca8a04' : '#374151';

  return (
    <div style={{ padding: 16, background: app?.design?.containerColor || '#111', color: 'white', borderRadius: 12 }}>
      <div style={{ marginBottom: 8, opacity: 0.9 }}>Theme: {theme} • {length}-letter word</div>
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${length}, 38px)`, gap: 6, marginBottom: 12 }}>
        {Array.from({ length: 6 }).map((_, row) => (
          <div key={row} style={{ display: 'contents' }}>
            {Array.from({ length }).map((__, col) => {
              const ch = guesses[row]?.word?.[col] || '';
              const p = guesses[row]?.pattern?.[col] || null;
              return (
                <div key={col} style={{
                  width: 38, height: 38, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: p ? color(p) : 'rgba(255,255,255,0.08)', borderRadius: 6, fontWeight: 700, textTransform: 'uppercase'
                }}>{ch}</div>
              );
            })}
          </div>
        ))}
      </div>
      <form onSubmit={onSubmit} style={{ display: 'flex', gap: 8 }}>
        <input className="input" value={input} onChange={e=>setInput(e.target.value)} maxLength={length} placeholder={`${length}-letter guess`} style={{ flex: 1 }} />
        <button className="btn primary" type="submit" disabled={guesses.length>=6 || status==='🎉 Correct!'}>Guess</button>
      </form>
      <div style={{ marginTop: 8, minHeight: 24 }}>{status}</div>
    </div>
  );
}

export default function AppOutput({ run, app }) {
  // Support both full trace runs and lightweight runs (outputs only)
  const hasTrace = Array.isArray(run?.trace) && run.trace.length > 0;
  const lastStep = hasTrace ? run.trace[run.trace.length - 1] : null;
  const output = hasTrace ? lastStep?.output : (run?.outputs || null);
  const usedStub = hasTrace ? lastStep?.usedStub : false;

  // Prefer explicit render type from runtime (future-proof), then id fallback
  const renderType = app?.runtime?.render_type || app?.render_type || null;
  if (
    renderType === 'chat' || app.id === 'chat-encouragement' ||
    renderType === 'game:flappy' || app.id === 'flappy-bird-mini' ||
    renderType === 'game:wordle' || app.id === 'wordle-daily-themed'
  ) {
    if (renderType === 'chat' || app.id === 'chat-encouragement') return <ChatOutput app={app} run={run} />;
    if (renderType === 'game:flappy' || app.id === 'flappy-bird-mini') return <FlappyOutput app={app} run={run} />;
    if (renderType === 'game:wordle' || app.id === 'wordle-daily-themed') return <WordleOutput app={app} run={run} />;
  }

  if (!output) {
    return <div className="small" style={{ padding: 16, textAlign: 'center', opacity: 0.6 }}>Running...</div>;
  }

  // Show execution diagnostics if stub was used or error occurred
  if (usedStub || run?.error || (hasTrace && lastStep?.status === 'error')) {
    return (
      <div style={{
        padding: 24,
        background: '#1a1a1a',
        borderRadius: 12,
        color: '#fff',
        border: '2px solid #fe2c55'
      }}>
        <div style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 16, color: '#fe2c55' }}>
          ⚠️ Execution Diagnostic
        </div>
        
        {/* Show the actual output/error */}
        <div style={{
          background: '#2a2a2a',
          padding: 16,
          borderRadius: 8,
          marginBottom: 16,
          fontFamily: 'monospace',
          fontSize: 14,
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word'
        }}>
          {typeof output === 'string' ? output : JSON.stringify(output, null, 2)}
        </div>

        {/* Show execution trace */}
        <div style={{ fontSize: 12, opacity: 0.8, marginTop: 16 }}>
          <div style={{ fontWeight: 'bold', marginBottom: 8 }}>Execution Trace:</div>
          {run.trace.map((step, i) => (
            <div key={i} style={{
              background: '#2a2a2a',
              padding: 12,
              borderRadius: 6,
              marginBottom: 8,
              borderLeft: step.usedStub ? '3px solid #fe2c55' : '3px solid #10b981'
            }}>
              <div style={{ fontWeight: 'bold' }}>
                Step {i}: {step.tool} - {step.status}
                {step.usedStub && <span style={{ color: '#fe2c55', marginLeft: 8 }}>⚠️ STUB</span>}
              </div>
              {step.error && (
                <div style={{ color: '#ff6b6b', marginTop: 4 }}>
                  Error: {step.error}
                </div>
              )}
              {step.args && (
                <div style={{ marginTop: 4, opacity: 0.7 }}>
                  Args: {JSON.stringify(step.args).slice(0, 100)}...
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Console tip */}
        <div style={{
          marginTop: 16,
          padding: 12,
          background: '#2a2a2a',
          borderRadius: 6,
          fontSize: 12,
          opacity: 0.8
        }}>
          💡 Check your terminal/console for detailed logs with [API /runs], [Runner], [LLM] prefixes
        </div>
      </div>
    );
  }

  // For successful executions with real AI, use the pretty output formats
  if (run.error) {
    return (
      <div style={{
        padding: 24,
        background: '#fee',
        borderRadius: 8,
        color: '#c00'
      }}>
        <div style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 8 }}>Error</div>
        <div>{String(run.error)}</div>
      </div>
    );
  }

  // Render based on app type (only for successful real AI responses)
  const renderType = app?.runtime?.render_type;
  if (renderType === 'chat' || app.id === 'chat-encouragement') {
    return <ChatOutput app={app} run={run} />;
  }
  if (renderType === 'flappy' || app.id === 'flappy-bird-mini') {
    return <FlappyOutput app={app} run={run} />;
  }
  if (renderType === 'wordle' || app.id === 'wordle-daily-themed') {
    return <WordleOutput app={app} run={run} />;
  }
  if (app.id === 'affirmations-daily' || app.id.includes('affirmations')) {
    return <AffirmationsOutput output={output} />;
  }

  if (app.id === 'weekend-near-me' || app.id.includes('weekend')) {
    return <WeekendActivitiesOutput output={output} />;
  }

  if (app.id === 'todo-add' || app.id.includes('todo')) {
    return <TodoOutput output={output} />;
  }

  // Fallback: generic output - APPLY DESIGN VARIABLES!
  const hasImage = output?.image;
  
  // Apply design variables from app
  const design = app?.design || {};
  const containerColor = design.containerColor || 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
  const fontColor = design.fontColor || 'white';
  const fontFamily = design.fontFamily || 'inherit';
  
  // Extract text content
  let textContent;
  if (typeof output === 'string') {
    textContent = output;
  } else if (output?.markdown) {
    textContent = output.markdown;
  } else {
    textContent = JSON.stringify(output, null, 2);
  }

  const cleanText = textContent.replace(/\\n\\n/g, '\n\n').replace(/\\n/g, '\n');

  return (
    <div style={{ 
      padding: 24, 
      background: containerColor, // ← APPLIES remix design!
      borderRadius: 12,
      color: fontColor,
      fontFamily: fontFamily,
      minHeight: 100
    }}>
      {hasImage && (
        <div style={{ marginBottom: 20, textAlign: 'center' }}>
          <img 
            src={output.image} 
            alt="Generated image" 
            style={{
              maxWidth: '100%',
              borderRadius: 8,
              boxShadow: '0 4px 20px rgba(0,0,0,0.3)'
            }}
          />
        </div>
      )}
      <div 
        style={{ 
          whiteSpace: 'normal', 
          fontFamily: 'inherit',
          fontSize: 16,
          lineHeight: 1.6
        }}
        dangerouslySetInnerHTML={{ __html: renderSimpleMarkdown(cleanText) }}
      />
    </div>
  );
}
