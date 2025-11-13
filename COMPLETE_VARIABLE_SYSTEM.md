# 📋 COMPLETE VARIABLE SYSTEM ANALYSIS

## 🎨 Current Editable Variables (Verified)

### 1. Feed Card Appearance
✅ **`preview_gradient`** - Card background gradient
- Controls: Feed card background when no image
- Example: `"linear-gradient(135deg, #f093fb 0%, #f5576c 100%)"`
- Shown in: Feed, profile grid

✅ **`preview_url`** - Nano Banana generated image
- Controls: Feed card image overlay
- Auto-generated: Via Gemini API
- Example: `"data:image/png;base64,..."` or storage URL

✅ **`name`** - App title
- Controls: Card title, modal headers, detail page
- Example: `"Ghiblify My Photo"`

✅ **`description`** - App description
- Controls: Card description text
- Example: `"Transform your photos..."`

✅ **`tags`** - Tag array
- Controls: Tag pills below description
- Example: `["AI", "image", "art"]`

### 2. Try Modal Appearance
✅ **`design.containerColor`** - App output container background
- Controls: Result container in Try modal
- Example: `"linear-gradient(135deg, #667eea 0%, #764ba2 100%)"`

✅ **`design.fontColor`** - Output text color
- Controls: Text color in result container
- Example: `"white"`, `"#2d3748"`

✅ **`design.fontFamily`** - Output font
- Controls: Font in result container
- Example: `"system-ui"`, `"monospace"`

✅ **`design.inputLayout`** - Input arrangement
- Controls: Form field layout
- Example: `"vertical"` or `"horizontal"`

### 3. Functionality
✅ **`inputs`** - Input field definitions
- Controls: Form fields in Try modal
- Example: `{ "image": { "type": "image", "label": "Upload Photo" } }`

✅ **`runtime.steps[].tool`** - Tools used
- Controls: What AI/services run
- Options: `"llm.complete"`, `"image.process"`, `"email.send"`

✅ **`runtime.steps[].args.prompt`** - LLM instructions
- Controls: What the AI does
- Example: `"Summarize this article: {{articleUrl}}"`

---

## ⚠️ MISSING Variables (Need to Add)

### Card-Level Design
❌ **`card_gradient`** or **`feed_background`**
- Should control: Feed card gradient (different from output container)
- Currently uses: `preview_gradient` (works but not clearly named)
- **Recommendation:** Rename to `card.backgroundColor` for clarity

### Try Modal Customization
❌ **`modal.backgroundColor`** - Try modal background
- Currently: Hardcoded dark blue
- Should be: Configurable per app

❌ **`modal.buttonColor`** - Run button color
- Currently: Hardcoded gradient
- Should be: Configurable (matches app theme)

### Input Field Styling
❌ **`input.borderColor`** - Input field borders
- Currently: Hardcoded
- Could be: Match app theme

❌ **`input.backgroundColor`** - Input field background
- Currently: Hardcoded
- Could be: Themed

### Advanced Features
❌ **`icon`** or **`emoji`** - App icon/emoji
- For: Better visual identity
- Example: `"🎨"` for Ghiblify

❌ **`author`** or **`attribution`** - Creator credit
- For: Proper attribution
- Example: `"Created by @miguel"`

---

## 🎯 Complete Variable Schema (Proposed)

```json
{
  "id": "app-id",
  "name": "App Name",
  "description": "What the app does",
  "icon": "🎨",
  
  "card": {
    "backgroundColor": "linear-gradient(...)",
    "textColor": "white",
    "imageUrl": "https://..."  // Nano Banana
  },
  
  "design": {
    "containerColor": "linear-gradient(...)",
    "fontColor": "white",
    "fontFamily": "system-ui",
    "inputLayout": "vertical"
  },
  
  "modal": {
    "backgroundColor": "#1a2332",
    "buttonColor": "linear-gradient(...)",
    "accentColor": "#fe2c55"
  },
  
  "inputs": {
    "fieldName": {
      "type": "string|image|select",
      "label": "Display Label",
      "placeholder": "...",
      "required": true
    }
  },
  
  "runtime": {
    "engine": "local|html5",
    "steps": [{
      "tool": "llm.complete|image.process|email.send",
      "args": {
        "prompt": "...",
        "model": "gpt-4o-mini"
      }
    }]
  },
  
  "tags": ["AI", "productivity"],
  "category": "utility|creative|productivity",
  "author": "@username"
}
```

---

## 🎮 HTML5 Games / Advanced Functionality

### Current Limitation
**Apps can only output:**
- Text/Markdown (via LLM)
- Images (via Gemini)
- Email (via Resend)

**Cannot output:**
- Interactive HTML
- Mini games
- Custom UI components
- JavaScript interactions

### Proposed Solution: HTML5 Output Type

**Add new tool:**
```javascript
{
  "runtime": {
    "engine": "html5",  // NEW!
    "steps": [{
      "tool": "html.generate",
      "args": {
        "prompt": "Create a tic-tac-toe game with {{theme}} colors"
      },
      "output": "gameHtml"
    }]
  },
  "outputs": {
    "html": {
      "type": "html",
      "sandboxed": true
    }
  }
}
```

**Rendering:**
```jsx
<AppOutput>
  {output.html && (
    <iframe
      srcDoc={output.html}
      sandbox="allow-scripts"
      style={{ width: '100%', height: 400, border: 'none' }}
    />
  )}
</AppOutput>
```

**Benefits:**
- ✅ Mini games (tic-tac-toe, snake, etc.)
- ✅ Interactive visualizations
- ✅ Custom UI components
- ✅ Calculators, tools
- ✅ Data visualizations

**Security:**
- ✅ Sandboxed iframe
- ✅ No access to parent page
- ✅ No network requests
- ✅ LLM-generated, reviewed

**Implementation:** ~2 hours
- Add html.generate tool
- Add iframe rendering
- Add sandbox security
- Test with simple games

---

## 🚀 Feasibility: HIGH ✅

**HTML5 games are totally feasible!**

**Easy examples:**
- Tic-tac-toe
- Memory card game
- Simple calculators
- Color pickers
- Interactive charts

**Medium examples:**
- Snake game
- Flappy bird clone
- Quiz apps
- Drawing tools

**Hard examples:**
- 3D games (WebGL)
- Multiplayer (needs backend)
- Real-time sync

**Recommendation:** Start with simple HTML5 canvas games!

---

**Creating LLM guide next...** 📖

