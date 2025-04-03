import express from 'express';
import cors from 'cors';
import { z } from 'zod';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';

const app = express();
app.use(cors());
app.use(express.json());

const port = process.env.PORT || 8080;
const produtos = [
  { nome: 'Café Especial', preco: 19.90 },
  { nome: 'Leite Integral', preco: 6.50 },
  { nome: 'Açúcar Cristal', preco: 4.20 }
];

const server = new McpServer({
  name: 'mcp_sse_sdk_server',
  version: '1.0.0',
});

// Tool 1: listar_produtos
server.tool({
  name: 'listar_produtos',
  description: 'Lista todos os produtos com nome e preço',
  paramsSchema: z.object({}),
  cb: async () => {
    const lista = produtos.map(p => `- ${p.nome} (R$ ${p.preco.toFixed(2).replace('.', ',')})`).join('\n');
    return {
      content: [
        { type: 'text', text: lista }
      ]
    };
  }
});

// Tool 2: buscar_produto
server.tool({
  name: 'buscar_produto',
  description: 'Busca um produto pelo nome',
  paramsSchema: z.object({ nome: z.string() }),
  cb: async ({ nome }) => {
    const produto = produtos.find(p => p.nome.toLowerCase() === nome.toLowerCase());
    const resposta = produto
      ? `✅ ${produto.nome} custa R$ ${produto.preco.toFixed(2).replace('.', ',')}`
      : `❌ Produto "${nome}" não encontrado.`;
    return {
      content: [
        { type: 'text', text: resposta }
      ]
    };
  }
});

// Conecta transporte SSE com caminhos padrão
const transport = new SSEServerTransport({
  ssePath: '/sse',
  callPath: '/entrada'
});

await server.connect(transport);

app.listen(port, () => {
  console.log(`✅ Servidor MCP via SDK rodando na porta ${port}`);
});
