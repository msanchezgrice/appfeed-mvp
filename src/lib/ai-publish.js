import { getDecryptedSecret } from '@/src/lib/secrets';
import { AI_TOOL_MAP, DEFAULT_AI_TOOLS } from '@/src/lib/publish-tools';

export const DEFAULT_PROMPT_TEMPLATES = {
  llmPrompt: '',
  imageInstruction: ''
};

const DEFAULT_MODEL = process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-5-20250929';
const MODEL_FALLBACKS = [
  process.env.ANTHROPIC_MODEL_FALLBACK || 'claude-3-5-sonnet-latest',
  'claude-sonnet-4-5'
];

function safeString(value, defaultValue = '') {
  return typeof value === 'string' && value.trim() ? value.trim() : defaultValue;
}

function safeArray(value) {
  return Array.isArray(value) ? value.filter((x) => typeof x === 'string' && x.trim()).map((x) => x.trim()) : [];
}

function safeObject(value) {
  return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
}

function normalizePromptTemplates(promptTemplates = {}) {
  return {
    llmPrompt: safeString(promptTemplates.llmPrompt, DEFAULT_PROMPT_TEMPLATES.llmPrompt),
    imageInstruction: safeString(promptTemplates.imageInstruction, DEFAULT_PROMPT_TEMPLATES.imageInstruction)
  };
}

function applyTemplate(template, original) {
  if (!template) return original;
  if (template.includes('{{original}}')) {
    return template.replace('{{original}}', original || '');
  }
  if (!original) return template;
  return `${template}\n\n${original}`.trim();
}

export function sanitizeManifest(raw, options = {}) {
  const {
    allowedTools = DEFAULT_AI_TOOLS,
    toolOrder = [],
    promptTemplates = DEFAULT_PROMPT_TEMPLATES
  } = options;

  const manifest = typeof raw === 'object' && raw ? raw : {};
  const normalizedTemplates = normalizePromptTemplates(promptTemplates);

  const allowedToolList = (Array.isArray(allowedTools) && allowedTools.length ? allowedTools : DEFAULT_AI_TOOLS)
    .filter((tool) => AI_TOOL_MAP[tool]);
  if (!allowedToolList.length) {
    allowedToolList.push(DEFAULT_AI_TOOLS[0] || 'llm.complete');
  }
  const allowedToolSet = new Set(allowedToolList);

  const normalizedOrder = (Array.isArray(toolOrder) && toolOrder.length ? toolOrder : allowedToolList)
    .filter((tool) => allowedToolSet.has(tool));

  const outputs = safeObject(manifest.outputs);
  const demo = safeObject(manifest.demo);
  if (!demo.sampleInputs || typeof demo.sampleInputs !== 'object') {
    demo.sampleInputs = {};
  }
  const design = safeObject(manifest.design);
  if (!design.containerColor) {
    design.containerColor = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
  }
  if (!design.fontColor) design.fontColor = 'white';
  if (!design.fontFamily) design.fontFamily = 'inherit';
  if (!design.inputLayout) design.inputLayout = 'vertical';

  const runtime = safeObject(manifest.runtime);
  if (!runtime.engine) runtime.engine = 'local';
  if (!Array.isArray(runtime.steps)) runtime.steps = [];

  runtime.steps = runtime.steps
    .filter((step) => step && allowedToolSet.has(step.tool))
    .map((step, index) => {
      const args = safeObject(step.args);
      const outputKey = safeString(step.output, step.tool === 'image.process' ? `image_${index || 'result'}` : 'result');
      let nextArgs = { ...args };
      if (step.tool === 'llm.complete' && normalizedTemplates.llmPrompt) {
        nextArgs.prompt = applyTemplate(normalizedTemplates.llmPrompt, args.prompt);
      } else if (step.tool === 'image.process' && normalizedTemplates.imageInstruction) {
        nextArgs.instruction = applyTemplate(normalizedTemplates.imageInstruction, args.instruction);
      }
      return {
        tool: step.tool,
        args: nextArgs,
        output: outputKey
      };
    });

  if (!runtime.steps.length) {
    const fallbackTool = normalizedOrder[0] || allowedToolList[0];
    runtime.steps.push({
      tool: fallbackTool,
      args: fallbackTool === 'image.process'
        ? { instruction: normalizedTemplates.imageInstruction || 'Transform the uploaded image or create a new one based on user inputs.' }
        : { prompt: normalizedTemplates.llmPrompt || 'Summarize the provided inputs in a helpful way.' },
      output: fallbackTool === 'image.process' ? 'image' : 'markdown'
    });
  }

  const orderIndex = (tool) => {
    const idx = normalizedOrder.indexOf(tool);
    return idx === -1 ? normalizedOrder.length : idx;
  };

  runtime.steps.sort((a, b) => orderIndex(a.tool) - orderIndex(b.tool));

  const usesImageTool = runtime.steps.some((step) => step.tool === 'image.process');
  const usesTextTool = runtime.steps.some((step) => step.tool !== 'image.process');

  if (usesImageTool && !outputs.image) {
    outputs.image = { type: 'image' };
  }
  if (usesTextTool && !outputs.markdown) {
    outputs.markdown = { type: 'string' };
  }
  if (!Object.keys(outputs).length) {
    outputs.markdown = { type: 'string' };
  }

  const inputs = safeObject(manifest.inputs);

  return {
    name: safeString(manifest.name, 'AI App'),
    description: safeString(manifest.description, 'App generated from your prompt'),
    tags: safeArray(manifest.tags),
    design,
    preview_gradient: safeString(
      manifest.preview_gradient,
      'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)'
    ),
    modal_theme: safeObject(manifest.modal_theme),
    input_theme: safeObject(manifest.input_theme),
    demo,
    inputs,
    outputs,
    runtime
  };
}

function tryParseJsonLoose(text) {
  try {
    return JSON.parse(text);
  } catch {
    const start = text.indexOf('{');
    const end = text.lastIndexOf('}');
    if (start !== -1 && end !== -1 && end > start) {
      const candidate = text.slice(start, end + 1);
      try {
        return JSON.parse(candidate);
      } catch {
        const cleaned = candidate.replace(/```(?:json)?/g, '');
        try {
          return JSON.parse(cleaned);
        } catch {
          return {};
        }
      }
    }
    return {};
  }
}

async function callAnthropic({ model, system, userMsg, apiKey }) {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model,
      max_tokens: 2000,
      temperature: 0.2,
      system,
      messages: [{ role: 'user', content: userMsg }]
    })
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Anthropic API error (${model}): ${text}`);
  }
  const data = await res.json();
  const content = data?.content?.[0]?.text || '';
  return tryParseJsonLoose(content);
}

function buildToolGuidance(toolMetaList, promptTemplates, toolOrder) {
  const toolNames = toolMetaList.map((meta) => `"${meta.id}"`).join(', ');
  const toolGuidance = toolMetaList
    .map((meta, idx) => {
      const orderHint = toolOrder.length ? `Order: ${idx + 1}` : null;
      const promptHint = meta.promptHint ? `Hint: ${meta.promptHint}` : null;
      return [`- ${meta.id}: ${meta.description}`, orderHint, promptHint].filter(Boolean).join(' ');
    })
    .join(' ');
  const templateHints = [];
  if (promptTemplates.llmPrompt) {
    templateHints.push(`Use this as the llm.complete prompt base ({{original}} optional): ${promptTemplates.llmPrompt}`);
  }
  if (promptTemplates.imageInstruction) {
    templateHints.push(`Use this as the image.process instruction base ({{original}} optional): ${promptTemplates.imageInstruction}`);
  }
  return { toolNames, toolGuidance, templateHints: templateHints.join(' ') };
}

export async function generateManifestWithAnthropic({
  prompt,
  userId,
  supabase,
  toolWhitelist,
  toolOrder,
  promptTemplates,
  model
}) {
  if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
    throw new Error('Prompt is required');
  }

  const envKey = process.env.ANTHROPIC_API_KEY;
  const userKey = await getDecryptedSecret(userId, 'anthropic', supabase);
  const apiKey = userKey || envKey;
  if (!apiKey) {
    throw new Error('Missing Anthropic API key. Add it in Profile → Secrets.');
  }

  let userMeta = { id: userId, username: `user_${String(userId || '').slice(-8)}`, display_name: null };
  try {
    const { data: profile } = await supabase
      .from('profiles')
      .select('username, display_name')
      .eq('id', userId)
      .single();
    if (profile) {
      userMeta.username = profile.username || userMeta.username;
      userMeta.display_name = profile.display_name || null;
    }
  } catch (e) {
    console.warn('[AI Publish] Failed to fetch profile for prompt context:', e?.message || e);
  }

  let examples = [];
  try {
    const { data: sampleApps } = await supabase
      .from('apps')
      .select('name, description, tags, design, preview_gradient, inputs, outputs, runtime')
      .eq('is_published', true)
      .limit(3);
    if (Array.isArray(sampleApps)) {
      examples = sampleApps.map((a) => ({
        name: a.name,
        description: a.description,
        tags: a.tags,
        design: a.design,
        preview_gradient: a.preview_gradient,
        inputs: a.inputs,
        outputs: a.outputs,
        runtime: a.runtime
      }));
    }
  } catch (e) {
    console.warn('[AI Publish] Could not load example apps:', e?.message || e);
  }

  const allowedToolIds = (Array.isArray(toolWhitelist) && toolWhitelist.length ? toolWhitelist : DEFAULT_AI_TOOLS)
    .filter((tool) => AI_TOOL_MAP[tool]);
  if (!allowedToolIds.length) {
    allowedToolIds.push(DEFAULT_AI_TOOLS[0] || 'llm.complete');
  }
  const allowedToolMeta = allowedToolIds.map((id) => AI_TOOL_MAP[id]).filter(Boolean);
  const normalizedOrder = (Array.isArray(toolOrder) && toolOrder.length ? toolOrder : allowedToolIds)
    .filter((tool) => allowedToolIds.includes(tool));
  const templates = normalizePromptTemplates(promptTemplates);
  const { toolNames, toolGuidance, templateHints } = buildToolGuidance(allowedToolMeta, templates, normalizedOrder);

  const system = [
    'You are Clipcade’s app manifest generator.',
    'Return ONLY a valid JSON object matching the required schema.',
    'Use concise, production-ready values.',
    `Supported runtime tools (user-selected): ${toolNames}. DO NOT reference other tools.`,
    toolGuidance,
    templateHints,
    normalizedOrder.length ? `Tool execution order (first to last): ${normalizedOrder.join(' → ')}.` : '',
    'If unsure for outputs, default to { "markdown": { "type": "string" } }.{',
    'SCHEMA RULES:',
    '- Editable: name, description, tags, preview_url, preview_gradient, design.containerColor, design.fontColor, design.fontFamily, design.inputLayout, modal_theme.*, input_theme.*',
    '- Locked: container size, layout structure, and core logic in runtime steps',
    '- Inputs: Use supported types only: string | number | boolean | enum | file(image/video) when needed',
    '- Runtime: Prefer local engine; steps must use only the allowed tools listed above; follow the requested order',
    '- Outputs: Match outputs to the tools you include (image outputs for image.process, markdown for llm.complete)',
    '- Demo: Provide sampleInputs that satisfy inputs',
    '}'
  ].filter(Boolean).join(' ');

  const examplePrimaryTool = allowedToolMeta[0]?.id || 'llm.complete';
  const exampleOutputKey = allowedToolMeta[0]?.outputType === 'image' ? 'image' : 'markdown';
  const exampleOutputs = {
    [exampleOutputKey]: allowedToolMeta[0]?.outputType === 'image' ? { type: 'image' } : { type: 'string' }
  };
  const exampleToolArgs = examplePrimaryTool === 'image.process'
    ? { instruction: templates.imageInstruction || 'Create a polished visual for {{topic}}.' }
    : { prompt: templates.llmPrompt || 'Answer clearly about {{topic}}.' };

  const example = {
    name: 'My App Name',
    description: 'What it does in 1-2 sentences',
    tags: ['category1', 'category2'],
    design: {
      containerColor: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      fontColor: 'white',
      fontFamily: 'system-ui',
      inputLayout: 'vertical'
    },
    preview_gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    modal_theme: { backgroundColor: '#1a2332', buttonColor: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', accentColor: '#667eea' },
    input_theme: { borderColor: '#333', backgroundColor: '#1a1a1a' },
    demo: { sampleInputs: {} },
    inputs: { topic: { type: 'string', label: 'Topic', placeholder: 'Describe the subject...', required: true } },
    outputs: exampleOutputs,
    runtime: {
      engine: 'local',
      steps: [{
        tool: examplePrimaryTool,
        args: exampleToolArgs,
        output: exampleOutputKey
      }]
    }
  };

  const userMsg = [
    'Create a Clipcade app manifest from this prompt.',
    'Prompt:',
    JSON.stringify(prompt),
    '',
    'User context:',
    JSON.stringify({ username: userMeta.username, display_name: userMeta.display_name }),
    '',
    'Return ONLY JSON with fields:',
    'name, description, tags, design, preview_gradient, modal_theme, input_theme, demo, inputs, outputs, runtime',
    '',
    'Example JSON (shape only, adapt to the prompt):',
    JSON.stringify(example),
    '',
    'Here are a few existing apps for reference (use only as loose guidance for shape and field naming, not content):',
    JSON.stringify(examples)
  ].join('\n');

  const modelCandidates = [safeString(model, DEFAULT_MODEL), ...MODEL_FALLBACKS].filter(Boolean);
  let lastError = null;
  for (const candidate of modelCandidates) {
    try {
      const manifest = await callAnthropic({ model: candidate, system, userMsg, apiKey });
      if (manifest && Object.keys(manifest).length) return manifest;
      lastError = new Error('Empty manifest returned');
    } catch (err) {
      lastError = err;
      console.error('[AI Publish] Anthropic call failed:', err?.message || err);
    }
  }
  throw lastError || new Error('Failed to generate manifest');
}

export async function refineManifestWithAnthropic({
  manifest,
  instructions,
  userId,
  supabase,
  toolWhitelist,
  toolOrder,
  promptTemplates,
  model
}) {
  if (!manifest || typeof manifest !== 'object') {
    throw new Error('Manifest is required for refinement');
  }
  if (!instructions || typeof instructions !== 'string') {
    throw new Error('Instructions are required for refinement');
  }
  const envKey = process.env.ANTHROPIC_API_KEY;
  const userKey = await getDecryptedSecret(userId, 'anthropic', supabase);
  const apiKey = userKey || envKey;
  if (!apiKey) {
    throw new Error('Missing Anthropic API key. Add it in Profile → Secrets.');
  }

  const allowedToolIds = (Array.isArray(toolWhitelist) && toolWhitelist.length ? toolWhitelist : DEFAULT_AI_TOOLS)
    .filter((tool) => AI_TOOL_MAP[tool]);
  if (!allowedToolIds.length) {
    allowedToolIds.push(DEFAULT_AI_TOOLS[0] || 'llm.complete');
  }
  const allowedToolMeta = allowedToolIds.map((id) => AI_TOOL_MAP[id]).filter(Boolean);
  const normalizedOrder = (Array.isArray(toolOrder) && toolOrder.length ? toolOrder : allowedToolIds)
    .filter((tool) => allowedToolIds.includes(tool));
  const templates = normalizePromptTemplates(promptTemplates);
  const { toolNames, toolGuidance, templateHints } = buildToolGuidance(allowedToolMeta, templates, normalizedOrder);

  const system = [
    'You are Clipcade’s manifest refinement assistant.',
    'Return ONLY the updated manifest JSON.',
    `Allowed runtime tools: ${toolNames}. Do NOT introduce new ones.`,
    toolGuidance,
    templateHints,
    normalizedOrder.length ? `Tool execution order must be ${normalizedOrder.join(' → ')}.` : '',
    'Preserve structural integrity and only make requested changes.'
  ].filter(Boolean).join(' ');

  const userMsg = [
    'Current manifest JSON:',
    JSON.stringify(manifest, null, 2),
    '',
    'Instructions (apply carefully):',
    instructions,
    '',
    'Return ONLY valid JSON with the same fields.'
  ].join('\n');

  const modelCandidates = [safeString(model, DEFAULT_MODEL), ...MODEL_FALLBACKS].filter(Boolean);
  let lastError = null;
  for (const candidate of modelCandidates) {
    try {
      const updated = await callAnthropic({ model: candidate, system, userMsg, apiKey });
      if (updated && Object.keys(updated).length) return updated;
      lastError = new Error('Empty manifest returned');
    } catch (err) {
      lastError = err;
      console.error('[AI Publish] Anthropic refine call failed:', err?.message || err);
    }
  }
  throw lastError || new Error('Failed to refine manifest');
}
