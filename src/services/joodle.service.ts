import("dotenv/config.js");
import axios from "axios";

// JDoodle uses specific language codes and version indexes
const LANGUAGE_MAPPING: Record<string, { language: string; versionIndex: string }> = {
    "C++": { language: "cpp17", versionIndex: "1" },      // g++ 11.4.0
    "Java": { language: "java", versionIndex: "4" },      // JDK 17.0.1
    "Python": { language: "python3", versionIndex: "4" }, // Python 3.11.5
    "JavaScript": { language: "nodejs", versionIndex: "4" } // Node 17.1.0
};

export const runCode = async (language: string, code: string, input: string = "") => {
    try {
        const langConfig = LANGUAGE_MAPPING[language];
        
        if (!langConfig) {
            throw new Error("Unsupported language");
        }

        const response = await axios.post("https://api.jdoodle.com/v1/execute", {
            clientId: process.env.JDOODLE_CLIENT_ID,
            clientSecret: process.env.JDOODLE_CLIENT_SECRET,
            script: code,
            language: langConfig.language,
            versionIndex: langConfig.versionIndex,
            stdin: input
        });

        /*
          JDoodle response format:
          {
            output: "output string\n",
            statusCode: 200,
            memory: "120",
            cpuTime: "0.01",
            error: "error message if any"
          }
        */

        // JDoodle doesn't separate stdout and stderr cleanly, everything goes to 'output'
        // But if it's a compilation error, it usually indicates it in the output string
        // or returns a different statusCode.
        const isError = response.data.statusCode !== 200 || response.data.output.toLowerCase().includes("error");

        return {
            stdout: isError ? "" : response.data.output,
            stderr: isError ? response.data.output : "",
            status: isError ? "error" : "success"
        };

    } catch (error) {
        console.error("JDoodle Service Error:", error);
        return null;
    }
};
