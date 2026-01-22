/**
 * Kaalytics Navbar Component
 * With scroll effect and mobile menu
 */

class KaalyticsNavbar {
    constructor(element) {
        this.navbar = element;
        this.mobileToggle = this.navbar.querySelector('.navbar__mobile-toggle');
        this.mobileMenu = this.navbar.querySelector('.navbar__mobile-menu');
        this.dropdowns = this.navbar.querySelectorAll('.navbar__link--dropdown');

        this.isMenuOpen = false;
        this.isScrolled = false;
        this.scrollThreshold = 50;

        this.init();
    }

    init() {
        // Scroll effect
        this.handleScroll();
        window.addEventListener('scroll', () => this.handleScroll(), { passive: true });

        // Mobile toggle
        if (this.mobileToggle) {
            this.mobileToggle.addEventListener('click', () => this.toggleMobileMenu());
        }

        // Dropdowns on desktop
        this.dropdowns.forEach(dropdown => {
            dropdown.addEventListener('mouseenter', () => this.openDropdown(dropdown));
            dropdown.addEventListener('mouseleave', () => this.closeDropdown(dropdown));
        });

        // Close menu on escape
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isMenuOpen) {
                this.closeMobileMenu();
            }
        });

        // Close menu on click outside
        document.addEventListener('click', (e) => {
            if (this.isMenuOpen && !this.navbar.contains(e.target)) {
                this.closeMobileMenu();
            }
        });

        // Smooth scroll for anchor links
        this.navbar.querySelectorAll('a[href^="#"]').forEach(link => {
            link.addEventListener('click', (e) => this.handleAnchorClick(e, link));
        });
    }

    handleScroll() {
        const scrollY = window.scrollY || window.pageYOffset;
        const shouldBeScrolled = scrollY > this.scrollThreshold;

        if (shouldBeScrolled !== this.isScrolled) {
            this.isScrolled = shouldBeScrolled;
            this.updateNavbarStyle();
        }
    }

    updateNavbarStyle() {
        if (this.isScrolled) {
            this.navbar.classList.remove('navbar--transparent');
            this.navbar.classList.add('navbar--solid');
        } else {
            this.navbar.classList.add('navbar--transparent');
            this.navbar.classList.remove('navbar--solid');
        }
    }

    handleAnchorClick(e, link) {
        const href = link.getAttribute('href');
        if (href.startsWith('#') && href.length > 1) {
            const target = document.querySelector(href);
            if (target) {
                e.preventDefault();
                const offsetTop = target.offsetTop - 80; // Account for navbar height
                window.scrollTo({
                    top: offsetTop,
                    behavior: 'smooth'
                });

                // Close mobile menu if open
                if (this.isMenuOpen) {
                    this.closeMobileMenu();
                }
            }
        }
    }

    toggleMobileMenu() {
        this.isMenuOpen ? this.closeMobileMenu() : this.openMobileMenu();
    }

    openMobileMenu() {
        this.isMenuOpen = true;
        this.mobileMenu?.classList.add('active');
        this.mobileToggle?.setAttribute('aria-expanded', 'true');
        document.body.style.overflow = 'hidden';
    }

    closeMobileMenu() {
        this.isMenuOpen = false;
        this.mobileMenu?.classList.remove('active');
        this.mobileToggle?.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
    }

    openDropdown(dropdown) {
        const megaMenu = dropdown.querySelector('.mega-menu');
        if (megaMenu) {
            megaMenu.style.opacity = '1';
            megaMenu.style.visibility = 'visible';
        }
    }

    closeDropdown(dropdown) {
        const megaMenu = dropdown.querySelector('.mega-menu');
        if (megaMenu) {
            megaMenu.style.opacity = '0';
            megaMenu.style.visibility = 'hidden';
        }
    }
}

// Auto-initialize
document.addEventListener('DOMContentLoaded', () => {
    const navbar = document.querySelector('.navbar');
    if (navbar) {
        new KaalyticsNavbar(navbar);
    }
});
