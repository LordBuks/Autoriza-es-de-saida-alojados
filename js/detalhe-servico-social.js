// Lógica corrigida para o painel do serviço social
document.addEventListener("DOMContentLoaded", async function() {
    // Elementos da página
    const btnEnviarLinkPais = document.getElementById("btn-enviar-link-pais");
    const btnVerLinkEnviado = document.getElementById("btn-ver-link-enviado");
    const btnDefinirStatusFinal = document.getElementById("btn-definir-status-final");
    const btnGerarPdf = document.getElementById("btn-gerar-pdf");
    
    // Modais
    const modalLinkEnviado = document.getElementById("modal-link-enviado");
    const modalStatusFinal = document.getElementById("modal-status-final");
    const linkPaisDisplay = document.getElementById("link-pais-display");
    
    // Botões dos modais
    const btnCopiarLink = document.getElementById("btn-copiar-link");
    const btnFecharLink = document.getElementById("btn-fechar-link");
    const btnAprovarFinal = document.getElementById("btn-aprovar-final");
    const btnReprovarFinal = document.getElementById("btn-reprovar-final");
    const btnCancelarFinal = document.getElementById("btn-cancelar-final");
    
    // Variáveis de controle
    let solicitacaoAtual = null;
    let idSolicitacao = null;
    
    // Verificar dependências
    if (!window.firebaseService) {
        alert("Erro crítico: Serviço Firebase não disponível. Recarregue a página.");
        return;
    }
    
    // Obter ID da solicitação da URL
    const urlParams = new URLSearchParams(window.location.search);
    idSolicitacao = urlParams.get("id");
    
    if (!idSolicitacao) {
        alert("ID da solicitação não fornecido. Redirecionando para o painel.");
        window.location.href = "dashboard.html";
        return;
    }
    
    // --- Funções Auxiliares ---
    
    function formatarData(dataString) {
        if (!dataString) return "N/A";
        try {
            const data = new Date(dataString);
            if (isNaN(data.getTime())) return "Data inválida";
            return data.toLocaleDateString("pt-BR", {
                day: "2-digit", month: "2-digit", year: "numeric"
            });
        } catch (e) {
            return "Data inválida";
        }
    }
    
    function gerarToken() {
        return Math.random().toString(36).substring(2, 15) + 
               Math.random().toString(36).substring(2, 15);
    }
    
    function atualizarVisibilidadeBotoes() {
        if (!solicitacaoAtual) return;
        
        const linkEnviado = solicitacaoAtual.link_pais;
        const statusPais = solicitacaoAtual.status_pais;
        const statusServicoSocial = solicitacaoAtual.status_servico_social;
        
        // Mostrar "Ver Link Enviado" se o link foi enviado
        if (linkEnviado) {
            btnVerLinkEnviado.style.display = "inline-block";
            btnEnviarLinkPais.textContent = "Reenviar Link aos Pais";
        } else {
            btnVerLinkEnviado.style.display = "none";
            btnEnviarLinkPais.textContent = "Enviar Link aos Pais";
        }
        
        // Mostrar "Definir Status Final" apenas se os pais já responderam E o serviço social ainda não decidiu
        if ((statusPais === "Aprovado" || statusPais === "Reprovado") && 
            (!statusServicoSocial || statusServicoSocial === "Pendente")) {
            btnDefinirStatusFinal.style.display = "inline-block";
            btnDefinirStatusFinal.textContent = `Definir Status Final (Pais: ${statusPais})`;
        } else {
            btnDefinirStatusFinal.style.display = "none";
        }
        
        // Habilitar PDF apenas se processo finalizado
        if (solicitacaoAtual.status_final === "Autorizado" || solicitacaoAtual.status_final === "Não Autorizado") {
            btnGerarPdf.disabled = false;
        } else {
            btnGerarPdf.disabled = true;
        }
    }
    
    // --- Funções Principais ---
    
    async function carregarSolicitacao(id) {
        try {
            const resultado = await window.firebaseService.obterDocumento("solicitacoes", id);
            
            if (!resultado.sucesso || !resultado.dados) {
                throw new Error("Solicitação não encontrada.");
            }
            
            solicitacaoAtual = resultado.dados;
            preencherDadosPagina(solicitacaoAtual);
            atualizarVisibilidadeBotoes();
            
        } catch (error) {
            console.error("Erro ao carregar solicitação:", error);
            alert(`Erro ao carregar dados: ${error.message}`);
        }
    }
    
    function preencherDadosPagina(solicitacao) {
        document.getElementById("nome-atleta").textContent = solicitacao.nome || "N/A";
        document.getElementById("categoria-atleta").textContent = solicitacao.categoria || "N/A";
        document.getElementById("data-nascimento").textContent = formatarData(solicitacao.data_nascimento);
        document.getElementById("telefone-atleta").textContent = solicitacao.telefone || "N/A";
        
        document.getElementById("data-saida").textContent = formatarData(solicitacao.data_saida);
        document.getElementById("horario-saida").textContent = solicitacao.horario_saida || "N/A";
        document.getElementById("data-retorno").textContent = formatarData(solicitacao.data_retorno);
        document.getElementById("horario-retorno").textContent = solicitacao.horario_retorno || "N/A";
        document.getElementById("motivo-destino").textContent = solicitacao.motivo_destino || "N/A";
        
        document.getElementById("nome-responsavel").textContent = solicitacao.nome_responsavel || "N/A";
        document.getElementById("telefone-responsavel").textContent = solicitacao.telefone_responsavel || "N/A";
        
        // Status
        const statusSupervisor = document.getElementById("status-supervisor");
        statusSupervisor.textContent = solicitacao.status_supervisor || "Pendente";
        
        const dataAprovacao = document.getElementById("data-aprovacao-supervisor");
        dataAprovacao.textContent = formatarData(solicitacao.data_aprovacao_supervisor);
        
        const statusAtual = document.getElementById("status-atual");
        const statusServicoSocial = solicitacao.status_servico_social || "Aguardando Validação";
        statusAtual.textContent = statusServicoSocial;
        
        // Adicionar informação sobre status dos pais se disponível
        const statusPais = solicitacao.status_pais;
        if (statusPais && statusPais !== "Pendente") {
            const statusPaisElement = document.createElement("p");
            statusPaisElement.innerHTML = `<strong>Status Pais:</strong> <span class="badge ${statusPais === 'Aprovado' ? 'badge-approved' : 'badge-rejected'}">${statusPais}</span>`;
            
            // Inserir após o status atual se não existir ainda
            if (!document.getElementById("status-pais-info")) {
                statusPaisElement.id = "status-pais-info";
                statusAtual.parentElement.insertAdjacentElement("afterend", statusPaisElement);
            } else {
                document.getElementById("status-pais-info").innerHTML = statusPaisElement.innerHTML;
            }
        }
    }
    
    async function enviarLinkPais() {
        if (!solicitacaoAtual) return;
        
        btnEnviarLinkPais.disabled = true;
        btnEnviarLinkPais.textContent = "Enviando...";
        
        try {
            // Gerar token se não existir
            let token = solicitacaoAtual.token_aprovacao_pais;
            if (!token) {
                token = gerarToken();
            }
            
            // Gerar o link para os pais
            const link = `${window.location.origin}/pais/aprovacao.html?id=${solicitacaoAtual.id}&token=${token}`;
            
            const dadosAtualizacao = {
                token_aprovacao_pais: token,
                link_pais: link,
                data_envio_link_pais: new Date().toISOString(),
                status_pais: "Pendente"
            };
            
            const resultado = await window.firebaseService.atualizarDocumento("solicitacoes", solicitacaoAtual.id, dadosAtualizacao);
            
            if (!resultado.sucesso) {
                throw new Error(resultado.erro || "Falha ao salvar no Firebase.");
            }
            
            // Enviar via WhatsApp
            const mensagem = `O Serviço Social das Categorias de Base do Sport Clube Internacional, informa que o atleta ${solicitacaoAtual.nome} solicitou uma autorização para ${solicitacaoAtual.motivo_destino} Para sua segurança e para garantir a integridade do processo, solicitamos que acesse o link abaixo para avaliar e, se for o caso, aprovar ou reprovar a solicitação:' ${link}
             Atenciosamente, Serviço Social`;
            
            if (window.whatsAppService) {
                const linkWhatsApp = window.whatsAppService.gerarLinkWhatsApp(solicitacaoAtual.telefone_responsavel, mensagem);
                if (linkWhatsApp) {
                    window.open(linkWhatsApp, '_blank');
                }
            }
            
            // Atualizar dados locais
            solicitacaoAtual.token_aprovacao_pais = token;
            solicitacaoAtual.link_pais = link;
            solicitacaoAtual.data_envio_link_pais = dadosAtualizacao.data_envio_link_pais;
            
            alert("Link enviado com sucesso!");
            atualizarVisibilidadeBotoes();
            
        } catch (error) {
            console.error("Erro ao enviar link:", error);
            alert(`Erro ao enviar link: ${error.message}`);
        } finally {
            btnEnviarLinkPais.disabled = false;
            btnEnviarLinkPais.textContent = solicitacaoAtual.link_pais ? "Reenviar Link aos Pais" : "Enviar Link aos Pais";
        }
    }
    
    function mostrarLinkEnviado() {
        if (!solicitacaoAtual || !solicitacaoAtual.link_pais) {
            alert("Nenhum link foi enviado ainda.");
            return;
        }
        
        linkPaisDisplay.value = solicitacaoAtual.link_pais;
        const previewIframe = document.getElementById("preview-link");
        if (previewIframe) {
            previewIframe.src = solicitacaoAtual.link_pais;
        }
        modalLinkEnviado.style.display = "block";
    }
    
    function copiarLink() {
        linkPaisDisplay.select();
        document.execCommand('copy');
        alert('Link copiado para a área de transferência!');
    }
    
    function mostrarModalStatusFinal() {
        if (!solicitacaoAtual) return;
        
        const statusPais = solicitacaoAtual.status_pais;
        if (statusPais !== "Aprovado" && statusPais !== "Reprovado") {
            alert("Os pais ainda não responderam à solicitação.");
            return;
        }
        
        // Limpar observação anterior
        const observacaoFinal = document.getElementById("observacao-final");
        if (observacaoFinal) {
            observacaoFinal.value = "";
        }
        
        // Mostrar o modal
        modalStatusFinal.style.display = "block";
        
        console.log("Modal de status final exibido. Status dos pais:", statusPais);
    }
    
    async function definirStatusFinal(decisao) {
        if (!solicitacaoAtual) return;
        
        const observacao = document.getElementById("observacao-final").value.trim();
        
        console.log("Definindo status final:", decisao, "Observação:", observacao);
        
        try {
            const dadosAtualizacao = {
                status_servico_social: decisao,
                status_final: decisao === "Aprovado" ? "Autorizado" : "Não Autorizado",
                observacao_servico_social: observacao,
                data_decisao_servico_social: new Date().toISOString()
            };
            
            console.log("Dados para atualização:", dadosAtualizacao);
            
            const resultado = await window.firebaseService.atualizarDocumento("solicitacoes", solicitacaoAtual.id, dadosAtualizacao);
            
            if (!resultado.sucesso) {
                throw new Error(resultado.erro || "Falha ao atualizar status.");
            }
            
            alert(`Status final definido como '${dadosAtualizacao.status_final}' com sucesso!`);
            
            // Atualizar dados locais
            Object.assign(solicitacaoAtual, dadosAtualizacao);
            
            modalStatusFinal.style.display = "none";
            atualizarVisibilidadeBotoes();
            preencherDadosPagina(solicitacaoAtual);
            
            console.log("Status final atualizado com sucesso");
            
        } catch (error) {
            console.error("Erro ao definir status final:", error);
            alert(`Erro ao definir status: ${error.message}`);
        }
    }
    
    // --- Event Listeners ---
    
    if (btnEnviarLinkPais) {
        btnEnviarLinkPais.addEventListener("click", enviarLinkPais);
    }
    
    if (btnVerLinkEnviado) {
        btnVerLinkEnviado.addEventListener("click", mostrarLinkEnviado);
    }
    
    if (btnDefinirStatusFinal) {
        btnDefinirStatusFinal.addEventListener("click", mostrarModalStatusFinal);
    }
    
    if (btnCopiarLink) {
        btnCopiarLink.addEventListener("click", copiarLink);
    }
    
    if (btnFecharLink) {
        btnFecharLink.addEventListener("click", () => {
            modalLinkEnviado.style.display = "none";
        });
    }
    
    if (btnAprovarFinal) {
        btnAprovarFinal.addEventListener("click", () => {
            console.log("Botão Aprovar Final clicado");
            definirStatusFinal("Aprovado");
        });
    }
    
    if (btnReprovarFinal) {
        btnReprovarFinal.addEventListener("click", () => {
            console.log("Botão Reprovar Final clicado");
            definirStatusFinal("Reprovado");
        });
    }
    
    if (btnCancelarFinal) {
        btnCancelarFinal.addEventListener("click", () => {
            console.log("Botão Cancelar Final clicado");
            modalStatusFinal.style.display = "none";
        });
    }
    
    // --- Inicialização ---
    console.log("Iniciando carregamento da solicitação:", idSolicitacao);
    await carregarSolicitacao(idSolicitacao);
    console.log("Solicitação carregada:", solicitacaoAtual);
});

