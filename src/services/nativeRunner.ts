import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import pLimit from "p-limit";

// Limit to max 2 concurrent compilations so memory stays under 200MB
const limit = pLimit(2);

interface RunResult {
  stdout: string;
  stderr: string;
  exitCode: number | null;
  timedOut: boolean;
}

async function executeSubprocess(language: string, code: string, stdin = ""): Promise<RunResult> {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "sandbox-"));
  let filename = "";
  let compileCmd = "";
  let runCmd = "";
  let runArgs: string[] = [];

  switch (language.toLowerCase()) {
    case "python":
      filename = "solution.py";
      runCmd = "python3";
      runArgs = [path.join(tempDir, filename)];
      break;
    case "javascript":
      filename = "solution.js";
      runCmd = "node";
      runArgs = ["--max-old-space-size=64", path.join(tempDir, filename)];
      break;
    case "cpp":
    case "c++":
      filename = "solution.cpp";
      compileCmd = `g++ -O2 ${path.join(tempDir, filename)} -o ${path.join(tempDir, "solution")}`;
      runCmd = path.join(tempDir, "solution");
      break;
    case "java":
      filename = "Main.java";
      compileCmd = `javac ${path.join(tempDir, filename)}`;
      runCmd = "java";
      runArgs = ["-Xmx128m", "-cp", tempDir, "Main"];
      break;
    default:
      throw new Error(`Unsupported language: ${language}`);
  }

  fs.writeFileSync(path.join(tempDir, filename), code);

  // Compile if language requires it
  if (compileCmd) {
    const [bin, ...args] = compileCmd.split(" ");
    const comp = spawn(bin!, args);
    let compErr = "";
    comp.stderr.on("data", (d: any) => (compErr += d.toString()));
    const compCode = await new Promise((res) => comp.on("close", res));

    if (compCode !== 0) {
      fs.rmSync(tempDir, { recursive: true, force: true });
      return { stdout: "", stderr: compErr || "Compilation Error", exitCode: 1, timedOut: false };
    }
  }

  // Execute with 4 second timeout
  return new Promise((resolve) => {
    const child = spawn(runCmd, runArgs, { stdio: ["pipe", "pipe", "pipe"] });
    child.stdin.write(stdin);
    child.stdin.end();

    let stdout = "";
    let stderr = "";
    let timedOut = false;

    child.stdout.on("data", (d: any) => (stdout += d.toString()));
    child.stderr.on("data", (d: any) => (stderr += d.toString()));

    const timer = setTimeout(() => {
      timedOut = true;
      child.kill("SIGKILL");
    }, 4000);

    child.on("close", (code: any) => {
      clearTimeout(timer);
      fs.rmSync(tempDir, { recursive: true, force: true });
      resolve({ stdout, stderr, exitCode: code, timedOut });
    });

    child.on("error", (err: any) => {
      clearTimeout(timer);
      fs.rmSync(tempDir, { recursive: true, force: true });
      resolve({ stdout: "", stderr: err.message, exitCode: 1, timedOut: false });
    });
  });
}

// Scheduled through concurrency queue
export const executeNative = (language: string, code: string, stdin = "") => {
  return limit(() => executeSubprocess(language, code, stdin));
};
