# 🎨 Advanced Remix Editor - Visual Specification

## 🎯 User Flow

**Current:**
```
Click Remix → Modal with text input → Type "make it pink" → AI parses → Creates remix
```

**Proposed:**
```
Click Remix → See "Quick Remix" OR "✏️ Advanced Editor"
               ↓
         Advanced Editor shows:
         - All editable fields with inputs
         - Locked fields (read-only)
         - Preview of changes
         - Save button
```

---

## 📱 Mockup: Remix Modal (Hybrid Approach)

```
┌─────────────────────────────────────────────────────┐
│  🔄 Remix: Ghiblify My Photo                  [✕]  │
├─────────────────────────────────────────────────────┤
│                                                     │
│  💬 QUICK REMIX (Current Method)                    │
│  ┌───────────────────────────────────────────────┐ │
│  │ What would you like to change?                │ │
│  │ [make it pink                             ]   │ │
│  │ Examples: "add neon style", "dark theme"      │ │
│  │ [Quick Remix →]                               │ │
│  └───────────────────────────────────────────────┘ │
│                                                     │
│  ─────────── OR ───────────                         │
│                                                     │
│  ✏️ ADVANCED EDITOR                        [Expand] │
│                                                     │
└─────────────────────────────────────────────────────┘
```

**When "Expand" clicked:**

```
┌─────────────────────────────────────────────────────┐
│  ✏️ Advanced Editor: Ghiblify My Photo        [✕]  │
├─────────────────────────────────────────────────────┤
│                                                     │
│  Tabs: [Design] [Content] [Options] [Locked]       │
│                                                     │
│  ──── DESIGN TAB ────────────────────────────────   │
│                                                     │
│  Background Color                                   │
│  ┌─────────────────────────────┐                   │
│  │ Gradient Editor             │                   │
│  │ Start: [#a8edea] 🎨         │                   │
│  │ End:   [#fed6e3] 🎨         │                   │
│  │ Angle: [135°    ] ←→        │                   │
│  └─────────────────────────────┘                   │
│                                                     │
│  Text Color                                         │
│  [white                          ▼]                │
│  Options: white, black, #custom...                 │
│                                                     │
│  Font Family                                        │
│  [system-ui                      ▼]                │
│  Options: system-ui, monospace, serif...           │
│                                                     │
│  Preview:                                           │
│  ┌─────────────────────────────┐                   │
│  │  [Gradient background]      │                   │
│  │  Sample text in white       │                   │
│  └─────────────────────────────┘                   │
│                                                     │
│  ──── CONTENT TAB ───────────────────────────────   │
│                                                     │
│  App Name                                           │
│  [My Pink Ghiblify                           ]     │
│                                                     │
│  Description                                        │
│  ┌─────────────────────────────────────────┐       │
│  │ Transform your photos into beautiful    │       │
│  │ pink-themed art...                      │       │
│  │                                         │       │
│  └─────────────────────────────────────────┘       │
│                                                     │
│  Tags                                               │
│  [#AI] [#image] [#art] [#pink ✕]  [+ Add Tag]     │
│                                                     │
│  ──── OPTIONS TAB ───────────────────────────────   │
│                                                     │
│  Art Styles (User can add/remove)                  │
│  ☑ Ghiblify                                        │
│  ☑ Feltify                                         │
│  ☑ Futurize                                        │
│  ☐ Add: [Cyberpunk        ] [+ Add]               │
│                                                     │
│  Default Style                                      │
│  [ghiblify                   ▼]                    │
│                                                     │
│  ──── LOCKED TAB ────────────────────────────────   │
│                                                     │
│  ⚠️ These cannot be changed (ensures consistency)   │
│                                                     │
│  • Container: 24px padding, 12px radius            │
│  • Max Width: 100%                                 │
│  • Layout: Vertical                                │
│  • Tool: image.process (Gemini Vision)             │
│  • Steps: 1                                        │
│                                                     │
│  ─────────────────────────────────────────────────  │
│                                                     │
│  [Cancel]  [Preview Changes]  [Save as Remix]      │
└─────────────────────────────────────────────────────┘
```

---

## 📋 Variable Categories

### ✅ EDITABLE (Show in UI)

**Tier 1 - Simple Inputs:**
```javascript
{
  name: string,                    // Text input
  description: string,             // Textarea
  tags: string[],                  // Tag chips
  design: {
    containerColor: string,        // Gradient/color picker
    fontColor: string,             // Color dropdown
    fontFamily: string,            // Font dropdown
    inputLayout: 'vertical' | 'horizontal'  // Radio buttons
  }
}
```

**Tier 2 - Advanced (JSON or special UI):**
```javascript
{
  inputs: {                        // JSON editor OR
    fieldName: {                   // Dynamic field builder
      type: string,
      options: array,
      default: any
    }
  }
}
```

### 🔒 LOCKED (Read-Only Display)

```javascript
{
  _fixed: {
    containerSize: { padding: 24, borderRadius: 12, minHeight: 200 },
    maxWidth: '100%',
    layoutStructure: 'vertical'
  },
  runtime: {
    engine: 'local',
    steps: [...]     // Can't change tool type/logic
  }
}
```

---

## 🎯 Proposed Implementation Phases

### Phase 1: Basic Editor (30 mins) ⭐ START HERE

**What to build:**
- Modal with tabs (Design, Content, Locked)
- Text inputs for name/description
- Simple color inputs for design
- Tag manager (add/remove chips)
- Read-only list of locked vars
- Keep natural language input at top

**Result:** Power users can edit common variables

### Phase 2: Enhanced UI (45 mins) - LATER

**Add:**
- Color picker component
- Gradient builder
- Font preview
- Style option checkboxes
- Live preview

**Result:** Better UX for design changes

### Phase 3: JSON Editor (15 mins) - OPTIONAL

**Add:**
- JSON textarea for `inputs` object
- Syntax highlighting
- Validation

**Result:** Power users can edit anything

---

## 💡 Smart Defaults

**When user opens editor:**
- Pre-fill with current values
- Show what original app had
- Highlight what they're changing

**When user saves:**
- Validates required fields
- Checks JSON syntax (if using JSON editor)
- Shows preview before saving

---

## 🔧 Technical Implementation

**Component:** `src/components/AdvancedRemixEditor.js`

**Props:**
```javascript
{
  app: object,           // Original app
  onSave: function,      // Save remix callback
  onCancel: function     // Close editor
}
```

**State:**
```javascript
{
  editedName: string,
  editedDescription: string,
  editedTags: string[],
  editedDesign: {...},
  editedInputs: {...},   // Advanced
  showAdvanced: boolean,
  showLocked: boolean
}
```

---

## ✅ RECOMMENDED FOR SIGN-OFF

**Start with Phase 1 (Hybrid Basic):**

**Features:**
1. ✅ Tabs: Design | Content | Locked
2. ✅ Design: 4 simple inputs (colors, font)
3. ✅ Content: Name, description, tags
4. ✅ Locked: Read-only list
5. ✅ Keep natural language option
6. ✅ Preview button
7. ✅ Save creates remix with all changes

**Time:** 30-45 minutes  
**Complexity:** Medium  
**Value:** High - power users love it!

**Add later if users request:**
- Color pickers
- Gradient builder
- JSON editor
- Input option builder

---

**Ready to implement Phase 1?** 🚀

