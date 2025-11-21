export const AI_TOOL_OPTIONS = [
  {
    id: 'llm.complete',
    label: 'AI Text (llm.complete)',
    description: 'Generate or transform text with GPT-4o mini.',
    promptHint: 'Use args { prompt: "...", temperature?: 0.7, max_tokens?: 600 } referencing user inputs like {{idea}}.',
    outputType: 'markdown',
    defaultSelected: true
  },
  {
    id: 'image.process',
    label: 'Google Image (image.process)',
    description: 'Create or edit images via Gemini 2.5 Flash.',
    promptHint: 'Use args { instruction: "...", image?: "{{upload}}" } for image or screenshot inputs. Output must be "image".',
    outputType: 'image',
    defaultSelected: false
  }
];

export const AI_TOOL_MAP = AI_TOOL_OPTIONS.reduce((acc, tool) => {
  acc[tool.id] = tool;
  return acc;
}, {});

export const DEFAULT_AI_TOOLS = AI_TOOL_OPTIONS.filter((tool) => tool.defaultSelected).map((tool) => tool.id);
