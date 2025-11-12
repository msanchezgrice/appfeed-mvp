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

  // Render just the content for inline use
  if (inline) {
    return (
      <div style={{ paddingTop: 8 }}>
        <p className="small" style={{ color: '#888', marginBottom: 12 }}>
          Edit all variables with full control
        </p>
        <div style={{ marginBottom: 12, fontSize: 13, color: '#888' }}>
          ✅ Editable: Background, Colors, Fonts, Name, Description, Tags<br/>
          🔒 Locked: Container size, Layout structure, Core logic
        </div>
        <button onClick={handleSave} className="btn primary" style={{ width: '100%' }}>
          💾 Save Advanced Remix
        </button>
        <p className="small" style={{ marginTop: 8, color: '#888' }}>
          Full editor coming soon - for now use Quick Remix
        </p>
      </div>
    );
  }

  // Full modal version (not used in current flow)
  return (
    <div>Advanced Editor Placeholder</div>
  );
}
