/**
 * Controlador de Serviço Social - Sistema de Autorizações Digitais
 * 
 * Este módulo unifica as funcionalidades de serviço social (integrado e não integrado)
 * utilizando o padrão Module e o serviço centralizado de autorizações.
 */

// Controlador para as funcionalidades do serviço social
const ServicoSocialController = (function() {
  // Serviços utilizados
  const autorizacaoService = new AutorizacaoService();
  const notificacaoService = new NotificacaoService();
  const confirmacaoService = new ConfirmacaoService();
  
  // Elementos da interface
  let btnValidar;
  let btnReprovar;
  let modalObservacao;
  let btnConfirmar;
  let btnCancelar;
  
  // Variáveis de controle
  let solicitacaoAtual = null;
  let acaoAtual = null; // 'aprovar' ou 'reprovar'
  
  // Inicialização do controlador
  function inicializar() {
    // Capturar elementos do DOM
    btnValidar = document.getElementById('btn-validar');
    btnReprovar = document.getElementById('btn-reprovar');
    modalObservacao = document.getElementById('modal-observacao');
    btnConfirmar = document.getElementById('btn-confirmar');
    btnCancelar = document.getElementById('btn-cancelar');
    
    // Obter ID da solicitação da URL
    const urlParams = new URLSearchParams(window.location.search);
    const idSolicitacao = urlParams.get('id');
    
    if (!idSolicitacao) {
      alert('ID da solicitação não fornecido. Redirecionando para o painel.');
      window.location.href = 'dashboard.html';
      return;
    }
    
    // Carregar dados da solicitação
    carregarSolicitacao(idSolicitacao);
    
    // Configurar eventos
    if (btnConfirmar) {
      btnConfirmar.addEventListener('click', function() {
        const observacao = document.getElementById('observacao').value;
        
        if (acaoAtual === 'aprovar') {
          aprovarSolicitacao(observacao);
        } else if (acaoAtual === 'reprovar') {
          reprovarSolicitacao(observacao);
        }
        
        modalObservacao.style.display = 'none';
      });
    }
    
    if (btnCancelar) {
      btnCancelar.addEventListener('click', function() {
        modalObservacao.style.display = 'none';
      });
    }

    // Adicionar evento para o botão de enviar WhatsApp
    const btnEnviarWhatsApp = document.getElementById("btn-enviar-whatsapp");
    if (btnEnviarWhatsApp) {
      btnEnviarWhatsApp.addEventListener("click", function() {
        if (solicitacaoAtual) {
          const resultado = notificacaoService.enviarNotificacaoWhatsApp(solicitacaoAtual);
          if (resultado.sucesso) {
            alert("Link para WhatsApp gerado com sucesso!");
          } else {
            alert(`Erro ao gerar link para WhatsApp: ${resultado.mensagem}`);
          }
        } else {
          alert("Nenhuma solicitação selecionada.");
        }
      });
    }

    // Adicionar evento para o botão de validar (aprovar) autorização
    if (btnValidar) {
      btnValidar.addEventListener("click", function() {
        acaoAtual = 'aprovar';
        modalObservacao.style.display = 'block';
      });
    }

    // Adicionar evento para o botão de reprovar autorização
    if (btnReprovar) {
      btnReprovar.addEventListener("click", function() {
        acaoAtual = 'reprovar';
        modalObservacao.style.display = 'block';
      });
    }
  }
  
  // Função para carregar os dados da solicitação
  function carregarSolicitacao(id) {
    // Usar o serviço de autorização para buscar a solicitação
    const solicitacao = window.AutorizacaoService.buscarSolicitacao(id);
    
    if (!solicitacao) {
      alert('Solicitação não encontrada. Redirecionando para o painel.');
      window.location.href = 'dashboard.html';
      return;
    }
    
    // Armazenar a solicitação atual
    solicitacaoAtual = solicitacao;
    
    // Preencher os dados na página
    document.getElementById('nome-atleta').textContent = solicitacao.nome;
    document.getElementById('categoria-atleta').textContent = solicitacao.categoria;
    document.getElementById('data-nascimento').textContent = window.AutorizacaoService.formatarData(solicitacao.data_nascimento);
    document.getElementById('telefone-atleta').textContent = solicitacao.telefone;
    
    document.getElementById('data-saida').textContent = window.AutorizacaoService.formatarData(solicitacao.data_saida);
    document.getElementById('horario-saida').textContent = solicitacao.horario_saida;
    document.getElementById('data-retorno').textContent = window.AutorizacaoService.formatarData(solicitacao.data_retorno);
    document.getElementById('horario-retorno').textContent = solicitacao.horario_retorno;
    document.getElementById('motivo-destino').textContent = solicitacao.motivo_destino;
    
    document.getElementById('nome-responsavel').textContent = solicitacao.nome_responsavel;
    document.getElementById('telefone-responsavel').textContent = solicitacao.telefone_responsavel;
    
    // Verificar status do supervisor
    const statusSupervisor = document.getElementById('status-supervisor');
    if (statusSupervisor) {
      statusSupervisor.textContent = solicitacao.status_supervisor;
      
      // Ajustar a classe do badge de acordo com o status
      if (solicitacao.status_supervisor === 'Aprovado') {
        statusSupervisor.className = 'status status-aprovado';
      } else if (solicitacao.status_supervisor === 'Reprovado') {
        statusSupervisor.className = 'status status-reprovado';
      } else {
        statusSupervisor.className = 'status status-pendente';
      }
    }
    
    // Exibir status atual do serviço social
    const statusAtual = document.getElementById('status-atual');
    if (statusAtual) {
      statusAtual.textContent = solicitacao.status_servico_social;
      
      // Ajustar a classe do badge de acordo com o status
      if (solicitacao.status_servico_social === 'Aprovado') {
        statusAtual.className = 'status status-aprovado';
      } else if (solicitacao.status_servico_social === 'Reprovado') {
        statusAtual.className = 'status status-reprovado';
      } else {
        statusAtual.className = 'status status-pendente';
      }
    }
    
    // Desabilitar botões se já houver uma decisão ou se o supervisor já reprovou
    if (solicitacao.status_servico_social !== 'Pendente' || solicitacao.status_supervisor === 'Reprovado') {
      if (btnValidar) btnValidar.disabled = true;
      if (btnReprovar) btnReprovar.disabled = true;
      
      // Mostrar observação do serviço social se existir
      if (solicitacao.observacao_servico_social) {
        const observacaoElement = document.getElementById('observacao-atual');
        if (observacaoElement) {
          observacaoElement.textContent = solicitacao.observacao_servico_social;
          document.getElementById('container-observacao').style.display = 'block';
        }
      }
      
      // Mostrar observação do supervisor se existir
      if (solicitacao.observacao_supervisor) {
        const observacaoSupervisorElement = document.getElementById('observacao-supervisor');
        if (observacaoSupervisorElement) {
          observacaoSupervisorElement.textContent = solicitacao.observacao_supervisor;
          document.getElementById('container-observacao-supervisor').style.display = 'block';
        }
      }
    }
  }
  
  // Função para aprovar uma solicitação
  function aprovarSolicitacao(observacoes) {
    if (!solicitacaoAtual) return;
    const resultado = autorizacaoService.aprovarSolicitacaoServicoSocial(solicitacaoAtual.id, observacoes);
    
    if (resultado.sucesso) {
      notificacaoService.enviarNotificacaoAtleta(resultado.dados, 'Aprovado');
      window.location.reload();
    }
    
    return resultado;
  }
  
  // Função para enviar notificação via WhatsApp
  function enviarWhatsApp(id) {
    const solicitacao = autorizacaoService.obterSolicitacao(id);
    
    if (!solicitacao) {
      return {
        sucesso: false,
        mensagem: 'Solicitação não encontrada.'
      };
    }
    
    if (!solicitacao.telefone_responsavel) {
      return {
        sucesso: false,
        mensagem: 'Telefone do responsável não cadastrado.'
      };
    }
    
    // Enviar notificação via WhatsApp
    const notificacao = notificacaoService.enviarNotificacaoWhatsApp(solicitacao);
    
    // Abrir o link do WhatsApp em uma nova janela
    if (notificacao && notificacao.link_whatsapp) {
      window.open(notificacao.link_whatsapp, '_blank');
      
      return {
        sucesso: true,
        mensagem: 'Link para WhatsApp gerado com sucesso!',
        link: notificacao.link_whatsapp
      };
    } else {
      return {
        sucesso: false,
        mensagem: 'Erro ao gerar link para WhatsApp.'
      };
    }
  }
  
  // Função para reprovar solicitação
  function reprovarSolicitacao(observacao) {
    if (!solicitacaoAtual) return;
    
    // Usar o serviço de autorização para atualizar o status
    const resultado = window.AutorizacaoService.atualizarStatus(
      solicitacaoAtual.id,
      'servico_social',
      'Reprovado',
      observacao
    );
    
    if (resultado.sucesso) {
      notificacaoService.enviarNotificacaoAtleta(solicitacaoAtual, 'Reprovado');
      window.location.reload();
    } else {
      alert(`Erro ao reprovar solicitação: ${resultado.mensagem}`);
    }
  }
  
  // Retornar as funções públicas
  return {
    // carregarSolicitacoes, // Não é mais usada diretamente aqui
    // obterSolicitacao, // Não é mais usada diretamente aqui
    aprovarSolicitacao,
    reprovarSolicitacao,
    enviarWhatsApp,
    // atualizarInterface // Não é mais usada diretamente aqui
  };
})();

// Inicializar o controlador quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', function() {
  ServicoSocialController.inicializar();
});


