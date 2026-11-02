import { executeNative } from "./nativeRunner.js";
import { z } from "zod";
import { TestCaseSchema } from "../zod/index.js";

type TestCase = z.infer<typeof TestCaseSchema>;
type Verdict = "AC" | "WA" | "TLE" | "MLE" | "RTE" | "CE";

interface TestCaseResult {
  verdict: Verdict;
  stdout: string;
  stderr: string;
  expectedOutput: string;
}

export async function runTestCases({
  code,
  language,
  testCases,
}: {
  code: string;
  language: string;
  testCases: TestCase[];
}) {
  const results: TestCaseResult[] = [];
  let overallVerdict: Verdict | "AC" = "AC";

  for (const tc of testCases) {
    const res = await executeNative(language, code, tc.input);

    let verdict: Verdict = "AC";

    if (res.timedOut) {
      verdict = "TLE";
    } else if (res.exitCode !== 0) {
      verdict = res.stderr.toLowerCase().includes("compilation") ? "CE" : "RTE";
    } else if (res.stdout.trim() !== tc.expectedOutput.trim()) {
      verdict = "WA";
    } else {
      verdict = "AC";
    }

    results.push({
      verdict,
      stdout: res.stdout,
      stderr: res.stderr,
      expectedOutput: tc.expectedOutput,
    });

    if (overallVerdict === "AC" && verdict !== "AC") {
      overallVerdict = verdict;
      break;
    }
  }

  return { overAllVerdict: overallVerdict, results };
}
