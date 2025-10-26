// Lógica para o painel do monitor - VERSÃO CORRIGIDA
document.addEventListener("DOMContentLoaded", async function() {
  const solicitacoesPreAprovadasContainer = document.getElementById("solicitacoes-pre-aprovadas");
  const todasSolicitacoesContainer = document.getElementById("todas-solicitacoes");
  const arquivosContainer = document.getElementById("arquivos");
  const filtroStatusSelect = document.getElementById("filtro-status");
  const filtroCategoriaSelect = document.getElementById("filtro-categoria");
  const filtroDataInput = document.getElementById("filtro-data");
  
  // Contadores
  const countPendentes = document.getElementById("count-pendentes");
  const countAprovadas = document.getElementById("count-aprovadas");
  const countReprovadas = document.getElementById("count-reprovadas");

  let todasSolicitacoesCache = [];

  // --- Verificação de Dependências e Autenticação ---
  if (!window.firebaseService) {
      console.error("Erro crítico: FirebaseService não está disponível.");
      mostrarErro(todasSolicitacoesContainer, "Erro ao carregar serviços. Tente recarregar a página.");
      mostrarErro(solicitacoesPreAprovadasContainer, "Erro ao carregar serviços.");
      mostrarErro(arquivosContainer, "Erro ao carregar serviços.");
      return;
  }

  // Aguardar autenticação antes de prosseguir
  await aguardarAutenticacao();

  // --- Funções Auxiliares ---
  function aguardarAutenticacao() {
    return new Promise((resolve) => {
      const verificarAuth = () => {
        const user = firebase.auth().currentUser;
        if (user) {
          console.log("Usuário autenticado:", user.email);
          resolve();
        } else {
          console.log("Aguardando autenticação...");
          setTimeout(verificarAuth, 500);
        }
      };
      
      // Verificar se já está autenticado
      if (firebase.auth().currentUser) {
        console.log("Usuário já autenticado:", firebase.auth().currentUser.email);
        resolve();
      } else {
        // Aguardar mudança no estado de autenticação
        firebase.auth().onAuthStateChanged((user) => {
          if (user) {
            console.log("Estado de autenticação mudou - usuário logado:", user.email);
            resolve();
          }
        });
        
        // Fallback: verificar periodicamente
        setTimeout(verificarAuth, 1000);
      }
    });
  }

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

  function getStatusBadge(solicitacao) {
      let statusText = solicitacao.status_final || "Em Análise";
      let badgeClass = "bg-warning text-dark";

      if (statusText === "Aprovado" || statusText === "Autorizado") {
          badgeClass = "bg-success";
          statusText = "Aprovado";
      } else if (statusText === "Reprovado" || statusText === "Não Autorizado") {
          badgeClass = "bg-danger";
          statusText = "Reprovado";
      } else if (solicitacao.status_supervisor === "Aprovado" && solicitacao.status_servico_social === "Pendente") {
          statusText = "Pré-Aprovado";
      }
      return `<span class="badge ${badgeClass}">${statusText}</span>`;
  }

  // --- Funções Principais ---
  async function carregarTodasSolicitacoesDoFirestore() {
      mostrarLoading(todasSolicitacoesContainer, "Carregando todas as solicitações...");
      mostrarLoading(solicitacoesPreAprovadasContainer, "Carregando solicitações pré-aprovadas...");
      mostrarLoading(arquivosContainer, "Carregando arquivos...");
      
      try {
          // Verificar autenticação antes da chamada
          const user = firebase.auth().currentUser;
          if (!user) {
              throw new Error("Usuário não autenticado. Faça login novamente.");
          }
          
          console.log("Fazendo chamada ao Firestore para usuário:", user.email);
          const resultado = await window.firebaseService.obterDocumentos("solicitacoes");
          
          if (resultado.sucesso) {
              todasSolicitacoesCache = resultado.dados;
              console.log("Solicitações carregadas do Firestore:", todasSolicitacoesCache.length, "documentos");
              aplicarFiltrosERenderizar();
              atualizarContadores();
              renderizarSolicitacoesPreAprovadas(); 
              renderizarArquivos();
          } else {
              throw new Error(resultado.erro || "Falha ao buscar solicitações.");
          }
      } catch (error) {
          console.error("Erro ao carregar todas as solicitações do Firestore:", error);
          const mensagemErro = `Erro ao carregar solicitações: ${error.message}`;
          mostrarErro(todasSolicitacoesContainer, mensagemErro);
          mostrarErro(solicitacoesPreAprovadasContainer, "Erro ao carregar solicitações.");
          mostrarErro(arquivosContainer, "Erro ao carregar solicitações.");
          
          // Se for erro de autenticação, redirecionar para login
          if (error.message.includes("autenticado") || error.message.includes("permission")) {
              setTimeout(() => {
                  alert("Sessão expirada. Redirecionando para o login.");
                  window.location.href = "../../index.html";
              }, 2000);
          }
      }
  }

  function aplicarFiltrosERenderizar() {
      if (!todasSolicitacoesContainer) return;

      let filtradas = [...todasSolicitacoesCache];
      const statusFiltro = filtroStatusSelect ? filtroStatusSelect.value : "todos";
      const categoriaFiltro = filtroCategoriaSelect ? filtroCategoriaSelect.value : "todas";

      // Filtro de status
      if (statusFiltro !== "todos") {
          filtradas = filtradas.filter(s => {
              const finalStatus = s.status_final ? s.status_final.toLowerCase() : "em análise";
              const supervisorStatus = s.status_supervisor ? s.status_supervisor.toLowerCase() : "pendente";
              const servicoSocialStatus = s.status_servico_social ? s.status_servico_social.toLowerCase() : "pendente";

              if (statusFiltro === "pendente") return supervisorStatus === "pendente" || finalStatus === "em análise";
              if (statusFiltro === "pre-aprovado") return supervisorStatus === "aprovado" && servicoSocialStatus === "pendente";
              if (statusFiltro === "aprovado") return finalStatus === "aprovado" || finalStatus === "autorizado";
              if (statusFiltro === "reprovado") return finalStatus === "reprovado" || finalStatus === "não autorizado";
              return false;
          });
      }

      // Filtro de categoria
      if (categoriaFiltro !== "todas") {
          filtradas = filtradas.filter(s => s.categoria === categoriaFiltro);
      }

      // Ordenar por data de solicitação (mais recentes primeiro)
      filtradas.sort((a, b) => new Date(b.data_solicitacao) - new Date(a.data_solicitacao));

      if (filtradas.length === 0) {
          todasSolicitacoesContainer.innerHTML = 
              `<p class="text-center">Nenhuma solicitação encontrada com os filtros aplicados.</p>`;
          return;
      }

      // Construir o HTML da tabela
      const html = `
        <table class="table table-striped table-hover">
          <thead>
            <tr>
              <th>Código</th>
              <th>Atleta</th>
              <th>Categoria</th>
              <th>Data Solicitação</th>
              <th>Status</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            ${filtradas.map(s => `
              <tr>
                <td>${s.id || "N/A"}</td>
                <td>${s.nome || "N/A"}</td>
                <td>${s.categoria || "N/A"}</td>
                <td>${formatarData(s.data_solicitacao)}</td>
                <td>${getStatusBadge(s)}</td>
                <td><a href="detalhe.html?id=${s.id}" class="btn btn-primary btn-sm">Ver</a></td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      `;
      todasSolicitacoesContainer.innerHTML = html;
  }

  function renderizarSolicitacoesPreAprovadas() {
      if (!solicitacoesPreAprovadasContainer) return;

      const preAprovadas = todasSolicitacoesCache.filter(s => 
          s.status_supervisor === "Aprovado" && 
          s.status_servico_social === "Pendente"
      );

      if (preAprovadas.length === 0) {
          solicitacoesPreAprovadasContainer.innerHTML = 
              `<p class="text-center">Nenhuma solicitação pré-aprovada encontrada.</p>`;
          return;
      }

      const html = preAprovadas.map(s => `
          <div class="card mb-3">
            <div class="card-body">
              <h5 class="card-title">${s.nome || "N/A"} • ${s.categoria || "N/A"}</h5>
              <p class="card-text mb-1"><strong>Destino:</strong> ${s.motivo_destino || "N/A"}</p>
              <p class="card-text mb-1"><strong>Período:</strong> ${formatarData(s.data_saida)} ${s.horario_saida || ""} até ${formatarData(s.data_retorno)} ${s.horario_retorno || ""}</p>
              <p class="card-text"><strong>Responsável:</strong> ${s.nome_responsavel || "N/A"} - ${s.telefone_responsavel || "N/A"}</p>
              <a href="detalhe.html?id=${s.id}" class="btn btn-primary mt-2">Ver Detalhes</a>
            </div>
          </div>
      `).join("");
      solicitacoesPreAprovadasContainer.innerHTML = html;
  }

  function renderizarArquivos() {
      if (!arquivosContainer) return;
      
      let filtrados = todasSolicitacoesCache.filter(s => 
          s.status_final === "Aprovado" || 
          s.status_final === "Autorizado" ||
          s.status_final === "Reprovado" || 
          s.status_final === "Não Autorizado"
      );

      const dataFiltro = filtroDataInput ? filtroDataInput.value : null;

      if (dataFiltro) {
          const dataFiltroObj = new Date(dataFiltro);
          dataFiltroObj.setHours(0, 0, 0, 0);
          filtrados = filtrados.filter(a => {
              const dataFinalizacao = new Date(a.data_solicitacao);
              dataFinalizacao.setHours(0, 0, 0, 0);
              return dataFinalizacao.getTime() === dataFiltroObj.getTime();
          });
      }

      filtrados.sort((a, b) => new Date(b.data_solicitacao) - new Date(a.data_solicitacao));

      if (filtrados.length === 0) {
          arquivosContainer.innerHTML = 
              `<p class="text-center">Nenhum arquivo encontrado com os filtros aplicados.</p>`;
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
              <th>Status</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            ${filtrados.map(a => `
              <tr>
                <td>${a.id || "N/A"}</td>
                <td>${a.nome || "N/A"}</td>
                <td>${a.categoria || "N/A"}</td>
                <td>${formatarData(a.data_solicitacao)}</td>
                <td>${getStatusBadge(a)}</td> 
                <td><a href="detalhe.html?id=${a.id}" class="btn btn-primary btn-sm">Ver</a></td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      `;
      arquivosContainer.innerHTML = html;
  }

  function atualizarContadores() {
      if (!countPendentes || !countAprovadas || !countReprovadas) return;

      const pendentes = todasSolicitacoesCache.filter(s => 
          (s.status_supervisor === "Pendente") || 
          (s.status_supervisor === "Aprovado" && s.status_servico_social === "Pendente") ||
          (s.status_final === "Em Análise")
      ).length;
      
      const aprovadas = todasSolicitacoesCache.filter(s => 
          s.status_final === "Aprovado" || s.status_final === "Autorizado"
      ).length;
      
      const reprovadas = todasSolicitacoesCache.filter(s => 
          s.status_final === "Reprovado" || s.status_final === "Não Autorizado"
      ).length;
      
      countPendentes.textContent = pendentes;
      countAprovadas.textContent = aprovadas;
      countReprovadas.textContent = reprovadas;
  }

  // --- Inicialização e Eventos ---
  if (filtroStatusSelect) {
      filtroStatusSelect.addEventListener("change", aplicarFiltrosERenderizar);
  }
  if (filtroCategoriaSelect) {
      filtroCategoriaSelect.addEventListener("change", aplicarFiltrosERenderizar);
  }
  if (filtroDataInput) {
      filtroDataInput.addEventListener("change", renderizarArquivos);
  }

  // Carregar os dados iniciais do Firestore
  await carregarTodasSolicitacoesDoFirestore();
});

