import { BetaAnalyticsDataClient } from "@google-analytics/data"

const googleEmail =  process.env.GOOGLE_CLIENT_EMAIL;
const googlePrivateKey = process.env.GOOGLE_PRIVATE_KEY;

// 1. Excellent use of the "Fail-Fast" pattern!
if(!googleEmail || !googlePrivateKey){
    throw Error("Keys for analytics are missing in .env file");
}

export const analyticsDataClient = new BetaAnalyticsDataClient({
    credentials: {
        client_email: googleEmail,
        // 2. This replace logic is perfect for .env parsing
        private_key: googlePrivateKey.replace(/\\n/g, '\n'),
    }
});
