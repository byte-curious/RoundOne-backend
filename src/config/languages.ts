export interface LanguageConfig {
  image: string;
  filename: string;
  compileCmd?: string;   // shell command, run inside the container's writable dir, if compilation is needed
  runCmd: string;        // shell command to actually execute
}

export const languageConfigs: Record<string, LanguageConfig> = {
  python: {
    image: "python:3.11-slim",
    filename: "solution.py",
    runCmd: "python solution.py",
  },
  javascript: {
    image: "node:20-slim",
    filename: "solution.js",
    runCmd: "node solution.js",
  },
  cpp: {
    image: "gcc:14",
    filename: "solution.cpp",
    compileCmd: "g++ solution.cpp -o solution",
    runCmd: "./solution",
  },
  c: {
    image: "gcc:14",
    filename: "solution.c",
    compileCmd: "gcc solution.c -o solution",
    runCmd: "./solution",
  },
  java: {
    image: "eclipse-temurin:21-jdk-jammy",
    filename: "Main.java",
    compileCmd: "javac Main.java",
    runCmd: "java Main",
  },
};
