import express from 'express';
import cors from 'cors';
import { z } from 'zod';

const app = express();
const port = process.env.PORT || 8080;

app.use(cors());
app.use(express.json());

const clients = [];

const helloSchema = z.object({
  name: z.string().min(1)
});

const tools = [
  {
    id: "hello-tool",
    description: "Diz olá com um nome",
    parameters: [{ name: "name", type: "string", required: true }],
    run: (input) => {
      const { name } = helloSchema.parse(input);
      return { message: `Olá, ${name}! Bem-vindo ao MCP.` };
    }
  }
];

// SSE
app.get('/mcp/v1/sse', (req, res) => {
  res.set({
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive'
  });
  res.flushHeaders();

  clients.push(res);
  req.on('close', () => {
    const index = clients.indexOf(res);
    if (index !== -1) clients.splice(index, 1);
  });
});

// Lista ferramentas
app.get('/mcp/v1/tools', (req, res) => {
  res.json(
    tools.map(({ id, description, parameters }) => ({ id, description, parameters }))
  );
});

// Executa ferramenta
