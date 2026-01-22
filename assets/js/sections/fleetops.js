/**
 * Kaalytics FleetOps Showcase Section
 * Interactive modules with video switching on hover
 */

class FleetOpsShowcase {
    constructor() {
        this.section = document.querySelector('.fleetops-showcase');
        if (!this.section) return;

        this.video = document.getElementById('fleetops-video');
        this.moduleInfo = document.getElementById('module-info');
        this.modules = this.section.querySelectorAll('.fleetops-module');

        this.currentModule = null;
        this.modulesData = null;

        this.init();
    }

    async init() {
        // Load modules data
        await this.loadModulesData();

        // Bind hover events to modules
        this.modules.forEach((module) => {
            module.addEventListener('mouseenter', () => this.activateModule(module));
            module.addEventListener('click', () => this.activateModule(module));
        });

        // Set first module as active
        const firstModule = this.modules[0];
        if (firstModule) {
            firstModule.classList.add('active');
        }
    }

    async loadModulesData() {
        try {
            const response = await fetch('data/fleetops-modules.json');
            if (response.ok) {
                this.modulesData = await response.json();
            }
        } catch (error) {
            console.warn('Could not load FleetOps modules data:', error);
        }
    }

    getModuleData(moduleId) {
        if (!this.modulesData) return null;
        return this.modulesData.find(m => m.id === moduleId);
    }

    activateModule(module) {
        const moduleId = module.dataset.module;
        const videoSrc = module.dataset.video;

        if (this.currentModule === moduleId) return;
        this.currentModule = moduleId;

        // Update active class on all modules
        this.modules.forEach(m => m.classList.remove('active'));
        module.classList.add('active');

        // Get full module data
        const data = this.getModuleData(moduleId);

        // Update module info overlay
        this.updateModuleInfo(module, data);

        // Switch video
        if (videoSrc) {
            this.switchVideo(videoSrc);
        }
    }

    updateModuleInfo(module, data) {
        if (!this.moduleInfo) return;

        const emoji = this.moduleInfo.querySelector('.fleetops-showcase__module-emoji');
        const name = this.moduleInfo.querySelector('.fleetops-showcase__module-name');
        const desc = this.moduleInfo.querySelector('.fleetops-showcase__module-desc');
        const benefit = this.moduleInfo.querySelector('.fleetops-showcase__module-benefit');

        // Get icon from module element
        const moduleIcon = module.querySelector('.fleetops-module__icon');
        const moduleName = module.querySelector('.fleetops-module__name');

        if (emoji && moduleIcon) {
            emoji.textContent = moduleIcon.textContent;
        }

        if (name && moduleName) {
            name.textContent = moduleName.textContent;
        }

        if (data) {
            if (desc) {
                desc.textContent = data.description;
            }
            if (benefit) {
                benefit.textContent = data.benefit;
            }
        }

        // Animate the change
        if (typeof gsap !== 'undefined') {
            gsap.fromTo(this.moduleInfo,
                { opacity: 0.5, y: 10 },
                { opacity: 1, y: 0, duration: 0.3, ease: 'power2.out' }
            );
        }
    }

    switchVideo(videoSrc) {
        if (!this.video) return;

        const source = this.video.querySelector('source');
        if (!source) {
            this.video.src = videoSrc;
        } else {
            source.src = videoSrc;
        }

        // Animate video transition
        if (typeof gsap !== 'undefined') {
            gsap.to(this.video, {
                opacity: 0.3,
                duration: 0.15,
                onComplete: () => {
                    this.video.load();
                    this.video.play().catch(() => {});
                    gsap.to(this.video, { opacity: 1, duration: 0.3 });
                }
            });
        } else {
            this.video.load();
            this.video.play().catch(() => {});
        }
    }
}

// Auto-initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new FleetOpsShowcase();
});
