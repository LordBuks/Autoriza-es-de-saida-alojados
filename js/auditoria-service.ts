/**
 * Serviço de Auditoria
 * Responsável por registrar e obter eventos de auditoria no Firestore.
 */

// Expor o serviço globalmente imediatamente
window.auditoriaService = (function() {
  const COLLECTION_NAME = 'auditoria';

  // Função para registrar um evento de auditoria
  async function registrarEvento(tipo, solicitacaoId, dados = {}) {
    if (!window.firebaseService) {
      console.warn('Firebase Service não disponível para auditoria');
      return { sucesso: false, erro: 'Firebase Service not available' };
    }
    
    try {
      const evento = {
        tipo: tipo,
        solicitacaoId: solicitacaoId,
        timestamp: firebase.firestore.FieldValue.serverTimestamp(),
        timestampLocal: new Date().toISOString(),
        usuarioId: firebase.auth().currentUser ? firebase.auth().currentUser.uid : 'anonimo',
        dados: dados,
        userAgent: navigator.userAgent,
        ip: await obterIP(),
        hash_integridade: gerarHashEvento(tipo, solicitacaoId, dados)
      };
      
      const resultado = await window.firebaseService.salvarDocumento(COLLECTION_NAME, evento);
      console.log('Evento de auditoria registrado:', tipo, resultado);
      return resultado;
    } catch (error) {
      console.error('Erro ao registrar evento de auditoria:', error);
      return { sucesso: false, erro: error.message };
    }
  }

  // Função para obter IP do usuário
  async function obterIP() {
    try {
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      return data.ip;
    } catch (error) {
      console.warn('Não foi possível obter IP:', error);
      return 'unknown';
    }
  }

  // Função para gerar hash de integridade do evento
  function gerarHashEvento(tipo, solicitacaoId, dados) {
    const dadosParaHash = `${tipo}_${solicitacaoId}_${JSON.stringify(dados)}_${Date.now()}`;
    
    let hash = 0;
    for (let i = 0; i < dadosParaHash.length; i++) {
      const char = dadosParaHash.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    
    return `HASH_${Math.abs(hash).toString(16).toUpperCase()}`;
  }

  // Função para obter o histórico de auditoria de uma solicitação
  async function obterHistoricoAuditoria(solicitacaoId) {
    if (!window.firebaseService) {
      return { sucesso: false, erro: 'Firebase Service not available' };
    }
    
    try {
      const filtros = [
        { campo: 'solicitacaoId', operador: '==', valor: solicitacaoId }
      ];
      
      const resultado = await window.firebaseService.obterDocumentos(COLLECTION_NAME, filtros);
      
      if (resultado.sucesso) {
        // Ordenar por timestamp
        resultado.dados.sort((a, b) => {
          const timestampA = a.timestamp ? a.timestamp.toDate() : new Date(a.timestampLocal);
          const timestampB = b.timestamp ? b.timestamp.toDate() : new Date(b.timestampLocal);
          return timestampA - timestampB;
        });
      }
      
      return resultado;
    } catch (error) {
      console.error('Erro ao obter histórico de auditoria:', error);
      return { sucesso: false, erro: error.message };
    }
  }

  // Função específica para registrar acesso dos pais
  async function registrarAcessoPais(solicitacaoId, token) {
    return await registrarEvento('ACESSO_PAIS', solicitacaoId, {
      token: token,
      acao: 'Acesso à página de aprovação',
      timestamp_acesso: new Date().toISOString()
    });
  }

  // Função específica para registrar decisão dos pais
  async function registrarDecisaoPais(solicitacaoId, decisao, observacao = '') {
    return await registrarEvento('DECISAO_PAIS', solicitacaoId, {
      decisao: decisao,
      observacao: observacao,
      timestamp_decisao: new Date().toISOString()
    });
  }

  // Função para registrar eventos do sistema
  async function registrarEventoSistema(tipo, solicitacaoId, dados = {}) {
    return await registrarEvento(`SISTEMA_${tipo}`, solicitacaoId, dados);
  }

  // Função específica para registrar geração de PDF
  async function registrarGeracaoPDF(solicitacaoId, tipoPDF) {
    return await registrarEvento('GERACAO_PDF', solicitacaoId, {
      tipo_pdf: tipoPDF,
      timestamp_geracao: new Date().toISOString(),
      usuario_geracao: firebase.auth().currentUser ? firebase.auth().currentUser.uid : 'sistema'
    });
  }

  // Interface pública
  return {
    registrarEvento,
    obterHistoricoAuditoria,
    registrarAcessoPais,
    registrarDecisaoPais,
    registrarEventoSistema,
    registrarGeracaoPDF
  };
})();

console.log('AuditoriaService carregado e exposto globalmente');

