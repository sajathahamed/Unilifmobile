# Gemini API Setup & Testing Guide

## Step 1: Get a Gemini API Key

1. Go to [Google AI Studio](https://ai.google.dev/aistudio)
2. Click "Get API key" button
3. Create a new API key in your Google Cloud project
4. Copy the API key

## Step 2: Configure Environment Variables

### Option A: Using .env file (Recommended for Expo)
```bash
# Create or edit .env file in project root
EXPO_PUBLIC_GOOGLE_GENERATIVE_AI_API_KEY=your_api_key_here
```

### Option B: Using .env.local (Git ignored)
```bash
EXPO_PUBLIC_GOOGLE_GENERATIVE_AI_API_KEY=your_api_key_here
```

### Reload App
```bash
# After updating .env, restart Expo
expo start --clear
```

## Step 3: Verify Configuration

Check if Gemini is configured:
```typescript
import { isGeminiConfigured } from '@services/gemini-trip-planner';

console.log(isGeminiConfigured()); // Should log: true
```

## Step 4: Test Trip Plan Generation

### Manual Test in PlannerScreen
1. Open the app
2. Tap "+" to create new trip
3. Fill in:
   - **Destination:** "Ella" (premium tier)
   - **Days:** "3"
   - **Budget:** "50000" (LKR)
   - **Travelers:** "2"
   - **Travel Type:** "couple"
   - **Room Type:** "standard"
   - **Transport:** "car"
   - **Food:** "mixed"
4. Tap "Generate Plan"
5. Check console logs for:
   ```
   [TRIP PLANNER] Destination: Ella
   [TRIP PLANNER] Days: 3 Budget: 50000 Travelers: 2
   [GEMINI] Generating trip plan for: Ella
   [TRIP PLANNER] ✓ Plan received!
   [TRIP PLANNER] Summary: [AI-generated summary]
   [TRIP PLANNER] Total Cost: XXXXX LKR
   [TRIP PLANNER] Budget Sufficient: true/false
   ```

### Test Data Sets

#### Test 1: Premium Destination (Ella) - Should Succeed
```
Destination: Ella
Days: 3
Budget: 50000 (well-budgeted: 16,667/day)
Travelers: 2
Travel Type: couple
Expected: ✓ Budget sufficient
```

#### Test 2: Premium Destination - Budget Warn
```
Destination: Ella
Days: 3
Budget: 30000 (under-budgeted: 10,000/day, min 15k required)
Travelers: 2
Travel Type: couple
Expected: ⚠ Budget insufficient warning (should show dialog)
         User can continue anyway
         Plan saved with budget_sufficient: false
```

#### Test 3: Mid-tier Destination (Kandy)
```
Destination: Kandy
Days: 3
Budget: 35000 (good: 11,666/day, min 10k required)
Travelers: 3
Travel Type: family
Expected: ✓ Budget sufficient
```

#### Test 4: Budget Destination (Jaffna)
```
Destination: Jaffna
Days: 3
Budget: 20000 (good: 6,666/day, min 6k required)
Travelers: 1
Travel Type: solo
Expected: ✓ Budget sufficient
```

## Step 5: Validation Testing

### Test Invalid Inputs

#### Destination Field
```
Input: "" → Error: "Destination is required"
Input: "a" → Error: "Destination must be at least 2 characters"
Input: "Ella@123" → Error: "Destination can only contain letters, spaces, and hyphens"
```

#### Days Field
```
Input: "" → Error: "Duration is required"
Input: "abc" → Error: "Duration must be a number"
Input: "0" → Error: "Trip must be at least 1 day"
Input: "31" → Error: "Maximum 30 days for planning"
```

#### Budget Field
```
Input: "" → Error: "Budget is required"
Input: "abc" → Error: "Budget must be a valid number"
Input: "-1000" → Error: "Budget must be positive"
Input: "9999999999" → Error: "Budget exceeds reasonable limit (5M LKR)"
```

#### Travelers Field
```
Input: "" → Error: "Number of travelers is required"
Input: "0" → Error: "At least 1 traveler required"
Input: "21" → Error: "Maximum 20 travelers for planning"
```

#### Travel Type Field (Dependent Validation)
```
Scenario: Travelers=1, Travel Type=couple
Expected: Error: "Couple travel must be 2 people"

Scenario: Travelers=2, Travel Type=family
Expected: Error: "Family travel requires 3+ people"

Scenario: Travelers=1, Travel Type=solo
Expected: ✓ Valid
```

## Step 6: Check Console Logs

### Expected Log Pattern (Success):
```
[TRIP PLANNER] Starting Gemini plan generation...
[TRIP PLANNER] Destination: Ella
[TRIP PLANNER] Days: 3 Budget: 50000 Travelers: 2
[GEMINI] Generating trip plan for: Ella
[GEMINI] Budget: 50000 LKR
[GEMINI] Response received, parsing JSON...
[TRIP PLANNER] ✓ Plan received!
[TRIP PLANNER] Summary: [Summary text]
[TRIP PLANNER] Total Cost: 45000 LKR
[TRIP PLANNER] Days in plan: 3
[TRIP PLANNER] Budget Sufficient: true
[TRIP PLANNER] ✓ Plan saved with ID: 123
```

### Common Issues & Fixes:

#### Issue: "Gemini API key not configured"
```
Solution: 
1. Check .env file has EXPO_PUBLIC_GOOGLE_GENERATIVE_AI_API_KEY
2. Restart Expo: expo start --clear
3. Verify key is valid at https://ai.google.dev/aistudio
```

#### Issue: "Failed to generate trip plan: 404 not found"
```
Solution:
1. Model may be unavailable
2. Check configured model in gemini-trip-planner.ts
3. Verify API key has access to that model
4. Try fallback model (gemini-2.5-flash-lite)
```

#### Issue: "JSON parsing error"
```
Solution:
1. Check response has valid JSON
2. Remove markdown code blocks (```json)
3. Log full response text
4. Validate response fields exist
```

#### Issue: "Timeout after 30 seconds"
```
Solution:
1. Check network connection
2. Verify API key quota not exceeded
3. Reduce request complexity
4. Check Gemini API status at status.openai.com (or Google Cloud Console)
```

## Step 7: Database Integration

### Verify Supabase Trip Plans Table

```sql
-- Check table structure
SELECT * FROM trip_plans LIMIT 1;

-- Expected columns:
-- destination (text)
-- days (integer)
-- budget_lkr (numeric)
-- travelers (integer)
-- total_cost_lkr (numeric)
-- budget_sufficient (boolean)
-- budget_message (text)
-- itinerary_json (jsonb) - daily_plan array
-- cost_breakdown_json (jsonb) - cost allocation
-- travel_tips_json (jsonb) - tips array
```

### Verify Data is Saved
```sql
-- Query recently saved trips
SELECT id, destination, days, budget_lkr, total_cost_lkr, 
       budget_sufficient, created_at 
FROM trip_plans 
WHERE user_id = [YOUR_USER_ID]
ORDER BY created_at DESC 
LIMIT 5;
```

## Step 8: Integration Testing Checklist

- [ ] Gemini API key configured
- [ ] API responds to requests
- [ ] JSON responses parse correctly
- [ ] Trip plans generate in 15-30 seconds
- [ ] Budget validation works
- [ ] Cost calculations are accurate
- [ ] Database saves trip plans
- [ ] Plans load from database
- [ ] UI displays results correctly
- [ ] Share functionality works
- [ ] PDF generation works
- [ ] Error messages are user-friendly

## Troubleshooting Commands

```bash
# Clear Expo cache
expo start --clear

# Check environment variables
echo $EXPO_PUBLIC_GOOGLE_GENERATIVE_AI_API_KEY

# View app logs
expo logs

# Test API directly (use curl)
curl -X POST https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=YOUR_KEY \
  -H "Content-Type: application/json" \
  -d '{"contents":[{"parts":[{"text":"Hello"}]}]}'
```

## Support Resources

- **Gemini API Docs:** https://ai.google.dev/docs
- **Models List:** https://ai.google.dev/gemini-api/docs/models/gemini
- **Rate Limits:** Check Google Cloud Console → API & Services → Quotas
- **Error Codes:** https://ai.google.dev/docs/error_codes

## Next Steps After Testing

1. If all tests pass: ✅ Move to staging deployment
2. Test with real users
3. Monitor API usage and costs
4. Collect user feedback on plan quality
5. Fine-tune prompts based on feedback
6. Add logging for production debugging

## Cost Estimation

**Gemini 1.5 Flash Pricing (as of 2024):**
- Input: $0.075 per 1M tokens
- Output: $0.3 per 1M tokens

**Example Cost per Trip Plan:**
- Average request: ~500 input tokens, ~800 output tokens
- Cost: ~$0.00052 per trip
- 1000 trips/month: ~$0.52/month

(Prices subject to change—check https://ai.google.dev/pricing for latest rates)
