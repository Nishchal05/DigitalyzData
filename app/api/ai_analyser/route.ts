import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { type, message, data, weights } = body;

    const supported = ["validate", "rule", "suggest", "query"];
    if (!supported.includes(type)) {
      return NextResponse.json({ error: "Invalid type" }, { status: 400 });
    }

    const openai = new OpenAI({
      baseURL: "https://openrouter.ai/api/v1",
      apiKey: process.env.API_KEY,
    });

    const systemPrompt = `
You are an intelligent AI assistant built into a data cleaning tool called "Data Alchemist".
You help validate, query, and reason over spreadsheet-style data. There are three data types:

1. Clients:
  - ClientID
  - ClientName
  - PriorityLevel (1-5)
  - RequestedTaskIDs (list)
  - GroupTag
  - AttributesJSON

2. Workers:
  - WorkerID
  - Skills (list)
  - AvailableSlots (list)
  - MaxLoadPerPhase
  - QualificationLevel

3. Tasks:
  - TaskID
  - TaskName
  - Duration
  - RequiredSkills
  - PreferredPhases
  - MaxConcurrent

### Instructions Based on Type:
If type is **"validate"**:
- Return only real validation errors.
- Output format: ["Error 1", "Error 2", ...]

If type is **"rule"**:
- Convert message into rule JSON (e.g., coRun, phaseWindow, slotRestriction).

If type is **"suggest"**:
- Suggest helpful business rules based on the data.

If type is **"query"**:
- Convert the natural language into a filtered data subset based on the data provided.

Return only valid **JSON**. Do NOT return markdown or explanations.
`.trim();

    const completion = await openai.chat.completions.create({
      model: "mistralai/mistral-small-3.2-24b-instruct:free",
      messages: [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: `Type: ${type}\nMessage: ${message}\nData: ${JSON.stringify(data)}\nWeights: ${JSON.stringify(weights || {})}`,
        },
      ],
    });

    const rawContent = completion.choices?.[0]?.message?.content;
    if (!rawContent) {
      return NextResponse.json({ error: "No content received from AI" }, { status: 502 });
    }

    const cleaned = rawContent
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/```$/, "")
      .trim();

    let parsed;
    try {
      parsed = JSON.parse(cleaned);
    } catch (err) {
      console.warn("❌ Failed to parse AI response as JSON:", rawContent);
      return NextResponse.json(
        { error: "AI returned invalid JSON", raw: rawContent },
        { status: 500 }
      );
    }

    // ✅ FINAL RESPONSE (was missing before)
    return NextResponse.json({ result: parsed });

  } catch (error: any) {
    console.error("🔥 Internal Server Error:", error);
    return NextResponse.json(
      { error: error.message || "Unknown server error" },
      { status: 500 }
    );
  }
}
