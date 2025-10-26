import { initializeApp } from 'firebase/app';
import { getApps, getApp } from 'firebase/app';
import { getFirestore, collection, doc, getDoc, setDoc, updateDoc, deleteDoc, query, where, onSnapshot, getDocs } from 'firebase/firestore';
import { getAuth, signInWithEmailAndPassword, signOut } from 'firebase/auth';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

console.log('Firebase Config:', firebaseConfig);

let app;
let db;
let auth;

try {
  app = (!getApps().length ? initializeApp(firebaseConfig) : getApp());
  db = getFirestore(app);
  auth = getAuth(app);
  console.log('Firebase inicializado com sucesso');
} catch (error: any) {
  console.error('Erro ao inicializar o Firebase App:', error);
  throw new Error('Falha na inicialização do Firebase: ' + error.message);
}

export class FirebaseService {
  db: any;
  auth: any;

  constructor() {
    this.db = db;
    this.auth = auth;
    console.log("FirebaseService inicializado com sucesso");
  }
  
  async loginComEmailSenha(email: string, senha: string) {
    try {
      const userCredential = await signInWithEmailAndPassword(this.auth, email, senha);
      return { sucesso: true, usuario: userCredential.user };
    } catch (error: any) {
      console.error('Erro no login:', error);
      return { sucesso: false, codigoErro: error.code, mensagemErro: error.message };
    }
  }
  
  async logout() {
    try {
      await signOut(this.auth);
      return { sucesso: true };
    } catch (error: any) {
      console.error('Erro no logout:', error);
      return { sucesso: false, codigoErro: error.code, mensagemErro: error.message };
    }
  }
  
  async salvarDocumento(colecao: string, documento: any, id: string | null = null) {
    try {
      let docRef;
      const colRef = collection(this.db, colecao);
      
      if (id) {
        docRef = doc(colRef, id);
        await setDoc(docRef, documento, { merge: true });
      } else {
        docRef = doc(colRef);
        await setDoc(docRef, documento);
      }
      
      return { sucesso: true, id: String(id || docRef.id) };
    } catch (error: any) {
      console.error(`Erro ao salvar documento em ${colecao}:`, error);
      return { sucesso: false, codigoErro: error.code, mensagemErro: error.message };
    }
  }
  
  async obterDocumento(colecao: string, id: string) {
    try {
      const docRef = doc(this.db, colecao, id);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return { sucesso: true, dados: { id: docSnap.id, ...docSnap.data() } };
      } else {
        return { sucesso: false, erro: 'Documento não encontrado' };
      }
    } catch (error: any) {
      console.error(`Erro ao obter documento de ${colecao}:`, error);
      return { sucesso: false, codigoErro: error.code, mensagemErro: error.message };
    }
  }
  
  async obterDocumentos(colecao: string, filtros: Array<{ campo: string, operador: any, valor: any }> = []) {
    try {
      let q: any = collection(this.db, colecao);
      
      filtros.forEach(filtro => {
        q = query(q, where(filtro.campo, filtro.operador, filtro.valor));
      });
      
      const querySnapshot = await getDocs(q);
      const documentos: any[] = [];
      
      querySnapshot.forEach(doc => {
        documentos.push({ id: doc.id, ...doc.data() });
      });
      
      return { sucesso: true, dados: documentos };
    } catch (error: any) {
      console.error(`Erro ao obter documentos de ${colecao}:`, error);
      return { sucesso: false, codigoErro: error.code, mensagemErro: error.message };
    }
  }
  
  async atualizarDocumento(colecao: string, id: string, dados: any) {
    try {
      const docRef = doc(this.db, colecao, id);
      await updateDoc(docRef, dados);
      return { sucesso: true };
    } catch (error: any) {
      console.error(`Erro ao atualizar documento em ${colecao}:`, error);
      return { sucesso: false, codigoErro: error.code, mensagemErro: error.message };
    }
  }
  
  async excluirDocumento(colecao: string, id: string) {
    try {
      const docRef = doc(this.db, colecao, id);
      await deleteDoc(docRef);
      return { sucesso: true };
    } catch (error: any) {
      console.error(`Erro ao excluir documento de ${colecao}:`, error);
      return { sucesso: false, codigoErro: error.code, mensagemErro: error.message };
    }
  }
  
  observarDocumentos(colecao: string, filtros: Array<{ campo: string, operador: any, valor: any }> = [], callback: Function) {
    try {
      let q: any = collection(this.db, colecao);
      
      filtros.forEach(filtro => {
        q = query(q, where(filtro.campo, filtro.operador, filtro.valor));
      });
      
      return onSnapshot(q, (snapshot) => {
        const documentos: any[] = [];
        snapshot.forEach(doc => {
          documentos.push({ id: doc.id, ...doc.data() });
        });
        callback({ sucesso: true, dados: documentos });
      }, (error: any) => {
        console.error(`Erro ao observar documentos em ${colecao}:`, error);
        callback({ sucesso: false, erro: error.message });
      });
    } catch (error: any) {
      console.error(`Erro ao configurar observador para ${colecao}:`, error);
      callback({ sucesso: false, erro: error.message });
      return () => {};
    }
  }
}

export const firebaseService = new FirebaseService();

export function formatarDataHora(data: any, hora: string | null = null) {
  if (!data) return "N/A";
  
  try {
    let dataObj: Date;
    
    if (data && typeof data.toDate === 'function') {
      dataObj = data.toDate();
    } else if (data instanceof Date) {
      dataObj = data;
    } else if (typeof data === 'string') {
      dataObj = new Date(data);
    } else {
      return "N/A";
    }
    
    const opcoes: Intl.DateTimeFormatOptions = { 
      day: "2-digit", 
      month: "2-digit", 
      year: "numeric"
    };
    
    let resultado = dataObj.toLocaleDateString("pt-BR", opcoes);
    
    if (hora) {
      resultado += ` às ${hora}`;
    } else {
      const opcoesHora: Intl.DateTimeFormatOptions = { 
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




// Exposição global para compatibilidade com scripts JS antigos
declare global { interface Window { firebaseService: any } }
if (typeof window !== 'undefined') { (window as any).firebaseService = firebaseService; }

export default firebaseService;

// Sinalizar que o serviço Firebase está pronto
try { document.dispatchEvent(new Event('firebase-ready')); } catch (e) {}

export { Timestamp };
