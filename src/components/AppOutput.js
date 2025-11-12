'use client';

function AffirmationsOutput({ output, app }) {
  const text = typeof output === 'string' ? output : output?.markdown || '';
  const affirmations = text.split('\n').filter(line => line.trim().match(/^[\d•\-*]|^[IWY]/));

  // Design variables - configurable via remix
  const design = app?.design || {};
  const containerColor = design.containerColor || 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
  const fontColor = design.fontColor || 'white';
  const fontFamily = design.fontFamily || 'inherit';
  
  // Fixed variables - NOT configurable
  const containerSize = { padding: '24px', borderRadius: 12, minHeight: 200 }; // FIXED
  const maxWidth = '100%'; // FIXED
  const layoutStructure = 'vertical'; // FIXED

  return (
    <div style={{
      ...containerSize, // FIXED layout
      background: containerColor, // CONFIGURABLE
      color: fontColor, // CONFIGURABLE  
      fontFamily: fontFamily, // CONFIGURABLE
      maxWidth: maxWidth // FIXED
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

export default function AppOutput({ run, app }) {
  if (!run || !run.trace || run.trace.length === 0) {
    return <div className="small" style={{ padding: 16, textAlign: 'center', opacity: 0.6 }}>Running...</div>;
  }

  const lastStep = run.trace[run.trace.length - 1];
  const output = lastStep?.output;
  const usedStub = lastStep?.usedStub;

  // Show execution diagnostics if stub was used or error occurred
  if (usedStub || run.error || lastStep?.status === 'error') {
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
  if (app.id === 'affirmations-daily' || app.id.includes('affirmations')) {
    return <AffirmationsOutput output={output} />;
  }

  if (app.id === 'weekend-near-me' || app.id.includes('weekend')) {
    return <WeekendActivitiesOutput output={output} />;
  }

  if (app.id === 'todo-add' || app.id.includes('todo')) {
    return <TodoOutput output={output} />;
  }

  // Fallback: generic output for real AI responses
  // Check if output contains a generated image
  const hasImage = output?.image;
  
  // Extract text content from various output formats
  let textContent;
  if (typeof output === 'string') {
    textContent = output;
  } else if (output?.markdown) {
    textContent = output.markdown;
  } else {
    textContent = JSON.stringify(output, null, 2);
  }

  // Clean up escaped newlines and render nicely
  const cleanText = textContent.replace(/\\n\\n/g, '\n\n').replace(/\\n/g, '\n');

  return (
    <div style={{ 
      padding: 24, 
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      borderRadius: 12,
      color: 'white',
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
      <div style={{ 
        whiteSpace: 'pre-wrap', 
        fontFamily: 'inherit',
        fontSize: 16,
        lineHeight: 1.6
      }}>
        {cleanText}
      </div>
    </div>
  );
}
