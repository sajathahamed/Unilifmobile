/**
 * Validation utilities for student pages
 * Provides comprehensive validation rules with viva documentation
 */

export interface ValidationRule {
    field: string;
    validate: (value: any, context?: any) => boolean;
    error: string;
    viva?: string; // Documentation for interview questions
}

export interface ValidationResult {
    valid: boolean;
    errors: Record<string, string>;
}

// ============================================
// TRIP PLANNER VALIDATION RULES
// ============================================

export const TRIP_PLANNER_VALIDATION = {
    /**
     * Validates trip destination
     * VIVA: How do you validate user input for location/destination fields?
     * ANS: Check non-empty, min 2 chars, no special chars except space/hyphen
     */
    destination: (value: string): ValidationResult => {
        const errors: Record<string, string> = {};

        if (!value || value.trim().length === 0) {
            errors.destination = 'Destination is required';
        } else if (value.trim().length < 2) {
            errors.destination = 'Destination must be at least 2 characters';
        } else if (!/^[a-zA-Z\s\-]+$/.test(value)) {
            errors.destination = 'Destination can only contain letters, spaces, and hyphens';
        }

        return {
            valid: Object.keys(errors).length === 0,
            errors,
        };
    },

    /**
     * Validates trip duration in days
     * VIVA: What are reasonable constraints for trip duration?
     * ANS: Between 1-30 days. Too short = insufficient planning, too long = unrealistic for students
     */
    days: (value: string): ValidationResult => {
        const errors: Record<string, string> = {};
        const daysNum = parseInt(value);

        if (!value || value.trim().length === 0) {
            errors.days = 'Duration is required';
        } else if (isNaN(daysNum)) {
            errors.days = 'Duration must be a number';
        } else if (daysNum < 1) {
            errors.days = 'Trip must be at least 1 day';
        } else if (daysNum > 30) {
            errors.days = 'Maximum 30 days for planning';
        }

        return {
            valid: Object.keys(errors).length === 0,
            errors,
        };
    },

    /**
     * Validates budget amount
     * VIVA: How do you validate numeric currency inputs?
     * ANS: Check positive number, reasonable range (5k-5M LKR for students)
     */
    budget: (value: string): ValidationResult => {
        const errors: Record<string, string> = {};
        const budgetNum = parseFloat(value);

        if (!value || value.trim().length === 0) {
            errors.budget = 'Budget is required';
        } else if (isNaN(budgetNum)) {
            errors.budget = 'Budget must be a valid number';
        } else if (budgetNum <= 0) {
            errors.budget = 'Budget must be positive';
        } else if (budgetNum > 5000000) {
            errors.budget = 'Budget exceeds reasonable limit (5M LKR)';
        }

        return {
            valid: Object.keys(errors).length === 0,
            errors,
        };
    },

    /**
     * Validates traveler count
     * VIVA: How do you validate group size for travel planning?
     * ANS: Between 1-20 people. Affects accommodation, transport, meal planning
     */
    travelers: (value: string): ValidationResult => {
        const errors: Record<string, string> = {};
        const travelersNum = parseInt(value);

        if (!value || value.trim().length === 0) {
            errors.travelers = 'Number of travelers is required';
        } else if (isNaN(travelersNum)) {
            errors.travelers = 'Travelers must be a number';
        } else if (travelersNum < 1) {
            errors.travelers = 'At least 1 traveler required';
        } else if (travelersNum > 20) {
            errors.travelers = 'Maximum 20 travelers for planning';
        }

        return {
            valid: Object.keys(errors).length === 0,
            errors,
        };
    },

    /**
     * Validates budget sufficiency for destination and duration
     * VIVA: How do you calculate if a budget is sufficient for a trip?
     * ANS: By destination tier (premium/mid/budget), per-day minimums, multiply by days
     */
    budgetSufficiency: (
        budget: number,
        destination: string,
        days: number,
        destinationTiers: Record<string, 'premium' | 'mid' | 'budget'>
    ): { sufficient: boolean; minimumBudget: number; message: string } => {
        // Daily budget minimums by tier (in LKR) - includes 300 buffer
        const dailyMinimums = {
            premium: 15000, // Premium destinations like Ella, Galle
            mid: 10000,     // Mid-tier like Kandy, Sigiriya
            budget: 5000,   // Budget destinations
        };

        const tier = destinationTiers[destination] || 'mid';
        const dailyMin = dailyMinimums[tier];
        const minimumBudget = dailyMin * days;
        const sufficient = budget >= minimumBudget;

        return {
            sufficient,
            minimumBudget,
            message: sufficient
                ? `✓ Budget sufficient for ${destination} (${tier})`
                : `⚠ Minimum LKR ${minimumBudget.toLocaleString()} recommended (LKR ${(minimumBudget - budget).toLocaleString()} short)`,
        };
    },

    /**
     * Validates travel type selection
     * VIVA: What factors determine travel type (solo/couple/family)?
     * ANS: Travel type depends on traveler count AND user preference
     */
    travelType: (value: string, travelersNum: number): ValidationResult => {
        const errors: Record<string, string> = {};
        const validTypes = ['solo', 'couple', 'family', 'friends'];

        if (!value || value.trim().length === 0) {
            errors.travelType = 'Travel type is required';
        } else if (!validTypes.includes(value)) {
            errors.travelType = 'Invalid travel type';
        } else {
            // Validation based on traveler count
            if (value === 'solo' && travelersNum !== 1) {
                errors.travelType = 'Solo travel must be 1 person';
            } else if (value === 'couple' && travelersNum !== 2) {
                errors.travelType = 'Couple travel must be 2 people';
            } else if (value === 'family' && travelersNum < 3) {
                errors.travelType = 'Family travel requires 3+ people';
            } else if (value === 'friends' && travelersNum < 2) {
                errors.travelType = 'Friends group must be 2+ people';
            }
        }

        return {
            valid: Object.keys(errors).length === 0,
            errors,
        };
    },

    /**
     * Validates room type
     * VIVA: What accommodation options exist for different budgets?
     * ANS: Budget (hostels/guesthouses), Standard (mid-range hotels), Luxury (5-star hotels)
     */
    roomType: (value: string): ValidationResult => {
        const errors: Record<string, string> = {};
        const validTypes = ['budget', 'standard', 'luxury'];

        if (!value || value.trim().length === 0) {
            errors.roomType = 'Room type is required';
        } else if (!validTypes.includes(value)) {
            errors.roomType = 'Invalid room type';
        }

        return {
            valid: Object.keys(errors).length === 0,
            errors,
        };
    },

    /**
     * Validates transport mode
     * VIVA: How do you select transport for different trip types?
     * ANS: Car for groups/long distances, Train for budget/scenic, Flight for far distances
     */
    transportMode: (value: string): ValidationResult => {
        const errors: Record<string, string> = {};
        const validModes = ['car', 'train', 'flight', 'bus', 'own-vehicle'];

        if (!value || value.trim().length === 0) {
            errors.transportMode = 'Transport mode is required';
        } else if (!validModes.includes(value)) {
            errors.transportMode = 'Invalid transport mode';
        }

        return {
            valid: Object.keys(errors).length === 0,
            errors,
        };
    },

    /**
     * Validates food preference
     * VIVA: How do food preferences affect trip planning?
     * ANS: Determines restaurant types, meal costs, accessibility in destination
     */
    foodPreference: (value: string): ValidationResult => {
        const errors: Record<string, string> = {};
        const validPreferences = ['vegetarian', 'non-vegetarian', 'vegan', 'mixed', 'pescatarian'];

        if (!value || value.trim().length === 0) {
            errors.foodPreference = 'Food preference is required';
        } else if (!validPreferences.includes(value)) {
            errors.foodPreference = 'Invalid food preference';
        }

        return {
            valid: Object.keys(errors).length === 0,
            errors,
        };
    },
};

/**
 * Comprehensive trip planner form validation
 * VIVA: How do you validate an entire form with inter-field dependencies?
 * ANS: Validate each field individually, then check field dependencies (e.g., budget vs destination)
 */
export function validateTripPlannerForm(formData: {
    destination: string;
    days: string;
    budget: string;
    travelers: string;
    travelType: string;
    roomType: string;
    transportMode: string;
    foodPreference: string;
    destinationTiers?: Record<string, 'premium' | 'mid' | 'budget'>;
}): { valid: boolean; errors: Record<string, string>; warnings: string[] } {
    const allErrors: Record<string, string> = {};
    const warnings: string[] = [];

    // Validate individual fields
    const destResult = TRIP_PLANNER_VALIDATION.destination(formData.destination);
    Object.assign(allErrors, destResult.errors);

    const daysResult = TRIP_PLANNER_VALIDATION.days(formData.days);
    Object.assign(allErrors, daysResult.errors);

    const budgetResult = TRIP_PLANNER_VALIDATION.budget(formData.budget);
    Object.assign(allErrors, budgetResult.errors);

    const travelersResult = TRIP_PLANNER_VALIDATION.travelers(formData.travelers);
    Object.assign(allErrors, travelersResult.errors);

    const roomResult = TRIP_PLANNER_VALIDATION.roomType(formData.roomType);
    Object.assign(allErrors, roomResult.errors);

    const transportResult = TRIP_PLANNER_VALIDATION.transportMode(formData.transportMode);
    Object.assign(allErrors, transportResult.errors);

    const foodResult = TRIP_PLANNER_VALIDATION.foodPreference(formData.foodPreference);
    Object.assign(allErrors, foodResult.errors);

    // Validate dependent fields only if base fields are valid
    if (daysResult.valid && travelersResult.valid) {
        const travelTypeResult = TRIP_PLANNER_VALIDATION.travelType(formData.travelType, parseInt(formData.travelers));
        Object.assign(allErrors, travelTypeResult.errors);
    }

    // Check budget sufficiency (warning, not error)
    if (destResult.valid && daysResult.valid && budgetResult.valid) {
        const tiers = formData.destinationTiers || {};
        const budgetCheck = TRIP_PLANNER_VALIDATION.budgetSufficiency(
            parseFloat(formData.budget),
            formData.destination,
            parseInt(formData.days),
            tiers
        );

        if (!budgetCheck.sufficient) {
            warnings.push(budgetCheck.message);
        }
    }

    return {
        valid: Object.keys(allErrors).length === 0,
        errors: allErrors,
        warnings,
    };
}

// ============================================
// OTHER SCREEN VALIDATION (Placeholder structures)
// ============================================

/**
 * Timetable validation
 * VIVA: How do you validate time inputs in a student schedule?
 * ANS: End time > start time, no overlapping classes, reasonable breaks
 */
export function validateTimetableInput(startTime: string, endTime: string): ValidationResult {
    const errors: Record<string, string> = {};

    if (!startTime) {
        errors.startTime = 'Start time required';
    }
    if (!endTime) {
        errors.endTime = 'End time required';
    }

    if (startTime && endTime && startTime >= endTime) {
        errors.endTime = 'End time must be after start time';
    }

    return {
        valid: Object.keys(errors).length === 0,
        errors,
    };
}

/**
 * Food order validation
 * VIVA: How do you ensure valid food orders?
 * ANS: Items exist, quantities are positive, special notes are reasonable length,
 *      phone number is valid, delivery method is selected
 */
export function validateFoodOrder(
    items: any[],
    phone: string,
    specialNotes?: string,
    deliveryMethod?: string
): ValidationResult {
    const errors: Record<string, string> = {};

    // Items validation
    if (!items || items.length === 0) {
        errors.items = 'At least one item required';
    } else if (items.some((item) => !item.quantity || item.quantity < 1)) {
        errors.items = 'All items must have valid quantities';
    } else if (items.some((item) => !item.price || item.price < 0)) {
        errors.items = 'All items must have valid prices';
    }

    // Phone validation
    if (!phone || phone.trim().length === 0) {
        errors.phone = 'Phone number is required';
    } else {
        // Sri Lankan phone format: 077XXXXXXX or similar
        const phoneRegex = /^(\+94|0)[0-9]{9,10}$/;
        const cleanPhone = phone.replace(/[\s\-\(\)]/g, '');
        if (!phoneRegex.test(cleanPhone)) {
            errors.phone = 'Enter valid phone number (e.g., 0771234567 or +94771234567)';
        }
    }

    // Special notes validation
    if (specialNotes && specialNotes.trim().length > 500) {
        errors.specialNotes = 'Special notes cannot exceed 500 characters';
    }

    // Delivery method validation
    if (!deliveryMethod || !['pickup', 'delivery'].includes(deliveryMethod.toLowerCase())) {
        errors.deliveryMethod = 'Please select Pickup or Delivery';
    }

    return {
        valid: Object.keys(errors).length === 0,
        errors,
    };
}

/**
 * Laundry service validation
 * VIVA: How do you validate clothing quantity input?
 * ANS: Total items reasonable (10-500), individual items positive, delivery date in future
 */
export function validateLaundryInput(clothingCount: Record<string, number>, deliveryDate: string): ValidationResult {
    const errors: Record<string, string> = {};
    const totalItems = Object.values(clothingCount).reduce((sum, count) => sum + count, 0);

    if (totalItems < 1) {
        errors.clothing = 'At least 1 item required';
    } else if (totalItems > 500) {
        errors.clothing = 'Maximum 500 items per batch';
    }

    if (!deliveryDate) {
        errors.deliveryDate = 'Delivery date required';
    } else if (new Date(deliveryDate) <= new Date()) {
        errors.deliveryDate = 'Delivery date must be in the future';
    }

    return {
        valid: Object.keys(errors).length === 0,
        errors,
    };
}

/**
 * Profile update validation
 * VIVA: How do you validate email and phone numbers?
 * ANS: Email regex, phone length/format, name non-empty, profile picture optional but checked
 */
export function validateProfileUpdate(email: string, phone: string, name: string): ValidationResult {
    const errors: Record<string, string> = {};

    if (!name || name.trim().length < 2) {
        errors.name = 'Name must be at least 2 characters';
    }

    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        errors.email = 'Invalid email format';
    }

    if (phone && !/^\d{10,}$/.test(phone.replace(/[\s\-\(\)]/g, ''))) {
        errors.phone = 'Invalid phone number format';
    }

    return {
        valid: Object.keys(errors).length === 0,
        errors,
    };
}

// Error message helper
export function getErrorMessage(errors: Record<string, string>): string {
    const errorMessages = Object.values(errors);
    return errorMessages.length > 0 ? errorMessages[0] : 'Validation failed';
}
