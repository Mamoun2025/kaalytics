/**
 * Kaalytics Modal Component
 */

class KaalyticsModal {
    constructor() {
        this.activeModal = null;
        this.init();
    }

    init() {
        // Close on escape
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.activeModal) {
                this.close();
            }
        });

        // Trigger buttons
        document.querySelectorAll('[data-modal-open]').forEach(btn => {
            btn.addEventListener('click', () => {
                const modalId = btn.dataset.modalOpen;
                this.open(modalId);
            });
        });

        // Close buttons
        document.querySelectorAll('[data-modal-close]').forEach(btn => {
            btn.addEventListener('click', () => this.close());
        });

        // Backdrop click
        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.close();
                }
            });
        });
    }

    open(modalId) {
        const modal = document.getElementById(modalId);
        if (!modal) return;

        this.activeModal = modal;
        modal.classList.add('modal--active');
        document.body.style.overflow = 'hidden';

        // Focus trap
        const focusable = modal.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
        if (focusable.length) {
            focusable[0].focus();
        }

        // Animate in
        if (typeof gsap !== 'undefined') {
            gsap.fromTo(modal.querySelector('.modal__content'),
                { opacity: 0, y: 20, scale: 0.95 },
                { opacity: 1, y: 0, scale: 1, duration: 0.3, ease: 'power2.out' }
            );
        }
    }

    close() {
        if (!this.activeModal) return;

        const modal = this.activeModal;

        // Animate out
        if (typeof gsap !== 'undefined') {
            gsap.to(modal.querySelector('.modal__content'), {
                opacity: 0,
                y: -20,
                duration: 0.2,
                ease: 'power2.in',
                onComplete: () => {
                    modal.classList.remove('modal--active');
                    document.body.style.overflow = '';
                }
            });
        } else {
            modal.classList.remove('modal--active');
            document.body.style.overflow = '';
        }

        this.activeModal = null;
    }
}

// Global modal instance
window.KaalyticsModal = new KaalyticsModal();

// Helper functions
function openModal(id) {
    window.KaalyticsModal.open(id);
}

function closeModal() {
    window.KaalyticsModal.close();
}
