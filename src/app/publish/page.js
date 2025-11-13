'use client';
import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function PublishPage() {
  const { user, isLoaded, isSignedIn } = useUser();
  const router = useRouter();
  const [step, setStep] = useState('choose-mode'); // choose-mode, inline-form, remote-form, github-form, analyzing, success
  const [mode, setMode] = useState(null); // 'inline', 'remote', or 'github'
  // New AI mode states: ai-form, generating

  // Form states for inline app
  const [appName, setAppName] = useState('');
  const [appDescription, setAppDescription] = useState('');
  const [manifestJson, setManifestJson] = useState('');
  const [demoVideo, setDemoVideo] = useState(null);
  const [tags, setTags] = useState('');
  const [isMobile, setIsMobile] = useState(false);

  // Form states for AI app
  const [aiPrompt, setAiPrompt] = useState('');
  const [createdApp, setCreatedApp] = useState(null);

  // Form states for remote app
  const [remoteUrl, setRemoteUrl] = useState('');

  // Form states for GitHub auto-integration
  const [githubUrl, setGithubUrl] = useState('');
  const [analysisResult, setAnalysisResult] = useState(null);
  const [analysisError, setAnalysisError] = useState(null);

  useEffect(() => {
    // Redirect to sign-in if not authenticated
    if (isLoaded && !isSignedIn) {
      router.push('/sign-in?redirect_url=/publish');
    }
  }, [isLoaded, isSignedIn, router]);

  const handleChooseMode = (selectedMode) => {
    setMode(selectedMode);
    if (selectedMode === 'inline') {
      setStep('inline-form');
    } else if (selectedMode === 'remote') {
      setStep('remote-form');
    } else if (selectedMode === 'github') {
      setStep('github-form');
    } else if (selectedMode === 'ai') {
      setStep('ai-form');
    }
  };

  const handleSubmitInline = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch('/api/apps/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include', // Send Clerk session
        body: JSON.stringify({
          mode: 'inline',
          appData: {
            name: appName,
            description: appDescription,
            manifestJson,
            tags,
            isMobile
          }
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to publish');
      }

      console.log('App published:', result);
      setCreatedApp(result.app || null);
      setStep('success');
    } catch (error) {
      alert('Error publishing app: ' + error.message);
    }
  };

  const handleSubmitRemote = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch('/api/apps/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include', // Send Clerk session
        body: JSON.stringify({
          mode: 'remote',
          appData: {
            remoteUrl,
            tags,
            isMobile
          }
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to publish');
      }

      console.log('App published:', result);
      setCreatedApp(result.app || null);
      setStep('success');
    } catch (error) {
      alert('Error publishing app: ' + error.message);
    }
  };

  const handleAnalyzeGitHub = async (e) => {
    e.preventDefault();
    setAnalysisError(null);
    setStep('analyzing');

    try {
      const response = await fetch('/api/github/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include', // Send Clerk session
        body: JSON.stringify({ githubUrl })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Analysis failed');
      }

      setAnalysisResult(result);
      setStep('github-form');
    } catch (error) {
      setAnalysisError(error.message);
      setStep('github-form');
    }
  };

  const handleSubmitGitHub = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch('/api/apps/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include', // Send Clerk session
        body: JSON.stringify({
          mode: 'github',
          appData: {
            githubUrl,
            analysisResult,
            tags,
            isMobile
          }
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to publish');
      }

      console.log('App published:', result);
      setCreatedApp(result.app || null);
      setStep('success');
    } catch (error) {
      alert('Error publishing app: ' + error.message);
    }
  };

  const handleSubmitAI = async (e) => {
    e.preventDefault();
    setStep('generating');
    try {
      const response = await fetch('/api/apps/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          mode: 'ai',
          appData: {
            prompt: aiPrompt,
            tags,
            isMobile
          }
        })
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || 'Failed to generate app');
      }
      setCreatedApp(result.app || null);
      setStep('success');
    } catch (error) {
      alert('Error generating app: ' + error.message);
      setStep('ai-form');
    }
  };

  // Show loading while checking auth
  if (!isLoaded) {
    return (
      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '40px 16px', textAlign: 'center' }}>
        <p>Loading...</p>
      </div>
    );
  }

  // If not signed in, redirect happens in useEffect
  if (!isSignedIn) {
    return null;
  }

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '40px 16px', paddingBottom: '100px' }}>
      {/* Choose Mode Step */}
      {step === 'choose-mode' && (
        <div>
          <h1 style={{ marginBottom: 16 }}>Choose Your Publishing Method</h1>
          <p className="small" style={{ marginBottom: 32 }}>
            Pick the approach that works best for your app.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24 }}>
            {/* GitHub Auto-Integration Option - FIRST */}
            <div className="card" style={{ padding: 32, border: '2px solid var(--brand)', position: 'relative' }}>
              <div style={{
                position: 'absolute',
                top: -12,
                right: 20,
                background: 'var(--brand)',
                color: '#000',
                padding: '4px 12px',
                borderRadius: 12,
                fontSize: 12,
                fontWeight: 'bold'
              }}>
                ✨ AI-Powered
              </div>
              <h2 style={{ marginTop: 0, marginBottom: 12 }}>GitHub (Auto)</h2>
              <p className="small" style={{ marginBottom: 20 }}>
                Just paste a GitHub URL. We'll analyze your code, generate the adapter, run quality checks, and deploy it for you.
              </p>

              <div style={{ marginBottom: 20 }}>
                <div style={{ fontWeight: 'bold', marginBottom: 8, color: 'var(--brand2)' }}>Best for:</div>
                <ul className="small" style={{ marginLeft: 20, marginBottom: 0 }}>
                  <li>Existing GitHub projects</li>
                  <li>Zero configuration</li>
                  <li>AI-generated adapters</li>
                  <li>Automatic quality checks</li>
                </ul>
              </div>

              <button
                onClick={() => handleChooseMode('github')}
                className="btn primary"
                style={{ width: '100%' }}
              >
                Connect GitHub Repo →
              </button>
            </div>

            {/* Inline Option */}
            <div className="card" style={{ padding: 32 }}>
              <h2 style={{ marginTop: 0, marginBottom: 12 }}>Inline (Manifest)</h2>
              <p className="small" style={{ marginBottom: 20 }}>
                Fastest option. No server needed. The platform executes your steps in a sandbox.
              </p>

              <div style={{ marginBottom: 20 }}>
                <div style={{ fontWeight: 'bold', marginBottom: 8, color: 'var(--brand2)' }}>Best for:</div>
                <ul className="small" style={{ marginLeft: 20, marginBottom: 0 }}>
                  <li>Simple workflows</li>
                  <li>Quick prototypes</li>
                  <li>LLM-based apps</li>
                  <li>No backend required</li>
                </ul>
              </div>

              <button
                onClick={() => handleChooseMode('inline')}
                className="btn primary"
                style={{ width: '100%' }}
              >
                Build Inline App →
              </button>
            </div>

            {/* Remote Option */}
            <div className="card" style={{ padding: 32 }}>
              <h2 style={{ marginTop: 0, marginBottom: 12 }}>Remote (Adapter)</h2>
              <p className="small" style={{ marginBottom: 20 }}>
                Use your own backend on Vercel, Cloudflare, or any host. We call your /manifest and /run endpoints.
              </p>

              <div style={{ marginBottom: 20 }}>
                <div style={{ fontWeight: 'bold', marginBottom: 8, color: 'var(--brand2)' }}>Best for:</div>
                <ul className="small" style={{ marginLeft: 20, marginBottom: 0 }}>
                  <li>Complex logic</li>
                  <li>Custom integrations</li>
                  <li>Existing services</li>
                  <li>Full control</li>
                </ul>
              </div>

              <button
                onClick={() => handleChooseMode('remote')}
                className="btn primary"
                style={{ width: '100%' }}
              >
                Integrate Remote App →
              </button>
            </div>

            {/* AI Create Now Option */}
            <div className="card" style={{ padding: 32, border: '2px solid #fe2c55' }}>
              <div style={{
                position: 'absolute',
                top: -12,
                right: 20,
                background: '#fe2c55',
                color: '#000',
                padding: '4px 12px',
                borderRadius: 12,
                fontSize: 12,
                fontWeight: 'bold'
              }}>
                New
              </div>
              <h2 style={{ marginTop: 0, marginBottom: 12 }}>Create App Now (AI)</h2>
              <p className="small" style={{ marginBottom: 20 }}>
                Describe your idea and we’ll generate a complete app automatically using Sonnet.
              </p>

              <div style={{ marginBottom: 20 }}>
                <div style={{ fontWeight: 'bold', marginBottom: 8, color: 'var(--brand2)' }}>Best for:</div>
                <ul className="small" style={{ marginLeft: 20, marginBottom: 0 }}>
                  <li>Starting from a prompt</li>
                  <li>Fast concept-to-app</li>
                  <li>No code needed</li>
                </ul>
              </div>

              <button
                onClick={() => handleChooseMode('ai')}
                className="btn primary"
                style={{ width: '100%' }}
              >
                Create App Now →
              </button>
            </div>
          </div>

          <div style={{ marginTop: 24, textAlign: 'center' }}>
            <Link href="/docs/manifest" className="small" style={{ color: 'var(--brand)', marginRight: 16 }}>
              View Manifest Docs →
            </Link>
            <Link href="/docs/remote-adapter" className="small" style={{ color: 'var(--brand)' }}>
              View Adapter Docs →
            </Link>
          </div>
        </div>
      )}

      {/* AI Form Step */}
      {step === 'ai-form' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
            <h1 style={{ margin: 0 }}>Create App with AI</h1>
            <button onClick={() => setStep('choose-mode')} className="btn ghost">
              ← Back
            </button>
          </div>

          <form onSubmit={handleSubmitAI}>
            <div className="card" style={{ marginBottom: 16 }}>
              <h3 style={{ marginTop: 0 }}>Describe Your App</h3>
              <textarea
                className="input"
                placeholder="Example: A habit tracker that lets me add daily goals, tracks streaks, and gives motivational quotes. Use a fun, colorful style."
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                rows={6}
                required
              />
              <p className="small" style={{ marginTop: 8, color: '#888' }}>
                We’ll generate inputs, runtime steps, and design based on your prompt. You can remix later.
              </p>
            </div>

            <div className="card" style={{ marginBottom: 16 }}>
              <h3 style={{ marginTop: 0 }}>Discovery & Device</h3>
              <div style={{ marginBottom: 16 }}>
                <label className="label">Tags</label>
                <input
                  type="text"
                  className="input"
                  placeholder="productivity, ai, automation (comma-separated)"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                />
              </div>
              <div>
                <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={isMobile}
                    onChange={(e) => setIsMobile(e.target.checked)}
                    style={{ marginRight: 8 }}
                  />
                  <span>Mobile-ready (renders well on mobile devices)</span>
                </label>
              </div>
            </div>

            <button type="submit" className="btn primary" style={{ width: '100%', padding: '14px', fontSize: 16 }}>
              Generate App →
            </button>
          </form>
        </div>
      )}

      {/* Generating Step (AI) */}
      {step === 'generating' && (
        <div style={{ textAlign: 'center', padding: '80px 20px' }}>
          <div style={{ fontSize: 64, marginBottom: 24, animation: 'spin 2s linear infinite' }}>⚙️</div>
          <h1 style={{ marginBottom: 16 }}>Generating Your App...</h1>
          <p className="small" style={{ marginBottom: 32, maxWidth: 500, margin: '0 auto 32px' }}>
            We’re creating your manifest, wiring runtime steps, and generating a preview image. This takes ~20–60s.
          </p>
          <style jsx>{`
            @keyframes spin {
              from { transform: rotate(0deg); }
              to { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      )}

      {/* Inline Form Step */}
      {step === 'inline-form' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
            <h1 style={{ margin: 0 }}>Create Inline App</h1>
            <button onClick={() => setStep('choose-mode')} className="btn ghost">
              ← Back
            </button>
          </div>

          <form onSubmit={handleSubmitInline}>
            <div className="card" style={{ marginBottom: 16 }}>
              <h3 style={{ marginTop: 0 }}>App Details</h3>

              <div style={{ marginBottom: 16 }}>
                <label className="label">App Name *</label>
                <input
                  type="text"
                  className="input"
                  placeholder="My Awesome App"
                  value={appName}
                  onChange={(e) => setAppName(e.target.value)}
                  required
                />
              </div>

              <div style={{ marginBottom: 16 }}>
                <label className="label">Description *</label>
                <textarea
                  className="input"
                  placeholder="A brief description of what your app does..."
                  value={appDescription}
                  onChange={(e) => setAppDescription(e.target.value)}
                  rows={3}
                  required
                />
              </div>

              <div style={{ marginBottom: 16 }}>
                <label className="label">Manifest JSON *</label>
                <textarea
                  className="input"
                  placeholder='{"inputs": {...}, "permissions": [...], "runtime": {...}}'
                  value={manifestJson}
                  onChange={(e) => setManifestJson(e.target.value)}
                  rows={12}
                  style={{ fontFamily: 'monospace', fontSize: 13 }}
                  required
                />
                <p className="small" style={{ marginTop: 4 }}>
                  <Link href="/docs/manifest" style={{ color: 'var(--brand)' }}>View manifest documentation →</Link>
                </p>
              </div>
            </div>

            <div className="card" style={{ marginBottom: 16 }}>
              <h3 style={{ marginTop: 0 }}>Demo & Discovery</h3>

              <div style={{ marginBottom: 16 }}>
                <label className="label">Demo Video (5-15s) *</label>
                <input
                  type="file"
                  className="input"
                  accept="video/*"
                  onChange={(e) => setDemoVideo(e.target.files[0])}
                  required
                />
                <p className="small" style={{ marginTop: 4 }}>
                  Upload a short video showing the "aha" moment of your app
                </p>
              </div>

              <div style={{ marginBottom: 16 }}>
                <label className="label">Tags</label>
                <input
                  type="text"
                  className="input"
                  placeholder="productivity, ai, automation (comma-separated)"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                />
              </div>

              <div>
                <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={isMobile}
                    onChange={(e) => setIsMobile(e.target.checked)}
                    style={{ marginRight: 8 }}
                  />
                  <span>Mobile-ready (renders well on mobile devices)</span>
                </label>
              </div>
            </div>

            <button type="submit" className="btn primary" style={{ width: '100%', padding: '14px', fontSize: 16 }}>
              Publish App →
            </button>
          </form>
        </div>
      )}

      {/* Remote Form Step */}
      {step === 'remote-form' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
            <h1 style={{ margin: 0 }}>Connect Remote App</h1>
            <button onClick={() => setStep('choose-mode')} className="btn ghost">
              ← Back
            </button>
          </div>

          <form onSubmit={handleSubmitRemote}>
            <div className="card" style={{ marginBottom: 16 }}>
              <h3 style={{ marginTop: 0 }}>Remote Configuration</h3>

              <div style={{ marginBottom: 16 }}>
                <label className="label">Base URL *</label>
                <input
                  type="url"
                  className="input"
                  placeholder="https://your-app.vercel.app"
                  value={remoteUrl}
                  onChange={(e) => setRemoteUrl(e.target.value)}
                  required
                />
                <p className="small" style={{ marginTop: 4 }}>
                  We'll call <code>{remoteUrl || 'https://your-app.vercel.app'}/manifest</code> and <code>{remoteUrl || 'https://your-app.vercel.app'}/run</code>
                </p>
              </div>

              <div className="card" style={{ background: 'var(--bg)', padding: 12, marginBottom: 16 }}>
                <p className="small" style={{ margin: 0, marginBottom: 8 }}>
                  <b>Required Endpoints:</b>
                </p>
                <pre className="small" style={{ margin: 0, whiteSpace: 'pre-wrap' }}>
{`GET  /manifest
→ { name, inputs, permissions, run: {url, method} }

POST /run
← { inputs, tokens }
→ { outputs, trace? }`}
                </pre>
              </div>

              <p className="small">
                <Link href="/docs/remote-adapter" style={{ color: 'var(--brand)' }}>View adapter specification →</Link>
              </p>
            </div>

            <div className="card" style={{ marginBottom: 16 }}>
              <h3 style={{ marginTop: 0 }}>Demo & Discovery</h3>

              <div style={{ marginBottom: 16 }}>
                <label className="label">Demo Video (5-15s) *</label>
                <input
                  type="file"
                  className="input"
                  accept="video/*"
                  onChange={(e) => setDemoVideo(e.target.files[0])}
                  required
                />
                <p className="small" style={{ marginTop: 4 }}>
                  Upload a short video showing the "aha" moment of your app
                </p>
              </div>

              <div style={{ marginBottom: 16 }}>
                <label className="label">Tags</label>
                <input
                  type="text"
                  className="input"
                  placeholder="productivity, ai, automation (comma-separated)"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                />
              </div>

              <div>
                <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={isMobile}
                    onChange={(e) => setIsMobile(e.target.checked)}
                    style={{ marginRight: 8 }}
                  />
                  <span>Mobile-ready (renders well on mobile devices)</span>
                </label>
              </div>
            </div>

            <button type="submit" className="btn primary" style={{ width: '100%', padding: '14px', fontSize: 16 }}>
              Connect & Publish →
            </button>
          </form>
        </div>
      )}

      {/* GitHub Form Step */}
      {step === 'github-form' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
            <h1 style={{ margin: 0 }}>Connect GitHub Repository</h1>
            <button onClick={() => setStep('choose-mode')} className="btn ghost">
              ← Back
            </button>
          </div>

          <form onSubmit={handleAnalyzeGitHub}>
            <div className="card" style={{ marginBottom: 16 }}>
              <h3 style={{ marginTop: 0 }}>GitHub Repository URL</h3>
              <p className="small" style={{ marginBottom: 16 }}>
                Paste your GitHub repository URL. We'll analyze the code and automatically generate an adapter for Clipcade.
              </p>

              <div style={{ marginBottom: 16 }}>
                <label className="label">Repository URL *</label>
                <input
                  type="url"
                  className="input"
                  placeholder="https://github.com/username/repo"
                  value={githubUrl}
                  onChange={(e) => setGithubUrl(e.target.value)}
                  required
                />
                <p className="small" style={{ marginTop: 4 }}>
                  Must be a public repository or one you have access to
                </p>
              </div>

              {analysisError && (
                <div style={{
                  padding: 16,
                  background: '#ef444422',
                  border: '1px solid #ef4444',
                  borderRadius: 8,
                  marginBottom: 16
                }}>
                  <div style={{ fontWeight: 'bold', marginBottom: 4, color: '#ef4444' }}>Analysis Failed</div>
                  <div className="small">{analysisError}</div>
                </div>
              )}

              {!analysisResult && (
                <div className="card" style={{ background: 'var(--bg)', padding: 16 }}>
                  <div style={{ fontWeight: 'bold', marginBottom: 8 }}>What happens next?</div>
                  <ul className="small" style={{ marginLeft: 20, marginBottom: 0 }}>
                    <li>We clone and analyze your repository</li>
                    <li>AI generates a custom Clipcade adapter</li>
                    <li>Quality checks ensure it works correctly</li>
                    <li>We verify rendering on mobile and desktop</li>
                    <li>The adapter is deployed automatically</li>
                  </ul>
                </div>
              )}
            </div>

            {!analysisResult ? (
              <button type="submit" className="btn primary" style={{ width: '100%', padding: '14px', fontSize: 16 }}>
                Analyze Repository →
              </button>
            ) : (
              <div>
                <div className="card" style={{ marginBottom: 16, background: '#10b98122', border: '1px solid #10b981' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                    <span style={{ fontSize: 32 }}>✅</span>
                    <div>
                      <div style={{ fontWeight: 'bold', color: '#10b981' }}>Analysis Complete!</div>
                      <div className="small">Your app is ready to publish</div>
                    </div>
                  </div>

                  <div style={{ marginBottom: 12 }}>
                    <div style={{ fontWeight: 'bold', marginBottom: 8 }}>Detected:</div>
                    <div className="small" style={{ marginBottom: 4 }}>
                      <b>Name:</b> {analysisResult.name}
                    </div>
                    <div className="small" style={{ marginBottom: 4 }}>
                      <b>Description:</b> {analysisResult.description}
                    </div>
                    <div className="small" style={{ marginBottom: 4 }}>
                      <b>Tech Stack:</b> {analysisResult.techStack?.join(', ')}
                    </div>
                  </div>

                  <div style={{ marginBottom: 12 }}>
                    <div style={{ fontWeight: 'bold', marginBottom: 8 }}>Quality Checks:</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      {analysisResult.qualityChecks?.map((check, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span>{check.passed ? '✅' : '⚠️'}</span>
                          <span className="small">{check.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <div style={{ fontWeight: 'bold', marginBottom: 8 }}>Generated Adapter:</div>
                    <pre style={{
                      background: 'var(--bg)',
                      padding: 12,
                      borderRadius: 8,
                      fontSize: 12,
                      fontFamily: 'monospace',
                      overflow: 'auto',
                      maxHeight: 200
                    }}>
                      {JSON.stringify(analysisResult.manifest, null, 2)}
                    </pre>
                  </div>
                </div>

                <div className="card" style={{ marginBottom: 16 }}>
                  <h3 style={{ marginTop: 0 }}>Demo & Discovery</h3>

                  <div style={{ marginBottom: 16 }}>
                    <label className="label">Demo Video (5-15s) *</label>
                    <input
                      type="file"
                      className="input"
                      accept="video/*"
                      onChange={(e) => setDemoVideo(e.target.files[0])}
                      required
                    />
                  </div>

                  <div style={{ marginBottom: 16 }}>
                    <label className="label">Tags</label>
                    <input
                      type="text"
                      className="input"
                      placeholder="productivity, ai, automation (comma-separated)"
                      value={tags}
                      onChange={(e) => setTags(e.target.value)}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={isMobile}
                        onChange={(e) => setIsMobile(e.target.checked)}
                        style={{ marginRight: 8 }}
                      />
                      <span>Mobile-ready</span>
                    </label>
                  </div>
                </div>

                <button onClick={handleSubmitGitHub} type="button" className="btn primary" style={{ width: '100%', padding: '14px', fontSize: 16 }}>
                  Publish App →
                </button>
              </div>
            )}
          </form>
        </div>
      )}

      {/* Analyzing Step */}
      {step === 'analyzing' && (
        <div style={{ textAlign: 'center', padding: '80px 20px' }}>
          <div style={{ fontSize: 64, marginBottom: 24, animation: 'spin 2s linear infinite' }}>⚙️</div>
          <h1 style={{ marginBottom: 16 }}>Analyzing Your Repository...</h1>
          <p className="small" style={{ marginBottom: 32, maxWidth: 500, margin: '0 auto 32px' }}>
            Our AI is analyzing your code, generating an adapter, and running quality checks. This usually takes 30-60 seconds.
          </p>

          <div className="card" style={{ maxWidth: 500, margin: '0 auto', textAlign: 'left' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'var(--brand)' }} />
                <div>Cloning repository...</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 24, height: 24, borderRadius: '50%', border: '2px solid var(--brand)' }} />
                <div className="small" style={{ color: 'var(--muted)' }}>Analyzing code structure...</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 24, height: 24, borderRadius: '50%', border: '2px solid #333' }} />
                <div className="small" style={{ color: 'var(--muted)' }}>Generating adapter...</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 24, height: 24, borderRadius: '50%', border: '2px solid #333' }} />
                <div className="small" style={{ color: 'var(--muted)' }}>Running quality checks...</div>
              </div>
            </div>
          </div>

          <style jsx>{`
            @keyframes spin {
              from { transform: rotate(0deg); }
              to { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      )}

      {/* Success Step */}
      {step === 'success' && (
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <div style={{ fontSize: 64, marginBottom: 16 }}>🎉</div>
          <h1 style={{ marginBottom: 16 }}>App Published!</h1>
          <p className="small" style={{ marginBottom: 32, maxWidth: 500, margin: '0 auto 32px' }}>
            Your app is now live in the feed. People can watch, try, use, and remix it.
          </p>

          {createdApp && (
            <div className="card" style={{ margin: '0 auto 24px', maxWidth: 600, textAlign: 'left' }}>
              <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                <div
                  style={{
                    width: 96,
                    height: 96,
                    borderRadius: 12,
                    background: createdApp.preview_type === 'image'
                      ? `url(${createdApp.preview_url}) center/cover no-repeat`
                      : (createdApp.preview_gradient || 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'),
                    border: '1px solid #333',
                    flexShrink: 0
                  }}
                />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 6 }}>{createdApp.name}</div>
                  <div className="small" style={{ color: '#888', marginBottom: 12 }}>{createdApp.description}</div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <Link href={`/app/${createdApp.id}`} className="btn primary">Try Now →</Link>
                    <Link href={`/app/${createdApp.id}`} className="btn">Remix</Link>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/feed" className="btn primary">
              View in Feed →
            </Link>
            <Link href="/profile" className="btn">
              Go to Profile
            </Link>
            <button onClick={() => {
              setStep('choose-mode');
              setAppName('');
              setAppDescription('');
              setManifestJson('');
              setDemoVideo(null);
              setTags('');
              setIsMobile(false);
              setRemoteUrl('');
              setAiPrompt('');
              setCreatedApp(null);
            }} className="btn ghost">
              Publish Another
            </button>
          </div>

          <div className="card" style={{ marginTop: 40, textAlign: 'left', maxWidth: 600, margin: '40px auto 0' }}>
            <h3 style={{ marginTop: 0 }}>What's Next?</h3>
            <ul className="small" style={{ marginLeft: 20 }}>
              <li>Monitor your app's performance in <Link href="/profile?tab=analytics" style={{ color: 'var(--brand)' }}>Analytics</Link></li>
              <li>Share your app link on social media</li>
              <li>Watch for remixes and see who's using it</li>
              <li>Update your app anytime from your profile</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
