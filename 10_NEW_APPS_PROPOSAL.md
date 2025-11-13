# 🎯 10 NEW MINI-APPS PROPOSAL

**Using:** ALL variables (including new ones)  
**Purpose:** Showcase diverse functionality  
**Ready for:** LLM generation

---

## 1. 🎮 Mood-Based Game Picker
**Icon:** 🎮  
**Description:** Get personalized game recommendations based on your current mood  
**Tags:** games, mood, recommendations  
**New Variables Used:** icon, card_theme, modal_theme

**Design:**
- Card: Orange gradient
- Modal: Dark blue with orange accents
- Container: Warm orange output

**Inputs:**
- Mood: Select (happy/sad/energetic/chill)
- Platform: Select (mobile/desktop/console)

**Tool:** llm.complete  
**Prompt:** "Recommend 5 games for someone feeling {{mood}} on {{platform}}"

---

## 2. 💌 Love Letter Generator
**Icon:** 💌  
**Description:** Create heartfelt, personalized love letters with AI  
**Tags:** creative, writing, relationships  
**New Variables Used:** card_theme (pink), author attribution

**Design:**
- Card: Pink/red gradient
- Container: Soft pink
- Font: Serif (romantic)

**Inputs:**
- Recipient name
- Relationship: Select (partner/friend/family)
- Tone: Select (romantic/playful/sincere)

**Tool:** llm.complete  
**Prompt:** "Write a {{tone}} love letter to {{name}} (my {{relationship}})"

---

## 3. 🧮 Tip Calculator Pro
**Icon:** 🧮  
**Description:** Calculate tips, split bills, and see detailed breakdowns  
**Tags:** utility, math, dining  
**New Variables Used:** input_theme (green), modal.buttonColor

**Design:**
- Card: Green gradient
- Container: Clean white background
- Font: Monospace (for numbers)

**Inputs:**
- Bill amount: Number
- Tip percentage: Select (15%/18%/20%/25%)
- Split between: Number

**Tool:** llm.complete  
**Prompt:** "Calculate tip for ${{amount}} at {{percent}}% split {{people}} ways. Show breakdown."

---

## 4. 🎨 Color Palette Generator
**Icon:** 🎨  
**Description:** Generate beautiful color palettes from descriptions or moods  
**Tags:** design, colors, creative  
**New Variables Used:** ALL new variables showcase

**Design:**
- Card: Rainbow gradient
- Container: Multi-color showcase
- Input: Custom border colors

**Inputs:**
- Mood/theme: String
- Number of colors: Select (3/5/7)

**Tool:** llm.complete  
**Prompt:** "Generate {{count}} hex colors for: {{theme}}. Return as list with names."

---

## 5. 📊 Habit Tracker Insights
**Icon:** 📊  
**Description:** Get AI insights on your habit tracking data  
**Tags:** productivity, habits, analytics  
**New Variables Used:** modal_theme, author

**Design:**
- Card: Blue/purple gradient
- Container: Data visualization colors
- Font: System (clean)

**Inputs:**
- Habit: String
- Days tracked: Number
- Success rate: Number (0-100)

**Tool:** llm.complete  
**Prompt:** "Analyze habit: {{habit}}, {{days}} days, {{rate}}% success. Give insights."

---

## 6. 🌙 Dream Interpreter
**Icon:** 🌙  
**Description:** Get symbolic interpretations of your dreams  
**Tags:** wellbeing, dreams, mystical  
**New Variables Used:** card_theme (purple/dark), custom fonts

**Design:**
- Card: Deep purple/black gradient
- Container: Mystical purple
- Font: Serif (mystical feel)

**Inputs:**
- Dream description: Textarea
- Mood upon waking: Select

**Tool:** llm.complete  
**Prompt:** "Interpret this dream symbolically: {{dream}}. Woke feeling {{mood}}."

---

## 7. 🍳 Recipe Simplifier
**Icon:** 🍳  
**Description:** Simplify complex recipes into easy step-by-step instructions  
**Tags:** cooking, food, productivity  
**New Variables Used:** input_theme, all card variables

**Design:**
- Card: Orange/yellow gradient (warm)
- Container: Recipe card style
- Font: Sans-serif (readable)

**Inputs:**
- Recipe URL or text: Textarea
- Servings: Number

**Tool:** llm.complete (with web search for URLs)  
**Prompt:** "Simplify this recipe for {{servings}} servings: {{recipe}}"

---

## 8. 💰 Investment Idea Analyzer
**Icon:** 💰  
**Description:** Get AI analysis of investment ideas and risk factors  
**Tags:** finance, analysis, investing  
**New Variables Used:** modal.backgroundColor, professional theme

**Design:**
- Card: Green/blue gradient (money)
- Container: Professional dark
- Font: System (serious)

**Inputs:**
- Investment idea: Textarea
- Risk tolerance: Select (low/medium/high)

**Tool:** llm.complete  
**Prompt:** "Analyze investment: {{idea}}. Risk tolerance: {{tolerance}}. Give pros/cons."

---

## 9. 🎭 Character Name Generator
**Icon:** 🎭  
**Description:** Generate creative character names for stories, games, or RPGs  
**Tags:** creative, writing, gaming  
**New Variables Used:** All theming variables

**Design:**
- Card: Purple/pink gradient (creative)
- Container: Fantasy-themed
- Font: Serif (story-like)

**Inputs:**
- Character type: String (e.g., "elf warrior")
- Genre: Select (fantasy/sci-fi/modern)
- Gender: Select

**Tool:** llm.complete  
**Prompt:** "Generate 10 {{genre}} names for a {{gender}} {{type}}. Include meanings."

---

## 10. 🎵 Playlist Mood Matcher
**Icon:** 🎵  
**Description:** Get song recommendations that match your current vibe  
**Tags:** music, mood, recommendations  
**New Variables Used:** Complete variable set

**Design:**
- Card: Vibrant gradient (music vibes)
- Container: Album art inspired
- Font: Modern sans

**Inputs:**
- Current mood: String
- Genre preference: Select (any/pop/rock/electronic/etc.)
- Activity: Select (working/exercising/relaxing)

**Tool:** llm.complete  
**Prompt:** "Recommend 10 {{genre}} songs for {{mood}} while {{activity}}. Include artists."

---

## 📊 Variable Coverage

**These 10 apps use:**
- ✅ ALL 9 current variables
- ✅ ALL 6 new variables (icon, card_theme, modal_theme, input_theme, author)
- ✅ Diverse use cases (creative, utility, analysis, fun)
- ✅ Different color schemes
- ✅ All 3 current tools
- ✅ Various input types

**Diversity:**
- 4 Creative (Love Letter, Color Palette, Character Names, Dream Interpreter)
- 3 Utility (Tip Calculator, Recipe Simplifier, Habit Tracker)
- 2 Analysis (Investment Analyzer, Mood Matcher)
- 1 Gaming (Game Picker)

**Color Variety:**
- Orange, Pink, Green, Blue, Purple, Rainbow, Yellow, Professional

---

## ✅ READY FOR YOUR APPROVAL

**If approved, I'll:**
1. Add all 6 missing variables to schema ✅
2. Update components to use new variables
3. Create guide page at /guide (linked from /publish)
4. Generate all 10 apps via Supabase CLI
5. Test each one
6. Deploy

**Estimated Time:** 2-3 hours for everything

**Approve to proceed?** 🚀

