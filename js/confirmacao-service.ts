// Serviço de confirmação de autorização via link
class ConfirmacaoService {
  constructor() {
    this.confirmacoes = [];
    this.carregarConfirmacoes();
  }
  
  // Carregar confirmações do armazenamento
  async carregarConfirmacoes() {
    try {
      // Usar o serviço de armazenamento para obter as confirmações
      if (window.storageService) {
        this.confirmacoes = await window.storageService.getCollection('confirmacoes');
      } else {
        // Fallback para localStorage se o serviço não estiver disponível
        this.confirmacoes = JSON.parse(localStorage.getItem('confirmacoes')) || [];
      }
    } catch (error) {
      console.error('Erro ao carregar confirmações:', error);
      this.confirmacoes = JSON.parse(localStorage.getItem('confirmacoes')) || [];
    }
  }
  
  // Gerar link único de confirmação
  gerarLinkConfirmacao(dados) {
    // Gerar token único para o link
    const token = this.gerarTokenUnico(dados);
    
    // Registrar o token e os dados da solicitação
    this.registrarToken(token, dados);
    
    // Construir o link de confirmação (em um sistema real, seria um domínio válido)
    // Para fins de demonstração, usamos um link que simula a confirmação
    const baseUrl = "https://autorizabase.vercel.app"; // Substitua pela URL real do seu projeto no Vercel
    return `${baseUrl}/pais/aprovacao.html?token=${token}&id=${dados.id}&atleta=${encodeURIComponent(dados.nome)}&responsavel=${encodeURIComponent(dados.nome_responsavel)}`;
  }
  
  // Gerar token único para o link
  gerarTokenUnico(dados) {
    // Em um sistema real, usaríamos um algoritmo mais seguro
    const timestamp = new Date().getTime();
    const randomStr = Math.random().toString(36).substring(2, 15);
    const baseToken = `${dados.id}-${timestamp}-${randomStr}`;
    
    // Simular um hash do token
    return btoa(baseToken).replace(/[^a-zA-Z0-9]/g, '').substring(0, 32);
  }
  
  // Registrar token e dados da solicitação
  registrarToken(token, dados) {
    // Criar objeto de confirmação
    const confirmacao = {
      token: token,
      id_solicitacao: dados.id,
      nome_atleta: dados.nome,
      nome_responsavel: dados.nome_responsavel,
      telefone_responsavel: dados.telefone_responsavel,
      data_geracao: new Date().toISOString(),
      data_confirmacao: null,
      ip_confirmacao: null,
      confirmado: false,
      recusado: false,
      hash_legal: null
    };
    
    // Adicionar à lista de confirmações
    this.confirmacoes.push(confirmacao);
    
    // Salvar no localStorage
    this.salvarConfirmacoes();
    
    return confirmacao;
  }
  
  // Verificar e processar confirmação
  processarConfirmacao(token, ip) {
    // Buscar confirmação pelo token
    const index = this.confirmacoes.findIndex(c => c.token === token);
    
    if (index === -1) {
      return {
        sucesso: false,
        mensagem: 'Token de confirmação inválido ou expirado.'
      };
    }
    
    // Verificar se já foi confirmado
    if (this.confirmacoes[index].confirmado) {
      return {
        sucesso: false,
        mensagem: 'Esta autorização já foi confirmada anteriormente.'
      };
    }
    
    // Atualizar dados da confirmação
    this.confirmacoes[index].data_confirmacao = new Date().toISOString();
    this.confirmacoes[index].ip_confirmacao = ip || '127.0.0.1';
    this.confirmacoes[index].confirmado = true;
    this.confirmacoes[index].hash_legal = this.gerarHashLegal(this.confirmacoes[index]);
    
    // Salvar no localStorage
    this.salvarConfirmacoes();
    
    // Atualizar o status da solicitação
    this.atualizarStatusSolicitacao(this.confirmacoes[index].id_solicitacao);
    
    return {
      sucesso: true,
      mensagem: 'Autorização confirmada com sucesso!',
      dados: this.confirmacoes[index]
    };
  }
  
  // Recusar confirmação
  recusarConfirmacao(token, ip) {
    // Buscar confirmação pelo token
    const index = this.confirmacoes.findIndex(c => c.token === token);
    
    if (index === -1) {
      return {
        sucesso: false,
        mensagem: 'Token de confirmação inválido ou expirado.'
      };
    }
    
    // Verificar se já foi confirmado ou recusado
    if (this.confirmacoes[index].confirmado || this.confirmacoes[index].recusado) {
      return {
        sucesso: false,
        mensagem: 'Esta autorização já foi processada anteriormente.'
      };
    }
    
    // Atualizar dados da confirmação
    this.confirmacoes[index].data_confirmacao = new Date().toISOString();
    this.confirmacoes[index].ip_confirmacao = ip || '127.0.0.1';
    this.confirmacoes[index].recusado = true;
    
    // Salvar no localStorage
    this.salvarConfirmacoes();
    
    // Atualizar o status da solicitação para recusado
    this.cancelarSolicitacao(this.confirmacoes[index].id_solicitacao);
    
    return {
      sucesso: true,
      mensagem: 'Autorização recusada com sucesso!',
      dados: this.confirmacoes[index]
    };
  }
  
  // Cancelar a solicitação após recusa
  cancelarSolicitacao(idSolicitacao) {
    // Recuperar solicitações do localStorage
    const solicitacoes = JSON.parse(localStorage.getItem('solicitacoes')) || [];
    
    // Encontrar o índice da solicitação
    const index = solicitacoes.findIndex(s => s.id === idSolicitacao);
    
    if (index !== -1) {
      // Atualizar o status da solicitação para 'cancelado'
      solicitacoes[index].status = 'cancelado';
      solicitacoes[index].data_atualizacao = new Date().toISOString();
      solicitacoes[index].observacoes = solicitacoes[index].observacoes || '';
      solicitacoes[index].observacoes += '\nAutorização recusada pelo responsável.';
      
      // Salvar no localStorage
      localStorage.setItem('solicitacoes', JSON.stringify(solicitacoes));
    }
  }
  
  // Atualizar o status da solicitação após confirmação
  atualizarStatusSolicitacao(idSolicitacao) {
    // Recuperar solicitações do localStorage
    const solicitacoes = JSON.parse(localStorage.getItem('solicitacoes')) || [];
    
    // Encontrar o índice da solicitação
    const index = solicitacoes.findIndex(s => s.id === idSolicitacao);
    
    if (index === -1) {
      console.error('Solicitação não encontrada:', idSolicitacao);
      return false;
    }
    
    // Atualizar o status da solicitação
    solicitacoes[index].confirmado_responsavel = true;
    solicitacoes[index].data_confirmacao_responsavel = new Date().toISOString();
    
    // Salvar no localStorage
    localStorage.setItem('solicitacoes', JSON.stringify(solicitacoes));
    
    return true;
  }
  
  // Verificar se uma solicitação foi confirmada
  verificarConfirmacao(idSolicitacao) {
    // Buscar confirmação pela ID da solicitação
    const confirmacao = this.confirmacoes.find(c => c.id_solicitacao === idSolicitacao && c.confirmado);
    
    return confirmacao ? {
      confirmado: true,
      data_confirmacao: confirmacao.data_confirmacao,
      hash_legal: confirmacao.hash_legal
    } : {
      confirmado: false
    };
  }
  
  // Gerar hash legal para a confirmação
  gerarHashLegal(dados) {
    // Em um sistema real, usaríamos um algoritmo de hash criptográfico
    // Aqui, vamos simular um hash baseado nos dados e timestamp
    const timestamp = new Date().getTime();
    const baseStr = `${dados.token}-${dados.id_solicitacao}-${dados.data_confirmacao}-${dados.ip_confirmacao}-${timestamp}`;
    
    return `LEGAL-${btoa(baseStr).replace(/[^a-zA-Z0-9]/g, '').substring(0, 64)}`;
  }
  
  // Salvar confirmações no armazenamento
  async salvarConfirmacoes() {
    try {
      // Usar o serviço de armazenamento para salvar as confirmações
      if (window.storageService) {
        await window.storageService.saveCollection('confirmacoes', this.confirmacoes);
      } else {
        // Fallback para localStorage se o serviço não estiver disponível
        localStorage.setItem('confirmacoes', JSON.stringify(this.confirmacoes));
      }
    } catch (error) {
      console.error('Erro ao salvar confirmações:', error);
      // Fallback para localStorage em caso de erro
      localStorage.setItem('confirmacoes', JSON.stringify(this.confirmacoes));
    }
  }
}

// Exportar o serviço para uso global
window.confirmacaoService = new ConfirmacaoService();
