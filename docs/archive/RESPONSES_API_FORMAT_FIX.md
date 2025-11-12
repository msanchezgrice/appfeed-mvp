# ✅ OpenAI Responses API Format Fix

## 🐛 Error Found in Logs

```
[LLM] Calling: https://api.openai.com/v1/responses
[LLM] OpenAI response status: 200
[LLM] Network/fetch error: s.output.trim is not a function
```

**Root Cause:**
- Responses API returned 200 ✅
- But `j.output` is NOT a string
- It's an object or array
- Calling `.trim()` on object = error ❌

---

## 🔍 Responses API Format

**According to OpenAI docs, output can be:**

```javascript
// Option 1: String
{ "output": "Here's the summary..." }

// Option 2: Array of parts
{ "output": [
    { "type": "text", "text": "Summary..." },
    { "type": "tool_use", ... }
  ]
}

// Option 3: Object
{ "output": {
    "content": "Summary...",
    "tools_used": ["web_search"]
  }
}
```

---

## ✅ Fix Applied

**File:** `src/lib/tools.js`

**Before:**
```javascript
txt = j.output.trim();  // ❌ Fails if output is object/array
```

**After:**
```javascript
if (typeof j.output === 'string') {
  txt = j.output.trim();  // String output
} else if (Array.isArray(j.output)) {
  // Array of parts - extract text
  txt = j.output.map(part => 
    typeof part === 'string' ? part : part.text || ''
  ).join('\n');
} else if (j.output.content) {
  txt = j.output.content;  // Object with content
} else {
  txt = JSON.stringify(j.output);  // Fallback
}
```

**Also Added:**
```javascript
console.log('[LLM] Response format:', {
  hasOutput: !!j.output,
  outputType: typeof j.output,
  keys: Object.keys(j)
});
```

This will help debug the exact format being returned!

---

## 🚀 Deployment

**Commit:** `c80b5f8` - Deploying now  
**ETA:** 2 minutes

**Will Now:**
1. ✅ Handle any response format
2. ✅ Extract text properly
3. ✅ Log format for debugging
4. ✅ Complete email workflow

---

## 🧪 Test After Deploy

1. Try "Article Digest via Email"
2. Enter email + article URL
3. Check Vercel logs for format:
   ```
   [LLM] Response format: { outputType: 'object', ... }
   ```
4. Should extract text correctly
5. Email sends! 📧

---

**This will show us the exact Responses API format and handle it properly!** 🔍

