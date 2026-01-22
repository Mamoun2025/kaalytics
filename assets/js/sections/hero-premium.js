/**
 * Kaalytics Hero Premium Animations
 * Effets avances et micro-interactions
 */

class HeroPremium {
    constructor() {
        this.init();
    }

    init() {
        this.initRotatingText();
        this.initCounterAnimation();
        this.initStickyMobileCTA();
        this.initSmoothScroll();
        this.initParallaxOrbs();
    }

    // Texte rotatif pour le highlight du titre - Pain points du pitch
    initRotatingText() {
        const rotatingEl = document.getElementById('rotating-problem');
        if (!rotatingEl) return;

        const problems = [
            '30% de trop',
            '5-10 systemes',
            'des pannes imprevues',
            'zero visibilite',
            'trop de temps admin'
        ];

        let currentIndex = 0;

        setInterval(() => {
            // Fade out
            rotatingEl.style.opacity = '0';
            rotatingEl.style.transform = 'translateY(-10px)';

            setTimeout(() => {
                currentIndex = (currentIndex + 1) % problems.length;
                rotatingEl.textContent = problems[currentIndex];

                // Fade in
                rotatingEl.style.opacity = '1';
                rotatingEl.style.transform = 'translateY(0)';
            }, 300);
        }, 3000);

        // CSS transition
        rotatingEl.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
    }

    // Animation des compteurs
    initCounterAnimation() {
        const metrics = document.querySelectorAll('.hero__metric-value');
        if (!metrics.length) return;

        const animateValue = (el, start, end, duration, suffix = '') => {
            const startTime = performance.now();
            const isNegative = end < 0;
            const absEnd = Math.abs(end);

            const step = (currentTime) => {
                const elapsed = currentTime - startTime;
                const progress = Math.min(elapsed / duration, 1);

                // Easing function (ease-out)
                const easeOut = 1 - Math.pow(1 - progress, 3);
                const current = Math.floor(easeOut * absEnd);

                el.textContent = (isNegative ? '-' : '') + current + suffix;

                if (progress < 1) {
                    requestAnimationFrame(step);
                }
            };

            requestAnimationFrame(step);
        };

        // Observer pour declencher l'animation au scroll
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const el = entry.target;
                    const text = el.textContent;

                    // Parse la valeur
                    if (text.includes('%')) {
                        const num = parseInt(text);
                        if (!isNaN(num)) {
                            animateValue(el, 0, num, 1500, '%');
                        }
                    }

                    observer.unobserve(el);
                }
            });
        }, { threshold: 0.5 });

        metrics.forEach(metric => observer.observe(metric));
    }

    // CTA sticky mobile
    initStickyMobileCTA() {
        // Creer le CTA sticky s'il n'existe pas
        if (document.querySelector('.sticky-cta')) return;

        const stickyCTA = document.createElement('div');
        stickyCTA.className = 'sticky-cta';
        stickyCTA.innerHTML = `
            <a href="#contact" class="sticky-cta__btn">
                Audit gratuit en 48h
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M5 12h14M12 5l7 7-7 7"/>
                </svg>
            </a>
        `;
        document.body.appendChild(stickyCTA);

        // Afficher/cacher selon le scroll
        const hero = document.querySelector('.hero');
        if (!hero) return;

        let lastScroll = 0;
        const heroBottom = hero.offsetTop + hero.offsetHeight;

        window.addEventListener('scroll', () => {
            const currentScroll = window.pageYOffset;

            // Afficher apres le hero
            if (currentScroll > heroBottom - 100) {
                stickyCTA.classList.add('visible');
                document.body.classList.add('sticky-cta-active');
            } else {
                stickyCTA.classList.remove('visible');
                document.body.classList.remove('sticky-cta-active');
            }

            lastScroll = currentScroll;
        }, { passive: true });
    }

    // Smooth scroll pour les ancres
    initSmoothScroll() {
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', (e) => {
                const targetId = anchor.getAttribute('href');
                if (targetId === '#') return;

                const target = document.querySelector(targetId);
                if (!target) return;

                e.preventDefault();

                const navbarHeight = document.querySelector('.navbar')?.offsetHeight || 0;
                const targetPosition = target.getBoundingClientRect().top + window.pageYOffset - navbarHeight;

                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });

                // Fermer le menu mobile si ouvert
                document.querySelector('.navbar__mobile-menu')?.classList.remove('active');
            });
        });
    }

    // Effet parallax sur les orbes
    initParallaxOrbs() {
        const orbs = document.querySelectorAll('.hero__orb');
        if (!orbs.length) return;

        let ticking = false;

        window.addEventListener('scroll', () => {
            if (!ticking) {
                requestAnimationFrame(() => {
                    const scrollY = window.pageYOffset;
                    const heroHeight = document.querySelector('.hero')?.offsetHeight || 0;

                    if (scrollY < heroHeight) {
                        orbs.forEach((orb, index) => {
                            const speed = 0.2 + (index * 0.1);
                            orb.style.transform = `translate(0, ${scrollY * speed}px)`;
                        });
                    }

                    ticking = false;
                });

                ticking = true;
            }
        }, { passive: true });
    }
}

// Mouse follower effect for hero
class MouseFollower {
    constructor() {
        this.hero = document.querySelector('.hero');
        if (!this.hero) return;

        this.follower = null;
        this.mouseX = 0;
        this.mouseY = 0;
        this.followerX = 0;
        this.followerY = 0;

        this.init();
    }

    init() {
        // Creer l'element follower
        this.follower = document.createElement('div');
        this.follower.className = 'hero__mouse-follower';
        this.follower.style.cssText = `
            position: fixed;
            width: 300px;
            height: 300px;
            border-radius: 50%;
            background: radial-gradient(circle, rgba(16, 185, 129, 0.15) 0%, transparent 70%);
            pointer-events: none;
            z-index: 1;
            transform: translate(-50%, -50%);
            transition: opacity 0.3s ease;
            opacity: 0;
        `;
        this.hero.appendChild(this.follower);

        // Event listeners
        this.hero.addEventListener('mouseenter', () => {
            this.follower.style.opacity = '1';
        });

        this.hero.addEventListener('mouseleave', () => {
            this.follower.style.opacity = '0';
        });

        this.hero.addEventListener('mousemove', (e) => {
            this.mouseX = e.clientX;
            this.mouseY = e.clientY;
        });

        this.animate();
    }

    animate() {
        // Smooth follow
        this.followerX += (this.mouseX - this.followerX) * 0.1;
        this.followerY += (this.mouseY - this.followerY) * 0.1;

        this.follower.style.left = `${this.followerX}px`;
        this.follower.style.top = `${this.followerY}px`;

        requestAnimationFrame(() => this.animate());
    }
}

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
    new HeroPremium();

    // Mouse follower uniquement sur desktop
    if (window.innerWidth > 768) {
        new MouseFollower();
    }
});
