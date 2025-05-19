import * as dotenv from 'dotenv';
dotenv.config();

import Airtable from "airtable";

const apiKey = process.env.AIRTABLE_API_KEY;
if (!apiKey) {
  throw new Error("AIRTABLE_API_KEY is not set in environment variables");
}

Airtable.configure({ apiKey });

export const listRecords = {
  description: "List records from an Airtable table",
  parameters: {
    baseId: {
      type: "string",
      description: "ID of the Airtable base"
    },
    tableIdOrName: {
      type: "string",
      description: "ID or name of the table"
    },
    maxRecords: {
      type: "number",
      description: "Maximum number of records to return (default: 100)",
      optional: true
    },
    view: {
      type: "string",
      description: "Name or ID of a view to use",
      optional: true
    },
    sort: {
      type: "array",
      items: {
        type: "object",
        properties: {
          field: { type: "string" },
          direction: { type: "string", enum: ["asc", "desc"] }
        }
      },
      description: "Sorting options",
      optional: true
    }
  },
  handler: async ({
    baseId,
    tableIdOrName,
    maxRecords = 100,
    view,
    sort
  }: {
    baseId: string;
    tableIdOrName: string;
    maxRecords?: number;
    view?: string;
    sort?: { field: string; direction: "asc" | "desc" }[];
  }) => {
    try {
      const base = Airtable.base(baseId);
      const queryParams: any = { maxRecords };

      if (view) queryParams.view = view;
      if (sort) queryParams.sort = sort;

      const records = await base(tableIdOrName).select(queryParams).all();
      return records.map(record => ({
        id: record.id,
        fields: record.fields,
        createdTime: (record as any).createdTime
      }));
    } catch (error) {
      console.error(`Error listing records from ${tableIdOrName}:`, error);
      throw new Error(`Failed to list records: ${error}`);
    }
  }
};

export const getRecord = {
  description: "Get a specific record from an Airtable table by ID",
  parameters: {
    baseId: {
      type: "string",
      description: "ID of the Airtable base"
    },
    tableIdOrName: {
      type: "string",
      description: "ID or name of the table"
    },
    recordId: {
      type: "string",
      description: "ID of the record to retrieve"
    }
  },
  handler: async ({
    baseId,
    tableIdOrName,
    recordId
  }: {
    baseId: string;
    tableIdOrName: string;
    recordId: string;
  }) => {
    try {
      const base = Airtable.base(baseId);
      const record = await base(tableIdOrName).find(recordId);
      return {
        id: record.id,
        fields: record.fields,
        createdTime: (record as any).createdTime
      };
    } catch (error) {
      console.error(`Error getting record ${recordId}:`, error);
      throw new Error(`Failed to get record: ${error}`);
    }
  }
};

export const createRecord = {
  description: "Create a new record in an Airtable table",
  parameters: {
    baseId: {
      type: "string",
      description: "ID of the Airtable base"
    },
    tableIdOrName: {
      type: "string",
      description: "ID or name of the table"
    },
    fields: {
      type: "object",
      description: "Fields and values for the new record"
    }
  },
  handler: async ({
    baseId,
    tableIdOrName,
    fields
  }: {
    baseId: string;
    tableIdOrName: string;
    fields: Record<string, any>;
  }) => {
    try {
      const base = Airtable.base(baseId);
      const record = await base(tableIdOrName).create(fields);
      return {
        id: record.id,
        fields: record.fields,
        createdTime: (record as any).createdTime
      };
    } catch (error) {
      console.error(`Error creating record in ${tableIdOrName}:`, error);
      throw new Error(`Failed to create record: ${error}`);
    }
  }
};

export const updateRecord = {
  description: "Update an existing record in an Airtable table",
  parameters: {
    baseId: {
      type: "string",
      description: "ID of the Airtable base"
    },
    tableIdOrName: {
      type: "string",
      description: "ID or name of the table"
    },
    recordId: {
      type: "string",
      description: "ID of the record to update"
    },
    fields: {
      type: "object",
      description: "Fields and values to update"
    }
  },
  handler: async ({
    baseId,
    tableIdOrName,
    recordId,
    fields
  }: {
    baseId: string;
    tableIdOrName: string;
    recordId: string;
    fields: Record<string, any>;
  }) => {
    try {
      const base = Airtable.base(baseId);
      const record = await base(tableIdOrName).update(recordId, fields);
      return {
        id: record.id,
        fields: record.fields,
        createdTime: (record as any).createdTime
      };
    } catch (error) {
      console.error(`Error updating record ${recordId}:`, error);
      throw new Error(`Failed to update record: ${error}`);
    }
  }
};

export const deleteRecord = {
  description: "Delete a record from an Airtable table",
  parameters: {
    baseId: {
      type: "string",
      description: "ID of the Airtable base"
    },
    tableIdOrName: {
      type: "string",
      description: "ID or name of the table"
    },
    recordId: {
      type: "string",
      description: "ID of the record to delete"
    }
  },
  handler: async ({
    baseId,
    tableIdOrName,
    recordId
  }: {
    baseId: string;
    tableIdOrName: string;
    recordId: string;
  }) => {
    try {
      const base = Airtable.base(baseId);
      const deletedRecord = await base(tableIdOrName).destroy(recordId);
      return {
        id: deletedRecord.id,
        deleted: true
      };
    } catch (error) {
      console.error(`Error deleting record ${recordId}:`, error);
      throw new Error(`Failed to delete record: ${error}`);
    }
  }
};

export const searchRecords = {
  description: "Search for records in an Airtable table",
  parameters: {
    baseId: {
      type: "string",
      description: "ID of the Airtable base"
    },
    tableIdOrName: {
      type: "string",
      description: "ID or name of the table"
    },
    searchTerm: {
      type: "string",
      description: "Text to search for in records"
    },
    fieldIds: {
      type: "array",
      items: { type: "string" },
      description: "Specific field IDs to search in. If not provided, searches all text-based fields",
      optional: true
    },
    maxRecords: {
      type: "number",
      description: "Maximum number of records to return (default: 100)",
      optional: true
    }
  },
  handler: async ({
    baseId,
    tableIdOrName,
    searchTerm,
    fieldIds,
    maxRecords = 100
  }: {
    baseId: string;
    tableIdOrName: string;
    searchTerm: string;
    fieldIds?: string[];
    maxRecords?: number;
  }) => {
    try {
      // First get the table schema to identify text fields if fieldIds not provided
      const schemaResponse = await fetch(`https://api.airtable.com/v0/meta/bases/${baseId}/tables`, {
        headers: { Authorization: `Bearer ${apiKey}` }
      });

      if (!schemaResponse.ok) {
        throw new Error(`Schema API responded with status ${schemaResponse.status}`);
      }

      const schemaData = await schemaResponse.json();
      const table = schemaData.tables.find((t: any) =>
        t.id === tableIdOrName || t.name === tableIdOrName
      );

      if (!table) {
        throw new Error(`Table ${tableIdOrName} not found`);
      }

      // Get records to search through
      const base = Airtable.base(baseId);
      const records = await base(tableIdOrName).select({ maxRecords }).all();

      // Determine which fields to search
      let searchFieldNames: string[] = [];
      if (fieldIds && fieldIds.length > 0) {
        // Use provided field IDs
        searchFieldNames = table.fields
          .filter((f: any) => fieldIds.includes(f.id))
          .map((f: any) => f.name);
      } else {
        // Use all text-like fields
        const textFieldTypes = [
          'singleLineText', 'multilineText', 'richText',
          'email', 'url', 'phone', 'multipleRecordLinks'
        ];
        searchFieldNames = table.fields
          .filter((f: any) => textFieldTypes.includes(f.type))
          .map((f: any) => f.name);
      }

      if (searchFieldNames.length === 0) {
        throw new Error('No searchable fields found');
      }

      // Search through records
      const matchingRecords = records.filter(record => {
        return searchFieldNames.some(fieldName => {
          const value = record.fields[fieldName];
          if (typeof value === 'string') {
            return value.toLowerCase().includes(searchTerm.toLowerCase());
          }
          // For arrays (like linked records), check each element
          if (Array.isArray(value)) {
            return value.some(item =>
              typeof item === 'string' &&
              item.toLowerCase().includes(searchTerm.toLowerCase())
            );
          }
          return false;
        });
      });

      return matchingRecords.map(record => ({
        id: record.id,
        fields: record.fields,
        createdTime: (record as any).createdTime
      }));
    } catch (error) {
      console.error(`Error searching records in ${tableIdOrName}:`, error);
      throw new Error(`Failed to search records: ${error}`);
    }
  }
};
