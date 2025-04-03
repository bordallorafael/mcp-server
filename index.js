const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

const produtos = [
  { nome: "Café Especial", preco: 19.90 },
  { nome: "Leite Integral", preco: 6.50 },
  { nome: "Açúcar Cristal", preco: 4.20 }
];

app.use(express.json());

app.post('/', (req, res) => {
  const { type, id, params } = req.body;

  if (type === 'ListToolsRequest') {
    return res.json({
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
    });
  }

  if (type === 'CallToolRequest') {
    const tool = params.name;
    const args = params.arguments || {};

    if (tool === 'listar_produtos') {
      const lista = produtos.map(p => `- ${p.nome} (R$ ${p.preco.toFixed(2).replace('.', ',')})`).join('\n');
      return res.json({
        type: 'CallToolResponse',
        id,
        output: {
          content: [{ type: 'text', text: `📦 Produtos:\n${lista}` }]
        }
      });
    }

    if (tool === 'buscar_produto') {
      const nome = (args.nome || '').toLowerCase();
      const p = produtos.find(prod => prod.nome.toLowerCase() === nome);
      const text = p
        ? `✅ ${p.nome} custa R$ ${p.preco.toFixed(2).replace('.', ',')}`
        : `❌ Produto "${args.nome}" não encontrado.`;

      return res.json({
        type: 'CallToolResponse',
        id,
        output: { content: [{ type: 'text', text }] }
      });
    }
  }

  return res.status(400).json({ erro: 'Requisição inválida.' });
});

app.listen(port, () => {
  console.log(`Servidor MCP rodando na porta ${port}`);
});
