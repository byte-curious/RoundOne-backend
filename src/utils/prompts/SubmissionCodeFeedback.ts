interface SubmissionCodeForAC {
    question: {
        title: string
    },
    code: string,
    language: string,
    userApproach: string
}
interface SubmissionCodeForNotAC {
    question: {
        title: string,
        description: string,
    },
    code: string,
    language: string,
    userApproach: string,
    verdict: string,
}
export const submissionCodeFeedbackPromptForAC = ({ question, code, language, userApproach }: SubmissionCodeForAC) => {
    return `
You are a Staff Software Engineer at Google reviewing a successful coding interview solution.

Problem:
${question.title}

Language:
${language}

Candidate's Approach:
${userApproach || "Not provided"}

Candidate's Code:
${code}

Your tasks are ONLY:

1. Analyze the submitted code and determine its ACTUAL worst-case Time Complexity and Space Complexity.
2. Write a concise (2-3 sentences) review highlighting one strength of the solution and, if applicable, one possible optimization or code-quality improvement.

Rules:
- Analyze the submitted code, not just the standard algorithm.
- If the code is already optimal, explicitly say so.
- Do not rewrite the code.
- Do not suggest a different algorithm unless it is genuinely better.
- Return ONLY valid JSON.
- Do not include markdown, explanations, or extra text.

Return exactly:

{
  "timeComplexity": "O(...)",
  "spaceComplexity": "O(...)",
  "aiFeedback": "..."
}
`;
}
export const submissionCodeFeedbackPromptForNotAC = ({ question, language,verdict, code, userApproach }: SubmissionCodeForNotAC) => {
    return `
You are a FAANG coding interviewer.

The candidate attempted the following problem but received a verdict of "${verdict}".

Problem:
${question.title}

Language:
${language}

Candidate's Approach:
${userApproach || "Not provided"}

Problem Description:
${question.description.substring(0, 1000)}

Candidate's Code:
${code}

Your task is ONLY:

Give ONE subtle debugging hint that helps the candidate discover the mistake without revealing the solution.

Rules:
- Never provide corrected code.
- Never describe the complete algorithm.
- Never reveal the exact bug.
- Base your hint on the submitted code and the verdict.
- For WA, hint at possible logical or edge-case mistakes.
- For TLE, hint that algorithmic complexity may be too high.
- For RTE, hint at common runtime issues.
- For MLE, hint at unnecessary memory usage.
- For CE, hint at possible syntax or language misuse.
- Keep the hint under 60 words.
- Return ONLY valid JSON.

Return exactly:

{
  "timeComplexity": "N/A",
  "spaceComplexity": "N/A",
  "aiFeedback": "..."
}
`;
}

