'use client';
import { useEffect, useState } from 'react';

export default function RunTrace({ run }) {
  const [i, setI] = useState(0);
  useEffect(() => {
    setI(0);
    const id = setInterval(() => setI(v => Math.min(v+1, run.trace.length)), 600);
    return () => clearInterval(id);
  }, [run?.id]);
  return (
    <div className="trace">
      <div>runId: {run.id} • app: {run.appId} • {run.durationMs}ms</div>
      <hr />
      {run.trace.slice(0, i).map(step => (
        <div key={step.i} style={{marginBottom:8}}>
          <div>step {step.i}: <b>{step.tool}</b> — <span className="small">{step.status}</span></div>
          {step.args ? <pre style={{whiteSpace:'pre-wrap'}} className="small">{JSON.stringify(step.args, null, 2)}</pre> : null}
          {step.output ? <pre style={{whiteSpace:'pre-wrap'}}>{typeof step.output === 'string' ? step.output : JSON.stringify(step.output, null, 2)}</pre> : null}
          {step.error ? <div style={{color:'#fca5a5'}}>{String(step.error)}</div> : null}
          {step.usedStub ? <div className="small">⚠️ used stub output (no key)</div> : null}
        </div>
      ))}
    </div>
  );
}
