# Trip Planner Validation & Gemini AI Integration

## Overview
This document explains the comprehensive validation system and Google Generative AI (Gemini) integration for the UniLife Mobile trip planner feature. It includes viva preparation questions and answers.

---

## Part 1: Validation System

### Architecture

#### Three-Tier Validation Approach:
1. **Individual Field Validation** - Validates each form field independently
2. **Dependent Field Validation** - Validates fields that depend on other fields (e.g., travel type depends on traveler count)
3. **Business Logic Validation** - Validates across the entire form (e.g., budget sufficiency)

### Validation Rules

#### 1. Destination Validation
```
VIVA Q: How do you validate user input for location/destination fields?
ANSWER: Check non-empty, minimum 2 characters, only letters/spaces/hyphens allowed
```

**Implementation:**
- Non-empty check: `!value || value.trim().length === 0`
- Min length: `value.trim().length < 2`
- Allowed characters: `/^[a-zA-Z\s\-]+$/`

**Error Messages:**
- "Destination is required"
- "Destination must be at least 2 characters"
- "Destination can only contain letters, spaces, and hyphens"

#### 2. Days (Duration) Validation
```
VIVA Q: What are reasonable constraints for trip duration?
ANSWER: Between 1-30 days. Too short = insufficient planning, too long = unrealistic for students
```

**Constraints:**
- Minimum: 1 day
- Maximum: 30 days
- Must be a positive integer

**Error Messages:**
- "Duration is required"
- "Duration must be a number"
- "Trip must be at least 1 day"
- "Maximum 30 days for planning"

#### 3. Budget Validation
```
VIVA Q: How do you validate numeric currency inputs?
ANSWER: Check positive number, reasonable range for student budgets
```

**Constraints:**
- Must be > 0
- Maximum: 5,000,000 LKR (reasonable upper limit)
- Must be a valid decimal number

**Error Messages:**
- "Budget is required"
- "Budget must be a valid number"
- "Budget must be positive"
- "Budget exceeds reasonable limit (5M LKR)"

#### 4. Travelers Count Validation
```
VIVA Q: How do you validate group size for travel planning?
ANSWER: Between 1-20 people. Affects accommodation, transport, meal planning
```

**Constraints:**
- Minimum: 1 person
- Maximum: 20 people
- Must be a positive integer

**Error Messages:**
- "Number of travelers is required"
- "Travelers must be a number"
- "At least 1 traveler required"
- "Maximum 20 travelers for planning"

#### 5. Travel Type Validation (Dependent Field)
```
VIVA Q: What factors determine travel type (solo/couple/family)?
ANSWER: Travel type depends on traveler count AND user preference

Mapping:
- solo → exactly 1 person
- couple → exactly 2 people
- family → 3+ people
- friends → 2+ people
```

**Implementation:**
```typescript
// Validation logic
solo && travelersNum !== 1 → Error
couple && travelersNum !== 2 → Error
family && travelersNum < 3 → Error
friends && travelersNum < 2 → Error
```

**Key Fix:** Travel type is now independent of traveler count. Users choose their preference, and validation ensures consistency.

#### 6. Room Type Validation
```
VIVA Q: What accommodation options exist for different budgets?
ANSWER: Budget (hostels/guesthouses), Standard (mid-range hotels), Luxury (5-star hotels)
```

**Valid Options:** `['budget', 'standard', 'luxury']`

#### 7. Transport Mode Validation
```
VIVA Q: How do you select transport for different trip types?
ANSWER: Car for groups/long distances, Train for budget/scenic, 
        Flight for far distances, Bus for economy
```

**Valid Options:** `['car', 'train', 'flight', 'bus', 'own-vehicle']`

#### 8. Food Preference Validation
```
VIVA Q: How do food preferences affect trip planning?
ANSWER: Determines restaurant types, meal costs, accessibility in destination
```

**Valid Options:** `['vegetarian', 'non-vegetarian', 'vegan', 'mixed', 'pescatarian']`

### Budget Sufficiency Check

```
VIVA Q: How do you determine if a budget is sufficient?
ANSWER: Check daily minimum by destination tier, multiply by days, add buffers
```

#### Destination Tiers:
```typescript
Premium (15,000 LKR/day):
  - Colombo, Ella, Galle, Nuwara Eliya, Hambantota

Mid-Tier (10,000 LKR/day):
  - Kandy, Sigiriya, Mirissa, Arugam Bay, Trincomalee

Budget (6,000 LKR/day):
  - Jaffna, Vavuniya, Anuradhapura, Polonnaruwa, Kurunegala
```

#### Calculation:
```
minimumBudget = dailyMinimum[tier] × days

For example:
- Ella (premium), 3 days: 15,000 × 3 = 45,000 LKR
- Kandy (mid), 3 days: 10,000 × 3 = 30,000 LKR
- Jaffna (budget), 3 days: 6,000 × 3 = 18,000 LKR

If budget < minimumBudget:
  - Show warning: "Budget is LKR X short"
  - Allow user to continue (non-blocking)
  - Store budget_sufficient flag
```

### Form-Level Validation

```typescript
const result = validateTripPlannerForm({
  destination, days, budget, travelers,
  travelType, roomType, transportMode, foodPreference,
  destinationTiers
});

Returns:
{
  valid: boolean,
  errors: Record<string, string>,  // Blocking errors
  warnings: string[]               // Non-blocking warnings
}
```

---

## Part 2: Gemini API Integration

### Architecture

#### Why Gemini over DeepSeek?
- Google Generative AI provides better stability
- Better support for structured JSON output
- More reliable for production use
- Better pricing and quota management
- Supports gemini-2.5-flash with improved performance

### API Setup

```typescript
// API Key Resolution (in order of precedence)
1. EXPO_PUBLIC_GOOGLE_GENERATIVE_AI_API_KEY
2. EXPO_PUBLIC_GEMINI_API_KEY
3. GOOGLE_GENERATIVE_AI_API_KEY

// Model selection (with fallbacks)
Primary: gemini-2.5-flash
Fallbacks: gemini-2.5-flash-lite, gemini-flash-latest
```

### Service File Structure

**File:** `src/services/gemini-trip-planner.ts`

**Key Functions:**

1. **isGeminiConfigured()** - Checks if API key is set
2. **generateTripPlanWithGemini(request)** - Main API call
3. **calculateBudgetSufficiency()** - Budget validation
4. **convertUSDToLKR()** / **convertLKRToUSD()** - Currency conversion
5. **validateTripPlanResponse()** - Response validation

### Prompt Engineering

```
VIVA Q: How do you write prompts for AI trip planning?
ANSWER: Include detailed context, budget constraints, expected output format,
        and Sri Lankan-specific requirements
```

#### Prompt Structure:
```
1. Role: "You are an expert travel planner for Sri Lanka"
2. Request: "${days}-day trip for ${travelers} ${travelType} travelers"
3. Budget Context:
   - Total budget in LKR
   - Daily budget (total ÷ days)
   - Per person budget (total ÷ travelers)
   - Destination tier classification
4. Constraints:
   - Budget allocation percentages by type
   - Local pricing context
   - Cultural/religious considerations
5. Output Format:
   - Strictly JSON only
   - Specific field requirements
   - No markdown formatting
6. Sinhala Context:
   - Use local place names
   - Include cultural sites
   - Respect Buddhist holidays
   - Mention local transport options
```

### Budget Constraint Allocation

```
Budget Distribution (by destination tier):

PREMIUM destinations (Ella, Galle):
  - 40% Accommodation
  - 25% Food
  - 25% Activities/Sightseeing
  - 10% Transport

MID-TIER destinations (Kandy, Sigiriya):
  - 35% Accommodation
  - 30% Food
  - 25% Activities/Sightseeing
  - 10% Transport

BUDGET destinations (Jaffna, Anuradhapura):
  - 30% Accommodation
  - 35% Food
  - 25% Activities/Sightseeing
  - 10% Transport

Emergency Buffer: 5-10% of total
```

### API Response Handling

```typescript
// Response structure
{
  summary: string,
  daily_plan: Array<DayPlan>,
  total_cost_lkr: number,
  total_cost_usd: number,
  hotel_details: Array<HotelDetails>,
  transport_summary: Object,
  food_places: Array<FoodPlace>,
  cost_breakdown_lkr: CostBreakdown,
  travel_tips: string[],
  budget_sufficient: boolean,
  budget_message?: string
}

// Response validation
- Check all required fields exist
- Validate data types
- Ensure costs are within budget
- Validate daily plan structure
- Ensure activity count and timing
```

### Error Handling

```
TRY:
  1. Send request to Gemini API
  2. Parse JSON response
  3. Remove markdown if present (```json blocks)
  4. Validate response structure
  5. Calculate cost totals
  6. Check budget sufficiency

CATCH:
  - API timeout: 30 second timeout per request
  - JSON parsing error: Extract valid JSON from response
  - Invalid response structure: Throw detailed error
  - Network error: Retry logic with exponential backoff

FINALLY:
  - Log all operations for debugging
  - Provide user-friendly error messages
```

---

## Part 3: UI/UX Integration

### Form Validation Display

```typescript
// Error display (below each input)
- Red border on input field
- Error text in red color (#EF4444)
- Clear, actionable error messages
- Validation on submit (not real-time)

// Field-specific errors
Days: "Duration must be a number" (border red)
Budget: "Budget must be positive" (border red)
Travelers: "At least 1 traveler required" (border red)
Travel Type: "Solo travel must be 1 person" (below field)
```

### Budget Warning System

```
BEFORE Plan Generation:
1. Validate form (blocking errors only)
2. If valid, check warnings (budget sufficiency)
3. If warning exists:
   - Show alert dialog
   - "Budget Warning: [message]"
   - Cancel button (go back)
   - Continue button (proceed anyway)
4. User chooses to continue or cancel

Result: budget_sufficient flag stored with plan
- false: Plan shows warning banner in results
- true: Plan displays normally
```

### AI Status Indicator

```
Before: Complex AIStatus tracking (connecting, generating, error, fallback)
After: Simple Gemini configuration check

Display:
- ✓ Gemini API Ready (green dot, green text)
- ⚠ Gemini API Not Configured (red dot, red text)
- During generation: Activity spinner
```

---

## Part 4: Viva Preparation Questions & Answers

### Data Validation

**Q1: Why is form validation important in mobile applications?**
A: Prevents invalid data from reaching the backend, improves user experience by providing immediate feedback, reduces server load, and ensures data consistency in the database.

**Q2: What's the difference between a blocking error and a non-blocking warning?**
A: Blocking errors (validation failures) prevent form submission; warnings are informational and allow users to proceed with acknowledgment (e.g., budget warning).

**Q3: How do you validate dependent fields?**
A: After validating base fields individually, validate them as a group. For example, travel_type must match traveler count: solo requires 1 person, couple requires 2, etc.

**Q4: Explain the three-tier validation approach used here.**
A: 
1. Individual field validation (type checks, range checks)
2. Dependent field validation (cross-field consistency)
3. Business logic validation (budget sufficiency, constraints)

### Budget Validation

**Q5: How do you calculate minimum budget for a trip?**
A: Identify destination tier (premium/mid/budget), use daily minimum for that tier, multiply by trip duration. Example: Ella (premium) = 15K LKR × days.

**Q6: Why use destination tiers for budget calculation?**
A: Different regions have vastly different costs. Coastal areas (Ella, Galle) are premium; cultural centers (Kandy) are mid-tier; remote areas are budget. Avoids unrealistic budgets.

**Q7: What information does the budget_insufficient warning provide?**
A: Shows the shortfall amount, recommended minimum budget, destination tier, and allows user to continue anyway (stores insufficient flag with plan).

### Gemini API Integration

**Q8: Why replace DeepSeek with Gemini?**
A: Better stability, improved JSON handling, better model performance, more reliable for production, and better quota management.

**Q9: What is the purpose of prompt engineering in AI services?**
A: Guides the AI model to produce specific, formatted outputs by providing detailed context, constraints, and example formats.

**Q10: How do you handle JSON parsing errors in API responses?**
A: Remove markdown code blocks (```json), use regex to extract valid JSON, provide detailed error messages, and validate response structure before use.

**Q11: Explain the budget allocation in Gemini prompts.**
A: Different destination tiers have different allocation percentages (premium: 40% accommodation, mid: 35%, budget: 30%), ensuring realistic cost breakdowns.

**Q12: How do you validate AI-generated trip plans?**
A: Check required fields exist, validate data types, ensure costs ≤ budget, verify daily plan structure, check activity timing/location, and ensure tips are present.

### Error Handling

**Q13: How do you handle API timeouts?**
A: Set 30-second timeout per request, use AbortController to cancel long-running requests, catch abort errors separately, and provide timeout-specific user messages.

**Q14: What should you log for debugging AI API calls?**
A: Request parameters, response received time, response size, success/failure, error details, retry attempts, and final result to trace issues.

### UI/UX

**Q15: How do you provide real-time feedback for form validation?**
A: Show error messages below each field immediately on submit, highlight invalid fields with red borders/colors, and keep messages clear and actionable.

**Q16: Why use a warning dialog instead of blocking on budget insufficiency?**
A: User-first approach: show the issue, let informed users proceed. Allows flexibility for different travel styles while maintaining data integrity with flags.

---

## Implementation Checklist

### Files Created:
- ✅ `src/utils/validationUtils.ts` - Validation functions
- ✅ `src/services/gemini-trip-planner.ts` - Gemini integration

### Files Modified:
- ✅ `src/screens/PlannerScreen.tsx` - Integration & UI updates

### Environment Setup:
- ⚠️ TODO: Set `EXPO_PUBLIC_GOOGLE_GENERATIVE_AI_API_KEY` in `.env`

### Testing:
- ⚠️ TODO: Test Gemini API with various budgets
- ⚠️ TODO: Test validation with edge cases
- ⚠️ TODO: Test budget warning flow
- ⚠️ TODO: Verify currency conversion accuracy

---

## References

- Google Generative AI Docs: https://ai.google.dev/
- Gemini Models: https://ai.google.dev/gemini-api/docs/models/gemini
- Sri Lanka Destination Info: Tier classification based on typical costs
- Validation Patterns: Standard form validation best practices

---

## Future Enhancements

1. **Offline Fallback** - Store trip templates for offline generation
2. **Multi-language Support** - Sinhala/Tamil prompts for local context
3. **Image Analysis** - Gemini vision for destination photos
4. **Real-time Pricing** - Integration with booking APIs
5. **Sustainability Check** - Carbon footprint estimation
6. **Weather Integration** - Season recommendations based on weather
7. **Local Expert Review** - Manual review of AI plans for accuracy
8. **Accessibility** - Voice input/output for form filling

