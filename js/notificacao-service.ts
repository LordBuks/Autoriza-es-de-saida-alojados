// Sistema de notificações automáticas
class NotificacaoService {
  constructor() {
    this.notificacoes = [];
    // Inicializar serviços dependentes
    this.confirmacaoService = new ConfirmacaoService();
    this.whatsAppService = window.whatsAppService || new WhatsAppService();
    
    // Carregar notificações do armazenamento
    this.carregarNotificacoes();
  }
  
  // Carregar notificações do armazenamento
  async carregarNotificacoes() {
    try {
      // Usar o serviço de armazenamento para obter as notificações
      if (window.storageService) {
        this.notificacoes = await window.storageService.getCollection('notificacoes');
      } else {
        // Fallback para localStorage se o serviço não estiver disponível
        this.notificacoes = JSON.parse(localStorage.getItem('notificacoes')) || [];
      }
    } catch (error) {
      console.error('Erro ao carregar notificações:', error);
      this.notificacoes = JSON.parse(localStorage.getItem('notificacoes')) || [];
    }
  }
  
  // Enviar notificação para supervisor quando atleta preenche formulário
  enviarNotificacaoSupervisor(dados) {
    console.log('Enviando notificação para supervisor da categoria ' + dados.categoria);
    
    // Criar objeto de notificação
    const notificacao = {
      id: this.gerarIdNotificacao(),
      tipo: 'supervisor',
      categoria: dados.categoria,
      id_solicitacao: dados.id,
      nome_atleta: dados.nome,
      data_envio: new Date().toISOString(),
      lida: false,
      mensagem: `Nova solicitação de autorização de saída. Atleta: ${dados.nome}, Categoria: ${dados.categoria}`
    };
    
    // Adicionar à lista de notificações
    this.notificacoes.push(notificacao);
    
    // Salvar no localStorage
    this.salvarNotificacoes();
    
    // Em um sistema real, enviaríamos um e-mail para o supervisor
    this.simularEnvioEmail(
      `supervisor.${dados.categoria.toLowerCase().replace('-', '')}@internacional.com.br`,
      'Nova solicitação de autorização de saída',
      `
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .header { background-color: #cc0d2e; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; }
          .footer { background-color: #f1f1f1; padding: 10px; text-align: center; font-size: 12px; }
          .button { background-color: #cc0d2e; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Sport Club Internacional</h1>
          <h2>Sistema de Autorizações Digitais</h2>
        </div>
        <div class="content">
          <h3>Nova solicitação de autorização de saída</h3>
          <p>Uma nova solicitação de autorização foi registrada e requer sua aprovação:</p>
          <p><strong>Atleta:</strong> ${dados.nome}</p>
          <p><strong>Categoria:</strong> ${dados.categoria}</p>
          <p><strong>Data de Saída:</strong> ${this.formatarData(new Date(dados.data_saida))} às ${dados.horario_saida}</p>
          <p><strong>Data de Retorno:</strong> ${this.formatarData(new Date(dados.data_retorno))} às ${dados.horario_retorno}</p>
          <p><strong>Motivo/Destino:</strong> ${dados.motivo_destino}</p>
          <p>
            <a href="https://fuzbtjsj.manus.space/supervisor/detalhe.html?id=${dados.id}" class="button">Analisar Solicitação</a>
          </p>
        </div>
        <div class="footer">
          <p>Este é um e-mail automático. Por favor, não responda.</p>
          <p>© ${new Date().getFullYear()} VampTech</p>
        </div>
      </body>
      </html>
      `
    );
    
    return notificacao;
  }
  
  // Enviar notificação para serviço social quando supervisor aprova
  enviarNotificacaoServicoSocial(dados) {
    console.log('Enviando notificação para serviço social');
    
    // Criar objeto de notificação
    const notificacao = {
      id: this.gerarIdNotificacao(),
      tipo: 'servico_social',
      id_solicitacao: dados.id,
      nome_atleta: dados.nome,
      categoria: dados.categoria,
      data_envio: new Date().toISOString(),
      lida: false,
      mensagem: `Autorização aguardando. Supervisor aprovou solicitação do atleta: ${dados.nome}, Categoria: ${dados.categoria}`
    };
    
    // Adicionar à lista de notificações
    this.notificacoes.push(notificacao);
    
    // Salvar no localStorage
    this.salvarNotificacoes();
    
    // Em um sistema real, enviaríamos um e-mail para o serviço social
    this.simularEnvioEmail(
      'servico.social@internacional.com.br',
      'Autorização aguardando validação',
      `
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .header { background-color: #cc0d2e; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; }
          .footer { background-color: #f1f1f1; padding: 10px; text-align: center; font-size: 12px; }
          .button { background-color: #cc0d2e; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; }
          .approved { color: #28a745; font-weight: bold; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Sport Club Internacional</h1>
          <h2>Sistema de Autorizações Digitais</h2>
        </div>
        <div class="content">
          <h3>Autorização aguardando validação</h3>
          <p>Uma solicitação de autorização foi <span class="approved">APROVADA</span> pelo supervisor e requer sua validação:</p>
          <p><strong>Atleta:</strong> ${dados.nome}</p>
          <p><strong>Categoria:</strong> ${dados.categoria}</p>
          <p><strong>Data de Saída:</strong> ${this.formatarData(new Date(dados.data_saida))} às ${dados.horario_saida}</p>
          <p><strong>Data de Retorno:</strong> ${this.formatarData(new Date(dados.data_retorno))} às ${dados.horario_retorno}</p>
          <p><strong>Motivo/Destino:</strong> ${dados.motivo_destino}</p>
          <p><strong>Responsável:</strong> ${dados.nome_responsavel} - ${dados.telefone_responsavel}</p>
          <p>
            <a href="https://fuzbtjsj.manus.space/servico_social/detalhe.html?id=${dados.id}" class="button">Validar Autorização</a>
          </p>
        </div>
        <div class="footer">
          <p>Este é um e-mail automático. Por favor, não responda.</p>
          <p>© ${new Date().getFullYear()} TechVamp</p>
        </div>
      </body>
      </html>
      `
    );
    
    return notificacao;
  }
  
  // Enviar notificação para monitores quando autorização é finalizada
  enviarNotificacaoMonitores(dados, status) {
    console.log('Enviando notificação para monitores');
    
    // Criar objeto de notificação
    const notificacao = {
      id: this.gerarIdNotificacao(),
      tipo: 'monitor',
      id_solicitacao: dados.id,
      nome_atleta: dados.nome,
      categoria: dados.categoria,
      status: status,
      data_envio: new Date().toISOString(),
      lida: false,
      mensagem: `Autorização ${status === 'Aprovado' ? 'APROVADA' : 'REPROVADA'} para o atleta: ${dados.nome}, Categoria: ${dados.categoria}`
    };
    
    // Adicionar à lista de notificações
    this.notificacoes.push(notificacao);
    
    // Salvar no localStorage
    this.salvarNotificacoes();
    
    // Em um sistema real, enviaríamos um e-mail para os monitores
    this.simularEnvioEmail(
      'monitores@internacional.com.br',
      `Autorização ${status === 'Aprovado' ? 'APROVADA' : 'REPROVADA'}`,
      `
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .header { background-color: #cc0d2e; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; }
          .footer { background-color: #f1f1f1; padding: 10px; text-align: center; font-size: 12px; }
          .button { background-color: #cc0d2e; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; }
          .approved { color: #28a745; font-weight: bold; }
          .rejected { color: #dc3545; font-weight: bold; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Sport Club Internacional</h1>
          <h2>Sistema de Autorizações Digitais</h2>
        </div>
        <div class="content">
          <h3>Autorização ${status === 'Aprovado' ? 
            '<span class="approved">APROVADA</span>' : 
            '<span class="rejected">REPROVADA</span>'}</h3>
          <p>Uma solicitação de autorização foi finalizada:</p>
          <p><strong>Atleta:</strong> ${dados.nome}</p>
          <p><strong>Categoria:</strong> ${dados.categoria}</p>
          <p><strong>Data de Saída:</strong> ${this.formatarData(new Date(dados.data_saida))} às ${dados.horario_saida}</p>
          <p><strong>Data de Retorno:</strong> ${this.formatarData(new Date(dados.data_retorno))} às ${dados.horario_retorno}</p>
          <p><strong>Motivo/Destino:</strong> ${dados.motivo_destino}</p>
          <p>
            <a href="https://fuzbtjsj.manus.space/monitor/detalhe.html?id=${dados.id}" class="button">Ver Detalhes</a>
          </p>
        </div>
        <div class="footer">
          <p>Este é um e-mail automático. Por favor, não responda.</p>
          <p>© ${new Date().getFullYear()} TechVamp</p>
        </div>
      </body>
      </html>
      `
    );
    
    return notificacao;
  }
  
  // Enviar notificação para atleta sobre status da autorização
  enviarNotificacaoAtleta(dados, status) {
    console.log('Enviando notificação para atleta');
    
    // Criar objeto de notificação
    const notificacao = {
      id: this.gerarIdNotificacao(),
      tipo: 'atleta',
      id_solicitacao: dados.id,
      nome_atleta: dados.nome,
      status: status,
      data_envio: new Date().toISOString(),
      lida: false,
      mensagem: `Sua solicitação de autorização foi ${status === 'Aprovado' ? 'APROVADA' : 'REPROVADA'}.`
    };
    
    // Adicionar à lista de notificações
    this.notificacoes.push(notificacao);
    
    // Salvar no localStorage
    this.salvarNotificacoes();
    
    // Em um sistema real, enviaríamos um e-mail para o atleta
    this.simularEnvioEmail(
      dados.email,
      `Sua autorização foi ${status === 'Aprovado' ? 'APROVADA' : 'REPROVADA'}`,
      `
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .header { background-color: #cc0d2e; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; }
          .footer { background-color: #f1f1f1; padding: 10px; text-align: center; font-size: 12px; }
          .button { background-color: #cc0d2e; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; }
          .approved { color: #28a745; font-weight: bold; }
          .rejected { color: #dc3545; font-weight: bold; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Sport Club Internacional</h1>
          <h2>Sistema de Autorizações Digitais</h2>
        </div>
        <div class="content">
          <h3>Sua autorização foi ${status === 'Aprovado' ? 
            '<span class="approved">APROVADA</span>' : 
            '<span class="rejected">REPROVADA</span>'}</h3>
          <p>Sua solicitação de autorização de saída foi processada:</p>
          <p><strong>Código:</strong> ${dados.id}</p>
          <p><strong>Data de Saída:</strong> ${this.formatarData(new Date(dados.data_saida))} às ${dados.horario_saida}</p>
          <p><strong>Data de Retorno:</strong> ${this.formatarData(new Date(dados.data_retorno))} às ${dados.horario_retorno}</p>
          <p><strong>Motivo/Destino:</strong> ${dados.motivo_destino}</p>
          ${status === 'Reprovado' && dados.observacao_supervisor ? 
            `<p><strong>Motivo da reprovação:</strong> ${dados.observacao_supervisor}</p>` : ''}
          <p>
            <a href="https://fuzbtjsj.manus.space/atleta/consultar.html?id=${dados.id}" class="button">Ver Detalhes</a>
          </p>
        </div>
        <div class="footer">
          <p>Este é um e-mail automático. Por favor, não responda.</p>
          <p>© ${new Date().getFullYear()} TechVamp</p>
        </div>
      </body>
      </html>
      `
    );
    
    return notificacao;
  }
  
  // Obter notificações não lidas por tipo
  obterNotificacoesNaoLidas(tipo) {
    return this.notificacoes.filter(n => n.tipo === tipo && !n.lida);
  }
  
  // Marcar notificação como lida
  marcarComoLida(id) {
    const index = this.notificacoes.findIndex(n => n.id === id);
    if (index !== -1) {
      this.notificacoes[index].lida = true;
      this.salvarNotificacoes();
    }
  }
  
  // Salvar notificações no armazenamento
  async salvarNotificacoes() {
    try {
      // Usar o serviço de armazenamento para salvar as notificações
      if (window.storageService) {
        await window.storageService.saveCollection('notificacoes', this.notificacoes);
      } else {
        // Fallback para localStorage se o serviço não estiver disponível
        localStorage.setItem('notificacoes', JSON.stringify(this.notificacoes));
      }
    } catch (error) {
      console.error('Erro ao salvar notificações:', error);
      // Fallback para localStorage em caso de erro
      localStorage.setItem('notificacoes', JSON.stringify(this.notificacoes));
    }
  }
  
  // Gerar ID único para notificação
  gerarIdNotificacao() {
    return 'notif-' + Math.random().toString(36).substr(2, 9);
  }
  
  // Enviar notificação via WhatsApp para o responsável
  enviarNotificacaoWhatsApp(dados) {
    console.log('Enviando notificação via WhatsApp para o responsável');
    
    // Gerar link de confirmação
    const linkConfirmacao = `https://autorizabase.vercel.app/pais/aprovacao.html?id=${dados.id}&token=${this.confirmacaoService.gerarTokenConfirmacao(dados)}`;
    
    // Gerar mensagem para WhatsApp
    const mensagem = this.whatsAppService.gerarMensagemConfirmacao(dados, linkConfirmacao);
    
    // Gerar link do WhatsApp
    const linkWhatsApp = this.whatsAppService.gerarLinkWhatsApp(dados.telefone_responsavel, mensagem);
    
    // Registrar a notificação
    const notificacao = {
      id: this.gerarIdNotificacao(),
      tipo: 'whatsapp',
      id_solicitacao: dados.id,
      nome_atleta: dados.nome,
      nome_responsavel: dados.nome_responsavel,
      telefone_responsavel: dados.telefone_responsavel,
      data_envio: new Date().toISOString(),
      link_whatsapp: linkWhatsApp,
      link_confirmacao: linkConfirmacao
    };
    
    // Adicionar à lista de notificações
    this.notificacoes.push(notificacao);
    
    // Salvar no localStorage
    this.salvarNotificacoes();
    
    // Em um sistema real, poderíamos abrir automaticamente o link ou enviar via API
    console.log('Link para WhatsApp gerado:', linkWhatsApp);
    
    // Abrir o link do WhatsApp em uma nova janela (comentado para fins de demonstração)
        window.open(linkWhatsApp, '_blank');
    
    return notificacao;
  }
  
  // Obter link de WhatsApp para uma solicitação
  obterLinkWhatsApp(idSolicitacao) {
    const notificacao = this.notificacoes.find(n => n.tipo === 'whatsapp' && n.id_solicitacao === idSolicitacao);
    return notificacao ? notificacao.link_whatsapp : null;
  }
  
  // Formatar data
  formatarData(data) {
    return data.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }
  
  // Simular envio de e-mail (em um sistema real, usaríamos uma API de e-mail)
  async simularEnvioEmail(destinatario, assunto, corpo) {
    console.log(`Simulando envio de e-mail para: ${destinatario}`);
    console.log(`Assunto: ${assunto}`);
    console.log(`Corpo: ${corpo.substring(0, 100)}...`);
    
    // Criar objeto de e-mail
    const email = {
      id: 'email-' + new Date().getTime() + '-' + Math.random().toString(36).substring(2, 9),
      destinatario,
      assunto,
      data_envio: new Date().toISOString(),
      resumo_corpo: corpo.substring(0, 100) + '...'
    };
    
    try {
      // Usar o serviço de armazenamento para salvar o e-mail
      if (window.storageService) {
        await window.storageService.saveDocument('emails', email);
      } else {
        // Fallback para localStorage se o serviço não estiver disponível
        const emails = JSON.parse(localStorage.getItem('emails_enviados')) || [];
        emails.push(email);
        localStorage.setItem('emails_enviados', JSON.stringify(emails));
      }
    } catch (error) {
      console.error('Erro ao registrar e-mail:', error);
      // Fallback para localStorage em caso de erro
      const emails = JSON.parse(localStorage.getItem('emails_enviados')) || [];
      emails.push(email);
      localStorage.setItem('emails_enviados', JSON.stringify(emails));
    }
  }
}

// Exportar o serviço para uso global
window.notificacaoService = new NotificacaoService();
