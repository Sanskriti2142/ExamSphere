
import express from "express";
import Groq from "groq-sdk";
import dotenv from "dotenv";
import cors from "cors";

dotenv.config();

const API_KEY = process.env.GROQ_API_KEY;

if (!API_KEY) {
  console.error("Groq API key not found in .env");
  process.exit(1);
}

const app = express();
app.use(cors());
app.use(express.json({ limit: "20kb" }));

const groq = new Groq({ apiKey: API_KEY });
const MODEL = "openai/gpt-oss-20b";

// Check server
app.get("/", (req, res) => {
  res.send("ExamSphere AI Server is running!");
});

// Test AI connection
app.post("/test-ai", async (req, res) => {
  try {
    const response = await groq.chat.completions.create({
      model: MODEL,
      messages: [{
        role: "user",
        content: "Reply exactly: ExamSphere AI connection successful!"
      }]
    });

    res.json({
      success: true,
      message: response.choices[0]?.message?.content
    });

  } catch (error) {
    console.error("Groq Error:", error.message);

    res.status(500).json({
      success: false,
      error: "AI connection failed."
    });
  }
});

// Generate AI questions
app.post("/generate-questions", async (req, res) => {
  try {
    let { exam, subject, topic, difficulty, count } = req.body;

    count = Number(count);

    // Validate user input
    if (
      typeof exam !== "string" ||
      typeof subject !== "string" ||
      typeof topic !== "string" ||
      !exam.trim() ||
      !subject.trim() ||
      !topic.trim() ||
      exam.length > 100 ||
      subject.length > 100 ||
      topic.length > 150 ||
      !["Easy", "Medium", "Hard"].includes(difficulty) ||
      ![5, 10, 25].includes(count)
    ) {
      return res.status(400).json({
        success: false,
        error: "Please provide valid test details."
      });
    }

    exam = exam.trim();
    subject = subject.trim();
    topic = topic.trim();

    // JSON format for AI questions
    const schema = {
      type: "object",
      properties: {
        questions: {
          type: "array",
          items: {
            type: "object",
            properties: {
              question: { type: "string" },
              options: {
                type: "array",
                items: { type: "string" }
              },
              answer: {
                type: "integer",
                enum: [0, 1, 2, 3]
              },
              explanation: { type: "string" }
            },
            required: [
              "question",
              "options",
              "answer",
              "explanation"
            ],
            additionalProperties: false
          }
        }
      },
      required: ["questions"],
      additionalProperties: false
    };

    // Instructions for AI

const prompt = `
You are an expert examination question setter for ExamSphere.

Generate exactly ${count} original multiple-choice questions.

EXAM DETAILS:
Exam: ${exam}
Subject: ${subject}
Topic: ${topic}
Difficulty: ${difficulty}

MAIN OBJECTIVE:
Create questions that match the selected examination while
maintaining a balanced mixture of question types.

1. EXAM-SPECIFIC QUESTIONS

Follow the general question style and academic level of the
selected examination.

- CBSE: Focus on NCERT concepts, textbook knowledge,
  applications and board-level understanding.
- JEE Main: Focus on conceptual understanding and
  problem-solving, including numerical questions where relevant.
- JEE Advanced: Include deeper reasoning and multi-step
  conceptual problems appropriate to the selected topic.
- NEET UG: Focus on subject knowledge, scientific concepts
  and relevant application-based questions.
- CLAT: Focus on comprehension, legal reasoning and logical
  reasoning according to the selected subject.
- CA Foundation, Intermediate and Final: Use relevant
  accounting, taxation, law and finance concepts.
- CUET UG: Focus on subject knowledge, comprehension
  and application-based questions.

For other exams, follow their general academic level and
the selected subject.

2. BALANCED QUESTION TYPES

Use a suitable mixture of:
- Conceptual questions
- Factual and knowledge-based questions
- Numerical questions
- Application and reasoning questions

Do not force numerical questions into subjects where
they are not relevant.

3. DIFFICULTY LEVEL

Easy:
Test basic concepts, definitions and direct applications.

Medium:
Test understanding, comparisons and moderate problem-solving.

Hard:
Test deeper concepts, logical reasoning and multi-step problems.

4. QUESTION QUALITY

- Stay strictly within the selected topic.
- Keep questions clear and unambiguous.
- Generate original questions.
- Do not repeat questions or rephrase the same question.
- Do not create misleading options.
- Make all four options different.
- Ensure exactly one option is correct.
- Do not invent facts, formulas or legal provisions.

5. EXPLANATIONS

- Explain why the correct option is correct.
- Keep explanations simple and educational.
- For numerical questions, show the formula and calculation steps.
- Avoid explanations that simply repeat the correct option.

6. OUTPUT REQUIREMENTS

- Generate exactly ${count} questions.
- Every question must have exactly four options.
- The answer must be an integer: 0, 1, 2 or 3.
- Include one explanation for every question.
- Return only the required JSON structure.
- Do not claim that questions are officially verified
  previous-year questions.

Create a useful practice test that helps students prepare
for the selected examination.
`;


    // Send request to Groq
    const response = await groq.chat.completions.create({
      model: MODEL,
      messages: [{
        role: "user",
        content: prompt
      }],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "exam_questions",
          strict: true,
          schema: schema
        }
      },
      max_completion_tokens: 6000
    });

    const content = response.choices[0]?.message?.content;

    if (!content) {
      throw new Error("AI returned an empty response.");
    }

    const result = JSON.parse(content);
    const questions = result.questions;

    // Check question count
    if (!Array.isArray(questions) || questions.length !== count) {
      throw new Error("Incorrect number of questions generated.");
    }

    // Check every question
    const seenQuestions = new Set();

    for (let q of questions) {
      if (
        typeof q.question !== "string" ||
        !q.question.trim() ||
        !Array.isArray(q.options) ||
        q.options.length !== 4 ||
        !Number.isInteger(q.answer) ||
        q.answer < 0 ||
        q.answer > 3 ||
        typeof q.explanation !== "string" ||
        !q.explanation.trim()
      ) {
        throw new Error("AI returned invalid question data.");
      }

      // Check for repeated questions
      const questionText = q.question.trim().toLowerCase();

      if (seenQuestions.has(questionText)) {
        throw new Error("AI generated duplicate questions. Please try again.");
      }

      seenQuestions.add(questionText);

      // Check for repeated options
      const options = q.options.map(option =>
        typeof option === "string" ? option.trim().toLowerCase() : ""
      );

      if (options.some(option => !option) || new Set(options).size !== 4) {
        throw new Error("A question contains invalid or repeated options.");
      }
    }

    console.log(count + " questions generated successfully.");

    res.json({
      success: true,
      questions: questions
    });

  } catch (error) {
    console.error("Question Generation Error:", error.message);

    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Start server
const PORT = 3000;

app.listen(PORT, () => {
  console.log("ExamSphere server running at http://localhost:" + PORT);
});
