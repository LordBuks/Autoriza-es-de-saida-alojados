// Lógica para a tela de detalhe do monitor - VERSÃO CORRIGIDA
document.addEventListener('DOMContentLoaded', function() {
  // Elementos da página
  const btnEnviarWhatsapp = document.getElementById('btn-enviar-whatsapp');
  const btnValidar = document.getElementById('btn-validar');
  const btnReprovar = document.getElementById('btn-reprovar');
  const mensagemWhatsapp = document.getElementById('mensagem-whatsapp');
  const textoWhatsapp = document.getElementById('texto-whatsapp');
  const btnCopiar = document.getElementById('btn-copiar');
  const btnAbrirWhatsapp = document.getElementById('btn-abrir-whatsapp');
  const btnFecharMensagem = document.getElementById('btn-fechar-mensagem');
  
  // Variáveis de controle
  let solicitacaoAtual = null;
  const DPO_EMAIL = 'dpo@internacional.com.br';
  
  // Obter ID da solicitação da URL
  const urlParams = new URLSearchParams(window.location.search);
  const idSolicitacao = urlParams.get('id');
  
  if (!idSolicitacao) {
    alert('ID da solicitação não fornecido. Redirecionando para o painel.');
    window.location.href = 'dashboard.html';
    return;
  }
  
  // Aguardar autenticação antes de carregar dados
  aguardarAutenticacaoECarregar();
  
  // Função para aguardar autenticação
  async function aguardarAutenticacaoECarregar() {
    try {
      await aguardarAutenticacao();
      await carregarSolicitacao(idSolicitacao);
    } catch (error) {
      console.error("Erro na inicialização:", error);
      alert('Erro ao carregar dados. Redirecionando para o painel.');
      window.location.href = 'dashboard.html';
    }
  }
  
  function aguardarAutenticacao() {
    return new Promise((resolve, reject) => {
      const verificarAuth = () => {
        const user = firebase.auth().currentUser;
        if (user) {
          console.log("Usuário autenticado:", user.email);
          resolve();
        } else {
          console.log("Aguardando autenticação...");
          setTimeout(verificarAuth, 500);
        }
      };
      
      if (firebase.auth().currentUser) {
        console.log("Usuário já autenticado:", firebase.auth().currentUser.email);
        resolve();
      } else {
        firebase.auth().onAuthStateChanged((user) => {
          if (user) {
            console.log("Estado de autenticação mudou - usuário logado:", user.email);
            resolve();
          }
        });
        
        setTimeout(verificarAuth, 1000);
        
        // Timeout de segurança
        setTimeout(() => {
          reject(new Error("Timeout na autenticação"));
        }, 10000);
      }
    });
  }
  
  // Eventos dos botões (verificar se existem antes de adicionar listeners)
  if (btnEnviarWhatsapp) {
    btnEnviarWhatsapp.addEventListener('click', function() {
      if (!solicitacaoAtual) {
        alert('Dados da solicitação não carregados.');
        return;
      }
      prepararMensagemWhatsapp();
      if (mensagemWhatsapp) {
        mensagemWhatsapp.style.display = 'block';
      }
    });
  }
  
  if (btnValidar) {
    btnValidar.addEventListener('click', function() {
      alert('Como monitor, você não pode validar diretamente. Esta ação é exclusiva do Serviço Social.');
    });
  }
  
  if (btnReprovar) {
    btnReprovar.addEventListener('click', function() {
      alert('Como monitor, você não pode reprovar diretamente. Esta ação é exclusiva do Serviço Social.');
    });
  }
  
  if (btnCopiar) {
    btnCopiar.addEventListener('click', function() {
      if (textoWhatsapp) {
        textoWhatsapp.select();
        document.execCommand('copy');
        alert('Mensagem copiada para a área de transferência!');
      }
    });
  }
  
  if (btnAbrirWhatsapp) {
    btnAbrirWhatsapp.addEventListener('click', function() {
      if (!solicitacaoAtual) return;
      
      const telefone = solicitacaoAtual.telefone_responsavel.replace(/\D/g, '');
      const mensagem = encodeURIComponent(textoWhatsapp.value);
      
      window.open(`https://wa.me/${telefone}?text=${mensagem}`, '_blank');
    });
  }
  
  if (btnFecharMensagem) {
    btnFecharMensagem.addEventListener('click', function() {
      if (mensagemWhatsapp) {
        mensagemWhatsapp.style.display = 'none';
      }
    });
  }
  
  // Função para carregar os dados da solicitação
  async function carregarSolicitacao(id) {
    if (!window.firebaseService) {
        console.error("FirebaseService não está disponível.");
        alert("Erro ao conectar com o banco de dados. Tente recarregar a página.");
        window.location.href = 'dashboard.html';
        return;
    }

    try {
        // Verificar autenticação antes da chamada
        const user = firebase.auth().currentUser;
        if (!user) {
            throw new Error("Usuário não autenticado. Faça login novamente.");
        }
        
        console.log("Buscando solicitação:", id, "para usuário:", user.email);
        const resultado = await window.firebaseService.obterDocumento('solicitacoes', id);

        if (resultado.sucesso && resultado.dados) {
            solicitacaoAtual = resultado.dados;
            preencherDadosPagina(solicitacaoAtual);
        } else {
            console.warn("Solicitação não encontrada no Firestore, tentando localStorage (fallback).");
            const solicitacoesStorage = JSON.parse(localStorage.getItem('solicitacoes')) || [];
            const solicitacaoStorage = solicitacoesStorage.find(s => s.id === id);

            if (solicitacaoStorage) {
                solicitacaoAtual = solicitacaoStorage;
                preencherDadosPagina(solicitacaoAtual);
            } else {
                console.error("Erro ao buscar solicitação:", resultado.erro || 'Não encontrado no Firestore ou localStorage');
                alert('Solicitação não encontrada. Redirecionando para o painel.');
                window.location.href = 'dashboard.html';
            }
        }
    } catch (error) {
        console.error("Erro crítico ao carregar solicitação:", error);
        
        if (error.message.includes("autenticado") || error.message.includes("permission")) {
            alert('Sessão expirada. Redirecionando para o login.');
            window.location.href = '../../index.html';
        } else {
            alert('Ocorreu um erro ao carregar os detalhes da solicitação. Redirecionando.');
            window.location.href = 'dashboard.html';
        }
    }
  }

  // Função separada para preencher os dados na página
  function preencherDadosPagina(solicitacao) {
    solicitacaoAtual = solicitacao;
    
    // Função auxiliar para definir texto de elemento
    function setElementText(id, value) {
      const element = document.getElementById(id);
      if (element) {
        element.textContent = value || 'N/A';
      }
    }
    
    // Preencher os dados na página
    setElementText('nome-atleta', solicitacao.nome);
    setElementText('categoria-atleta', solicitacao.categoria);
    setElementText('data-nascimento', solicitacao.data_nascimento ? formatarData(solicitacao.data_nascimento) : null);
    setElementText('telefone-atleta', solicitacao.telefone);
    
    setElementText('data-saida', solicitacao.data_saida ? formatarData(solicitacao.data_saida) : null);
    setElementText('horario-saida', solicitacao.horario_saida);
    setElementText('data-retorno', solicitacao.data_retorno ? formatarData(solicitacao.data_retorno) : null);
    setElementText('horario-retorno', solicitacao.horario_retorno);
    setElementText('motivo-destino', solicitacao.motivo_destino);
    
    setElementText('nome-responsavel', solicitacao.nome_responsavel);
    setElementText('telefone-responsavel', solicitacao.telefone_responsavel);
    
    // Status com badges
    const statusSupervisor = document.getElementById('status-supervisor');
    if (statusSupervisor) {
      statusSupervisor.textContent = solicitacao.status_supervisor || 'Pendente';
      statusSupervisor.className = getStatusBadgeClass(solicitacao.status_supervisor);
    }
    
    setElementText('data-aprovacao-supervisor', 
      solicitacao.data_aprovacao_supervisor ? 
      formatarData(solicitacao.data_aprovacao_supervisor) : null);
    
    const statusServicoSocial = document.getElementById('status-servico-social');
    if (statusServicoSocial) {
      statusServicoSocial.textContent = solicitacao.status_servico_social || 'Pendente';
      statusServicoSocial.className = getStatusBadgeClass(solicitacao.status_servico_social);
    }

    setElementText('data-aprovacao-servico-social', 
      solicitacao.data_aprovacao_servico_social ? 
      formatarData(solicitacao.data_aprovacao_servico_social) : null);
    
    const statusFinal = document.getElementById('status-final');
    if (statusFinal) {
      statusFinal.textContent = solicitacao.status_final || 'Em Análise';
      statusFinal.className = getStatusBadgeClass(solicitacao.status_final);
    }
    
    // Desabilitar botões de validação para o monitor (apenas visualização)
    if(btnValidar) btnValidar.disabled = true;
    if(btnReprovar) btnReprovar.disabled = true;
    
    // Habilitar botão de WhatsApp se existir
    if(btnEnviarWhatsapp) btnEnviarWhatsapp.style.display = 'inline-block';
  }

  // Função auxiliar para classes de badge
  function getStatusBadgeClass(status) {
      status = status ? status.toLowerCase() : 'pendente';
      if (status === 'aprovado' || status === 'autorizado') {
          return 'badge bg-success';
      } else if (status === 'reprovado' || status === 'não autorizado') {
          return 'badge bg-danger';
      } else {
          return 'badge bg-warning text-dark';
      }
  }
  
  // Função para preparar a mensagem de WhatsApp
  function prepararMensagemWhatsapp() {
    if (!solicitacaoAtual) return;
    
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
    
    // Construir a mensagem conforme o modelo fornecido pelo usuário
    const mensagem = `Prezado(a) ${solicitacaoAtual.nome_responsavel || 'Responsável'},

Informamos que o(a) atleta abaixo solicitou autorização de saída e retorno para o alojamento nos dias e horários descritos nesta autorização.

🙋🏽 Nome: ${solicitacaoAtual.nome}
⬆️ Saída: ${fmt(solicitacaoAtual.data_saida, "dd/MM/yyyy")} 
⏰ Hora: ${solicitacaoAtual.horario_saida}
⬇️ Retorno: ${fmt(solicitacaoAtual.data_retorno, "dd/MM/yyyy")}  
⏰ Hora: ${solicitacaoAtual.horario_retorno}
📍 Destino: ${solicitacaoAtual.motivo_destino}

Para autorizar, responda com a seguinte declaração:
Eu, ${solicitacaoAtual.nome_responsavel || '[seu nome]'}, autorizo o(a) atleta ${solicitacaoAtual.nome} a sair e retornar ao alojamento conforme informado nesta autorização.

Seus dados serão protegidos conforme nossa política de privacidade. 

Atenciosamente,
Serviço Social - Categoria de Base`;
    
    if (textoWhatsapp) {
      textoWhatsapp.value = mensagem;
    }
  }
  
  // Função para formatar data
  function formatarData(data) {
    try {
      const dataObj = typeof data === 'string' ? new Date(data) : data;
      return dataObj.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch (e) {
      return 'Data inválida';
    }
  }
});

