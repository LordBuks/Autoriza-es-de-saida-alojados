/**
 * Controlador do Dashboard do Supervisor - Sistema de Autorizações Digitais
 * 
 * Este módulo é responsável por carregar e exibir as solicitações
 * pendentes e o histórico no painel do supervisor, aplicando filtros.
 */

document.addEventListener("DOMContentLoaded", async function() {
    const solicitacoesPendentesContainer = document.getElementById("solicitacoes-pendentes");
    const historicoAprovacoesContainer = document.getElementById("historico-aprovacoes");
    const filtroStatusSelect = document.getElementById("filtro-status");
    const loadingPendentes = document.createElement("p");
    loadingPendentes.className = "text-center";
    loadingPendentes.textContent = "Carregando solicitações pendentes...";
    const loadingHistorico = document.createElement("p");
    loadingHistorico.className = "text-center";
    loadingHistorico.textContent = "Carregando histórico...";

    let supervisorCategoria = null; // Armazenará a categoria do supervisor logado
    let todasSolicitacoes = []; // Cache das solicitações buscadas

    // Verificar dependências
    if (!window.AutorizacaoService || !window.firebaseService) {
        console.error("Erro crítico: Serviços essenciais (AutorizacaoService ou FirebaseService) não estão disponíveis.");
        if (solicitacoesPendentesContainer) solicitacoesPendentesContainer.innerHTML = 
            '<p class="text-danger text-center">Erro ao carregar serviços. Tente recarregar a página.</p>';
        if (historicoAprovacoesContainer) historicoAprovacoesContainer.innerHTML = 
            '<p class="text-danger text-center">Erro ao carregar serviços.</p>';
        return;
    }

    // --- Funções Auxiliares ---

    function mostrarLoading(container, loadingElement) {
        if (container) container.innerHTML = ""; // Limpa antes de mostrar loading
        if (container) container.appendChild(loadingElement);
    }

    function mostrarErro(container, mensagem) {
        if (container) container.innerHTML = `<p class="text-danger text-center">${mensagem}</p>`;
    }

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

        return `<span class="status ${classe}">${status || "Pendente"}</span>`;
    }

    function renderizarSolicitacoes(container, solicitacoes, tipo) {
        if (!container) return;

        if (solicitacoes.length === 0) {
            const mensagemSemSolicitacoes = tipo === "pendentes" 
                ? "Nenhuma solicitação pendente encontrada."
                : "Nenhuma solicitação encontrada no histórico.";
            container.innerHTML = `<p class="text-center">${mensagemSemSolicitacoes}</p>`;
            return;
        }

        container.innerHTML = ""; // Limpar container

        solicitacoes.forEach(sol => {
            const card = document.createElement("div");
            card.className = "solicitacao-card";

            const statusSupervisor = sol.status_supervisor || "Pendente";
            const statusServicoSocial = sol.status_servico_social || "Pendente";
            const statusMonitor = sol.status_monitor || "Pendente";
            const statusFinal = sol.status_final || "Em Análise";

            card.innerHTML = `
                <div class="solicitacao-header">
                    <h3 class="solicitacao-nome">${sol.nome || "Nome não informado"} (${sol.categoria || "Cat. N/A"})</h3>
                    <span class="solicitacao-data">${window.AutorizacaoService.formatarData(sol.data_solicitacao) || "Data N/A"}</span>
                </div>
                <div class="solicitacao-info">
                    <p><strong>Motivo/Destino:</strong> ${sol.motivo_destino || "Não informado"}</p>
                    <p><strong>Data de Saída:</strong> ${window.AutorizacaoService.formatarData(sol.data_saida) || "N/A"} às ${sol.horario_saida || "N/A"}</p>
                    <p><strong>Data de Retorno:</strong> ${window.AutorizacaoService.formatarData(sol.data_retorno) || "N/A"} às ${sol.horario_retorno || "N/A"}</p>
                </div>
                <div class="solicitacao-status">
                    <span><strong>Status Supervisor:</strong> ${getStatusHTML(statusSupervisor)}</span>
                    ${tipo === "historico" ? `
                        <span><strong>Status S. Social:</strong> ${getStatusHTML(statusServicoSocial)}</span>
                        <span><strong>Status Monitor:</strong> ${getStatusHTML(statusMonitor)}</span>
                        <span><strong>Status Final:</strong> ${getStatusHTML(statusFinal)}</span>
                    ` : ""}
                </div>
                <div class="solicitacao-actions">
                    <a href="detalhe.html?id=${sol.id}" class="btn-detalhes">Ver Detalhes</a>
                </div>
            `;
            container.appendChild(card);
        });
    }

    async function carregarDadosDashboard() {
        mostrarLoading(solicitacoesPendentesContainer, loadingPendentes);
        mostrarLoading(historicoAprovacoesContainer, loadingHistorico);

        try {
            // 1. Obter UID do supervisor da sessão
            const sessionData = JSON.parse(localStorage.getItem("current_session"));
            if (!sessionData || !sessionData.uid || sessionData.profile !== "supervisor") {
                throw new Error("Sessão de supervisor inválida ou não encontrada.");
            }
            const supervisorUid = sessionData.uid;

            // 2. Buscar dados do supervisor (tentar obter categoria)
            let filtros = {}; // Inicia sem filtros
            try {
                const supervisorDoc = await window.firebaseService.obterDocumento("usuarios", supervisorUid);
                if (supervisorDoc.sucesso && supervisorDoc.dados) {
                    if (supervisorDoc.dados.categoria) {
                        supervisorCategoria = supervisorDoc.dados.categoria;
                        console.log("Supervisor logado pertence à categoria:", supervisorCategoria);
                        filtros = { categoria: supervisorCategoria }; // Define o filtro se a categoria existir
                    } else {
                        console.warn(`Supervisor ${supervisorUid} não tem campo 'categoria' definido no Firestore.`);
                        mostrarErro(solicitacoesPendentesContainer, 
                            "Seu perfil de supervisor não possui uma categoria atribuída. Entre em contato com o administrador do sistema.");
                        mostrarErro(historicoAprovacoesContainer, 
                            "Seu perfil de supervisor não possui uma categoria atribuída. Entre em contato com o administrador do sistema.");
                        return; // Interrompe o carregamento se não houver categoria
                    }
                } else {
                    console.warn(`Dados do supervisor ${supervisorUid} não encontrados no Firestore.`);
                    mostrarErro(solicitacoesPendentesContainer, 
                        "Seu perfil de supervisor não foi encontrado no sistema. Entre em contato com o administrador do sistema.");
                    mostrarErro(historicoAprovacoesContainer, 
                        "Seu perfil de supervisor não foi encontrado no sistema. Entre em contato com o administrador do sistema.");
                    return; // Interrompe o carregamento se não encontrar o supervisor
                }
            } catch (error) {
                 console.error("Erro ao buscar dados do supervisor no Firestore:", error);
                 mostrarErro(solicitacoesPendentesContainer, 
                    "Erro ao carregar seu perfil de supervisor. Tente novamente ou entre em contato com o administrador do sistema.");
                 mostrarErro(historicoAprovacoesContainer, 
                    "Erro ao carregar seu perfil de supervisor. Tente novamente ou entre em contato com o administrador do sistema.");
                 return; // Interrompe o carregamento se houver erro
            }

            // 3. Buscar as solicitações (com filtro de categoria)
            try {
                todasSolicitacoes = await window.AutorizacaoService.listarSolicitacoes(filtros);
                
                // 4. Filtrar e renderizar pendentes e histórico inicial (todos)
                filtrarERenderizar();
            } catch (error) {
                console.error("Erro ao listar solicitações:", error);
                mostrarErro(solicitacoesPendentesContainer, 
                    "Erro ao carregar solicitações. Tente novamente mais tarde.");
                mostrarErro(historicoAprovacoesContainer, 
                    "Erro ao carregar histórico. Tente novamente mais tarde.");
            }

        } catch (error) {
            console.error("Erro ao carregar dados do dashboard:", error);
            mostrarErro(solicitacoesPendentesContainer, `Erro ao carregar solicitações: ${error.message}`);
            mostrarErro(historicoAprovacoesContainer, `Erro ao carregar histórico: ${error.message}`);
        }
    }

    function filtrarERenderizar() {
        const filtroStatus = filtroStatusSelect ? filtroStatusSelect.value : "todos";

        // Filtrar Pendentes (apenas as que o supervisor ainda não decidiu)
        const pendentes = todasSolicitacoes.filter(s => 
            (!s.status_supervisor || s.status_supervisor === "Pendente")
        );
        renderizarSolicitacoes(solicitacoesPendentesContainer, pendentes, "pendentes");

        // Filtrar Histórico (todas que o supervisor já decidiu ou que foram finalizadas)
        let historico = todasSolicitacoes.filter(s => 
            (s.status_supervisor && s.status_supervisor !== "Pendente") || 
            (s.status_final && s.status_final !== "Em Análise")
        );

        // Aplicar filtro de status do histórico
        if (filtroStatus !== "todos") {
            historico = historico.filter(s => {
                // Considera o status final para o filtro, mas pode ajustar
                const statusParaFiltrar = s.status_final || s.status_supervisor; // Fallback para status do supervisor se final não definido
                return statusParaFiltrar.toLowerCase() === filtroStatus.toLowerCase();
            });
        }
        renderizarSolicitacoes(historicoAprovacoesContainer, historico, "historico");
    }

    // --- Inicialização e Eventos ---

    // Adicionar listener para o filtro de status do histórico
    if (filtroStatusSelect) {
        filtroStatusSelect.addEventListener("change", filtrarERenderizar);
    }

    // Carregar os dados iniciais
    await carregarDadosDashboard();

});
