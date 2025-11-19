'use client';
import { useState } from 'react';
import AssetPicker from './AssetPicker';
import AssetLibraryModal from './AssetLibraryModal';

export default function AppForm({ app, onSubmit, defaults={} }) {
  const [values, setValues] = useState(() => {
    const pre = {};
    for (const [k, spec] of Object.entries(app.inputs || {})) {
      pre[k] = defaults[k] ?? spec.default ?? '';
    }
    return pre;
  });
  const [loading, setLoading] = useState(false);
  const [showAssetLibrary, setShowAssetLibrary] = useState(false);
  const [currentImageField, setCurrentImageField] = useState(null);

  const set = (k, v) => setValues(s => ({ ...s, [k]: v }));
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit(values);
    } finally {
      setLoading(false);
    }
  };

  const handleAssetSelect = (asset, fieldKey) => {
    // When user selects an asset from library, use its URL directly
    // We'll convert it back to data URL if needed, or use the URL
    set(fieldKey, asset.url);
  };

  const handleFileChange = async (e, fieldKey) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        set(fieldKey, reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {Object.entries(app.inputs || {}).map(([k, spec]) => (
        <div key={k} style={{marginBottom:12}}>
          <div className="label">{spec.label || k} {spec.required ? '*' : ''}</div>
          {spec.type === 'image' ? (
            <>
              <input 
                type="file" 
                accept={spec.accept || 'image/*'}
                className="input" 
                onChange={(e) => handleFileChange(e, k)}
              />
              
              {/* Preview selected image */}
              {values[k] && (
                <div style={{ marginTop: 8 }}>
                  <img
                    src={values[k]}
                    alt="Preview"
                    style={{
                      maxWidth: 200,
                      maxHeight: 200,
                      borderRadius: 8,
                      objectFit: 'cover'
                    }}
                  />
                </div>
              )}
              
              {/* Asset Picker - shows recent uploads */}
              <AssetPicker
                onSelect={(asset) => handleAssetSelect(asset, k)}
                onViewAll={() => {
                  setCurrentImageField(k);
                  setShowAssetLibrary(true);
                }}
              />
            </>
          ) : spec.type === 'select' ? (
            <select className="input" value={values[k] || spec.default || ''} onChange={e => set(k, e.target.value)} style={{width: '100%'}}>
              {spec.options?.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          ) : spec.type === 'phone' ? (
            <input
              type="tel"
              className="input"
              placeholder={spec.placeholder || '+1 555 123 4567'}
              value={values[k]}
              onChange={e => set(k, e.target.value)}
              pattern={spec.pattern || '\\+?[0-9\\s\\-()]{7,}'}
            />
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
        <button className="btn primary" type="submit" disabled={loading} style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          opacity: loading ? 0.7 : 1
        }}>
          {loading && (
            <div style={{
              width: 16,
              height: 16,
              border: '2px solid white',
              borderTopColor: 'transparent',
              borderRadius: '50%',
              animation: 'spin 0.8s linear infinite'
            }} />
          )}
          {loading ? 'Running...' : 'Run'}
        </button>
      </div>
      <style jsx>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>

      {/* Asset Library Modal */}
      <AssetLibraryModal
        show={showAssetLibrary}
        onClose={() => {
          setShowAssetLibrary(false);
          setCurrentImageField(null);
        }}
        onSelect={(asset) => {
          if (currentImageField) {
            handleAssetSelect(asset, currentImageField);
          }
        }}
      />
    </form>
  );
}
