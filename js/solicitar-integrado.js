// Integração com serviço de notificações
document.addEventListener('DOMContentLoaded', function() {
  // Verificar se o script de notificação foi carregado
  if (!window.notificacaoService) {
    console.error('Serviço de notificação não encontrado!');
    return;
  }

  // Verificar se o serviço do Firebase foi carregado
  if (!window.firebaseService) {
    console.error('Serviço Firebase não encontrado!');
    mostrarAlerta('Erro crítico: A conexão com o banco de dados não está disponível. Contate o suporte.', 'alert-danger');
    return;
  }
  
  // Sobrescrever a função de envio de notificação no script de solicitação
  const autorizacaoForm = document.getElementById('autorizacao-form');
  
  if (autorizacaoForm) {
    autorizacaoForm.addEventListener('submit', function(e) {
      e.preventDefault();
      
      // Validar o formulário (reaproveitando a lógica existente)
      if (!validarFormulario()) {
        return;
      }
      
      // Coletar dados do formulário
      const formData = {
        id: gerarId(), // Gerar ID único para a solicitação
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
        status_monitor: 'Pendente', // Adicionado status do monitor se necessário
        status_final: 'Em Análise'
      };
      
      // Remover bloco de código do localStorage:
      // let solicitacoes = JSON.parse(localStorage.getItem('solicitacoes')) || [];
      // solicitacoes.push(formData);
      // localStorage.setItem('solicitacoes', JSON.stringify(solicitacoes));

      // Obter o UID do atleta logado
      const currentUser = firebase.auth().currentUser;
      
      if (currentUser) {
        // Adiciona o UID do atleta logado aos dados que serão salvos
        formData.atletaUid = currentUser.uid;
        console.log("UID do atleta adicionado aos dados:", currentUser.uid);
      } else {
        // Se não houver usuário logado, mostra um erro e impede o envio
        console.error("Erro crítico: Tentativa de envio de formulário sem usuário autenticado.");
        mostrarAlerta('Erro de autenticação. Você não está logado. Por favor, faça login novamente antes de enviar a solicitação.', 'alert-danger');
        return; // Interrompe a execução da função de envio
      }
      
      // Salvar no Firebase Firestore usando o serviço
      window.firebaseService.salvarDocumento('solicitacoes', formData.id, formData)
        .then(() => {
          console.log("Solicitação salva no Firestore com sucesso com ID:", formData.id);

          // Enviar notificação ao supervisor usando o serviço de notificações
          // (Manter esta lógica se ainda for necessária)
          window.notificacaoService.enviarNotificacaoSupervisor(formData);
          
          // Mostrar mensagem de sucesso
          mostrarAlerta('Solicitação enviada com sucesso! Seu código de acompanhamento é: ' + formData.id, 'alert-success');
          
          // Limpar o formulário
          autorizacaoForm.reset();
          
          // Redirecionar após 3 segundos para a página de consulta com o ID
          setTimeout(function() {
            window.location.href = 'consultar.html?id=' + formData.id;
          }, 3000);
        })
        .catch((error) => {
          console.error("Erro ao salvar solicitação no Firestore:", error);
          mostrarAlerta('Erro ao enviar solicitação. Verifique sua conexão ou tente novamente mais tarde.', 'alert-danger');
        });
    });
  }
  
  // Funções auxiliares (reaproveitadas do script original)
  function validarFormulario() {
    // Adicionar validações mais robustas se necessário
    const dataSaidaInput = document.getElementById('data_saida');
    const dataRetornoInput = document.getElementById('data_retorno');
    const horarioSaidaInput = document.getElementById('horario_saida');
    const horarioRetornoInput = document.getElementById('horario_retorno');

    // Validar campos obrigatórios básicos
    const camposObrigatorios = ['nome', 'email', 'data_nascimento', 'telefone', 'categoria', 'data_saida', 'horario_saida', 'data_retorno', 'horario_retorno', 'motivo_destino', 'nome_responsavel', 'telefone_responsavel'];
    for (const campoId of camposObrigatorios) {
        const campo = document.getElementById(campoId);
        if (!campo || !campo.value) {
            mostrarAlerta(`O campo ${campo?.name || campoId} é obrigatório.`, 'alert-danger');
            return false;
        }
    }

    // Validar datas e horários
    const dataSaida = new Date(`${dataSaidaInput.value}T${horarioSaidaInput.value}`);
    const dataRetorno = new Date(`${dataRetornoInput.value}T${horarioRetornoInput.value}`);
    const agora = new Date();

    // Tentar criar datas válidas
    if (isNaN(dataSaida.getTime())) {
        mostrarAlerta('Data ou hora de saída inválida.', 'alert-danger');
        return false;
    }
    if (isNaN(dataRetorno.getTime())) {
        mostrarAlerta('Data ou hora de retorno inválida.', 'alert-danger');
        return false;
    }
    
    // Verificar se a data/hora de saída é futura (com uma pequena margem para evitar problemas de milissegundos)
    if (dataSaida < new Date(agora.getTime() - 60000)) { // Permite saídas no minuto atual
      mostrarAlerta('A data e hora de saída devem ser futuras.', 'alert-danger');
      return false;
    }
    
    // Verificar se a data/hora de retorno é posterior à data/hora de saída
    if (dataRetorno <= dataSaida) {
      mostrarAlerta('A data e hora de retorno devem ser posteriores à data e hora de saída.', 'alert-danger');
      return false;
    }
    
    return true;
  }
  
  function mostrarAlerta(mensagem, tipo) {
    const alertContainer = document.getElementById('alert-container'); // Usar um container dedicado para alertas
    if (!alertContainer) {
        console.error("Elemento 'alert-container' não encontrado no DOM.");
        alert(mensagem); // Fallback para alert padrão
        return;
    }

    const alertElement = document.createElement('div');
    alertElement.className = `alert ${tipo} alert-dismissible fade show`;
    alertElement.role = 'alert';
    alertElement.innerHTML = `
        ${mensagem}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    `;

    // Limpar alertas anteriores antes de adicionar um novo
    alertContainer.innerHTML = ''; 
    alertContainer.appendChild(alertElement);
    alertContainer.style.display = 'block';

    // Remover o alerta após 5 segundos (opcional, o botão de fechar já existe)
    // setTimeout(() => {
    //     const alertInstance = bootstrap.Alert.getOrCreateInstance(alertElement);
    //     if (alertInstance) {
    //         alertInstance.close();
    //     }
    // }, 5000);
  }
  
  function gerarId() {
    // Gerador de ID mais robusto (exemplo)
    const timestamp = Date.now().toString(36);
    const randomPart = Math.random().toString(36).substring(2, 8);
    return `AUTH-${timestamp}-${randomPart}`.toUpperCase();
  }
});
