import * as dotenv from 'dotenv';
dotenv.config();

import Airtable from "airtable";

const apiKey = process.env.AIRTABLE_API_KEY;
if (!apiKey) {
  throw new Error("AIRTABLE_API_KEY is not set in environment variables");
}

Airtable.configure({ apiKey });

export const listBases = {
  description: "List all Airtable bases accessible with this API key",
  parameters: {},
  handler: async () => {
    try {
      const response = await fetch("https://api.airtable.com/v0/meta/bases", {
        headers: {
          Authorization: `Bearer ${apiKey}`
        }
      });

      if (!response.ok) {
        throw new Error(`API responded with status ${response.status}`);
      }

      const data = await response.json();
      return data.bases.map((base: any) => ({
        id: base.id,
        name: base.name,
        permissionLevel: base.permissionLevel
      }));
      } catch (error) {
      console.error("Error listing bases:", error);
      throw new Error(`Failed to list bases: ${error}`);
    }
  }
};
