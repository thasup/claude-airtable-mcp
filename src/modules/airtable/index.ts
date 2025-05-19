import { listBases } from "./bases";
import { listTables } from "./tables";
import {
  listRecords,
  getRecord,
  createRecord,
  updateRecord,
  deleteRecord,
  searchRecords
} from "./records";

function adaptHandler(originalHandler: (args: any) => Promise<any>) {
  return async (args: Record<string, any>, extra: any) => {
    return originalHandler(args);
  };
}

export const airtableTools = {
  "airtable/list-bases": {
    description: listBases.description,
    parameters: listBases.parameters,
    outputSchema: listBases.outputSchema,
    handler: adaptHandler(listBases.handler),
  },
  "airtable/list-tables": {
    description: listTables.description,
    parameters: listTables.parameters,
    handler: adaptHandler(listTables.handler),
  },
  "airtable/list-records": {
    description: listRecords.description,
    parameters: listRecords.parameters,
    handler: adaptHandler(listRecords.handler),
  },
  "airtable/get-record": {
    description: getRecord.description,
    parameters: getRecord.parameters,
    handler: adaptHandler(getRecord.handler),
  },
  "airtable/create-record": {
    description: createRecord.description,
    parameters: createRecord.parameters,
    handler: adaptHandler(createRecord.handler),
  },
  "airtable/update-record": {
    description: updateRecord.description,
    parameters: updateRecord.parameters,
    handler: adaptHandler(updateRecord.handler),
  },
  "airtable/delete-record": {
    description: deleteRecord.description,
    parameters: deleteRecord.parameters,
    handler: adaptHandler(deleteRecord.handler),
  },
  "airtable/search-records": {
    description: searchRecords.description,
    parameters: searchRecords.parameters,
    handler: adaptHandler(searchRecords.handler),
  },
};
