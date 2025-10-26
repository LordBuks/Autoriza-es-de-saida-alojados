// Lógica de login e autenticação com Firebase Authentication (VFx33)
document.addEventListener("DOMContentLoaded", function () {
  const loginForm = document.getElementById("loginForm");
  const alertMessage = document.getElementById("errorMessage");
  const emailInput = document.getElementById("email");
  const senhaInput = document.getElementById("senha");
  const loginBtnText = document.getElementById("loginBtnText");
  const loginSpinner = document.getElementById("loginSpinner");

  // Verificar se o Firebase Service está disponível
  if (!window.firebaseService) {
    console.error("Firebase Service não encontrado! A autenticação não funcionará.");
    showAlert("Erro crítico: Serviço de autenticação indisponível.");
    if(loginForm) {
        loginForm.querySelectorAll("input, select, button").forEach(el => el.disabled = true);
    }
    return;
  }

  // Mapeamento de perfis para redirecionamento
  const profileRedirects = {
    admin: "templates/supervisor/dashboard.html", //  const profileRedirects = {
    admin: "templates/supervisor/dashboard.html", // Redirecionamento para admin
    atleta: "templates/atleta/dashboard.html",
    supervisor: "templates/supervisor/dashboard.html",
    servico_social: "templates/servico_social/dashboard.html",
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
        const resultadoLogin = await window.firebaseService.loginComEmailSenha(email, password);

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
                const dadosUsuario = await window.firebaseService.obterDocumento("usuarios", user.uid);
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
            await window.firebaseService.logout();
          }

        } else {
          // Falha no login do Firebase Auth
          console.error("Falha na autenticação Firebase:", resultadoLogin.erro);
          let mensagemErro = "Credenciais inválidas. Verifique seu email e senha.";
          if (resultadoLogin.erro && resultadoLogin.erro.includes("auth/user-not-found")) {
              mensagemErro = "Usuário não encontrado.";
          } else if (resultadoLogin.erro && resultadoLogin.erro.includes("auth/wrong-password")) {
              mensagemErro = "Senha incorreta.";
          } else if (resultadoLogin.erro && resultadoLogin.erro.includes("auth/invalid-credential")) {
              mensagemErro = "Credenciais inválidas.";
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
  async function verificarPerfilUsuario(uid) {
    try {
      const resultadoDoc = await window.firebaseService.obterDocumento("usuarios", uid);
      if (resultadoDoc.sucesso && resultadoDoc.dados && resultadoDoc.dados.perfil) {
        return resultadoDoc.dados.perfil;
      } else {
        console.warn(`Documento do usuário ${uid} não encontrado na coleção 'usuarios' ou sem campo 'perfil'.`);
        return null;
      }
    } catch (error) {
      console.error(`Erro ao buscar perfil do usuário ${uid} no Firestore:`, error);
      return null;
    }
  }

  // Função para salvar informações da sessão no localStorage
  function saveSession(profile, email, uid) {
    const session = {
      profile: profile,
      email: email,
      uid: uid,
      loginTime: new Date().toISOString(),
    };
    localStorage.setItem("current_session", JSON.stringify(session));
  }

  // Função para mostrar alertas
  function showAlert(message, type = "alert-danger") {
    if (alertMessage) {
      alertMessage.textContent = message;
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
  function redirectToProfile(url) {
    if (url) {
      window.location.href = url;
    } else {
      console.error("URL de redirecionamento não definida para este perfil.");
      showAlert("Login bem-sucedido, mas não foi possível redirecionar.");
    }
  }
});
