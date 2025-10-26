// Integração com serviço de notificações para o supervisor
document.addEventListener('DOMContentLoaded', function() {
  // Verificar se o script de notificação foi carregado
  if (!window.notificacaoService) {
    console.error('Serviço de notificação não encontrado!');
    return;
  }
  
  // Elementos da página
  const btnAprovar = document.getElementById('btn-aprovar');
  const btnReprovar = document.getElementById('btn-reprovar');
  const modalObservacao = document.getElementById('modal-observacao');
  const btnConfirmar = document.getElementById('btn-confirmar');
  const btnCancelar = document.getElementById('btn-cancelar');
  
  // Variáveis de controle
  let solicitacaoAtual = null;
  let acaoAtual = null; // 'aprovar' ou 'reprovar'
  
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
  
  // Eventos dos botões
  if (btnAprovar) {
    btnAprovar.addEventListener('click', function() {
      acaoAtual = 'aprovar';
      modalObservacao.style.display = 'block';
    });
  }
  
  if (btnReprovar) {
    btnReprovar.addEventListener('click', function() {
      acaoAtual = 'reprovar';
      modalObservacao.style.display = 'block';
    });
  }
  
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
  
  // Função para carregar os dados da solicitação
  function carregarSolicitacao(id) {
    // Recuperar solicitações do localStorage
    const solicitacoes = JSON.parse(localStorage.getItem('solicitacoes')) || [];
    
    // Buscar a solicitação pelo ID
    const solicitacao = solicitacoes.find(s => s.id === id);
    
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
    document.getElementById('data-nascimento').textContent = formatarData(new Date(solicitacao.data_nascimento));
    document.getElementById('telefone-atleta').textContent = solicitacao.telefone;
    
    document.getElementById('data-saida').textContent = formatarData(new Date(solicitacao.data_saida));
    document.getElementById('horario-saida').textContent = solicitacao.horario_saida;
    document.getElementById('data-retorno').textContent = formatarData(new Date(solicitacao.data_retorno));
    document.getElementById('horario-retorno').textContent = solicitacao.horario_retorno;
    document.getElementById('motivo-destino').textContent = solicitacao.motivo_destino;
    
    document.getElementById('nome-responsavel').textContent = solicitacao.nome_responsavel;
    document.getElementById('telefone-responsavel').textContent = solicitacao.telefone_responsavel;
    
    const statusAtual = document.getElementById('status-atual');
    statusAtual.textContent = solicitacao.status_supervisor;
    
    // Ajustar a classe do badge de acordo com o status
    if (solicitacao.status_supervisor === 'Aprovado') {
      statusAtual.className = 'badge badge-approved';
      // Desabilitar botões se já aprovado
      if (btnAprovar) btnAprovar.disabled = true;
      if (btnReprovar) btnReprovar.disabled = true;
    } else if (solicitacao.status_supervisor === 'Reprovado') {
      statusAtual.className = 'badge badge-rejected';
      // Desabilitar botões se já reprovado
      if (btnAprovar) btnAprovar.disabled = true;
      if (btnReprovar) btnReprovar.disabled = true;
    } else {
      statusAtual.className = 'badge badge-pending';
    }
    
    document.getElementById('data-solicitacao').textContent = formatarData(new Date(solicitacao.data_solicitacao));
  }
  
  // Função para aprovar a solicitação
  function aprovarSolicitacao(observacao) {
    if (!solicitacaoAtual) return;
    
    // Recuperar solicitações do localStorage
    const solicitacoes = JSON.parse(localStorage.getItem('solicitacoes')) || [];
    
    // Encontrar o índice da solicitação atual
    const index = solicitacoes.findIndex(s => s.id === solicitacaoAtual.id);
    
    if (index === -1) {
      alert('Erro ao atualizar a solicitação. Por favor, tente novamente.');
      return;
    }
    
    // Atualizar o status da solicitação
    solicitacoes[index].status_supervisor = 'Aprovado';
    solicitacoes[index].observacao_supervisor = observacao;
    solicitacoes[index].data_aprovacao_supervisor = new Date().toISOString();
    
    // Salvar no localStorage
    localStorage.setItem('solicitacoes', JSON.stringify(solicitacoes));
    
    // Enviar notificação ao serviço social usando o serviço de notificações
    window.notificacaoService.enviarNotificacaoServicoSocial(solicitacoes[index]);
    
    // Atualizar a interface
    alert('Solicitação aprovada com sucesso!');
    window.location.reload();
  }
  
  // Função para reprovar a solicitação
  function reprovarSolicitacao(observacao) {
    if (!solicitacaoAtual) return;
    
    // Verificar se a observação foi fornecida (obrigatória para reprovação)
    if (!observacao.trim()) {
      alert('É necessário fornecer um motivo para a reprovação.');
      return;
    }
    
    // Recuperar solicitações do localStorage
    const solicitacoes = JSON.parse(localStorage.getItem('solicitacoes')) || [];
    
    // Encontrar o índice da solicitação atual
    const index = solicitacoes.findIndex(s => s.id === solicitacaoAtual.id);
    
    if (index === -1) {
      alert('Erro ao atualizar a solicitação. Por favor, tente novamente.');
      return;
    }
    
    // Atualizar o status da solicitação
    solicitacoes[index].status_supervisor = 'Reprovado';
    solicitacoes[index].observacao_supervisor = observacao;
    solicitacoes[index].data_reprovacao_supervisor = new Date().toISOString();
    solicitacoes[index].status_final = 'Reprovado';
    
    // Salvar no localStorage
    localStorage.setItem('solicitacoes', JSON.stringify(solicitacoes));
    
    // Enviar notificação ao atleta sobre a reprovação
    window.notificacaoService.enviarNotificacaoAtleta(solicitacoes[index], 'Reprovado');
    
    // Atualizar a interface
    alert('Solicitação reprovada.');
    window.location.reload();
  }
  
  // Função para formatar data
  function formatarData(data) {
    return data.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }
});
