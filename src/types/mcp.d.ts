declare module '@modelcontextprotocol/sdk' {
  export class McpServer {
    constructor(config: { name: string; version: string });
    tool(name: string, description: string, schema: any, handler: Function): void;
    connect(transport: any): Promise<void>;
  }

  export class StdioServerTransport {
    constructor();
  }
}
