import { spawn } from "child_process";
import fs from "fs";
import path from "path";
import os from "os";
import { languageConfigs } from "../config/languages.js";
import crypto from "crypto";

 
function runCommand(cmd: string, args: string[]): Promise<string> {
    return new Promise((resolve) => {
        const proc = spawn(cmd, args);
        let output = "";
        proc.stdout.on("data", (chunk) => { output += chunk.toString(); });
        proc.on("close", () => resolve(output.trim()));
        proc.on("error", () => resolve(""));  // fail-safe: don't crash the whole judge over an inspect failure
    });
}

interface RunInDockerResult {
    stdout: string;
    stderr: string;
    exitCode: number | null;
    timedOut: boolean;
    oomKilled: boolean;
}

export async function runInDocker({
    code,
    language,
    stdin = "",
}: {
    code: string;
    language: string;
    stdin?: string;
}): Promise<RunInDockerResult> {
    const config = languageConfigs[language];

    if (!config) {
        // This should never happen if your Zod validator's z.enum() whitelist
        // "should never happen" bugs are exactly the ones that end up happening.
        throw new Error(`Unsupported language: ${language}`);
    }
    // 1. Create a unique temp directory for this submission.
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "judge-"));

    // 2. Write the source using whatever filename this language's config
    fs.writeFileSync(path.join(tempDir, config.filename), code);

    // A unique container name is now required (not just nice-to-have) because
    const containerName = `judge-${crypto.randomUUID()}`;

    // Build the full shell command: copy source in, compile if needed, then run.
    const innerCommand = [
        `cp /app/${config.filename} .`,
        config.compileCmd,
        config.runCmd,
    ].filter(Boolean).join(" && ");


    const dockerArgs = [
        "run", "-i",
        "--network", "none",
        "--name", containerName,  
        "--memory=256m",
        "--pids-limit=64",
        "--cpus=0.5",
        "--read-only",
        "--tmpfs", "/tmp:rw,exec,size=64m",
        "-v", `${tempDir}:/app:ro`,
        "-w", "/tmp",
        config.image,
        "bash", "-c", innerCommand,
    ];

    return new Promise((resolve) => {
        // 3. spawn, not exec — spawn gives us streaming stdout/stderr as separate
        const child = spawn("docker", dockerArgs);

        child.stdin.write(stdin)
        child.stdin.end();

        let stdout = "";
        let stderr = "";
        let timedOut = false;

        child.stdout.on("data", (chunk) => {
            stdout += chunk.toString();
        });

        child.stderr.on("data", (chunk) => {
            stderr += chunk.toString();
        });

        // 4. Enforce OUR OWN timeout. Docker will never tell us "this ran too long" —
        const TIMEOUT_MS = 5000;
        const timer = setTimeout(() => {
            timedOut = true;
            child.kill("SIGKILL");
        }, TIMEOUT_MS);

        // 5. 'error' fires if the child process itself could never be spawned —
        child.on("error", (err) => {
            clearTimeout(timer);
            fs.rmSync(tempDir, { recursive: true, force: true });
            resolve({
                stdout,
                stderr: `Failed to start docker process: ${err.message}`,
                exitCode: null,
                timedOut: false,
                oomKilled: false,
            });
        });

        // 6. 'close' fires once the child process has fully exited AND all
        child.on("close", async (code) => {
            clearTimeout(timer);

            const oomKilledStr = await runCommand("docker", [
                "inspect", "--format={{.State.OOMKilled}}", containerName,
            ]);
            const oomKilled = oomKilledStr === "true";

            await runCommand("docker", ["rm", "-f", containerName]);

            // 7. Clean up the temp directory no matter what happened —
            fs.rmSync(tempDir, { recursive: true, force: true });
            
            resolve({
                stdout,
                stderr,
                exitCode: code,
                timedOut,
                oomKilled,
            });
        });
    });
}
