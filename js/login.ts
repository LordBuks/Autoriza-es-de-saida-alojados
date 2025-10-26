import { firebaseService } from './firebase-config.ts';

// Lógica de login e autenticação com Firebase Authentication (VFx33)
document.addEventListener("DOMContentLoaded", function () {
  const loginForm = document.getElementById("loginForm");
  const alertMessage = document.getElementById("errorMessage");
  const emailInput = document.getElementById("email") as HTMLInputElement;
  const senhaInput = document.getElementById("senha") as HTMLInputElement;
  const loginBtnText = document.getElementById("loginBtnText");
  const loginSpinner = document.getElementById("loginSpinner");

  // Mapeamento de perfis para redirecionamento
  const profileRedirects: { [key: string]: string } = {
    admin: "templates/supervisor/dashboard.html", // Redirecionamento para admin
    atleta: "templates/atleta/dashboard.html",
    supervisor: "templates/supervisor/dashboard.html",
    servicosocial: "templates/servico_social/dashboard.html",
    monitor: "templates/monitor/dashboard.html",
  };

  if (loginForm) {
    loginForm.addEventListener("submit", async function (e) {
      e.preventDefault();
      hideAlert();

      const email = emailInput.value;
      const password = senhaInput.value;

      if (!email || !password) {
        showAlert("Por favor, preencha todos os campos: Email e Senha.");
        return;
      }

      // Mostrar spinner e ocultar texto do botão
      if (loginBtnText) loginBtnText.style.display = "none";
      if (loginSpinner) loginSpinner.style.display = "inline-block";

      try {
        const resultadoLogin = await firebaseService.loginComEmailSenha(email, password);

        if (resultadoLogin.sucesso && resultadoLogin.usuario) {
          const user = resultadoLogin.usuario;

          // Verificação no Firestore para determinar o perfil do usuário
          const perfilFirestore = await verificarPerfilUsuario(user.uid);

          if (perfilFirestore) {
            // Perfil encontrado! Login autorizado.
            hideAlert();
            console.log(`Login bem-sucedido para ${email} com perfil ${perfilFirestore}`);

            // Salvar informações da sessão
            saveSession(perfilFirestore, email, user.uid);

            // Salvar categoria no localStorage se for supervisor
            if (perfilFirestore === 'supervisor') {
                const dadosUsuario = await firebaseService.obterDocumento("usuarios", user.uid);
                if (dadosUsuario.sucesso && dadosUsuario.dados.categoria) {
                    localStorage.setItem('supervisor_categoria', dadosUsuario.dados.categoria);
                    console.log(`Categoria do supervisor (${dadosUsuario.dados.categoria}) salva no localStorage.`);
                } else {
                    console.warn(`Não foi possível obter a categoria para o supervisor ${email}`);
                }
            }

            // Redirecionar para o dashboard correspondente
            redirectToProfile(profileRedirects[perfilFirestore]);

          } else {
            // Usuário autenticado, mas não foi possível verificar o perfil no Firestore
            console.error(`Usuário ${email} autenticado, mas não foi encontrado registro na coleção 'usuarios' ou houve erro ao buscar.`);
            showAlert("Usuário autenticado, mas houve um problema ao verificar seu perfil. Verifique se seu cadastro está completo no sistema ou contate o suporte.");
            await firebaseService.logout();
          }

        } else {
          // Falha no login do Firebase Auth
          console.error("Falha na autenticação Firebase:", resultadoLogin.mensagemErro);
          let mensagemErro = "Credenciais inválidas. Verifique seu email e senha.";
          const codigo = resultadoLogin.codigoErro;

          if (codigo === "auth/user-not-found") {
              mensagemErro = "Usuário não encontrado.";
          } else if (codigo === "auth/wrong-password") {
              mensagemErro = "Senha incorreta.";
          } else if (codigo === "auth/invalid-credential") {
              mensagemErro = "Credenciais inválidas.";
          } else if (codigo === "auth/invalid-email") {
              mensagemErro = "Formato de email inválido.";
          } else if (codigo === "auth/user-disabled") {
              mensagemErro = "Usuário desativado.";
          } else {
              // Se o erro for outro (ex: auth/invalid-api-key, network-request-failed)
              mensagemErro = "Erro de autenticação: " + (resultadoLogin.mensagemErro || "Erro desconhecido.");
          }
          showAlert(mensagemErro);
        }
      } catch (error) {
        console.error("Erro inesperado durante o login:", error);
        showAlert("Ocorreu um erro inesperado durante a autenticação. Tente novamente.");
      } finally {
        // Restaurar botão ao estado original
        if (loginBtnText) loginBtnText.style.display = "inline";
        if (loginSpinner) loginSpinner.style.display = "none";
      }
    });
  }

  // Função para verificar o perfil do usuário no Firestore
  async function verificarPerfilUsuario(uid: string) {
    try {
      const resultadoDoc = await firebaseService.obterDocumento("usuarios", uid);
      if (resultadoDoc.sucesso && resultadoDoc.dados && resultadoDoc.dados.perfil) {
        return resultadoDoc.dados.perfil;
      } else {
        console.warn(`Documento do usuário ${uid} não encontrado na coleção 'usuarios' ou sem campo 'perfil'.`);
        return null;
      }
    } catch (error) {
      console.error(`Erro ao buscar perfil do usuário ${uid} no Firestore:`, error);
      throw error; // Lança o erro para ser capturado pelo try/catch principal
    }
  }

  // Função para salvar informações da sessão no localStorage
  function saveSession(profile: string, email: string, uid: string) {
    const session = {
      profile: profile,
      email: email,
      uid: uid,
      loginTime: new Date().toISOString(),
    };
    localStorage.setItem("VITE_current_session", JSON.stringify(session));
  }

  // Função para mostrar alertas
  function showAlert(message: string, type = "alert-danger") {
    if (alertMessage) {
      alertMessage.textContent = message;
      alertMessage.className = `alert ${type}`;
      alertMessage.style.display = "block";
    } else {
        alert(message);
    }
  }

  // Função para esconder alertas
  function hideAlert() {
      if(alertMessage) {
          alertMessage.style.display = "none";
      }
  }

  // Função para redirecionar
  function redirectToProfile(url: string) {
    if (url) {
      window.location.href = url;
    } else {
      console.error("URL de redirecionamento não definida para este perfil.");
      showAlert("Login bem-sucedido, mas não foi possível redirecionar.");
    }
  }
});

// Expor a função logout globalmente para uso em outros arquivos HTML/JS que não são módulos
(window as any).logout = async () => {
  try {
    await firebaseService.logout();
    localStorage.removeItem("VITE_current_session");
    localStorage.removeItem("supervisor_categoria");
    window.location.href = "/index.html"; // Redirecionar para a página de login
  } catch (error) {
    console.error("Erro ao fazer logout:", error);
    alert("Erro ao fazer logout. Tente novamente.");
  }
};
