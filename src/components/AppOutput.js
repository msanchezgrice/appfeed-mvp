'use client';

function AffirmationsOutput({ output }) {
  const text = typeof output === 'string' ? output : output?.markdown || '';
  const affirmations = text.split('\n').filter(line => line.trim().match(/^[\d•\-*]|^[IWY]/));

  return (
    <div style={{
      padding: '24px',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      borderRadius: 12,
      color: 'white',
      minHeight: 200
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
  const items = output?.items || [];

  return (
    <div style={{
      padding: '24px',
      background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
      borderRadius: 12,
      color: 'white',
      minHeight: 200
    }}>
      <h3 style={{ margin: '0 0 20px 0', fontSize: 20, opacity: 0.9 }}>This Weekend 🎉</h3>
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

export default function AppOutput({ run, app }) {
  if (!run || !run.trace || run.trace.length === 0) {
    return <div className="small" style={{ padding: 16, textAlign: 'center', opacity: 0.6 }}>Running...</div>;
  }

  const lastStep = run.trace[run.trace.length - 1];
  const output = lastStep?.output;

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

  // Render based on app type
  if (app.id === 'affirmations-daily' || app.id.includes('affirmations')) {
    return <AffirmationsOutput output={output} />;
  }

  if (app.id === 'weekend-near-me' || app.id.includes('weekend')) {
    return <WeekendActivitiesOutput output={output} />;
  }

  if (app.id === 'todo-add' || app.id.includes('todo')) {
    return <TodoOutput output={output} />;
  }

  // Fallback: generic output
  return (
    <div style={{ padding: 16, background: '#f5f5f5', borderRadius: 8 }}>
      <pre style={{ whiteSpace: 'pre-wrap', margin: 0 }}>
        {typeof output === 'string' ? output : JSON.stringify(output, null, 2)}
      </pre>
    </div>
  );
}
