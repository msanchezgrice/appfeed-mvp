'use client';
import { useState } from 'react';

export default function AppForm({ app, onSubmit, defaults={} }) {
  const [values, setValues] = useState(() => {
    const pre = {};
    for (const [k, spec] of Object.entries(app.inputs || {})) {
      pre[k] = defaults[k] ?? spec.default ?? '';
    }
    return pre;
  });

  const set = (k, v) => setValues(s => ({ ...s, [k]: v }));

  return (
    <form onSubmit={e => { e.preventDefault(); onSubmit(values); }}>
      {Object.entries(app.inputs || {}).map(([k, spec]) => (
        <div key={k} style={{marginBottom:12}}>
          <div className="label">{spec.label || k} {spec.required ? '*' : ''}</div>
          {spec.type === 'image' ? (
            <input 
              type="file" 
              accept={spec.accept || 'image/*'}
              className="input" 
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (file) {
                  const reader = new FileReader();
                  reader.onloadend = () => {
                    set(k, reader.result);
                  };
                  reader.readAsDataURL(file);
                }
              }}
            />
          ) : spec.type === 'select' ? (
            <select className="input" value={values[k] || spec.default || ''} onChange={e => set(k, e.target.value)} style={{width: '100%'}}>
              {spec.options?.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          ) : spec.enum ? (
            <select className="input" value={values[k]} onChange={e => set(k, e.target.value)}>
              {[ '', ...spec.enum].map(opt => <option key={opt} value={opt}>{opt||'—'}</option>)}
            </select>
          ) : (
            <input className="input" placeholder={spec.placeholder||''} value={values[k]} onChange={e => set(k, e.target.value)} />
          )}
        </div>
      ))}
      <div className="row">
        <button className="btn primary" type="submit">Run</button>
      </div>
    </form>
  );
}
