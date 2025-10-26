// Integração com serviço de notificações para o serviço social
document.addEventListener('DOMContentLoaded', function() {
  // Verificar se o script de notificação foi carregado
  if (!window.notificacaoService) {
    console.error('Serviço de notificação não encontrado!');
    return;
  }
  
  // Elementos da página
  const btnEnviarWhatsapp = document.getElementById('btn-enviar-whatsapp');
  const btnValidar = document.getElementById('btn-validar');
  const btnReprovar = document.getElementById('btn-reprovar');
  const mensagemWhatsapp = document.getElementById('mensagem-whatsapp');
  const textoWhatsapp = document.getElementById('texto-whatsapp');
  const btnCopiar = document.getElementById('btn-copiar');
  const btnAbrirWhatsapp = document.getElementById('btn-abrir-whatsapp');
  const btnFecharMensagem = document.getElementById('btn-fechar-mensagem');
  const modalObservacao = document.getElementById('modal-observacao');
  const btnConfirmar = document.getElementById('btn-confirmar');
  const btnCancelar = document.getElementById('btn-cancelar');
  
  // Variáveis de controle
  let solicitacaoAtual = null;
  let acaoAtual = null; // 'validar' ou 'reprovar'
  const DPO_EMAIL = 'dpo@internacional.com.br'; // Email do DPO para a mensagem
  
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
  if (btnEnviarWhatsapp) {
    btnEnviarWhatsapp.addEventListener('click', function() {
      prepararMensagemWhatsapp();
      mensagemWhatsapp.style.display = 'block';
    });
  }
  
  if (btnValidar) {
    btnValidar.addEventListener('click', function() {
      acaoAtual = 'validar';
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
      
      if (acaoAtual === 'validar') {
        validarAutorizacao(observacao);
      } else if (acaoAtual === 'reprovar') {
        reprovarAutorizacao(observacao);
      }
      
      modalObservacao.style.display = 'none';
    });
  }
  
  if (btnCancelar) {
    btnCancelar.addEventListener('click', function() {
      modalObservacao.style.display = 'none';
    });
  }
  
  if (btnCopiar) {
    btnCopiar.addEventListener('click', function() {
      textoWhatsapp.select();
      document.execCommand('copy');
      alert('Mensagem copiada para a área de transferência!');
    });
  }
  
  if (btnAbrirWhatsapp) {
    btnAbrirWhatsapp.addEventListener('click', function() {
      if (!solicitacaoAtual) return;
      
      // Formatar número de telefone (remover caracteres não numéricos)
      const telefone = solicitacaoAtual.telefone_responsavel.replace(/\D/g, '');
      
      // Codificar a mensagem para URL
      const mensagem = encodeURIComponent(textoWhatsapp.value);
      
      // Abrir WhatsApp Web com o número e mensagem
      window.open(`https://wa.me/${telefone}?text=${mensagem}`, '_blank');
      
      // Registrar o envio da mensagem
      registrarEnvioWhatsapp();
    });
  }
  
  if (btnFecharMensagem) {
    btnFecharMensagem.addEventListener('click', function() {
      mensagemWhatsapp.style.display = 'none';
    });
  }
  
  // Função para carregar os dados da solicitação
  async function carregarSolicitacao(id) {
    let solicitacao;
    
    try {
      // Usar o serviço de armazenamento para obter a solicitação
      if (window.storageService) {
        solicitacao = await window.storageService.getDocument('solicitacoes', id);
      } else {
        // Fallback para localStorage se o serviço não estiver disponível
        const solicitacoes = JSON.parse(localStorage.getItem('solicitacoes')) || [];
        solicitacao = solicitacoes.find(s => s.id === id);
      }
      
      if (!solicitacao) {
        alert('Solicitação não encontrada. Redirecionando para o painel.');
        window.location.href = 'dashboard.html';
        return;
      }
    } catch (error) {
      console.error('Erro ao carregar solicitação:', error);
      alert('Erro ao carregar dados da solicitação. Redirecionando para o painel.');
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
    
    const statusSupervisor = document.getElementById('status-supervisor');
    statusSupervisor.textContent = solicitacao.status_supervisor;
    
    // Ajustar a classe do badge de acordo com o status
    if (solicitacao.status_supervisor === 'Aprovado') {
      statusSupervisor.className = 'status status-aprovado';
    } else if (solicitacao.status_supervisor === 'Reprovado') {
      statusSupervisor.className = 'status status-reprovado';
    } else {
      statusSupervisor.className = 'status status-pendente';
    }
    
    document.getElementById('data-aprovacao-supervisor').textContent = 
      solicitacao.data_aprovacao_supervisor ? 
      formatarData(new Date(solicitacao.data_aprovacao_supervisor)) : 
      'N/A';
    
    const statusAtual = document.getElementById('status-atual');
    statusAtual.textContent = solicitacao.status_servico_social;
    
    // Ajustar a classe do badge de acordo com o status
    if (solicitacao.status_servico_social === 'Aprovado') {
      statusAtual.className = solicitacao.status_servico_social === 'Aprovado' ? 'status status-aprovado' : 'status status-reprovado';
      // Desabilitar botões se já aprovado ou reprovado
      if (btnValidar) btnValidar.disabled = true;
      if (btnReprovar) btnReprovar.disabled = true;
    } else {
      statusAtual.className = 'status status-pendente';
    }
  }
  
  // Função para preparar a mensagem de WhatsApp
  function prepararMensagemWhatsapp() {
    if (!solicitacaoAtual) return;
    
    // Verificar se o serviço de confirmação está disponível
    if (!window.confirmacaoService) {
      console.error('Serviço de confirmação não encontrado!');
      alert('Erro ao gerar link de confirmação. Por favor, recarregue a página.');
      return;
    }
    
    // Função para formatar data no formato dd/MM/yyyy
    function fmt(dataStr, formato) {
      const data = new Date(dataStr);
      if (formato === "dd/MM/yyyy") {
        return data.toLocaleDateString('pt-BR');
      } else if (formato === "HH:mm") {
        return data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
      }
      return dataStr;
    }
    
    // Gerar link único de confirmação
    const linkConfirmacao = window.confirmacaoService.gerarLinkConfirmacao(solicitacaoAtual);
    
    // Construir a mensagem conforme o modelo fornecido pelo usuário, incluindo o link de confirmação
    const mensagem = `Prezado(a) ${solicitacaoAtual.nome_responsavel || 'Responsável'},

Informamos que o(a) atleta abaixo solicitou autorização de saída, conforme Lei Pelé (Art. 29) e LGPD (Lei nº 13.709/2018):

🙋🏽 Nome: ${solicitacaoAtual.nome}
📅 Saída: ${fmt(solicitacaoAtual.data_saida, "dd/MM/yyyy")} às ${solicitacaoAtual.horario_saida}
📅 Retorno: ${fmt(solicitacaoAtual.data_retorno, "dd/MM/yyyy")} às ${solicitacaoAtual.horario_retorno}
📍 Destino: ${solicitacaoAtual.motivo_destino}

Para autorizar, clique no link abaixo:
${linkConfirmacao}

Ao clicar no link, você declara:
*Eu, ${solicitacaoAtual.nome_responsavel || '[seu nome]'}, autorizo o(a) atleta ${solicitacaoAtual.nome} a sair e retornar ao alojamento conforme informado, em conformidade com a Lei Pelé e LGPD.*

Seus dados serão protegidos conforme nossa política de privacidade. Contato do DPO: ${DPO_EMAIL}.

Atenciosamente,
Serviço Social - Sport Club Internacional`;
    
    textoWhatsapp.value = mensagem;
    
    // Registrar a geração do link na solicitação
    registrarGeracaoLink(linkConfirmacao);
  }
  
  // Função para registrar a geração do link na solicitação
  function registrarGeracaoLink(link) {
    if (!solicitacaoAtual) return;
    
    // Recuperar solicitações do localStorage
    const solicitacoes = JSON.parse(localStorage.getItem('solicitacoes')) || [];
    
    // Encontrar o índice da solicitação atual
    const index = solicitacoes.findIndex(s => s.id === solicitacaoAtual.id);
    
    if (index === -1) {
      console.error('Erro ao atualizar a solicitação com o link de confirmação.');
      return;
    }
    
    // Atualizar o registro com o link de confirmação
    solicitacoes[index].link_confirmacao = link;
    solicitacoes[index].data_geracao_link = new Date().toISOString();
    
    // Salvar no localStorage
    localStorage.setItem('solicitacoes', JSON.stringify(solicitacoes));
    
    console.log('Link de confirmação registrado:', link);
  }
  
  // Função para registrar o envio de mensagem via WhatsApp
  function registrarEnvioWhatsapp() {
    if (!solicitacaoAtual) return;
    
    // Usar o serviço de notificação para registrar o envio
    const linkConfirmacao = window.confirmacaoService.gerarLinkConfirmacao(solicitacaoAtual);
    const notificacao = window.notificacaoService.enviarNotificacaoWhatsApp(solicitacaoAtual);
    
    console.log('Notificação WhatsApp registrada:', notificacao);
    alert('Mensagem enviada com sucesso!');
  }
  
  // Função para validar a autorização
  async function validarAutorizacao(observacao) {
    if (!solicitacaoAtual) return;
    
    try {
      // Verificar se o responsável já confirmou via link
      if (window.confirmacaoService) {
        const confirmacao = window.confirmacaoService.verificarConfirmacao(solicitacaoAtual.id);
        
        if (!confirmacao.confirmado) {
          alert('O responsável ainda não confirmou a autorização pelo link enviado. A validação só pode ser realizada após a confirmação do responsável.');
          return;
        }
      }
      
      // Obter hash de confirmação do responsável (se disponível)
      let hashValidacao = '';
      if (window.confirmacaoService) {
        const confirmacao = window.confirmacaoService.verificarConfirmacao(solicitacaoAtual.id);
        hashValidacao = confirmacao.hash_legal || gerarHashUnico(solicitacaoAtual);
      } else {
        hashValidacao = gerarHashUnico(solicitacaoAtual);
      }
      
      // Criar objeto com as atualizações
      const atualizacoes = {
        status_servico_social: 'Aprovado',
        observacao_servico_social: observacao,
        data_validacao_servico_social: new Date().toISOString(),
        hash_validacao: hashValidacao,
        status_final: 'Aprovado',
        id_validacao_legal: `AUTH-${new Date().getTime()}-${solicitacaoAtual.id}`
      };
      
      // Atualizar a solicitação
      let solicitacaoAtualizada;
      
      if (window.storageService) {
        // Usar o serviço de armazenamento para atualizar a solicitação
        await window.storageService.updateDocument('solicitacoes', solicitacaoAtual.id, atualizacoes);
        solicitacaoAtualizada = await window.storageService.getDocument('solicitacoes', solicitacaoAtual.id);
      } else {
        // Fallback para localStorage
        const solicitacoes = JSON.parse(localStorage.getItem('solicitacoes')) || [];
        const index = solicitacoes.findIndex(s => s.id === solicitacaoAtual.id);
        
        if (index === -1) {
          alert('Erro ao atualizar a solicitação. Por favor, tente novamente.');
          return;
        }
        
        // Atualizar o objeto no array
        Object.assign(solicitacoes[index], atualizacoes);
        localStorage.setItem('solicitacoes', JSON.stringify(solicitacoes));
        solicitacaoAtualizada = solicitacoes[index];
      }
      
      // Arquivar a autorização aprovada
      await arquivarAutorizacao(solicitacaoAtualizada, 'aprovadas');
      
      // Enviar notificação aos monitores e ao atleta
      await window.notificacaoService.enviarNotificacaoMonitores(solicitacaoAtualizada, 'Aprovado');
      await window.notificacaoService.enviarNotificacaoAtleta(solicitacaoAtualizada, 'Aprovado');
      
      // Atualizar a interface
      alert('Autorização validada com sucesso! ID de validação legal: ' + solicitacaoAtualizada.id_validacao_legal);
      window.location.reload();
    } catch (error) {
      console.error('Erro ao validar autorização:', error);
      alert('Erro ao validar autorização. Por favor, tente novamente.');
    }
  }
  
  // Função para reprovar a autorização
  async function reprovarAutorizacao(observacao) {
    if (!solicitacaoAtual) return;
    
    // Verificar se a observação foi fornecida (obrigatória para reprovação)
    if (!observacao.trim()) {
      alert('É necessário fornecer um motivo para a reprovação.');
      return;
    }
    
    try {
      // Criar objeto com as atualizações
      const atualizacoes = {
        status_servico_social: 'Reprovado',
        observacao_servico_social: observacao,
        data_reprovacao_servico_social: new Date().toISOString(),
        status_final: 'Reprovado',
        id_reprovacao_legal: `REP-${new Date().getTime()}-${solicitacaoAtual.id}`
      };
      
      // Atualizar a solicitação
      let solicitacaoAtualizada;
      
      if (window.storageService) {
        // Usar o serviço de armazenamento para atualizar a solicitação
        await window.storageService.updateDocument('solicitacoes', solicitacaoAtual.id, atualizacoes);
        solicitacaoAtualizada = await window.storageService.getDocument('solicitacoes', solicitacaoAtual.id);
      } else {
        // Fallback para localStorage
        const solicitacoes = JSON.parse(localStorage.getItem('solicitacoes')) || [];
        const index = solicitacoes.findIndex(s => s.id === solicitacaoAtual.id);
        
        if (index === -1) {
          alert('Erro ao atualizar a solicitação. Por favor, tente novamente.');
          return;
        }
        
        // Atualizar o objeto no array
        Object.assign(solicitacoes[index], atualizacoes);
        localStorage.setItem('solicitacoes', JSON.stringify(solicitacoes));
        solicitacaoAtualizada = solicitacoes[index];
      }
      
      // Arquivar a autorização reprovada
      await arquivarAutorizacao(solicitacaoAtualizada, 'reprovadas');
      
      // Enviar notificação aos monitores e ao atleta
      await window.notificacaoService.enviarNotificacaoMonitores(solicitacaoAtualizada, 'Reprovado');
      await window.notificacaoService.enviarNotificacaoAtleta(solicitacaoAtualizada, 'Reprovado');
      
      // Atualizar a interface
      alert('Autorização reprovada. ID de reprovação legal: ' + solicitacaoAtualizada.id_reprovacao_legal);
      window.location.reload();
    } catch (error) {
      console.error('Erro ao reprovar autorização:', error);
      alert('Erro ao reprovar autorização. Por favor, tente novamente.');
    }
  }
  
  // Função para gerar hash único para validação legal
  function gerarHashUnico(dados) {
    // Em um sistema real, usaríamos um algoritmo de hash criptográfico
    // Aqui, vamos simular um hash baseado nos dados e timestamp
    const timestamp = new Date().getTime();
    const randomStr = Math.random().toString(36).substring(2, 15);
    return `HASH-${timestamp}-${randomStr}-${dados.id}`;
  }
  
  // Função para arquivar a autorização
  async function arquivarAutorizacao(dados, tipo) {
    try {
      // Adicionar data e hora de arquivamento
      const dadosArquivados = {
        ...dados,
        data_arquivamento: new Date().toISOString(),
        id_arquivo: `${tipo.toUpperCase()}-${new Date().getTime()}-${dados.id}`
      };
      
      if (window.storageService) {
        // Usar o serviço de armazenamento para arquivar
        // Primeiro, obtemos a coleção de arquivos
        let arquivos = await window.storageService.getCollection('arquivos') || {};
        
        // Inicializar a categoria se não existir
        if (!arquivos[tipo]) {
          arquivos[tipo] = [];
        }
        
        // Adicionar ao arquivo
        arquivos[tipo].push(dadosArquivados);
        
        // Salvar no armazenamento
        await window.storageService.saveCollection('arquivos', arquivos);
      } else {
        // Fallback para localStorage
        // Recuperar arquivos existentes ou inicializar objeto vazio
        let arquivos = JSON.parse(localStorage.getItem('arquivos')) || {};
        
        // Inicializar a categoria se não existir
        if (!arquivos[tipo]) {
          arquivos[tipo] = [];
        }
        
        // Adicionar ao arquivo
        arquivos[tipo].push(dadosArquivados);
        
        // Salvar no localStorage
        localStorage.setItem('arquivos', JSON.stringify(arquivos));
      }
      
      console.log(`Autorização ${dados.id} arquivada em ${tipo}`);
    } catch (error) {
      console.error(`Erro ao arquivar autorização em ${tipo}:`, error);
    }
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


  const btnGerarPdf = document.getElementById('btn-gerar-pdf');
  if (btnGerarPdf) {
    btnGerarPdf.addEventListener('click', async function() {
      if (solicitacaoAtual && window.pdfService) {
        const resultado = await window.pdfService.gerarRelatorio(solicitacaoAtual.id);
        if (resultado.sucesso) {
          alert(resultado.mensagem);
        } else {
          alert(resultado.mensagem);
        }
      } else {
        alert('Serviço de PDF não disponível ou solicitação não carregada.');
      }
    });
  }


