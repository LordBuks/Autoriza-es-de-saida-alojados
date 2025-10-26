/**
 * Controlador de Monitor - Sistema de Autorizações Digitais
 * 
 * Este módulo gerencia as funcionalidades específicas do perfil de monitor,
 * incluindo a visualização de solicitações e a funcionalidade de arquivamento.
 */

const MonitorController = (function() {
  // Elementos da interface
  let btnArquivar;
  let loadingIndicator; // Indicador de carregamento
  let alertContainer; // Container para mensagens de alerta

  // Variáveis de controle
  let solicitacaoAtual = null;
  let idSolicitacaoAtual = null;

  // Inicialização do controlador
  async function inicializar() {
    console.log("MonitorController inicializando...");
    // Capturar elementos do DOM
    btnArquivar = document.getElementById("btn-arquivar");
    loadingIndicator = document.getElementById("loading-indicator");
    alertContainer = document.getElementById("alert-container");

    // Obter ID da solicitação da URL
    const urlParams = new URLSearchParams(window.location.search);
    idSolicitacaoAtual = urlParams.get("id");

    if (!idSolicitacaoAtual) {
      mostrarAlerta("ID da solicitação não fornecido na URL.", "alert-danger");
      return;
    }

    // Carregar dados da solicitação (agora assíncrono)
    await carregarSolicitacao(idSolicitacaoAtual);

    // Configurar eventos
    configurarEventos();
    console.log("MonitorController inicializado.");
  }

  // Função para mostrar/ocultar indicador de carregamento
  function setLoading(isLoading) {
      if (loadingIndicator) {
          loadingIndicator.style.display = isLoading ? 'block' : 'none';
      }
  }

  // Função para exibir alertas
  function mostrarAlerta(mensagem, tipo) {
      if (!alertContainer) {
          console.error("Elemento 'alert-container' não encontrado!");
          alert(mensagem); // Fallback
          return;
      }
      alertContainer.innerHTML = `<div class="alert ${tipo} alert-dismissible fade show" role="alert">
                                    ${mensagem}
                                    <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
                                  </div>`;
      alertContainer.style.display = 'block';
  }

  // Função para carregar os dados da solicitação (assíncrona)
  async function carregarSolicitacao(id) {
    setLoading(true);
    mostrarAlerta("Carregando dados da solicitação...", "alert-info");
    try {
      solicitacaoAtual = await window.AutorizacaoService.buscarSolicitacao(id);

      if (!solicitacaoAtual) {
        mostrarAlerta("Solicitação não encontrada.", "alert-danger");
        if (btnArquivar) btnArquivar.disabled = true;
        setLoading(false);
        return;
      }

      // Preencher os dados na página
      preencherDadosPagina(solicitacaoAtual);
      mostrarAlerta("Dados carregados.", "alert-success");
      setTimeout(() => { if (alertContainer) alertContainer.style.display = 'none'; }, 2000);

    } catch (error) {
      console.error("Erro ao carregar solicitação:", error);
      mostrarAlerta("Erro ao carregar dados da solicitação. Verifique o console.", "alert-danger");
      if (btnArquivar) btnArquivar.disabled = true;
    } finally {
      setLoading(false);
    }
  }

  // Função auxiliar para preencher os dados na página
  function preencherDadosPagina(solicitacao) {
      document.getElementById('nome-atleta').textContent = solicitacao.nome || 'N/A';
      document.getElementById('categoria-atleta').textContent = solicitacao.categoria || 'N/A';
      document.getElementById('data-nascimento').textContent = window.AutorizacaoService.formatarData(solicitacao.data_nascimento) || 'N/A';
      document.getElementById('telefone-atleta').textContent = solicitacao.telefone || 'N/A';
      
      document.getElementById('data-saida').textContent = window.AutorizacaoService.formatarData(solicitacao.data_saida) || 'N/A';
      document.getElementById('horario-saida').textContent = solicitacao.horario_saida || 'N/A';
      document.getElementById('data-retorno').textContent = window.AutorizacaoService.formatarData(solicitacao.data_retorno) || 'N/A';
      document.getElementById('horario-retorno').textContent = solicitacao.horario_retorno || 'N/A';
      document.getElementById('motivo-destino').textContent = solicitacao.motivo_destino || 'N/A';
      
      document.getElementById('nome-responsavel').textContent = solicitacao.nome_responsavel || 'N/A';
      document.getElementById('telefone-responsavel').textContent = solicitacao.telefone_responsavel || 'N/A';
      
      // Novos campos de status
      const statusGeralElement = document.getElementById('status-geral');
      if (statusGeralElement) {
        statusGeralElement.textContent = solicitacao.status_geral || 'N/A';
        statusGeralElement.className = `badge ${getBadgeClass(solicitacao.status_geral)}`;
      }

      const statusPaisElement = document.getElementById('status-pais');
      if (statusPaisElement) {
        statusPaisElement.textContent = solicitacao.status_pais || 'N/A';
        statusPaisElement.className = `badge ${getBadgeClass(solicitacao.status_pais)}`;
      }

      const statusServicoSocialElement = document.getElementById('status-servico-social');
      if (statusServicoSocialElement) {
        statusServicoSocialElement.textContent = solicitacao.status_servico_social || 'N/A';
        statusServicoSocialElement.className = `badge ${getBadgeClass(solicitacao.status_servico_social)}`;
      }

      const statusMonitorElement = document.getElementById('status-monitor');
      if (statusMonitorElement) {
        statusMonitorElement.textContent = solicitacao.status_monitor || 'N/A';
        statusMonitorElement.className = `badge ${getBadgeClass(solicitacao.status_monitor)}`;
      }

      // Mostrar observação do supervisor se existir
      const containerObsSup = document.getElementById('container-observacao-supervisor');
      const obsSupElement = document.getElementById('observacao-supervisor');
      if (containerObsSup && obsSupElement) {
          if (solicitacao.observacao_supervisor) {
              obsSupElement.textContent = solicitacao.observacao_supervisor;
              containerObsSup.style.display = 'block';
          } else {
              containerObsSup.style.display = 'none';
          }
      }

      // Mostrar observação do serviço social se existir
      const containerObservacaoSS = document.getElementById('container-observacao-servico-social');
      const observacaoSSElement = document.getElementById('observacao-servico-social');
      if (containerObservacaoSS && observacaoSSElement) {
          if (solicitacao.observacao_servico_social) {
              observacaoSSElement.textContent = solicitacao.observacao_servico_social;
              containerObservacaoSS.style.display = 'block';
          } else {
              containerObservacaoSS.style.display = 'none';
          }
      }

      // Habilitar/desabilitar botão de arquivar
      if (btnArquivar) {
        if (solicitacao.status_geral === 'aprovado_servico_social' || solicitacao.status_geral === 'reprovado_servico_social') {
          btnArquivar.disabled = false;
        } else {
          btnArquivar.disabled = true;
        }
      }
  }

  // Função auxiliar para obter a classe do badge com base no status
  function getBadgeClass(status) {
      switch (status) {
          case 'aprovado_servico_social': return 'bg-success';
          case 'reprovado_servico_social': return 'bg-danger';
          case 'pendente_pais': return 'bg-warning text-dark';
          case 'pendente_servico_social': return 'bg-info text-dark';
          case 'reprovado_pais': return 'bg-danger';
          case 'arquivado_monitor': return 'bg-secondary';
          case 'Aprovado': return 'bg-success';
          case 'Reprovado': return 'bg-danger';
          case 'Pendente': return 'bg-warning text-dark';
          default: return 'bg-secondary'; // Para outros status ou N/A
      }
  }

  // Configurar eventos dos botões
  function configurarEventos() {
      if (btnArquivar) {
          btnArquivar.addEventListener('click', async () => {
              if (btnArquivar.disabled) return;
              await arquivarSolicitacao();
          });
      }
  }

  // Função para arquivar solicitação
  async function arquivarSolicitacao() {
    if (!solicitacaoAtual) {
        mostrarAlerta("Erro: Nenhuma solicitação carregada para arquivar.", "alert-danger");
        return;
    }

    setLoading(true);
    mostrarAlerta("Arquivando solicitação...", "alert-info");

    try {
      const resultado = await window.AutorizacaoService.atualizarStatus(
        solicitacaoAtual.id,
        'monitor',
        'Arquivado',
        'Solicitação arquivada pelo monitor.'
      );

      if (resultado.sucesso) {
        // Atualizar o status_geral para 'arquivado_monitor'
        await window.AutorizacaoService.atualizarStatus(
          solicitacaoAtual.id,
          'geral',
          'arquivado_monitor',
          'Solicitação arquivada pelo monitor.'
        );
        mostrarAlerta("Solicitação arquivada com sucesso!", "alert-success");
        solicitacaoAtual = resultado.solicitacao; // Atualiza a variável local
        preencherDadosPagina(solicitacaoAtual); // Recarrega dados na página
      } else {
        mostrarAlerta(`Erro ao arquivar solicitação: ${resultado.mensagem}`, "alert-danger");
      }
    } catch (error) {
        console.error("Erro ao arquivar solicitação:", error);
        mostrarAlerta(`Erro técnico ao arquivar solicitação. Verifique o console.`, "alert-danger");
    } finally {
        setLoading(false);
        setTimeout(() => { if (alertContainer) alertContainer.style.display = 'none'; }, 5000);
    }
  }

  // API pública
  return {
    inicializar: inicializar
  };
})();

// Inicializar o controlador quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', function() {
  if (window.firebaseService && window.AutorizacaoService) {
      MonitorController.inicializar();
  } else {
      console.warn("firebaseService ou AutorizacaoService não encontrado imediatamente. Tentando inicializar em 500ms...");
      setTimeout(() => {
          if (window.firebaseService && window.AutorizacaoService) {
              MonitorController.inicializar();
          } else {
              console.error("Falha ao inicializar MonitorController: dependências não disponíveis.");
              alert("Erro crítico: Não foi possível conectar aos serviços de dados. Funcionalidades do monitor podem não funcionar.");
          }
      }, 500);
  }
});



