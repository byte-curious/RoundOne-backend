import { runInDocker } from "./dockerRunner.js";
import {z} from "zod"
import {TestCaseSchema} from "../zod/index.js"
type TestCase = z.infer<typeof TestCaseSchema>

type Verdict = "AC" | "WA" | "TLE" | "MLE" | "RTE"

interface TestCaseResult {
  verdict: Verdict;
  stdout: string;
  stderr: string;
  expectedOutput: string
}
interface JudgeResult {
  overAllVerdict: Verdict | "AC";
  results: TestCaseResult[];
}

export async function runTestCases({
  code,
  language,
  testCases,
}: {
  code: string;
  language: string;
  testCases: TestCase[];
}): Promise<JudgeResult> {
  //   loop over testCases, call runInDocker for each with the right stdin,
  const results: TestCaseResult[] = [];
  let overallVerdict: Verdict | "AC" = "AC";

  for (const testcase of testCases) {
    // apply the decision tree to produce a Verdict per test case,
    const response = await runInDocker({ code, language, stdin: testcase.input });
    let verdict: Verdict;
    if (response.timedOut) {
      verdict = "TLE"
    }
    else if (response.oomKilled) {
      verdict = "MLE"
    }
    else if (response.exitCode !== 0) {
      verdict = "RTE"
    }
    else if (response.exitCode == 0 && response.stdout.trim() !== testcase.expectedOutput.trim()) {
      verdict = "WA"
    } else {
      verdict = "AC"
    };
    results.push({
      verdict,
      stdout: response.stdout, stderr: response.stderr, expectedOutput: testcase.expectedOutput
    });

    if (overallVerdict === "AC" && verdict !== "AC") {
      overallVerdict = verdict;
      break;
    }
  }
  return {
    overAllVerdict: overallVerdict,
    results
  }

}
