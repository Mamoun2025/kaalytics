/**
 * GA4 Event Tracking - Kaalytics
 * Track user interactions for analytics
 */

(function() {
    'use strict';

    // Attendre que gtag soit disponible
    function trackEvent(eventName, parameters = {}) {
        if (typeof gtag === 'function') {
            gtag('event', eventName, parameters);
        }
    }

    // ========================================
    // CTA Clicks
    // ========================================
    function trackCTAClicks() {
        // Boutons principaux
        document.querySelectorAll('.btn-primary, .hero__cta-main, .btn-fleet').forEach(btn => {
            btn.addEventListener('click', function() {
                trackEvent('cta_click', {
                    'event_category': 'CTA',
                    'event_label': this.textContent.trim().substring(0, 50),
                    'button_location': getButtonLocation(this)
                });
            });
        });

        // WhatsApp clicks
        document.querySelectorAll('a[href*="wa.me"]').forEach(link => {
            link.addEventListener('click', function() {
                trackEvent('whatsapp_click', {
                    'event_category': 'Contact',
                    'event_label': 'WhatsApp',
                    'link_url': this.href
                });
            });
        });

        // Demo requests
        document.querySelectorAll('a[href*="#contact"], a[href*="contact.html"]').forEach(link => {
            if (link.textContent.toLowerCase().includes('demo') ||
                link.textContent.toLowerCase().includes('audit')) {
                link.addEventListener('click', function() {
                    trackEvent('demo_request', {
                        'event_category': 'Lead',
                        'event_label': this.textContent.trim()
                    });
                });
            }
        });
    }

    function getButtonLocation(element) {
        const section = element.closest('section');
        if (section) {
            return section.className.split(' ')[0] || section.id || 'unknown';
        }
        return 'unknown';
    }

    // ========================================
    // Scroll Depth Tracking
    // ========================================
    function trackScrollDepth() {
        const depths = [25, 50, 75, 90];
        const tracked = new Set();

        window.addEventListener('scroll', function() {
            const scrollPercent = Math.round(
                (window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100
            );

            depths.forEach(depth => {
                if (scrollPercent >= depth && !tracked.has(depth)) {
                    tracked.add(depth);
                    trackEvent('scroll_depth', {
                        'event_category': 'Engagement',
                        'event_label': `${depth}%`,
                        'depth_percentage': depth
                    });
                }
            });
        }, { passive: true });
    }

    // ========================================
    // Form Interactions
    // ========================================
    function trackFormInteractions() {
        const forms = document.querySelectorAll('form');

        forms.forEach(form => {
            let formStarted = false;

            // Track form start
            form.addEventListener('focusin', function() {
                if (!formStarted) {
                    formStarted = true;
                    trackEvent('form_start', {
                        'event_category': 'Form',
                        'form_id': this.id || 'unknown'
                    });
                }
            });

            // Track form submission
            form.addEventListener('submit', function() {
                trackEvent('form_submit', {
                    'event_category': 'Form',
                    'form_id': this.id || 'unknown'
                });
            });
        });
    }

    // ========================================
    // Video Engagement (if applicable)
    // ========================================
    function trackVideoEngagement() {
        const videos = document.querySelectorAll('video');

        videos.forEach(video => {
            video.addEventListener('play', function() {
                trackEvent('video_play', {
                    'event_category': 'Video',
                    'video_title': this.getAttribute('title') || 'untitled'
                });
            });

            video.addEventListener('ended', function() {
                trackEvent('video_complete', {
                    'event_category': 'Video',
                    'video_title': this.getAttribute('title') || 'untitled'
                });
            });
        });
    }

    // ========================================
    // Outbound Links
    // ========================================
    function trackOutboundLinks() {
        document.querySelectorAll('a[href^="http"]').forEach(link => {
            if (!link.href.includes(window.location.hostname)) {
                link.addEventListener('click', function() {
                    trackEvent('outbound_click', {
                        'event_category': 'Outbound',
                        'event_label': this.href,
                        'link_domain': new URL(this.href).hostname
                    });
                });
            }
        });
    }

    // ========================================
    // Navigation Tracking
    // ========================================
    function trackNavigation() {
        document.querySelectorAll('nav a, .navbar a').forEach(link => {
            link.addEventListener('click', function() {
                trackEvent('navigation_click', {
                    'event_category': 'Navigation',
                    'event_label': this.textContent.trim(),
                    'link_url': this.href
                });
            });
        });
    }

    // ========================================
    // FAQ Interactions
    // ========================================
    function trackFAQInteractions() {
        document.querySelectorAll('details').forEach(detail => {
            detail.addEventListener('toggle', function() {
                if (this.open) {
                    const question = this.querySelector('summary')?.textContent.trim();
                    trackEvent('faq_expand', {
                        'event_category': 'FAQ',
                        'event_label': question?.substring(0, 100)
                    });
                }
            });
        });
    }

    // ========================================
    // Time on Page
    // ========================================
    function trackTimeOnPage() {
        const startTime = Date.now();
        const intervals = [30, 60, 120, 300]; // seconds
        const tracked = new Set();

        setInterval(() => {
            const elapsed = Math.floor((Date.now() - startTime) / 1000);

            intervals.forEach(interval => {
                if (elapsed >= interval && !tracked.has(interval)) {
                    tracked.add(interval);
                    trackEvent('time_on_page', {
                        'event_category': 'Engagement',
                        'event_label': `${interval}s`,
                        'seconds': interval
                    });
                }
            });
        }, 5000);
    }

    // ========================================
    // Initialize All Tracking
    // ========================================
    function init() {
        trackCTAClicks();
        trackScrollDepth();
        trackFormInteractions();
        trackVideoEngagement();
        trackOutboundLinks();
        trackNavigation();
        trackFAQInteractions();
        trackTimeOnPage();

        // Track page view with additional data
        trackEvent('page_view_enhanced', {
            'page_path': window.location.pathname,
            'page_title': document.title,
            'referrer': document.referrer || 'direct'
        });
    }

    // Run on DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
