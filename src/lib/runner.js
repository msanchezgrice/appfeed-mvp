import { ToolRegistry, interpolateArgs } from './tools.js';
import { nowIso } from './utils.js';

export async function runApp({ app, inputs, userId, mode='try', supabase, fallbackAllowed=false }) {
  console.log('[Runner] Starting app execution:', {
    appId: app.id,
    appName: app.name,
    userId: userId || 'ANONYMOUS',
    mode,
    hasSupabase: !!supabase,
    stepsCount: app.runtime?.steps?.length || 0,
    inputs: inputs  // Log the actual inputs
  });
  
  const trace = [];
  const ctx = { inputs: inputs };  // Ensure inputs are in context
  let outputs = null;
  const start = Date.now();
  
  // Validate app has runtime and steps
  if (!app.runtime || !app.runtime.steps || !Array.isArray(app.runtime.steps)) {
    console.error('[Runner] Invalid runtime configuration:', {
      hasRuntime: !!app.runtime,
      hasSteps: !!app.runtime?.steps,
      isArray: Array.isArray(app.runtime?.steps)
    });
    return {
      id: 'run_error',
      appId: app.id,
      userId,
      status: 'error',
      inputs,
      trace: [{ i: 0, status: 'error', error: 'Invalid app runtime configuration' }],
      outputs: null,
      durationMs: 0,
      createdAt: nowIso()
    };
  }
  
  console.log('[Runner] Runtime valid, starting execution of', app.runtime.steps.length, 'steps');
  
  // Pass supabase and userId to tools for accessing secrets
  const toolContext = { userId, mode, supabase, fallbackAllowed };
  
  // Store step outputs for interpolation
  const stepOutputs = {};
  
  for (let i=0; i<app.runtime.steps.length; i++) {
    const step = app.runtime.steps[i];
    console.log(`[Runner] Step ${i}: tool="${step.tool}", args=${JSON.stringify(step.args).slice(0, 100)}...`);
    
    const tool = ToolRegistry[step.tool];
    if (!tool) {
      console.error(`[Runner] Unknown tool: ${step.tool}`);
      trace.push({ i, tool: step.tool, status:'error', error: 'Unknown tool' });
      continue;
    }
    
    // Interpolate args with inputs AND previous step outputs
    const interpolationContext = { 
      ...inputs,         // Spread inputs to top level so {{tone}} works
      ...stepOutputs,    // Include previous step outputs (e.g., {{summary}})
      inputs: inputs,    // Also keep nested for {{inputs.tone}} format
      steps: trace 
    };
    
    const args = interpolateArgs(step.args || {}, interpolationContext);
    console.log(`[Runner] Step ${i} context:`, { hasInputs: !!inputs, inputKeys: Object.keys(inputs), stepOutputKeys: Object.keys(stepOutputs) });
    console.log(`[Runner] Step ${i} RAW template:`, step.args);
    console.log(`[Runner] Step ${i} interpolated args:`, JSON.stringify(args).slice(0, 300));
    
    // Debug: Check if image arg is properly resolved
    if (args.image) {
      console.log(`[Runner] Step ${i} image arg type:`, typeof args.image, 'isString:', typeof args.image === 'string', 'starts with data:', typeof args.image === 'string' && args.image.startsWith('data:'));
    }
    trace.push({ i, tool: step.tool, status:'running', args: args });
    try {
      const res = await tool({ ...toolContext, args });
      console.log(`[Runner] Step ${i} result:`, {
        hasOutput: !!res.output,
        usedStub: res.usedStub,
        error: res.error
      });
      trace[i] = { ...trace[i], status:'ok', output: res.output, usedStub: res.usedStub || false };
      
      // Merge outputs from multiple steps instead of replacing
      if (outputs && typeof outputs === 'object' && typeof res.output === 'object') {
        // Merge objects - later steps can override or add to earlier outputs
        outputs = { ...outputs, ...res.output };
        console.log(`[Runner] Step ${i} merged outputs keys:`, Object.keys(outputs));
        console.log(`[Runner] Step ${i} merged output has image:`, !!outputs.image, 'has markdown:', !!outputs.markdown);
        if (outputs.image) {
          console.log(`[Runner] Step ${i} image starts with data:`, outputs.image.substring(0, 50));
        }
      } else {
        outputs = res.output;
      }
      
      // Store step output by name for next steps to reference
      if (step.output) {
        stepOutputs[step.output] = res.output;
        console.log(`[Runner] Step ${i} output stored as:`, step.output);
      }
    } catch (err) {
      console.error(`[Runner] Step ${i} error:`, err);
      trace[i] = { ...trace[i], status:'error', error: String(err?.message || err) };
      break;
    }
  }
  
  console.log('[Runner] Execution complete:', {
    status: 'ok',
    totalSteps: trace.length,
    hasOutputs: !!outputs,
    duration: Date.now() - start
  });
  const run = {
    id: 'run_' + Math.random().toString(36).slice(2,9),
    appId: app.id,
    userId,
    status: 'ok',
    inputs, trace, outputs,
    durationMs: Date.now()-start,
    createdAt: nowIso()
  };
  
  // Note: Run is saved in the API route now, not here
  return run;
}
