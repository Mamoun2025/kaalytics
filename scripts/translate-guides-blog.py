#!/usr/bin/env python3
"""Traduit les pages guides et blog anglaises générées."""
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

# Dictionnaire des remplacements pour chaque page
replacements = {
    'en/guides/checklist-maintenance.html': [
        ('Checklist Maintenance Préventive | Kaalytics', 'Preventive Maintenance Checklist | Kaalytics'),
        ('Retour aux guides', 'Back to Guides'),
        ('Outil pratique', 'Practical Tool'),
        ('Checklist Maintenance Préventive', 'Preventive Maintenance Checklist'),
        ('Contrôles quotidiens', 'Daily Checks'),
        ('Avant chaque départ', 'Before Each Trip'),
        ('Contrôles hebdomadaires', 'Weekly Checks'),
        ('Chaque semaine', 'Each Week'),
        ('Contrôles mensuels', 'Monthly Checks'),
        ('Chaque mois', 'Each Month'),
        ('Contrôles trimestriels', 'Quarterly Checks'),
        ('Chaque trimestre', 'Each Quarter'),
        ('Comment utiliser cette checklist ?', 'How to Use This Checklist?'),
        ('Imprimez la checklist', 'Print the Checklist'),
        ('Digitalisez vos contrôles', 'Digitalize Your Checks'),
        ('Assignez les tâches à votre équipe', 'Assign Tasks to Your Team'),
        ('Générez des rapports', 'Generate Reports'),
        ('Prêt à digitaliser votre maintenance ?', 'Ready to Digitalize Your Maintenance?'),
        ('Demander une démo', 'Request a Demo'),
    ],
    'en/guides/comparatif-fleet-management.html': [
        ('Comparatif Solutions Fleet Management | Kaalytics', 'Fleet Management Solutions Comparison | Kaalytics'),
        ('Comparatif Solutions Fleet Management', 'Fleet Management Solutions Comparison'),
        ('Critères de sélection', 'Selection Criteria'),
        ('Fonctionnalités essentielles', 'Essential Features'),
        ('Budget', 'Budget'),
        ('Déploiement', 'Deployment'),
        ('Interface utilisateur', 'User Interface'),
        ('Évolutivité', 'Scalability'),
        ('Conformité', 'Compliance'),
        ('Les solutions du marche', 'Market Solutions'),
        ('Solutions cloud vs on-premise', 'Cloud vs On-Premise Solutions'),
        ('Cloud', 'Cloud'),
        ('On-premise', 'On-Premise'),
        ('Les solutions spécialisées', 'Specialized Solutions'),
        ('Spécialistes GPS', 'GPS Specialists'),
        ('Points forts', 'Strengths'),
        ('Points faibles', 'Weaknesses'),
        ('Solutions ERP connectées', 'Connected ERP Solutions'),
        ('Solutions IA et analyse prédictive', 'AI and Predictive Analytics Solutions'),
        ('Matrice de comparaison', 'Comparison Matrix'),
        ('Localisation GPS', 'GPS Tracking'),
        ('Optimisation d\'itinéraires', 'Route Optimization'),
        ('Maintenance prédictive', 'Predictive Maintenance'),
        ('Intégration ERP', 'ERP Integration'),
        ('Reporting avancé', 'Advanced Reporting'),
        ('Interface mobile', 'Mobile Interface'),
        ('Support technique', 'Technical Support'),
        ('Facilité de déploiement', 'Deployment Ease'),
        ('Comment faire le meilleur choix ?', 'How to Make the Best Choice?'),
        ('Définissez vos priorités', 'Define Your Priorities'),
        ('Testez avant d\'acheter', 'Test Before Buying'),
        ('Parlez à d\'autres clients', 'Talk to Other Customers'),
        ('Évaluez le total cost of ownership', 'Evaluate Total Cost of Ownership'),
        ('Pensez à la scalabilité', 'Think About Scalability'),
        ('La solution Kaalytics', 'The Kaalytics Solution'),
        ('Prêt à choisir la bonne solution ?', 'Ready to Choose the Right Solution?'),
        ('Télécharger la grille', 'Download Grid'),
    ],
    'en/guides/guide-flotte-btp.html': [
        ('Guide complet : Gestion de flotte BTP | Kaalytics', 'Complete Guide: Construction Fleet Management | Kaalytics'),
        ('Gestion de flotte BTP', 'Construction Fleet Management'),
        ('Défis spécifiques au BTP', 'Specific Construction Challenges'),
        ('Utilisation intensive', 'Intensive Use'),
        ('Mobilité', 'Mobility'),
        ('Coûts importants', 'Significant Costs'),
        ('Conformité régulière', 'Regular Compliance'),
        ('Les piliers d\'une gestion efficace', 'Pillars of Effective Management'),
        ('Suivi en temps réel', 'Real-Time Tracking'),
        ('Optimisation des coûts', 'Cost Optimization'),
        ('Documentation et conformité', 'Documentation and Compliance'),
        ('Étapes de déploiement', 'Deployment Steps'),
        ('Phase 1 : Audit initial', 'Phase 1: Initial Audit'),
        ('Phase 2 : Sélection des outils', 'Phase 2: Tool Selection'),
        ('Phase 3 : Déploiement', 'Phase 3: Deployment'),
        ('Phase 4 : Optimisation continue', 'Phase 4: Continuous Optimization'),
        ('KPIs à suivre pour le BTP', 'KPIs to Track for Construction'),
        ('Consommation de carburant', 'Fuel Consumption'),
        ('Cas d\'usage : La transformation d\'un BTP marocain', 'Use Case: Transformation of a Moroccan Construction Company'),
        ('Avant FleetOps :', 'Before FleetOps:'),
        ('Après 6 mois de FleetOps :', 'After 6 months of FleetOps:'),
        ('Prêt à transformer votre gestion de flotte BTP ?', 'Ready to Transform Your Construction Fleet Management?'),
        ('Demander une étude', 'Request a Study'),
    ],
    'en/blog/digitalisation-flotte-btp.html': [
        ('Digitalisation flotte BTP en 2026 | Blog Kaalytics', 'Fleet Digitalization in 2026 | Blog Kaalytics'),
        ('Retour au blog', 'Back to Blog'),
        ('Actualité', 'News'),
        ('Digitalisation', 'Digitalization'),
    ],
    'en/blog/gps-tracking-erreurs.html': [
        ('GPS Tracking : 5 erreurs à éviter | Blog Kaalytics', 'GPS Tracking: 5 Mistakes to Avoid | Blog Kaalytics'),
        ('Retour au blog', 'Back to Blog'),
        ('Pratique', 'Practical'),
        ('GPS', 'GPS'),
    ],
    'en/blog/maintenance-predictive-guide.html': [
        ('Maintenance prédictive : le guide complet | Blog Kaalytics', 'Predictive Maintenance: The Complete Guide | Blog Kaalytics'),
        ('Retour au blog', 'Back to Blog'),
        ('Opérationnel', 'Operational'),
        ('Maintenance', 'Maintenance'),
    ],
    'en/blog/reduire-couts-flotte-ia.html': [
        ('Comment réduire les coûts de flotte avec l\'IA | Blog Kaalytics', 'How to Reduce Fleet Costs with AI | Blog Kaalytics'),
        ('Retour au blog', 'Back to Blog'),
        ('Stratégie', 'Strategy'),
        ('Optimisation', 'Optimization'),
    ],
    'en/blog/roi-gestion-flotte.html': [
        ('ROI d\'une solution de gestion de flotte | Blog Kaalytics', 'Fleet Management Solution ROI | Blog Kaalytics'),
        ('Retour au blog', 'Back to Blog'),
        ('Finance', 'Finance'),
        ('ROI', 'ROI'),
    ],
}

def translate_page(page_path, replacements_list):
    """Traduit une page en appliquant les remplacements."""
    page = ROOT / page_path
    if not page.exists():
        print(f"ERREUR: {page_path} n'existe pas")
        return

    html = page.read_text(encoding='utf-8')
    count = 0
    for fr, en in replacements_list:
        if fr in html:
            html = html.replace(fr, en)
            count += 1

    page.write_text(html, encoding='utf-8')
    print(f"{page_path}: {count}/{len(replacements_list)} translations applied")

if __name__ == '__main__':
    for page_path, repl_list in replacements.items():
        translate_page(page_path, repl_list)
    print("\nDone!")
