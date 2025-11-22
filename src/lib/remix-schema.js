// Schema defining what can be edited vs locked in the Remix feature

export const EDITABLE_FIELDS = {
  name: {
    type: 'string',
    description: 'App name',
    examples: ['Change name to "Cool App"', 'Rename to Photo Editor']
  },
  description: {
    type: 'string',
    description: 'App description',
    examples: ['Make description more fun', 'Update description to explain features better']
  },
  icon: {
    type: 'string',
    description: 'Emoji icon',
    examples: ['Change icon to 🚀', 'Use 🎨 as icon']
  },
  tags: {
    type: 'array',
    description: 'Array of tag strings',
    examples: ['Add tags: gaming, ai', 'Add tag productivity', 'Add tags: photo, editor']
  },
  'design.containerColor': {
    type: 'gradient',
    description: 'Background gradient or solid color',
    examples: ['Make it pink', 'Change background to blue', 'Use dark theme']
  },
  'design.fontColor': {
    type: 'color',
    description: 'Text color',
    examples: ['Change text to white', 'Make text black']
  },
  'design.fontFamily': {
    type: 'string',
    description: 'Font family',
    examples: ['Use comic sans font', 'Change font to monospace']
  },
  'design.inputLayout': {
    type: 'string',
    description: 'Input layout (vertical/horizontal)',
    examples: ['Change layout to horizontal']
  },
  preview_gradient: {
    type: 'gradient',
    description: 'Preview card gradient',
    examples: ['Change preview to purple gradient', 'Make preview orange']
  }
};

export const LOCKED_FIELDS = [
  'runtime',
  'steps',
  'core logic',
  'functionality',
  'code',
  'inputs',
  'outputs',
  'tools',
  'api',
  'workflow'
];

// Color presets for common requests
export const COLOR_PRESETS = {
  pink: 'linear-gradient(135deg, #ff69b4 0%, #ff1493 100%)',
  blue: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
  green: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
  orange: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
  purple: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  red: 'linear-gradient(135deg, #ff6b6b 0%, #ee5a6f 100%)',
  yellow: 'linear-gradient(135deg, #f6d365 0%, #fda085 100%)',
  dark: '#1a1a1a',
  light: '#f5f5f5',
  black: '#000000',
  white: '#ffffff'
};

// Check if a user prompt mentions locked fields
export function containsLockedField(prompt) {
  const lowerPrompt = prompt.toLowerCase();
  for (const field of LOCKED_FIELDS) {
    if (lowerPrompt.includes(field.toLowerCase())) {
      return field;
    }
  }
  return null;
}

// Get editable field summary for UI display
export function getEditableFieldsSummary() {
  return Object.entries(EDITABLE_FIELDS).map(([key, value]) => ({
    field: key,
    ...value
  }));
}


