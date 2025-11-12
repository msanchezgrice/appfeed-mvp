# 🎨 Advanced Remix Editor - Specification

## 🎯 Goal
Show users ALL editable variables with UI controls for easy remixing

---

## 📋 PROPOSED APPROACH

### Option A: Structured UI Editor (RECOMMENDED) ⭐

**What User Sees:**

```
┌─────────────────────────────────────────┐
│  ✏️ Edit: Ghiblify My Photo             │
├─────────────────────────────────────────┤
│                                         │
│  🎨 DESIGN (Editable)                   │
│  ────────────────────────────────────   │
│  Container Color:                       │
│  [linear-gradient(135deg, #a8edea...]   │
│                                         │
│  Font Color:                            │
│  [white                            ▼]   │
│                                         │
│  Font Family:                           │
│  [system-ui                        ▼]   │
│                                         │
│  🔧 FUNCTIONALITY (Editable)             │
│  ────────────────────────────────────   │
│  Art Styles:                            │
│  ☑ Ghiblify                            │
│  ☑ Feltify                             │
│  ☑ Futurize                            │
│  ☐ Cyberpunk (add new)                 │
│  [+ Add Custom Style]                  │
│                                         │
│  📝 METADATA (Editable)                 │
│  ────────────────────────────────────   │
│  App Name:                             │
│  [Ghiblify My Photo               ]   │
│                                         │
│  Description:                          │
│  [Transform your photos...        ]   │
│                                         │
│  Tags:                                 │
│  #AI #image #art [+ Add Tag]          │
│                                         │
│  🔒 LOCKED (View Only)                  │
│  ────────────────────────────────────   │
│  Container Size: 24px padding, 12px radius │
│  Max Width: 100%                       │
│  Layout: Vertical                      │
│  Tool: image.process                   │
│                                         │
│  [Cancel] [Save as Remix]              │
└─────────────────────────────────────────┘
```

---

### Option B: JSON Editor (SIMPLE)

**What User Sees:**

```
┌─────────────────────────────────────────┐
│  ✏️ Edit: Ghiblify My Photo             │
├─────────────────────────────────────────┤
│                                         │
│  ✅ EDITABLE VARIABLES:                  │
│  ────────────────────────────────────   │
│  {                                      │
│    "design": {                          │
│      "containerColor": "...",           │
│      "fontColor": "white",              │
│      "fontFamily": "system-ui"          │
│    },                                   │
│    "name": "Ghiblify My Photo",        │
│    "description": "Transform...",      │
│    "tags": ["AI", "image", "art"],     │
│    "inputs": {                          │
│      "style": {                         │
│        "options": [...]                 │
│      }                                  │
│    }                                    │
│  }                                      │
│                                         │
│  🔒 LOCKED (Cannot Change):              │
│  ────────────────────────────────────   │
│  • Container size (padding, radius)    │
│  • Max width                           │
│  • Core runtime logic                  │
│  • Tool type (image.process)           │
│                                         │
│  [Cancel] [Save as Remix]              │
└─────────────────────────────────────────┘
```

---

### Option C: Hybrid (BEST UX) ⭐⭐

**Common fields get UI, advanced get JSON:**

```
┌─────────────────────────────────────────┐
│  ✏️ Edit: Ghiblify My Photo             │
├─────────────────────────────────────────┤
│                                         │
│  🎨 DESIGN                               │
│  ────────────────────────────────────   │
│  Background: [Color Picker 🎨]         │
│  Text Color: [white           ▼]       │
│  Font: [system-ui             ▼]       │
│                                         │
│  📝 BASIC INFO                           │
│  ────────────────────────────────────   │
│  Name: [Ghiblify My Photo         ]   │
│  Description: [Textarea...        ]   │
│  Tags: #AI #image #art [+ Add]        │
│                                         │
│  ⚙️ ADVANCED (JSON)                      │
│  ────────────────────────────────────   │
│  [Show Advanced Editor ▼]              │
│                                         │
│  🔒 LOCKED VARIABLES                     │
│  ────────────────────────────────────   │
│  [Show Locked Fields ▼]                │
│                                         │
│  [Cancel] [Save as Remix]              │
└─────────────────────────────────────────┘
```

---

## 🎯 RECOMMENDED: Option C (Hybrid)

**Editable Variables with UI:**

**1. Design (4 fields):**
- `containerColor` → Color picker or gradient input
- `fontColor` → Color picker dropdown
- `fontFamily` → Dropdown (system-ui, monospace, serif, etc.)
- `inputLayout` → Radio buttons (vertical/horizontal)

**2. Metadata (3 fields):**
- `name` → Text input
- `description` → Textarea
- `tags` → Tag chips with add/remove

**3. Functionality (varies by app):**
- For Ghiblify: Style options (checkboxes)
- For Email: Prompt template (textarea)
- For Summarizer: Output format (dropdown)

**Advanced (JSON textarea):**
- Full `inputs` object
- Full `runtime` object (for power users)

**Locked (read-only list):**
- Container size specs
- Max width
- Core tool type
- Layout structure

---

## 📊 What Gets Saved When Remixing

**Current Remix:**
```json
{
  "fork_of": "ghiblify-image",
  "name": "Ghiblify My Photo (Remixed)",
  "description": "... Remixed with: make it pink"
}
```

**Enhanced Remix (with editor):**
```json
{
  "fork_of": "ghiblify-image",
  "name": "Pink Ghiblify",  ← User edited
  "description": "Transform photos with pink theme",  ← User edited
  "tags": ["AI", "image", "art", "pink"],  ← User added "pink"
  "design": {
    "containerColor": "linear-gradient(135deg, #ff69b4 0%, #ff1493 100%)",  ← User changed
    "fontColor": "white",
    "fontFamily": "system-ui"
  },
  "inputs": {
    "style": {
      "options": [
        ...existing styles,
        { "value": "cyberpunk", "label": "🤖 Cyberpunk" }  ← User added
      ]
    }
  }
}
```

---

## 🎨 UI Mockup (Hybrid Approach)

**Trigger:**
- Click "Remix" button
- Opens modal/page with edit icon

**Layout:**

```
┌─────────────────────────────────────────────────┐
│  ✏️ Remix: Ghiblify My Photo              [✕]  │
│                                                 │
│  ┌─────────────────────────────────────────┐   │
│  │ Quick Remix (Natural Language)          │   │
│  │ [Tell me what to change...          ]   │   │
│  │ Examples: "make it pink", "add neon"    │   │
│  └─────────────────────────────────────────┘   │
│                                                 │
│  OR                                             │
│                                                 │
│  ┌─────────────────────────────────────────┐   │
│  │ 🎨 Design Variables                     │   │
│  │ ───────────────────────────────────────│   │
│  │ Background: [🎨 Pick Color]            │   │
│  │ Text Color: [white          ▼]         │   │
│  │ Font: [system-ui            ▼]         │   │
│  └─────────────────────────────────────────┘   │
│                                                 │
│  ┌─────────────────────────────────────────┐   │
│  │ 📝 App Info                             │   │
│  │ ───────────────────────────────────────│   │
│  │ Name: [My Pink Ghiblify        ]       │   │
│  │ Description: [Textarea...      ]       │   │
│  │ Tags: #AI #image [+ Add]               │   │
│  └─────────────────────────────────────────┘   │
│                                                 │
│  [▼ Show Advanced JSON Editor]                 │
│  [▼ Show Locked Variables]                     │
│                                                 │
│  [Cancel]  [Preview]  [Save Remix]             │
└─────────────────────────────────────────────────┘
```

---

## 📝 Editable Variable Categories

### ✅ ALWAYS EDITABLE:

**Design (app.design):**
- containerColor
- fontColor
- fontFamily
- inputLayout

**Metadata:**
- name
- description
- tags

**Functionality (varies):**
- Input options (for select fields)
- Prompt templates
- Default values

### 🔒 NEVER EDITABLE:

**Structure:**
- Container size (padding, borderRadius, minHeight)
- maxWidth
- layoutStructure

**Core Logic:**
- Tool type (llm.complete, image.process)
- Number of steps
- Step order

---

## 🚀 Implementation Scope

### Phase 1: Basic Editor (30 mins)
- Show editable vs locked
- Text inputs for name/description
- Color picker for design
- Tag manager
- JSON fallback

### Phase 2: Advanced Controls (45 mins)
- Dropdown for font/colors
- Checkbox list for options
- Preview mode
- Validation

### Phase 3: Natural Language (15 mins)
- Keep current "make it pink" input
- Parse changes with AI
- Apply to variables

---

## 🎯 MY RECOMMENDATION

**Implement Hybrid (Option C):**

**Phase 1 (Quick - 30 mins):**
- Basic fields with inputs (design, name, desc, tags)
- Advanced = JSON textarea
- Locked = read-only list

**Phase 2 (Later - if users need):**
- Fancier UI (color pickers, etc.)
- More granular controls
- Preview mode

**Keep natural language input too!**
- Most users will still use "make it pink"
- Advanced editor for power users

---

## ✅ PROPOSED IMPLEMENTATION

**Files to Create:**
- `src/components/AdvancedRemixEditor.js` - The modal/editor
- Update `TikTokFeedCard.js` - Add edit icon on remix

**Features:**
1. ✅ Show all editable variables
2. ✅ Input fields for common ones
3. ✅ JSON textarea for advanced
4. ✅ Read-only list of locked vars
5. ✅ Keep natural language option

**Time:** 30-45 minutes

---

**Ready to implement? Or want to adjust the scope?** 🎨

