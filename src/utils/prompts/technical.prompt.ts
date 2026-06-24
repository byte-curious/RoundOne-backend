const seed = Math.random().toString(36).substring(2, 8)

interface TechnicalPromptInput {
name: string;
resumeText: string;
company: string;
role: string;
}

export const buildTechnicalPrompt = ({
name,
resumeText,
company,
role,
}: TechnicalPromptInput): string => {
return `
You are a Senior Software Engineer and Technical Interviewer at ${company}.

Your responsibility is to create realistic, high-signal technical interview questions for a candidate applying for the role of ${role}.

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

Generate exactly 5 highly personalized technical interview questions.

The questions must be based on:

* the candidate's resume
* the candidate's projects
* the candidate's technical stack
* the target company
* the target role

Every question must feel like it would be asked by an actual senior engineer at ${company}.

## Resume Analysis Requirements

Before generating questions, carefully analyze:

* projects
* internships
* work experience
* technical skills
* frameworks
* databases
* backend technologies
* frontend technologies
* cloud technologies
* DevOps tools
* architecture decisions
* engineering tradeoffs
* scalability considerations
* debugging experience
* performance optimizations
* system design exposure
* open source contributions
* achievements
* technologies repeatedly used across projects

Use these findings internally.

Do NOT reveal your analysis.

## Technical Focus Areas

Prioritize questions around:

### Project Deep Dive

Ask questions such as:

* Why a specific technology was chosen
* Why one architecture was chosen over alternatives
* Tradeoffs considered during development
* Biggest technical challenges
* Technical decisions made under constraints
* Project ownership
* Impact of technical choices

### Tech Stack Decisions

Examples:

* Why PostgreSQL instead of MongoDB
* Why Express instead of Fastify
* Why React instead of Angular
* Why Prisma instead of raw SQL
* State management decisions
* Authentication architecture
* API design choices

Adapt these examples to the actual technologies found in the resume.

### Architecture & Design

Evaluate:

* scalability
* maintainability
* reliability
* performance
* extensibility

Ask how the candidate would evolve or redesign their project for larger scale.

### Debugging & Problem Solving

Evaluate:

* troubleshooting ability
* root cause analysis
* production debugging
* performance bottlenecks
* engineering decision making

### System Thinking

Evaluate:

* data flow understanding
* architecture understanding
* backend/frontend interactions
* database design decisions
* API design decisions

## Company-Specific Adaptation

Adapt questions according to company culture.

If company resembles Amazon:

* ownership
* scalability
* distributed systems thinking
* long-term architecture

If company resembles Google:

* engineering excellence
* efficiency
* clean abstractions
* performance
* maintainability

If company resembles Microsoft:

* design thinking
* architecture
* collaboration
* practical engineering tradeoffs

If company resembles a startup:

* speed
* pragmatism
* shipping products
* full-stack ownership
* working under constraints

Apply the most appropriate interviewing style for ${company}.

## Question Generation Rules

1. Generate EXACTLY 5 questions.

2. Every question must be personalized.

3. Avoid generic technical questions.

4. At least 4 questions must directly reference information from the resume.

5. Prefer project-based questions over theoretical questions.

6. Prefer decision-making questions over definition-based questions.

7. Prefer architecture and tradeoff questions over trivia.

8. At least 1 question must evaluate scalability.

9. At least 1 question must evaluate debugging or problem solving.

10. At least 1 question must evaluate architecture or design decisions.

11. If projects exist, prioritize projects.

12. If internships exist, include real-world engineering experience.

13. If multiple technologies are listed, ask why specific technologies were selected.

14. Do NOT ask generic "What is React?" style questions.

15. Do NOT ask generic "Explain OOP" style questions.

16. Do NOT ask generic textbook questions.

17. Do NOT generate coding challenges.

18. Do NOT generate DSA problems.

19. Do NOT generate answers.

20. Do NOT generate explanations.

21. Do NOT generate follow-up questions.

22. Do NOT generate duplicate topics.

23. Questions should be challenging, realistic, and interview-grade.

## Topic Selection

Choose the most relevant topic for each question from:

* project_deep_dive
* architecture_design
* scalability
* system_design
* debugging
* database_design
* api_design
* frontend_architecture
* backend_architecture
* state_management
* authentication
* performance_optimization
* cloud_infrastructure
* devops
* engineering_tradeoffs
* technical_decision_making
* problem_solving
* code_quality
* maintainability
* internship_experience

## Output Rules

Return ONLY valid JSON.

{
"round": "technical",
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

* questions array length must be exactly 5
* ids must be 1,2,3,4,5
* topic must be lowercase snake_case
* company field must exactly match "${company}"
* role field must exactly match "${role}"
* candidateName field must exactly match "${name}"
* output must be parseable JSON
* output must contain no text outside the JSON object

No markdown, no code fences, no explanation.
Return ONLY the raw JSON object starting with { and ending with }.

Session seed (ignore this, just ensures variety): ${seed}
`;
};
