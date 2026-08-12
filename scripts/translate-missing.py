#!/usr/bin/env python3
"""Traduit manuellement les chaînes françaises résiduelles des pages EN générées."""
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

# Dictionnaire des traductions manuelles pour chaque page
TRANSLATIONS = {
    'en/guides/index.html': {
        'Guides Pratiques | Kaalytics': 'Guides | Kaalytics',
        'Guides pratiques': 'Guides',
        'Ressources pour transformer vos opérations': 'Resources to Transform Your Operations',
        'Des guides concrets pour comprendre nos approches et optimiser vos processus.': 'Practical guides to understand our approaches and optimize your processes.',
        '8 ressources disponibles': '8 Resources Available',
        'Checklist Maintenance Préventive': 'Preventive Maintenance Checklist',
        'Liste de vérification complète pour mettre en place un programme de maintenance préventive. Fréquences, indicateurs, processus et outils.': 'Complete checklist to implement a preventive maintenance program. Frequencies, indicators, processes and tools.',
        'Comparatif Fleet Management': 'Fleet Management Comparison',
        'Comparaison objective des solutions de gestion de flotte du marche. Critères de sélection, fonctionnalités clés, avantages et limites.': 'Objective comparison of fleet management solutions on the market. Selection criteria, key features, advantages and limitations.',
        'Guide Gestion de Flotte BTP': 'Construction Fleet Management Guide',
        'Guide complet pour digitaliser la gestion de flotte dans le BTP. Engins, chantiers, maintenance, coûts et conformité.': 'Complete guide to digitalize fleet management in construction. Equipment, sites, maintenance, costs and compliance.',
        'Digitalisation Flotte BTP': 'Construction Fleet Digitalization',
        'Comment les entreprises de BTP transforment leur gestion de flotte en 2026. Tendances, technologies et retours d\'expérience.': 'How construction companies are transforming their fleet management in 2026. Trends, technologies and case studies.',
        'GPS Tracking : 5 Erreurs à Éviter': 'GPS Tracking: 5 Mistakes to Avoid',
        'Les erreurs les plus courantes dans le déploiement du GPS tracking et comment les éviter. Guide pratique base sur des cas réels.': 'The most common mistakes in GPS tracking deployment and how to avoid them. Practical guide based on real cases.',
        'Maintenance Prédictive : Le Guide': 'Predictive Maintenance: The Guide',
        'Comprendre la maintenance prédictive et ses applications concrètes. Du réactif au prédictif, étape par étape.': 'Understand predictive maintenance and its practical applications. From reactive to predictive, step by step.',
        'Réduire les Coûts de Flotte': 'Reduce Fleet Costs',
        'Stratégies concrètes pour réduire les coûts d\'exploitation de votre flotte. Carburant, maintenance, utilisation, administration.': 'Concrete strategies to reduce your fleet operating costs. Fuel, maintenance, usage, administration.',
        'ROI Gestion de Flotte': 'Fleet Management ROI',
        'Comment calculer le retour sur investissement d\'une solution de gestion de flotte. Méthode, indicateurs et benchmarks.': 'How to calculate the return on investment of a fleet management solution. Method, indicators and benchmarks.',
        'Vous avez un besoin spécifique ?': 'Do you have a specific need?',
        'Nos experts peuvent créer un guide adapte à votre secteur.': 'Our experts can create a guide tailored to your industry.',
    },
    'en/legal/privacy.html': {
        'Politique de Confidentialité | Kaalytics': 'Privacy Policy | Kaalytics',
        'Dernière mise à jour : Janvier 2026': 'Last updated: January 2026',
        '1. Introduction': '1. Introduction',
        'La présente politique de confidentialité décrit comment Kaalytics collecte, utilise, stocke et protège vos données personnelles lorsque vous utilisez notre site web et nos services. Nous nous engageons à respecter votre vie privée et à protéger vos informations conformément au Règlement Général sur la Protection des Données (RGPD) et à la législation marocaine en vigueur.': 'This privacy policy describes how Kaalytics collects, uses, stores and protects your personal data when you use our website and services. We are committed to respecting your privacy and protecting your information in accordance with the General Data Protection Regulation (GDPR) and applicable Moroccan law.',
        '2. Données collectées': '2. Data Collected',
        'Nous collectons les types de données suivants :': 'We collect the following types of data:',
        'Données d\'identification :': 'Identification data:',
        'nom, prénom, adresse email, numéro de téléphone, nom de l\'entreprise': 'name, first name, email address, phone number, company name',
        'Données de navigation :': 'Navigation data:',
        'adresse IP, type de navigateur, pages visitées, durée de visite': 'IP address, browser type, pages visited, visit duration',
        'Données de flotte :': 'Fleet data:',
        'informations sur vos véhicules, données GPS, historiques de maintenance (dans le cadre de l\'utilisation de FleetOps Pro)': 'information about your vehicles, GPS data, maintenance history (in the context of FleetOps Pro use)',
        'Données de communication :': 'Communication data:',
        'messages envoyés via les formulaires de contact': 'messages sent through contact forms',
        '3. Finalités du traitement': '3. Processing Purposes',
        'Vos données sont utilisées pour :': 'Your data is used for:',
        'Fournir nos services de gestion de flotte': 'Provide our fleet management services',
        'Répondre à vos demandes de contact et de démonstration': 'Respond to your contact and demo requests',
        'Améliorer nos services et notre site web': 'Improve our services and website',
        'Vous envoyer des communications commerciales (avec votre consentement)': 'Send you marketing communications (with your consent)',
        'Respecter nos obligations légales': 'Comply with our legal obligations',
        '4. Base légale du traitement': '4. Legal Basis for Processing',
        'Le traitement de vos données repose sur les bases légales suivantes : l\'exécution d\'un contrat (fourniture de nos services), votre consentement (communications commerciales), nos intérêts légitimes (amélioration de nos services), et nos obligations légales.': 'The processing of your data is based on the following legal grounds: contract performance (provision of our services), your consent (marketing communications), our legitimate interests (improving our services), and our legal obligations.',
        '5. Conservation des données': '5. Data Retention',
        'Vos données sont conservées pendant la durée nécessaire aux finalités pour lesquelles elles ont ete collectées. Les données clients sont conservées pendant la durée du contrat et 3 ans après sa fin. Les données des prospects sont conservées 3 ans après le dernier contact. Les données de navigation sont conservées 13 mois maximum.': 'Your data is retained for as long as necessary for the purposes for which it was collected. Customer data is retained for the duration of the contract and 3 years after its termination. Prospect data is retained for 3 years after the last contact. Navigation data is retained for a maximum of 13 months.',
        '6. Sécurité des données': '6. Data Security',
        'Nous mettons en oeuvre des mesures techniques et organisationnelles appropriées pour protéger vos données contre tout accès non autorise, modification, divulgation ou destruction. Cela inclut le chiffrement des données, des contrôles d\'accès stricts et des sauvegardes régulières.': 'We implement appropriate technical and organizational measures to protect your data against unauthorized access, modification, disclosure or destruction. This includes data encryption, strict access controls and regular backups.',
        '7. Vos droits': '7. Your Rights',
        'Conformément au RGPD, vous disposez des droits suivants :': 'In accordance with the GDPR, you have the following rights:',
        'Droit d\'accès :': 'Right of access:',
        'obtenir une copie de vos données personnelles': 'obtain a copy of your personal data',
        'Droit de rectification :': 'Right to rectification:',
        'corriger des données inexactes': 'correct inaccurate data',
        'Droit à l\'effacement :': 'Right to erasure:',
        'demander la suppression de vos données': 'request deletion of your data',
        'Droit à la portabilité :': 'Right to data portability:',
        'recevoir vos données dans un format structure': 'receive your data in a structured format',
        'Droit d\'opposition :': 'Right to object:',
        'vous opposer au traitement de vos données': 'object to processing of your data',
        'Droit de retrait du consentement :': 'Right to withdraw consent:',
        'retirer votre consentement a tout moment': 'withdraw your consent at any time',
        'Pour exercer ces droits, contactez-nous à : contact@kaalytics.com': 'To exercise these rights, contact us at: contact@kaalytics.com',
        '8. Cookies': '8. Cookies',
        'Notre site utilise des cookies pour améliorer votre expérience de navigation. Vous pouvez configurer votre navigateur pour refuser les cookies ou être averti lorsqu\'un cookie est envoyé. Toutefois, certaines fonctionnalités du site peuvent ne pas fonctionner correctement sans cookies.': 'Our site uses cookies to improve your browsing experience. You can configure your browser to refuse cookies or be notified when a cookie is sent. However, some features of the site may not work properly without cookies.',
        '9. Contact': '9. Contact',
        'Pour toute question concernant cette politique de confidentialité ou le traitement de vos données, vous pouvez nous contacter :': 'For any questions about this privacy policy or the processing of your data, you can contact us:',
        'Email : contact@kaalytics.com': 'Email: contact@kaalytics.com',
        'Adresse : Casablanca, Maroc': 'Address: Casablanca, Morocco',
    },
    'en/legal/terms.html': {
        'Conditions Générales d&#x27;Utilisation | Kaalytics': 'Terms of Service | Kaalytics',
        'Mentions légales': 'Legal Information',
        'Conditions Générales d\'Utilisation': 'Terms of Service',
        'Dernière mise à jour : avril 2026': 'Last updated: April 2026',
        '1. Objet': '1. Purpose',
        'Les présentes Conditions Générales d\'Utilisation (CGU) régissent l\'utilisation des services proposés par Kaalytics. Kaalytics conçoit et déploie des modules intelligents qui se connectent aux systèmes de gestion d\'entreprise (ERP) existants. En accédant à nos services ou à ce site, vous acceptez d\'être lie par ces conditions.': 'These Terms of Service govern the use of services offered by Kaalytics. Kaalytics designs and deploys intelligent modules that connect to existing enterprise resource management (ERP) systems. By accessing our services or this site, you agree to be bound by these terms.',
        '2. Services proposés': '2. Services Offered',
        'Kaalytics propose huit modules principaux, chacun compose de plusieurs composants configurables :': 'Kaalytics offers eight main modules, each composed of several configurable components:',
        '— pilotage commercial, scoring des opportunités, génération de devis automatisée': '— sales management, opportunity scoring, automated quote generation',
        '— campagnes ciblées, enrichissement contacts, pipeline marketing vers commercial': '— targeted campaigns, contact enrichment, marketing to sales pipeline',
        '— suivi facturation, recouvrement, détection des ordres non factures': '— billing tracking, collection, detection of unfulfilled orders',
        '— planning achats, prévisions de ventes, chaîne de valeur': '— procurement planning, sales forecasts, value chain',
        '— gestion de parc, GPS, maintenance prédictive, procurement': '— fleet management, GPS, predictive maintenance, procurement',
        '— connecteurs bidirectionnels Odoo, SAP, Sage, Microsoft Dynamics': '— bidirectional connectors for Odoo, SAP, Sage, Microsoft Dynamics',
        '— site web, SEO, e-commerce B2B, scraping produits': '— website, SEO, B2B e-commerce, product scraping',
        '— agents autonomes, parsing intelligent, études de marche': '— autonomous agents, intelligent parsing, market research',
        'Chaque module peut être déployé indépendamment et configure selon les besoins spécifiques du client.': 'Each module can be deployed independently and configured according to the specific needs of the client.',
        '3. Accès aux services': '3. Access to Services',
        'Les services Kaalytics sont destinés aux professionnels, entreprises et organisations. L\'accès implique la création d\'un compte et l\'acceptation d\'un contrat commercial. L\'utilisateur est responsable de la confidentialité de ses identifiants et de toutes les actions effectuées depuis son compte.': 'Kaalytics services are intended for professionals, businesses and organizations. Access requires the creation of an account and acceptance of a commercial agreement. The user is responsible for the confidentiality of their credentials and all actions taken from their account.',
        '4. Obligations de l\'utilisateur': '4. User Obligations',
        'L\'utilisateur s\'engage à :': 'The user agrees to:',
        'Utiliser les services conformément à leur destination professionnelle': 'Use the services in accordance with their professional purpose',
        'Ne pas tenter de contourner les mesures de sécurité mises en place': 'Not attempt to bypass security measures',
        'Ne pas utiliser les services à des fins illégales ou contraires aux bonnes moeurs': 'Not use the services for illegal purposes or contrary to good morals',
        'Maintenir la confidentialité de ses identifiants de connexion': 'Maintain confidentiality of login credentials',
        'Informer Kaalytics sans délai de toute utilisation non autorisée de son compte': 'Inform Kaalytics promptly of any unauthorized use of the account',
        'Respecter les droits de propriété intellectuelle de Kaalytics et de ses partenaires': 'Respect intellectual property rights of Kaalytics and its partners',
        '5. Tarification et abonnement': '5. Pricing and Subscription',
        'Les modules Kaalytics sont proposés sur la base d\'un abonnement mensuel par module, sans engagement long terme. Les tarifs en vigueur sont disponibles sur la page': 'Kaalytics modules are offered on a monthly subscription basis per module, with no long-term commitment. Current pricing is available on the',
        'Garantie satisfait ou rembourse': 'Satisfaction guarantee or money back',
        ': les 30 premiers jours du premier module déployé sont remboursables si les résultats ne sont pas au rendez-vous.': ': the first 30 days of the first deployed module are refundable if results are not met.',
        '6. Données et propriété': '6. Data and Ownership',
        'Les données du client restent la propriété exclusive du client. Kaalytics agit en tant que sous-traitant au sens du RGPD et ne peut utiliser les données que pour les besoins de fourniture du service. Un export complet des données est disponible a tout moment sur simple demande.': 'Customer data remains the exclusive property of the customer. Kaalytics acts as a data processor under the GDPR and may only use data for service delivery purposes. A complete data export is available at any time on simple request.',
        'Pour plus de détails sur le traitement des données personnelles, consultez notre': 'For more details on personal data processing, see our',
        '7. Disponibilité et maintenance': '7. Availability and Maintenance',
        'Kaalytics s\'engage à maintenir un niveau de disponibilité élevé de ses services. Des opérations de maintenance programmées peuvent ponctuellement nécessiter une interruption de service, qui sera annoncée au minimum 48 heures à l\'avance par email.': 'Kaalytics commits to maintaining a high level of availability of its services. Scheduled maintenance operations may occasionally require service interruption, which will be announced at least 48 hours in advance by email.',
        '8. Responsabilité': '8. Liability',
        'Kaalytics met en oeuvre les moyens raisonnables pour assurer la fiabilité et la sécurité de ses services. La responsabilité de Kaalytics ne peut être engagée en cas de force majeure, de défaillance des réseaux de communication, d\'acte d\'un tiers, ou de mauvaise utilisation des services par l\'utilisateur.': 'Kaalytics implements reasonable means to ensure reliability and security of its services. Kaalytics\' liability cannot be engaged in case of force majeure, communication network failure, third party acts, or misuse of services by the user.',
        '9. Résiliation': '9. Termination',
        'L\'abonnement peut être résilié a tout moment par l\'utilisateur avec un préavis d\'un mois, notifie par email à l\'adresse de contact indiquée. Kaalytics se réserve le droit de suspendre ou résilier l\'accès aux services en cas de manquement grave aux présentes CGU, après notification préalable.': 'The subscription can be terminated at any time by the user with one month\'s notice, notified by email to the contact address provided. Kaalytics reserves the right to suspend or terminate access to services in case of serious breach of these Terms, after prior notification.',
        '10. Modification des CGU': '10. Modification of Terms',
        'Kaalytics se réserve le droit de modifier les présentes CGU a tout moment. Les utilisateurs seront informés par email au moins 30 jours avant l\'entrée en vigueur des nouvelles conditions. La poursuite de l\'utilisation des services vaut acceptation des nouvelles conditions.': 'Kaalytics reserves the right to modify these Terms at any time. Users will be informed by email at least 30 days before the new terms take effect. Continued use of the services constitutes acceptance of the new terms.',
        '11. Droit applicable et juridiction': '11. Governing Law and Jurisdiction',
        'Les présentes CGU sont soumises au droit marocain. Tout litige relatif à leur interprétation ou exécution sera soumis à la compétence exclusive des tribunaux de Casablanca, après tentative de résolution amiable.': 'These Terms are governed by Moroccan law. Any dispute regarding their interpretation or performance shall be submitted to the exclusive jurisdiction of Casablanca courts, after an attempt at amicable resolution.',
        '12. Contact': '12. Contact',
        'Pour toute question relative aux présentes CGU, vous pouvez nous contacter par WhatsApp au': 'For any questions regarding these Terms, you can contact us via WhatsApp at',
        '← Retour à l\'accueil': '← Back to Home',
    },
    'en/legal/cookies.html': {
        'Politique de Cookies | Kaalytics': 'Cookie Policy | Kaalytics',
        'Politique de Cookies': 'Cookie Policy',
        'Dernière mise à jour : Janvier 2026': 'Last updated: January 2026',
        '1. Qu\'est-ce qu\'un cookie ?': '1. What is a Cookie?',
        'Un cookie est un petit fichier texte stocke sur votre appareil (ordinateur, tablette ou mobile) lorsque vous visitez un site web. Les cookies permettent au site de reconnaître votre appareil et de mémoriser certaines informations sur vos préférences ou actions passées.': 'A cookie is a small text file stored on your device (computer, tablet or mobile) when you visit a website. Cookies allow the website to recognize your device and remember certain information about your preferences or past actions.',
        '2. Types de cookies utilisés': '2. Types of Cookies Used',
        'Nous utilisons les types de cookies suivants :': 'We use the following types of cookies:',
        'Cookies strictement nécessaires :': 'Strictly necessary cookies:',
        'Ces cookies sont essentiels au fonctionnement du site. Ils permettent la navigation et l\'utilisation des fonctionnalités de base. Ils ne peuvent pas être désactivés.': 'These cookies are essential to the functioning of the website. They enable navigation and use of basic features. They cannot be disabled.',
        'Cookies de performance :': 'Performance cookies:',
        'Ces cookies nous permettent de comprendre comment les visiteurs utilisent notre site en collectant des informations anonymes (pages visitées, temps passe, etc.).': 'These cookies allow us to understand how visitors use our site by collecting anonymous information (pages visited, time spent, etc.).',
        'Cookies de fonctionnalité :': 'Functionality cookies:',
        'Ces cookies permettent au site de mémoriser vos choix (langue, préférences d\'affichage) pour vous offrir une expérience personnalisée.': 'These cookies allow the website to remember your choices (language, display preferences) to provide you with a personalized experience.',
        'Cookies de ciblage/publicité :': 'Targeting/advertising cookies:',
        'Ces cookies sont utilisés pour afficher des publicités pertinentes et mesurer l\'efficacité de nos campagnes marketing.': 'These cookies are used to display relevant ads and measure the effectiveness of our marketing campaigns.',
        '3. Cookies tiers': '3. Third-Party Cookies',
        'Nous utilisons des services tiers qui peuvent déposer des cookies sur votre appareil :': 'We use third-party services that may place cookies on your device:',
        'Google Analytics :': 'Google Analytics:',
        'Analyse du trafic web': 'Web traffic analysis',
        'Formspree :': 'Formspree:',
        'Traitement des formulaires de contact': 'Contact form processing',
        'Google Fonts :': 'Google Fonts:',
        'Chargement des polices de caractères': 'Font loading',
        '4. Gestion de vos préférences': '4. Managing Your Preferences',
        'Vous pouvez gérer vos préférences de cookies de plusieurs manières :': 'You can manage your cookie preferences in several ways:',
        'Via la bannière de consentement qui s\'affiche lors de votre première visite': 'Via the consent banner that appears on your first visit',
        'En modifiant les paramètres de votre navigateur': 'By modifying your browser settings',
        'En utilisant des outils de gestion des cookies comme Ghostery ou Privacy Badger': 'By using cookie management tools like Ghostery or Privacy Badger',
        'Note : La désactivation de certains cookies peut affecter le fonctionnement du site et limiter votre accès à certaines fonctionnalités.': 'Note: Disabling certain cookies may affect site functionality and limit your access to certain features.',
        '5. Durée de conservation': '5. Retention Period',
        'Les cookies ont des durées de vie différentes. Les cookies de session sont supprimés à la fermeture du navigateur. Les cookies persistants peuvent rester jusqu\'à 13 mois maximum conformément aux recommandations de la CNIL.': 'Cookies have different lifespans. Session cookies are deleted when the browser closes. Persistent cookies can remain for up to 13 months maximum in accordance with CNIL recommendations.',
        '6. Modifications': '6. Modifications',
        'Nous pouvons modifier cette politique de cookies a tout moment. Les modifications entrent en vigueur des leur publication sur cette page. Nous vous encourageons à consulter régulièrement cette page.': 'We may modify this cookie policy at any time. Modifications become effective upon publication on this page. We encourage you to review this page regularly.',
        '7. Contact': '7. Contact',
        'Pour toute question concernant notre utilisation des cookies, vous pouvez nous contacter à :': 'For any questions about our use of cookies, you can contact us at:',
    }
}

def translate_page(path_str):
    """Traduit les chaînes françaises dans une page."""
    path = ROOT / path_str
    if not path.exists():
        print(f"ERREUR: {path} n'existe pas")
        return

    html = path.read_text(encoding='utf-8')
    translations = TRANSLATIONS.get(path_str, {})

    if not translations:
        print(f"Pas de traductions définies pour {path_str}")
        return

    count = 0
    for fr, en in translations.items():
        if fr in html:
            html = html.replace(fr, en)
            count += 1

    path.write_text(html, encoding='utf-8')
    print(f"{path_str}: {count}/{len(translations)} traductions appliquées")

if __name__ == '__main__':
    for page in TRANSLATIONS.keys():
        translate_page(page)
    print("\nTerminé !")
