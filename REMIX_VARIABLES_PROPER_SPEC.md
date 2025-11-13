# 🎨 Remix Variables - Proper Implementation Spec

## 🎯 Core Issue Identified

**Current Problem:**
- User changes "background to pink" in advanced editor
- BUT the app container doesn't actually change!
- Variables are saved but not applied to rendering
- Need structured LLM output to change app appearance

---

## ✅ Proper Solution

### The App Container = Configurable by Variables

**Think of each app as:**
```jsx
<AppContainer 
  background={design.containerColor}
  textColor={design.fontColor}
  font={design.fontFamily}
  layout={design.inputLayout}
>
  {/* App content */}
</AppContainer>
```

**When user remixes with "make it pink":**
1. LLM parses: "pink background requested"
2. Returns: `{ design: { containerColor: "pink gradient" } }`
3. New remix saves with these variables
4. App renders with pink background! ✅

---

## 🔧 Implementation Requirements

### 1. LLM Structured Output

**Current Remix API:**
```javascript
// User says: "make it pink"
// Returns: Just creates app with description += "Remixed with: make it pink"
```

**New Remix API:**
```javascript
// User says: "make it pink"
// LLM returns structured JSON:
{
  "design": {
    "containerColor": "linear-gradient(135deg, #ff69b4 0%, #ff1493 100%)"
  },
  "metadata": {
    "remixPrompt": "make it pink"
  }
}

// We apply these to the new app
```

### 2. Schema Definition

**Editable Variables Schema:**
```javascript
{
  "design": {
    "containerColor": {
      type: "string",
      format: "gradient or #hex",
      default: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      examples: [
        "#ff69b4",
        "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)"
      ]
    },
    "fontColor": {
      type: "string",
      format: "#hex or color name",
      default: "white",
      options: ["white", "black", "#2d3748", "#fbbf24"]
    },
    "fontFamily": {
      type: "string",
      default: "system-ui",
      options: ["system-ui", "monospace", "serif"]
    },
    "inputLayout": {
      type: "enum",
      default: "vertical",
      options: ["vertical", "horizontal"]
    }
  },
  "content": {
    "name": { type: "string" },
    "description": { type: "string" },
    "tags": { type: "array" }
  }
}
```

### 3. LLM Prompt for Remix

**New Remix Prompt:**
```
You are remixing an app. The user wants to: "{userPrompt}"

Current app variables:
{
  "name": "Ghiblify My Photo",
  "design": {
    "containerColor": "linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)",
    "fontColor": "white",
    "fontFamily": "system-ui"
  }
}

Return ONLY valid JSON with the variables to change:
{
  "design": { ...changes... },
  "content": { ...changes... }
}

Examples:
- "make it pink" → {"design": {"containerColor": "linear-gradient(135deg, #ff69b4 0%, #ff1493 100%)"}}
- "dark theme" → {"design": {"containerColor": "#1a1a1a", "fontColor": "#fbbf24"}}
- "rename to Pink Dreams" → {"content": {"name": "Pink Dreams"}}
```

---

## 🎨 How Variables Should Work

### Design Variables Control Rendering

**In AppOutput.js / App rendering:**
```jsx
<div style={{
  background: app.design?.containerColor || DEFAULT_GRADIENT,
  color: app.design?.fontColor || 'white',
  fontFamily: app.design?.fontFamily || 'inherit',
  // These are APPLIED, not just stored!
  padding: 24,  // FIXED (not editable)
  borderRadius: 12,  // FIXED
  minHeight: 200  // FIXED
}}>
  {/* App content renders here */}
</div>
```

**Result:** Remixed apps actually LOOK different! ✅

---

## 📋 3 Fixes Needed

### Fix 1: Native Modal for Confirmation
**Change:**
```javascript
// OLD
alert('App remixed successfully!');

// NEW
<SuccessModal 
  show={true}
  message="App remixed successfully! Check your profile."
  onClose={() => router.push('/profile')}
/>
```

### Fix 2: Don't Concatenate Remix Prompts
**Change:**
```javascript
// OLD
description: app.description + "\n\nRemixed with: " + prompt

// NEW  
description: newDescription // From LLM structured output
metadata: {
  remixHistory: [
    { prompt: "make pink", timestamp: "..." },
    { prompt: "make green", timestamp: "..." }
  ]
}
```

### Fix 3: Apply Variables to Rendering
**Change:**
```javascript
// In AppOutput.js, AppContainer, etc.
// USE app.design values to style the container

<div style={{
  background: app.design?.containerColor,  // ← USE IT!
  color: app.design?.fontColor,            // ← USE IT!
  fontFamily: app.design?.fontFamily       // ← USE IT!
}}>
```

---

## 🎯 Implementation Plan

### Phase 1: Make Variables Work (45 mins) ⭐ CRITICAL
1. Update remix API to use LLM structured output
2. Apply design variables in AppOutput rendering
3. Test: "make it pink" → app IS pink!

### Phase 2: Fix UX Issues (20 mins)
1. Native success modal
2. Don't concatenate descriptions
3. Clean remix history

### Phase 3: Advanced Editor Integration (15 mins)
1. When user edits in advanced editor
2. Variables apply immediately
3. Preview works

---

## ✅ READY FOR SIGN-OFF

**Recommend:**
- Implement Phase 1 first (make variables actually work!)
- Then Phase 2 (UX polish)
- Then Phase 3 (advanced editor)

**This will make remix variables REAL, not just metadata!**

**Approve to proceed?** 🚀

