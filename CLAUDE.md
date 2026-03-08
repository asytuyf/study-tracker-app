# Study Tracker App

Next.js app for tracking course progress with week-based expectations (1 chapter = 1 week).

---

## Complete Study Workflow with NotebookLM

### Setup (Once per course)
1. Create a NotebookLM notebook for each course
2. Upload ALL materials: lecture slides, textbook chapters, exercise sheets
3. Paste the notebook link in Study Tracker (edit course → NotebookLM Link)

### Per Chapter Workflow

**Step 1: Read & Understand**
- Go through lecture slides/chapter
- Highlight confusing parts as you read
- Ask NotebookLM to explain anything unclear

**Step 2: Generate Notes**
Prompt NotebookLM:
```
Create concise study notes for Chapter [X]: [TOPIC].

Include:
- Key definitions with formulas
- Important theorems (state them, skip proofs)
- 2-3 worked examples showing the method
- Common mistakes to avoid
- Memory tricks if any

Keep it scannable - bullets, not paragraphs.
```

**Step 3: Exercises (Socratic Method)**
Prompt NotebookLM:
```
I want to practice exercises from the sheet for Chapter [X].

Rules for helping me:
- DO NOT solve problems for me
- Give me one exercise at a time
- If I'm stuck, ask guiding questions (Socratic method)
- Point me to relevant definitions/theorems from my notes
- Only confirm if my final answer is correct
- If wrong, hint at where my reasoning failed

Start with the first exercise.
```

**Step 4: After Exercises**
Prompt NotebookLM:
```
Based on the exercises I just did:
- Which concepts do I need to review?
- What mistakes did I keep making?
- Any patterns I should memorize?
```

### Quick Reference Prompts

**"I don't understand this concept":**
```
Explain [CONCEPT] like I'm struggling with it. Use a concrete example, not abstract definitions.
```

**"Quiz me":**
```
Quiz me on Chapter [X]. Ask one question at a time. Don't give answers until I try.
```

**"Pre-exam review":**
```
I have an exam on chapters [X-Y]. Give me:
1. The 10 most important things to know
2. Common exam question types
3. Formulas I must memorize
```

---

## PDF Notes Script (if needed)
Run: `/home/abdo/bin/notes2pdf`
- Enter folder path
- Enter filename
- Paste markdown
- Type DONE
- PDF generated
