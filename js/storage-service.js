// Serviço de armazenamento para o Sistema de Autorizações
// Este serviço abstrai o acesso ao armazenamento, permitindo migrar do localStorage para o Firebase

class StorageService {
  constructor() {
    this.useFirebase = false; // Controla se usamos Firebase ou localStorage
    this.collections = {
      solicitacoes: 'solicitacoes',
      confirmacoes: 'confirmacoes',
      notificacoes: 'notificacoes',
      arquivos: 'arquivos',
      emails: 'emails_enviados'
    };
    
    // Verificar se o Firebase está disponível
    this.checkFirebaseAvailability();
  }
  
  // Verificar se o Firebase está disponível e configurado
  checkFirebaseAvailability() {
    try {
      if (window.firebaseService) {
        console.log('Firebase detectado. Usando Firestore como armazenamento.');
        this.useFirebase = true;
      } else {
        console.log('Firebase não detectado. Usando localStorage como fallback.');
        this.useFirebase = false;
      }
    } catch (error) {
      console.error('Erro ao verificar disponibilidade do Firebase:', error);
      this.useFirebase = false;
    }
  }
  
  // Obter dados de uma coleção
  async getCollection(collectionName) {
    if (this.useFirebase) {
      try {
        const result = await window.firebaseService.obterDocumentos(this.collections[collectionName]);
        if (result.sucesso) {
          return result.dados;
        } else {
          console.error(`Erro ao obter coleção ${collectionName}:`, result.erro);
          return [];
        }
      } catch (error) {
        console.error(`Erro ao obter coleção ${collectionName}:`, error);
        return [];
      }
    } else {
      // Fallback para localStorage
      return JSON.parse(localStorage.getItem(collectionName)) || [];
    }
  }
  
  // Salvar dados em uma coleção
  async saveCollection(collectionName, data) {
    if (this.useFirebase) {
      try {
        // Para coleções, precisamos salvar cada documento individualmente
        if (Array.isArray(data)) {
          // Primeiro, obtemos todos os documentos existentes para comparar
          const existingDocs = await this.getCollection(collectionName);
          const existingIds = existingDocs.map(doc => doc.id);
          
          // Para cada item no array, salvamos como um documento
          for (const item of data) {
            // Se o item já tem um ID e existe na coleção, atualizamos
            if (item.id && existingIds.includes(item.id)) {
              await window.firebaseService.atualizarDocumento(
                this.collections[collectionName],
                item.id,
                item
              );
            } else {
              // Caso contrário, criamos um novo documento
              await window.firebaseService.salvarDocumento(
                this.collections[collectionName],
                item,
                item.id // Passamos o ID se existir
              );
            }
          }
          return true;
        } else if (typeof data === 'object') {
          // Se for um objeto único (não array), salvamos como um documento único
          const result = await window.firebaseService.salvarDocumento(
            this.collections[collectionName],
            data,
            data.id // Passamos o ID se existir
          );
          return result.sucesso;
        }
        return false;
      } catch (error) {
        console.error(`Erro ao salvar coleção ${collectionName}:`, error);
        return false;
      }
    } else {
      // Fallback para localStorage
      try {
        localStorage.setItem(collectionName, JSON.stringify(data));
        return true;
      } catch (error) {
        console.error(`Erro ao salvar no localStorage:`, error);
        return false;
      }
    }
  }
  
  // Obter um documento específico por ID
  async getDocument(collectionName, id) {
    if (this.useFirebase) {
      try {
        const result = await window.firebaseService.obterDocumento(
          this.collections[collectionName],
          id
        );
        if (result.sucesso) {
          return result.dados;
        } else {
          console.error(`Documento não encontrado em ${collectionName}:`, result.erro);
          return null;
        }
      } catch (error) {
        console.error(`Erro ao obter documento de ${collectionName}:`, error);
        return null;
      }
    } else {
      // Fallback para localStorage
      const collection = JSON.parse(localStorage.getItem(collectionName)) || [];
      return collection.find(item => item.id === id) || null;
    }
  }
  
  // Salvar um documento específico
  async saveDocument(collectionName, document) {
    if (this.useFirebase) {
      try {
        const result = await window.firebaseService.salvarDocumento(
          this.collections[collectionName],
          document,
          document.id // Passamos o ID se existir
        );
        return result.sucesso;
      } catch (error) {
        console.error(`Erro ao salvar documento em ${collectionName}:`, error);
        return false;
      }
    } else {
      // Fallback para localStorage
      try {
        const collection = JSON.parse(localStorage.getItem(collectionName)) || [];
        const index = collection.findIndex(item => item.id === document.id);
        
        if (index !== -1) {
          // Atualizar documento existente
          collection[index] = document;
        } else {
          // Adicionar novo documento
          collection.push(document);
        }
        
        localStorage.setItem(collectionName, JSON.stringify(collection));
        return true;
      } catch (error) {
        console.error(`Erro ao salvar documento no localStorage:`, error);
        return false;
      }
    }
  }
  
  // Atualizar um documento existente
  async updateDocument(collectionName, id, updates) {
    if (this.useFirebase) {
      try {
        const result = await window.firebaseService.atualizarDocumento(
          this.collections[collectionName],
          id,
          updates
        );
        return result.sucesso;
      } catch (error) {
        console.error(`Erro ao atualizar documento em ${collectionName}:`, error);
        return false;
      }
    } else {
      // Fallback para localStorage
      try {
        const collection = JSON.parse(localStorage.getItem(collectionName)) || [];
        const index = collection.findIndex(item => item.id === id);
        
        if (index !== -1) {
          // Atualizar documento existente
          collection[index] = { ...collection[index], ...updates };
          localStorage.setItem(collectionName, JSON.stringify(collection));
          return true;
        } else {
          console.error(`Documento com ID ${id} não encontrado em ${collectionName}`);
          return false;
        }
      } catch (error) {
        console.error(`Erro ao atualizar documento no localStorage:`, error);
        return false;
      }
    }
  }
  
  // Excluir um documento
  async deleteDocument(collectionName, id) {
    if (this.useFirebase) {
      try {
        const result = await window.firebaseService.excluirDocumento(
          this.collections[collectionName],
          id
        );
        return result.sucesso;
      } catch (error) {
        console.error(`Erro ao excluir documento de ${collectionName}:`, error);
        return false;
      }
    } else {
      // Fallback para localStorage
      try {
        const collection = JSON.parse(localStorage.getItem(collectionName)) || [];
        const newCollection = collection.filter(item => item.id !== id);
        localStorage.setItem(collectionName, JSON.stringify(newCollection));
        return true;
      } catch (error) {
        console.error(`Erro ao excluir documento do localStorage:`, error);
        return false;
      }
    }
  }
  
  // Buscar documentos com filtros
  async queryDocuments(collectionName, filters) {
    if (this.useFirebase) {
      try {
        // Converter filtros para o formato do Firebase
        const firebaseFilters = filters.map(filter => ({
          campo: filter.field,
          operador: filter.operator || '==',
          valor: filter.value
        }));
        
        const result = await window.firebaseService.obterDocumentos(
          this.collections[collectionName],
          firebaseFilters
        );
        
        if (result.sucesso) {
          return result.dados;
        } else {
          console.error(`Erro na consulta a ${collectionName}:`, result.erro);
          return [];
        }
      } catch (error) {
        console.error(`Erro ao consultar documentos em ${collectionName}:`, error);
        return [];
      }
    } else {
      // Fallback para localStorage com filtros manuais
      try {
        const collection = JSON.parse(localStorage.getItem(collectionName)) || [];
        
        // Aplicar filtros manualmente
        return collection.filter(item => {
          return filters.every(filter => {
            const { field, operator, value } = filter;
            
            switch (operator) {
              case '==':
                return item[field] === value;
              case '!=':
                return item[field] !== value;
              case '>':
                return item[field] > value;
              case '>=':
                return item[field] >= value;
              case '<':
                return item[field] < value;
              case '<=':
                return item[field] <= value;
              case 'contains':
                return item[field] && item[field].includes(value);
              default:
                return item[field] === value;
            }
          });
        });
      } catch (error) {
        console.error(`Erro ao consultar documentos no localStorage:`, error);
        return [];
      }
    }
  }
  
  // Observar mudanças em uma coleção (só funciona com Firebase)
  observeCollection(collectionName, filters, callback) {
    if (this.useFirebase) {
      try {
        // Converter filtros para o formato do Firebase
        const firebaseFilters = filters.map(filter => ({
          campo: filter.field,
          operador: filter.operator || '==',
          valor: filter.value
        }));
        
        return window.firebaseService.observarDocumentos(
          this.collections[collectionName],
          firebaseFilters,
          result => {
            if (result.sucesso) {
              callback(result.dados);
            } else {
              console.error(`Erro ao observar ${collectionName}:`, result.erro);
              callback([]);
            }
          }
        );
      } catch (error) {
        console.error(`Erro ao configurar observador para ${collectionName}:`, error);
        callback([]);
        return () => {}; // Retornar uma função vazia como fallback
      }
    } else {
      console.warn('Observação de coleções em tempo real só está disponível com Firebase.');
      // Retornar uma função vazia como unsubscribe
      return () => {};
    }
  }
}

// Exportar a instância do serviço
window.storageService = new StorageService();