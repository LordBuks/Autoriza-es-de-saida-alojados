// Lógica para a tela de consulta de solicitações (versão simplificada - apenas consulta por ID)
document.addEventListener("DOMContentLoaded", function() {
  const btnConsultar = document.getElementById("btn-consultar");
  const codigoInput = document.getElementById("codigo");
  const resultadoConsulta = document.getElementById("resultado-consulta");
  const alertContainerConsulta = document.getElementById("alert-container-consulta");
  const loadingIndicatorConsulta = document.getElementById("loading-indicator-consulta");

  // Verificar se o serviço Firebase está disponível
  if (!window.firebaseService) {
    mostrarAlerta(alertContainerConsulta, "Serviço de dados indisponível. Tente novamente mais tarde.", "alert-danger");
    // Não precisamos mais verificar os containers de recentes
    return;
  }

  // Função para mostrar alertas
  function mostrarAlerta(container, mensagem, tipo) {
    // Adiciona verificação se o container existe antes de tentar usá-lo
    if (!container) return;
    container.innerHTML = `<div class="alert ${tipo}">${mensagem}</div>`;
    container.style.display = "block";

    // Esconder a mensagem após 5 segundos
    setTimeout(function() {
      container.style.display = "none";
    }, 5000);
  }

  // Função para formatar data
  function formatarData(dataString) {
    if (!dataString) return "";

    const data = new Date(dataString);
    // Adiciona verificação se a data é válida
    if (isNaN(data.getTime())) {
        return "Data inválida";
    }
    return data.toLocaleDateString("pt-BR");
  }

  // Função para obter o status com classe CSS
  function getStatusHTML(status) {
    let classe = "";

    switch (status) {
      case "Aprovado":
        classe = "status-aprovado";
        break;
      case "Reprovado":
      case "Não Aprovado":
        classe = "status-reprovado";
        break;
      case "Pendente":
        classe = "status-pendente";
        break;
      case "Em Análise":
        classe = "status-em-analise";
        break;
      default:
        classe = "status-pendente"; // Default para pendente
    }

    return `<span class="status ${classe}">${status || "Pendente"}</span>`; // Adiciona fallback para status indefinido
  }

  // Verificar se há um ID na URL (redirecionamento após envio)
  const urlParams = new URLSearchParams(window.location.search);
  const idFromUrl = urlParams.get("id");

  if (idFromUrl) {
    codigoInput.value = idFromUrl;
    consultarSolicitacao(idFromUrl);
  }

  // REMOVIDO: Chamada para carregarSolicitacoesRecentes();

  // Manipulador de clique no botão consultar
  btnConsultar.addEventListener("click", function() {
    const codigo = codigoInput.value.trim();

    if (!codigo) {
      mostrarAlerta(alertContainerConsulta, "Por favor, digite o código da solicitação.", "alert-warning");
      return;
    }

    consultarSolicitacao(codigo);
  });

  // Função para consultar uma solicitação específica
  async function consultarSolicitacao(codigo) {
    // Mostrar indicador de carregamento
    if (loadingIndicatorConsulta) loadingIndicatorConsulta.style.display = "block";
    if (resultadoConsulta) resultadoConsulta.style.display = "none";

    try {
      // Buscar solicitação no Firestore
      const resultado = await window.firebaseService.obterDocumento("solicitacoes", codigo);

      // Esconder indicador de carregamento
      if (loadingIndicatorConsulta) loadingIndicatorConsulta.style.display = "none";

      if (!resultado.sucesso) {
        mostrarAlerta(alertContainerConsulta, "Solicitação não encontrada. Verifique o código e tente novamente.", "alert-danger");
        return;
      }

      const solicitacao = resultado.dados;

      // Exibir detalhes da solicitação
      if (resultadoConsulta) {
          resultadoConsulta.innerHTML = `
            <div class="solicitacao-detalhes">
              <h4>Detalhes da Solicitação</h4>
              <p><strong>Código:</strong> ${solicitacao.id || "N/A"}</p>
              <p><strong>Nome:</strong> ${solicitacao.nome || "N/A"}</p>
              <p><strong>Categoria:</strong> ${solicitacao.categoria || "N/A"}</p>
              <p><strong>Data de Saída:</strong> ${formatarData(solicitacao.data_saida)} às ${solicitacao.horario_saida || "N/A"}</p>
              <p><strong>Data de Retorno:</strong> ${formatarData(solicitacao.data_retorno)} às ${solicitacao.horario_retorno || "N/A"}</p>
              <p><strong>Motivo/Destino:</strong> ${solicitacao.motivo_destino || "N/A"}</p>
              <p><strong>Data da Solicitação:</strong> ${formatarData(solicitacao.data_solicitacao)}</p>
              <p><strong>Status Supervisor:</strong> ${getStatusHTML(solicitacao.status_supervisor)}</p>
              <p><strong>Status Serviço Social:</strong> ${getStatusHTML(solicitacao.status_servico_social)}</p>
              <p><strong>Status Monitor:</strong> ${getStatusHTML(solicitacao.status_monitor)}</p> <!-- Adicionado Status Monitor -->
              <p><strong>Status Final:</strong> ${getStatusHTML(solicitacao.status_final)}</p>
            </div>
          `;
          resultadoConsulta.style.display = "block";
      }

    } catch (error) {
      console.error("Erro ao consultar solicitação:", error);
      if (loadingIndicatorConsulta) loadingIndicatorConsulta.style.display = "none";
      mostrarAlerta(alertContainerConsulta, "Erro ao consultar solicitação. Tente novamente mais tarde.", "alert-danger");
    }
  }

  // REMOVIDA: Função carregarSolicitacoesRecentes()
});
