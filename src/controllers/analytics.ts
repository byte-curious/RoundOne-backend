import { analyticsDataClient } from "../utils/analytics.js";
import { prisma } from "../utils/database/db.js";
import type { Request, Response } from "express";
import axios from "axios"
const GA4_PROPERTY_ID = process.env.GOOGLE_PROPERTY_ID;

let cachedStats = { users: 0, visits: 0, lastFetched: 0 };
const GA4_MEASUREMENT_ID = process.env.GA4_MEASUREMENT_ID;
const GA4_API_SECRET = process.env.GA4_API_SECRET;

export const getAnalytics = async (req: Request, res: Response) => {
    const tenMinutes = 10 * 60 * 1000;
    const now = Date.now();

    // 1. Return Cache if valid
    if (now - cachedStats.lastFetched < tenMinutes) {
        return res.status(200).json({ 
            totalUsers: cachedStats.users, 
            totalVisits: cachedStats.visits 
        });
    }

    try {
        // 2. Get registered users count from DB
        const usersCnt = await prisma.user.count();

        // 3. Get total visits (sessions) from Google Analytics 4
        const [response] = await analyticsDataClient.runReport({
            property: `properties/${GA4_PROPERTY_ID}`,
            dateRanges: [{ startDate: '2020-01-01', endDate: 'today' }],
            metrics: [{ name: 'sessions' }],
        });

        const totalVisits = response.rows?.[0]?.metricValues?.[0]?.value ?? "0";

        const PREVIOUS_UNTRACKED_VISITS = 37;

        // 4. Update the Cache
        cachedStats = {
            users: usersCnt,
            visits: parseInt(totalVisits, 10)  + PREVIOUS_UNTRACKED_VISITS, // Added base 10 for safety
            lastFetched: now,
        };

        // 5. Send fresh data
        return res.status(200).json({
            totalUsers: cachedStats.users, 
            totalVisits: cachedStats.visits 
        });

    } catch (error) {
        console.error("Failed to fetch analytics data:", error); 
        
        return res.status(500).json({
            error: "Internal Server Error"
        });
    }
};

export const trackVisit = async (req: Request, res: Response) => {
    try {
        const { page, clientId } = req.body;

        // Send data directly to Google from the Server
        await axios.post(
            `https://www.google-analytics.com/mp/collect?measurement_id=${GA4_MEASUREMENT_ID}&api_secret=${GA4_API_SECRET}`,
            {
                client_id: clientId, // Required by GA4 to differentiate users
                events: [{
                    name: 'page_view',
                    params: {
                        page_location: page,
                        session_id: clientId, // Groups hits into a session
                    },
                }],
            }
        );

        res.status(200).json({ success: true });
    } catch (error) {
        console.error("Failed to track server-side:", error);
        // We still return 200 so the frontend doesn't crash if tracking fails
        res.status(200).json({ success: false }); 
    }
};
