# 🔍 Complete Debugging Guide - App Execution

## 📊 I've Added Comprehensive Logging

You now have detailed logs throughout the entire execution chain. Here's what to look for:

---

## 🧪 How to Debug (Step by Step)

### Step 1: Open Terminal Running Dev Server
Find the terminal window running `npm run dev`

### Step 2: Sign In (IMPORTANT!)
```
1. Go to http://localhost:3000/profile
2. Sign in with your account
3. Verify you see your profile (not redirected to sign-in)
```

### Step 3: Try Running an App
```
1. Go to /feed
2. Click "Try" on Text Summarizer
3. Enter some text
4. Click "Run"
```

### Step 4: Check Terminal Logs

You should see logs like this:

```javascript
// ===== API ROUTE LOGS =====
[API /runs] POST request: {
  appId: "text-summarizer",
  mode: "try",
  userId: "user_ABC123..." // ← Should NOT be "ANONYMOUS"!
  hasInputs: true
}

[API /runs] App loaded: {
  id: "text-summarizer",
  name: "Text Summarizer",
  hasRuntime: true,
  steps: 1
}

[API /runs] Starting execution with inputs: [ 'text' ]

// ===== RUNNER LOGS =====
[Runner] Starting app execution: {
  appId: "text-summarizer",
  appName: "Text Summarizer",
  userId: "user_ABC123...", // ← Should match above
  mode: "try",
  hasSupabase: true,  // ← Must be true!
  stepsCount: 1
}

[Runner] Runtime valid, starting execution of 1 steps
[Runner] Step 0: tool="llm.complete", args={"prompt":"Summarize this text...
[Runner] Step 0 interpolated args: [ 'prompt', 'system' ]

// ===== LLM TOOL LOGS =====
[LLM] Starting - userId: user_ABC123..., mode: try
[LLM] Attempting to retrieve API key for user: user_ABC123...
[LLM] API key retrieval result: KEY_FOUND  // ← KEY_FOUND or NO_KEY?
[LLM] API key found, making OpenAI API call...
[LLM] Making OpenAI API request: {
  model: "gpt-4o-mini",
  promptLength: 45,
  systemLength: 62
}
[LLM] OpenAI response status: 200  // ← Should be 200 for success
[LLM] Success! Response length: 150

// ===== FINAL RESULT =====
[Runner] Step 0 result: {
  hasOutput: true,
  usedStub: false,  // ← Should be FALSE for real AI!
  error: undefined
}

[Runner] Execution complete: {
  status: "ok",
  totalSteps: 1,
  hasOutputs: true,
  duration: 1234
}

[API /runs] Execution complete: {
  runId: "run_xyz123",
  status: "ok",
  usedStub: false,  // ← FALSE = real AI used!
  hasOutput: true
}
```

---

## 🚨 Common Issues & What Logs Will Show

### Issue #1: Not Signed In
```
❌ [API /runs] POST request: { userId: "ANONYMOUS" }
❌ [LLM] No userId - user not signed in, using stub
❌ Output: "🔒 Sign in to use real AI..."
```

**Fix:** Sign in at /profile

---

### Issue #2: No API Key Saved
```
✅ [API /runs] POST request: { userId: "user_ABC123..." }
✅ [LLM] Starting - userId: user_ABC123...
❌ [LLM] API key retrieval result: NO_KEY
❌ Output: "🔑 No API key found..."
```

**Fix:** Go to /profile → Settings → Enter API key → Save

---

### Issue #3: Profile Not Synced
```
✅ [API /runs] POST request: { userId: "user_ABC123..." }
✅ [LLM] Starting - userId: user_ABC123...
❌ [LLM] Error retrieving API key: ...foreign key constraint...
❌ Output: "⚠️ Error retrieving API key..."
```

**Fix:** Auto-create profile (I added this fix to /api/secrets)

---

### Issue #4: Invalid API Key
```
✅ [API /runs] POST request: { userId: "user_ABC123..." }
✅ [LLM] API key retrieval result: KEY_FOUND
✅ [LLM] Making OpenAI API request...
❌ [LLM] OpenAI response status: 401
❌ [LLM] OpenAI API error: 401 "Incorrect API key..."
❌ Output: "❌ OpenAI API Error (401)..."
```

**Fix:** Check your OpenAI API key is valid

---

### Issue #5: Success! (What You Want to See)
```
✅ [API /runs] POST request: { userId: "user_ABC123..." }
✅ [LLM] API key retrieval result: KEY_FOUND
✅ [LLM] OpenAI response status: 200
✅ [LLM] Success! Response length: 150
✅ [Runner] Step 0 result: { usedStub: false }
✅ Output: <real AI response>
```

**This means:** Everything working correctly! 🎉

---

## 🎯 Quick Diagnostic Checklist

Run an app and check these in order:

1. **Is userId set?**
   - Look for: `userId: "user_..."` (NOT "ANONYMOUS")
   - If ANONYMOUS → You're not signed in

2. **Does profile exist?**
   - Look for: `[Secrets POST] Profile not found, creating...`
   - Should auto-create now

3. **Is API key found?**
   - Look for: `[LLM] API key retrieval result: KEY_FOUND`
   - If NO_KEY → Need to save API key in settings

4. **Did OpenAI API call succeed?**
   - Look for: `[LLM] OpenAI response status: 200`
   - If 401/403 → Invalid API key
   - If network error → Connection issue

5. **Is stub flag false?**
   - Look for: `usedStub: false`
   - If true → Something failed earlier

---

## 📋 What To Send Me If Still Broken

Copy the ENTIRE terminal output showing:
```
[API /runs] POST request: {...}
[Runner] Starting app execution: {...}
[LLM] Starting - userId: ...
[LLM] API key retrieval result: ...
... all the logs ...
[API /runs] Execution complete: {...}
```

This will tell me exactly where it's failing!

---

## ✅ Quick Test

**Run this in terminal to check current secrets:**
```bash
# In a new terminal
curl -X POST http://localhost:3000/api/runs \
  -H "Content-Type: application/json" \
  -d '{"appId":"text-summarizer","inputs":{"text":"Test"},"mode":"try"}'
```

Then check your `npm run dev` terminal for all the logs!

---

**With these logs, we can see exactly what's happening at every step!** 🔍

