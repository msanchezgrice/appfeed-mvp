# 🔍 Live Site Audit Checklist - LLM Integration

## Site Information
- **Live URL**: https://www.clipcade.com
- **Deployment Status**: ✅ Pushed to GitHub (commit b8c4e05)
- **Changes Included**: Chat LLM integration + Wordle LLM word generation

---

## 🎯 Apps to Test

### 1. **Chat App** - `chat-encouragement`
**App ID**: `chat-encouragement`  
**Name**: Live Encouragement Chat  
**URL**: https://www.clipcade.com/app/chat-encouragement

### 2. **Wordle App** - `wordle-daily-themed`
**App ID**: `wordle-daily-themed`  
**Name**: Daily Wordle (Themed)  
**URL**: https://www.clipcade.com/app/wordle-daily-themed

---

## ✅ Test Cases

### 🗨️ Chat App Tests

#### Test 1: Basic Chat Conversation
- [ ] Navigate to https://www.clipcade.com/app/chat-encouragement
- [ ] Click "Try" button
- [ ] Select mood: **Encouraging**
- [ ] Enter topic: "I'm working on a new project"
- [ ] Select tone: **Medium**
- [ ] Click "Run" / "Try It"
- [ ] **Expected**: Chat interface opens with agent's first encouraging message
- [ ] **Verify**: Message is contextual and matches encouraging mood

#### Test 2: Conversation Memory
- [ ] In the same chat, send: "What should I focus on first?"
- [ ] **Expected**: Agent responds with context about the project you mentioned
- [ ] Send: "What did I just ask you about?"
- [ ] **Expected**: Agent should remember it's about the project
- [ ] **Verify**: LLM maintains conversation context across multiple turns

#### Test 3: Different Moods
- [ ] Try again with mood: **Uplifting**
- [ ] Topic: "I completed a milestone today"
- [ ] **Expected**: Response is uplifting and celebratory
- [ ] **Verify**: Tone matches selected mood

#### Test 4: Tone Strength
- [ ] Test with **Soft** tone strength
- [ ] **Expected**: Responses are gentle and subtle
- [ ] Test with **Strong** tone strength
- [ ] **Expected**: Responses are emphatic and pronounced

#### Test 5: Multi-turn Conversation
- [ ] Have a 5+ message conversation
- [ ] Reference something from the 3rd message in the 5th
- [ ] **Expected**: Agent remembers and maintains full context

#### Test 6: Error Handling (Optional - requires API key removal)
- [ ] If no API key configured:
  - [ ] **Expected**: Friendly message about adding OpenAI key
  - [ ] Message includes link to settings or sign-in

---

### 🎲 Wordle App Tests

#### Test 1: Basic Wordle Load
- [ ] Navigate to https://www.clipcade.com/app/wordle-daily-themed
- [ ] Click "Try" button
- [ ] Select theme: **Animals**
- [ ] Click "Run" / "Try It"
- [ ] **Expected**: Loading message "Loading words for animals... 🎲"
- [ ] **Expected**: Wordle grid appears after 2-5 seconds
- [ ] **Verify**: Shows "Theme: animals • 5-letter word"

#### Test 2: Word Generation Verification
- [ ] Once loaded, note the theme shown
- [ ] Try guessing common animal words: "tiger", "zebra", "whale", "panda"
- [ ] **Expected**: Word feedback (green/yellow/gray letters)
- [ ] **Verify**: Word is relevant to animals theme
- [ ] **Verify**: Word is exactly 5 letters

#### Test 3: Different Themes
- [ ] Test with theme: **Foods**
- [ ] **Expected**: New word generation for foods theme
- [ ] Try guessing: "pizza", "pasta", "curry", "sushi"
- [ ] **Verify**: Word matches foods theme

- [ ] Test with theme: **Cities**
- [ ] Try guessing: "paris", "tokyo", "miami"
- [ ] **Verify**: Word matches cities theme

- [ ] Test with theme: **Verbs**
- [ ] Try guessing: "build", "write", "learn"
- [ ] **Verify**: Word matches verbs theme

- [ ] Test with theme: **Brands**
- [ ] Try guessing: "apple", "tesla", "adobe"
- [ ] **Verify**: Word matches brands theme

#### Test 4: Daily Consistency
- [ ] Load the same theme twice (refresh page)
- [ ] **Expected**: Same word appears (consistent per day)
- [ ] **Verify**: Daily word rotation works

#### Test 5: Gameplay Mechanics
- [ ] Enter a 5-letter guess
- [ ] **Expected**: Letters colored correctly (green=correct position, yellow=wrong position, gray=not in word)
- [ ] Complete 6 guesses or win
- [ ] **Expected**: End message shows either "🎉 Correct!" or "❌ Out of tries. Word was [word]."

#### Test 6: Fallback Behavior
- [ ] If LLM generation fails (API error):
- [ ] **Expected**: Game still works with fallback word list
- [ ] **Verify**: No broken UI, graceful degradation

---

## 🔧 Backend Verification

### Check Network Requests (Browser DevTools)

#### For Chat App:
1. Open Browser DevTools (F12) → Network tab
2. Start a chat conversation
3. Look for requests to: `/api/chat`
4. **Verify Request Payload**:
   ```json
   {
     "mood": "encouraging",
     "tone_strength": "medium",
     "messages": [
       {"role": "user", "content": "Hello"},
       {"role": "assistant", "content": "Hi there!"},
       {"role": "user", "content": "How are you?"}
     ]
   }
   ```
5. **Verify Response**:
   ```json
   {
     "ok": true,
     "message": "I'm doing great! ...",
     "output": {"markdown": "..."}
   }
   ```

#### For Wordle App:
1. Open Browser DevTools → Network tab
2. Load the Wordle app
3. Look for request to: `/api/wordle/generate-words`
4. **Verify Request Payload**:
   ```json
   {
     "theme": "animals"
   }
   ```
5. **Verify Response**:
   ```json
   {
     "ok": true,
     "words": ["tiger", "zebra", "otter", ...],
     "theme": "animals",
     "count": 50,
     "cacheKey": "animals-12345"
   }
   ```

---

## 🐛 Common Issues & Solutions

### Issue: Chat doesn't respond
**Symptoms**: Spinning loader, no response
**Check**:
- [ ] Browser console for errors
- [ ] Network tab for 500/401 errors
- [ ] API key is configured (either user BYOK or platform fallback)

**Solution**: 
- Check `OPENAI_API_KEY` or `OPENAI_FALLBACK_API_KEY` environment variable
- Verify Supabase connection for BYOK

### Issue: Wordle won't load
**Symptoms**: Stuck on "Loading words..."
**Check**:
- [ ] Browser console for errors
- [ ] Network request to `/api/wordle/generate-words`
- [ ] Response status code

**Solution**:
- Should fallback to hardcoded words if LLM fails
- Check API key configuration

### Issue: Chat loses context
**Symptoms**: Agent forgets previous messages
**Check**:
- [ ] Network payload includes full `messages` array
- [ ] Each message has proper `role` and `content`

**Solution**:
- Verify `ChatOutput` component is sending `newMessages` not just last message
- Check API receives full transcript

### Issue: Wordle shows wrong theme words
**Symptoms**: Getting "foods" words when selected "animals"
**Check**:
- [ ] Request payload has correct theme
- [ ] Cache key matches theme

**Solution**:
- Clear browser cache
- Check API response theme field

---

## 📊 Success Criteria

### Chat App ✅
- [x] LLM responds to first message
- [x] LLM maintains context across 5+ messages
- [x] Different moods produce different tones
- [x] Tone strength affects response style
- [x] Error handling is graceful
- [x] Response time < 10 seconds

### Wordle App ✅
- [x] Words load within 5 seconds
- [x] Words are relevant to selected theme
- [x] All words are exactly 5 letters
- [x] Same word appears for same day + theme
- [x] Different themes produce different words
- [x] Fallback works if LLM fails
- [x] Gameplay mechanics work correctly

---

## 🎬 Demo Script for Video/Screenshot

### Chat Demo (30 seconds):
1. Open chat app
2. Select "Encouraging" mood
3. Topic: "I'm learning to code"
4. First message: Agent encourages
5. Second message: "What should I learn first?"
6. Agent responds with context about coding
7. Third message: "What did we just talk about?"
8. Agent remembers it's about learning to code

### Wordle Demo (30 seconds):
1. Open Wordle app
2. Select "Animals" theme
3. Show loading state
4. Wordle grid appears
5. Guess "tiger"
6. Show color feedback
7. Either win or lose after 6 tries
8. Switch to "Foods" theme
9. Show new word generated

---

## 🔐 Environment Variables Check

Make sure these are set in production:

```bash
# Required
OPENAI_API_KEY=sk-...                    # Platform fallback key for Try mode
# OR
OPENAI_FALLBACK_API_KEY=sk-...          # Explicit fallback key

# Optional (defaults)
OPENAI_API_BASE=https://api.openai.com  # OpenAI API endpoint
OPENAI_MODEL=gpt-4o-mini                 # Model to use

# Supabase (required for BYOK)
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
```

---

## 📝 Audit Report Template

Copy this after testing:

```
## Audit Report - [Date]

### Chat App
- [ ] ✅ Basic conversation works
- [ ] ✅ Context retention works
- [ ] ✅ Mood variations work
- [ ] ⚠️ Issue: [describe any issues]

### Wordle App
- [ ] ✅ Word generation works
- [ ] ✅ Theme-specific words
- [ ] ✅ Daily consistency works
- [ ] ⚠️ Issue: [describe any issues]

### API Performance
- Chat avg response time: ____ seconds
- Wordle load time: ____ seconds

### Issues Found
1. [Issue description]
2. [Issue description]

### Overall Status
- [ ] ✅ Production Ready
- [ ] ⚠️ Minor issues, functional
- [ ] ❌ Critical issues, needs fix
```

---

## 🚀 Next Steps After Audit

1. **If all tests pass**:
   - ✅ Mark as production ready
   - Share with users
   - Monitor API usage

2. **If issues found**:
   - Document in GitHub Issues
   - Check server logs
   - Verify environment variables
   - Test API endpoints directly

3. **For monitoring**:
   - Watch OpenAI API usage/costs
   - Monitor response times
   - Track error rates
   - User feedback

---

## 📞 Support Resources

- **Logs**: Check Vercel/hosting platform logs
- **API**: Test endpoints with curl/Postman
- **LLM**: Check OpenAI dashboard for API calls
- **Database**: Check Supabase logs for BYOK issues

---

Good luck with the audit! 🎉


