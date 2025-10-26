// Animações elegantes com efeitos sofisticados
class ElegantAnimations {
    constructor() {
        this.init();
    }

    init() {
        this.setupParticles();
        this.setupFormAnimations();
        this.setupButtonEffects();
        this.setupScrollAnimations();
        this.setupMouseFollower();
        this.setupTypingEffect();
    }

    // Sistema de partículas flutuantes
    setupParticles() {
        const particleContainer = document.createElement('div');
        particleContainer.className = 'particles-container';
        particleContainer.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: 1;
            overflow: hidden;
        `;
        document.body.appendChild(particleContainer);

        // Criar partículas
        for (let i = 0; i < 50; i++) {
            this.createParticle(particleContainer);
        }
    }

    createParticle(container) {
        const particle = document.createElement('div');
        const size = Math.random() * 4 + 2;
        const duration = Math.random() * 20 + 10;
        const delay = Math.random() * 5;
        
        particle.style.cssText = `
            position: absolute;
            width: ${size}px;
            height: ${size}px;
            background: radial-gradient(circle, rgba(255,255,255,0.8) 0%, rgba(255,255,255,0.2) 100%);
            border-radius: 50%;
            top: ${Math.random() * 100}vh;
            left: ${Math.random() * 100}vw;
            animation: floatParticle ${duration}s ease-in-out infinite ${delay}s;
            box-shadow: 0 0 10px rgba(255,255,255,0.5);
        `;

        container.appendChild(particle);

        // Adicionar keyframes se não existirem
        if (!document.querySelector('#particle-keyframes')) {
            const style = document.createElement('style');
            style.id = 'particle-keyframes';
            style.textContent = `
                @keyframes floatParticle {
                    0%, 100% {
                        transform: translateY(0px) translateX(0px) rotate(0deg);
                        opacity: 0.7;
                    }
                    25% {
                        transform: translateY(-20px) translateX(10px) rotate(90deg);
                        opacity: 1;
                    }
                    50% {
                        transform: translateY(0px) translateX(-10px) rotate(180deg);
                        opacity: 0.5;
                    }
                    75% {
                        transform: translateY(20px) translateX(5px) rotate(270deg);
                        opacity: 1;
                    }
                }
            `;
            document.head.appendChild(style);
        }
    }

    // Animações de formulário
    setupFormAnimations() {
        const inputs = document.querySelectorAll('.form-control');
        
        inputs.forEach(input => {
            // Efeito de ondulação no foco
            input.addEventListener('focus', (e) => {
                this.createRipple(e.target, e);
                this.animateLabel(e.target);
            });

            // Efeito de validação em tempo real
            input.addEventListener('input', (e) => {
                this.validateInput(e.target);
            });

            // Efeito de saída
            input.addEventListener('blur', (e) => {
                this.resetLabel(e.target);
            });
        });
    }

    createRipple(element, event) {
        const ripple = document.createElement('div');
        const rect = element.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        
        ripple.style.cssText = `
            position: absolute;
            width: ${size}px;
            height: ${size}px;
            background: radial-gradient(circle, rgba(204, 13, 46, 0.3) 0%, transparent 70%);
            border-radius: 50%;
            transform: scale(0);
            animation: rippleEffect 0.6s ease-out;
            pointer-events: none;
            z-index: 0;
            top: 50%;
            left: 50%;
            margin-top: -${size/2}px;
            margin-left: -${size/2}px;
        `;

        element.parentElement.style.position = 'relative';
        element.parentElement.appendChild(ripple);

        // Adicionar keyframes para ripple
        if (!document.querySelector('#ripple-keyframes')) {
            const style = document.createElement('style');
            style.id = 'ripple-keyframes';
            style.textContent = `
                @keyframes rippleEffect {
                    0% {
                        transform: scale(0);
                        opacity: 1;
                    }
                    100% {
                        transform: scale(1);
                        opacity: 0;
                    }
                }
            `;
            document.head.appendChild(style);
        }

        setTimeout(() => {
            ripple.remove();
        }, 600);
    }

    animateLabel(input) {
        const label = input.parentElement.querySelector('.form-label');
        if (label) {
            label.style.transform = 'translateY(-5px) scale(0.95)';
            label.style.color = '#cc0d2e';
            label.style.fontWeight = '700';
        }
    }

    resetLabel(input) {
        const label = input.parentElement.querySelector('.form-label');
        if (label && !input.value) {
            label.style.transform = 'translateY(0) scale(1)';
            label.style.color = '#212529';
            label.style.fontWeight = '600';
        }
    }

    validateInput(input) {
        const isValid = input.checkValidity();
        
        if (isValid && input.value.length > 0) {
            input.style.borderColor = '#28a745';
            input.style.boxShadow = '0 0 0 4px rgba(40, 167, 69, 0.1)';
            this.addValidationIcon(input, 'success');
        } else if (!isValid && input.value.length > 0) {
            input.style.borderColor = '#dc3545';
            input.style.boxShadow = '0 0 0 4px rgba(220, 53, 69, 0.1)';
            this.addValidationIcon(input, 'error');
        } else {
            input.style.borderColor = 'rgba(255, 255, 255, 0.3)';
            input.style.boxShadow = 'none';
            this.removeValidationIcon(input);
        }
    }

    addValidationIcon(input, type) {
        this.removeValidationIcon(input);
        
        const icon = document.createElement('div');
        icon.className = 'validation-icon';
        icon.innerHTML = type === 'success' ? '✓' : '✗';
        icon.style.cssText = `
            position: absolute;
            right: 15px;
            top: 50%;
            transform: translateY(-50%);
            color: ${type === 'success' ? '#28a745' : '#dc3545'};
            font-weight: bold;
            font-size: 18px;
            animation: iconPop 0.3s ease-out;
        `;

        input.parentElement.style.position = 'relative';
        input.parentElement.appendChild(icon);

        // Adicionar keyframes para ícone
        if (!document.querySelector('#icon-keyframes')) {
            const style = document.createElement('style');
            style.id = 'icon-keyframes';
            style.textContent = `
                @keyframes iconPop {
                    0% {
                        transform: translateY(-50%) scale(0);
                        opacity: 0;
                    }
                    50% {
                        transform: translateY(-50%) scale(1.2);
                        opacity: 1;
                    }
                    100% {
                        transform: translateY(-50%) scale(1);
                        opacity: 1;
                    }
                }
            `;
            document.head.appendChild(style);
        }
    }

    removeValidationIcon(input) {
        const existingIcon = input.parentElement.querySelector('.validation-icon');
        if (existingIcon) {
            existingIcon.remove();
        }
    }

    // Efeitos de botão avançados
    setupButtonEffects() {
        const buttons = document.querySelectorAll('.btn');
        
        buttons.forEach(button => {
            // Efeito de partículas no clique
            button.addEventListener('click', (e) => {
                this.createButtonParticles(e);
                this.createButtonWave(e);
            });

            // Efeito de hover magnético
            button.addEventListener('mousemove', (e) => {
                this.magneticEffect(e);
            });

            button.addEventListener('mouseleave', (e) => {
                this.resetMagneticEffect(e.target);
            });
        });
    }

    createButtonParticles(event) {
        const button = event.target;
        const rect = button.getBoundingClientRect();
        
        for (let i = 0; i < 12; i++) {
            const particle = document.createElement('div');
            const angle = (Math.PI * 2 * i) / 12;
            const velocity = 50 + Math.random() * 50;
            
            particle.style.cssText = `
                position: fixed;
                width: 4px;
                height: 4px;
                background: #fff;
                border-radius: 50%;
                pointer-events: none;
                z-index: 1000;
                left: ${event.clientX}px;
                top: ${event.clientY}px;
                animation: particleExplosion 0.8s ease-out forwards;
                --angle: ${angle};
                --velocity: ${velocity}px;
            `;
            
            document.body.appendChild(particle);
            
            setTimeout(() => particle.remove(), 800);
        }

        // Adicionar keyframes para explosão de partículas
        if (!document.querySelector('#particle-explosion-keyframes')) {
            const style = document.createElement('style');
            style.id = 'particle-explosion-keyframes';
            style.textContent = `
                @keyframes particleExplosion {
                    0% {
                        transform: translate(0, 0) scale(1);
                        opacity: 1;
                    }
                    100% {
                        transform: translate(
                            calc(cos(var(--angle)) * var(--velocity)),
                            calc(sin(var(--angle)) * var(--velocity))
                        ) scale(0);
                        opacity: 0;
                    }
                }
            `;
            document.head.appendChild(style);
        }
    }

    createButtonWave(event) {
        const button = event.target;
        const wave = document.createElement('div');
        const rect = button.getBoundingClientRect();
        
        wave.style.cssText = `
            position: absolute;
            width: 0;
            height: 0;
            background: radial-gradient(circle, rgba(255,255,255,0.5) 0%, transparent 70%);
            border-radius: 50%;
            transform: translate(-50%, -50%);
            animation: waveExpand 0.6s ease-out;
            pointer-events: none;
            left: ${event.clientX - rect.left}px;
            top: ${event.clientY - rect.top}px;
        `;
        
        button.style.position = 'relative';
        button.appendChild(wave);

        // Adicionar keyframes para onda
        if (!document.querySelector('#wave-keyframes')) {
            const style = document.createElement('style');
            style.id = 'wave-keyframes';
            style.textContent = `
                @keyframes waveExpand {
                    0% {
                        width: 0;
                        height: 0;
                        opacity: 1;
                    }
                    100% {
                        width: 300px;
                        height: 300px;
                        opacity: 0;
                    }
                }
            `;
            document.head.appendChild(style);
        }
        
        setTimeout(() => wave.remove(), 600);
    }

    magneticEffect(event) {
        const button = event.target;
        const rect = button.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        const deltaX = (event.clientX - centerX) * 0.1;
        const deltaY = (event.clientY - centerY) * 0.1;
        
        button.style.transform = `translate(${deltaX}px, ${deltaY}px) scale(1.05)`;
    }

    resetMagneticEffect(button) {
        button.style.transform = 'translate(0, 0) scale(1)';
    }

    // Animações de scroll
    setupScrollAnimations() {
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('animate-in');
                }
            });
        }, observerOptions);

        // Observar elementos para animação
        document.querySelectorAll('.card, .header, .form-group').forEach(el => {
            observer.observe(el);
        });

        // Adicionar estilos de animação
        if (!document.querySelector('#scroll-animation-keyframes')) {
            const style = document.createElement('style');
            style.id = 'scroll-animation-keyframes';
            style.textContent = `
                .animate-in {
                    animation: slideInUp 0.8s ease-out;
                }
                
                @keyframes slideInUp {
                    from {
                        opacity: 0;
                        transform: translateY(50px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
            `;
            document.head.appendChild(style);
        }
    }

    // Cursor personalizado que segue o mouse
    setupMouseFollower() {
        const cursor = document.createElement('div');
        cursor.className = 'custom-cursor';
        cursor.style.cssText = `
            position: fixed;
            width: 20px;
            height: 20px;
            background: radial-gradient(circle, rgba(204, 13, 46, 0.8) 0%, transparent 70%);
            border-radius: 50%;
            pointer-events: none;
            z-index: 9999;
            transition: transform 0.1s ease;
        `;
        document.body.appendChild(cursor);

        document.addEventListener('mousemove', (e) => {
            cursor.style.left = e.clientX - 10 + 'px';
            cursor.style.top = e.clientY - 10 + 'px';
        });

        // Efeito especial em elementos interativos
        document.querySelectorAll('button, input, a').forEach(el => {
            el.addEventListener('mouseenter', () => {
                cursor.style.transform = 'scale(2)';
                cursor.style.background = 'radial-gradient(circle, rgba(255, 255, 255, 0.8) 0%, transparent 70%)';
            });
            
            el.addEventListener('mouseleave', () => {
                cursor.style.transform = 'scale(1)';
                cursor.style.background = 'radial-gradient(circle, rgba(204, 13, 46, 0.8) 0%, transparent 70%)';
            });
        });
    }

    // Efeito de digitação no título
    setupTypingEffect() {
        const title = document.querySelector('.header-title');
        if (title) {
            const text = title.textContent;
            title.textContent = '';
            title.style.borderRight = '2px solid #cc0d2e';
            
            let i = 0;
            const typeWriter = () => {
                if (i < text.length) {
                    title.textContent += text.charAt(i);
                    i++;
                    setTimeout(typeWriter, 100);
                } else {
                    // Remover cursor após digitação
                    setTimeout(() => {
                        title.style.borderRight = 'none';
                    }, 1000);
                }
            };
            
            // Iniciar após um pequeno delay
            setTimeout(typeWriter, 1000);
        }
    }

    // Método para adicionar efeito de loading elegante
    showElegantLoader(element) {
        const loader = document.createElement('div');
        loader.className = 'elegant-loader';
        loader.innerHTML = `
            <div class="loader-ring"></div>
            <div class="loader-ring"></div>
            <div class="loader-ring"></div>
        `;
        loader.style.cssText = `
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            z-index: 1000;
        `;

        element.style.position = 'relative';
        element.appendChild(loader);

        // Adicionar estilos do loader
        if (!document.querySelector('#loader-keyframes')) {
            const style = document.createElement('style');
            style.id = 'loader-keyframes';
            style.textContent = `
                .loader-ring {
                    width: 40px;
                    height: 40px;
                    border: 3px solid rgba(204, 13, 46, 0.1);
                    border-top: 3px solid #cc0d2e;
                    border-radius: 50%;
                    animation: loaderSpin 1s linear infinite;
                    position: absolute;
                }
                
                .loader-ring:nth-child(2) {
                    width: 60px;
                    height: 60px;
                    margin: -10px;
                    animation-delay: 0.1s;
                }
                
                .loader-ring:nth-child(3) {
                    width: 80px;
                    height: 80px;
                    margin: -20px;
                    animation-delay: 0.2s;
                }
                
                @keyframes loaderSpin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            `;
            document.head.appendChild(style);
        }

        return loader;
    }

    hideElegantLoader(loader) {
        if (loader) {
            loader.style.animation = 'fadeOut 0.3s ease-out';
            setTimeout(() => loader.remove(), 300);
        }
    }
}

// Inicializar animações quando o DOM estiver carregado
document.addEventListener('DOMContentLoaded', () => {
    new ElegantAnimations();
});

// Exportar para uso global
window.ElegantAnimations = ElegantAnimations;

