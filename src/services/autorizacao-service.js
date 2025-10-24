// autorizacao-service.js
import { registrarEvento } from "./auditoria-service";

// Função que gera a mensagem para os pais no WhatsApp
export function gerarMensagemWhatsApp(nomeAtleta, link) {
  return `
📢 Serviço Social das Categorias de Base

O atleta **${nomeAtleta}** solicitou uma autorização para férias.  

Para garantir a integridade do processo, pedimos que acesse o link abaixo e registre sua decisão:  

✅ Aprovar ou ❌ Reprovar a solicitação:  
👉 ${link}

Atenciosamente,  
Serviço Social do Sport Club Internacional
  `;
}

// Exemplo de envio de solicitação para os pais
export async function enviarSolicitacaoParaPais(nomeAtleta, id, token) {
  const link = `http://localhost:5173/pais/aprovacao.html?id=${id}&token=${token}`;
  const mensagem = gerarMensagemWhatsApp(nomeAtleta, link);

  try {
    // Aqui você deve integrar com o serviço real de envio de WhatsApp (ex: API do Twilio, Z-API, etc.)
    console.log("Mensagem enviada para os pais:\n", mensagem);

    await registrarEvento("Envio de solicitação", {
      atleta: nomeAtleta,
      id,
      token
    });
  } catch (error) {
    console.error("Erro ao enviar mensagem para os pais:", error);
  }
}
