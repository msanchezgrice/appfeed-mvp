import { db, getAppById, addVariant } from '@/src/lib/db';
import { generateForkId } from '@/src/lib/utils';

export const dynamic = 'force-dynamic';

export async function POST(req) {
  const body = await req.json();
  const base = getAppById(body.appId);
  if (!base) return new Response(JSON.stringify({ error:'App not found' }), { status:404 });

  const id = generateForkId(base.id);
  const name = body.name || (base.name + ' (remix)');
  const defaults = body.defaults || {};

  const variant = {
    ...base,
    id, name,
    demo: { sampleInputs: { ...(base.demo?.sampleInputs||{}), ...(defaults||{}) } },
    provenance: { forkOf: base.id },
    // do not mutate steps; only override default inputs
  };
  addVariant(variant);
  const state = db();
  const creator = state.creators.find(c => c.id === variant.creatorId);
  return new Response(JSON.stringify({ variant, creator }), { headers: { 'Content-Type': 'application/json' } });
}
