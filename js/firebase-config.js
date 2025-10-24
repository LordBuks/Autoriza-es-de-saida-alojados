
// Projeto Firebase: sistema-de-autorizacoes (autorizabasesaida)
// Configuração do Firebase para o Sistema de Autorizações

// Configuração do Firebase
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

// Verificar se o Firebase já foi inicializado
if (!firebase.apps.length) {
  try {
    firebase.initializeApp(firebaseConfig);
    console.log('Firebase inicializado com sucesso');
  } catch (error) {
    console.error('Erro ao inicializar Firebase:', error);
  }
} else {
  console.log('Firebase já estava inicializado');
}

// Classe para gerenciar operações do Firebase
class FirebaseService {
  constructor() {
    try {
      this.db = firebase.firestore();
      this.auth = firebase.auth();
      console.log("FirebaseService inicializado com sucesso");
      
      // Configurar persistência offline (opcional)
      this.db.enablePersistence({ synchronizeTabs: true })
        .then(() => {
          console.log('Persistência offline habilitada');
        })
        .catch((err) => {
          if (err.code === 'failed-precondition') {
            console.warn('Persistência falhou: múltiplas abas abertas');
          } else if (err.code === 'unimplemented') {
            console.warn('Persistência não suportada neste navegador');
          }
        });
        
    } catch (error) {
      console.error('Erro ao criar FirebaseService:', error);
      throw error;
    }
  }
  
  // Métodos para autenticação
  async loginComEmailSenha(email, senha) {
    try {
      const userCredential = await this.auth.signInWithEmailAndPassword(email, senha);
      return { sucesso: true, usuario: userCredential.user };
    } catch (error) {
      console.error('Erro no login:', error);
      return { sucesso: false, erro: error.message };
    }
  }
  
  async logout() {
    try {
      await this.auth.signOut();
      return { sucesso: true };
    } catch (error) {
      console.error('Erro no logout:', error);
      return { sucesso: false, erro: error.message };
    }
  }
  
  // Métodos para Firestore (banco de dados)
  async salvarDocumento(colecao, documento, id = null) {
    try {
      let docRef;
      
      if (id) {
        docRef = this.db.collection(colecao).doc(id);
        await docRef.set(documento, { merge: true });
      } else {
        docRef = await this.db.collection(colecao).add(documento);
      }
      
      return { sucesso: true, id: String(id || docRef.id) };
    } catch (error) {
      console.error(`Erro ao salvar documento em ${colecao}:`, error);
      return { sucesso: false, erro: error.message };
    }
  }
  
  async obterDocumento(colecao, id) {
    try {
      const doc = await this.db.collection(colecao).doc(id).get();
      
      if (doc.exists) {
        return { sucesso: true, dados: { id: doc.id, ...doc.data() } };
      } else {
        return { sucesso: false, erro: 'Documento não encontrado' };
      }
    } catch (error) {
      console.error(`Erro ao obter documento de ${colecao}:`, error);
      return { sucesso: false, erro: error.message };
    }
  }
  
  async obterDocumentos(colecao, filtros = []) {
    try {
      let query = this.db.collection(colecao);
      
      // Aplicar filtros se existirem
      filtros.forEach(filtro => {
        query = query.where(filtro.campo, filtro.operador, filtro.valor);
      });
      
      const snapshot = await query.get();
      const documentos = [];
      
      snapshot.forEach(doc => {
        documentos.push({ id: doc.id, ...doc.data() });
      });
      
      return { sucesso: true, dados: documentos };
    } catch (error) {
      console.error(`Erro ao obter documentos de ${colecao}:`, error);
      return { sucesso: false, erro: error.message };
    }
  }
  
  async atualizarDocumento(colecao, id, dados) {
    try {
      await this.db.collection(colecao).doc(id).update(dados);
      return { sucesso: true };
    } catch (error) {
      console.error(`Erro ao atualizar documento em ${colecao}:`, error);
      return { sucesso: false, erro: error.message };
    }
  }
  
  async excluirDocumento(colecao, id) {
    try {
      await this.db.collection(colecao).doc(id).delete();
      return { sucesso: true };
    } catch (error) {
      console.error(`Erro ao excluir documento de ${colecao}:`, error);
      return { sucesso: false, erro: error.message };
    }
  }
  
  // Método para ouvir mudanças em tempo real
  observarDocumentos(colecao, filtros = [], callback) {
    try {
      let query = this.db.collection(colecao);
      
      // Aplicar filtros se existirem
      filtros.forEach(filtro => {
        query = query.where(filtro.campo, filtro.operador, filtro.valor);
      });
      
      // Retornar o unsubscribe para que possa ser cancelado posteriormente
      return query.onSnapshot(snapshot => {
        const documentos = [];
        snapshot.forEach(doc => {
          documentos.push({ id: doc.id, ...doc.data() });
        });
        callback({ sucesso: true, dados: documentos });
      }, error => {
        console.error(`Erro ao observar documentos em ${colecao}:`, error);
        callback({ sucesso: false, erro: error.message });
      });
    } catch (error) {
      console.error(`Erro ao configurar observador para ${colecao}:`, error);
      callback({ sucesso: false, erro: error.message });
      return () => {}; // Retornar uma função vazia como fallback
    }
  }
}

// Criar e expor a instância do serviço globalmente
try {
  window.firebaseService = new FirebaseService();
  console.log('FirebaseService exposto globalmente com sucesso');
} catch (error) {
  console.error('Erro ao criar instância global do FirebaseService:', error);
}

// Função auxiliar para formatar data e hora
function formatarDataHora(data, hora = null) {
  if (!data) return "N/A";
  
  try {
    let dataObj;
    
    // Se for um timestamp do Firebase
    if (data && typeof data.toDate === 'function') {
      dataObj = data.toDate();
    } else if (data instanceof Date) {
      dataObj = data;
    } else if (typeof data === 'string') {
      dataObj = new Date(data);
    } else {
      return "N/A";
    }
    
    const opcoes = { 
      day: "2-digit", 
      month: "2-digit", 
      year: "numeric"
    };
    
    let resultado = dataObj.toLocaleDateString("pt-BR", opcoes);
    
    if (hora) {
      resultado += ` às ${hora}`;
    } else {
      const opcoesHora = { 
        hour: "2-digit", 
        minute: "2-digit",
        hour12: false
      };
      resultado += ` às ${dataObj.toLocaleTimeString("pt-BR", opcoesHora)}`;
    }
    
    return resultado;
  } catch (error) {
    console.error('Erro ao formatar data/hora:', error);
    return "N/A";
  }
}

// Expor função auxiliar globalmente
window.formatarDataHora = formatarDataHora;

