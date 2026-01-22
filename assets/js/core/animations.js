/**
 * Kaalytics GSAP Animations
 * Subtle scroll-triggered animations for homepage elements
 */

class KaalyticsAnimations {
    constructor() {
        this.init();
    }

    init() {
        // Wait for GSAP and ScrollTrigger to load
        if (typeof gsap === 'undefined') {
            console.warn('GSAP not loaded, animations disabled');
            return;
        }

        // Register ScrollTrigger plugin
        if (typeof ScrollTrigger !== 'undefined') {
            gsap.registerPlugin(ScrollTrigger);
        }

        // Initialize all animations
        this.animateHero();
        this.animateOnScroll();
        this.animateCounters();
        this.animateModuleCards();
    }

    // Hero section entrance animation
    animateHero() {
        const hero = document.querySelector('.hero');
        if (!hero) return;

        const badge = hero.querySelector('.hero__badge, .badge');
        const title = hero.querySelector('.hero__title, h1');
        const description = hero.querySelector('.lead, p');
        const metrics = hero.querySelector('.hero__metrics');
        const buttons = hero.querySelector('.btn-group');

        const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

        tl.set([badge, title, description, metrics, buttons].filter(Boolean), {
            opacity: 0,
            y: 30
        });

        tl.to(badge, { opacity: 1, y: 0, duration: 0.6 }, 0.2)
          .to(title, { opacity: 1, y: 0, duration: 0.8 }, 0.3)
          .to(description, { opacity: 1, y: 0, duration: 0.6 }, 0.5)
          .to(metrics, { opacity: 1, y: 0, duration: 0.6 }, 0.6)
          .to(buttons, { opacity: 1, y: 0, duration: 0.6 }, 0.7);
    }

    // Scroll-triggered animations for sections
    animateOnScroll() {
        if (typeof ScrollTrigger === 'undefined') return;

        // Section headers
        gsap.utils.toArray('.section-header, .fleetops-showcase__header').forEach(header => {
            gsap.from(header, {
                scrollTrigger: {
                    trigger: header,
                    start: 'top 85%',
                    toggleActions: 'play none none none'
                },
                opacity: 0,
                y: 40,
                duration: 0.8,
                ease: 'power2.out'
            });
        });

        // Module IA cards - stagger effect
        gsap.utils.toArray('.modules-ia__grid').forEach(grid => {
            const cards = grid.querySelectorAll('.module-ia-card');
            // Set initial state
            gsap.set(cards, { opacity: 1, y: 0, scale: 1 });

            ScrollTrigger.create({
                trigger: grid,
                start: 'top 85%',
                onEnter: () => {
                    gsap.fromTo(cards,
                        { opacity: 0, y: 40, scale: 0.95 },
                        {
                            opacity: 1,
                            y: 0,
                            scale: 1,
                            duration: 0.5,
                            stagger: 0.08,
                            ease: 'power2.out'
                        }
                    );
                },
                once: true
            });
        });

        // FleetOps modules
        gsap.utils.toArray('.fleetops-showcase__modules').forEach(grid => {
            const modules = grid.querySelectorAll('.fleetops-module');
            gsap.from(modules, {
                scrollTrigger: {
                    trigger: grid,
                    start: 'top 85%',
                    toggleActions: 'play none none none'
                },
                opacity: 0,
                scale: 0.9,
                duration: 0.5,
                stagger: 0.08,
                ease: 'back.out(1.4)'
            });
        });

        // Stats animation
        gsap.utils.toArray('.fleetops-showcase__stats, .social-proof__stats').forEach(stats => {
            gsap.from(stats.children, {
                scrollTrigger: {
                    trigger: stats,
                    start: 'top 85%',
                    toggleActions: 'play none none none'
                },
                opacity: 0,
                y: 30,
                duration: 0.6,
                stagger: 0.15,
                ease: 'power2.out'
            });
        });

        // Video container
        const videoContainer = document.querySelector('.fleetops-showcase__video-wrapper');
        if (videoContainer) {
            gsap.from(videoContainer, {
                scrollTrigger: {
                    trigger: videoContainer,
                    start: 'top 85%',
                    toggleActions: 'play none none none'
                },
                opacity: 0,
                scale: 0.95,
                duration: 0.8,
                ease: 'power2.out'
            });
        }

        // CTA section
        const ctaSection = document.querySelector('.cta-section');
        if (ctaSection) {
            gsap.from(ctaSection.querySelector('.cta-section__content'), {
                scrollTrigger: {
                    trigger: ctaSection,
                    start: 'top 80%',
                    toggleActions: 'play none none none'
                },
                opacity: 0,
                y: 50,
                duration: 0.8,
                ease: 'power2.out'
            });
        }
    }

    // Animated counters for stats
    animateCounters() {
        if (typeof ScrollTrigger === 'undefined') return;

        const statValues = document.querySelectorAll('.social-proof__stat-value, .fleetops-showcase__stat-value');

        statValues.forEach(stat => {
            const text = stat.textContent;
            const numMatch = text.match(/(-?\d+)/);

            if (numMatch) {
                const endValue = parseInt(numMatch[1]);
                const prefix = text.slice(0, text.indexOf(numMatch[1]));
                const suffix = text.slice(text.indexOf(numMatch[1]) + numMatch[1].length);

                ScrollTrigger.create({
                    trigger: stat,
                    start: 'top 90%',
                    onEnter: () => {
                        gsap.fromTo(stat,
                            { innerText: prefix + '0' + suffix },
                            {
                                innerText: endValue,
                                duration: 1.5,
                                ease: 'power2.out',
                                snap: { innerText: 1 },
                                onUpdate: function() {
                                    const current = Math.round(gsap.getProperty(stat, 'innerText'));
                                    stat.textContent = prefix + current + suffix;
                                },
                                onComplete: () => {
                                    stat.textContent = text; // Reset to original
                                }
                            }
                        );
                    },
                    once: true
                });
            }
        });
    }

    // Hover animations for module cards
    animateModuleCards() {
        const cards = document.querySelectorAll('.module-ia-card');

        cards.forEach(card => {
            card.addEventListener('mouseenter', () => {
                gsap.to(card, {
                    scale: 1.02,
                    duration: 0.3,
                    ease: 'power2.out'
                });
            });

            card.addEventListener('mouseleave', () => {
                gsap.to(card, {
                    scale: 1,
                    duration: 0.3,
                    ease: 'power2.out'
                });
            });
        });
    }
}

// Magnetic button effect
    animateMagneticButtons() {
        const buttons = document.querySelectorAll('.btn-primary, .btn-orange, .btn-purple');

        buttons.forEach(btn => {
            btn.addEventListener('mousemove', (e) => {
                const rect = btn.getBoundingClientRect();
                const x = e.clientX - rect.left - rect.width / 2;
                const y = e.clientY - rect.top - rect.height / 2;

                gsap.to(btn, {
                    x: x * 0.2,
                    y: y * 0.2,
                    duration: 0.3,
                    ease: 'power2.out'
                });
            });

            btn.addEventListener('mouseleave', () => {
                gsap.to(btn, {
                    x: 0,
                    y: 0,
                    duration: 0.5,
                    ease: 'elastic.out(1, 0.5)'
                });
            });
        });
    }

    // Parallax effect for hero background
    animateParallax() {
        if (typeof ScrollTrigger === 'undefined') return;

        const heroGlow = document.querySelector('.hero__glow, .hero::before');
        if (heroGlow) {
            gsap.to(heroGlow, {
                scrollTrigger: {
                    trigger: '.hero',
                    start: 'top top',
                    end: 'bottom top',
                    scrub: 1
                },
                y: 200,
                opacity: 0.3
            });
        }
    }

    // Text reveal animation
    animateTextReveal() {
        if (typeof ScrollTrigger === 'undefined') return;

        const revealTexts = document.querySelectorAll('[data-reveal]');

        revealTexts.forEach(text => {
            const chars = text.textContent.split('');
            text.innerHTML = chars.map(char =>
                char === ' ' ? ' ' : `<span class="char">${char}</span>`
            ).join('');

            gsap.from(text.querySelectorAll('.char'), {
                scrollTrigger: {
                    trigger: text,
                    start: 'top 85%',
                    toggleActions: 'play none none none'
                },
                opacity: 0,
                y: 20,
                rotateX: -90,
                stagger: 0.02,
                duration: 0.5,
                ease: 'back.out(1.7)'
            });
        });
    }

    // Floating animation for icons/elements
    animateFloating() {
        const floatingElements = document.querySelectorAll('[data-float]');

        floatingElements.forEach((el, index) => {
            gsap.to(el, {
                y: -10,
                duration: 2 + (index * 0.2),
                repeat: -1,
                yoyo: true,
                ease: 'sine.inOut'
            });
        });
    }

    // Color shift on scroll for pricing cards
    animatePricingCards() {
        if (typeof ScrollTrigger === 'undefined') return;

        const pricingCards = document.querySelectorAll('.pricing-card');

        pricingCards.forEach((card, index) => {
            gsap.from(card, {
                scrollTrigger: {
                    trigger: card,
                    start: 'top 85%',
                    toggleActions: 'play none none none'
                },
                opacity: 0,
                y: 60,
                rotateY: index % 2 === 0 ? -10 : 10,
                duration: 0.8,
                delay: index * 0.15,
                ease: 'power3.out'
            });
        });
    }

    // Cursor follower effect (optional, for premium feel)
    initCursorFollower() {
        const cursor = document.createElement('div');
        cursor.className = 'cursor-follower';
        cursor.innerHTML = '<div class="cursor-follower__dot"></div><div class="cursor-follower__ring"></div>';
        document.body.appendChild(cursor);

        const dot = cursor.querySelector('.cursor-follower__dot');
        const ring = cursor.querySelector('.cursor-follower__ring');

        let mouseX = 0, mouseY = 0;

        document.addEventListener('mousemove', (e) => {
            mouseX = e.clientX;
            mouseY = e.clientY;
        });

        gsap.ticker.add(() => {
            gsap.to(dot, { x: mouseX, y: mouseY, duration: 0.1 });
            gsap.to(ring, { x: mouseX, y: mouseY, duration: 0.3 });
        });

        // Scale effect on hover
        const interactiveElements = document.querySelectorAll('a, button, .card, .module-ia-card');
        interactiveElements.forEach(el => {
            el.addEventListener('mouseenter', () => {
                gsap.to(ring, { scale: 1.5, opacity: 0.5, duration: 0.3 });
            });
            el.addEventListener('mouseleave', () => {
                gsap.to(ring, { scale: 1, opacity: 1, duration: 0.3 });
            });
        });
    }

    // Smooth scroll sections
    initSmoothScroll() {
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function(e) {
                e.preventDefault();
                const target = document.querySelector(this.getAttribute('href'));
                if (target) {
                    gsap.to(window, {
                        duration: 1,
                        scrollTo: { y: target, offsetY: 80 },
                        ease: 'power3.inOut'
                    });
                }
            });
        });
    }

    // Number ticker animation for stats
    animateNumberTicker(element, endValue, suffix = '') {
        const obj = { value: 0 };
        gsap.to(obj, {
            value: endValue,
            duration: 2,
            ease: 'power2.out',
            onUpdate: () => {
                element.textContent = Math.round(obj.value).toLocaleString() + suffix;
            }
        });
    }

    // Stagger reveal for grid items
    animateGridReveal() {
        if (typeof ScrollTrigger === 'undefined') return;

        const grids = document.querySelectorAll('.guides__grid, .blog__grid, .features__grid');

        grids.forEach(grid => {
            const items = grid.children;

            gsap.from(items, {
                scrollTrigger: {
                    trigger: grid,
                    start: 'top 85%',
                    toggleActions: 'play none none none'
                },
                opacity: 0,
                y: 40,
                scale: 0.95,
                stagger: {
                    each: 0.1,
                    from: 'start',
                    grid: 'auto'
                },
                duration: 0.6,
                ease: 'power2.out'
            });
        });
    }
}

// Initialize animations when DOM and GSAP are ready
document.addEventListener('DOMContentLoaded', () => {
    // Small delay to ensure GSAP is fully loaded
    setTimeout(() => {
        const animations = new KaalyticsAnimations();

        // Initialize additional effects
        if (typeof gsap !== 'undefined') {
            animations.animateMagneticButtons();
            animations.animateParallax();
            animations.animateFloating();
            animations.animatePricingCards();
            animations.animateGridReveal();

            // Optional premium cursor (uncomment if desired)
            // animations.initCursorFollower();

            // Smooth scroll if ScrollToPlugin is available
            if (typeof ScrollToPlugin !== 'undefined') {
                animations.initSmoothScroll();
            }
        }
    }, 100);
});
