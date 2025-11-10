export const creators = [
  { id: 'u_alex', name: 'Alex', avatar: '/avatars/1.svg', bio: 'Builder of little useful things.' },
  { id: 'u_jamie', name: 'Jamie', avatar: '/avatars/2.svg', bio: 'Power user and curator.' }
];

export const tags = ['productivity', 'wellbeing', 'local', 'daily', 'utility'];

export const apps = [
  {
    id: 'affirmations-daily',
    name: 'Daily Affirmations',
    creatorId: 'u_alex',
    description: 'Get 3 short affirmations tailored to your mood.',
    tags: ['wellbeing','daily'],
    preview: {
      type: 'video',
      url: 'https://media.giphy.com/media/3o7btPCcdNniyf0ArS/giphy.gif',
      gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
    },
    demo: {
      sampleInputs: { mood: 'optimistic', style: 'short' }
    },
    inputs: {
      mood: { type: 'string', required: false, placeholder: 'calm / stressed / optimistic' },
      style: { type: 'string', required: false, enum: ['short','poetic','coach'], default: 'short' }
    },
    outputs: { markdown: { type: 'string' } },
    runtime: {
      engine: 'node',
      limits: { timeoutMs: 5000, tokens: 800 },
      steps: [
        { tool: 'llm.complete', args: { 
          system: 'You are a warm, supportive coach. Keep things concise.',
          prompt: 'Write 3 first-person daily affirmations. Mood: {{mood||neutral}}. Style: {{style||short}}.'
        }}
      ]
    },
    provenance: { forkOf: null }
  },
  {
    id: 'weekend-near-me',
    name: 'This Weekend Near Me',
    creatorId: 'u_alex',
    description: 'Ideas for the weekend in your city. Offline dataset, safe to try.',
    tags: ['local','daily'],
    preview: {
      type: 'video',
      url: 'https://media.giphy.com/media/26tP3m3i38deSMMCs/giphy.gif',
      gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)'
    },
    demo: { sampleInputs: { city: 'Austin' } },
    inputs: {
      city: { type: 'string', required: true, placeholder: 'Austin, TX' },
      vibe: { type: 'string', required: false, enum: ['outdoors','indoors','family','date'] }
    },
    outputs: { items: { type: 'array' } },
    runtime: {
      engine: 'node',
      limits: { timeoutMs: 5000 },
      steps: [
        { tool: 'activities.lookup', args: { city: '{{city}}', vibe: '{{vibe||outdoors}}', limit: 5 } }
      ]
    },
    provenance: { forkOf: null }
  },
  {
    id: 'todo-add',
    name: 'Todo: Add Item',
    creatorId: 'u_alex',
    description: 'Add a task to your personal todo list. Try is simulated; Use writes to your store.',
    tags: ['productivity','utility'],
    preview: {
      type: 'video',
      url: 'https://media.giphy.com/media/3o6Zt6ML6BklcajjsA/giphy.gif',
      gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)'
    },
    demo: { sampleInputs: { title: 'Book flights', due: '' } },
    inputs: {
      title: { type: 'string', required: true, placeholder: 'Task title' },
      due: { type: 'string', required: false, placeholder: 'YYYY-MM-DD' }
    },
    outputs: { json: { type: 'object' } },
    runtime: {
      engine: 'node',
      limits: { timeoutMs: 5000 },
      steps: [
        { tool: 'todo.add', args: { title: '{{title}}', due: '{{due}}' } }
      ]
    },
    provenance: { forkOf: null }
  }
];
