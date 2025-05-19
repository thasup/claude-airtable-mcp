declare module '@modelcontextprotocol/sdk' {
  export interface ServerConfig {
    name: string;
    version: string;
  }

  export interface ToolOptions {
    name: string;
    description: string;
    parameters: any;
    handler: (args: any, context: any) => Promise<any>;
  }

  export class McpServer {
    constructor(config: ServerConfig);
    tool(name: string, description: string, parameters: any, handler: (args: any, context: any) => Promise<any>): void;
    connect(transport: any): Promise<void>;
  }

  export class StdioServerTransport {
    constructor();
  }
}
