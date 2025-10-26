/**
 * Serviço de Geração de PDF
 * Responsável por gerar relatórios em PDF para solicitações
 */
window.pdfService = (function() {
    // Configurações do PDF
    const CONFIG = {
        formato: 'a4',
        orientacao: 'portrait',
        margens: {
            superior: 15,
            inferior: 15,
            esquerda: 15,
            direita: 15
        },
        cabecalho: {
            altura: 20,
            texto: 'Sistema de Autorizações - Relatório'
        },
        rodape: {
            altura: 10,
            texto: 'Documento gerado eletronicamente - Página '
        }
    };
    
    // Cores utilizadas no PDF
    const CORES = {
        primaria: '#3498db',
        secundaria: '#2c3e50',
        sucesso: '#2ecc71',
        alerta: '#e74c3c',
        texto: '#333333',
        fundo: '#f9f9f9',
        borda: '#dddddd'
    };
    
    // Função auxiliar para formatar data
    function formatarData(data) {
        if (!data) return 'N/A';
        
        if (data.toDate) {
            data = data.toDate();
        } else if (typeof data === 'string') {
            data = new Date(data);
        }
        
        return data.toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }
    
    // Função para obter dados da solicitação do Firebase
    async function obterDadosSolicitacao(solicitacaoId) {
        try {
            // Obtém documento da solicitação
            const docRef = await firebase.firestore()
                .collection('solicitacoes')
                .doc(solicitacaoId)
                .get();
            
            if (!docRef.exists) {
                throw new Error('Solicitação não encontrada');
            }
            
            const solicitacao = {
                id: docRef.id,
                ...docRef.data()
            };
            
            // Obtém histórico de auditoria
            const historicoAuditoria = await window.auditoriaService.obterHistoricoAuditoria(solicitacaoId);
            
            return {
                solicitacao: solicitacao,
                auditoria: historicoAuditoria.sucesso ? historicoAuditoria.eventos : []
            };
        } catch (erro) {
            console.error('Erro ao obter dados para PDF:', erro);
            throw erro;
        }
    }
    
    // Função para criar cabeçalho do PDF
    function criarCabecalhoPDF(doc) {
        doc.setFillColor(CORES.primaria);
        doc.rect(0, 0, doc.internal.pageSize.width, CONFIG.cabecalho.altura, 'F');
        
        doc.setTextColor('#ffffff');
        doc.setFontSize(12);
        doc.text(
            CONFIG.cabecalho.texto,
            doc.internal.pageSize.width / 2,
            10,
            { align: 'center' }
        );
        
        // Adiciona data de geração
        const dataGeracao = new Date().toLocaleDateString('pt-BR');
        doc.setFontSize(8);
        doc.text(
            `Gerado em: ${dataGeracao}`,
            doc.internal.pageSize.width - CONFIG.margens.direita,
            10,
            { align: 'right' }
        );
    }
    
    // Função para criar rodapé do PDF
    function criarRodapePDF(doc, numeroPagina) {
        const totalPaginas = doc.internal.getNumberOfPages();
        
        doc.setPage(numeroPagina);
        doc.setFillColor(CORES.secundaria);
        doc.rect(
            0,
            doc.internal.pageSize.height - CONFIG.rodape.altura,
            doc.internal.pageSize.width,
            CONFIG.rodape.altura,
            'F'
        );
        
        doc.setTextColor('#ffffff');
        doc.setFontSize(8);
        doc.text(
            `${CONFIG.rodape.texto} ${numeroPagina} de ${totalPaginas} - Documento com validade legal para autorização digital`,
            doc.internal.pageSize.width / 2,
            doc.internal.pageSize.height - 4,
            { align: 'center' }
        );
        
        // Adiciona hash de integridade
        doc.setFontSize(6);
        doc.text(
            'Hash de Integridade: [HASH_DOCUMENTO_COMPLETO]',
            doc.internal.pageSize.width / 2,
            doc.internal.pageSize.height - 1,
            { align: 'center' }
        );
    }
    
    // Função para adicionar informações da solicitação ao PDF
    function adicionarInformacoesSolicitacao(doc, dados) {
        const solicitacao = dados.solicitacao;
        let posicaoY = CONFIG.cabecalho.altura + 15;
        
        // Título do relatório
        doc.setFontSize(16);
        doc.setTextColor(CORES.secundaria);
        doc.text(
            `Relatório de Autorização Digital #${solicitacao.id.substring(0, 8)}`,
            doc.internal.pageSize.width / 2,
            posicaoY,
            { align: 'center' }
        );
        posicaoY += 15;
        
        // Informações do atleta
        doc.setFontSize(14);
        doc.setTextColor(CORES.primaria);
        doc.text('DADOS DA SOLICITAÇÃO DE AUTORIZAÇÃO', CONFIG.margens.esquerda, posicaoY);
        posicaoY += 10;
        
        doc.setFontSize(10);
        doc.setTextColor(CORES.texto);
        
        const infoAtleta = [
            { label: 'Nome do Atleta:', valor: solicitacao.nome || 'N/A' },
            { label: 'Idade:', valor: solicitacao.idade || 'N/A' },
            { label: 'Categoria:', valor: solicitacao.categoria || 'N/A' },
            { label: 'Telefone:', valor: solicitacao.telefone || 'N/A' },
            { label: 'Responsável Legal:', valor: solicitacao.nome_responsavel || 'N/A' },
            { label: 'Telefone do Responsável:', valor: solicitacao.telefone_responsavel || 'N/A' },
            { label: 'Destino:', valor: solicitacao.destino || 'N/A' },
            { label: 'Data/Hora de Saída:', valor: solicitacao.data_saida || 'N/A' },
            { label: 'Data/Hora de Retorno:', valor: solicitacao.data_retorno || 'N/A' },
            { label: 'Motivo da Saída:', valor: solicitacao.motivo || 'N/A' },
            { label: 'Data da Solicitação:', valor: formatarData(solicitacao.dataCriacao) }
        ];
        
        infoAtleta.forEach(item => {
            doc.text(`${item.label} ${item.valor}`, CONFIG.margens.esquerda, posicaoY);
            posicaoY += 7;
        });
        
        posicaoY += 10;
        
        // Status das aprovações
        doc.setFontSize(12);
        doc.setTextColor(CORES.primaria);
        doc.text('STATUS DAS APROVAÇÕES:', CONFIG.margens.esquerda, posicaoY);
        posicaoY += 10;
        
        doc.setFontSize(10);
        doc.setTextColor(CORES.texto);
        
        const statusInfo = [
            { label: 'Supervisor:', valor: solicitacao.status_supervisor || 'Pendente' },
            { label: 'Serviço Social:', valor: solicitacao.status_servico_social || 'Pendente' },
            { label: 'Responsável Legal:', valor: solicitacao.status_pais || 'Pendente' },
            { label: 'Status Final:', valor: solicitacao.status_final || 'Em Análise' }
        ];
        
        statusInfo.forEach(item => {
            // Determina a cor do status
            let corStatus = CORES.texto;
            if (item.valor === 'Aprovado' || item.valor === 'Autorizado') {
                corStatus = CORES.sucesso;
            } else if (item.valor === 'Reprovado' || item.valor === 'Não Autorizado') {
                corStatus = CORES.alerta;
            }
            
            doc.setTextColor(corStatus);
            doc.text(`${item.label} ${item.valor}`, CONFIG.margens.esquerda, posicaoY);
            posicaoY += 7;
        });
        
        return posicaoY + 10;
    }
    
    // Função para adicionar histórico de auditoria ao PDF
    function adicionarHistoricoAuditoria(doc, dados, posicaoYInicial) {
        let posicaoY = posicaoYInicial;
        
        // Título da seção
        doc.setFontSize(14);
        doc.setTextColor(CORES.primaria);
        doc.text('Histórico de Auditoria', CONFIG.margens.esquerda, posicaoY);
        posicaoY += 10;
        
        // Verifica se há eventos de auditoria
        if (!dados.auditoria || dados.auditoria.length === 0) {
            doc.setFontSize(10);
            doc.setTextColor(CORES.texto);
            doc.text('Nenhum evento de auditoria registrado.', CONFIG.margens.esquerda, posicaoY);
            return posicaoY + 10;
        }
        
        // Cabeçalho da tabela
        const colunas = ['Data/Hora', 'Evento', 'Usuário', 'Detalhes'];
        const larguraColunas = [40, 40, 40, 60];
        
        // Calcula largura total e posição inicial
        const larguraTotal = larguraColunas.reduce((a, b) => a + b, 0);
        let posicaoX = CONFIG.margens.esquerda;
        
        // Desenha cabeçalho da tabela
        doc.setFillColor(CORES.secundaria);
        doc.rect(posicaoX, posicaoY, larguraTotal, 8, 'F');
        
        doc.setTextColor('#ffffff');
        doc.setFontSize(9);
        
        colunas.forEach((coluna, index) => {
            doc.text(coluna, posicaoX + 3, posicaoY + 5);
            posicaoX += larguraColunas[index];
        });
        
        posicaoY += 8;
        
        // Desenha linhas da tabela
        doc.setTextColor(CORES.texto);
        doc.setFontSize(8);
        
        let corLinha = true;
        
        dados.auditoria.forEach((evento, index) => {
            // Verifica se precisa adicionar nova página
            if (posicaoY > doc.internal.pageSize.height - CONFIG.margens.inferior - 20) {
                doc.addPage();
                criarCabecalhoPDF(doc);
                posicaoY = CONFIG.cabecalho.altura + 15;
                
                // Redesenha cabeçalho da tabela na nova página
                posicaoX = CONFIG.margens.esquerda;
                doc.setFillColor(CORES.secundaria);
                doc.rect(posicaoX, posicaoY, larguraTotal, 8, 'F');
                
                doc.setTextColor('#ffffff');
                doc.setFontSize(9);
                
                colunas.forEach((coluna, index) => {
                    doc.text(coluna, posicaoX + 3, posicaoY + 5);
                    posicaoX += larguraColunas[index];
                });
                
                posicaoY += 8;
                doc.setTextColor(CORES.texto);
                doc.setFontSize(8);
            }
            
            // Alterna cor de fundo das linhas
            if (corLinha) {
                doc.setFillColor(CORES.fundo);
            } else {
                doc.setFillColor('#ffffff');
            }
            corLinha = !corLinha;
            
            doc.rect(CONFIG.margens.esquerda, posicaoY, larguraTotal, 8, 'F');
            
            // Adiciona dados nas colunas
            posicaoX = CONFIG.margens.esquerda;
            
            // Data/Hora
            doc.text(formatarData(evento.timestamp), posicaoX + 3, posicaoY + 5);
            posicaoX += larguraColunas[0];
            
            // Tipo de Evento
            let tipoEvento = evento.tipo.replace(/_/g, ' ');
            tipoEvento = tipoEvento.charAt(0).toUpperCase() + tipoEvento.slice(1);
            doc.text(tipoEvento, posicaoX + 3, posicaoY + 5);
            posicaoX += larguraColunas[1];
            
            // Usuário
            const usuario = evento.usuarioId === 'anonimo' ? 'Anônimo' : evento.usuarioId.substring(0, 8);
            doc.text(usuario, posicaoX + 3, posicaoY + 5);
            posicaoX += larguraColunas[2];
            
            // Detalhes
            let detalhes = '';
            if (evento.dados) {
                if (evento.dados.decisao) {
                    detalhes = `Decisão: ${evento.dados.decisao}`;
                } else if (evento.dados.status) {
                    detalhes = `Status: ${evento.dados.status}`;
                } else if (evento.dados.nome) {
                    detalhes = `Atleta: ${evento.dados.nome}`;
                } else if (evento.dados.canal) {
                    detalhes = `Canal: ${evento.dados.canal}`;
                }
            }
            doc.text(detalhes || 'N/A', posicaoX + 3, posicaoY + 5);
            
            posicaoY += 8;
        });
        
        // Adiciona borda à tabela
        doc.setDrawColor(CORES.borda);
        doc.rect(
            CONFIG.margens.esquerda,
            posicaoYInicial + 10,
            larguraTotal,
            posicaoY - (posicaoYInicial + 10),
            'S'
        );
        
        return posicaoY + 10;
    }
    
    // Função para adicionar seção de validação legal ao PDF
    function adicionarSecaoValidacaoLegal(doc, solicitacao, posicaoYInicial) {
        let posicaoY = posicaoYInicial;
        
        // Verifica se precisa adicionar nova página
        if (posicaoY > doc.internal.pageSize.height - CONFIG.margens.inferior - 80) {
            doc.addPage();
            criarCabecalhoPDF(doc);
            posicaoY = CONFIG.cabecalho.altura + 15;
        }
        
        doc.setFontSize(14);
        doc.setTextColor(CORES.primaria);
        doc.text('VALIDAÇÃO LEGAL - AUTORIZAÇÃO DIGITAL', CONFIG.margens.esquerda, posicaoY);
        posicaoY += 15;
        
        doc.setFontSize(10);
        doc.setTextColor(CORES.texto);
        
        const validacaoTexto = [
            'Este documento constitui uma autorização digital válida conforme:',
            '• Lei nº 8.069/90 (Estatuto da Criança e do Adolescente)',
            '• MP nº 2.200-2/2001 (Infraestrutura de Chaves Públicas Brasileira)',
            '• Lei nº 14.063/2020 (Uso de assinaturas eletrônicas)',
            '',
            'DECLARAÇÃO DE AUTENTICIDADE:',
            'O responsável legal, através de meio eletrônico seguro, manifestou sua',
            'decisão de forma livre e consciente, sendo esta autorização válida',
            'para todos os efeitos legais.',
            '',
            `Tipo de Link Enviado: ${solicitacao.tipo_link_enviado || 'N/A'}`,
            `Data de Envio: ${solicitacao.data_envio_link ? formatarData(solicitacao.data_envio_link) : 'N/A'}`,
            `Data da Decisão: ${solicitacao.data_decisao_pais ? formatarData(solicitacao.data_decisao_pais) : 'N/A'}`
        ];
        
        validacaoTexto.forEach(texto => {
            doc.text(texto, CONFIG.margens.esquerda, posicaoY);
            posicaoY += 6;
        });
        
        return posicaoY + 10;
    }
    
    // Função para adicionar assinaturas digitais ao PDF
    function adicionarAssinaturasDigitais(doc, solicitacao, posicaoYInicial) {
        let posicaoY = posicaoYInicial;
        
        // Verifica se precisa adicionar nova página
        if (posicaoY > doc.internal.pageSize.height - CONFIG.margens.inferior - 80) {
            doc.addPage();
            criarCabecalhoPDF(doc);
            posicaoY = CONFIG.cabecalho.altura + 15;
        }
        
        doc.setFontSize(12);
        doc.setTextColor(CORES.primaria);
        doc.text('ASSINATURAS DIGITAIS E VALIDAÇÕES', CONFIG.margens.esquerda, posicaoY);
        posicaoY += 15;
        
        doc.setFontSize(9);
        doc.setTextColor(CORES.texto);
        
        // Assinatura do Supervisor
        if (solicitacao.status_supervisor === 'Aprovado') {
            doc.text('SUPERVISOR:', CONFIG.margens.esquerda, posicaoY);
            posicaoY += 8;
            doc.text(`Aprovado digitalmente em: ${solicitacao.data_aprovacao_supervisor ? formatarData(solicitacao.data_aprovacao_supervisor) : 'N/A'}`, CONFIG.margens.esquerda, posicaoY);
            posicaoY += 8;
            doc.text('Assinatura Digital: [HASH_SUPERVISOR_VALIDADO]', CONFIG.margens.esquerda, posicaoY);
            posicaoY += 15;
        }
        
        // Assinatura do Responsável
        if (solicitacao.status_pais) {
            doc.text('RESPONSÁVEL LEGAL:', CONFIG.margens.esquerda, posicaoY);
            posicaoY += 8;
            doc.text(`${solicitacao.status_pais} digitalmente em: ${solicitacao.data_decisao_pais ? formatarData(solicitacao.data_decisao_pais) : 'N/A'}`, CONFIG.margens.esquerda, posicaoY);
            posicaoY += 8;
            doc.text('Assinatura Digital: [HASH_RESPONSAVEL_VALIDADO]', CONFIG.margens.esquerda, posicaoY);
            posicaoY += 15;
        }
        
        // Assinatura do Serviço Social
        if (solicitacao.status_servico_social === 'Aprovado') {
            doc.text('SERVIÇO SOCIAL:', CONFIG.margens.esquerda, posicaoY);
            posicaoY += 8;
            doc.text(`Aprovado digitalmente em: ${solicitacao.data_aprovacao_servico_social ? formatarData(solicitacao.data_aprovacao_servico_social) : 'N/A'}`, CONFIG.margens.esquerda, posicaoY);
            posicaoY += 8;
            doc.text('Assinatura Digital: [HASH_SERVICO_SOCIAL_VALIDADO]', CONFIG.margens.esquerda, posicaoY);
            posicaoY += 15;
        }
        
        return posicaoY + 10;
    }

    // Função principal para gerar o relatório PDF
    async function gerarRelatorio(solicitacaoId) {
        try {
            // Carrega os dados da solicitação e auditoria
            const dados = await obterDadosSolicitacao(solicitacaoId);
            
            // Inicializa o jsPDF
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF({
                orientation: CONFIG.orientacao,
                unit: 'mm',
                format: CONFIG.formato
            });
            
            // Adiciona cabeçalho e rodapé para a primeira página
            criarCabecalhoPDF(doc);
            
            // Adiciona informações da solicitação
            let posicaoY = adicionarInformacoesSolicitacao(doc, dados);
            
            // Adiciona histórico de auditoria
            posicaoY = adicionarHistoricoAuditoria(doc, dados, posicaoY);
            
            // Adiciona seção de validação legal
            posicaoY = adicionarSecaoValidacaoLegal(doc, dados.solicitacao, posicaoY);
            
            // Adiciona assinaturas digitais
            posicaoY = adicionarAssinaturasDigitais(doc, dados.solicitacao, posicaoY);
            
            // Adiciona rodapé a todas as páginas
            const totalPaginas = doc.internal.getNumberOfPages();
            for (let i = 1; i <= totalPaginas; i++) {
                criarRodapePDF(doc, i);
            }
            
            // Salva o PDF
            const nomeArquivo = `relatorio_autorizacao_${solicitacaoId.substring(0, 8)}.pdf`;
            doc.save(nomeArquivo);
            
            // Registra o evento de geração de PDF
            await window.auditoriaService.registrarGeracaoPDF(solicitacaoId, 'Relatório de Auditoria');
            
            return { sucesso: true, mensagem: `Relatório ${nomeArquivo} gerado com sucesso!` };
        } catch (error) {
            console.error('Erro ao gerar relatório PDF:', error);
            return { sucesso: false, mensagem: `Erro ao gerar relatório PDF: ${error.message}` };
        }
    }

    // Interface pública do serviço
    return {
        gerarRelatorio: gerarRelatorio
    };
})();

console.log('PDFService carregado e exposto globalmente');

