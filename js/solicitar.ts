// Lógica para a tela de solicitação de autorização
document.addEventListener('DOMContentLoaded', function() {
  const autorizacaoForm = document.getElementById('autorizacao-form');
  const alertMessage = document.getElementById('alert-message');
  
  // Função para validar o formulário
  function validarFormulario() {
    const dataSaidaStr = document.getElementById('data_saida').value;
    const horaSaidaStr = document.getElementById('horario_saida').value;
    const dataRetornoStr = document.getElementById('data_retorno').value;
    const horaRetornoStr = document.getElementById('horario_retorno').value;

    // Combinar data e hora para criar objetos Date completos
    const dataSaida = new Date(`${dataSaidaStr}T${horaSaidaStr}`);
    const dataRetorno = new Date(`${dataRetornoStr}T${horaRetornoStr}`);
    const agora = new Date();

    // Ajustar 'agora' para não considerar segundos e milissegundos na comparação de tempo
    agora.setSeconds(0, 0);

    // Verificar se a data e hora de saída são futuras
    if (dataSaida < agora) {
      mostrarAlerta('A data e hora de saída devem ser futuras.', 'alert-danger');
      return false;
    }

    // Verificar se a data e hora de retorno são posteriores à data e hora de saída
    if (dataRetorno <= dataSaida) {
      mostrarAlerta('A data e hora de retorno devem ser posteriores à data e hora de saída.', 'alert-danger');
      return false;
    }

    return true;
  }
  
  // Função para mostrar alertas
  function mostrarAlerta(mensagem, tipo) {
    alertMessage.textContent = mensagem;
    alertMessage.className = `alert ${tipo}`;
    alertMessage.style.display = 'block';
    
    // Esconder a mensagem após 5 segundos
    setTimeout(function() {
      alertMessage.style.display = 'none';
    }, 5000);
  }

  // Função para mostrar mensagem de confirmação do Departamento de Serviço Social
  function mostrarMensagemConfirmacao(numeroAutorizacao) {
    // Criar o modal de confirmação
    const modalHtml = `
      <div id="modal-confirmacao" class="modal-overlay">
        <div class="modal-content">
          <div class="modal-header">
            <h3 class="modal-title">Departamento de Serviço Social</h3>
          </div>
          <div class="modal-body">
            <div class="confirmacao-icon">
              <svg width="60" height="60" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="12" r="10" fill="#28a745"/>
                <path d="m9 12 2 2 4-4" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </div>
            <p class="confirmacao-texto">
              Seu pedido de autorização foi enviado com sucesso, anote o número do código para consultar o status de aprovações.
            </p>
            <div class="codigo-autorizacao">
              <strong>${numeroAutorizacao}</strong>
            </div>
          </div>
          <div class="modal-footer">
            <button id="btn-copiar-codigo" class="btn btn-secondary">Copiar Código</button>
            <button id="btn-fechar-modal" class="btn btn-primary">Entendi</button>
          </div>
        </div>
      </div>
    `;

    // Adicionar o modal ao body
    document.body.insertAdjacentHTML('beforeend', modalHtml);

    // Adicionar event listeners
    document.getElementById('btn-fechar-modal').addEventListener('click', function() {
      document.getElementById('modal-confirmacao').remove();
      // Redirecionar após fechar o modal
      setTimeout(function() {
        window.location.href = 'consultar.html?id=' + numeroAutorizacao;
      }, 500);
    });

    document.getElementById('btn-copiar-codigo').addEventListener('click', function() {
      navigator.clipboard.writeText(numeroAutorizacao).then(function() {
        const btnCopiar = document.getElementById('btn-copiar-codigo');
        const textoOriginal = btnCopiar.textContent;
        btnCopiar.textContent = 'Copiado!';
        btnCopiar.style.backgroundColor = '#28a745';
        setTimeout(function() {
          btnCopiar.textContent = textoOriginal;
          btnCopiar.style.backgroundColor = '';
        }, 2000);
      });
    });

    // Fechar modal ao clicar fora dele
    document.getElementById('modal-confirmacao').addEventListener('click', function(e) {
      if (e.target === this) {
        this.remove();
        setTimeout(function() {
          window.location.href = 'consultar.html?id=' + numeroAutorizacao;
        }, 500);
      }
    });
  }
  
  // Função para gerar um ID único
  function gerarId() {
    // Usar o próprio Firestore para gerar ID pode ser uma opção, mas manteremos o formato original por enquanto
    return 'AUTH-' + Math.random().toString(36).substr(2, 9).toUpperCase();
  }
  
  // Manipulador de envio do formulário (agora assíncrono para esperar o Firebase)
  autorizacaoForm.addEventListener('submit', async function(e) { // Adicionado async
    e.preventDefault();
    
    // Validar o formulário
    if (!validarFormulario()) {
      return;
    }
    
    // Obter informações do dispositivo da sessão atual
    const session = JSON.parse(localStorage.getItem('current_session')) || {};
    const deviceInfo = session.deviceInfo || capturarInfoDispositivo();
    
    // Função para capturar informações do dispositivo caso não esteja na sessão
    function capturarInfoDispositivo() {
      return {
        userAgent: navigator.userAgent,
        platform: navigator.platform,
        screenWidth: window.screen.width,
        screenHeight: window.screen.height,
        language: navigator.language,
        timestamp: new Date().toISOString(),
        referrer: document.referrer,
        colorDepth: window.screen.colorDepth,
        pixelRatio: window.devicePixelRatio || 1
      };
    }
    
    // Coletar dados do formulário
    const formData = {
      // Não incluímos o ID aqui, pois vamos usar o ID gerado como nome do documento
      nome: document.getElementById('nome').value,
      email: document.getElementById('email').value,
      data_nascimento: document.getElementById('data_nascimento').value,
      telefone: document.getElementById('telefone').value,
      categoria: document.getElementById('categoria').value,
      data_saida: document.getElementById('data_saida').value,
      horario_saida: document.getElementById('horario_saida').value,
      data_retorno: document.getElementById('data_retorno').value,
      horario_retorno: document.getElementById('horario_retorno').value,
      motivo_destino: document.getElementById('motivo_destino').value,
      nome_responsavel: document.getElementById('nome_responsavel').value,
      telefone_responsavel: document.getElementById('telefone_responsavel').value,
      data_solicitacao: new Date().toISOString(),
      status_supervisor: 'Pendente',
      status_servico_social: 'Pendente',
      status_monitor: 'Pendente', // Adicionando status monitor como pendente por padrão
      status_final: 'Em Análise',
      dispositivo: deviceInfo // Adicionar informações do dispositivo à solicitação
    };

    const solicitacaoId = gerarId(); // Gerar o ID da solicitação

    // Verificar se o serviço Firebase está disponível
    if (!window.firebaseService) {
        mostrarAlerta('Erro: Serviço de banco de dados não inicializado.', 'alert-danger');
        return;
    }

    try {
        // Salvar no Firestore usando o ID gerado como nome do documento
        const resultadoSalvar = await window.firebaseService.salvarDocumento('solicitacoes', formData, solicitacaoId);

        if (!resultadoSalvar.sucesso) {
            console.error('Erro ao salvar no Firestore:', resultadoSalvar.erro);
            mostrarAlerta(`Erro ao enviar solicitação: ${resultadoSalvar.erro}`, 'alert-danger');
            return;
        }

        // --- Código de Auditoria e Notificação (mantido como estava, mas pode precisar de ajustes) ---
        // Registrar evento de auditoria
        if (window.auditoriaService) {
          window.auditoriaService.registrarSubmissaoAtleta(
            solicitacaoId, // Usar o ID gerado
            {
              nome: formData.nome,
              email: formData.email,
              categoria: formData.categoria,
              telefone: formData.telefone
            },
            deviceInfo
          ).then(resultado => {
            console.log('Evento de auditoria registrado:', resultado);
          }).catch(erro => {
            console.error('Erro ao registrar evento de auditoria:', erro);
          });
        } else {
          console.warn('Serviço de auditoria não disponível');
        }
        
        // Simular envio de notificação ao supervisor (manter ou integrar com Firebase Functions/Cloud Messaging)
        enviarNotificacaoSupervisor({...formData, id: solicitacaoId}); // Passar o ID gerado
        // ----------------------------------------------------------------------------------------

        // Limpar o formulário
        autorizacaoForm.reset();
        
        // Mostrar a nova mensagem de confirmação do Departamento de Serviço Social
        mostrarMensagemConfirmacao(solicitacaoId);

    } catch (error) {
        console.error('Erro inesperado ao processar a solicitação:', error);
        mostrarAlerta('Ocorreu um erro inesperado. Tente novamente mais tarde.', 'alert-danger');
    }
  });
  
  // Função para simular o envio de notificação ao supervisor (manter ou refatorar para Firebase)
  function enviarNotificacaoSupervisor(dados) {
    console.log('Simulando notificação para supervisor da categoria ' + dados.categoria);
    console.log('Dados da notificação:', dados);
    
    // A lógica de salvar notificação no localStorage pode ser mantida para fins de log local
    // ou substituída por uma chamada ao Firestore/Cloud Functions
    let notificacoes = JSON.parse(localStorage.getItem('notificacoes')) || [];
    notificacoes.push({
      tipo: 'supervisor',
      categoria: dados.categoria,
      id_solicitacao: dados.id, // Usar o ID correto
      nome_atleta: dados.nome,
      data_envio: new Date().toISOString(),
      mensagem: `Nova solicitação de autorização de saída. Atleta: ${dados.nome}, Categoria: ${dados.categoria}`
    });
    localStorage.setItem('notificacoes', JSON.stringify(notificacoes));
  }
});

