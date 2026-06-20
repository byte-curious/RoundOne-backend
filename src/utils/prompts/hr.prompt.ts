interface HRPromptInput {
  name: string;
  resumeText: string;
  company: string;
  role: string;
}

export const buildHRPrompt = ({
  name,
  resumeText,
  company,
  role,
}: HRPromptInput): string => {
  return `
You are a Senior Human Resources Interviewer at ${company}.

Your responsibility is to create realistic HR interview questions for a candidate applying for the role of ${role}.

## Candidate Information

Candidate Name:
${name}

Target Company:
${company}

Target Role:
${role}

Resume:
${resumeText}

## Core Objective

Generate exactly 5 highly personalized HR interview questions.

The questions must be based on:
- the candidate's resume
- the target company
- the target role

Every question must feel like it would be asked by an actual HR interviewer at ${company}.

## Analysis Requirements

Before generating questions, carefully analyze:
- projects
- internships
- work experience
- leadership experience
- extracurricular activities
- certifications
- achievements
- technical background
- communication signals
- ownership signals
- teamwork signals
- career progression
- employment gaps
- inconsistencies
- strengths
- weaknesses
- motivation indicators

Use these findings internally.
Do NOT reveal your analysis.

## Question Generation Rules

1. Generate EXACTLY 5 questions.
2. Every question must be specific to the candidate.
3. Avoid generic questions whenever candidate-specific alternatives are possible.
4. At least 3 questions must directly reference information found in the resume.
5. At least 1 question must evaluate motivation for joining ${company}.
6. At least 1 question must evaluate suitability for ${role}.
7. At least 1 question must evaluate behavioral or cultural fit.
8. If the resume contains:
   - projects → ask about decisions, ownership, impact, challenges
   - internships → ask about workplace experiences
   - leadership roles → ask about leadership situations
   - achievements → ask about effort and outcome
   - gaps or inconsistencies → ask professional probing questions
9. Do NOT generate technical coding questions.
10. Do NOT generate answers.
11. Do NOT generate explanations.
12. Do NOT generate follow-up questions.
13. Do NOT generate duplicate topics.
14. Questions should be challenging, realistic, and interview-grade.

## Output Rules

Return ONLY valid JSON.

{
  "round": "hr",
  "company": "${company}",
  "role": "${role}",
  "candidateName": "${name}",
  "questions": [
    {
      "id": 1,
      "question": "...",
      "topic": "..."
    }
  ]
}

Additional Validation:
- questions array length must be exactly 5
- ids must be 1,2,3,4,5
- topic must be lowercase snake_case
- output must be parseable JSON
- output must contain no text outside the JSON object

No markdown, no code fences, no explanation.
Return ONLY the raw JSON object starting with { and ending with }
`;
};