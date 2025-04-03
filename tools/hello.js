module.exports = {
  id: "hello-tool",
  description: "Diz olá com um nome",
  parameters: [
    {
      name: "name",
      type: "string",
      required: true,
    }
  ],
  run: async ({ name }) => {
    return { message: `Olá, ${name}! Bem-vindo ao MCP.` };
  }
};
