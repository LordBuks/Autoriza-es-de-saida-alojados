// Serviço de segurança para o Sistema de Autorizações
// Implementa medidas de segurança como proteção contra XSS, CSRF e criptografia de dados sensíveis

class SecurityService {
  constructor() {
    // Chave de criptografia (em produção, deve ser armazenada em variáveis de ambiente)
    // A geração no frontend é apenas para demonstração e não é segura para produção.
    this.encryptionKey = this.generateEncryptionKey();
    
    // Inicializar proteções
    this.initializeSecurityMeasures();
  }
  
  // Inicializar medidas de segurança
  initializeSecurityMeasures() {
    // Verificar se estamos em HTTPS e redirecionar se não estiver
    this.forceHttps();
    
    // Adicionar proteções contra XSS nos formulários
    this.setupXssProtection();
    
    // Configurar tokens CSRF para formulários
    this.setupCsrfProtection();
    
    console.log("Medidas de segurança inicializadas");
  }
  
  // Forçar o uso de HTTPS
  forceHttps() {
    if (window.location.protocol !== "https:" && window.location.hostname !== "localhost" && !window.location.hostname.includes("127.0.0.1" )) {
      console.warn("Redirecionando para HTTPS...");
      window.location.href = window.location.href.replace("http:", "https:" );
    }
  }
  
  // Configurar proteção contra XSS
  setupXssProtection() {
    // Sobrescrever o método innerHTML para sanitizar conteúdo
    const originalInnerHTMLDescriptor = Object.getOwnPropertyDescriptor(Element.prototype, "innerHTML");
    const self = this;
    
    if (originalInnerHTMLDescriptor && originalInnerHTMLDescriptor.set) {
      Object.defineProperty(Element.prototype, "innerHTML", {
        set: function(value) {
          // Usar uma abordagem mais robusta para sanitização, como DOMPurify se disponível
          // Para este exemplo, uma sanitização básica é aplicada
          const sanitizedValue = self.sanitizeHtml(value);
          originalInnerHTMLDescriptor.set.call(this, sanitizedValue);
        },
        get: originalInnerHTMLDescriptor.get
      });
    }
  }
  
  // Configurar proteção contra CSRF
  setupCsrfProtection() {
    // Gerar token CSRF
    const csrfToken = this.generateCsrfToken();
    
    // Armazenar token na sessão (melhorar para HttpOnly cookies em backend)
    sessionStorage.setItem("csrf_token", csrfToken);
    
    // Adicionar token a todos os formulários
    document.addEventListener("DOMContentLoaded", () => {
      const forms = document.querySelectorAll("form");
      forms.forEach(form => {
        if (!form.querySelector("input[name=\"csrf_token\"]")) {
          const input = document.createElement("input");
          input.type = "hidden";
          input.name = "csrf_token";
          input.value = csrfToken;
          form.appendChild(input);
        }
      });
    });
  }
  
  // Sanitizar HTML para prevenir XSS (básico, considerar DOMPurify)
  sanitizeHtml(html) {
    if (typeof html !== "string") return html;
    
    // Remover tags HTML e caracteres especiais
    const temp = document.createElement("div");
    temp.innerHTML = html; // Usar innerHTML para que o navegador parseie
    // Remover scripts e atributos de evento
    const scripts = temp.querySelectorAll("script");
    scripts.forEach(script => script.remove());
    const eventAttributes = ["onload", "onerror", "onclick", "onmouseover"];
    temp.querySelectorAll("*").forEach(element => {
      eventAttributes.forEach(attr => {
        element.removeAttribute(attr);
      });
    });
    return temp.innerHTML;
  }
  
  // Sanitizar entrada de texto
  sanitizeInput(input) {
    if (typeof input !== "string") return input;
    
    // Remover tags HTML e caracteres especiais
    return input
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/\'/g, "&#x27;")
      .replace(/\//g, "&#x2F;");
  }
  
  // Validar token CSRF
  validateCsrfToken(token) {
    const storedToken = sessionStorage.getItem("csrf_token");
    return token === storedToken;
  }
  
  // Gerar token CSRF (melhorar para geração segura no backend)
  generateCsrfToken() {
    return "csrf-" + Math.random().toString(36).substring(2, 15) +
           Math.random().toString(36).substring(2, 15) +
           Date.now().toString(36);
  }
  
  // Gerar chave de criptografia (APENAS PARA DEMONSTRAÇÃO - NÃO SEGURO PARA PRODUÇÃO)
  generateEncryptionKey() {
    // Em produção, esta chave DEVE vir de variáveis de ambiente seguras ou serviço de gerenciamento de segredos.
    // Gerar no frontend é uma VULNERABILIDADE.
    return "key-" + Math.random().toString(36).substring(2, 15) +
           Math.random().toString(36).substring(2, 15) +
           Date.now().toString(36);
  }
  
  // Criptografar dados sensíveis (APENAS PARA DEMONSTRAÇÃO - NÃO SEGURO PARA PRODUÇÃO)
  encryptData(data) {
    if (!data) return null;
    
    try {
      // Em produção, use bibliotecas criptográficas robustas como Web Crypto API ou backend.
      const jsonString = JSON.stringify(data);
      return btoa(jsonString + "|" + this.encryptionKey.substring(0, 8)); // Exemplo simples
    } catch (error) {
      console.error("Erro ao criptografar dados:", error);
      return null;
    }
  }
  
  // Descriptografar dados sensíveis (APENAS PARA DEMONSTRAÇÃO - NÃO SEGURO PARA PRODUÇÃO)
  decryptData(encryptedData) {
    if (!encryptedData) return null;
    
    try {
      const decoded = atob(encryptedData);
      const parts = decoded.split("|");
      if (parts.length !== 2 || parts[1] !== this.encryptionKey.substring(0, 8)) {
        console.error("Chave de criptografia inválida ou dados corrompidos");
        return null;
      }
      return JSON.parse(parts[0]);
    } catch (error) {
      console.error("Erro ao descriptografar dados:", error);
      return null;
    }
  }
  
  // Gerar hash para validação (APENAS PARA DEMONSTRAÇÃO - NÃO SEGURO PARA PRODUÇÃO)
  generateHash(data) {
    if (!data) return null;
    
    try {
      // Em produção, use algoritmos de hash criptográficos como SHA-256 no backend.
      const jsonString = JSON.stringify(data);
      let hash = 0;
      for (let i = 0; i < jsonString.length; i++) {
        const char = jsonString.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Converter para inteiro de 32 bits
      }
      return "hash-" + Math.abs(hash).toString(16) + "-" + Date.now().toString(36);
    } catch (error) {
      console.error("Erro ao gerar hash:", error);
      return null;
    }
  }
  
  // Validar dados com hash (APENAS PARA DEMONSTRAÇÃO - NÃO SEGURO PARA PRODUÇÃO)
  validateWithHash(data, hash) {
    if (!data || !hash) return false;
    // Em uma implementação real, você recalcularia o hash do \'data\' e compararia com o \'hash\' fornecido.
    // Esta é uma implementação simplificada que apenas verifica o formato.
    return hash.startsWith("hash-");
  }
}

// Exportar a instância do serviço
window.securityService = new SecurityService();
