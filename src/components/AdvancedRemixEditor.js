'use client';
import { useState } from 'react';

export default function AdvancedRemixEditor({ app, onSave, onCancel, inline = false }) {
  const [activeTab, setActiveTab] = useState('design');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showLocked, setShowLocked] = useState(false);
  
  // Editable state
  const [editedName, setEditedName] = useState(app.name);
  const [editedDescription, setEditedDescription] = useState(app.description || '');
  const [editedTags, setEditedTags] = useState(app.tags || []);
  const [newTag, setNewTag] = useState('');
  
  // Design state
  const [containerColor, setContainerColor] = useState(app.design?.containerColor || 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)');
  const [fontColor, setFontColor] = useState(app.design?.fontColor || 'white');
  const [fontFamily, setFontFamily] = useState(app.design?.fontFamily || 'inherit');
  const [inputLayout, setInputLayout] = useState(app.design?.inputLayout || 'vertical');
  
  // Advanced JSON
  const [advancedJSON, setAdvancedJSON] = useState(JSON.stringify(app.inputs || {}, null, 2));
  
  const handleSave = () => {
    const remixedApp = {
      ...app,
      name: editedName,
      description: editedDescription,
      tags: editedTags,
      design: {
        containerColor,
        fontColor,
        fontFamily,
        inputLayout
      }
    };
    
    // If advanced JSON was edited, try to parse it
    if (showAdvanced) {
      try {
        remixedApp.inputs = JSON.parse(advancedJSON);
      } catch (e) {
        alert('Invalid JSON in advanced editor');
        return;
      }
    }
    
    onSave(remixedApp);
  };
  
  const addTag = () => {
    if (newTag && !editedTags.includes(newTag)) {
      setEditedTags([...editedTags, newTag]);
      setNewTag('');
    }
  };
  
  const removeTag = (tag) => {
    setEditedTags(editedTags.filter(t => t !== tag));
  };

  // If inline, don't render modal wrapper
  const content = (
    <div style={{
      background: inline ? 'transparent' : 'var(--bg-dark)',
      borderRadius: inline ? 0 : 12,
      maxWidth: inline ? '100%' : 700,
      width: '100%',
      maxHeight: inline ? 'none' : '90vh',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column'
    }}>
        {/* Header */}
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid #333',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <h2 style={{ margin: 0 }}>✏️ Advanced Remix</h2>
          <button
            onClick={onCancel}
            style={{
              background: 'none',
              border: 'none',
              fontSize: 24,
              cursor: 'pointer',
              color: 'var(--text-color)'
            }}
          >
            ×
          </button>
        </div>

        {/* Tabs */}
        <div style={{
          display: 'flex',
          gap: 0,
          borderBottom: '2px solid #333',
          padding: '0 24px'
        }}>
          {['design', 'content', 'locked'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                padding: '12px 20px',
                background: 'none',
                border: 'none',
                borderBottom: activeTab === tab ? '3px solid var(--brand)' : '3px solid transparent',
                color: activeTab === tab ? 'white' : '#888',
                cursor: 'pointer',
                fontSize: 14,
                fontWeight: 600,
                textTransform: 'capitalize',
                marginBottom: '-2px'
              }}
            >
              {tab === 'design' && '🎨 '}
              {tab === 'content' && '📝 '}
              {tab === 'locked' && '🔒 '}
              {tab}
            </button>
          ))}
        </div>

        {/* Content */}
        <div style={{
          padding: 24,
          overflowY: 'auto',
          flex: 1
        }}>
          {/* Design Tab */}
          {activeTab === 'design' && (
            <div>
              <div style={{ marginBottom: 20 }}>
                <label className="label" style={{ display: 'block', marginBottom: 6 }}>
                  Container Background
                </label>
                <input
                  type="text"
                  className="input"
                  value={containerColor}
                  onChange={(e) => setContainerColor(e.target.value)}
                  placeholder="linear-gradient(...) or #hex"
                  style={{ width: '100%' }}
                />
                <p className="small" style={{ marginTop: 4, color: '#888' }}>
                  Try: #ff69b4 or linear-gradient(135deg, #f093fb 0%, #f5576c 100%)
                </p>
              </div>

              <div style={{ marginBottom: 20 }}>
                <label className="label" style={{ display: 'block', marginBottom: 6 }}>
                  Text Color
                </label>
                <select
                  className="input"
                  value={fontColor}
                  onChange={(e) => setFontColor(e.target.value)}
                  style={{ width: '100%' }}
                >
                  <option value="white">White</option>
                  <option value="black">Black</option>
                  <option value="#2d3748">Dark Gray</option>
                  <option value="#f7fafc">Light Gray</option>
                  <option value="#fbbf24">Yellow</option>
                  <option value="#10b981">Green</option>
                  <option value="#3b82f6">Blue</option>
                </select>
              </div>

              <div style={{ marginBottom: 20 }}>
                <label className="label" style={{ display: 'block', marginBottom: 6 }}>
                  Font Family
                </label>
                <select
                  className="input"
                  value={fontFamily}
                  onChange={(e) => setFontFamily(e.target.value)}
                  style={{ width: '100%' }}
                >
                  <option value="inherit">System Default</option>
                  <option value="system-ui, -apple-system, sans-serif">Sans Serif</option>
                  <option value="monospace">Monospace</option>
                  <option value="Georgia, serif">Serif</option>
                  <option value="'Comic Sans MS', cursive">Comic Sans</option>
                </select>
              </div>

              <div style={{ marginBottom: 20 }}>
                <label className="label" style={{ display: 'block', marginBottom: 6 }}>
                  Input Layout
                </label>
                <div style={{ display: 'flex', gap: 12 }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                    <input
                      type="radio"
                      checked={inputLayout === 'vertical'}
                      onChange={() => setInputLayout('vertical')}
                    />
                    <span>Vertical (stacked)</span>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                    <input
                      type="radio"
                      checked={inputLayout === 'horizontal'}
                      onChange={() => setInputLayout('horizontal')}
                    />
                    <span>Horizontal (side-by-side)</span>
                  </label>
                </div>
              </div>

              {/* Preview */}
              <div style={{ marginBottom: 20 }}>
                <label className="label" style={{ display: 'block', marginBottom: 6 }}>
                  Preview
                </label>
                <div style={{
                  padding: 24,
                  background: containerColor,
                  color: fontColor,
                  fontFamily: fontFamily,
                  borderRadius: 12,
                  minHeight: 100
                }}>
                  <p style={{ margin: 0 }}>Sample text in your selected style</p>
                </div>
              </div>
            </div>
          )}

          {/* Content Tab */}
          {activeTab === 'content' && (
            <div>
              <div style={{ marginBottom: 20 }}>
                <label className="label" style={{ display: 'block', marginBottom: 6 }}>
                  App Name
                </label>
                <input
                  type="text"
                  className="input"
                  value={editedName}
                  onChange={(e) => setEditedName(e.target.value)}
                  style={{ width: '100%' }}
                />
              </div>

              <div style={{ marginBottom: 20 }}>
                <label className="label" style={{ display: 'block', marginBottom: 6 }}>
                  Description
                </label>
                <textarea
                  className="input"
                  value={editedDescription}
                  onChange={(e) => setEditedDescription(e.target.value)}
                  rows={4}
                  style={{ width: '100%', resize: 'vertical' }}
                />
              </div>

              <div style={{ marginBottom: 20 }}>
                <label className="label" style={{ display: 'block', marginBottom: 6 }}>
                  Tags
                </label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 8 }}>
                  {editedTags.map(tag => (
                    <span
                      key={tag}
                      style={{
                        background: 'var(--brand)',
                        color: 'white',
                        padding: '4px 10px',
                        borderRadius: 12,
                        fontSize: 13,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6
                      }}
                    >
                      #{tag}
                      <button
                        onClick={() => removeTag(tag)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: 'white',
                          cursor: 'pointer',
                          fontSize: 16,
                          padding: 0
                        }}
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input
                    type="text"
                    className="input"
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addTag()}
                    placeholder="Add tag..."
                    style={{ flex: 1 }}
                  />
                  <button onClick={addTag} className="btn ghost">
                    + Add
                  </button>
                </div>
              </div>

              {/* Advanced JSON Editor */}
              <div>
                <button
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--brand)',
                    cursor: 'pointer',
                    fontSize: 13,
                    marginBottom: 12
                  }}
                >
                  {showAdvanced ? '▲' : '▼'} Advanced: Edit Inputs (JSON)
                </button>
                
                {showAdvanced && (
                  <div>
                    <textarea
                      value={advancedJSON}
                      onChange={(e) => setAdvancedJSON(e.target.value)}
                      style={{
                        width: '100%',
                        height: 200,
                        fontFamily: 'monospace',
                        fontSize: 12,
                        padding: 12,
                        background: '#1a1a1a',
                        border: '1px solid #333',
                        borderRadius: 8,
                        color: '#fff',
                        resize: 'vertical'
                      }}
                    />
                    <p className="small" style={{ marginTop: 4, color: '#888' }}>
                      ⚠️ Advanced users only - invalid JSON will break the app
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Locked Tab */}
          {activeTab === 'locked' && (
            <div>
              <p style={{ color: '#888', marginBottom: 16 }}>
                These variables are locked to ensure consistency across the platform:
              </p>
              
              <div style={{ background: '#1a1a1a', padding: 16, borderRadius: 8, marginBottom: 12 }}>
                <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>🔒 Layout Structure</div>
                <ul style={{ margin: 0, paddingLeft: 20, fontSize: 13, color: '#888' }}>
                  <li>Container padding: 24px</li>
                  <li>Border radius: 12px</li>
                  <li>Minimum height: 200px</li>
                  <li>Maximum width: 100%</li>
                  <li>Layout type: Vertical scroll</li>
                </ul>
              </div>

              <div style={{ background: '#1a1a1a', padding: 16, borderRadius: 8, marginBottom: 12 }}>
                <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>🔒 Runtime Logic</div>
                <ul style={{ margin: 0, paddingLeft: 20, fontSize: 13, color: '#888' }}>
                  <li>Tool: {app.runtime?.steps?.[0]?.tool || 'N/A'}</li>
                  <li>Steps: {app.runtime?.steps?.length || 0}</li>
                  <li>Engine: {app.runtime?.engine || 'local'}</li>
                </ul>
              </div>

              <div style={{ background: '#1a1a1a', padding: 16, borderRadius: 8 }}>
                <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>ℹ️ Why Locked?</div>
                <p style={{ fontSize: 13, color: '#888', margin: 0 }}>
                  These ensure all apps work consistently in the TikTok-style feed and maintain
                  the platform's UX standards.
                </p>
              </div>

              <button
                onClick={() => setShowLocked(!showLocked)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--brand)',
                  cursor: 'pointer',
                  fontSize: 13,
                  marginTop: 16
                }}
              >
                {showLocked ? '▲' : '▼'} Show Full Runtime JSON
              </button>

              {showLocked && (
                <pre style={{
                  marginTop: 12,
                  padding: 12,
                  background: '#1a1a1a',
                  borderRadius: 8,
                  fontSize: 11,
                  overflow: 'auto',
                  maxHeight: 200,
                  color: '#888'
                }}>
                  {JSON.stringify(app.runtime, null, 2)}
                </pre>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: '16px 24px',
          borderTop: '1px solid #333',
          display: 'flex',
          gap: 12,
          justifyContent: 'flex-end'
        }}>
          <button onClick={onCancel} className="btn ghost">
            Cancel
          </button>
          <button onClick={handleSave} className="btn primary">
            💾 Save Remix
          </button>
        </div>
      </div>
    </div>
  );
  
  // Return with or without modal wrapper
  if (inline) {
    return content;
  }
  
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0,0,0,0.8)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: 16
    }}>
      {content}
    </div>
  );
}

