# 📋 COMPLETE EDITABLE VARIABLES LIST

## 🎨 Design Variables (app.design)

### Container Styling
- **`design.containerColor`** - App container background
  - Type: CSS gradient or #hex color
  - Example: `"linear-gradient(135deg, #667eea 0%, #764ba2 100%)"`
  - Example: `"#ff6b6b"`
  - Controls: Background of app output container

### Typography
- **`design.fontColor`** - Text color inside app
  - Type: Color name or #hex
  - Example: `"white"`, `"#2d3748"`
  - Controls: All text color in app output

- **`design.fontFamily`** - Font family
  - Type: Font stack string
  - Example: `"system-ui"`, `"monospace"`, `"serif"`
  - Controls: Font used in app output

### Layout
- **`design.inputLayout`** - Input field arrangement
  - Type: "vertical" | "horizontal"
  - Example: `"vertical"`
  - Controls: How input fields are arranged

---

## 📝 Content Variables

### App Metadata
- **`name`** - App title/name
  - Type: String
  - Example: `"My Pink Ghiblify"`
  - Controls: Title shown everywhere (feed, profile, detail)

- **`description`** - App description  
  - Type: String
  - Example: `"Transform your photos with pink theme"`
  - Controls: Description text in feed/detail

- **`tags`** - Tags/categories
  - Type: Array of strings
  - Example: `["AI", "image", "art", "pink"]`
  - Controls: Tag pills, search filtering

---

## 🖼️ Visual Assets

### Preview Image
- **`preview_url`** - Nano Banana generated image URL
  - Type: String (URL)
  - Example: `"https://...supabase.co/storage/.../app-id.png"`
  - Controls: Card preview image in feed/profile
  - Auto-generated: Yes (via Gemini API)

- **`preview_gradient`** - Fallback gradient
  - Type: CSS gradient
  - Example: `"linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)"`
  - Controls: Background if no image

### Overlay/Branding
- **`preview_type`** - Preview media type
  - Type: "image" | "video"
  - Example: `"image"`
  - Locked: Usually stays "image"

---

## 🔒 LOCKED Variables (Cannot Edit)

### Container Structure
- **Container padding** - 24px (fixed)
- **Container borderRadius** - 12px (fixed)
- **Container minHeight** - 200px (fixed)
- **Max width** - 100% (fixed)
- **Layout structure** - Vertical (fixed)

### Runtime Logic
- **`runtime.engine`** - Execution engine ("local")
- **`runtime.steps`** - Workflow steps (array)
- **`runtime.steps[].tool`** - Tool type ("llm.complete", "image.process")
- **Number of steps** - Cannot change count
- **Step order** - Cannot rearrange

### Inputs/Outputs
- **`inputs`** - Input field definitions (advanced users can edit JSON)
- **`outputs`** - Output field definitions
- **`demo`** - Demo/sample data

---

## 🎯 Complete Editable JSON Example

```json
{
  "name": "My Custom App",
  "description": "A customized version with my changes",
  "design": {
    "containerColor": "linear-gradient(135deg, #ff6b6b 0%, #ee5a6f 100%)",
    "fontColor": "white",
    "fontFamily": "system-ui",
    "inputLayout": "vertical"
  },
  "tags": ["AI", "custom", "remix"],
  "preview_gradient": "linear-gradient(135deg, #ff6b6b 0%, #ee5a6f 100%)"
}
```

---

## 🎨 Variable Application

**Where They're Used:**

### In Feed Cards (VideoPreview.js):
- `preview_url` → Card background image
- `preview_gradient` → Fallback if no image
- `name` → Title text
- `description` → Description text
- `tags` → Tag pills

### In App Output (AppOutput.js):
- `design.containerColor` → Container background
- `design.fontColor` → Text color
- `design.fontFamily` → Font
- (Output content here)

### In App Try Modal:
- `name` → Modal title
- `inputs` → Form fields
- (App runs here)

---

**Total Editable:** 9 variables  
**Total Locked:** 15+ structural variables

