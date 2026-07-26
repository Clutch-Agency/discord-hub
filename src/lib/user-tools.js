// src/lib/user-tools.js

export async function getUserToolsState(userId) {
  const tools = [
    {
      key: "servers",
      name: "Servidores",
      description: "Visualize e gerencie os servidores onde o bot está conectado.",
      icon: "Server",
      href: "/dashboard/servers",
      enabled: true, // Servidores estão sempre ativos
      isCore: true, // Indica que é uma função core e não uma ferramenta desativável
    },
    {
      key: "templates",
      name: "Templates de Servidor",
      description: "Crie e gerencie templates para a estrutura do seu servidor Discord.",
      icon: "LayoutTemplate",
      href: "/dashboard/templates",
      enabled: true, // Ou baseado em alguma lógica de usuário
      isCore: false,
    },
    // Adicione outras ferramentas aqui, se houver
  ]

  // No futuro, você pode buscar o estado de 'enabled' de cada ferramenta
  // de um banco de dados ou de alguma configuração do usuário.
  // Por enquanto, todas as ferramentas não-core estão habilitadas por padrão.

  return tools
}

// Nova função para verificar se uma ferramenta está habilitada
// Esta função é necessária porque 'isToolEnabled' foi removida.
export async function isToolEnabled(userId, toolKey) {
  const tools = await getUserToolsState(userId)
  const tool = tools.find(t => t.key === toolKey)
  return tool ? tool.enabled : false
}