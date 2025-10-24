import { AutorizacaoService } from './autorizacao-service.ts';
import { firebaseService } from './firebase-config.ts';

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

    let supervisorCategoria: string | null = null; // Armazenará a categoria do supervisor logado
    let todasSolicitacoes: any[] = []; // Cache das solicitações buscadas

    // Verificar dependências - Agora importadas diretamente
    if (!AutorizacaoService || !firebaseService) {
        console.error("Erro crítico: Serviços essenciais (AutorizacaoService ou FirebaseService) não estão disponíveis.");
        if (solicitacoesPendentesContainer) solicitacoesPendentesContainer.innerHTML = 
            '<p class="text-danger text-center">Erro ao carregar serviços. Tente recarregar a página.</p>';
        if (historicoAprovacoesContainer) historicoAprovacoesContainer.innerHTML = 
            '<p class="text-danger text-center">Erro ao carregar serviços.</p>';
        return;
    }

    // --- Funções Auxiliares ---

    function mostrarLoading(container: HTMLElement | null, loadingElement: HTMLElement) {
        if (container) container.innerHTML = ""; // Limpa antes de mostrar loading
        if (container) container.appendChild(loadingElement);
    }

    function mostrarErro(container: HTMLElement | null, mensagem: string) {
        if (container) container.innerHTML = `<p class="text-danger text-center">${mensagem}</p>`;
    }

    function getStatusHTML(status: string) {
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

    function renderizarSolicitacoes(container: HTMLElement | null, solicitacoes: any[], tipo: string) {
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
                    <span class="solicitacao-data">${AutorizacaoService.formatarData(sol.data_solicitacao) || "Data N/A"}</span>
                </div>
                <div class="solicitacao-info">
                    <p><strong>Motivo/Destino:</strong> ${sol.motivo_destino || "Não informado"}</p>
                    <p><strong>Data de Saída:</strong> ${AutorizacaoService.formatarData(sol.data_saida) || "N/A"} às ${sol.horario_saida || "N/A"}</p>
                    <p><strong>Data de Retorno:</strong> ${AutorizacaoService.formatarData(sol.data_retorno) || "N/A"} às ${sol.horario_retorno || "N/A"}</p>
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

    const userProfileDisplay = document.getElementById("userProfileDisplay");

    async function carregarDadosDashboard() {
        mostrarLoading(solicitacoesPendentesContainer, loadingPendentes);
        mostrarLoading(historicoAprovacoesContainer, loadingHistorico);

        try {
            // 1. Obter UID do supervisor da sessão
            const sessionData = JSON.parse(localStorage.getItem("VITE_current_session") || "{}");
            if (!sessionData || !sessionData.uid || !sessionData.profile) {
                throw new Error("Sessão inválida ou não encontrada.");
            }
            const userUid = sessionData.uid;
            const userProfile = sessionData.profile;

            // Atualizar a mensagem de boas-vindas
            if (userProfileDisplay) {
                userProfileDisplay.textContent = userProfile.charAt(0).toUpperCase() + userProfile.slice(1);
            }

            // Atualizar o título do painel, descrição e alerta com base no perfil
            const panelTitle = document.getElementById("panelTitle");
            const panelDescription = document.getElementById("panelDescription");
            const panelAlert = document.getElementById("panelAlert");

            if (panelTitle) {
                panelTitle.textContent = `Painel do ${userProfile.charAt(0).toUpperCase() + userProfile.slice(1)}`;
            }
            if (panelDescription) {
                if (userProfile === "admin") {
                    panelDescription.textContent = "Bem-vindo ao painel de administração. Aqui você pode gerenciar todas as solicitações do sistema.";
                } else if (userProfile === "supervisor") {
                    panelDescription.textContent = "Bem-vindo ao painel de supervisão. Aqui você pode gerenciar as solicitações de autorização dos atletas da sua categoria.";
                }
            }
            if (panelAlert) {
                if (userProfile === "admin") {
                    panelAlert.innerHTML = "<strong>Atenção:</strong> Como administrador, você tem acesso total e pode aprovar ou reprovar qualquer solicitação.";
                } else if (userProfile === "supervisor") {
                    panelAlert.innerHTML = "<strong>Atenção:</strong> Você é responsável pela primeira etapa de aprovação das solicitações. Após sua aprovação, o Serviço Social será notificado para contatar o responsável.";
                }
            }

            // 2. Buscar dados do usuário (tentar obter categoria se for supervisor)
            let filtros: { categoria?: string } = {}; // Inicia sem filtros
            if (userProfile === "supervisor") {
                try {
                    const userDoc = await firebaseService.obterDocumento("usuarios", userUid);
                    if (userDoc.sucesso && userDoc.dados) {
                        if (userDoc.dados.categoria) {
                            supervisorCategoria = userDoc.dados.categoria;
                            console.log("Usuário logado (supervisor) pertence à categoria:", supervisorCategoria);
                            filtros = { categoria: supervisorCategoria }; // Define o filtro se a categoria existir
                        } else {
                            console.warn(`Supervisor ${userUid} não tem campo 'categoria' definido no Firestore.`);
                            mostrarErro(solicitacoesPendentesContainer, 
                                "Seu perfil de supervisor não possui uma categoria atribuída. Entre em contato com o administrador do sistema.");
                            mostrarErro(historicoAprovacoesContainer, 
                                "Seu perfil de supervisor não possui uma categoria atribuída. Entre em contato com o administrador do sistema.");
                            return; // Interrompe o carregamento se não houver categoria
                        }
                    } else {
                        console.warn(`Dados do usuário ${userUid} não encontrados no Firestore.`);
                        mostrarErro(solicitacoesPendentesContainer, 
                            "Seu perfil não foi encontrado no sistema. Entre em contato com o administrador do sistema.");
                        mostrarErro(historicoAprovacoesContainer, 
                            "Seu perfil não foi encontrado no sistema. Entre em contato com o administrador do sistema.");
                        return; // Interrompe o carregamento se não encontrar o usuário
                    }
                } catch (error: any) {
                     console.error("Erro ao buscar dados do usuário no Firestore:", error);
                     mostrarErro(solicitacoesPendentesContainer, 
                        "Erro ao carregar seu perfil. Tente novamente ou entre em contato com o administrador do sistema.");
                     mostrarErro(historicoAprovacoesContainer, 
                        "Erro ao carregar seu perfil. Tente novamente ou entre em contato com o administrador do sistema.");
                     return; // Interrompe o carregamento se houver erro
                }
            } else if (userProfile === "admin") {
                // Para administradores, não há filtro de categoria, mas pode haver outras lógicas
                console.log("Administrador logado. Carregando todas as solicitações.");
            } else {
                // Outros perfis podem ter lógicas diferentes ou não acessar este dashboard
                console.warn(`Perfil ${userProfile} não esperado para este dashboard.`);
                mostrarErro(solicitacoesPendentesContainer, 
                    "Seu perfil não tem acesso a este dashboard.");
                mostrarErro(historicoAprovacoesContainer, 
                    "Seu perfil não tem acesso a este dashboard.");
                return;
            }

            // 3. Buscar as solicitações (com filtro de categoria se for supervisor, ou todas para admin)
            try {
                todasSolicitacoes = await AutorizacaoService.listarSolicitacoes(filtros);
                
                // 4. Filtrar e renderizar pendentes e histórico inicial (todos)
                filtrarERenderizar();
            } catch (error: any) {
                console.error("Erro ao listar solicitações:", error);
                mostrarErro(solicitacoesPendentesContainer, 
                    `Erro ao carregar solicitações: ${error.message}`);
                mostrarErro(historicoAprovacoesContainer, 
                    `Erro ao carregar histórico: ${error.message}`);
            }

        } catch (error: any) {
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
                const statusParaFiltrar = s.status_final || s.status_supervisor; 
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


