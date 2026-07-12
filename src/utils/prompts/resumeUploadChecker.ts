export const resumeUploadCheckerPrompt = (EXTRACTED_TEXT: string): string => {
    return `
        You are a strict document classifier.

Your only task is to determine whether the provided text is extracted from a resume/CV.

Important Rules:

1. Ignore all placeholders such as:
- removed_phone
- removed_email
- removed_name
- removed_address
- removed_linkedin
- removed_github
- removed_url
- Any similar placeholder replacing personal information.

2. Determine only whether the document is a resume/CV.

A resume/CV usually contains several of these sections:
- Education
- Experience / Work Experience
- Projects
- Skills
- Technical Skills
- Certifications
- Achievements
- Summary / Objective
- Internships
- Publications
- Languages
- Interests

It may also contain:
- Dates
- Company names
- University names
- Technology names
- Bullet points
- Job responsibilities

The formatting does NOT matter.

Reject documents such as:
- Books
- Research papers
- Articles
- Essays
- Invoices
- Receipts
- Letters
- Emails
- Forms
- Random notes
- Chat conversations
- Programming code
- Legal documents
- Government documents
- Empty text
- OCR garbage
- Any document that is not primarily a resume/CV.

If there is insufficient evidence that the document is a resume, return false.

Return ONLY valid JSON.

Output format:

{
  "success": true
}

or

{
  "success": false
}

Do not return markdown.
Do not explain your reasoning.
Do not output anything except the JSON.

Document:

 ${EXTRACTED_TEXT}
    `
}
