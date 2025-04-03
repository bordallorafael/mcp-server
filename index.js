import express from 'express';
import cors from 'cors';
import { Server } from '@modelcontextprotocol/sdk';
import { createHttpSseServerTransport } from '@modelcontextprotocol/sdk/server/http.js';
import { z } from 'zod';

const app = express();
app.use(cors());
app.use(express.json());

const port = process.env.PORT || 3000;

const produtos = [
  { nome: "Café Especial", preco: 19.90 },
  { nome: "Leite Integral", preco: 6.50 },
  { nome: "Açúcar Cristal", preco: 4.20 }
];

const tools = [
  {
    name: 'listar_produtos',
    description: 'Lista todos os produtos disponíveis',
    inputSchema: {
      type: 'object',
      properties: {}
    },
    handler: async () => {
      const lista = produtos.map(p => `- ${p.nome} (R$ ${p.preco.toFixed(2).replace('.', ',')})`).join('\n');
      return {
        content: [{ type: 'text', text: `📦 Lista de produtos disponíveis:\n${lista}` }]
      };
    }
  },
  {
    name: 'buscar_produto',
    description: 'Busca um produto pelo nome',
    inputSchema: {
      type: 'object',
      properties: {
        nome: { type: 'string', description: 'Nome do produto' }
      },
      required: ['nome']
    },
    handler: async (args) => {
      const schema = z.object({ nome: z.string() });
      const { nome } = schema.parse(args);
      const produto = produtos.find(p => p.nome.toLowerCase() === nome.toLowerCase());
      return {
        content: [
          {
            type: 'text',
            text: produto
              ? `✅ ${produto.nome} custa R$ ${produto.preco.toFixed(2).replace('.', ',')}`
              : `❌ Produto "${nome}" não encontrado.`
          }
        ]
      };
    }
  }
];

const mcpServer = new Server(
  { name: 'mcp-produtos-server', version: '1.0.0' },
  { capabilities: { tools: {} } }
);

for (const tool of tools) {
  mcpServer.registerTool({
    name: tool.name,
    description: tool.description,
    inputSchema: tool.inputSchema,
    handler: tool.handler
  });
}

app.listen(port, () => {
  console.log(`🚀 Servidor MCP com SSE rodando na porta ${port}`);

  const transport = createHttpSseServerTransport(app, {
    ssePath: '/sse',
    callPath: '/entrada'
  });

  mcpServer.connect(transport).then(() => {
    console.log('✅ Conectado ao MCP Client via SSE');
  });
});
