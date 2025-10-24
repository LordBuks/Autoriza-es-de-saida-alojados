/**
 * Script para a página de aprovação de saída pelos pais/responsáveis
 * Corrigido e compatível com o firebaseService.ts
 */

document.addEventListener("DOMContentLoaded", function () {
  const loadingContainer = document.getElementById("loading");
  const errorContainer = document.getElementById("error-container");
  const errorMessage = document.getElementById("error-message");
  const mainContent = document.getElementById("main-content");
  const successContainer = document.getElementById("success-container");
  const successMessage = document.getElementById("success-message");

  const btnAprovar = document.getElementById("btn-aprovar");
  const btnReprovar = document.getElementById("btn-reprovar");
  const observacaoInput = document.getElementById("observacao");

  let solicitacaoId: string | null = null;
  let tokenValidacao: string | null = null;
  let solicitacaoData: any = null;

  inicializarPagina();

  async function inicializarPagina() {
    try {
      console.log("Inicializando página de aprovação...");

      const urlParams = new URLSearchParams(window.location.search);
      solicitacaoId = urlParams.get("id");
      tokenValidacao = urlParams.get("token");

      console.log("Parâmetros da URL:", { solicitacaoId, tokenValidacao });

      atualizarTimestamp();

      if (!solicitacaoId || !tokenValidacao) {
        if (window.carregarDadosMockup) {
          window.carregarDadosMockup();
          configurarEventListeners();
          return;
        } else {
          throw new Error("Link inválido. Parâmetros de identificação ausentes.");
        }
      }

      await aguardarFirebase();
      await registrarAcessoPagina();
      await carregarDadosSolicitacao();
      configurarEventListeners();

    } catch (error: any) {
      console.error("Erro ao inicializar página:", error);
      if (window.carregarDadosMockup && (!solicitacaoId || !tokenValidacao)) {
        window.carregarDadosMockup();
        configurarEventListeners();
      } else {
        mostrarErro(error.message || "Ocorreu um erro ao carregar a página.");
      }
    }
  }

  async function aguardarFirebase() {
    return new Promise<void>((resolve, reject) => {
      let tentativas = 0;
      const maxTentativas = 10;

      const verificar = () => {
        tentativas++;
        if (window.firebaseService && window.firebaseService.db) {
          console.log("Firebase disponível");
          resolve();
        } else if (tentativas >= maxTentativas) {
          reject(new Error("Firebase não disponível após várias tentativas."));
        } else {
          setTimeout(verificar, 500);
        }
      };
      verificar();
    });
  }

  function atualizarTimestamp() {
    const el = document.getElementById("current-timestamp");
    if (!el) return;
    const agora = new Date();
    const opcoes: Intl.DateTimeFormatOptions = {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    };
    el.textContent = agora
      .toLocaleDateString("pt-BR", opcoes)
      .replace(",", " às");
    setTimeout(atualizarTimestamp, 60000);
  }

  async function registrarAcessoPagina() {
    try {
      if (window.auditoriaService) {
        await window.auditoriaService.registrarAcessoPais(
          solicitacaoId,
          tokenValidacao
        );
      }
    } catch (error) {
      console.warn("Erro ao registrar acesso na auditoria:", error);
    }
  }

  async function carregarDadosSolicitacao() {
    try {
      if (!window.firebaseService)
        throw new Error("Serviço Firebase não disponível");

      const resultado = await window.firebaseService.obterDocumento(
        "solicitacoes",
        solicitacaoId
      );
      if (!resultado.sucesso || !resultado.dados)
        throw new Error("Solicitação não encontrada ou já expirada.");

      solicitacaoData = resultado.dados;

      if (solicitacaoData.token_aprovacao_pais !== tokenValidacao) {
        throw new Error("Link inválido ou expirado.");
      }

      if (
        solicitacaoData.status_pais === "Aprovado" ||
        solicitacaoData.status_pais === "Reprovado"
      ) {
        throw new Error(
          `Esta solicitação já foi ${solicitacaoData.status_pais.toLowerCase()} anteriormente.`
        );
      }

      preencherDadosSolicitacao(solicitacaoData);
      loadingContainer?.classList.add("hidden");
      mainContent?.classList.remove("hidden");
    } catch (error: any) {
      console.error("Erro ao carregar dados da solicitação:", error);
      mostrarErro(error.message || "Erro ao carregar dados.");
    }
  }

  function preencherDadosSolicitacao(dados: any) {
    try {
      document.getElementById("solicitacao-id")!.textContent =
        dados.id || "N/A";
      document.getElementById("data-geracao")!.textContent =
        formatarDataHora(dados.data_envio_link_pais) || "N/A";
      document.getElementById("nome-responsavel")!.textContent =
        dados.nome_responsavel || "Responsável";
      document.getElementById("saudacao-responsavel")!.textContent =
        dados.nome_responsavel || "Responsável";
      document.getElementById("nome-atleta-mensagem")!.textContent =
        dados.nome || "o atleta";
      document.getElementById("nome-atleta")!.textContent =
        dados.nome || "N/A";
      document.getElementById("categoria-atleta")!.textContent =
        dados.categoria || "N/A";
      document.getElementById("telefone-atleta")!.textContent =
        dados.telefone || "N/A";
      document.getElementById("data-hora-saida")!.textContent =
        formatarDataHora(dados.data_saida, dados.horario_saida);
      document.getElementById("data-hora-retorno")!.textContent =
        formatarDataHora(dados.data_retorno, dados.horario_retorno);
      document.getElementById("motivo-destino")!.textContent =
        dados.motivo_destino || "N/A";
    } catch (error) {
      console.error("Erro ao preencher dados:", error);
    }
  }

  function configurarEventListeners() {
    btnAprovar?.addEventListener("click", () => registrarDecisao("Aprovado"));
    btnReprovar?.addEventListener("click", () => registrarDecisao("Reprovado"));
  }

  async function registrarDecisao(decisao: string) {
    try {
      btnAprovar!.disabled = true;
      btnReprovar!.disabled = true;
      const observacao = observacaoInput.value.trim();

      if (!window.firebaseService)
        throw new Error("Serviço Firebase não disponível");

      const novoStatusGeral =
        decisao === "Aprovado"
          ? "pendente_servico_social"
          : "reprovado_pais";

      // 🔧 Correção principal: evitar objetos não suportados pelo Firestore
      const dadosAtualizacao = {
        status_pais: decisao,
        observacao_pais: observacao,
        data_decisao_pais: new Date().toISOString(), // ISO string, compatível com Firestore
        ip_decisao_pais: await obterIP(),
        user_agent_pais: navigator.userAgent,
        status_geral: novoStatusGeral,
      };

      const resultado = await window.firebaseService.atualizarDocumento(
        "solicitacoes",
        solicitacaoId,
        dadosAtualizacao
      );

      if (!resultado.sucesso)
        throw new Error(resultado.erro || "Erro ao salvar decisão.");

      if (window.auditoriaService) {
        await window.auditoriaService.registrarDecisaoPais(
          solicitacaoId,
          decisao,
          observacao
        );
      }

      mostrarSucesso(
        `Solicitação ${decisao.toLowerCase()} com sucesso! Obrigado por utilizar o Sistema de Autorizações Digitais.`
      );
    } catch (error: any) {
      console.error("Erro ao registrar decisão:", error);
      btnAprovar!.disabled = false;
      btnReprovar!.disabled = false;
      mostrarErro(error.message || "Erro ao registrar decisão.");
    }
  }

  async function obterIP(): Promise<string> {
    try {
      const response = await fetch("https://api.ipify.org?format=json");
      const data = await response.json();
      return data.ip;
    } catch (error) {
      console.warn("Não foi possível obter IP:", error);
      return "unknown";
    }
  }

  function mostrarErro(mensagem: string) {
    loadingContainer?.classList.add("hidden");
    mainContent?.classList.add("hidden");
    successContainer?.classList.add("hidden");
    if (errorMessage) errorMessage.textContent = mensagem;
    errorContainer?.classList.remove("hidden");
  }

  function mostrarSucesso(mensagem: string) {
    loadingContainer?.classList.add("hidden");
    mainContent?.classList.add("hidden");
    errorContainer?.classList.add("hidden");
    if (successMessage) successMessage.textContent = mensagem;
    successContainer?.classList.remove("hidden");
  }

  function formatarDataHora(data: any, hora: string | null = null) {
    if (!data) return "N/A";
    try {
      const dataObj = data instanceof Date ? data : new Date(data);
      let resultado = dataObj.toLocaleDateString("pt-BR");
      resultado +=
        " às " +
        (hora ||
          dataObj.toLocaleTimeString("pt-BR", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
          }));
      return resultado;
    } catch {
      return "N/A";
    }
  }

  console.log("Script de aprovação carregado com Firebase corrigido.");
});
