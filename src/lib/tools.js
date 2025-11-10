import { getSecret, addUserTodo, listUserTodos } from './db.js';
import { decryptString } from './crypto.js';

const OPENAI_BASE = process.env.OPENAI_API_BASE || 'https://api.openai.com';
const DEFAULT_MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini';

// Utility to perform template interpolation like {{var||fallback}}
function tpl(str, ctx) {
  return String(str || '').replace(/\{\{([^}]+)\}\}/g, (_, expr) => {
    const [path, fb] = expr.split('||').map(s => s.trim());
    const val = path.split('.').reduce((acc, k) => (acc && acc[k] !== undefined) ? acc[k] : undefined, ctx);
    return (val === undefined || val === null || val === '') ? (fb ?? '') : String(val);
  });
}

export async function tool_llm_complete({ userId, args, mode }) {
  // Try to use BYOK OpenAI key; otherwise return stubbed text
  const sec = getSecret({ userId, provider: 'openai' });
  if (!sec) {
    return {
      output: `• I choose to believe in myself.\n• I can take one small step.\n• I am enough. (stubbed — add your OpenAI key on /secrets)`,
      usedStub: true
    };
  }
  let apiKey = '';
  try { apiKey = JSON.parse(decryptString(sec.encPayload)).apiKey; } catch {}
  if (!apiKey) {
    return {
      output: `• I choose to believe in myself... (stubbed; invalid key)`, usedStub: true
    };
  }
  const system = tpl(args.system || '', {});
  const prompt = tpl(args.prompt || '', {});
  const body = {
    model: DEFAULT_MODEL,
    messages: [
      ...(system ? [{ role: 'system', content: system }] : []),
      { role: 'user', content: prompt }
    ],
    temperature: 0.7,
    max_tokens: 200
  };
  const res = await fetch(`${OPENAI_BASE}/v1/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
    body: JSON.stringify(body)
  });
  if (!res.ok) {
    const t = await res.text();
    return { output: `LLM error: ${t.slice(0,180)}`, usedStub: true };
  }
  const j = await res.json();
  const txt = j.choices?.[0]?.message?.content?.trim() || 'No content';
  return { output: txt, usedStub: false };
}

const ACTIVITY_DB = {
  'austin': {
    outdoors: ['Lady Bird Lake loop', 'Barton Springs dip', 'Zilker picnic', 'Greenbelt hike', 'Sunset at Mount Bonnell'],
    indoors: ['Blanton Museum', 'Pinballz arcade', 'BookPeople browse', 'Austin Bouldering Project', 'IMAX at Bob Bullock'],
    family: ['Thinkery kids museum', 'Zilker Zephyr (mini train)', 'Austin Zoo', 'Kite flying at Zilker', 'Central Library atrium'],
    date: ['Wine at South Congress', 'Paddle board at sunset', 'Alamo Drafthouse', 'Eberly dinner', 'Mozart’s coffee']
  },
  'san francisco': {
    outdoors: ['Crissy Field walk', 'Lands End trail', 'Golden Gate Park bikes', 'Twin Peaks sunset', 'Ocean Beach bonfire'],
    indoors: ['Exploratorium', 'SF MOMA', 'Yerba Buena ice rink', 'Archery at Golden Gate Park', 'Alcatraz night tour'],
    family: ['California Academy of Sciences', 'Children’s Creativity Museum', 'Cable Car ride', 'Aquarium by the Bay', 'Dolores Park picnic'],
    date: ['Ferry Building oysters', 'Painted Ladies sunset', 'Foreign Cinema', 'Bike to Sausalito', 'Marina stroll']
  }
};

export async function tool_activities_lookup({ args }) {
  const city = (args.city || '').toLowerCase().trim();
  const vibe = (args.vibe || 'outdoors').toLowerCase().trim();
  const catalog = ACTIVITY_DB[city] || ACTIVITY_DB['austin'];
  const list = catalog[vibe] || catalog['outdoors'];
  const items = list.slice(0, Math.max(1, Math.min(5, Number(args.limit) || 5))).map((name, i) => ({
    rank: i+1, name, where: city || 'austin', vibe
  }));
  return { output: items };
}

export async function tool_todo_add({ userId, args, mode }) {
  const title = String(args.title || '').trim();
  if (!title) return { output: { ok:false, error:'Missing title' } };
  const due = String(args.due || '').trim();
  const item = { id: 'td_' + Math.random().toString(36).slice(2,9), title, due, done:false, createdAt: new Date().toISOString() };
  if (mode === 'use') {
    addUserTodo(userId, item);
    return { output: { ok:true, added: item, total: listUserTodos(userId).length } };
  } else {
    return { output: { ok:true, added: item, simulated:true } };
  }
}

export const ToolRegistry = {
  'llm.complete': tool_llm_complete,
  'activities.lookup': tool_activities_lookup,
  'todo.add': tool_todo_add
};

export function interpolateArgs(args, ctx) {
  if (!args) return {};
  const tplStr = (s) => String(s || '').replace(/\{\{([^}]+)\}\}/g, (_, expr) => {
    const [path, fb] = expr.split('||').map(s => s.trim());
    const val = path.split('.').reduce((acc, k) => (acc && acc[k] !== undefined) ? acc[k] : undefined, ctx);
    return (val === undefined || val === null || val === '') ? (fb ?? '') : String(val);
  });
  const out = {};
  for (const [k, v] of Object.entries(args)) {
    out[k] = typeof v === 'string' ? tplStr(v) : v;
  }
  return out;
}
