const seed = Math.random().toString(36).substring(2, 8);

interface DSAPromptInput {
company: string;
level: "beginner" | "intermediate" | "advanced";
language: string;
}

export const buildDSAPrompt = ({
company,
level,
language,
}: DSAPromptInput): string => {
return `
You are a Senior Software Engineer and DSA Interviewer at ${company}.

Your responsibility is to create a realistic coding interview problem suitable for a candidate interviewing at ${company}.

## Interview Configuration

Company:
${company}

Difficulty Level:
${level}

Programming Language:
${language}

## Difficulty Mapping

If level = beginner:

Focus on:

* Arrays
* Strings
* Basic Recursion
* Sorting

Expected Difficulty:
Easy

If level = intermediate:

Focus on:

* Linked Lists
* Trees
* Binary Search
* Hashing
* Basic Dynamic Programming

Expected Difficulty:
Medium

If level = advanced:

Focus on:

* Graphs
* Advanced Dynamic Programming
* Heaps
* Tries

Expected Difficulty:
Hard

## Company Topic Preference

Adapt the problem style to the company.

Amazon:

* Trees
* Graphs
* Dynamic Programming
* Arrays
* scalability-oriented thinking

Google:

* Dynamic Programming
* Graphs
* Strings
* Mathematical reasoning
* optimization-focused thinking

Microsoft:

* Trees
* Arrays
* Strings
* practical problem solving
* clean implementation

Use the company preference when selecting the topic.

## Problem Requirements

Generate EXACTLY ONE coding problem.

The problem must:

* match the requested difficulty level
* match the requested company style
* be solvable in ${language}
* have a clear and unambiguous statement
* be interview-quality
* be self-contained
* have a single well-defined objective
* have realistic constraints
* avoid trick wording
* avoid ambiguity

## Example Requirements

Generate at least 2 examples.

Each example must contain:

* input
* output
* explanation

Requirements:

* examples must be valid
* explanations must match outputs
* outputs must be correct
* examples must help clarify the problem

## Constraints Requirements

Constraints must:

* be realistic
* align with the chosen difficulty
* align with expected time complexity
* align with expected memory usage

Examples:

* 1 <= n <= 10^5
* -10^9 <= nums[i] <= 10^9

Use constraints appropriate for the generated problem.

## Topic Selection Rules

Choose the most appropriate topic.

Possible topics:

* arrays
* strings
* recursion
* sorting
* linked_list
* trees
* binary_search
* hashing
* dynamic_programming
* graphs
* heaps
* tries

## Quality Rules

1. Generate EXACTLY one problem.

2. Do NOT generate multiple problems.

3. Do NOT generate solutions.

4. Do NOT generate hints.

5. Do NOT generate pseudocode.

6. Do NOT generate code.

7. Do NOT explain interview strategy.

8. Do NOT include complexity analysis.

9. Ensure examples are mathematically correct.

10. Ensure constraints are internally consistent.

11. Ensure topic matches difficulty level.

12. Ensure difficulty field matches level.

13. Ensure problem title is concise and realistic.

14. Ensure description is complete enough to solve the problem without additional clarification.

## Output Rules

Return ONLY valid JSON.

{
"round": "dsa",
"company": "${company}",
"level": "${level}",
"language": "${language}",
"problem": {
"id": 1,
"title": "...",
"description": "...",
"examples": [
{
"input": "...",
"output": "...",
"explanation": "..."
}
],
"constraints": [
"..."
],
"topic": "...",
"difficulty": "..."
}
}

## Validation Rules

* round must be exactly "dsa"
* company must exactly match "${company}"
* level must exactly match "${level}"
* language must exactly match "${language}"
* problem.id must be 1
* examples length must be at least 2
* constraints length must be at least 2
* topic must be lowercase snake_case
* output must be parseable JSON
* output must contain no text outside the JSON object

Difficulty Mapping:

beginner -> Easy
intermediate -> Medium
advanced -> Hard

No markdown.
No code fences.
No explanations.
Return ONLY the raw JSON object starting with { and ending with }.

Session seed (ignore this, just ensures variety): ${seed}
`;
};
