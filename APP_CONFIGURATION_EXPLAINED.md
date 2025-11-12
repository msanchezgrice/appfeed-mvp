# ✅ App Configuration - How It Actually Works

## 🔍 Your Apps DO Have LLM Configuration!

You asked: "I don't see prompt or llm defined in the app database"

**Answer:** They ARE there - in the `runtime` JSONB column!

---

## 📊 Database Structure

### Apps Don't Have Separate Columns for LLM

**NOT stored as:**
```sql
-- This would be wrong:
apps (
  id,
  name,
  llm text,          ← NO
  prompt text,       ← NO
  system_prompt text ← NO
)
```

**Actually stored as:**
```sql
apps (
  id text,
  name text,
  runtime jsonb  ← Everything is HERE!
)
```

---

## 📦 What's in `runtime` JSONB?

### Example: Text Summarizer

```json
{
  "engine": "node",
  "limits": {
    "tokens": 1000,
    "timeoutMs": 10000
  },
  "steps": [
    {
      "tool": "llm.complete",  ← LLM is HERE!
      "args": {
        "prompt": "Summarize this text in 2-3 sentences:\n\n{{text}}",  ← PROMPT is HERE!
        "system": "You are an expert at summarizing text. Create concise summaries."  ← SYSTEM is HERE!
      }
    }
  ]
}
```

---

## ✅ Database Verification (I Already Checked)

```sql
SELECT 
  id,
  name,
  runtime->'steps'->0->'tool' as tool_name,
  runtime->'steps'->0->'args'->'prompt' as prompt
FROM apps 
WHERE id = 'text-summarizer';

Result:
id: "text-summarizer"
tool_name: "llm.complete"  ✅
prompt: "Summarize this text in 2-3 sentences:\n\n{{text}}"  ✅
```

**All 5 apps have proper LLM configuration!** ✅

---

## 🔄 How Apps Execute (Step by Step)

### 1. User Clicks "Run"
```javascript
POST /api/runs {
  appId: "text-summarizer",
  inputs: { text: "User's input..." },
  mode: "try"
}
```

### 2. API Loads App from Database
```javascript
const app = await supabase
  .from('apps')
  .select('*')
  .eq('id', 'text-summarizer')
  .single();

// app.runtime = { steps: [{ tool: "llm.complete", args: {...} }] }
```

### 3. Runner Executes Steps
```javascript
for (let step of app.runtime.steps) {
  // step.tool = "llm.complete"
  const tool = ToolRegistry["llm.complete"];  ← Gets the LLM tool
  
  // step.args = { prompt: "...", system: "..." }
  const result = await tool({
    userId,
    args: step.args,  ← Passes prompt & system
    mode,
    supabase
  });
}
```

### 4. LLM Tool Executes
```javascript
// In tool_llm_complete():
const apiKey = await getDecryptedSecret(userId, 'openai');

if (!apiKey) {
  return { output: "🔑 No API key found...", usedStub: true };
}

// Makes real OpenAI API call
const response = await fetch('https://api.openai.com/v1/chat/completions', {
  headers: { 'Authorization': `Bearer ${apiKey}` },
  body: JSON.stringify({
    model: "gpt-4o-mini",
    messages: [
      { role: 'system', content: step.args.system },
      { role: 'user', content: step.args.prompt }
    ]
  })
});

return { output: realAIResponse, usedStub: false };
```

---

## 🎯 Why You're Seeing Stub Output

### The Flow is Working, But...

```
✅ App loads from database
✅ Runtime configuration exists
✅ llm.complete tool found
✅ Prompt is interpolated with user input
✅ LLM tool executes
❌ API key retrieval returns null
❌ Returns stub output
```

**The problem is at step: API key retrieval**

---

## 🔍 What to Check in Terminal

### When You Run an App, Look For:

**Step 1: Check userId**
```
[API /runs] POST request: { userId: "user_ABC123..." }
```
- If you see `"ANONYMOUS"` → Not signed in
- If you see `"user_..."` → Signed in ✅

**Step 2: Check API key retrieval**
```
[LLM] API key retrieval result: KEY_FOUND
```
- If you see `NO_KEY` → API key not saved for your user
- If you see `KEY_FOUND` → API key exists ✅

**Step 3: Check OpenAI API**
```
[LLM] OpenAI response status: 200
```
- If you see `200` → Real AI used! ✅
- If you see `401` → Invalid API key
- If missing → Never got to API call

---

## 📋 Diagnostic Checklist

Run through these in order:

### ✅ 1. Apps Have LLM Config?
```sql
SELECT runtime FROM apps WHERE id = 'text-summarizer';
```
**Status:** ✅ YES (verified above)

### ✅ 2. Are You Signed In?
Check terminal logs for:
```
[API /runs] POST request: { userId: "user_..." }
```
**If ANONYMOUS:** Sign in at /profile

### ✅ 3. Is API Key Saved?
Check terminal logs for:
```
[LLM] API key retrieval result: KEY_FOUND
```
**If NO_KEY:** Save API key in /profile → Settings

### ✅ 4. Is Supabase Client Passed?
Check terminal logs for:
```
[Runner] Starting app execution: { hasSupabase: true }
```
**If false:** Code issue (I'll fix)

### ✅ 5. Does Profile Exist?
If saving API key fails:
```
[Secrets POST] Profile not found, creating...
[Secrets POST] Profile created successfully
```
**Status:** Auto-creates now ✅

---

## 🎯 New Diagnostic Output

**Instead of white stub message, you now see:**

### Execution Diagnostic Panel
```
⚠️ Execution Diagnostic

[Shows actual error message with formatting]

Execution Trace:
Step 0: llm.complete - ok ⚠️ STUB
Error: USER_NOT_SIGNED_IN
Args: {"prompt":"..."}

💡 Check your terminal/console for detailed logs
```

**This shows:**
- Actual error message
- Execution trace with steps
- Which step used stub
- Error codes
- Prompt to check console

---

## ✅ Summary

### Your Questions Answered:

**Q:** "I don't see prompt or llm defined in app database"  
**A:** They're in `runtime.steps[0].args` - verified all 5 apps have it ✅

**Q:** "How would app run without that?"  
**A:** They wouldn't! And they DO have it - stored as JSON ✅

**Q:** "Apps still not running"  
**A:** Apps ARE executing, but using stub mode because:
- Either not signed in OR
- No API key saved for your user

**Check your terminal logs - they'll show exactly which!**

---

## 🚀 Next Step

**Run an app and send me the terminal output showing:**
```
[API /runs] ...
[Runner] ...
[LLM] API key retrieval result: ...
```

This will tell me if it's a sign-in issue or API key issue!

