'use client';
import { useEffect, useMemo, useRef, useState } from 'react';

export default function ChatAgent({ app }) {
  const [mood, setMood] = useState(app?.demo?.sampleInputs?.mood || 'encouraging');
  const [topic, setTopic] = useState(app?.demo?.sampleInputs?.topic || '');
  const [tone, setTone] = useState(app?.demo?.sampleInputs?.tone_strength || 'medium');
  const [messages, setMessages] = useState(() => (topic ? [{ role: 'user', content: topic }] : []));
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const scrollerRef = useRef(null);

  const design = app?.design || {};
  const containerColor = design.containerColor || '#0b1220';
  const fontColor = design.fontColor || 'white';
  const fontFamily = design.fontFamily || 'system-ui';

  useEffect(() => {
    if (scrollerRef.current) {
      scrollerRef.current.scrollTop = scrollerRef.current.scrollHeight;
    }
  }, [messages, sending]);

  const canSend = useMemo(() => {
    return (topic || input.trim().length > 0) && !sending;
  }, [topic, input, sending]);

  const send = async (initial = false) => {
    if (!initial && !input.trim()) return;
    setSending(true);
    try {
      const payload = {
        mood,
        tone_strength: tone,
        messages: initial && topic && messages.length === 0
          ? [{ role: 'user', content: topic }]
          : [...messages, { role: 'user', content: input.trim() }]
      };
      if (!initial) {
        setMessages(ms => [...ms, { role: 'user', content: input.trim() }]);
        setInput('');
      }
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      const text = typeof data?.message === 'string'
        ? data.message
        : (data?.output?.markdown || '...');
      setMessages(ms => [...ms, { role: 'assistant', content: text }]);
    } catch (err) {
      setMessages(ms => [...ms, { role: 'assistant', content: 'Sorry, something went wrong.' }]);
    } finally {
      setSending(false);
    }
  };

  useEffect(() => {
    // auto-send first reply if topic present
    if (topic && messages.length === 1) {
      send(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div style={{
      background: containerColor,
      color: fontColor,
      fontFamily,
      borderRadius: 12,
      minHeight: 500,
      display: 'flex',
      flexDirection: 'column'
    }}>
      <div style={{ padding: 12, borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
        <div style={{ fontWeight: 700 }}>{app?.name || 'Chat'}</div>
        <div className="small" style={{ opacity: 0.8 }}>
          Mood: {mood} • Tone: {tone}
        </div>
      </div>
      <div ref={scrollerRef} style={{
        flex: 1,
        overflowY: 'auto',
        padding: 12,
        display: 'flex',
        flexDirection: 'column',
        gap: 10
      }}>
        {messages.map((m, i) => (
          <div key={i} style={{
            alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
            background: m.role === 'user' ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.08)',
            padding: '10px 12px',
            borderRadius: 10,
            maxWidth: '80%',
            whiteSpace: 'pre-wrap'
          }}>
            {m.content}
          </div>
        ))}
        {sending && (
          <div style={{
            alignSelf: 'flex-start',
            background: 'rgba(255,255,255,0.08)',
            padding: '10px 12px',
            borderRadius: 10
          }}>
            Typing…
          </div>
        )}
      </div>
      <div style={{ padding: 12, borderTop: '1px solid rgba(255,255,255,0.1)' }}>
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            className="input"
            placeholder={messages.length === 0 ? 'Start the conversation…' : 'Type a message…'}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                if (canSend) send(false);
              }
            }}
            style={{ flex: 1 }}
          />
          <button className="btn primary" disabled={!canSend} onClick={() => send(false)}>
            Send
          </button>
        </div>
      </div>
    </div>
  );
}


