import express from "express";
import { MCPServer, Tool, ToolContext, ValidatedToolInput } from "@anthropic-ai/sdk";
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

// Configure Airtable globally - this uses the legacy API key method.
// For Personal Access Tokens, you typically pass them in headers for each request.
// The 'airtable' library version 0.12.2+ supports PATs like API keys.
Airtable.configure({
  apiKey: airtableApiKey
});

// --- Tool Definitions ---

const listTablesTool: Tool = {
  name: "airtable_list_tables",
  description: "Lists all tables within a specified Airtable base.",
  input_schema: {
    type: "object",
    properties: {
      baseId: { type: "string", description: "The ID of the Airtable base." }
    },
    required: ["baseId"]
  },
  handler: async (input: ValidatedToolInput, context: ToolContext) => {
    try {
      const { baseId } = input as { baseId: string };
      // Note: The standard Airtable REST API does not have a direct endpoint
      // to list tables by name or ID for a given base ID using a PAT easily without Enterprise.
      // This functionality is typically available via the Metadata API (Enterprise)
      // or by inspecting a base's structure manually or through other means.
      // For non-Enterprise, users usually know their table names or IDs.
      // We'll simulate a helpful message or if you have a specific way to fetch table schemas, implement it here.
      // As a placeholder, we can't directly list tables without Metadata API or prior knowledge.
      console.warn(`[Tool:airtable_list_tables] Direct table listing via base ID is complex without Metadata API. 
                     User should ideally provide table name or ID.`);
      return {
        message:
          "Cannot directly list all tables for a base programmatically without Airtable's Metadata API (Enterprise). Please provide the specific table name or ID you want to interact with.",
        tip: "You can find table names and IDs in your Airtable base URL or by inspecting network requests when using Airtable."
      };
      // If you *do* have access to Metadata API or another method:
      // const base = Airtable.base(baseId); // This doesn't list tables.
      // You'd need to make a raw fetch call to the Metadata API endpoint if applicable.
    } catch (error: any) {
      console.error("Error in airtable_list_tables:", error.message);
      return { error: error.message };
    }
  }
};

const listRecordsTool: Tool = {
  name: "airtable_list_records",
  description:
    "Lists records from a specified Airtable table. Supports filtering, sorting, and field selection.",
  input_schema: {
    type: "object",
    properties: {
      baseId: { type: "string", description: "The ID of the Airtable base." },
      tableIdOrName: { type: "string", description: "The ID or name of the table." },
      view: {
        type: "string",
        description:
          "Optional. The name or ID of an Airtable view. If provided, records will be from this view."
      },
      fields: {
        type: "array",
        items: { type: "string" },
        description:
          "Optional. An array of field names to retrieve. If omitted, all fields are retrieved."
      },
      maxRecords: {
        type: "integer",
        description: "Optional. Maximum number of records to return. Defaults to 100."
      },
      filterByFormula: {
        type: "string",
        description:
          "Optional. An Airtable formula used to filter records. Example: \"{Status} = 'Done'\""
      },
      sort: {
        type: "array",
        items: {
          type: "object",
          properties: {
            field: { type: "string" },
            direction: { type: "string", enum: ["asc", "desc"] }
          },
          required: ["field"]
        },
        description:
          "Optional. Specifies how records should be sorted. Example: [{field: 'Name', direction: 'asc'}]"
      }
    },
    required: ["baseId", "tableIdOrName"]
  },
  handler: async (input: ValidatedToolInput, context: ToolContext) => {
    try {
      const { baseId, tableIdOrName, view, fields, maxRecords, filterByFormula, sort } =
        input as any;
      const base = Airtable.base(baseId);
      const records = await base(tableIdOrName)
        .select({ view, fields, maxRecords, filterByFormula, sort })
        .all();
      return records.map((record) => ({ id: record.id, fields: record.fields }));
    } catch (error: any) {
      console.error("Error in airtable_list_records:", error.message);
      return { error: error.message, details: error.toString() };
    }
  }
};

const getRecordTool: Tool = {
  name: "airtable_get_record",
  description: "Retrieves a specific record from an Airtable table by its ID.",
  input_schema: {
    type: "object",
    properties: {
      baseId: { type: "string", description: "The ID of the Airtable base." },
      tableIdOrName: { type: "string", description: "The ID or name of the table." },
      recordId: { type: "string", description: "The ID of the record to retrieve." }
    },
    required: ["baseId", "tableIdOrName", "recordId"]
  },
  handler: async (input: ValidatedToolInput, context: ToolContext) => {
    try {
      const { baseId, tableIdOrName, recordId } = input as {
        baseId: string;
        tableIdOrName: string;
        recordId: string;
      };
      const base = Airtable.base(baseId);
      const record = await base(tableIdOrName).find(recordId);
      return { id: record.id, fields: record.fields };
    } catch (error: any) {
      console.error("Error in airtable_get_record:", error.message);
      return { error: error.message, details: error.toString() };
    }
  }
};

const createRecordTool: Tool = {
  name: "airtable_create_record",
  description: "Creates a new record in an Airtable table.",
  input_schema: {
    type: "object",
    properties: {
      baseId: { type: "string", description: "The ID of the Airtable base." },
      tableIdOrName: { type: "string", description: "The ID or name of the table." },
      fields: {
        type: "object",
        description:
          "An object where keys are field names and values are the field values for the new record.",
        additionalProperties: true
      }
    },
    required: ["baseId", "tableIdOrName", "fields"]
  },
  handler: async (input: ValidatedToolInput, context: ToolContext) => {
    try {
      const { baseId, tableIdOrName, fields } = input as {
        baseId: string;
        tableIdOrName: string;
        fields: Record<string, any>;
      };
      const base = Airtable.base(baseId);
      // Airtable API expects an array of records for creation, even for a single one.
      const createdRecords = await base(tableIdOrName).create([{ fields }]);
      return createdRecords.map((record) => ({ id: record.id, fields: record.fields }))[0]; // Return the first (and only) created record
    } catch (error: any) {
      console.error("Error in airtable_create_record:", error.message);
      return { error: error.message, details: error.toString() };
    }
  }
};

const updateRecordTool: Tool = {
  name: "airtable_update_record",
  description: "Updates an existing record in an Airtable table.",
  input_schema: {
    type: "object",
    properties: {
      baseId: { type: "string", description: "The ID of the Airtable base." },
      tableIdOrName: { type: "string", description: "The ID or name of the table." },
      recordId: { type: "string", description: "The ID of the record to update." },
      fields: {
        type: "object",
        description:
          "An object where keys are field names and values are the new field values. Only provided fields will be updated.",
        additionalProperties: true
      }
    },
    required: ["baseId", "tableIdOrName", "recordId", "fields"]
  },
  handler: async (input: ValidatedToolInput, context: ToolContext) => {
    try {
      const { baseId, tableIdOrName, recordId, fields } = input as {
        baseId: string;
        tableIdOrName: string;
        recordId: string;
        fields: Record<string, any>;
      };
      const base = Airtable.base(baseId);
      // Airtable API expects an array for updates as well.
      const updatedRecords = await base(tableIdOrName).update([{ id: recordId, fields }]);
      return updatedRecords.map((record) => ({ id: record.id, fields: record.fields }))[0];
    } catch (error: any) {
      console.error("Error in airtable_update_record:", error.message);
      return { error: error.message, details: error.toString() };
    }
  }
};

const deleteRecordTool: Tool = {
  name: "airtable_delete_record",
  description: "Deletes a record from an Airtable table.",
  input_schema: {
    type: "object",
    properties: {
      baseId: { type: "string", description: "The ID of the Airtable base." },
      tableIdOrName: { type: "string", description: "The ID or name of the table." },
      recordId: { type: "string", description: "The ID of the record to delete." }
    },
    required: ["baseId", "tableIdOrName", "recordId"]
  },
  handler: async (input: ValidatedToolInput, context: ToolContext) => {
    try {
      const { baseId, tableIdOrName, recordId } = input as {
        baseId: string;
        tableIdOrName: string;
        recordId: string;
      };
      const base = Airtable.base(baseId);
      // Airtable API expects an array of record IDs for deletion.
      const deletedRecords = await base(tableIdOrName).destroy([recordId]);
      return { deleted: true, id: deletedRecords.map((r) => r.id)[0] };
    } catch (error: any) {
      console.error("Error in airtable_delete_record:", error.message);
      return { error: error.message, details: error.toString() };
    }
  }
};

const searchRecordsTool: Tool = {
  name: "airtable_search_records",
  description:
    "Searches records in a specific Airtable table based on a search term across specified fields. This uses a simple text search (case-insensitive).",
  // Based on the search result from [github.com](https://github.com/domdomegg/airtable-mcp-server)
  input_schema: {
    type: "object",
    properties: {
      baseId: { type: "string", description: "The ID of the Airtable base." },
      tableIdOrName: { type: "string", description: "The ID or name of the table." },
      searchTerm: { type: "string", description: "Text to search for in records." },
      fieldNames: {
        type: "array",
        items: { type: "string" },
        description:
          "Specific field names (not IDs) to search in. If not provided, the tool may attempt to search common text fields or return an error if too broad."
      },
      maxRecords: {
        type: "number",
        description: "Maximum number of records to return. Defaults to 100."
      }
    },
    required: ["baseId", "tableIdOrName", "searchTerm", "fieldNames"]
  },
  handler: async (input: ValidatedToolInput, context: ToolContext) => {
    const {
      baseId,
      tableIdOrName,
      searchTerm,
      fieldNames,
      maxRecords = 100
    } = input as {
      baseId: string;
      tableIdOrName: string;
      searchTerm: string;
      fieldNames: string[];
      maxRecords?: number;
    };

    if (!fieldNames || fieldNames.length === 0) {
      return {
        error:
          "The 'fieldNames' array must be provided and contain at least one field name to search in."
      };
    }

    try {
      const base = Airtable.base(baseId);
      // Constructing the formula: OR(FIND(LOWER('searchTerm'), LOWER({Field1})), FIND(LOWER('searchTerm'), LOWER({Field2})), ...)
      const searchFormulaParts = fieldNames.map(
        (fieldName) => `FIND(LOWER("${searchTerm.replace(/"/g, '""')}"), LOWER({${fieldName}}))`
      );
      const filterByFormula = `OR(${searchFormulaParts.join(", ")})`;

      const records = await base(tableIdOrName)
        .select({
          filterByFormula: filterByFormula,
          maxRecords: maxRecords
        })
        .all();

      return records.map((record) => ({ id: record.id, fields: record.fields }));
    } catch (error: any) {
      console.error("Error in airtable_search_records:", error.message);
      return {
        error: error.message,
        details: error.toString(),
        constructedFormula: `OR(${fieldNames
          .map(
            (fieldName) => `FIND(LOWER("${searchTerm.replace(/"/g, '""')}"), LOWER({${fieldName}}))`
          )
          .join(", ")})`
      };
    }
  }
};

// --- MCP Server Setup ---
const mcpServer = new MCPServer({
  pretty_print_json: true, // Useful for debugging
  tools: [
    listTablesTool, // Note limitations mentioned above for this tool
    listRecordsTool,
    getRecordTool,
    createRecordTool,
    updateRecordTool,
    deleteRecordTool,
    searchRecordsTool
  ]
});

app.post("/mcp", (req, res) => {
  mcpServer
    .handleRequest(req.body)
    .then((response) => {
      res.json(response);
    })
    .catch((error) => {
      console.error("Error handling MCP request:", error);
      res.status(500).json({ error: "Internal Server Error" });
    });
});

app.get("/mcp/tools", (req, res) => {
  res.json(mcpServer.getTools());
});

app.listen(port, () => {
  console.log(`MCP Server for Airtable listening on http://localhost:${port}`);
  console.log(
    `Registered tools: ${mcpServer
      .getTools()
      .map((t) => t.name)
      .join(", ")}`
  );
  console.log(
    "IMPORTANT: Ensure your AIRTABLE_ACCESS_TOKEN environment variable is set with a valid Personal Access Token."
  );
  console.log(
    "The 'airtable_list_tables' tool has limitations without Airtable's Metadata API (Enterprise). Users should typically know their table names/IDs."
  );
});
