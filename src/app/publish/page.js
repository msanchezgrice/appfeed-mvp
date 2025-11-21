'use client';
import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { analytics, trackEvent } from '@/src/lib/analytics';
import { AI_TOOL_OPTIONS, DEFAULT_AI_TOOLS } from '@/src/lib/publish-tools';

const MODEL_OPTIONS = [
  { value: '', label: 'Auto (Claude Sonnet 4.5 + fallbacks)' },
  { value: 'claude-sonnet-4-5-20250929', label: 'Claude Sonnet 4.5 (Latest)' },
  { value: 'claude-3-5-sonnet-latest', label: 'Claude 3.5 Sonnet (Latest)' },
  { value: 'claude-3-5-haiku-latest', label: 'Claude 3.5 Haiku (Faster)' }
];

export default function PublishPage() {
  const { user, isLoaded, isSignedIn } = useUser();
  const router = useRouter();
  const [step, setStep] = useState('choose-mode'); // choose-mode, inline-form, remote-form, github-form, analyzing, success, remote-url-form, html-bundle-form, ai-form, ai-preview, generating
  const [mode, setMode] = useState(null); // 'inline', 'remote', 'github', 'remote-url', 'html-bundle'
  // New AI mode states: ai-form, generating

  // Form states for inline app
  const [appName, setAppName] = useState('');
  const [appDescription, setAppDescription] = useState('');
  const [manifestJson, setManifestJson] = useState('');
  const [demoVideo, setDemoVideo] = useState(null);
  const [tags, setTags] = useState('');
  const [isMobile, setIsMobile] = useState(false);
  const [selectedTools, setSelectedTools] = useState(DEFAULT_AI_TOOLS);
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);
  const [llmPromptTemplate, setLlmPromptTemplate] = useState('');
  const [imagePromptTemplate, setImagePromptTemplate] = useState('');
  const [anthropicModel, setAnthropicModel] = useState('');
  const [currentManifest, setCurrentManifest] = useState(null);
  const [manifestJsonDraft, setManifestJsonDraft] = useState('');
  const [jsonDraftError, setJsonDraftError] = useState('');
  const [showJsonEditor, setShowJsonEditor] = useState(false);
  const [refineNotes, setRefineNotes] = useState('');
  const [isRefining, setIsRefining] = useState(false);
  const [refineSuccess, setRefineSuccess] = useState(false);
  const [refineError, setRefineError] = useState('');
  const [generationError, setGenerationError] = useState('');
  const [lastPrompt, setLastPrompt] = useState('');
  const [isPublishing, setIsPublishing] = useState(false);
  const manifestInputs = Object.entries(currentManifest?.inputs || {});
  const manifestOutputs = Object.entries(currentManifest?.outputs || {});
  const manifestSteps = currentManifest?.runtime?.steps || [];

  // Form states for AI app
  const [aiPrompt, setAiPrompt] = useState('');
  const [createdApp, setCreatedApp] = useState(null);
  
  // Form states for URL scraper
  const [scrapeUrl, setScrapeUrl] = useState('');
  const [scrapeImage, setScrapeImage] = useState(null);
  const [scrapeImagePreview, setScrapeImagePreview] = useState(null);
  const [scraping, setScraping] = useState(false);
  const [scrapeError, setScrapeError] = useState(null);
  const [scrapeSuccess, setScrapeSuccess] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  // Form states for remote app
  const [remoteUrl, setRemoteUrl] = useState('');

  // Form states for GitHub auto-integration
  const [githubUrl, setGithubUrl] = useState('');
  const [analysisResult, setAnalysisResult] = useState(null);
  const [analysisError, setAnalysisError] = useState(null);

  // Form states for remote URL
  const [externalUrl, setExternalUrl] = useState('');
  const [autoImporting, setAutoImporting] = useState(false);
  const [autoImportError, setAutoImportError] = useState(null);
  
  // Form states for HTML bundle
  const [htmlContent, setHtmlContent] = useState('');
  const [htmlFile, setHtmlFile] = useState(null);

  const toggleToolSelection = (toolId) => {
    setSelectedTools((prev) => {
      if (prev.includes(toolId)) {
        if (prev.length === 1) return prev; // Keep at least one tool selected
        return prev.filter((id) => id !== toolId);
      }
      return [...prev, toolId];
    });
  };

  const moveTool = (toolId, direction) => {
    setSelectedTools((prev) => {
      const index = prev.indexOf(toolId);
      if (index === -1) return prev;
      const newIndex = index + direction;
      if (newIndex < 0 || newIndex >= prev.length) return prev;
      const next = [...prev];
      const [item] = next.splice(index, 1);
      next.splice(newIndex, 0, item);
      return next;
    });
  };

  const resetAiPreviewState = () => {
    setCurrentManifest(null);
    setManifestJsonDraft('');
    setShowJsonEditor(false);
    setRefineNotes('');
    setRefineSuccess(false);
    setRefineError('');
    setGenerationError('');
    setLastPrompt('');
  };

  useEffect(() => {
    // Redirect to sign-in if not authenticated
    if (isLoaded && !isSignedIn) {
      // Track anonymous user blocked from publishing
      analytics.anonymousUserBlocked('publish', null, null);
      analytics.signupPrompted('publish');
      router.push('/sign-in?redirect_url=/publish');
    }
  }, [isLoaded, isSignedIn, router]);

  const handleChooseMode = (selectedMode) => {
    setMode(selectedMode);
    
    // Track publish mode selection
    analytics.publishModeSelected(selectedMode);
    
    if (selectedMode === 'inline') {
      setStep('inline-form');
    } else if (selectedMode === 'remote') {
      setStep('remote-form');
    } else if (selectedMode === 'github') {
      setStep('github-form');
    } else if (selectedMode === 'ai') {
      resetAiPreviewState();
      setStep('ai-form');
    } else if (selectedMode === 'remote-url') {
      setStep('remote-url-form');
    } else if (selectedMode === 'html-bundle') {
      setStep('html-bundle-form');
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
      
      // Track app published event
      if (result.app) {
        analytics.appPublished(
          result.app.id,
          result.app.name,
          tags?.split(',').map(t => t.trim()).filter(Boolean) || [],
          false // inline mode
        );
      }
      
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
      
      // Track app published event
      if (result.app) {
        analytics.appPublished(
          result.app.id,
          result.app.name,
          tags?.split(',').map(t => t.trim()).filter(Boolean) || [],
          false // remote mode
        );
      }
      
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
      
      // Track app published event
      if (result.app) {
        analytics.appPublished(
          result.app.id,
          result.app.name,
          tags?.split(',').map(t => t.trim()).filter(Boolean) || [],
          false // github mode
        );
      }
      
      setStep('success');
    } catch (error) {
      alert('Error publishing app: ' + error.message);
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      processImageFile(file);
    }
  };

  const processImageFile = (file) => {
    // Validate file type
    if (!file.type.startsWith('image/')) {
      setScrapeError('Please upload an image file');
      return;
    }
    
    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setScrapeImagePreview(reader.result);
      setScrapeImage(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    const files = e.dataTransfer?.files;
    if (files && files.length > 0) {
      processImageFile(files[0]);
    }
  };

  const handleScrapeUrl = async (e) => {
    e.preventDefault();
    
    // Check if user provided either URL or image
    if (!scrapeUrl && !scrapeImage) {
      setScrapeError('Please provide either a URL or upload an image');
      return;
    }
    
    setScraping(true);
    setScrapeError(null);
    setScrapeSuccess(false);
    
    try {
      const response = await fetch('/api/scrape-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ 
          url: scrapeUrl || null,
          image: scrapeImage || null
        })
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to analyze content');
      }
      
      // Auto-fill the prompt with the extracted data
      const data = result.data;
      setAiPrompt(data.suggestedPrompt || '');
      
      // If tags were provided by scraper and user hasn't set any, use them
      if (data.tags && data.tags.length > 0 && !tags) {
        setTags(data.tags.join(', '));
      }
      
      setScrapeSuccess(true);
      setTimeout(() => setScrapeSuccess(false), 3000);
    } catch (error) {
      setScrapeError(error.message);
    } finally {
      setScraping(false);
    }
  };

  const handleSubmitAI = async (e) => {
    e.preventDefault();
    if (selectedTools.length === 0) {
      alert('Select at least one tool to continue.');
      return;
    }
    setGenerationError('');
    setStep('generating');
    try {
      const response = await fetch('/api/apps/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          prompt: aiPrompt,
          tools: selectedTools,
          toolOrder: selectedTools,
          promptTemplates: {
            llmPrompt: llmPromptTemplate,
            imageInstruction: imagePromptTemplate
          },
          model: anthropicModel || undefined
        })
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || 'Failed to generate manifest');
      }
      setCurrentManifest(result.manifest || null);
      setManifestJsonDraft(JSON.stringify(result.manifest || {}, null, 2));
      setShowJsonEditor(false);
      setRefineNotes('');
      setRefineSuccess(false);
      setRefineError('');
      setLastPrompt(aiPrompt);
      setStep('ai-preview');
    } catch (error) {
      setGenerationError(error.message);
      setStep('ai-form');
    }
  };

  const handlePublishGenerated = async () => {
    if (!currentManifest) return;
    setIsPublishing(true);
    try {
      const response = await fetch('/api/apps/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          mode: 'ai',
          appData: {
            manifest: currentManifest,
            prompt: lastPrompt || aiPrompt,
            tags,
            isMobile,
            tools: selectedTools,
            toolOrder: selectedTools,
            promptTemplates: {
              llmPrompt: llmPromptTemplate,
              imageInstruction: imagePromptTemplate
            },
            model: anthropicModel || undefined
          }
        })
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || 'Failed to publish');
      }
      setCreatedApp(result.app || null);
      if (result.app) {
        analytics.appPublished(
          result.app.id,
          result.app.name,
          tags?.split(',').map(t => t.trim()).filter(Boolean) || [],
          true
        );
      }
      setStep('success');
    } catch (error) {
      alert('Error publishing app: ' + error.message);
    } finally {
      setIsPublishing(false);
    }
  };

  const handleApplyJsonDraft = () => {
    try {
      const parsed = JSON.parse(manifestJsonDraft || '{}');
      setCurrentManifest(parsed);
      setJsonDraftError('');
      setRefineSuccess(false);
      setRefineError('');
    } catch (error) {
      setJsonDraftError(`Invalid JSON: ${error.message}`);
    }
  };

  const handleRefineManifest = async () => {
    if (!currentManifest) return;
    if (!refineNotes.trim()) {
      setRefineError('Describe what you want to change.');
      return;
    }
    setIsRefining(true);
    setRefineError('');
    setRefineSuccess(false);
    try {
      const response = await fetch('/api/apps/generate/refine', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          manifest: currentManifest,
          instructions: refineNotes,
          tools: selectedTools,
          toolOrder: selectedTools,
          promptTemplates: {
            llmPrompt: llmPromptTemplate,
            imageInstruction: imagePromptTemplate
          },
          model: anthropicModel || undefined
        })
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || 'Failed to refine manifest');
      }
      setCurrentManifest(result.manifest || null);
      setManifestJsonDraft(JSON.stringify(result.manifest || {}, null, 2));
      setRefineNotes('');
      setRefineSuccess(true);
      setTimeout(() => setRefineSuccess(false), 2500);
    } catch (error) {
      setRefineError(error.message);
    } finally {
      setIsRefining(false);
    }
  };

  const handleAutoImport = async (url) => {
    if (!url || !url.startsWith('http')) return;
    
    setAutoImporting(true);
    setAutoImportError(null);
    
    try {
      const response = await fetch('/api/scrape-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ url })
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to import from URL');
      }
      
      // Auto-fill fields from scraped data
      const data = result.data;
      if (data.name && !appName) {
        setAppName(data.name);
      }
      if (data.description && !appDescription) {
        setAppDescription(data.description);
      }
      if (data.tags && data.tags.length > 0 && !tags) {
        setTags(data.tags.join(', '));
      }
      
    } catch (error) {
      setAutoImportError(error.message);
    } finally {
      setAutoImporting(false);
    }
  };

  const handleSubmitRemoteUrl = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch('/api/apps/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          mode: 'remote-url',
          appData: {
            name: appName,
            description: appDescription,
            externalUrl,
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
      
      // Track app published event with remote-url mode
      if (result.app) {
        trackEvent('app_published', {
          app_id: result.app.id,
          app_name: result.app.name,
          tags: tags?.split(',').map(t => t.trim()).filter(Boolean) || [],
          mode: 'remote-url',
          external_url: externalUrl
        });
      }
      
      setStep('success');
    } catch (error) {
      alert('Error publishing app: ' + error.message);
    }
  };

  const handleSubmitHtmlBundle = async (e) => {
    e.preventDefault();

    // Read HTML file if provided, otherwise use textarea content
    let finalHtml = htmlContent;
    if (htmlFile) {
      try {
        const reader = new FileReader();
        finalHtml = await new Promise((resolve, reject) => {
          reader.onload = (e) => resolve(e.target.result);
          reader.onerror = reject;
          reader.readAsText(htmlFile);
        });
      } catch (err) {
        alert('Error reading HTML file: ' + err.message);
        return;
      }
    }

    if (!finalHtml || finalHtml.trim().length === 0) {
      alert('Please provide HTML content');
      return;
    }

    // Check size limit (5MB)
    const sizeInMB = new Blob([finalHtml]).size / (1024 * 1024);
    if (sizeInMB > 5) {
      alert(`HTML file is too large (${sizeInMB.toFixed(2)}MB). Maximum size is 5MB.`);
      return;
    }

    try {
      const response = await fetch('/api/apps/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          mode: 'html-bundle',
          appData: {
            name: appName,
            description: appDescription,
            htmlContent: finalHtml,
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
      
      // Track app published event with html-bundle mode
      if (result.app) {
        trackEvent('app_published', {
          app_id: result.app.id,
          app_name: result.app.name,
          tags: tags?.split(',').map(t => t.trim()).filter(Boolean) || [],
          mode: 'html-bundle',
          html_size_kb: Math.round(new Blob([finalHtml]).size / 1024)
        });
      }
      
      setStep('success');
    } catch (error) {
      alert('Error publishing app: ' + error.message);
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
                Describe your idea and we'll generate a complete app automatically using Sonnet.
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

            {/* Remote URL Option (Google AI Studio, etc.) */}
            <div className="card" style={{ padding: 32, border: '2px solid #10b981' }}>
              <div style={{
                position: 'absolute',
                top: -12,
                right: 20,
                background: '#10b981',
                color: '#000',
                padding: '4px 12px',
                borderRadius: 12,
                fontSize: 12,
                fontWeight: 'bold'
              }}>
                ✨ New
              </div>
              <h2 style={{ marginTop: 0, marginBottom: 12 }}>Deploy from URL</h2>
              <p className="small" style={{ marginBottom: 20 }}>
                Share apps deployed to Cloud Run, Vercel, Replit, or any public URL. Perfect for Google AI Studio apps!
              </p>

              <div style={{ marginBottom: 20 }}>
                <div style={{ fontWeight: 'bold', marginBottom: 8, color: 'var(--brand2)' }}>Best for:</div>
                <ul className="small" style={{ marginLeft: 20, marginBottom: 0 }}>
                  <li>Google AI Studio apps</li>
                  <li>Cloud Run deployments</li>
                  <li>External hosted games</li>
                  <li>Zero hosting cost (you pay)</li>
                </ul>
              </div>

              <button
                onClick={() => handleChooseMode('remote-url')}
                className="btn primary"
                style={{ width: '100%' }}
              >
                Deploy from URL →
              </button>
            </div>

            {/* HTML Bundle Option */}
            <div className="card" style={{ padding: 32, border: '2px solid #f59e0b' }}>
              <div style={{
                position: 'absolute',
                top: -12,
                right: 20,
                background: '#f59e0b',
                color: '#000',
                padding: '4px 12px',
                borderRadius: 12,
                fontSize: 12,
                fontWeight: 'bold'
              }}>
                ✨ New
              </div>
              <h2 style={{ marginTop: 0, marginBottom: 12 }}>HTML Bundle</h2>
              <p className="small" style={{ marginBottom: 20 }}>
                Upload a complete single-file HTML app. We host it for you (100 runs/app limit).
              </p>

              <div style={{ marginBottom: 20 }}>
                <div style={{ fontWeight: 'bold', marginBottom: 8, color: 'var(--brand2)' }}>Best for:</div>
                <ul className="small" style={{ marginLeft: 20, marginBottom: 0 }}>
                  <li>Single-file games</li>
                  <li>Interactive demos</li>
                  <li>Standalone tools</li>
                  <li>We handle hosting</li>
                </ul>
              </div>

              <button
                onClick={() => handleChooseMode('html-bundle')}
                className="btn primary"
                style={{ width: '100%' }}
              >
                Upload HTML →
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

          {/* URL Scraper Section */}
          <div className="card" style={{ marginBottom: 16, background: 'linear-gradient(135deg, #667eea22 0%, #764ba222 100%)', border: '1px solid #667eea44' }}>
            <h3 style={{ marginTop: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
              🔗 Auto-Generate from URL or Image (Optional)
            </h3>
            <p className="small" style={{ marginBottom: 16, color: '#aaa' }}>
              Paste a URL or upload a screenshot to auto-generate a prompt from an existing app
            </p>
            
            <form onSubmit={handleScrapeUrl}>
              <div style={{ marginBottom: 12 }}>
                <label className="label" style={{ marginBottom: 8 }}>URL</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input
                    type="url"
                    className="input"
                    placeholder="https://glif.app/@user/glifs/..."
                    value={scrapeUrl}
                    onChange={(e) => setScrapeUrl(e.target.value)}
                    disabled={scraping}
                    style={{ flex: 1 }}
                  />
                </div>
              </div>
              
              <div style={{ marginBottom: 12 }}>
                <label className="label" style={{ marginBottom: 8 }}>Or Upload Screenshot</label>
                
                {!scrapeImagePreview ? (
                  <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    style={{
                      border: isDragging ? '2px dashed var(--brand)' : '2px dashed #333',
                      borderRadius: 8,
                      padding: 32,
                      textAlign: 'center',
                      cursor: 'pointer',
                      background: isDragging ? 'rgba(102, 126, 234, 0.1)' : 'var(--bg)',
                      transition: 'all 0.2s ease',
                      position: 'relative'
                    }}
                    onClick={() => document.getElementById('image-upload-input')?.click()}
                  >
                    <div style={{ fontSize: 48, marginBottom: 12 }}>
                      {isDragging ? '📥' : '🖼️'}
                    </div>
                    <div style={{ marginBottom: 8, color: isDragging ? 'var(--brand)' : '#fff' }}>
                      {isDragging ? 'Drop image here' : 'Drag & drop an image'}
                    </div>
                    <div className="small" style={{ color: '#888' }}>
                      or click to browse
                    </div>
                    <input
                      id="image-upload-input"
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      disabled={scraping}
                      style={{ display: 'none' }}
                    />
                  </div>
                ) : (
                  <div style={{ position: 'relative' }}>
                    <img 
                      src={scrapeImagePreview} 
                      alt="Preview" 
                      style={{ 
                        maxWidth: '100%', 
                        maxHeight: 200, 
                        borderRadius: 8,
                        border: '1px solid #333',
                        display: 'block'
                      }} 
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setScrapeImage(null);
                        setScrapeImagePreview(null);
                      }}
                      style={{
                        position: 'absolute',
                        top: 8,
                        right: 8,
                        background: '#ef4444',
                        color: 'white',
                        border: 'none',
                        borderRadius: 4,
                        padding: '4px 8px',
                        cursor: 'pointer',
                        fontSize: 12,
                        fontWeight: 'bold'
                      }}
                    >
                      ✕ Remove
                    </button>
                  </div>
                )}
              </div>
              
              <button 
                type="submit" 
                className="btn primary" 
                disabled={scraping || (!scrapeUrl && !scrapeImage)}
                style={{ width: '100%' }}
              >
                {scraping ? 'Analyzing...' : 'Analyze & Generate Prompt →'}
              </button>
            </form>
            
            {scraping && (
              <div style={{ padding: 12, background: 'var(--bg)', borderRadius: 8, marginTop: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{
                    width: 16,
                    height: 16,
                    border: '2px solid var(--brand)',
                    borderTopColor: 'transparent',
                    borderRadius: '50%',
                    animation: 'spin 0.8s linear infinite'
                  }} />
                  <span className="small">📸 Analyzing page with AI...</span>
                </div>
              </div>
            )}
            
            {scrapeError && (
              <div style={{ padding: 12, background: '#ef444422', border: '1px solid #ef4444', borderRadius: 8, marginTop: 8 }}>
                <div className="small" style={{ color: '#ef4444' }}>
                  <strong>Error:</strong> {scrapeError}
                </div>
              </div>
            )}
            
            {scrapeSuccess && (
              <div style={{ padding: 12, background: '#10b98122', border: '1px solid #10b981', borderRadius: 8, marginTop: 8 }}>
                <div className="small" style={{ color: '#10b981' }}>
                  ✅ Successfully scraped! Prompt filled below.
                </div>
              </div>
            )}
            
            <p className="small" style={{ marginTop: 12, marginBottom: 0, color: '#666' }}>
              Example: https://glif.app/@fab1an/glifs/clmqp99820001jn0f2xywz250
            </p>
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
                We'll generate inputs, runtime steps, and design based on your prompt. You can remix later.
              </p>
            </div>

            <div className="card" style={{ marginBottom: 16 }}>
              <h3 style={{ marginTop: 0 }}>Tools & Integrations</h3>
              <p className="small" style={{ marginTop: 0, marginBottom: 16, color: '#888' }}>
                Pick which runtime tools the AI is allowed to use. Toggle on Google Image to force Gemini image generation
                instead of trying to describe it in the prompt.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {AI_TOOL_OPTIONS.map((tool) => {
                  const isSelected = selectedTools.includes(tool.id);
                  return (
                    <button
                      key={tool.id}
                      type="button"
                      onClick={() => toggleToolSelection(tool.id)}
                      style={{
                        textAlign: 'left',
                        borderRadius: 12,
                        border: isSelected ? '1px solid var(--brand)' : '1px solid #2a2a2a',
                        background: isSelected ? 'linear-gradient(135deg, #6366f122 0%, #8b5cf622 100%)' : 'transparent',
                        padding: 16,
                        color: 'inherit',
                        cursor: 'pointer'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                        <div>
                          <div style={{ fontWeight: 600 }}>{tool.label}</div>
                          <div className="small" style={{ color: '#aaa', marginTop: 4 }}>{tool.description}</div>
                        </div>
                        <div
                          style={{
                            borderRadius: 999,
                            padding: '4px 10px',
                            fontSize: 12,
                            fontWeight: 600,
                            background: isSelected ? '#10b98133' : '#2d2d2d',
                            color: isSelected ? '#10b981' : '#aaa',
                            alignSelf: 'flex-start'
                          }}
                        >
                          {isSelected ? 'Selected' : 'Tap to add'}
                        </div>
                      </div>
                      <div className="small" style={{ color: '#777', marginTop: 10 }}>
                        {tool.promptHint}
                      </div>
                    </button>
                  );
                })}
              </div>
              <button
                type="button"
                className="btn ghost"
                style={{ marginTop: 16 }}
                onClick={() => setShowAdvancedSettings((v) => !v)}
              >
                {showAdvancedSettings ? 'Hide Advanced Settings' : 'Show Advanced Settings'}
              </button>
              {showAdvancedSettings && (
                <div style={{ marginTop: 16, background: '#11141b', borderRadius: 12, border: '1px solid #2a2a2a', padding: 16, display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div>
                    <div style={{ fontWeight: 600, marginBottom: 8 }}>Tool Order</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {selectedTools.map((toolId, index) => {
                        const tool = AI_TOOL_OPTIONS.find((opt) => opt.id === toolId);
                        return (
                          <div key={toolId} style={{ background: '#080b12', borderRadius: 8, padding: '8px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid #1f1f1f' }}>
                            <span style={{ fontWeight: 500 }}>{tool?.label || toolId}</span>
                            <div style={{ display: 'flex', gap: 8 }}>
                              <button type="button" className="btn ghost" disabled={index === 0} onClick={() => moveTool(toolId, -1)} style={{ padding: '4px 8px' }}>↑</button>
                              <button type="button" className="btn ghost" disabled={index === selectedTools.length - 1} onClick={() => moveTool(toolId, 1)} style={{ padding: '4px 8px' }}>↓</button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  <div>
                    <label className="label">LLM Prompt Template</label>
                    <textarea
                      className="input"
                      placeholder="Optional: e.g. \"You are a seasoned UX writer... {{original}}\""
                      rows={3}
                      value={llmPromptTemplate}
                      onChange={(e) => setLlmPromptTemplate(e.target.value)}
                    />
                    <p className="small" style={{ color: '#888', marginTop: 4 }}>
                      Use <code>{'{{original}}'}</code> to inject the AI-generated prompt.
                    </p>
                  </div>
                  <div>
                    <label className="label">Image Instruction Template</label>
                    <textarea
                      className="input"
                      placeholder="Optional: e.g. \"Apply cinematic lighting to {{original}}\""
                      rows={3}
                      value={imagePromptTemplate}
                      onChange={(e) => setImagePromptTemplate(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="label">Anthropic Model</label>
                    <select
                      className="input"
                      value={anthropicModel}
                      onChange={(e) => setAnthropicModel(e.target.value)}
                    >
                      {MODEL_OPTIONS.map((option) => (
                        <option key={option.value || 'default'} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}
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

            <button
              type="submit"
              className="btn primary"
              style={{ width: '100%', padding: '14px', fontSize: 16 }}
              disabled={selectedTools.length === 0}
            >
              Generate App →
            </button>
          </form>

          {generationError && (
            <div style={{ padding: 12, background: '#ef444422', border: '1px solid #ef4444', borderRadius: 8, marginTop: 12 }}>
              <div className="small" style={{ color: '#ef4444' }}>
                <strong>Generation failed:</strong> {generationError}
              </div>
            </div>
          )}
          
      <style jsx>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )}

      {step === 'ai-preview' && currentManifest && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h1 style={{ margin: 0 }}>Preview & Refine</h1>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn ghost" onClick={() => setStep('ai-form')}>
                ← Back to Prompt
              </button>
              <button
                className="btn ghost"
                onClick={() => {
                  resetAiPreviewState();
                  setStep('ai-form');
                }}
              >
                Reset
              </button>
            </div>
          </div>
          <p className="small" style={{ marginBottom: 24, color: '#aaa' }}>
            Prompt used: {lastPrompt || '(manual edit)'} • Tools: {selectedTools.join(' → ')}
          </p>
          <div className="card" style={{ marginBottom: 16 }}>
            <h3 style={{ marginTop: 0 }}>{currentManifest.name}</h3>
            <p style={{ marginTop: 4, color: '#aaa' }}>{currentManifest.description}</p>
            {currentManifest.tags?.length ? (
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 12 }}>
                {currentManifest.tags.map((tag) => (
                  <span key={tag} className="badge">#{tag}</span>
                ))}
              </div>
            ) : null}
            <p className="small" style={{ marginTop: 12, color: '#888' }}>
              Preview gradient: {currentManifest.preview_gradient}
            </p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16, marginBottom: 16 }}>
            <div className="card">
              <h3 style={{ marginTop: 0 }}>Inputs</h3>
              {manifestInputs.length === 0 && <p className="small" style={{ color: '#777' }}>No inputs defined</p>}
              {manifestInputs.map(([key, input]) => (
                <div key={key} style={{ marginBottom: 12 }}>
                  <div style={{ fontWeight: 600 }}>{input.label || key} <span style={{ color: '#666', fontWeight: 400 }}>({input.type})</span></div>
                  {input.placeholder && <div className="small" style={{ color: '#888' }}>{input.placeholder}</div>}
                  {input.required && <div className="small" style={{ color: '#10b981' }}>Required</div>}
                </div>
              ))}
            </div>
            <div className="card">
              <h3 style={{ marginTop: 0 }}>Outputs</h3>
              {manifestOutputs.length === 0 && <p className="small" style={{ color: '#777' }}>No outputs defined</p>}
              {manifestOutputs.map(([key, output]) => (
                <div key={key} style={{ marginBottom: 12 }}>
                  <div style={{ fontWeight: 600 }}>{key}</div>
                  <div className="small" style={{ color: '#888' }}>Type: {output.type}</div>
                </div>
              ))}
            </div>
            <div className="card" style={{ gridColumn: '1 / -1' }}>
              <h3 style={{ marginTop: 0 }}>Runtime Steps (in order)</h3>
              {manifestSteps.length === 0 && <p className="small" style={{ color: '#777' }}>No steps defined</p>}
              {manifestSteps.map((step, idx) => (
                <div key={`${step.tool}-${idx}`} style={{ border: '1px solid #222', borderRadius: 8, padding: 12, marginBottom: 12 }}>
                  <div style={{ fontWeight: 600, marginBottom: 4 }}>{idx + 1}. {step.tool}</div>
                  <pre className="small" style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{JSON.stringify(step.args || {}, null, 2)}</pre>
                  <div className="small" style={{ color: '#888', marginTop: 4 }}>Output key: {step.output}</div>
                </div>
              ))}
            </div>
          </div>
          <div className="card" style={{ marginBottom: 16 }}>
            <h3 style={{ marginTop: 0 }}>Refine</h3>
            <p className="small" style={{ color: '#888' }}>
              Describe fixes, bugs, or style tweaks. We'll ask Sonnet 4.5 to patch the manifest.
            </p>
            <textarea
              className="input"
              rows={4}
              placeholder="Example: Make the inputs more playful and add a final llm.complete step that summarizes the output."
              value={refineNotes}
              onChange={(e) => setRefineNotes(e.target.value)}
            />
            {refineError && (
              <div className="small" style={{ color: '#ef4444', marginTop: 8 }}>
                {refineError}
              </div>
            )}
            {refineSuccess && (
              <div className="small" style={{ color: '#10b981', marginTop: 8 }}>
                ✅ Manifest updated
              </div>
            )}
            <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
              <button type="button" className="btn" onClick={handleRefineManifest} disabled={isRefining}>
                {isRefining ? 'Refining...' : 'Apply Refinement'}
              </button>
              <button
                type="button"
                className="btn ghost"
                onClick={() => {
                  setShowJsonEditor((prev) => !prev);
                  setJsonDraftError('');
                  setManifestJsonDraft(JSON.stringify(currentManifest, null, 2));
                }}
              >
                {showJsonEditor ? 'Hide JSON Editor' : 'Open JSON Editor'}
              </button>
            </div>
            {showJsonEditor && (
              <div style={{ marginTop: 12 }}>
                <textarea
                  className="input"
                  rows={10}
                  value={manifestJsonDraft}
                  onChange={(e) => setManifestJsonDraft(e.target.value)}
                  style={{ fontFamily: 'monospace', fontSize: 12 }}
                />
                {jsonDraftError && (
                  <div className="small" style={{ color: '#ef4444', marginTop: 4 }}>
                    {jsonDraftError}
                  </div>
                )}
                <button type="button" className="btn ghost" style={{ marginTop: 8 }} onClick={handleApplyJsonDraft}>
                  Apply JSON Changes
                </button>
              </div>
            )}
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <button
              type="button"
              className="btn primary"
              onClick={handlePublishGenerated}
              disabled={!currentManifest || isPublishing}
              style={{ flex: 1 }}
            >
              {isPublishing ? 'Publishing...' : 'Publish App →'}
            </button>
            <button type="button" className="btn ghost" onClick={() => setStep('ai-form')}>
              Edit Prompt
            </button>
          </div>
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

      {/* Remote URL Form Step */}
      {step === 'remote-url-form' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
            <h1 style={{ margin: 0 }}>Deploy from URL</h1>
            <button onClick={() => setStep('choose-mode')} className="btn ghost">
              ← Back
            </button>
          </div>

          <form onSubmit={handleSubmitRemoteUrl}>
            <div className="card" style={{ marginBottom: 16, background: '#10b98122', border: '1px solid #10b981' }}>
              <h3 style={{ marginTop: 0 }}>Perfect for Google AI Studio!</h3>
              <p className="small" style={{ marginBottom: 12 }}>
                After deploying your AI Studio app to Cloud Run, paste the public URL here. The user pays for hosting (you pay $0).
              </p>
              <p className="small" style={{ marginBottom: 0, opacity: 0.8 }}>
                Example: <code>https://synthwave-space-123.us-west1.run.app</code>
              </p>
            </div>

            <div className="card" style={{ marginBottom: 16 }}>
              <h3 style={{ marginTop: 0 }}>Public URL</h3>

              <div style={{ marginBottom: 16 }}>
                <label className="label">App URL *</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input
                    type="url"
                    className="input"
                    placeholder="https://your-app-123.us-west1.run.app"
                    value={externalUrl}
                    onChange={(e) => setExternalUrl(e.target.value)}
                    required
                    style={{ flex: 1 }}
                  />
                  <button
                    type="button"
                    className="btn primary"
                    onClick={() => handleAutoImport(externalUrl)}
                    disabled={autoImporting || !externalUrl}
                  >
                    {autoImporting ? 'Importing...' : '✨ Auto-Import'}
                  </button>
                </div>
                <p className="small" style={{ marginTop: 4 }}>
                  Paste URL and click Auto-Import to auto-fill details
                </p>
              </div>

              {autoImporting && (
                <div style={{ padding: 12, background: 'var(--bg)', borderRadius: 8, marginBottom: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{
                      width: 16,
                      height: 16,
                      border: '2px solid var(--brand)',
                      borderTopColor: 'transparent',
                      borderRadius: '50%',
                      animation: 'spin 0.8s linear infinite'
                    }} />
                    <span className="small">🔍 Analyzing app...</span>
                  </div>
                </div>
              )}
              
              {autoImportError && (
                <div style={{ padding: 12, background: '#ef444422', border: '1px solid #ef4444', borderRadius: 8, marginBottom: 16 }}>
                  <div className="small" style={{ color: '#ef4444' }}>
                    <strong>Error:</strong> {autoImportError}
                  </div>
                </div>
              )}
            </div>

            <div className="card" style={{ marginBottom: 16 }}>
              <h3 style={{ marginTop: 0 }}>App Details</h3>

              <div style={{ marginBottom: 16 }}>
                <label className="label">App Name *</label>
                <input
                  type="text"
                  className="input"
                  placeholder="Synthwave Space"
                  value={appName}
                  onChange={(e) => setAppName(e.target.value)}
                  required
                />
              </div>

              <div style={{ marginBottom: 16 }}>
                <label className="label">Description *</label>
                <textarea
                  className="input"
                  placeholder="A retro synthwave space shooter game"
                  value={appDescription}
                  onChange={(e) => setAppDescription(e.target.value)}
                  rows={3}
                  required
                />
              </div>
            </div>

            <div className="card" style={{ marginBottom: 16 }}>
              <h3 style={{ marginTop: 0 }}>Discovery</h3>

              <div style={{ marginBottom: 16 }}>
                <label className="label">Tags</label>
                <input
                  type="text"
                  className="input"
                  placeholder="game, synthwave, arcade (comma-separated)"
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

      {/* HTML Bundle Form Step */}
      {step === 'html-bundle-form' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
            <h1 style={{ margin: 0 }}>Upload HTML Bundle</h1>
            <button onClick={() => setStep('choose-mode')} className="btn ghost">
              ← Back
            </button>
          </div>

          <form onSubmit={handleSubmitHtmlBundle}>
            <div className="card" style={{ marginBottom: 16, background: '#f59e0b22', border: '1px solid #f59e0b' }}>
              <h3 style={{ marginTop: 0 }}>⚠️ Usage Limits</h3>
              <p className="small" style={{ marginBottom: 8 }}>
                We host HTML bundles for you, but there's a <strong>100 runs per app limit</strong> to control bandwidth costs.
              </p>
              <p className="small" style={{ marginBottom: 0, opacity: 0.8 }}>
                For unlimited usage, use "Deploy from URL" instead and host it yourself on Cloud Run (costs ~$1-5/month).
              </p>
            </div>

            <div className="card" style={{ marginBottom: 16 }}>
              <h3 style={{ marginTop: 0 }}>App Details</h3>

              <div style={{ marginBottom: 16 }}>
                <label className="label">App Name *</label>
                <input
                  type="text"
                  className="input"
                  placeholder="My HTML Game"
                  value={appName}
                  onChange={(e) => setAppName(e.target.value)}
                  required
                />
              </div>

              <div style={{ marginBottom: 16 }}>
                <label className="label">Description *</label>
                <textarea
                  className="input"
                  placeholder="A fun interactive HTML game"
                  value={appDescription}
                  onChange={(e) => setAppDescription(e.target.value)}
                  rows={3}
                  required
                />
              </div>
            </div>

            <div className="card" style={{ marginBottom: 16 }}>
              <h3 style={{ marginTop: 0 }}>HTML Content</h3>

              <div style={{ marginBottom: 16 }}>
                <label className="label">Upload HTML File (max 5MB) *</label>
                <input
                  type="file"
                  className="input"
                  accept=".html,.htm"
                  onChange={(e) => setHtmlFile(e.target.files[0])}
                />
                <p className="small" style={{ marginTop: 4 }}>
                  Upload a single HTML file (with inline CSS/JS)
                </p>
              </div>

              <div style={{ marginBottom: 0 }}>
                <label className="label">Or Paste HTML *</label>
                <textarea
                  className="input"
                  placeholder="<!DOCTYPE html><html>...</html>"
                  value={htmlContent}
                  onChange={(e) => setHtmlContent(e.target.value)}
                  rows={12}
                  style={{ fontFamily: 'monospace', fontSize: 13 }}
                />
                <p className="small" style={{ marginTop: 4 }}>
                  Paste your complete HTML file here (must be self-contained)
                </p>
              </div>
            </div>

            <div className="card" style={{ marginBottom: 16 }}>
              <h3 style={{ marginTop: 0 }}>Discovery</h3>

              <div style={{ marginBottom: 16 }}>
                <label className="label">Tags</label>
                <input
                  type="text"
                  className="input"
                  placeholder="game, html, interactive (comma-separated)"
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

            <button type="submit" className="btn primary" style={{ width: '100%', padding: '14px', fontSize: 16 }}>
              Upload & Publish →
            </button>
          </form>
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
