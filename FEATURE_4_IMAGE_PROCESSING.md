# 📸 Feature #4: Image Processing with Gemini Vision

## 🎯 Goal
Add image input and processing capabilities using Gemini 2.5 Flash

## 🔧 Implementation Plan

### 1. New Tool: `image.process`

**Location:** `src/lib/tools.js`

**Capabilities:**
- Accept image input (file upload or URL)
- Process with Gemini Vision API
- Edit, enhance, analyze images
- Generate variations
- Extract text (OCR)
- Describe images

**Example Tool:**
```javascript
export async function tool_image_process({ userId, args, mode, supabase }) {
  const imageInput = args.image; // base64 or URL
  const instruction = args.instruction; // "enhance", "describe", "extract text"
  
  // Call Gemini Vision API
  const geminiKey = process.env.GEMINI_API_KEY;
  
  const response = await fetch(
    'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent',
    {
      method: 'POST',
      headers: {
        'x-goog-api-key': geminiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [{
          parts: [
            { text: instruction },
            {
              inlineData: {
                mimeType: 'image/jpeg',
                data: imageInput // base64
              }
            }
          ]
        }]
      })
    }
  );
  
  const result = await response.json();
  return { output: result.candidates[0].content.parts[0].text };
}
```

---

### 2. New Input Type: Image Upload

**Location:** `src/components/AppForm.js`

**Add:**
```javascript
// Handle image inputs
{input.type === 'image' && (
  <input
    type="file"
    accept="image/*"
    onChange={async (e) => {
      const file = e.target.files[0];
      const base64 = await fileToBase64(file);
      setValues({ ...values, [key]: base64 });
    }}
  />
)}
```

---

### 3. Example Apps

**Image Enhancer:**
```json
{
  "name": "Photo Enhancer",
  "inputs": {
    "image": {
      "type": "image",
      "required": true
    },
    "enhancement": {
      "type": "string",
      "enum": ["sharpen", "brighten", "artistic"]
    }
  },
  "runtime": {
    "steps": [{
      "tool": "image.process",
      "args": {
        "image": "{{image}}",
        "instruction": "Enhance this image: {{enhancement}}"
      }
    }]
  }
}
```

**Image to Text:**
```json
{
  "name": "Image OCR",
  "inputs": {
    "image": { "type": "image", "required": true }
  },
  "runtime": {
    "steps": [{
      "tool": "image.process",
      "args": {
        "image": "{{image}}",
        "instruction": "Extract all text from this image"
      }
    }]
  }
}
```

---

### 4. API Reference

**Gemini Vision API:**
- Model: `gemini-2.5-flash` (supports vision)
- Cost: ~$0.0025 per image
- Capabilities: Describe, edit, analyze, OCR
- Max size: 20MB
- Formats: JPEG, PNG, WebP, GIF

**Reference:** https://ai.google.dev/gemini-api/docs/vision

---

## 🎨 User Experience

**In App:**
1. User uploads image
2. Selects action (enhance/describe/extract)
3. Clicks Run
4. Gets AI-processed result
5. Can download or share

**Use Cases:**
- Photo enhancement
- OCR / text extraction
- Image description for accessibility
- Style transfer
- Object removal
- Background changes

---

## 📊 Implementation Time

**Estimated:** 2-3 hours

**Breakdown:**
- Image tool function: 45 min
- File upload component: 30 min
- Base64 conversion: 15 min
- Example apps: 30 min
- Testing: 30 min

---

## ✅ Ready to Implement

**Dependencies:**
- ✅ Gemini API key (already in Vercel)
- ✅ Supabase for storage
- ✅ Existing tool system

**WAITING FOR YOUR GO-AHEAD TO START!** 📸

