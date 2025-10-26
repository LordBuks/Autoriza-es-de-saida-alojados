// Serviço de integração com WhatsApp
class WhatsAppService {
  constructor() {
    // Inicialização do serviço
    console.log('Serviço de WhatsApp inicializado');
  }  // Gerar link para WhatsApp usando a API wa.me
  gerarLinkWhatsApp(telefone, mensagem) {
    let numeroLimpo = telefone.replace(/\D/g, ""); // Remove non-digits
    console.log("WhatsAppService: Número limpo inicial:", numeroLimpo);

    // Adiciona o prefixo 55 (código do Brasil) se não estiver presente
    if (!numeroLimpo.startsWith("55")) {
      numeroLimpo = `55${numeroLimpo}`;
      console.log("WhatsAppService: Adicionado prefixo 55. Número:", numeroLimpo);
    }

    // Remove o nono dígito se o número tiver 13 dígitos e começar com 55
    if (numeroLimpo.length === 13 && numeroLimpo.startsWith("55")) {
      numeroLimpo = numeroLimpo.substring(0, 4) + numeroLimpo.substring(5); // Remove o nono dígito (posição 4)
      console.log("WhatsAppService: Nono dígito removido. Número:", numeroLimpo);
    }

    // Validação final do comprimento após a formatação
    if (numeroLimpo.length !== 12) {
        console.error(`WhatsAppService: Número de telefone com formato inválido após processamento: ${numeroLimpo}. Esperado 12 dígitos com prefixo 55.`);
        return null;
    }

    const mensagemCodificada = encodeURIComponent(mensagem);
    return `https://wa.me/${numeroLimpo}?text=${mensagemCodificada}`;
  }
  // Gerar mensagem para confirmação de autorização
  gerarMensagemConfirmacao(dados, linkConfirmacao) {
    return `🔴⚪ *Sport Club Internacional* ⚪🔴\n\n`+
           `Olá, *${dados.nome_responsavel}*! 👋\n\n`+
           `O Sport Club Internacional, através do *Serviço Social*, informa que o(a) atleta *${dados.nome}* solicitou uma autorização para sair do clube.\n\n`+
           `📋 *Detalhes da solicitação:*\n`+
           `📅 *Saída:* ${this.formatarData(new Date(dados.data_saida))} às ${dados.horario_saida}\n`+
           `🔄 *Retorno:* ${this.formatarData(new Date(dados.data_retorno))} às ${dados.horario_retorno}\n`+
           `📍 *Motivo/Destino:* ${dados.motivo_destino}\n\n`+
           `⚠️ *IMPORTANTE:* Para a segurança e integridade do processo, precisamos da sua autorização.\n\n`+
           `👆 *Clique no link abaixo para APROVAR ou REPROVAR esta solicitação:*\n\n`+           `🔗 ${linkConfirmacao}\n\n`+
           `✅ Esta confirmação é *obrigatória* para garantir a segurança do(a) atleta.\n\n`+
           `❓ Em caso de dúvidas, entre em contato com o Departamento de Serviço Social.\n\n`+
           `Contamos com a sua colaboração! 🤝\n\n`+
           `Atenciosamente,\n*Serviço Social do Sport Club Internacional* 🔴⚪`;
  }
  
  // Formatar data para exibição
  formatarData(data) {
    return data.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }
}

// Exportar o serviço como um módulo
const whatsAppService = new WhatsAppService();

window.whatsAppService = whatsAppService;

