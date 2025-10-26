/**
 * Controlador de Solicitações - Sistema de Autorizações Digitais
 * 
 * Este módulo unifica as funcionalidades de solicitação (integrado e não integrado)
 * utilizando o padrão Module e o serviço centralizado de autorizações.
 */

const SolicitacaoController = (function() {
  // Elementos da interface
  let autorizacaoForm;
  let alertMessage;
  
  // Inicialização do controlador
  function inicializar() {
    // Capturar elementos do DOM
    autorizacaoForm = document.getElementById("autorizacao-form");
    alertMessage = document.getElementById("alert-message");
    
    // Verificar se estamos na página correta
    if (!autorizacaoForm) return;
    
    // Configurar eventos
    autorizacaoForm.addEventListener("submit", handleSubmit);
  }
  
  // Função para mostrar alertas
  function mostrarAlerta(mensagem, tipo) {
    if (!alertMessage) return;
    
    alertMessage.textContent = mensagem;
    alertMessage.className = `alert ${tipo}`;
    alertMessage.style.display = "block";
    
    // Esconder a mensagem após 8 segundos (aumentei um pouco)
    setTimeout(function() {
      alertMessage.style.display = "none";
    }, 8000);
  }
  
  // Manipulador de envio do formulário (CORRIGIDO: adicionado 'async')
  async function handleSubmit(e) {
    e.preventDefault();
    
    // Coletar dados do formulário
    const formData = {
      nome: document.getElementById("nome").value,
      email: document.getElementById("email").value,
      data_nascimento: document.getElementById("data_nascimento").value,
      telefone: document.getElementById("telefone").value,
      categoria: document.getElementById("categoria").value,
      data_saida: document.getElementById("data_saida").value,
      horario_saida: document.getElementById("horario_saida").value,
      data_retorno: document.getElementById("data_retorno").value,
      horario_retorno: document.getElementById("horario_retorno").value,
      motivo_destino: document.getElementById("motivo_destino").value,
      nome_responsavel: document.getElementById("nome_responsavel").value,
      telefone_responsavel: document.getElementById("telefone_responsavel").value,
      // Novos campos de status
      status_geral: 'pendente_pais',
      status_pais: 'pendente',
      status_servico_social: 'pendente',
      status_monitor: 'pendente'
    };

    let resultado; // Declarar resultado fora do try para o escopo do catch (embora não usado no catch corrigido)
    try {
      // Usar o serviço de autorização para criar a solicitação (CORRIGIDO: await agora funciona)
      resultado = await window.AutorizacaoService.criarSolicitacao(formData);
      
      if (resultado.sucesso && resultado.solicitacao && resultado.solicitacao.id) {
        // Mostrar mensagem de sucesso com o código
        mostrarAlerta(`Solicitação enviada com sucesso! Seu código de acompanhamento é: ${resultado.solicitacao.id}. Você receberá atualizações sobre o status por e-mail.`, "alert-success");
        
        // Limpar o formulário
        autorizacaoForm.reset();
        
        // Não redirecionar mais, o acompanhamento é por email
        // setTimeout(function() {
        //   window.location.href = 'consultar.html?id=' + resultado.solicitacao.id;
        // }, 3000);
      } else {
        // Mostrar mensagem de erro vinda do serviço
        mostrarAlerta(resultado.mensagem || "Ocorreu um erro ao enviar a solicitação.", "alert-danger");
      }
    } catch (error) {
      // Capturar erros da chamada await ou outros erros inesperados
      console.error("Erro ao processar envio do formulário:", error);
      // Mostrar mensagem de erro genérica (CORRIGIDO: usa error.message)
      mostrarAlerta(`Ocorreu um erro ao processar sua solicitação: ${error.message}. Por favor, tente novamente mais tarde.`, "alert-danger");
    }
  }

  // Inicializar o controlador quando o DOM estiver pronto
  document.addEventListener("DOMContentLoaded", function() {
    SolicitacaoController.inicializar();
  });

  // Retornar o objeto do controlador para uso externo (CORRIGIDO: dentro do IIFE)
  return {
    inicializar: inicializar
  };
})(); // Fim do IIFE

