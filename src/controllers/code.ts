import { type Request, type Response } from "express"
import { runCode } from "../services/piston.service.js";


const executeCode = async (req: Request, res: Response) => {
    try {
        const { code, language, testCases } = req.body;
        if (!code || !language || !testCases || !Array.isArray(testCases)) {
            return res.status(400).json({ "error": "Missing required Fields" });
        };

        const results = []
        let allPassed = true;
        for (let i = 0; i < testCases.length; i++) {
            let { input, output: expectedOutput } = testCases[i];

            const runningUserCode = await runCode(language, code, input);

            if (!runningUserCode) {
                return res.status(500).json({ error: "Code execution service unavailable" });
            };
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
            };

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

export { executeCode }
