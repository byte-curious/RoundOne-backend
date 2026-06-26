import type { Request, Response } from "express";
import { runCode } from "../services/joodle.service.js"; 

// Helper function to prevent hitting JDoodle's rate limits too fast
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const executeCode = async (req: Request, res: Response) => {
    try {
        const { language, code, testCases } = req.body;

        if (!language || !code || !testCases || !Array.isArray(testCases)) {
            return res.status(400).json({ error: "Missing required fields" });
        }

        const results = [];
        let allPassed = true;

        for (let i = 0; i < testCases.length; i++) {
            let { input, output: expectedOutput } = testCases[i];

            // 1. Call JDoodle
            const runningUserCode = await runCode(language, code, input);

            if (!runningUserCode) {
                return res.status(500).json({ error: "Code execution service unavailable" });
            }

            // 2. Handle Errors
            if (runningUserCode.status === "error" || runningUserCode.stderr) {
                results.push({
                    testCase: i + 1,
                    passed: false,
                    input,
                    expectedOutput,
                    actualOutput: runningUserCode.stderr,
                    error: true
                });
                allPassed = false;
                continue;
            }

            // 3. Compare Output
            const actualOutput = runningUserCode.stdout.trim();
            const expected = expectedOutput.trim();
            const passed = actualOutput === expected;
            
            if (!passed) allPassed = false;

            results.push({
                testCase: i + 1,
                passed,
                input,
                expectedOutput: expected,
                actualOutput,
                error: false
            });

            // Wait 500ms between test cases to respect API limits
            if (i < testCases.length - 1) {
                await sleep(500);
            }
        }

        return res.status(200).json({
            allPassed,
            results
        });

    } catch (error) {
        console.error("Execute Code Error:", error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
}
