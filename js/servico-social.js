// Lógica para o painel do serviço social
document.addEventListener("DOMContentLoaded", async function() { // Adicionado async
    const solicitacoesPreAprovadasContainer = document.getElementById("solicitacoes-pre-aprovadas");
    const historicoValidacoesContainer = document.getElementById("historico-validacoes");
    const filtroStatusSelect = document.getElementById("filtro-status");
    const detalhesContainer = document.getElementById("detalhes-solicitacao"); // Container para detalhes
    
    // Elementos dos botões de ação (serão buscados quando os detalhes forem carregados)
    let btnEnviarLink;
    let btnStatusFinal;
    let btnGerarPdf;
    
    // Solicitação atual sendo visualizada
    let solicitacaoAtual = null;
    let todasSolicitacoesCache = []; // Cache para dados do Firestore
  
    // Verificar dependências
    console.log("Verificando serviços:", {
      firebase: !!window.firebaseService,
      auditoria: !!window.auditoriaService,
      pdf: !!window.pdfService
    });
    if (!window.firebaseService || !window.auditoriaService || !window.pdfService) {
        console.error("Erro crítico: Serviços essenciais (Firebase, Auditoria, PDF) não estão disponíveis.");
        mostrarErro(solicitacoesPreAprovadasContainer, "Erro ao carregar serviços. Tente recarregar a página.");
        mostrarErro(historicoValidacoesContainer, "Erro ao carregar serviços.");
        return;
    }
  
    // --- Funções Auxiliares ---
    function mostrarLoading(container, mensagem = "Carregando...") {
        if (container) container.innerHTML = `<p class="text-center">${mensagem}</p>`;
    }
  
    function mostrarErro(container, mensagem) {
        if (container) container.innerHTML = `<p class="text-danger text-center">${mensagem}</p>`;
    }
  
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
  
    function getStatusBadge(status, tipo = "final") {
        let statusText = status || (tipo === "final" ? "Em Análise" : "Pendente");
        let badgeClass = "bg-warning text-dark"; // Padrão
  
        if (statusText === "Aprovado" || statusText === "Autorizado") {
            badgeClass = "bg-success";
            statusText = "Aprovado";
        } else if (statusText === "Reprovado" || statusText === "Não Autorizado") {
            badgeClass = "bg-danger";
            statusText = "Reprovado";
        }
        return `<span class="badge ${badgeClass}">${statusText}</span>`;
    }
  
    function gerarToken() {
        return Math.random().toString(36).substring(2, 15) + 
               Math.random().toString(36).substring(2, 15);
    }
  
    // --- Funções Principais ---
  
    async function carregarTodasSolicitacoesDoFirestore() {
        mostrarLoading(solicitacoesPreAprovadasContainer, "Carregando solicitações...");
        mostrarLoading(historicoValidacoesContainer, "Carregando histórico...");
        try {
            const resultado = await window.firebaseService.obterDocumentos("solicitacoes");
            if (resultado.sucesso) {
                todasSolicitacoesCache = resultado.dados;
                console.log("Solicitações carregadas do Firestore para Serviço Social:", todasSolicitacoesCache);
                renderizarSolicitacoesPreAprovadas();
                renderizarHistoricoValidacoes(); // Renderiza com filtro inicial "todos"
            } else {
                // Se a função obterDocumentos já trata o erro (como parece fazer), 
                // e retorna { sucesso: false, erro: ... }, o "Uncaught (in promise)" não deveria ocorrer.
                // No entanto, para garantir, vamos tratar explicitamente o erro aqui.
                throw new Error(resultado.erro || "Falha ao buscar solicitações.");
            }
        } catch (error) {
            console.error("Erro ao carregar solicitações do Firestore (tratado):", error);
            const errorMessage = error instanceof Error ? error.message : "Erro desconhecido ao carregar";
            mostrarErro(solicitacoesPreAprovadasContainer, `Erro ao carregar: ${errorMessage}`);
            mostrarErro(historicoValidacoesContainer, `Erro ao carregar: ${errorMessage}`);
        }
    }
  
    function renderizarSolicitacoesPreAprovadas() {
        if (!solicitacoesPreAprovadasContainer) return;
  
        // Modificado para incluir solicitações que foram aprovadas pelos pais mas ainda estão pendentes no serviço social
        const preAprovadas = todasSolicitacoesCache.filter(s => 
            s.status_supervisor === "Aprovado" && 
            (s.status_servico_social === "Pendente" || !s.status_servico_social)
        );
  
        if (preAprovadas.length === 0) {
            solicitacoesPreAprovadasContainer.innerHTML = 
                `<p class="text-center">Nenhuma solicitação pré-aprovada encontrada.</p>`;
            return;
        }
  
        const html = preAprovadas.map(s => {
            // Verificar se os pais já tomaram uma decisão
            const decisaoPais = s.status_pais ? `<span class="badge ${s.status_pais === 'Aprovado' ? 'bg-success' : 'bg-danger'}">${s.status_pais}</span>` : '<span class="badge bg-warning text-dark">Pendente</span>';
            
            return `
            <div class="card mb-3">
              <div class="card-body">
                <h5 class="card-title">${s.nome || "N/A"} • ${s.categoria || "N/A"}</h5>
                <p class="card-text mb-1"><strong>Destino:</strong> ${s.motivo_destino || "N/A"}</p>
                <p class="card-text mb-1"><strong>Período:</strong> ${formatarData(s.data_saida)} ${s.horario_saida || ""} até ${formatarData(s.data_retorno)} ${s.horario_retorno || ""}</p>
                <p class="card-text"><strong>Responsável:</strong> ${s.nome_responsavel || "N/A"} - ${s.telefone_responsavel || "N/A"}</p>
                <p class="card-text"><strong>Decisão dos Pais:</strong> ${decisaoPais}</p>
                <button class="btn btn-primary mt-2 btn-visualizar" data-id="${s.id}">Ver Detalhes</button>
              </div>
            </div>
        `}).join("");
        solicitacoesPreAprovadasContainer.innerHTML = html;
  
        // Adicionar eventos aos botões de visualização DESTA seção
        solicitacoesPreAprovadasContainer.querySelectorAll(".btn-visualizar").forEach(btn => {
            btn.removeEventListener("click", handleVisualizarClick); // Remove listener antigo se houver
            btn.addEventListener("click", handleVisualizarClick);
        });
    }
  
    function renderizarHistoricoValidacoes() {
        if (!historicoValidacoesContainer) return;
  
        let historico = todasSolicitacoesCache.filter(s => 
            s.status_servico_social && s.status_servico_social !== "Pendente"
        );
  
        const filtro = filtroStatusSelect ? filtroStatusSelect.value : "todos";
        if (filtro !== "todos") {
            historico = historico.filter(s => {
                const statusServSoc = s.status_servico_social ? s.status_servico_social.toLowerCase() : "";
                if (filtro === "aprovado") return statusServSoc === "aprovado";
                if (filtro === "reprovado") return statusServSoc === "reprovado";
                return false;
            });
        }
  
        historico.sort((a, b) => new Date(b.data_solicitacao) - new Date(a.data_solicitacao));
  
        if (historico.length === 0) {
            historicoValidacoesContainer.innerHTML = 
                `<p class="text-center">Nenhum histórico encontrado com os filtros aplicados.</p>`;
            return;
        }
  
        const html = `
          <table class="table table-striped table-hover">
            <thead>
              <tr>
                <th>Código</th>
                <th>Atleta</th>
                <th>Categoria</th>
                <th>Data Solicitação</th>
                <th>Status Serviço Social</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              ${historico.map(s => `
                <tr>
                  <td>${s.id || "N/A"}</td>
                  <td>${s.nome || "N/A"}</td>
                  <td>${s.categoria || "N/A"}</td>
                  <td>${formatarData(s.data_solicitacao)}</td>
                  <td>${getStatusBadge(s.status_servico_social, "servico_social")}</td>
                  <td><button class="btn btn-primary btn-sm btn-visualizar" data-id="${s.id}">Ver</button></td>
                </tr>
              `).join("")}
            </tbody>
          </table>
        `;
        historicoValidacoesContainer.innerHTML = html;
  
        // Adicionar eventos aos botões de visualização DESTA seção
        historicoValidacoesContainer.querySelectorAll(".btn-visualizar").forEach(btn => {
            btn.removeEventListener("click", handleVisualizarClick); // Remove listener antigo se houver
            btn.addEventListener("click", handleVisualizarClick);
        });
    }
  
    function handleVisualizarClick() {
        const id = this.getAttribute("data-id");
        carregarDetalhesSolicitacao(id);
    }
  
      async function carregarDetalhesSolicitacao(id) {
          if (!detalhesContainer) return;
          // Mostrar o container e definir campos como "Carregando..." individualmente
          detalhesContainer.style.display = "block";
          document.getElementById("solicitacao-id").textContent = "Carregando...";
          document.getElementById("nome-atleta").textContent = "Carregando...";
          document.getElementById("categoria-atleta").textContent = "Carregando...";
          document.getElementById("telefone-atleta").textContent = "Carregando...";
          document.getElementById("nome-responsavel").textContent = "Carregando...";
          document.getElementById("telefone-responsavel").textContent = "Carregando...";
          document.getElementById("data-saida").textContent = "Carregando...";
          document.getElementById("horario-saida").textContent = "Carregando...";
          document.getElementById("data-retorno").textContent = "Carregando...";
          document.getElementById("horario-retorno").textContent = "Carregando...";
          document.getElementById("motivo-destino").textContent = "Carregando...";
          document.getElementById("status-supervisor").innerHTML = "Carregando...";
          document.getElementById("status-servico-social").innerHTML = "Carregando...";
          document.getElementById("status-final").innerHTML = "Carregando...";
          document.getElementById("status-pais").innerHTML = "Carregando..."; // Adicionado
          // Limpar botões de ação anteriores
          const acoesServicoSocialContainer = document.getElementById("acoes-servico-social");
          if (acoesServicoSocialContainer) acoesServicoSocialContainer.innerHTML = "";
  
          // Buscar a solicitação específica no Firestore
          try {
              const resultado = await window.firebaseService.obterDocumento("solicitacoes", id);
              if (!resultado.sucesso) {
                  throw new Error(resultado.erro || "Solicitação não encontrada.");
              }
              solicitacaoAtual = resultado.dados;
  
              // Preencher os dados na seção de detalhes (agora que os elementos existem)
              document.getElementById("solicitacao-id").textContent = solicitacaoAtual.id || "N/A";
              document.getElementById("nome-atleta").textContent = solicitacaoAtual.nome || "N/A";
              document.getElementById("categoria-atleta").textContent = solicitacaoAtual.categoria || "N/A";
              document.getElementById("telefone-atleta").textContent = solicitacaoAtual.telefone || "N/A";
              
              document.getElementById("nome-responsavel").textContent = solicitacaoAtual.nome_responsavel || "N/A";
              document.getElementById("telefone-responsavel").textContent = solicitacaoAtual.telefone_responsavel || "N/A";
              
              document.getElementById("data-saida").textContent = formatarData(solicitacaoAtual.data_saida);
              document.getElementById("horario-saida").textContent = solicitacaoAtual.horario_saida || "N/A";
              document.getElementById("data-retorno").textContent = formatarData(solicitacaoAtual.data_retorno);
              document.getElementById("horario-retorno").textContent = solicitacaoAtual.horario_retorno || "N/A";
              document.getElementById("motivo-destino").textContent = solicitacaoAtual.motivo_destino || "N/A";
              
              // Atualizar badges de status
              document.getElementById("status-supervisor").innerHTML = getStatusBadge(solicitacaoAtual.status_supervisor, "supervisor");
              document.getElementById("status-servico-social").innerHTML = getStatusBadge(solicitacaoAtual.status_servico_social, "servico_social");
              document.getElementById("status-final").innerHTML = getStatusBadge(solicitacaoAtual.status_final, "final");
              document.getElementById("status-pais").innerHTML = getStatusBadge(solicitacaoAtual.status_pais, "pais"); // Adicionado
              
              // Configurar botões de ação (buscar elementos aqui para garantir que existam)
              btnEnviarLink = document.getElementById("btn-enviar-link");
              btnStatusFinal = document.getElementById("btn-status-final");
              btnGerarPdf = document.getElementById("btn-gerar-pdf");
              
              // Remover listeners antigos e adicionar novos
              if(btnEnviarLink) {
                   btnEnviarLink.removeEventListener("click", enviarLinkPais);
                  btnEnviarLink.addEventListener("click", enviarLinkPais);
                  
                  // Sempre habilitar o botão de enviar/reenviar
                  btnEnviarLink.disabled = false;

                  // Adicionar botão de 'Ver Link' se já foi enviado
                  const acoesServicoSocialContainer = document.getElementById("acoes-servico-social");
                  if (solicitacaoAtual.data_envio_link_pais) {
                      btnEnviarLink.textContent = "Reenviar Link aos Pais";
                      // Remover botão 'Ver Link' antigo para evitar duplicação
                      let btnVerLinkExistente = document.getElementById("btn-ver-link");
                      if (btnVerLinkExistente) {
                          btnVerLinkExistente.remove();
                      }
                      const btnVerLink = document.createElement("button");
                      btnVerLink.id = "btn-ver-link";
                      btnVerLink.className = "btn btn-secondary mt-2";
                      btnVerLink.textContent = "Ver Link Enviado";
                      acoesServicoSocialContainer.appendChild(btnVerLink);
                  } else {
                      btnEnviarLink.textContent = "Enviar Link aos Pais";
                      // Remover botão 'Ver Link' se não houver link enviado
                      let btnVerLinkExistente = document.getElementById("btn-ver-link");
                      if (btnVerLinkExistente) {
                          btnVerLinkExistente.remove();
                      }
                  }
              }
              
              if(btnStatusFinal) {
                  btnStatusFinal.removeEventListener("click", definirStatusFinal);
                  btnStatusFinal.addEventListener("click", definirStatusFinal);
                  
                  // Habilitar o botão apenas se os pais já tomaram uma decisão
                  if (solicitacaoAtual.status_pais && solicitacaoAtual.status_servico_social === "Pendente") {
                      btnStatusFinal.disabled = false;
                      btnStatusFinal.textContent = "Definir Status Final";
                  } else {
                      btnStatusFinal.disabled = true;
                      btnStatusFinal.textContent = "Aguardando Decisão dos Pais";
                  }
              }
              
              if(btnGerarPdf) {
                  btnGerarPdf.removeEventListener("click", gerarRelatorioPdf);
                  btnGerarPdf.addEventListener("click", gerarRelatorioPdf);
                  
                  // Habilitar o botão apenas se a solicitação estiver finalizada
                  if (solicitacaoAtual.status_final === "Autorizado" || solicitacaoAtual.status_final === "Não Autorizado") {
                      btnGerarPdf.disabled = false;
                  } else {
                      btnGerarPdf.disabled = true;
                  }
              }
              
          } catch (error) {
              console.error("Erro ao carregar detalhes da solicitação:", error);
              detalhesContainer.innerHTML = `<p class="text-danger">Erro ao carregar detalhes: ${error.message}</p>`;
          }
      }
  
    async function enviarLinkPais() {
        if (!solicitacaoAtual) return;
        
        this.disabled = true;
        this.textContent = "Enviando...";
        
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
                link_pais: link, // Salvar o link gerado
                data_envio_link_pais: new Date().toISOString(),
                status_pais: "Pendente" // Resetar status dos pais
            };
            
            const resultado = await window.firebaseService.atualizarDocumento("solicitacoes", solicitacaoAtual.id, dadosAtualizacao);
            
            if (!resultado.sucesso) {
                throw new Error(resultado.erro || "Falha ao salvar token no Firestore.");
            }
            
            // Registrar na auditoria
            await window.auditoriaService.registrarEventoSistema("ENVIO_LINK_PAIS", solicitacaoAtual.id, { link: link });
            
            // Enviar via WhatsApp
            const mensagem = `O Serviço Social das Categorias de Base, informa que o(a) atleta ${solicitacaoAtual.nome} solicitou uma autorização para ${solicitacaoAtual.motivo_destino}. Para garantir a integridade do processo, solicitamos que acesse o link abaixo para avaliar e, se for o caso, aprovar ou reprovar a solicitação: ${link} Atenciosamente, Serviço Social do Sport Club Internacional.`;
            
            const linkWhatsApp = window.whatsAppService.gerarLinkWhatsApp(solicitacaoAtual.telefone_responsavel, mensagem);
            if (!linkWhatsApp) {
                throw new Error("Não foi possível gerar o link do WhatsApp.");
            }
            console.log("Mensagem para WhatsApp:", mensagem);
            window.open(linkWhatsApp, '_blank');
            
            // Atualizar dados locais
            solicitacaoAtual.token_aprovacao_pais = token;
            solicitacaoAtual.link_pais = link;
            solicitacaoAtual.data_envio_link_pais = dadosAtualizacao.data_envio_link_pais;
            
            // Atualizar UI
            carregarDetalhesSolicitacao(solicitacaoAtual.id);
            
        } catch (error) {
            console.error("Erro no processo de envio do link:", error);
            alert(`Erro ao enviar link: ${error.message}`);
            this.disabled = false;
            this.textContent = "Reenviar Link aos Pais";
        }
    }
  
    async function definirStatusFinal() {
        if (!solicitacaoAtual) return;
        
        const decisao = solicitacaoAtual.status_pais === "Aprovado" ? "Autorizado" : "Não Autorizado";
        
        this.disabled = true;
        this.textContent = "Atualizando...";
        
        try {
            const dadosAtualizacao = {
                status_servico_social: solicitacaoAtual.status_pais, // Reflete a decisão dos pais
                status_final: decisao,
                data_decisao_servico_social: new Date().toISOString()
            };
            
            const resultado = await window.firebaseService.atualizarDocumento("solicitacoes", solicitacaoAtual.id, dadosAtualizacao);
            
            if (!resultado.sucesso) {
                throw new Error(resultado.erro || "Falha ao atualizar status final.");
            }
            
            // Registrar na auditoria
            await window.auditoriaService.registrarEventoSistema("DEFINICAO_STATUS_FINAL", solicitacaoAtual.id, { status: decisao });
            
            alert(`Status final definido como '${decisao}' com sucesso!`);
            
            // Recarregar tudo para refletir as mudanças
            carregarTodasSolicitacoesDoFirestore();
            detalhesContainer.style.display = "none"; // Esconder detalhes após ação
            
        } catch (error) {
            console.error("Erro ao definir status final:", error);
            alert(`Erro ao definir status: ${error.message}`);
            this.disabled = false;
            this.textContent = "Definir Status Final";
        }
    }
  
    async function gerarRelatorioPdf() {
        if (!solicitacaoAtual) return;
        
        this.disabled = true;
        this.textContent = "Gerando PDF...";
        
        try {
            // Obter histórico de auditoria
            const resultadoAuditoria = await window.auditoriaService.obterHistoricoAuditoria(solicitacaoAtual.id);
            let historicoAuditoria = [];
            if (resultadoAuditoria.sucesso) {
                historicoAuditoria = resultadoAuditoria.dados;
            }
            
            // Gerar o PDF
            window.pdfService.gerarRelatorio(solicitacaoAtual, historicoAuditoria);
            
        } catch (error) {
            console.error("Erro ao gerar PDF:", error);
            alert(`Erro ao gerar relatório: ${error.message}`);
        } finally {
            this.disabled = false;
            this.textContent = "Gerar Relatório em PDF";
        }
    }
  
    // --- Inicialização ---
    if (filtroStatusSelect) {
        filtroStatusSelect.addEventListener("change", renderizarHistoricoValidacoes);
    }
  
    carregarTodasSolicitacoesDoFirestore();
});


