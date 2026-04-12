# UniLife Mobile - Viva Questions & Answers (Phase 3)

## Form Validation & Data Integrity

### Q1: What is the purpose of form validation in mobile applications?
**Answer:** Form validation ensures:
- **Data Quality:** Invalid data doesn't reach the backend
- **User Experience:** Immediate feedback helps users correct errors
- **Security:** Prevents injection attacks and malicious data
- **Server Efficiency:** Reduces unnecessary API calls
- **Data Consistency:** Maintains database integrity

### Q2: Explain the three-tier validation approach used in UniLife's trip planner.
**Answer:**
1. **Individual Field Validation** - Validates each field independently
   - Check data type (string, number, etc.)
   - Check required fields are non-empty
   - Check length constraints (min/max)
   - Check format (email, phone, regex patterns)

2. **Dependent Field Validation** - Validates fields that depend on others
   - Travel type must match traveler count
   - Room type must be compatible with budget
   - Dates must be in correct order

3. **Business Logic Validation** - Validates across entire form
   - Budget sufficiency for destination and duration
   - Total cost doesn't exceed budget
   - Trip parameters are realistic

### Q3: What's the difference between a blocking error and a non-blocking warning?
**Answer:**
- **Blocking Error:** Prevents form submission (e.g., "Budget must be positive")
  - User must fix before proceeding
  - Examples: invalid destination, zero budget, negative days
  
- **Non-blocking Warning:** Allows submission with acknowledgment (e.g., budget insufficient)
  - User can continue after reading warning
  - System stores warning flag with data
  - Useful for edge cases where user knows best

### Q4: How do you validate dependent fields like travel type?
**Answer:** After validating base fields, check cross-field constraints:
```
Input: travelers=3, travelType='couple'
Validation: couple requires exactly 2 people
Result: Error - "Couple travel must be 2 people"

Input: travelers=1, travelType='solo'
Validation: solo requires exactly 1 person
Result: ✓ Valid
```

This ensures data consistency and prevents impossible combinations.

### Q5: What regular expressions are used for destination validation?
**Answer:** `/^[a-zA-Z\s\-]+$/`

This pattern allows:
- Letters (A-Z, a-z) for city names
- Spaces for multi-word cities (e.g., "Nuwara Eliya")
- Hyphens for hyphenated names (e.g., "Arugam-Bay")

It rejects numbers and special characters to prevent injection.

---

## Budget Validation & Calculation

### Q6: How is the minimum budget calculated for a trip?
**Answer:** 
1. Classify destination by tier:
   - Premium (Ella, Galle): 15,000 LKR/day
   - Mid-tier (Kandy, Sigiriya): 10,000 LKR/day
   - Budget (Jaffna, Anuradhapura): 6,000 LKR/day

2. Calculate minimum:
   ```
   minimumBudget = dailyMinimum[tier] × days
   
   Example: Ella (premium) for 3 days
   = 15,000 × 3 = 45,000 LKR
   ```

3. Compare and report:
   ```
   userBudget = 50,000 LKR (sufficient)
   OR
   userBudget = 30,000 LKR (short by 15,000)
   ```

### Q7: Why use destination tiers instead of a single daily minimum?
**Answer:** 
- **Cost Variation:** Coastal destinations (Ella, Galle) are expensive due to tourism
- **Geographic Factors:** Remote areas (Jaffna, Anuradhapura) are cheaper
- **Accommodation Costs:** Premium destinations have higher hotel rates
- **Meal Costs:** Tourist areas charge more for food
- **Activity Costs:** Popular destinations have paid attractions

Using tiers prevents:
- Unrealistic budgets for expensive destinations
- Wasteful budgets for cheap destinations
- User frustration from insufficient planning

### Q8: What does the budget_sufficient flag represent?
**Answer:**
- `true`: User's budget meets recommended minimum
- `false`: User's budget is below recommended minimum

It tells the system:
- Whether to show warning before generating plan
- What to display in plan results
- Whether to flag plan as potentially problematic

### Q9: How do you calculate per-day and per-person budgets?
**Answer:**
```
Daily Budget = Total Budget ÷ Days
  Example: 50,000 LKR ÷ 3 days = 16,667 LKR/day

Per-Person Budget = Total Budget ÷ Travelers
  Example: 50,000 LKR ÷ 2 travelers = 25,000 LKR/person

Combined: Per-Person Per-Day = Total Budget ÷ (Days × Travelers)
  Example: 50,000 ÷ (3 × 2) = 8,333 LKR/person/day
```

This helps allocate budget for meals, transport, and activities.

### Q10: What is emergency buffer and why is it included?
**Answer:**
- **Purpose:** Cover unexpected expenses (medical, lost items, price changes)
- **Amount:** 5-10% of total budget
- **Example:** 50,000 LKR budget → 2,500-5,000 LKR emergency buffer
- **Allocation:** Included in cost breakdown for transparency
- **Importance:** Prevents overspending when surprises occur

---

## Gemini AI Integration

### Q11: Why migrate from DeepSeek to Gemini API?
**Answer:**
| Factor | DeepSeek | Gemini |
|--------|----------|--------|
| Stability | Variable | Reliable |
| JSON Output | Variable | Excellent |
| Model Performance | Good | Excellent |
| Production Use | Experimental | Proven |
| Quota Management | Basic | Advanced |
| Support | Limited | Comprehensive |

Gemini is better for production due to reliability and JSON handling.

### Q12: What is prompt engineering and its role?
**Answer:** Prompt engineering is writing detailed instructions to guide AI behavior.

For trip planning:
1. **Context:** "Expert travel planner for Sri Lanka"
2. **Request:** specific destination, duration, travelers
3. **Constraints:** budget limits, Sri Lankan culture, transport options
4. **Format:** JSON structure with specific fields
5. **Quality:** realistic costs, local names, actionable activities

A well-engineered prompt produces:
- Accurate cost estimates
- Culturally appropriate suggestions
- Formatted, parseable output
- Detailed day-by-day plans

### Q13: Explain the budget allocation in Gemini prompts.
**Answer:**
Different destination tiers receive different allocation percentages:

**Premium Destinations (Ella, Galle - 15k/day):**
- 40% Accommodation (6,000)
- 25% Food (3,750)
- 25% Activities (3,750)
- 10% Transport (1,500)

**Mid-tier (Kandy, Sigiriya - 10k/day):**
- 35% Accommodation (3,500)
- 30% Food (3,000)
- 25% Activities (2,500)
- 10% Transport (1,000)

**Budget Destinations (Jaffna - 6k/day):**
- 30% Accommodation (1,800)
- 35% Food (2,100)
- 25% Activities (1,500)
- 10% Transport (600)

This ensures realistic cost breakdowns for each tier.

### Q14: How do you handle JSON parsing errors from AI responses?
**Answer:**
1. **Remove Markdown:** If response has ```json blocks, extract content between them
2. **Trim Whitespace:** Remove leading/trailing spaces
3. **Try-Catch:** Use try-catch to handle parsing errors gracefully
4. **Regex Fallback:** If full JSON fails, use regex to extract JSON object `{...}`
5. **Validate Structure:** Check all required fields exist before use
6. **Log Errors:** Log exact response for debugging

```typescript
try {
  // Remove markdown code blocks
  let jsonText = response.text();
  if (jsonText.includes('```json')) {
    jsonText = jsonText.split('```json')[1].split('```')[0].trim();
  }
  
  // Parse JSON
  const plan = JSON.parse(jsonText);
  
  // Validate structure
  if (!plan.summary || !plan.daily_plan) {
    throw new Error('Missing required fields');
  }
} catch (error) {
  console.error('Parse error:', error);
  throw new Error('Invalid response from AI');
}
```

### Q15: What validations are performed on AI-generated trip plans?
**Answer:**
1. **Structure Validation:**
   - All required fields exist
   - Array fields are actually arrays
   - Nested objects have correct structure

2. **Data Type Validation:**
   - Costs are numbers
   - Days are integers
   - Activities have time values

3. **Business Logic Validation:**
   - Total cost ≤ user's budget
   - Daily plans match requested days
   - Activities have realistic times (06:00-22:00)
   - No duplicate activity names

4. **Content Validation:**
   - Summary is non-empty
   - Trip tips are culturally appropriate
   - Hotel names exist
   - Food places are real

### Q16: How does the system handle API timeouts?
**Answer:**
- **Timeout Duration:** 30 seconds per request
- **Mechanism:** AbortController to cancel hanging requests
- **Error Handling:** Catch abort errors separately
- **User Feedback:** "Request timed out, please try again"
- **Retry Logic:** Can retry immediately (should be user-initiated)
- **Logging:** Log timeout event for monitoring

```typescript
const controller = new AbortController();
const timeoutId = setTimeout(() => controller.abort(), 30000);

try {
  const response = await fetch(url, { signal: controller.signal });
} catch (error) {
  if (error.name === 'AbortError') {
    console.log('Request timed out');
  }
} finally {
  clearTimeout(timeoutId);
}
```

---

## Error Handling & User Experience

### Q17: What information is logged during trip plan generation?
**Answer:**
```
[TRIP PLANNER] Starting plan generation...
[TRIP PLANNER] Destination: Ella
[TRIP PLANNER] Days: 3, Budget: 50000 LKR, Travelers: 2
[GEMINI] Generating trip plan for: Ella
[GEMINI] Budget: 50000 LKR
[GEMINI] Response received, parsing JSON...
[TRIP PLANNER] ✓ Plan received!
[TRIP PLANNER] Summary: [summary text]
[TRIP PLANNER] Total Cost: 45000 LKR
[TRIP PLANNER] Days in plan: 3
[TRIP PLANNER] Hotels: 1
[TRIP PLANNER] Budget Sufficient: true
[TRIP PLANNER] ✓ Plan saved with ID: 123
```

This logging helps:
- Debug issues quickly
- Monitor API performance
- Track user behavior
- Identify patterns

### Q18: How does the budget warning workflow function?
**Answer:**
```
1. User fills form and taps "Generate Plan"
   ↓
2. System validates form fields
   - If errors: show alert, don't proceed
   - If valid: continue
   ↓
3. System checks budget sufficiency
   - If sufficient: proceed directly
   - If insufficient: show warning dialog
   ↓
4. Warning Dialog Options:
   - "Cancel" → return to form editing
   - "Continue" → proceed with plan generation
   ↓
5. Generate and save plan
   - Store budget_sufficient flag
   ↓
6. Display results
   - If insufficient: show warning banner
   - User informed but can proceed
```

This balances data integrity with user autonomy.

### Q19: What error messages are shown for form validation failures?
**Answer:**

| Field | Error | Guidance |
|-------|-------|----------|
| Destination | "Required" | Enter a city name |
| | "Min 2 chars" | Need at least 2 letters |
| | "Letters only" | No numbers or symbols |
| Days | "Required" | Pick 1-30 days |
| | "Must be number" | Enter digits only |
| | "Min 1 day" | Need at least 1 day |
| | "Max 30 days" | Max 30 days planning |
| Budget | "Required" | Enter amount |
| | "Invalid number" | Check decimal format |
| | "Must be positive" | Amount > 0 LKR |
| | "Too high" | Max 5M LKR |
| Travelers | "Required" | Enter count |
| | "Min 1 person" | At least 1 person |
| | "Max 20 people" | Max 20 travelers |
| Travel Type | "Mismatch" | Solo must be 1 person |
| Budget | "Insufficient" | LKR [amount] short ⚠ |

### Q20: How is data presented to help user decision-making?
**Answer:**
- **Cost Summary:** Large, prominent display of total cost
- **Cost Breakdown:** Pie/grid showing accommodation, food, activities, transport
- **Daily Itinerary:** Hour-by-hour schedule with costs
- **Hotel Recommendations:** Names, prices, amenities, ratings
- **Food Places:** Cuisine types, typical costs, locations
- **Travel Tips:** Cultural advice, transportation info
- **Budget Status:** Flag showing if plan is within budget

This presentation helps users understand:
- Where money goes
- What activities are included
- Whether it fits their preferences
- Whether they can afford changes

---

## Database Integration

### Q21: What data is stored in the trip_plans table?
**Answer:**
```sql
-- Key columns:
user_id          -- Link to user making plan
destination      -- City/region name
days             -- Duration in days
budget_lkr       -- User's budget in local currency
total_cost_lkr   -- AI-calculated total cost
travelers        -- Number of people
travel_type      -- solo/couple/family/friends
room_type        -- budget/standard/luxury
transport_mode   -- car/train/flight/bus
food_preference  -- vegetarian/non-veg/vegan/mixed

-- AI Results:
summary                -- Paragraph overview
itinerary_json        -- Array of daily plans
hotel_details_json    -- Array of hotel objects
food_places_json      -- Array of restaurant objects
transport_details_json -- Transport summary
cost_breakdown_json   -- Cost allocation object
travel_tips_json      -- Array of tips
total_cost_usd        -- USD conversion

-- Status:
budget_sufficient     -- Boolean flag
budget_message        -- Explanation if insufficient
status                -- active/completed/voided
created_at           -- Timestamp
```

### Q22: How do you prevent data duplication?
**Answer:**
1. **User ID Check:** Ensure user_id is set before saving
2. **Destination + Date Check:** Prevent multiple identical trips on same day
3. **Unique ID Generation:** Database generates unique IDs
4. **Transaction Safety:** Single write operation for all trip data
5. **Validation Before Save:** Check all required fields before attempt

```typescript
// Before saving
if (!userProfile?.id) throw Error('No user logged in');
if (!destination.trim()) throw Error('Destination required');
if (!tripPlan) throw Error('No plan generated');

// Save atomically
const { data, error } = await createTripPlan(tripPlanData);
```

### Q23: How do users retrieve their saved trips?
**Answer:**
1. **Load on Screen Init:** Query trips tagged 'active' for current user
2. **Filter by Status:** Show only non-voided trips
3. **Sort by Date:** Newest first
4. **Display in List:** Show destination, duration, cost, status
5. **Interactive View:** Tap to see full plan details

```typescript
// Load trips
const { data } = await getTripPlansForUser(userProfile.id, 'active');

// Display list with trip cards
trips.map(trip => (
  <TouchableOpacity onPress={() => viewTripPlan(trip)}>
    <Card>
      <TripSummary trip={trip} />
    </Card>
  </TouchableOpacity>
))
```

---

## Advanced Topics

### Q24: How would you add language support for Sinhala/Tamil?
**Answer:**
1. **Prompt Translation:** Modify Gemini prompt for language
   ```typescript
   const systemPrompt = i18n.t('travel.planner.system_prompt');
   // "You are an expert travel planner in Sri Lanka..."
   ```

2. **Local Context:** Include language-specific cultural notes
   ```
   "Include Sinhala/Tamil names for places"
   "Respect local holidays: Vesak, Deepavali, Thai Pongal"
   "Mention public transportation in local language"
   ```

3. **Output Formatting:** Ensure multilingual JSON output
   ```json
   {
     "summary": "Sinhala/Tamil summary",
     "daily_plan": [{
       "activity": "Local activity name",
       "location": "Sinhala/Tamil spelling"
     }]
   }
   ```

4. **Validation:** Adjust regex for non-Latin scripts

### Q25: How would you add real-time pricing integration?
**Answer:**
1. **Booking API Integration:** Connect to hotel/flight APIs
   ```typescript
   const hotelPrice = await getHotelPrice({
     destination, checkIn, checkOut, guests
   });
   ```

2. **Dynamic Cost Calculation:**
   ```typescript
   // AI provides base estimates
   // APIs provide real prices
   // Use real when available, fallback to estimates
   ```

3. **Freshness Check:** Cache prices, refresh daily
   ```typescript
   const maxAge = 24 * 60 * 60; // 1 day
   if (priceAge > maxAge) {
     refreshPrices();
   }
   ```

4. **Warning Display:** Show "Real price may vary" disclaimer

### Q26: How would you implement sustainability scoring?
**Answer:**
1. **Carbon Footprint Calculation:**
   ```
   CO2 by Transport:
   - Flight: 0.255 kg CO2/km
   - Car: 0.192 kg CO2/km
   - Train: 0.041 kg CO2/km
   - Bus: 0.094 kg CO2/km
   ```

2. **Activity Impact:**
   ```
   Water-intensive activities: +5 points
   High-traffic areas: +3 points
   Eco-friendly stays: -5 points
   ```

3. **Recommendations:**
   ```
   "Use public transport to reduce CO2"
   "Choose eco-friendly hotels"
   "Combine nearby activities"
   ```

4. **Display:** Show sustainability score (0-100%)

---

## Summary & Key Takeaways

### Core Concepts Covered:
✅ Three-tier validation approach
✅ Budget calculations and sufficiency checks
✅ Gemini API integration with prompt engineering
✅ JSON parsing and error handling
✅ User experience design for validation
✅ Database storage and retrieval
✅ Logging for debugging and monitoring

### For Viva Exam:
1. **Understand WHY**: Each validation rule has a reason
2. **Know HOW**: Explain the implementation step-by-step
3. **Give EXAMPLES**: Show input/output for each scenario
4. **Discuss TRADE-OFFS**: Error vs warning, accuracy vs speed
5. **Show EVOLUTION**: How system improved from initial design

### Remember:
- **Data Integrity:** Validation prevents bad data at source
- **User Experience:** Clear errors help users succeed
- **Transparency:** Show calculations, warnings, trade-offs
- **Reliability:** Handle errors gracefully with fallbacks
- **Maintainability:** Log everything for future debugging

Good luck with your viva! 🚀
