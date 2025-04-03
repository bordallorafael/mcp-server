const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");

const app = express();
const port = 3333;

app.use(cors());
app.use(express.json());

const tools = [];

// Carrega ferramentas
const toolsDir = path.join(__dirname, "tools");
fs.readdirSync(toolsDir).forEach((file) => {
  const tool = require(path.join(toolsDir, file));
  tools.push(tool);
});

const clients = [];

app.get("/mcp/v1/sse", (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();

  clients.push(res);

  req.on("close", () => {
    const index = clients.indexOf(res);
    if (index !== -1) clients.splice(index, 1);
  });
});

// Endpoint para listar ferramentas
app.get("/mcp/v1/tools", (req, res) => {
  res.json(
    tools.map((tool) => ({
      id: tool.id,
      description: tool.description,
      parameters: tool.parameters,
    }))
  );
});

// Executar ferramenta
app.post("/mcp/v1/tools/:id/run", async (req, res) => {
  const tool = tools.find((t) => t.id === req.params.id);
  if (!tool) return res.status(404).json({ error: "Ferramenta não encontrada" });

  try {
    const result = await tool.run(req.body);
    res.json(result);

    // Broadcast via SSE para os clientes (opcional)
    clients.forEach((client) => {
      client.write(`data: ${JSON.stringify({ tool: tool.id, result })}\n\n`);
    });

  } catch (err) {
    res.status(500).json({ error: "Erro ao executar ferramenta", details: err.message });
  }
});

app.listen(port, () => {
  console.log(`🚀 MCP Server rodando em http://localhost:${port}`);
});
