# 🎨 App Design Variables Specification

## Design Variables System

### ✅ CONFIGURABLE (Can be changed via remix)

**Container Styling:**
- `containerColor` - Background gradient/color
  - Default: `linear-gradient(135deg, #667eea 0%, #764ba2 100%)`
  - Example remix: "make it green" → `linear-gradient(135deg, #10b981 0%, #059669 100%)`

**Typography:**
- `fontColor` - Text color
  - Default: `white`
  - Example remix: "make text black" → `#000000`

- `fontFamily` - Font stack
  - Default: `inherit`
  - Example remix: "use mono font" → `monospace`

**Layout:**
- `inputLayout` - Input field arrangement
  - Default: `vertical`
  - Options: `vertical`, `horizontal`, `grid`
  - Example remix: "inputs side by side" → `horizontal`

---

### 🔒 FIXED (Cannot be changed - ensures consistency)

**Structure:**
- `containerSize` - Padding, border radius, min height
  - Fixed: `{ padding: 24px, borderRadius: 12px, minHeight: 200px }`
  - Reason: Maintains card consistency in feed

- `maxWidth` - Maximum container width
  - Fixed: `100%`
  - Reason: Responsive behavior

- `layoutStructure` - Overall layout type
  - Fixed: `vertical`
  - Reason: TikTok-style vertical scroll

---

## Database Schema

```sql
apps.design JSONB {
  // CONFIGURABLE
  "containerColor": "linear-gradient(...)",
  "fontColor": "#ffffff",
  "fontFamily": "inherit",
  "inputLayout": "vertical",
  
  // FIXED (defined but not changeable)
  "_fixed": {
    "containerSize": { "padding": 24, "borderRadius": 12, "minHeight": 200 },
    "maxWidth": "100%",
    "layoutStructure": "vertical"
  }
}
```

---

## Remix Examples

**User says:** "make it green"
```json
{
  "containerColor": "linear-gradient(135deg, #10b981 0%, #059669 100%)"
}
```

**User says:** "dark theme with yellow text"
```json
{
  "containerColor": "#1a1a1a",
  "fontColor": "#fbbf24"
}
```

**User says:** "use a mono font"
```json
{
  "fontFamily": "monospace"
}
```

**User says:** "bigger container" ❌
```
NOT ALLOWED - containerSize is FIXED
```

---

## Implementation

**Stored in:** `apps.design` JSONB column  
**Applied in:** `components/AppOutput.js`  
**Used by:** LLM prompts for context  
**Remixable:** Via natural language ("make it blue")  

---

**This gives users creative freedom while maintaining UX consistency!** 🎨

