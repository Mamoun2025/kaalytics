/**
 * Equipment Modules Data
 * Real equipment types from catalog
 */

const EQUIPMENT_MODULES = {
    categories: [
        {
            id: 'terrassement',
            name: 'Terrassement',
            icon: '🚜',
            modules: [
                {
                    id: 'bulldozer',
                    code: 'BULL',
                    name: 'Bulldozer',
                    desc: 'Nivellement et déblaiement',
                    icon: '🚜',
                    color: 'yellow'
                },
                {
                    id: 'excavator',
                    code: 'PELLE',
                    name: 'Pelle hydraulique',
                    desc: 'Excavation avec bras articulé',
                    icon: '⛏️',
                    color: 'orange'
                },
                {
                    id: 'grader',
                    code: 'NIV',
                    name: 'Niveleuse',
                    desc: 'Finition de surfaces',
                    icon: '🔧',
                    color: 'green'
                }
            ]
        },
        {
            id: 'chargement',
            name: 'Chargement',
            icon: '📦',
            modules: [
                {
                    id: 'loader',
                    code: 'CHAR',
                    name: 'Chargeuse',
                    desc: 'Chargement avec godet frontal',
                    icon: '🏗️',
                    color: 'blue'
                },
                {
                    id: 'backhoe',
                    code: 'TRAC',
                    name: 'Tractopelle',
                    desc: 'Chargeur + pelle arrière',
                    icon: '🔨',
                    color: 'purple'
                },
                {
                    id: 'forklift',
                    code: 'ELEV',
                    name: 'Chariot élévateur',
                    desc: 'Levage et transport',
                    icon: '📤',
                    color: 'teal'
                }
            ]
        },
        {
            id: 'transport',
            name: 'Transport',
            icon: '🚚',
            modules: [
                {
                    id: 'dump_truck',
                    code: 'TOMB',
                    name: 'Tombereau',
                    desc: 'Transport de matériaux',
                    icon: '🚛',
                    color: 'red'
                },
                {
                    id: 'conveyor',
                    code: 'CONV',
                    name: 'Convoyeur',
                    desc: 'Transport continu',
                    icon: '➡️',
                    color: 'blue'
                }
            ]
        },
        {
            id: 'compactage',
            name: 'Compactage',
            icon: '🛞',
            modules: [
                {
                    id: 'compactor',
                    code: 'COMP',
                    name: 'Compacteur',
                    desc: 'Compactage sols et enrobés',
                    icon: '🛞',
                    color: 'pink'
                },
                {
                    id: 'roller',
                    code: 'ROUL',
                    name: 'Rouleau vibrant',
                    desc: 'Vibration pour compactage',
                    icon: '⚙️',
                    color: 'orange'
                }
            ]
        },
        {
            id: 'concassage',
            name: 'Concassage & Criblage',
            icon: '⚒️',
            modules: [
                {
                    id: 'crusher_jaw',
                    code: 'CONC-M',
                    name: 'Concasseur à mâchoires',
                    desc: 'Broyage primaire',
                    icon: '⚒️',
                    color: 'yellow'
                },
                {
                    id: 'crusher_cone',
                    code: 'CONC-C',
                    name: 'Concasseur à cône',
                    desc: 'Broyage secondaire',
                    icon: '🔘',
                    color: 'orange'
                },
                {
                    id: 'screen',
                    code: 'CRIB',
                    name: 'Crible vibrant',
                    desc: 'Tamisage et classification',
                    icon: '📊',
                    color: 'green'
                },
                {
                    id: 'feeder',
                    code: 'ALIM',
                    name: 'Alimentateur',
                    desc: 'Dosage et alimentation',
                    icon: '⬇️',
                    color: 'purple'
                }
            ]
        },
        {
            id: 'lavage',
            name: 'Lavage',
            icon: '💧',
            modules: [
                {
                    id: 'washer',
                    code: 'LAV',
                    name: 'Laveur de sable',
                    desc: 'Nettoyage des granulats',
                    icon: '💧',
                    color: 'teal'
                },
                {
                    id: 'hydrocyclone',
                    code: 'HYDRO',
                    name: 'Hydrocyclone',
                    desc: 'Classification hydraulique',
                    icon: '🌀',
                    color: 'blue'
                }
            ]
        },
        {
            id: 'energie',
            name: 'Énergie',
            icon: '⚡',
            modules: [
                {
                    id: 'generator',
                    code: 'GEN',
                    name: 'Groupe électrogène',
                    desc: 'Alimentation électrique',
                    icon: '⚡',
                    color: 'yellow'
                },
                {
                    id: 'hydraulic',
                    code: 'HYD',
                    name: 'Centrale hydraulique',
                    desc: 'Circuit de pression',
                    icon: '🔧',
                    color: 'red'
                }
            ]
        },
        {
            id: 'stockage',
            name: 'Stockage',
            icon: '🏔️',
            modules: [
                {
                    id: 'stockpile',
                    code: 'STOCK',
                    name: 'Zone de stockage',
                    desc: 'Stockage des matériaux',
                    icon: '🏔️',
                    color: 'green'
                },
                {
                    id: 'hopper',
                    code: 'TREM',
                    name: 'Trémie',
                    desc: 'Réception des matériaux',
                    icon: '🔻',
                    color: 'pink'
                },
                {
                    id: 'silo',
                    code: 'SILO',
                    name: 'Silo',
                    desc: 'Stockage en hauteur',
                    icon: '🗼',
                    color: 'purple'
                }
            ]
        }
    ],

    // Get all modules flat
    getAllModules() {
        return this.categories.flatMap(cat =>
            cat.modules.map(m => ({ ...m, category: cat.name, categoryId: cat.id }))
        );
    },

    // Get module by ID
    getModule(id) {
        return this.getAllModules().find(m => m.id === id);
    },

    // Search modules
    search(query) {
        const q = query.toLowerCase();
        return this.getAllModules().filter(m =>
            m.name.toLowerCase().includes(q) ||
            m.desc.toLowerCase().includes(q) ||
            m.code.toLowerCase().includes(q)
        );
    }
};

// Export for use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = EQUIPMENT_MODULES;
}
