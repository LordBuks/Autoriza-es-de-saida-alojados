/**
 * Controlador de Consulta - Sistema de Autorizações Digitais
 * 
 * Este módulo unifica as funcionalidades de consulta de autorizações
 * utilizando o padrão Module e o serviço centralizado de autorizações.
 */

const ConsultaController = (function() {
  // Elementos da interface
  let formConsulta;
  let resultadoConsulta;
  let alertMessage; // Adicionado para usar a função mostrarMensagem
  
  // Inicialização do controlador (CORRIGIDO: adicionado 'async')
  async function inicializar() {
    // Capturar elementos do DOM
    formConsulta = document.getElementById("form-consulta");
    resultadoConsulta = document.getElementById("resultado-consulta");
    alertMessage = document.getElementById("alert-message"); // Capturar elemento de alerta
    
    // Verificar se estamos na página correta
    if (!formConsulta) return;
    
    // Configurar eventos
    formConsulta.addEventListener("submit", handleSubmit);
    
    // Verificar se há um ID na URL para consulta direta
    const urlParams = new URLSearchParams(window.location.search);
    const idConsulta = urlParams.get("id");
    
    if (idConsulta) {
      document.getElementById("codigo").value = idConsulta;
      // CORRIGIDO: Adicionado 'await'
      await consultarSolicitacao(idConsulta);
    }
  }
  
  // Manipulador de envio do formulário (CORRIGIDO: adicionado 'async')
  async function handleSubmit(e) {
    e.preventDefault();
    
    const codigoSolicitacao = document.getElementById("codigo").value.trim();
    
    if (!codigoSolicitacao) {
      mostrarMensagem("Por favor, informe o código da solicitação.", "alert-danger");
      return;
    }
    
    // CORRIGIDO: Adicionado 'await'
    await consultarSolicitacao(codigoSolicitacao);
  }
  
  // Função para consultar uma solicitação (CORRIGIDO: adicionado 'async' e 'try...catch')
  async function consultarSolicitacao(codigo) {
    // Limpar resultados anteriores e esconder a área de resultado antes da busca
    if (resultadoConsulta) {
        resultadoConsulta.style.display = "none";
    }
    // Limpar mensagem de alerta anterior
    if (alertMessage) {
        alertMessage.style.display = "none";
    }

    try {
      // Usar o serviço de autorização para buscar a solicitação (CORRIGIDO: adicionado 'await')
      const solicitacao = await window.AutorizacaoService.buscarSolicitacao(codigo);
      
      if (!solicitacao) {
        // Usar a função mostrarMensagem padronizada
        mostrarMensagem(`Solicitação com código "${codigo}" não encontrada. Verifique o código e tente novamente.`, "alert-danger");
        return;
      }
      
      // Exibir os detalhes da solicitação
      exibirDetalhes(solicitacao);

    } catch (error) {
      console.error("Erro ao consultar solicitação:", error);
      mostrarMensagem(`Ocorreu um erro ao buscar a solicitação: ${error.message}. Tente novamente.`, "alert-danger");
    }
  }
  
  // Função para exibir os detalhes da solicitação (sem alterações lógicas necessárias aqui)
  function exibirDetalhes(solicitacao) {
    if (!resultadoConsulta) return;
    
    // Mostrar o container de resultado
    resultadoConsulta.style.display = "block";
    
    // Preencher os dados
    document.getElementById("nome-atleta").textContent = solicitacao.nome;
    document.getElementById("categoria").textContent = solicitacao.categoria;
    // Certificar que formatarData existe e trata possíveis erros
    document.getElementById("data-saida").textContent = window.AutorizacaoService.formatarData ? window.AutorizacaoService.formatarData(solicitacao.data_saida) : solicitacao.data_saida;
    document.getElementById("horario-saida").textContent = solicitacao.horario_saida;
    document.getElementById("data-retorno").textContent = window.AutorizacaoService.formatarData ? window.AutorizacaoService.formatarData(solicitacao.data_retorno) : solicitacao.data_retorno;
    document.getElementById("horario-retorno").textContent = solicitacao.horario_retorno;
    document.getElementById("motivo-destino").textContent = solicitacao.motivo_destino;
    
    // Exibir status
    const statusSupervisor = document.getElementById("status-supervisor");
    if (statusSupervisor) {
      statusSupervisor.textContent = solicitacao.status_supervisor;
      statusSupervisor.className = `badge ${getBadgeClass(solicitacao.status_supervisor)}`;
    }
    
    const statusServicoSocial = document.getElementById("status-servico-social");
    if (statusServicoSocial) {
      statusServicoSocial.textContent = solicitacao.status_servico_social;
      statusServicoSocial.className = `badge ${getBadgeClass(solicitacao.status_servico_social)}`;
    }
    
    const statusFinal = document.getElementById("status-final");
    if (statusFinal) {
      statusFinal.textContent = solicitacao.status_final;
      statusFinal.className = `badge ${getBadgeClass(solicitacao.status_final)}`;
    }
    
    // Exibir observações se existirem
    const observacaoSupervisor = document.getElementById("observacao-supervisor");
    if (observacaoSupervisor) {
      if (solicitacao.observacao_supervisor) {
        observacaoSupervisor.textContent = solicitacao.observacao_supervisor;
        document.getElementById("container-observacao-supervisor").style.display = "block";
      } else {
        document.getElementById("container-observacao-supervisor").style.display = "none";
      }
    }
    
    const observacaoServicoSocial = document.getElementById("observacao-servico-social");
    if (observacaoServicoSocial) {
      if (solicitacao.observacao_servico_social) {
        observacaoServicoSocial.textContent = solicitacao.observacao_servico_social;
        document.getElementById("container-observacao-servico-social").style.display = "block";
      } else {
        document.getElementById("container-observacao-servico-social").style.display = "none";
      }
    }
  }
  
  // Função para mostrar mensagens (já existente, apenas garantir que alertMessage é capturado)
  function mostrarMensagem(mensagem, tipo) {
    if (!alertMessage) {
        console.warn("Elemento de alerta não encontrado para exibir mensagem.");
        return;
    }
    
    alertMessage.textContent = mensagem;
    alertMessage.className = `alert ${tipo}`;
    alertMessage.style.display = "block";
    
    // Esconder a mensagem após 8 segundos
    setTimeout(function() {
      alertMessage.style.display = "none";
    }, 8000);
  }
  
  // Função auxiliar para obter a classe do badge com base no status
  function getBadgeClass(status) {
    switch (status) {
      case "Aprovado": return "bg-success";
      case "Reprovado": return "bg-danger";
      default: return "bg-warning"; // Pendente, Em Análise, etc.
    }
  }
  
  // API pública
  return {
    inicializar: inicializar
  };
})();

// Inicializar o controlador quando o DOM estiver pronto
document.addEventListener("DOMContentLoaded", function() {
  ConsultaController.inicializar();
});

