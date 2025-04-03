import express from 'express';
import cors from 'cors';
import { z } from 'zod';

const app = express();
app.use(cors());
app.use(express.json());

const port = process.env.PORT || 3000;
const clientesSSE = [];

const produtos = [
  { nome: "Café Especial", preco: 19.90 },
  { nome: "Leite Integral", preco: 6.50 },
  { nome: "Açúcar Cristal", preco: 4.20 }
];

// SSE: conexão de escuta
app.get('/sse', (req, res) => {
  res.set({
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive'
  });
  res.flushHeaders();
  res.write('retry: 10000\n\n');

  clientesSSE.push(res);

  req.on('close', () => {
    const idx = clientesSSE.indexOf(res);
    if (idx !== -1) clientesSSE.splice(idx, 1);
  });
});

// Entrada: chamadas da IA
app.post('/entrada', (req, res) => {
  const { type, id, params } = req.body;

  console.log("📥 Recebido:", JSON.stringify(req.body, null, 2));

  if (type === 'ListToolsRequest') {
    const response = {
      type: 'ListToolsResponse',
      id,
      tools: [
        {
          name: 'listar_produtos',
          description: 'Lista todos os produtos com nome e preço',
          inputSchema: { type: 'object', properties: {} }
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
          }
        }
      ]
    };

    try {
      const json = JSON.parse(JSON.stringify(response));
      console.log("✅ JSON ListToolsResponse válido.");
    } catch (err) {
      console.error("❌ JSON malformado!", err);
    }
      
    enviaParaTodos(JSON.stringify(response));
    return res.status(200).end();
  }

  if (type === 'CallToolRequest') {
    const tool = params?.name;
    const args = params?.arguments || {};
    let outputText = '';

    if (tool === 'listar_produtos') {
      outputText = produtos.map(p => `- ${p.nome} (R$ ${p.preco.toFixed(2).replace('.', ',')})`).join('\n');
    }

    if (tool === 'buscar_produto') {
      const schema = z.object({ nome: z.string() });
      const { nome } = schema.parse(args);
      const p = produtos.find(prod => prod.nome.toLowerCase() === nome.toLowerCase());
      outputText = p
        ? `✅ ${p.nome} custa R$ ${p.preco.toFixed(2).replace('.', ',')}`
        : `❌ Produto "${nome}" não encontrado.`;
    }

    const response = {
      type: 'CallToolResponse',
      id,
      output: {
        content: [
          {
            type: 'text',
            text: outputText
          }
        ]
      }
    };

    enviaParaTodos(JSON.stringify(response));
    return res.status(200).end();
  }

  return res.status(400).json({ erro: 'Requisição não reconhecida.' });
});

function enviaParaTodos(data) {
  console.log("🔢 Clientes SSE conectados:", clientesSSE.length);
  console.log("🚀 Enviando para SSE:", data);
  clientesSSE.forEach(res => res.write(`data: ${data}\n\n`));
}

app.listen(port, () => {
  console.log(`🚀 Servidor HTTP MCP com SSE rodando na porta ${port}`);
});
