function getStatusBadge(statusText, type = 'default') {
    let badgeClass = 'badge-pending'; // Default
    let displayStatus = statusText || 'Pendente';

    // Adiciona verificação para garantir que statusText não é undefined ou null antes de usar toLowerCase
    const lowerCaseStatus = statusText ? statusText.toLowerCase() : '';

    switch (lowerCaseStatus) {
        case 'aprovado':
        case 'autorizado':
            badgeClass = 'badge-approved';
            displayStatus = 'Aprovado';
            break;
        case 'reprovado':
        case 'não autorizado':
            badgeClass = 'badge-rejected';
            displayStatus = 'Reprovado';
            break;
        case 'pendente':
            badgeClass = 'badge-pending';
            displayStatus = 'Pendente';
            break;
        case 'em análise':
            badgeClass = 'badge-pending';
            displayStatus = 'Em Análise';
            break;
        default:
            badgeClass = 'badge-pending';
            displayStatus = 'Pendente';
            break;
    }

    return `<span class="badge ${badgeClass}">${displayStatus}</span>`;
}

// Expor a função globalmente
window.getStatusBadge = getStatusBadge;

