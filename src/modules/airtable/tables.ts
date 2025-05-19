import * as dotenv from 'dotenv';
dotenv.config();

import Airtable from "airtable";

const apiKey = process.env.AIRTABLE_API_KEY;
if (!apiKey) {
  throw new Error("AIRTABLE_API_KEY is not set in environment variables");
}

Airtable.configure({ apiKey });

export const listTables = {
  description: "List all tables in an Airtable base",
  parameters: {
    baseId: {
      type: "string",
      description: "ID of the Airtable base"
    }
  },
  handler: async ({ baseId }: { baseId: string }) => {
    try {
      const response = await fetch(`https://api.airtable.com/v0/meta/bases/${baseId}/tables`, {
        headers: {
          Authorization: `Bearer ${apiKey}`
        }
      });

      if (!response.ok) {
        throw new Error(`API responded with status ${response.status}`);
      }

      const data = await response.json();
      return data.tables.map((table: any) => ({
        id: table.id,
        name: table.name,
        description: table.description,
        fields: table.fields.map((field: any) => ({
          id: field.id,
          name: field.name,
          type: field.type,
          description: field.description
        }))
      }));
    } catch (error) {
      console.error(`Error listing tables for base ${baseId}:`, error);
      throw new Error(`Failed to list tables: ${error}`);
    }
  }
};
