/**
 * Kaalytics Hero Section
 * Animations and video handling
 */

class HeroSection {
    constructor(element) {
        this.hero = element;
        this.video = element.querySelector('.hero__video');
        this.metrics = element.querySelectorAll('.hero__metric-value');

        this.init();
    }

    init() {
        this.initVideo();
        this.initAnimations();
        this.initCounters();
    }

    initVideo() {
        if (!this.video) return;

        // Handle video loading
        this.video.addEventListener('loadeddata', () => {
            this.video.play().catch(() => {
                // Autoplay blocked, show fallback
                this.hero.classList.add('hero--no-video');
            });
        });

        // Pause video when not visible
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    this.video.play().catch(() => {});
                } else {
                    this.video.pause();
                }
            });
        }, { threshold: 0.25 });

        observer.observe(this.hero);
    }

    initAnimations() {
        if (typeof gsap === 'undefined') return;

        // Stagger animation for hero content
        const tl = gsap.timeline({ delay: 0.3 });

        tl.from('.hero__badge', {
            opacity: 0,
            y: 20,
            duration: 0.6
        })
        .from('.hero__title-line', {
            opacity: 0,
            y: 30,
            stagger: 0.2,
            duration: 0.8
        }, '-=0.3')
        .from('.hero__description', {
            opacity: 0,
            y: 20,
            duration: 0.6
        }, '-=0.4')
        .from('.hero__metric', {
            opacity: 0,
            y: 20,
            stagger: 0.1,
            duration: 0.5
        }, '-=0.3')
        .from('.hero__actions', {
            opacity: 0,
            y: 20,
            duration: 0.5
        }, '-=0.2');
    }

    initCounters() {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    this.animateCounters();
                    observer.disconnect();
                }
            });
        }, { threshold: 0.5 });

        if (this.hero) {
            observer.observe(this.hero);
        }
    }

    animateCounters() {
        this.metrics.forEach(metric => {
            const text = metric.textContent;
            const number = parseInt(text.replace(/[^0-9]/g, ''));

            if (isNaN(number)) return;

            const suffix = text.replace(/[0-9]/g, '');
            const duration = 1500;
            const startTime = performance.now();

            const animate = (currentTime) => {
                const elapsed = currentTime - startTime;
                const progress = Math.min(elapsed / duration, 1);
                const easeProgress = 1 - Math.pow(1 - progress, 3);
                const current = Math.floor(number * easeProgress);

                metric.textContent = current + suffix;

                if (progress < 1) {
                    requestAnimationFrame(animate);
                }
            };

            requestAnimationFrame(animate);
        });
    }
}

// Auto-initialize
document.addEventListener('DOMContentLoaded', () => {
    const heroSection = document.querySelector('.hero');
    if (heroSection) {
        new HeroSection(heroSection);
    }
});
