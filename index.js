const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

const clientesSSE = [];

const produtos = [
  { nome: "Café Especial", preco: 19.90 },
  { nome: "Leite Integral", preco: 6.50 },
  { nome: "Açúcar Cristal", preco: 4.20 }
];

// SSE
app.get('/sse', (req, res) => {
  res.set({
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive'
  });

  res.flushHeaders();
  res.write('retry: 10000\n\n'); // reconexão automática a cada 10s

  clientesSSE.push(res);

  req.on('close', () => {
    const index = clientesSSE.indexOf(res);
    if (index !== -1) clientesSSE.splice(index, 1);
  });
});

// ENTRADA DO n8n
app.post('/entrada', (req, res) => {
  const { type, id, params } = req.body;

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
    enviaParaTodos(JSON.stringify(response));
    res.status(200).end();
    return;
  }

  if (type === 'CallToolRequest') {
    const tool = params.name;
    const args = params.arguments || {};
    let text = '';

    if (tool === 'listar_produtos') {
      text = produtos.map(p => `- ${p.nome} (R$ ${p.preco.toFixed(2).replace('.', ',')})`).join('\n');
    }

    if (tool === 'buscar_produto') {
      const nome = (args.nome || '').toLowerCase();
      const p = produtos.find(prod => prod.nome.toLowerCase() === nome);
      text = p
        ? `✅ ${p.nome} custa R$ ${p.preco.toFixed(2).replace('.', ',')}`
        : `❌ Produto "${args.nome}" não encontrado.`;
    }

    const response = {
      type: 'CallToolResponse',
      id,
      output: {
        content: [
          {
            type: 'text',
            text
          }
        ]
      }
    };

    enviaParaTodos(JSON.stringify(response));
    res.status(200).end();
    return;
  }

  // Requisição inválida
  res.status(400).json({ erro: 'Requisição não reconhecida.' });
});

// Envia para todos os clientes conectados
function enviaParaTodos(data) {
  clientesSSE.forEach((res) => {
    res.write(`data: ${data}\n\n`);
  });
}

app.listen(port, () => {
  console.log(`Servidor MCP com SSE rodando na porta ${port}`);
});
