'use client';

export default function AppCreationGuide() {
  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '40px 16px', paddingBottom: '100px' }}>
      <h1>📖 App Creation Guide</h1>
      <p style={{ fontSize: 18, color: '#888', marginBottom: 40 }}>
        Learn how to create mini-apps for Clipcade
      </p>

      {/* Quick Start */}
      <section style={{ marginBottom: 40 }}>
        <h2>🚀 Quick Start</h2>
        <p>Every app is defined by a JSON manifest with these components:</p>
        
        <div style={{ background: '#1a1a1a', padding: 20, borderRadius: 12, overflow: 'auto' }}>
          <pre style={{ margin: 0, fontSize: 11, color: '#f0f0f0', lineHeight: 1.4 }}>{`{
  "name": "My App Name",
  "description": "What it does in 1-2 sentences",
  "icon": "🎨",
  "author": "@yourusername",
  "tags": ["category1", "category2"],
  
  "card_theme": {
    "backgroundColor": "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    "textColor": "white"
  },
  
  "preview_gradient": "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
  
  "design": {
    "containerColor": "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    "fontColor": "white",
    "fontFamily": "system-ui",
    "inputLayout": "vertical"
  },
  
  "modal_theme": {
    "backgroundColor": "#1a2332",
    "buttonColor": "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    "accentColor": "#667eea"
  },
  
  "input_theme": {
    "borderColor": "#333",
    "backgroundColor": "#1a1a1a"
  },
  
  "inputs": {
    "fieldName": {
      "type": "string",
      "label": "Field Label",
      "placeholder": "Enter text...",
      "required": true
    }
  },
  
  "runtime": {
    "engine": "local",
    "steps": [{
      "tool": "llm.complete",
      "args": {
        "prompt": "Do something with {{fieldName}}"
      },
      "output": "result"
    }]
  }
}

NOTE: preview_url (Nano Banana image) is AUTO-GENERATED from name + description`}</pre>
        </div>
      </section>

      {/* Available Tools */}
      <section style={{ marginBottom: 40 }}>
        <h2>🛠️ Available Tools</h2>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ background: '#1a1a1a', padding: 20, borderRadius: 12 }}>
            <h3 style={{ marginTop: 0 }}>llm.complete</h3>
            <p style={{ color: '#888' }}>Generate text with AI (OpenAI GPT-4o-mini)</p>
            <code style={{ fontSize: 12 }}>Good for: Summaries, rewrites, analysis, generation</code>
          </div>
          
          <div style={{ background: '#1a1a1a', padding: 20, borderRadius: 12 }}>
            <h3 style={{ marginTop: 0 }}>image.process</h3>
            <p style={{ color: '#888' }}>Transform images with AI (Gemini 2.5 Flash)</p>
            <code style={{ fontSize: 12 }}>Good for: Style transfer, image editing, artistic effects</code>
          </div>
          
          <div style={{ background: '#1a1a1a', padding: 20, borderRadius: 12 }}>
            <h3 style={{ marginTop: 0 }}>email.send</h3>
            <p style={{ color: '#888' }}>Send results via email (Resend)</p>
            <code style={{ fontSize: 12 }}>Good for: Notifications, digests, sharing results</code>
          </div>
        </div>
      </section>

      {/* Color Palettes */}
      <section style={{ marginBottom: 40 }}>
        <h2>🎨 Color Palettes</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
          {[
            { name: 'Purple/Blue', colors: '#667eea, #764ba2' },
            { name: 'Pink/Red', colors: '#f093fb, #f5576c' },
            { name: 'Blue/Cyan', colors: '#4facfe, #00f2fe' },
            { name: 'Green', colors: '#10b981, #059669' },
            { name: 'Orange', colors: '#f5af19, #f12711' },
            { name: 'Pastel', colors: '#a8edea, #fed6e3' }
          ].map(palette => (
            <div key={palette.name} style={{
              background: `linear-gradient(135deg, ${palette.colors.split(', ')[0]} 0%, ${palette.colors.split(', ')[1]} 100%)`,
              padding: 16,
              borderRadius: 8,
              color: 'white',
              fontWeight: 600
            }}>
              {palette.name}
            </div>
          ))}
        </div>
      </section>

      {/* Variable Explanations */}
      <section style={{ marginBottom: 40 }}>
        <h2>📋 Complete Variable Guide</h2>
        
        <div style={{ background: '#1a1a1a', padding: 20, borderRadius: 12, marginBottom: 16 }}>
          <h3>🎨 Visual Variables</h3>
          <ul style={{ fontSize: 14, color: '#888' }}>
            <li><strong>icon</strong> - Emoji shown in cards (e.g., "🎨")</li>
            <li><strong>card_theme.backgroundColor</strong> - Feed card background gradient</li>
            <li><strong>preview_gradient</strong> - Used by Nano Banana for image generation</li>
            <li><strong>preview_url</strong> - AUTO-GENERATED image (don't set manually!)</li>
          </ul>
        </div>

        <div style={{ background: '#1a1a1a', padding: 20, borderRadius: 12, marginBottom: 16 }}>
          <h3>🎨 App Output Design</h3>
          <ul style={{ fontSize: 14, color: '#888' }}>
            <li><strong>design.containerColor</strong> - Output container background</li>
            <li><strong>design.fontColor</strong> - Text color in results</li>
            <li><strong>design.fontFamily</strong> - Font for output</li>
            <li><strong>design.inputLayout</strong> - "vertical" or "horizontal"</li>
          </ul>
        </div>

        <div style={{ background: '#1a1a1a', padding: 20, borderRadius: 12, marginBottom: 16 }}>
          <h3>🎨 Modal & Input Styling</h3>
          <ul style={{ fontSize: 14, color: '#888' }}>
            <li><strong>modal_theme.backgroundColor</strong> - Try modal background</li>
            <li><strong>modal_theme.buttonColor</strong> - Run button gradient</li>
            <li><strong>input_theme.borderColor</strong> - Input field borders</li>
            <li><strong>author</strong> - Creator attribution (e.g., "@yourname")</li>
          </ul>
        </div>
      </section>

      {/* Examples */}
      <section>
        <h2>💡 Example Apps</h2>
        <p style={{ color: '#888', marginBottom: 16 }}>
          Check out existing apps in the feed for inspiration!
        </p>
        <a href="/feed" className="btn primary">
          View Example Apps →
        </a>
      </section>
    </div>
  );
}

