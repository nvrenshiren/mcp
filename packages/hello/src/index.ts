#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

export function createServer(): McpServer {
  const server = new McpServer({
    name: "@dawipong/mcp-hello",
    version: "0.1.0",
  });

  server.registerTool(
    "greet",
    {
      title: "Greet",
      description: "Say hello to someone by name.",
      inputSchema: {
        name: z.string().describe("The person to greet"),
      },
    },
    async ({ name }) => ({
      content: [{ type: "text", text: `Hello, ${name}! 👋` }],
    }),
  );

  server.registerTool(
    "echo",
    {
      title: "Echo",
      description: "Echo back the input message.",
      inputSchema: {
        message: z.string().describe("Message to echo"),
      },
    },
    async ({ message }) => ({
      content: [{ type: "text", text: message }],
    }),
  );

  return server;
}

async function main(): Promise<void> {
  const server = createServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("@dawipong/mcp-hello running on stdio");
}

const isDirectRun = import.meta.url === `file://${process.argv[1]}`;
if (isDirectRun) {
  main().catch((err) => {
    console.error("Fatal:", err);
    process.exit(1);
  });
}
