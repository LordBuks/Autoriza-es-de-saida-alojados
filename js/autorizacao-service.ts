/**
 * Serviço de Autorização - Sistema de Autorizações Digitais
 * 
 * Este módulo implementa o padrão Module para encapsular a lógica de negócio
 * relacionada às autorizações, interagindo com o Firebase Firestore.
 */

import { firebaseService } from './firebase-config.ts';

interface Solicitacao {
  id: string;
  data_saida: string;
  data_retorno: string;
  nome: string;
  categoria: string;
  motivo_destino: string;
  horario_saida: string;
  horario_retorno: string;
  nome_responsavel: string;
  telefone_responsavel: string;
  data_solicitacao: string;
  status_supervisor: string;
  status_servico_social: string;
  status_monitor: string;
  status_final: string;
  dispositivo: any;
  status_pais?: string;
  observacao_supervisor?: string;
  observacao_servico_social?: string;
  observacao_monitor?: string;
  status_geral?: string;
  data_modificacao?: string;
}

class AutorizacaoServiceController {
  private COLLECTION_NAME = 'solicitacoes';

  constructor() {
    if (!firebaseService) {
      console.error('Serviço Firebase não encontrado! O AutorizacaoService não funcionará.');
      throw new Error('FirebaseService not available');
    }
  }

  private gerarId(): string {
    const timestamp = Date.now().toString(36);
    const randomPart = Math.random().toString(36).substring(2, 8);
    return `AUTH-${timestamp}-${randomPart}`.toUpperCase();
  }

  private capturarInfoDispositivo(): any {
    return {
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      screenWidth: window.screen.width,
      screenHeight: window.screen.height,
      language: navigator.language,
      timestamp: new Date().toISOString(),
      referrer: document.referrer,
      colorDepth: window.screen.colorDepth,
      pixelRatio: window.devicePixelRatio || 1
    };
  }

  private validarDatas(dataSaida: Date, dataRetorno: Date): { valido: boolean; mensagem?: string } {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    if (dataSaida < hoje) {
      return { valido: false, mensagem: 'A data de saída deve ser igual ou posterior a hoje.' };
    }

    if (dataRetorno < dataSaida) {
      return { valido: false, mensagem: 'A data de retorno deve ser posterior ou igual à data de saída.' };
    }

    return { valido: true };
  }

  formatarData(data: any): string {
    if (!data) return '';
    try {
      let dataObj: Date = data;
      if (!(data instanceof Date)) {
        if (data && typeof data.toDate === 'function') {
          dataObj = data.toDate();
        } else {
          dataObj = new Date(data);
        }
      }
      if (isNaN(dataObj.getTime())) {
        return 'Data inválida';
      }
      return dataObj.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch (error) {
      console.error("Erro ao formatar data:", error, "Data original:", data);
      return 'Erro na data';
    }
  }

  async criarSolicitacao(dadosFormulario: any): Promise<{ sucesso: boolean; mensagem?: string; solicitacao?: Solicitacao }> {
    console.warn('AutorizacaoService.criarSolicitacao está sendo chamado. Verificar se é necessário, pois solicitar-integrado.js já salva no Firestore.');

    const dataSaida = new Date(dadosFormulario.data_saida + 'T00:00:00');
    const dataRetorno = new Date(dadosFormulario.data_retorno + 'T00:00:00');

    const validacao = this.validarDatas(dataSaida, dataRetorno);
    if (!validacao.valido) {
      return { sucesso: false, mensagem: validacao.mensagem };
    }

    const deviceInfo = this.capturarInfoDispositivo();

    const solicitacao: Solicitacao = {
      id: this.gerarId(),
      ...dadosFormulario,
      data_solicitacao: new Date().toISOString(),
      status_supervisor: 'Pendente',
      status_servico_social: 'Pendente',
      status_monitor: 'Pendente',
      status_final: 'Em Análise',
      dispositivo: deviceInfo
    };

    try {
      await firebaseService.salvarDocumento(this.COLLECTION_NAME, solicitacao, solicitacao.id);
      console.log("Solicitação criada via AutorizacaoService salva no Firestore com ID:", solicitacao.id);

      return { sucesso: true, mensagem: 'Solicitação enviada com sucesso!', solicitacao: solicitacao };
    } catch (error: any) {
      console.error("Erro ao criar solicitação via AutorizacaoService no Firestore:", error);
      return { sucesso: false, mensagem: 'Erro ao salvar solicitação no banco de dados. Tente novamente.' };
    }
  }

  async buscarSolicitacao(id: string): Promise<Solicitacao | null> {
    if (!firebaseService) return null;
    try {
      const resultado = await firebaseService.obterDocumento(this.COLLECTION_NAME, id);
      return resultado.sucesso ? (resultado.dados as Solicitacao) : null;
    } catch (error) {
      console.error(`Erro ao buscar solicitação ${id} no Firestore:`, error);
      return null;
    }
  }

  async listarSolicitacoes(filtros: { [key: string]: any } = {}): Promise<Solicitacao[]> {
    if (!firebaseService) return [];
    try {
      const resultado = await firebaseService.obterDocumentos(this.COLLECTION_NAME);
      let solicitacoes: Solicitacao[] = [];
      if (resultado.sucesso && resultado.dados) {
        solicitacoes = resultado.dados as Solicitacao[];
      } else {
        console.error("Falha ao obter documentos ou dados vazios:", resultado.erro);
        return [];
      }

      if (Object.keys(filtros).length > 0) {
        solicitacoes = solicitacoes.filter(s => {
          for (const [chave, valor] of Object.entries(filtros)) {
            if (s[chave as keyof Solicitacao] !== valor) return false;
          }
          return true;
        });
      }

      solicitacoes.sort((a, b) => new Date(b.data_solicitacao).getTime() - new Date(a.data_solicitacao).getTime());

      return solicitacoes;
    } catch (error) {
      console.error("Erro ao listar solicitações do Firestore:", error);
      return [];
    }
  }

  async atualizarStatus(id: string, perfil: string, status: string, observacao: string = ''): Promise<{ sucesso: boolean; mensagem?: string; solicitacao?: Solicitacao }> {
    if (!firebaseService) {
      return { sucesso: false, mensagem: 'Serviço Firebase não disponível.' };
    }
    try {
      const solicitacao = await this.buscarSolicitacao(id);
      if (!solicitacao) {
        return { sucesso: false, mensagem: 'Solicitação não encontrada' };
      }

      const dadosAtualizar: Partial<Solicitacao> = {
        data_modificacao: new Date().toISOString()
      };

      if (perfil === 'supervisor') {
        dadosAtualizar.status_supervisor = status;
        dadosAtualizar.observacao_supervisor = observacao;

        if (status === 'Reprovado') {
          if (solicitacao.status_servico_social === 'Pendente') {
            dadosAtualizar.status_servico_social = 'Reprovado';
            dadosAtualizar.observacao_servico_social = 'Reprovado automaticamente devido à reprovação do supervisor';
          }
          if (solicitacao.status_monitor === 'Pendente') {
            dadosAtualizar.status_monitor = 'Reprovado';
            dadosAtualizar.observacao_monitor = 'Reprovado automaticamente devido à reprovação do supervisor';
          }
          dadosAtualizar.status_final = 'Reprovado';
          dadosAtualizar.status_geral = 'Reprovado';
        } else if (status === 'Aprovado') {
          if (solicitacao.status_pais === 'Aprovado') {
            dadosAtualizar.status_geral = 'pendente_servico_social';
          } else {
            dadosAtualizar.status_geral = 'pendente_pais';
          }
        }
      } else if (perfil === 'servico_social') {
        dadosAtualizar.status_servico_social = status;
        dadosAtualizar.observacao_servico_social = observacao;
        if (status === 'Aprovado') {
          dadosAtualizar.status_geral = 'aprovado_servico_social';
        } else if (status === 'Reprovado') {
          dadosAtualizar.status_geral = 'reprovado_servico_social';
        }
      } else if (perfil === 'monitor') {
        dadosAtualizar.status_monitor = status;
        dadosAtualizar.observacao_monitor = observacao;
        if (status === 'Arquivado') {
          dadosAtualizar.status_geral = 'arquivado_monitor';
        }
      } else if (perfil === 'geral') {
        dadosAtualizar.status_geral = status;
      } else {
        return { sucesso: false, mensagem: 'Perfil inválido para atualização.' };
      }

      const statusSupervisorAtualizado = dadosAtualizar.status_supervisor || solicitacao.status_supervisor;
      const statusServicoSocialAtualizado = dadosAtualizar.status_servico_social || solicitacao.status_servico_social;
      const statusMonitorAtualizado = dadosAtualizar.status_monitor || solicitacao.status_monitor;
      const statusPaisAtualizado = solicitacao.status_pais;

      if (statusSupervisorAtualizado === 'Reprovado' || 
          statusServicoSocialAtualizado === 'Reprovado' || 
          statusMonitorAtualizado === 'Reprovado' || 
          statusPaisAtualizado === 'Reprovado') {
        dadosAtualizar.status_final = 'Reprovado';
      } else if (statusSupervisorAtualizado === 'Aprovado' && 
                 statusServicoSocialAtualizado === 'Aprovado' && 
                 statusMonitorAtualizado === 'Aprovado' &&
                 statusPaisAtualizado === 'Aprovado') {
        dadosAtualizar.status_final = 'Aprovado';
      } else if (statusMonitorAtualizado === 'Arquivado') {
        dadosAtualizar.status_final = 'Arquivado';
      } else {
        dadosAtualizar.status_final = 'Em Análise';
      }

      await firebaseService.atualizarDocumento(this.COLLECTION_NAME, id, dadosAtualizar);
      console.log(`Status da solicitação ${id} atualizado no Firestore pelo ${perfil}. Novo status geral: ${dadosAtualizar.status_geral}`);

      if (perfil === 'supervisor' && status === 'Reprovado') {
        console.log(`Reprovação automática aplicada para solicitação ${id}: Serviço Social e Monitor foram reprovados automaticamente`);
      }

      const solicitacaoAtualizada = { ...solicitacao, ...dadosAtualizar };

      return { sucesso: true, mensagem: 'Status atualizado com sucesso', solicitacao: solicitacaoAtualizada };
    } catch (error) {
      console.error(`Erro ao atualizar status da solicitação ${id} no Firestore:`, error);
      return { sucesso: false, mensagem: 'Erro ao atualizar status no banco de dados. Tente novamente.' };
    }
  }
}

export const AutorizacaoService = new AutorizacaoServiceController();


