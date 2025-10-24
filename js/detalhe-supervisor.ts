// Lógica para a tela de detalhe do supervisor (Refatorado para Firestore)
document.addEventListener("DOMContentLoaded", async function() {
    // Elementos da página
    const btnAprovar = document.getElementById("btn-aprovar");
    const btnReprovar = document.getElementById("btn-reprovar");
    const modalObservacao = document.getElementById("modal-observacao");
    const btnConfirmar = document.getElementById("btn-confirmar-observacao");
    const btnCancelar = document.getElementById("btn-cancelar-modal");
    const detalheContainer = document.getElementById("detalhe-solicitacao");
    const loadingIndicator = document.createElement("div");
    loadingIndicator.id = "loading-indicator";
    loadingIndicator.textContent = "Carregando dados...";
    loadingIndicator.style.textAlign = "center";
    loadingIndicator.style.padding = "20px";
    loadingIndicator.style.display = "none";
    detalheContainer.parentNode.insertBefore(loadingIndicator, detalheContainer);
  
    const alertMessageDiv = document.getElementById("alert-message");
    const alertTextSpan = document.getElementById("alert-text");
  
    let solicitacaoAtual = null;
    let acaoAtual = null;
    let idSolicitacao = null;

    // Verificar dependências
    if (!window.AutorizacaoService || !window.firebaseService) {
        mostrarAlerta("Erro crítico: Serviços essenciais (AutorizacaoService ou FirebaseService) não estão disponíveis. A página não pode funcionar.", "alert-danger");
        if (detalheContainer) detalheContainer.style.display = "none";
        return;
    }
  
    // Obter ID da solicitação da URL
    const urlParams = new URLSearchParams(window.location.search);
    idSolicitacao = urlParams.get("id");
  
    if (!idSolicitacao) {
      mostrarAlerta("ID da solicitação não fornecido na URL. Redirecionando para o painel.", "alert-warning");
      setTimeout(() => { window.location.href = "dashboard.html"; }, 3000);
      return;
    }
  
    // --- Funções Auxiliares ---
  
    function setLoading(isLoading) {
        if (loadingIndicator) loadingIndicator.style.display = isLoading ? "block" : "none";
        if (detalheContainer) detalheContainer.style.display = isLoading ? "none" : "block";
    }
  
    function mostrarAlerta(mensagem, tipo = "alert-info") {
        if (!alertMessageDiv || !alertTextSpan) return;

        alertTextSpan.textContent = mensagem;
        alertMessageDiv.className = `alert ${tipo}`;
        alertMessageDiv.style.display = "block";
    }
  
    function getBadgeClass(status) {
        switch (status) {
            case "Aprovado": return "bg-success";
            case "Reprovado": return "bg-danger";
            default: return "bg-warning text-dark";
        }
    }
  
    function preencherDadosPagina(solicitacao) {
        if (!solicitacao) {
            mostrarAlerta("Não foi possível carregar os dados da solicitação.", "alert-danger");
            return;
        }
        document.getElementById("nome-atleta").textContent = solicitacao.nome || "N/A";
        document.getElementById("categoria-atleta").textContent = solicitacao.categoria || "N/A";
        document.getElementById("data-nascimento").textContent = window.AutorizacaoService.formatarData(solicitacao.data_nascimento) || "N/A";
        document.getElementById("telefone-atleta").textContent = solicitacao.telefone || "N/A";
  
        document.getElementById("data-saida").textContent = window.AutorizacaoService.formatarData(solicitacao.data_saida) || "N/A";
        document.getElementById("horario-saida").textContent = solicitacao.horario_saida || "N/A";
        document.getElementById("data-retorno").textContent = window.AutorizacaoService.formatarData(solicitacao.data_retorno) || "N/A";
        document.getElementById("horario-retorno").textContent = solicitacao.horario_retorno || "N/A";
        document.getElementById("motivo-destino").textContent = solicitacao.motivo_destino || "N/A";
  
        document.getElementById("nome-responsavel").textContent = solicitacao.nome_responsavel || "N/A";
        document.getElementById("telefone-responsavel").textContent = solicitacao.telefone_responsavel || "N/A";
  
        const infoDispositivo = document.getElementById("info-dispositivo");
        if (infoDispositivo && solicitacao.dispositivo) {
            infoDispositivo.innerHTML = `
                <p><strong>Plataforma:</strong> ${solicitacao.dispositivo.platform || "N/A"}</p>
                <p><strong>Navegador:</strong> ${solicitacao.dispositivo.userAgent ? solicitacao.dispositivo.userAgent.split(" ").pop() : "N/A"}</p>
                <p><strong>Data/Hora Envio:</strong> ${solicitacao.dispositivo.timestamp ? new Date(solicitacao.dispositivo.timestamp).toLocaleString("pt-BR") : "N/A"}</p>
            `;
            infoDispositivo.style.display = "block";
        } else if (infoDispositivo) {
            infoDispositivo.innerHTML = "<p>Informações não disponíveis</p>";
            infoDispositivo.style.display = "block";
        }
  
        const statusAtualElement = document.getElementById("status-atual");
        const statusSupervisor = solicitacao.status_supervisor || "Pendente";
        if (statusAtualElement) {
            statusAtualElement.textContent = statusSupervisor;
            statusAtualElement.className = `badge ${getBadgeClass(statusSupervisor)}`;
        }
  
        const dataSolicitacaoElement = document.getElementById("data-solicitacao");
         if (dataSolicitacaoElement) {
             dataSolicitacaoElement.textContent = window.AutorizacaoService.formatarData(solicitacao.data_solicitacao) || "N/A";
         }
  
        // Lógica para os botões de ação
        if (btnAprovar && btnReprovar) {
            // Resetar estado dos botões
            btnAprovar.style.display = "block";
            btnReprovar.style.display = "block";
            btnAprovar.disabled = false;
            btnReprovar.disabled = false;

            if (statusSupervisor === "Aprovado") {
                btnAprovar.textContent = "Aprovado";
                btnAprovar.classList.remove("btn-success");
                btnAprovar.classList.add("btn-success-active");
                btnReprovar.textContent = "Reprovar";
                btnReprovar.classList.remove("btn-danger-active");
                btnReprovar.classList.add("btn-danger");
            } else if (statusSupervisor === "Reprovado") {
                btnAprovar.textContent = "Aprovar";
                btnAprovar.classList.remove("btn-success-active");
                btnAprovar.classList.add("btn-success");
                btnReprovar.textContent = "Reprovado";
                btnReprovar.classList.remove("btn-danger");
                btnReprovar.classList.add("btn-danger-active");
            } else {
                // Status Pendente
                btnAprovar.textContent = "Aprovar";
                btnAprovar.classList.remove("btn-success-active");
                btnAprovar.classList.add("btn-success");
                btnReprovar.textContent = "Reprovar";
                btnReprovar.classList.remove("btn-danger-active");
                btnReprovar.classList.add("btn-danger");
            }
        }
    }
  
    // --- Lógica Principal ---
  
    async function carregarSolicitacao(id) {
      setLoading(true);
      mostrarAlerta("Carregando dados da solicitação...", "alert-info");
      try {
        solicitacaoAtual = await window.AutorizacaoService.buscarSolicitacao(id);
  
        if (!solicitacaoAtual) {
          mostrarAlerta("Solicitação não encontrada. Verifique o ID ou contate o suporte.", "alert-danger");
          if (btnAprovar) btnAprovar.disabled = true;
          if (btnReprovar) btnReprovar.disabled = true;
        } else {
          preencherDadosPagina(solicitacaoAtual);
        }
      } catch (error) {
        console.error("Erro ao carregar solicitação:", error);
        mostrarAlerta("Erro ao carregar dados da solicitação. Verifique o console.", "alert-danger");
        if (btnAprovar) btnAprovar.disabled = true;
        if (btnReprovar) btnReprovar.disabled = true;
      } finally {
        setLoading(false);
      }
    }
  
    async function atualizarStatusSolicitacao(novoStatus, observacao) {
      if (!solicitacaoAtual) {
          mostrarAlerta("Erro: Nenhuma solicitação carregada para atualizar.", "alert-danger");
          return;
      }
  
      setLoading(true);
      mostrarAlerta(`Atualizando status para ${novoStatus}...`, "alert-info");
  
      try {
        const resultado = await window.AutorizacaoService.atualizarStatus(
          solicitacaoAtual.id,
          "supervisor",
          novoStatus,
          observacao
        );
  
        if (resultado.sucesso) {
          if (novoStatus === "Aprovado") {
            mostrarAlerta("Autorização validada com sucesso, atleta liberado!", "alert-success");
          } else if (novoStatus === "Reprovado") {
            mostrarAlerta("Solicitação reprovada com sucesso.", "alert-danger");
          }
          solicitacaoAtual = resultado.solicitacao;
          preencherDadosPagina(solicitacaoAtual);
        } else {
          mostrarAlerta(`Erro ao ${novoStatus.toLowerCase()} solicitação: ${resultado.mensagem || "Erro desconhecido."}`, "alert-danger");
        }
      } catch (error) {
          console.error(`Erro ao atualizar status para ${novoStatus}:`, error);
          mostrarAlerta(`Erro técnico ao atualizar status. Verifique o console.`, "alert-danger");
      } finally {
          setLoading(false);
      }
    }
  
    // --- Configuração de Eventos ---
  
    if (btnAprovar) {
        btnAprovar.addEventListener("click", async () => {
            if (btnAprovar.disabled) return;
            
            // Confirmar ação
            if (confirm("Tem certeza que deseja aprovar esta solicitação?")) {
                await atualizarStatusSolicitacao("Aprovado", "Aprovado pelo supervisor");
            }
        });
    }

    if (btnReprovar) {
        btnReprovar.addEventListener("click", async () => {
            if (btnReprovar.disabled) return;
            
            // Solicitar observação obrigatória para reprovação
            const observacao = prompt("Digite o motivo da reprovação (obrigatório):");
            if (observacao && observacao.trim()) {
                await atualizarStatusSolicitacao("Reprovado", observacao.trim());
            } else if (observacao !== null) {
                alert("A observação é obrigatória para reprovar uma solicitação.");
            }
        });
    }

    if (btnConfirmar) {
        btnConfirmar.addEventListener("click", async () => {
            const observacaoInput = document.getElementById("observacao");
            const observacao = observacaoInput ? observacaoInput.value.trim() : "";

            // Validação da observação para reprovação
            if (acaoAtual === "Reprovado" && !observacao) {
                alert("A observação é obrigatória ao reprovar.");
                return;
            }

            if (modalObservacao) modalObservacao.style.display = "none";
            await atualizarStatusSolicitacao(acaoAtual, observacao);
            if (observacaoInput) observacaoInput.value = "";
        });
    }

    if (btnCancelar) {
        btnCancelar.addEventListener("click", () => {
            if (modalObservacao) modalObservacao.style.display = "none";
            const observacaoInput = document.getElementById("observacao");
            if (observacaoInput) observacaoInput.value = "";
        });
    }
  
    // Fechar modal clicando fora
    window.addEventListener("click", (event) => {
        if (modalObservacao && event.target == modalObservacao) {
            modalObservacao.style.display = "none";
        }
    });
  
    // --- Inicialização ---
    await carregarSolicitacao(idSolicitacao);
  
  });

