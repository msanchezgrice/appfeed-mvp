import { ToolRegistry, interpolateArgs } from './tools.js';
import { addRun } from './db.js';
import { nowIso } from './utils.js';

export async function runApp({ app, inputs, userId, mode='try' }) {
  const trace = [];
  const ctx = { inputs };
  let outputs = null;
  const start = Date.now();
  for (let i=0; i<app.runtime.steps.length; i++) {
    const step = app.runtime.steps[i];
    const tool = ToolRegistry[step.tool];
    if (!tool) {
      trace.push({ i, tool: step.tool, status:'error', error: 'Unknown tool' });
      continue;
    }
    const args = interpolateArgs(step.args || {}, { ...ctx, steps: trace });
    trace.push({ i, tool: step.tool, status:'running', args: args });
    try {
      const res = await tool({ userId, args, mode });
      trace[i] = { ...trace[i], status:'ok', output: res.output, usedStub: res.usedStub || false };
      outputs = res.output;
    } catch (err) {
      trace[i] = { ...trace[i], status:'error', error: String(err?.message || err) };
      break;
    }
  }
  const run = {
    id: 'run_' + Math.random().toString(36).slice(2,9),
    appId: app.id,
    userId,
    status: 'ok',
    inputs, trace, outputs,
    durationMs: Date.now()-start,
    createdAt: nowIso()
  };
  addRun(run);
  return run;
}
