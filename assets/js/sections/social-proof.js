/**
 * Kaalytics Social Proof Section
 * - Animated counters
 * - Testimonials carousel with auto-scroll
 */

(function() {
    'use strict';

    // ========================================
    // ANIMATED COUNTERS
    // ========================================

    function initCounters() {
        const counters = document.querySelectorAll('.counter[data-target]');
        if (!counters.length) return;

        const observerOptions = {
            threshold: 0.5,
            rootMargin: '0px'
        };

        const counterObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    animateCounter(entry.target);
                    counterObserver.unobserve(entry.target);
                }
            });
        }, observerOptions);

        counters.forEach(counter => counterObserver.observe(counter));
    }

    function animateCounter(element) {
        const target = parseInt(element.dataset.target);
        const suffix = element.dataset.suffix || '';
        const duration = 2000;
        const start = 0;
        const startTime = performance.now();

        element.classList.add('counting');

        function updateCounter(currentTime) {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);

            // Easing function (ease-out-expo)
            const easeOutExpo = 1 - Math.pow(2, -10 * progress);
            const current = Math.floor(start + (target - start) * easeOutExpo);

            element.textContent = current + suffix;

            if (progress < 1) {
                requestAnimationFrame(updateCounter);
            } else {
                element.textContent = target + suffix;
                element.classList.remove('counting');
            }
        }

        requestAnimationFrame(updateCounter);
    }

    // ========================================
    // TESTIMONIALS CAROUSEL
    // ========================================

    function initTestimonialsCarousel() {
        const carousel = document.getElementById('testimonialCarousel');
        const track = document.getElementById('testimonialTrack');
        const prevBtn = document.getElementById('testimonialPrev');
        const nextBtn = document.getElementById('testimonialNext');
        const dotsContainer = document.getElementById('testimonialDots');

        if (!carousel || !track) return;

        const cards = track.querySelectorAll('.testimonial-card');
        if (!cards.length) return;

        let currentIndex = 0;
        let cardsPerView = getCardsPerView();
        let totalSlides = Math.ceil(cards.length / cardsPerView);
        let autoScrollInterval;
        const AUTO_SCROLL_DELAY = 5000;

        // Create dots
        function createDots() {
            if (!dotsContainer) return;
            dotsContainer.innerHTML = '';

            for (let i = 0; i < totalSlides; i++) {
                const dot = document.createElement('button');
                dot.className = 'testimonials__dot' + (i === 0 ? ' active' : '');
                dot.setAttribute('aria-label', `Slide ${i + 1}`);
                dot.addEventListener('click', () => goToSlide(i));
                dotsContainer.appendChild(dot);
            }
        }

        function getCardsPerView() {
            if (window.innerWidth <= 640) return 1;
            if (window.innerWidth <= 1024) return 2;
            return 3;
        }

        function updateCardsPerView() {
            const newCardsPerView = getCardsPerView();
            if (newCardsPerView !== cardsPerView) {
                cardsPerView = newCardsPerView;
                totalSlides = Math.ceil(cards.length / cardsPerView);
                currentIndex = Math.min(currentIndex, totalSlides - 1);
                createDots();
                updateCarousel();
            }
        }

        function updateCarousel() {
            const cardWidth = cards[0].offsetWidth;
            const gap = parseInt(getComputedStyle(track).gap) || 24;
            const offset = currentIndex * (cardWidth + gap) * cardsPerView;

            track.style.transform = `translateX(-${offset}px)`;

            // Update dots
            const dots = dotsContainer?.querySelectorAll('.testimonials__dot');
            dots?.forEach((dot, i) => {
                dot.classList.toggle('active', i === currentIndex);
            });

            // Update buttons
            if (prevBtn) prevBtn.disabled = currentIndex === 0;
            if (nextBtn) nextBtn.disabled = currentIndex >= totalSlides - 1;
        }

        function goToSlide(index) {
            currentIndex = Math.max(0, Math.min(index, totalSlides - 1));
            updateCarousel();
            resetAutoScroll();
        }

        function nextSlide() {
            if (currentIndex < totalSlides - 1) {
                currentIndex++;
            } else {
                currentIndex = 0;
            }
            updateCarousel();
        }

        function prevSlide() {
            if (currentIndex > 0) {
                currentIndex--;
                updateCarousel();
            }
        }

        function startAutoScroll() {
            autoScrollInterval = setInterval(nextSlide, AUTO_SCROLL_DELAY);
        }

        function stopAutoScroll() {
            clearInterval(autoScrollInterval);
        }

        function resetAutoScroll() {
            stopAutoScroll();
            startAutoScroll();
        }

        // Event listeners
        if (prevBtn) prevBtn.addEventListener('click', () => { prevSlide(); resetAutoScroll(); });
        if (nextBtn) nextBtn.addEventListener('click', () => { nextSlide(); resetAutoScroll(); });

        // Pause on hover
        carousel.addEventListener('mouseenter', stopAutoScroll);
        carousel.addEventListener('mouseleave', startAutoScroll);

        // Touch support
        let touchStartX = 0;
        let touchEndX = 0;

        carousel.addEventListener('touchstart', (e) => {
            touchStartX = e.changedTouches[0].screenX;
            stopAutoScroll();
        }, { passive: true });

        carousel.addEventListener('touchend', (e) => {
            touchEndX = e.changedTouches[0].screenX;
            handleSwipe();
            startAutoScroll();
        }, { passive: true });

        function handleSwipe() {
            const swipeThreshold = 50;
            const diff = touchStartX - touchEndX;

            if (Math.abs(diff) > swipeThreshold) {
                if (diff > 0) {
                    nextSlide();
                } else {
                    prevSlide();
                }
            }
        }

        // Resize handler
        let resizeTimeout;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(updateCardsPerView, 100);
        });

        // Initialize
        createDots();
        updateCarousel();
        startAutoScroll();
    }

    // ========================================
    // INITIALIZATION
    // ========================================

    function init() {
        initCounters();
        initTestimonialsCarousel();
    }

    // Run on DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
