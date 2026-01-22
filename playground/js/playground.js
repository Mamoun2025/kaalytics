/**
 * Digital Playground
 * Interactive Module Sandbox
 */

class Playground {
    constructor() {
        this.notes = [];
        this.connections = [];
        this.noteCounter = 0;
        this.isDragging = false;
        this.draggedData = null;
        this.isConnecting = false;
        this.connectionStart = null;
        this.tempLine = null;
        this.history = [];

        this.init();
    }

    // ==================== ELEMENTS ====================
    get elements() {
        return {
            workspace: document.getElementById('workspace'),
            connectionsLayer: document.getElementById('connectionsLayer'),
            sidebarContent: document.getElementById('sidebarContent'),
            emptyState: document.getElementById('emptyState'),
            statsBar: document.getElementById('statsBar'),
            moduleCount: document.getElementById('moduleCount'),
            connectionCount: document.getElementById('connectionCount'),
            toast: document.getElementById('toast'),
            toastText: document.getElementById('toastText'),
            searchInput: document.getElementById('searchInput'),
            clearBtn: document.getElementById('clearBtn'),
            analyzeBtn: document.getElementById('analyzeBtn'),
            undoBtn: document.getElementById('undoBtn')
        };
    }

    // ==================== INIT ====================
    init() {
        this.renderSidebar();
        this.setupDragDrop();
        this.setupWorkspace();
        this.setupButtons();
        this.saveHistory();
    }

    // ==================== RENDER SIDEBAR ====================
    renderSidebar(filter = '') {
        const filterLower = filter.toLowerCase();
        const el = this.elements;

        el.sidebarContent.innerHTML = EQUIPMENT_MODULES.categories.map(cat => {
            const filtered = cat.modules.filter(m =>
                m.name.toLowerCase().includes(filterLower) ||
                m.desc.toLowerCase().includes(filterLower) ||
                m.code.toLowerCase().includes(filterLower)
            );

            if (filtered.length === 0 && filter) return '';

            const modules = filter ? filtered : cat.modules;

            return `
                <div class="category">
                    <div class="category-header">
                        <span class="category-icon">${cat.icon}</span>
                        <span class="category-name">${cat.name}</span>
                    </div>
                    <div class="module-list">
                        ${modules.map(m => `
                            <div class="module-card" draggable="true"
                                 data-id="${m.id}"
                                 data-code="${m.code}"
                                 data-name="${m.name}"
                                 data-icon="${m.icon}"
                                 data-desc="${m.desc}"
                                 data-color="${m.color}"
                                 data-category="${cat.name}">
                                <div class="module-dot ${m.color}"></div>
                                <div class="module-info">
                                    <div class="module-name">${m.name}</div>
                                    <div class="module-desc">${m.desc}</div>
                                </div>
                                <span class="module-code">${m.code}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        }).join('');
    }

    // ==================== DRAG & DROP ====================
    setupDragDrop() {
        const el = this.elements;

        el.sidebarContent.addEventListener('dragstart', (e) => {
            const card = e.target.closest('.module-card');
            if (!card) return;

            this.draggedData = {
                id: card.dataset.id,
                code: card.dataset.code,
                name: card.dataset.name,
                icon: card.dataset.icon,
                desc: card.dataset.desc,
                color: card.dataset.color,
                category: card.dataset.category
            };

            card.classList.add('dragging');
            e.dataTransfer.effectAllowed = 'copy';
        });

        el.sidebarContent.addEventListener('dragend', (e) => {
            const card = e.target.closest('.module-card');
            if (card) card.classList.remove('dragging');
            this.draggedData = null;
            el.workspace.classList.remove('drag-over');
        });

        el.workspace.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'copy';
            el.workspace.classList.add('drag-over');
        });

        el.workspace.addEventListener('dragleave', () => {
            el.workspace.classList.remove('drag-over');
        });

        el.workspace.addEventListener('drop', (e) => {
            e.preventDefault();
            el.workspace.classList.remove('drag-over');

            if (!this.draggedData) return;

            const rect = el.workspace.getBoundingClientRect();
            const x = e.clientX - rect.left - 90;
            const y = e.clientY - rect.top - 50;

            this.createNote(this.draggedData, x, y);
            this.draggedData = null;
        });

        el.searchInput.addEventListener('input', (e) => {
            this.renderSidebar(e.target.value);
        });
    }

    // ==================== CREATE NOTE ====================
    createNote(data, x, y) {
        const id = `note-${this.noteCounter++}`;
        const el = this.elements;

        const noteEl = document.createElement('div');
        noteEl.className = `note ${data.color}`;
        noteEl.id = id;
        noteEl.style.left = `${x}px`;
        noteEl.style.top = `${y}px`;

        noteEl.innerHTML = `
            <div class="port input" data-port="input" data-note="${id}"></div>
            <div class="port output" data-port="output" data-note="${id}"></div>
            <div class="note-header">
                <span class="note-icon">${data.icon}</span>
                <div class="note-actions">
                    <button class="note-btn delete" data-delete="${id}" title="Supprimer">✕</button>
                </div>
            </div>
            <div class="note-title">${data.name}</div>
            <div class="note-desc">${data.desc}</div>
            <span class="note-code">${data.code}</span>
        `;

        // Delete button handler
        noteEl.querySelector('.note-btn.delete').addEventListener('click', () => {
            this.deleteNote(id);
        });

        el.workspace.appendChild(noteEl);

        this.notes.push({
            id,
            ...data,
            x,
            y,
            element: noteEl
        });

        this.makeDraggable(noteEl);

        noteEl.classList.add('pulse');
        setTimeout(() => noteEl.classList.remove('pulse'), 350);

        this.saveHistory();
        this.updateUI();
    }

    // ==================== MAKE DRAGGABLE ====================
    makeDraggable(noteEl) {
        const el = this.elements;
        let offsetX, offsetY;

        noteEl.addEventListener('mousedown', (e) => {
            if (e.target.classList.contains('port') ||
                e.target.classList.contains('note-btn')) return;

            this.isDragging = true;
            noteEl.classList.add('selected');

            const rect = noteEl.getBoundingClientRect();
            const wsRect = el.workspace.getBoundingClientRect();
            offsetX = e.clientX - rect.left;
            offsetY = e.clientY - rect.top;

            const onMove = (e) => {
                if (!this.isDragging) return;

                const x = e.clientX - wsRect.left - offsetX;
                const y = e.clientY - wsRect.top - offsetY;

                noteEl.style.left = `${Math.max(0, x)}px`;
                noteEl.style.top = `${Math.max(0, y)}px`;

                const note = this.notes.find(n => n.id === noteEl.id);
                if (note) {
                    note.x = x;
                    note.y = y;
                }

                this.redrawConnections();
            };

            const onUp = () => {
                this.isDragging = false;
                noteEl.classList.remove('selected');
                document.removeEventListener('mousemove', onMove);
                document.removeEventListener('mouseup', onUp);
            };

            document.addEventListener('mousemove', onMove);
            document.addEventListener('mouseup', onUp);
        });
    }

    // ==================== CONNECTIONS ====================
    setupWorkspace() {
        const el = this.elements;

        el.workspace.addEventListener('mousedown', (e) => {
            const port = e.target.closest('.port');
            if (!port) return;

            this.isConnecting = true;
            this.connectionStart = {
                noteId: port.dataset.note,
                portType: port.dataset.port,
                element: port
            };
            port.classList.add('active');

            const pos = this.getPortCenter(port);
            this.tempLine = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            this.tempLine.setAttribute('class', 'temp-connection');
            this.tempLine.setAttribute('d', `M ${pos.x} ${pos.y} L ${pos.x} ${pos.y}`);
            el.connectionsLayer.appendChild(this.tempLine);
        });

        el.workspace.addEventListener('mousemove', (e) => {
            if (!this.isConnecting || !this.tempLine) return;

            const rect = el.workspace.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            const start = this.getPortCenter(this.connectionStart.element);

            this.tempLine.setAttribute('d', this.createCurve(start, { x, y }));
        });

        el.workspace.addEventListener('mouseup', (e) => {
            if (!this.isConnecting) return;

            const port = e.target.closest('.port');

            if (port && this.connectionStart) {
                const endId = port.dataset.note;
                const endType = port.dataset.port;

                if (endId !== this.connectionStart.noteId &&
                    endType !== this.connectionStart.portType) {

                    const exists = this.connections.some(c =>
                        (c.from === this.connectionStart.noteId && c.to === endId) ||
                        (c.from === endId && c.to === this.connectionStart.noteId)
                    );

                    if (!exists) {
                        const from = this.connectionStart.portType === 'output'
                            ? this.connectionStart.noteId
                            : endId;
                        const to = this.connectionStart.portType === 'output'
                            ? endId
                            : this.connectionStart.noteId;

                        this.connections.push({ from, to });
                        this.redrawConnections();
                        this.updateUI();
                        this.saveHistory();

                        // Effects
                        const fromNote = document.getElementById(from);
                        const toNote = document.getElementById(to);
                        fromNote?.classList.add('pulse');
                        toNote?.classList.add('pulse');
                        setTimeout(() => {
                            fromNote?.classList.remove('pulse');
                            toNote?.classList.remove('pulse');
                        }, 350);

                        this.createSparkles(port);
                        this.showToast('✓', 'Connexion créée!');
                        this.updatePortStates();
                    }
                }
            }

            this.cleanupConnection();
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isConnecting) {
                this.cleanupConnection();
            }
        });
    }

    cleanupConnection() {
        if (this.connectionStart?.element) {
            this.connectionStart.element.classList.remove('active');
        }
        if (this.tempLine) {
            this.tempLine.remove();
        }
        this.tempLine = null;
        this.isConnecting = false;
        this.connectionStart = null;
    }

    redrawConnections() {
        const el = this.elements;

        // Clear existing
        const paths = el.connectionsLayer.querySelectorAll('path:not(.temp-connection)');
        paths.forEach(p => p.remove());

        // Draw each connection
        this.connections.forEach(conn => {
            const fromNote = document.getElementById(conn.from);
            const toNote = document.getElementById(conn.to);

            if (!fromNote || !toNote) return;

            const fromPort = fromNote.querySelector('.port.output');
            const toPort = toNote.querySelector('.port.input');
            const start = this.getPortCenter(fromPort);
            const end = this.getPortCenter(toPort);
            const d = this.createCurve(start, end);

            // Background (white stroke)
            const bg = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            bg.setAttribute('d', d);
            bg.setAttribute('class', 'connection-bg');
            el.connectionsLayer.appendChild(bg);

            // Main path
            const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            path.setAttribute('d', d);
            path.setAttribute('class', 'connection-path');
            el.connectionsLayer.appendChild(path);

            // Animated flow
            const flow = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            flow.setAttribute('d', d);
            flow.setAttribute('class', 'connection-flow');
            el.connectionsLayer.appendChild(flow);
        });
    }

    createCurve(start, end) {
        const dx = Math.abs(end.x - start.x);
        const offset = Math.max(50, dx * 0.4);
        return `M ${start.x} ${start.y} C ${start.x + offset} ${start.y}, ${end.x - offset} ${end.y}, ${end.x} ${end.y}`;
    }

    getPortCenter(port) {
        const el = this.elements;
        const rect = port.getBoundingClientRect();
        const wsRect = el.workspace.getBoundingClientRect();
        return {
            x: rect.left + rect.width / 2 - wsRect.left,
            y: rect.top + rect.height / 2 - wsRect.top
        };
    }

    updatePortStates() {
        document.querySelectorAll('.port').forEach(p => p.classList.remove('connected'));

        this.connections.forEach(conn => {
            const from = document.getElementById(conn.from);
            const to = document.getElementById(conn.to);
            from?.querySelector('.port.output')?.classList.add('connected');
            to?.querySelector('.port.input')?.classList.add('connected');
        });
    }

    // ==================== EFFECTS ====================
    createSparkles(element) {
        const rect = element.getBoundingClientRect();
        const container = document.createElement('div');
        container.className = 'sparkle-container';
        container.style.left = `${rect.left + rect.width / 2}px`;
        container.style.top = `${rect.top + rect.height / 2}px`;

        for (let i = 0; i < 10; i++) {
            const sparkle = document.createElement('div');
            sparkle.className = 'sparkle';

            const angle = (i / 10) * Math.PI * 2;
            const dist = 15 + Math.random() * 25;
            const tx = Math.cos(angle) * dist;
            const ty = Math.sin(angle) * dist;

            const keyframes = `
                @keyframes sparkle${i}_${Date.now()} {
                    0% { transform: translate(0, 0) scale(1); opacity: 1; }
                    100% { transform: translate(${tx}px, ${ty}px) scale(0); opacity: 0; }
                }
            `;
            const style = document.createElement('style');
            style.textContent = keyframes;
            document.head.appendChild(style);

            sparkle.style.animation = `sparkle${i}_${Date.now()} 0.35s ease-out forwards`;
            container.appendChild(sparkle);
        }

        document.body.appendChild(container);
        setTimeout(() => container.remove(), 400);
    }

    showToast(icon, message) {
        const el = this.elements;
        el.toast.querySelector('.toast-icon').textContent = icon;
        el.toastText.textContent = message;
        el.toast.classList.add('visible');
        setTimeout(() => el.toast.classList.remove('visible'), 2000);
    }

    // ==================== UI ====================
    updateUI() {
        const el = this.elements;

        el.emptyState.style.display = this.notes.length === 0 ? 'block' : 'none';

        if (this.notes.length > 0) {
            el.statsBar.classList.add('visible');
            el.moduleCount.textContent = this.notes.length;
            el.connectionCount.textContent = this.connections.length;
        } else {
            el.statsBar.classList.remove('visible');
        }
    }

    // ==================== ACTIONS ====================
    deleteNote(id) {
        const noteEl = document.getElementById(id);
        if (noteEl) noteEl.remove();

        this.notes = this.notes.filter(n => n.id !== id);
        this.connections = this.connections.filter(c => c.from !== id && c.to !== id);

        this.redrawConnections();
        this.updatePortStates();
        this.updateUI();
        this.saveHistory();
    }

    setupButtons() {
        const el = this.elements;

        el.clearBtn.addEventListener('click', () => {
            this.notes.forEach(n => n.element.remove());
            this.notes = [];
            this.connections = [];
            this.redrawConnections();
            this.updateUI();
            this.saveHistory();
        });

        el.analyzeBtn.addEventListener('click', () => {
            if (this.notes.length === 0) {
                this.showToast('⚠️', 'Ajoutez des modules d\'abord');
                return;
            }

            this.analyzeConfiguration();
        });

        el.undoBtn.addEventListener('click', () => this.undo());
    }

    analyzeConfiguration() {
        let msg = '✨ CONFIGURATION\n';
        msg += '━'.repeat(40) + '\n\n';

        msg += `📦 ÉQUIPEMENTS (${this.notes.length}):\n`;
        this.notes.forEach((n) => {
            msg += `   ${n.icon} ${n.name} [${n.code}]\n`;
        });

        msg += `\n🔗 CONNEXIONS (${this.connections.length}):\n`;
        this.connections.forEach(c => {
            const from = this.notes.find(n => n.id === c.from);
            const to = this.notes.find(n => n.id === c.to);
            msg += `   ${from?.icon} ${from?.name} → ${to?.icon} ${to?.name}\n`;
        });

        msg += '\n' + '━'.repeat(40);
        msg += '\n💡 Configuration prête pour analyse IA!';

        alert(msg);
    }

    // ==================== HISTORY ====================
    saveHistory() {
        this.history.push({
            notes: JSON.parse(JSON.stringify(this.notes.map(n => ({
                id: n.id,
                code: n.code,
                name: n.name,
                icon: n.icon,
                desc: n.desc,
                color: n.color,
                category: n.category,
                x: n.x,
                y: n.y
            })))),
            connections: JSON.parse(JSON.stringify(this.connections))
        });

        if (this.history.length > 20) this.history.shift();
    }

    undo() {
        if (this.history.length < 2) {
            this.showToast('↩', 'Rien à annuler');
            return;
        }

        this.history.pop();
        const prev = this.history[this.history.length - 1];

        // Clear
        this.notes.forEach(n => n.element.remove());
        this.notes = [];
        this.connections = [];

        // Restore
        prev.notes.forEach(n => this.restoreNote(n));
        this.connections = prev.connections;

        this.redrawConnections();
        this.updatePortStates();
        this.updateUI();
        this.showToast('↩', 'Action annulée');
    }

    restoreNote(data) {
        const el = this.elements;

        const noteEl = document.createElement('div');
        noteEl.className = `note ${data.color}`;
        noteEl.id = data.id;
        noteEl.style.left = `${data.x}px`;
        noteEl.style.top = `${data.y}px`;

        noteEl.innerHTML = `
            <div class="port input" data-port="input" data-note="${data.id}"></div>
            <div class="port output" data-port="output" data-note="${data.id}"></div>
            <div class="note-header">
                <span class="note-icon">${data.icon}</span>
                <div class="note-actions">
                    <button class="note-btn delete" data-delete="${data.id}" title="Supprimer">✕</button>
                </div>
            </div>
            <div class="note-title">${data.name}</div>
            <div class="note-desc">${data.desc}</div>
            <span class="note-code">${data.code}</span>
        `;

        noteEl.querySelector('.note-btn.delete').addEventListener('click', () => {
            this.deleteNote(data.id);
        });

        el.workspace.appendChild(noteEl);
        this.notes.push({ ...data, element: noteEl });
        this.makeDraggable(noteEl);
    }
}

// Initialize when DOM ready
document.addEventListener('DOMContentLoaded', () => {
    window.playground = new Playground();
});
