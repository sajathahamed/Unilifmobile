/**
 * PDF Generation Service for Trip Plans
 * Generates beautiful PDF documents for trip itineraries
 */

import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { TripPlanResponse } from './deepseek';

interface PDFTripData {
    userName: string;
    userEmail?: string;
    destination: string;
    days: number;
    travelers: number;
    roomType: string;
    tripPlan: TripPlanResponse;
    createdAt: string;
}

/**
 * Format number as LKR currency
 */
function formatLKR(amount: number): string {
    return `LKR ${amount.toLocaleString()}`;
}

/**
 * Generate HTML content for the trip plan PDF
 */
function generateTripPlanHTML(data: PDFTripData): string {
    const { userName, userEmail, destination, days, travelers, roomType, tripPlan, createdAt } = data;
    
    // Generate daily itinerary HTML
    const dailyItineraryHTML = tripPlan.daily_plan.map(day => `
        <div class="day-section">
            <div class="day-header">
                <h3>Day ${day.day}: ${day.theme}</h3>
                <span class="day-cost">${formatLKR(day.estimated_cost_lkr)}</span>
            </div>
            ${day.transport_details ? `<p class="transport-info">🚗 ${day.transport_details}</p>` : ''}
            <table class="activities-table">
                <thead>
                    <tr>
                        <th>Time</th>
                        <th>Activity</th>
                        <th>Duration</th>
                        <th>Cost</th>
                    </tr>
                </thead>
                <tbody>
                    ${day.activities.map(act => `
                        <tr>
                            <td>${act.time}</td>
                            <td>
                                <strong>${act.activity}</strong>
                                ${act.description ? `<br><small>${act.description}</small>` : ''}
                                ${act.location ? `<br><small>📍 ${act.location}</small>` : ''}
                                ${act.contact_phone ? `<br><small>📞 ${act.contact_phone}</small>` : ''}
                            </td>
                            <td>${act.duration || '-'}</td>
                            <td>${formatLKR(act.estimated_cost_lkr)}${act.entry_fee_lkr ? `<br><small>Entry: ${formatLKR(act.entry_fee_lkr)}</small>` : ''}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `).join('');

    // Generate hotel details HTML
    const hotelDetailsHTML = tripPlan.hotel_details.map(hotel => `
        <div class="hotel-card">
            <h4>🏨 ${hotel.name}</h4>
            ${hotel.rating ? `<p>⭐ Rating: ${hotel.rating}/5</p>` : ''}
            <p>💰 ${formatLKR(hotel.price_per_night_lkr)} per night</p>
            <p>🛏️ Room Type: ${hotel.room_type}</p>
            ${hotel.address ? `<p>📍 ${hotel.address}</p>` : ''}
            ${hotel.amenities?.length ? `<p>✨ Amenities: ${hotel.amenities.join(', ')}</p>` : ''}
            ${hotel.contact_phone ? `<p>📞 ${hotel.contact_phone}</p>` : ''}
            ${hotel.reason ? `<p><em>${hotel.reason}</em></p>` : ''}
        </div>
    `).join('');

    // Generate cost breakdown HTML
    const costBreakdownHTML = Object.entries(tripPlan.cost_breakdown_lkr).map(([key, value]) => `
        <tr>
            <td>${key.charAt(0).toUpperCase() + key.slice(1)}</td>
            <td>${formatLKR(value)}</td>
        </tr>
    `).join('');

    // Generate travel tips HTML
    const travelTipsHTML = tripPlan.travel_tips.map(tip => `<li>${tip}</li>`).join('');

    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Trip Plan - ${destination}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            padding: 20px;
        }
        .header {
            background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
            color: white;
            padding: 30px;
            border-radius: 10px;
            margin-bottom: 30px;
            text-align: center;
        }
        .header h1 {
            font-size: 28px;
            margin-bottom: 10px;
        }
        .header .subtitle {
            font-size: 16px;
            opacity: 0.9;
        }
        .user-info {
            background: #f8fafc;
            padding: 15px 20px;
            border-radius: 8px;
            margin-bottom: 20px;
            border-left: 4px solid #6366f1;
        }
        .summary-box {
            background: #f0f9ff;
            padding: 20px;
            border-radius: 8px;
            margin-bottom: 30px;
            border: 1px solid #bae6fd;
        }
        .summary-box h2 {
            color: #0369a1;
            margin-bottom: 10px;
        }
        .section {
            margin-bottom: 30px;
        }
        .section h2 {
            color: #6366f1;
            border-bottom: 2px solid #e2e8f0;
            padding-bottom: 10px;
            margin-bottom: 20px;
        }
        .day-section {
            background: #fff;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 20px;
            margin-bottom: 20px;
        }
        .day-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 15px;
            padding-bottom: 10px;
            border-bottom: 1px solid #e2e8f0;
        }
        .day-header h3 {
            color: #1e293b;
        }
        .day-cost {
            background: #10b981;
            color: white;
            padding: 5px 12px;
            border-radius: 20px;
            font-weight: bold;
        }
        .transport-info {
            background: #fef3c7;
            padding: 8px 12px;
            border-radius: 5px;
            margin-bottom: 15px;
            font-size: 14px;
        }
        .activities-table {
            width: 100%;
            border-collapse: collapse;
        }
        .activities-table th, .activities-table td {
            padding: 12px;
            text-align: left;
            border-bottom: 1px solid #e2e8f0;
        }
        .activities-table th {
            background: #f8fafc;
            color: #475569;
            font-weight: 600;
        }
        .activities-table small {
            color: #64748b;
        }
        .hotel-card {
            background: #fff;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 20px;
            margin-bottom: 15px;
        }
        .hotel-card h4 {
            color: #1e293b;
            margin-bottom: 10px;
        }
        .hotel-card p {
            margin-bottom: 5px;
            font-size: 14px;
        }
        .cost-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
        }
        .cost-table td {
            padding: 12px;
            border-bottom: 1px solid #e2e8f0;
        }
        .cost-table tr:last-child td {
            font-weight: bold;
            font-size: 18px;
            background: #f0fdf4;
            color: #16a34a;
        }
        .tips-list {
            list-style: none;
        }
        .tips-list li {
            padding: 10px 15px;
            background: #fef3c7;
            margin-bottom: 8px;
            border-radius: 5px;
            border-left: 3px solid #f59e0b;
        }
        .footer {
            text-align: center;
            padding: 20px;
            margin-top: 30px;
            border-top: 2px solid #e2e8f0;
            color: #64748b;
            font-size: 12px;
        }
        .total-cost-box {
            background: linear-gradient(135deg, #10b981 0%, #059669 100%);
            color: white;
            padding: 20px;
            border-radius: 10px;
            text-align: center;
            margin-bottom: 20px;
        }
        .total-cost-box h3 {
            font-size: 32px;
            margin-bottom: 5px;
        }
        .food-places {
            display: flex;
            flex-wrap: wrap;
            gap: 10px;
        }
        .food-card {
            background: #fff;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 15px;
            flex: 1;
            min-width: 200px;
        }
        @media print {
            body {
                padding: 0;
            }
            .day-section {
                page-break-inside: avoid;
            }
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>✈️ Trip Plan to ${destination}</h1>
        <div class="subtitle">${days} Days · ${travelers} Traveler(s) · ${roomType.charAt(0).toUpperCase() + roomType.slice(1)} Accommodation</div>
    </div>

    <div class="user-info">
        <strong>👤 Traveler:</strong> ${userName}
        ${userEmail ? `<br><strong>📧 Email:</strong> ${userEmail}` : ''}
        <br><strong>📅 Created:</strong> ${new Date(createdAt).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
    </div>

    <div class="summary-box">
        <h2>📋 Trip Summary</h2>
        <p>${tripPlan.summary}</p>
        ${!tripPlan.budget_sufficient ? `<p style="color: #dc2626; margin-top: 10px;"><strong>⚠️ Budget Notice:</strong> ${tripPlan.budget_message}</p>` : ''}
    </div>

    <div class="total-cost-box">
        <p>Total Estimated Cost</p>
        <h3>${formatLKR(tripPlan.total_cost_lkr)}</h3>
        <small>(≈ USD ${tripPlan.total_cost_usd || Math.round(tripPlan.total_cost_lkr / 320)})</small>
    </div>

    <div class="section">
        <h2>💰 Cost Breakdown</h2>
        <table class="cost-table">
            ${costBreakdownHTML}
            <tr>
                <td>Total</td>
                <td>${formatLKR(tripPlan.total_cost_lkr)}</td>
            </tr>
        </table>
    </div>

    <div class="section">
        <h2>📅 Day-by-Day Itinerary</h2>
        ${dailyItineraryHTML}
    </div>

    <div class="section">
        <h2>🏨 Hotel Recommendations</h2>
        ${hotelDetailsHTML}
    </div>

    <div class="section">
        <h2>🚗 Transport Details</h2>
        <div class="hotel-card">
            <h4>Transport Mode: ${tripPlan.transport_summary.mode}</h4>
            <p>${tripPlan.transport_summary.details}</p>
            <p><strong>Estimated Transport Cost:</strong> ${formatLKR(tripPlan.transport_summary.total_cost_lkr)}</p>
        </div>
    </div>

    ${tripPlan.food_places.length > 0 ? `
    <div class="section">
        <h2>🍽️ Recommended Food Places</h2>
        <div class="food-places">
            ${tripPlan.food_places.map(place => `
                <div class="food-card">
                    <h4>🍴 ${place.name}</h4>
                    <p><strong>Cuisine:</strong> ${place.cuisine}</p>
                    <p><strong>Best for:</strong> ${place.meal_type}</p>
                    <p><strong>Cost:</strong> ${formatLKR(place.estimated_cost_lkr)}</p>
                    ${place.contact_phone ? `<p>📞 ${place.contact_phone}</p>` : ''}
                </div>
            `).join('')}
        </div>
    </div>
    ` : ''}

    ${tripPlan.travel_tips.length > 0 ? `
    <div class="section">
        <h2>💡 Travel Tips</h2>
        <ul class="tips-list">
            ${travelTipsHTML}
        </ul>
    </div>
    ` : ''}

    <div class="footer">
        <p>Generated by UniLife Trip Planner</p>
        <p>This trip plan was created using AI and prices are estimates. Please verify all information before booking.</p>
    </div>
</body>
</html>
    `;
}

/**
 * Generate and download PDF for a trip plan
 */
export async function generateTripPDF(data: PDFTripData): Promise<{ uri: string; success: boolean; error?: string }> {
    try {
        const html = generateTripPlanHTML(data);
        
        const { uri } = await Print.printToFileAsync({
            html,
            base64: false,
        });

        // Return the generated PDF URI directly
        return { uri, success: true };
    } catch (error) {
        console.error('PDF generation error:', error);
        return { uri: '', success: false, error: (error as Error).message };
    }
}

/**
 * Share the generated PDF
 */
export async function shareTripPDF(uri: string): Promise<boolean> {
    try {
        const isAvailable = await Sharing.isAvailableAsync();
        if (!isAvailable) {
            console.warn('Sharing is not available on this device');
            return false;
        }

        await Sharing.shareAsync(uri, {
            mimeType: 'application/pdf',
            dialogTitle: 'Share Trip Plan',
        });

        return true;
    } catch (error) {
        console.error('PDF sharing error:', error);
        return false;
    }
}

/**
 * Print the trip plan directly
 */
export async function printTripPlan(data: PDFTripData): Promise<boolean> {
    try {
        const html = generateTripPlanHTML(data);
        await Print.printAsync({ html });
        return true;
    } catch (error) {
        console.error('Print error:', error);
        return false;
    }
}

export default {
    generateTripPDF,
    shareTripPDF,
    printTripPlan,
};
