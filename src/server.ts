import express from "express";
import OpenAI from "openai";
import Airtable from "airtable";
import dotenv from "dotenv";

dotenv.config(); // Load environment variables from .env file

const app = express();
app.use(express.json());

const airtableApiKey = process.env.AIRTABLE_ACCESS_TOKEN;
const port = process.env.MCP_SERVER_PORT || 8080;

if (!airtableApiKey) {
  console.error("AIRTABLE_ACCESS_TOKEN is not set in the environment variables.");
  process.exit(1);
}

const openRouterApiKey = process.env.OPENROUTER_API_KEY;
if (!openRouterApiKey) {
  console.error("OPENROUTER_API_KEY is not set in the environment variables.");
  process.exit(1);
}

// Configure Airtable globally
Airtable.configure({
  apiKey: airtableApiKey
});

// Initialize OpenAI client with OpenRouter base URL override
const openai = new OpenAI({
  apiKey: openRouterApiKey,
  baseURL: "https://openrouter.ai/api/v1"
});

// --- Tool Handlers ---

// Since MCPServer and Tool abstractions are not available, we implement handlers directly

// Example: List records from Airtable
app.post("/airtable/list-records", (async (req, res) => {
  const { baseId, tableIdOrName, view, fields, maxRecords, filterByFormula, sort } = req.body;
  if (!baseId || !tableIdOrName) {
    return res.status(400).json({ error: "baseId and tableIdOrName are required" });
  }
  const base = Airtable.base(baseId);
  try {
    const records = await base(tableIdOrName)
      .select({
        view: view ?? "",
        fields: fields ?? [],
        maxRecords: maxRecords ?? 3,
        filterByFormula: filterByFormula ?? "",
        sort: sort ?? []
      })
      .all();
    res.json(records.map((record) => ({ id: record.id, fields: record.fields })));
  } catch (error: any) {
    console.error("Error listing Airtable records:", error.message);
    res.status(500).json({ error: error.message });
  }
}) as express.RequestHandler);

// Additional Airtable routes (get record, create, update, delete) can be added similarly

app.post("/openai/completions", (async (req, res) => {
  try {
    const {
      prompt,
      model = "gpt-4o-mini",
      max_tokens = 300
    } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: "prompt is required" });
    }
    const response = await openai.chat.completions.create({
      model,
      messages: [{ role: "user", content: prompt }],
      max_tokens
    });
    res.json(response);
  } catch (error: any) {
    console.error("Error creating OpenAI completion:", error.message);
    res.status(500).json({ error: error.message });
  }
}) as express.RequestHandler);

app.listen(port, () => {
  console.log(`Server listening on http://localhost:${port}`);
  console.log("Ensure your AIRTABLE_ACCESS_TOKEN and OPENROUTER_API_KEY environment variables are set.");
});
