import axios from "axios";

// Piston requires both the language name and the version
const LANGUAGE_MAPPING: Record<string, { language: string; version: string }> = {
    "C++": { language: "c++", version: "10.2.0" },
    "Java": { language: "java", version: "15.0.2" },
    "Python": { language: "python", version: "3.10.0" },
    "JavaScript": { language: "javascript", version: "18.15.0" }
};

export const runCode = async (language: string, code: string, input: string = "") => {
    try {
        const langConfig = LANGUAGE_MAPPING[language];
        
        if (!langConfig) {
            throw new Error("Unsupported language");
        }

        // Make request to Piston's free public API
        const response = await axios.post("https://emkc.org/api/v2/piston/execute", {
            language: langConfig.language,
            version: langConfig.version,
            files: [
                {
                    content: code
                }
            ],
            stdin: input
        });

        /* 
          Piston returns an object that looks like this:
          {
            run: {
              stdout: "output here",
              stderr: "error here",
              code: 0 // 0 means success, 1 means error
            }
          }
        */
        
        return {
            stdout: response.data.run.stdout,
            stderr: response.data.run.stderr,
            status: response.data.run.code === 0 ? "success" : "error"
        };

    } catch (error) {
        console.error("Piston Service Error:", error);
        return null;
    }
};
