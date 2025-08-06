document.addEventListener('DOMContentLoaded', function() {
    // Menu mobile
    const hamburger = document.getElementById('hamburger');
    const navbarLinks = document.getElementById('navbarLinks');
    
    if (hamburger && navbarLinks) {
        hamburger.addEventListener('click', function() {
            navbarLinks.classList.toggle('active');
        });
    }

    // Set current year in footer
    document.getElementById('current-year').textContent = new Date().getFullYear();

    // Add floating animation to feature cards
    const featureCards = document.querySelectorAll('.feature-card');
    featureCards.forEach(card => {
        card.addEventListener('mouseenter', () => {
            card.classList.add('floating');
        });
        card.addEventListener('mouseleave', () => {
            card.classList.remove('floating');
        });
    });

    // Add decorative elements
    function addDecorativeElements() {
        const container = document.querySelector('.hero');
        const types = ['heart', 'star'];
        const colors = ['#ff9ff3', '#feca57', '#54a0ff', '#5f27cd'];
        
        for (let i = 0; i < 8; i++) {
            const element = document.createElement('i');
            const type = types[Math.floor(Math.random() * types.length)];
            const color = colors[Math.floor(Math.random() * colors.length)];
            
            element.className = `fas fa-${type} decorative`;
            element.style.color = color;
            element.style.fontSize = `${Math.random() * 1 + 0.8}rem`;
            element.style.top = `${Math.random() * 80 + 10}%`;
            element.style.left = `${Math.random() * 80 + 10}%`;
            element.style.animationDuration = `${Math.random() * 3 + 2}s`;
            element.style.opacity = '0.3';
            
            container.appendChild(element);
        }
    }

    addDecorativeElements();
});