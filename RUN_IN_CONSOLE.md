# 🖥️ How to Run JavaScript in Browser Console

## Step-by-Step with Screenshots

### Step 1: Open Developer Tools
**On Mac:** Press `Command + Option + J`
**On Windows:** Press `F12` or `Ctrl + Shift + J`

Or:
- Right-click anywhere on the page
- Click "Inspect" or "Inspect Element"
- This opens DevTools

### Step 2: Find the Console Tab
At the top of DevTools, you'll see tabs:
```
Elements | Console | Sources | Network | ...
         ^^^^^^^^
         Click this one!
```

### Step 3: You'll See a Prompt Like This:
```
> _
```
(The `>` with a blinking cursor)

### Step 4: Copy This Code
```javascript
fetch('/api/sync-profile', { 
  method: 'POST',
  credentials: 'include'
})
.then(r => r.json())
.then(d => {
  if (d.ok) {
    console.log('✅ SUCCESS! Profile created:', d.profile);
  } else {
    console.error('❌ Error:', d.error);
  }
});
```

### Step 5: Paste at the `>` Prompt
Click in the console where you see `>`

Press `Command + V` (Mac) or `Ctrl + V` (Windows)

### Step 6: Press Enter
The code will run!

### Step 7: You Should See:
```javascript
✅ SUCCESS! Profile created: {
  id: "user_2abc123...",
  username: "test2",
  email: "test2@example.com",
  display_name: "Test2",
  avatar_url: "https://..."
}
```

---

## 📍 Visual Guide

```
┌─────────────────────────────────────────────────────────────┐
│  http://localhost:3000                                  [×] │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  [Your Website Content Here]                                │
│                                                             │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│ Elements │ Console │ Sources │ Network │ ...                │
│          └─────────┘                                        │
├─────────────────────────────────────────────────────────────┤
│ > _   ← Paste the code here and press Enter                │
│                                                             │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 🎯 Quick Reference

**Where:** Browser Console tab in DevTools

**How to Open:**
- Mac: `Cmd + Option + J`
- Windows: `F12` or `Ctrl + Shift + J`
- Or: Right-click → Inspect → Console tab

**What to Do:**
1. Click in the console (where you see `>`)
2. Paste the code
3. Press Enter
4. Wait for response

---

## ✅ If It Works, You'll See:
```
✅ SUCCESS! Profile created: {...}
```

## ❌ If It Doesn't Work, You'll See:
```
❌ Error: [some error message]
```

**Copy the error message and let me know!**

---

## 🔍 Alternative: Direct URL Method

If console is confusing, try this:

1. Make a new file: `/Users/miguel/Desktop/appfeed-mvp/sync.html`

```html
<!DOCTYPE html>
<html>
<head><title>Profile Sync</title></head>
<body>
  <h1>Profile Sync</h1>
  <button onclick="syncProfile()">Click to Sync Profile</button>
  <pre id="result"></pre>
  
  <script>
    async function syncProfile() {
      const result = document.getElementById('result');
      result.textContent = 'Syncing...';
      
      try {
        const response = await fetch('/api/sync-profile', { 
          method: 'POST',
          credentials: 'include'
        });
        const data = await response.json();
        
        if (data.ok) {
          result.textContent = '✅ SUCCESS!\n\n' + JSON.stringify(data, null, 2);
          result.style.color = 'green';
        } else {
          result.textContent = '❌ ERROR:\n\n' + JSON.stringify(data, null, 2);
          result.style.color = 'red';
        }
      } catch (error) {
        result.textContent = '❌ Network Error:\n\n' + error.message;
        result.style.color = 'red';
      }
    }
  </script>
</body>
</html>
```

2. Open in browser: `http://localhost:3000/sync.html`
3. Click the button
4. See result on the page!

---

## 🚨 Troubleshooting

### "Uncaught SyntaxError"
- You pasted it wrong
- Make sure you copied the ENTIRE code block
- Try again

### "NetworkError" or "Failed to fetch"
- Dev server not running
- Check: `http://localhost:3000` loads
- Restart server: `npm run dev`

### "401 Unauthorized"
- Not logged in
- Go to `http://localhost:3000/sign-in`
- Sign in as test2
- Try again

### "405 Method Not Allowed" (if using GET)
- Use the POST method in the fetch
- The code above is correct (uses POST)

---

**The console is the easiest way - just press Cmd+Option+J and paste!** 🚀
