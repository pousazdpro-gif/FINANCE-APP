# 🗺️ FinanceApp - Roadmap des Fonctionnalités à Implémenter

**Date de création :** Janvier 2025
**Statut :** En attente de développement
**Priorité :** Critique pour expérience utilisateur optimale

---

## 🎯 Philosophie de l'Application

**Principes directeurs :**
- ✨ **Rigidité** : Structure solide et fiable
- 💪 **Vigueur** : Performance et rapidité
- 🎯 **Maximalisme** : Fonctionnalités complètes et abouties
- 🧠 **Intuitif** : Interface naturelle et évidente
- ⚡ **Rapide** : Réactivité instantanée
- 🤖 **Smart** : Intelligence et automatisation
- 🛠️ **Pratique** : Outils utiles au quotidien

---

## 📊 A. Système de Comptes Avancé

### A1. Séparation des Types de Comptes

**Objectif :** Distinguer clairement comptes bancaires standard vs comptes de plateforme

**Fonctionnalités :**
- [ ] Créer catégorie "Compte Standard" (banque traditionnelle)
- [ ] Créer catégorie "Compte Plateforme" (brokers, wallets crypto)
  - [ ] Sous-type : Broker (Interactive Brokers, Trading212, etc.)
  - [ ] Sous-type : Wallet Crypto (MetaMask, Ledger, Binance, etc.)
  - [ ] Sous-type : Autre plateforme d'investissement

**Interface :**
```
Onglet Comptes
├── 📁 Comptes Standard
│   ├── Compte Courant UBS - 5,234.50 CHF
│   ├── Compte Épargne PostFinance - 12,500.00 CHF
│   └── [+ Ajouter compte standard]
└── 📁 Comptes Plateforme
    ├── Interactive Brokers - 25,340.80 CHF
    ├── MetaMask Wallet - 0.45 ETH
    └── [+ Ajouter compte plateforme]
```

### A2. Transferts Externes sur Comptes Trading

**Objectif :** Permettre dépôts/retraits sur comptes plateforme

**Fonctionnalités :**
- [ ] Bouton "Transfert Externe" dans fiche compte plateforme
- [ ] Types de transfert :
  - [ ] Dépôt (vers plateforme)
  - [ ] Retrait (depuis plateforme)
- [ ] Formulaire transfert externe :
  - [ ] Montant
  - [ ] Devise
  - [ ] Date
  - [ ] Compte source/destination (si interne)
  - [ ] Notes
- [ ] Enregistrement automatique comme transaction
- [ ] Mise à jour automatique du solde

**Workflow exemple :**
```
Compte UBS (Standard) → [Transfert 5000 CHF] → Interactive Brokers (Plateforme)
- Transaction créée : "Transfert vers IB" (-5000 CHF UBS)
- Opération créée : "Dépôt" (+5000 CHF IB)
- Soldes mis à jour automatiquement
```

### A3. Filtrage par Compte

**Objectif :** Vue isolée des transactions par compte

**Fonctionnalités :**
- [ ] Clic sur un compte → filtre activé
- [ ] Indicateur visuel du filtre actif
- [ ] Affichage uniquement des transactions du compte
- [ ] Bouton "Réinitialiser filtre"
- [ ] Totaux recalculés pour le compte filtré

**Interface filtre actif :**
```
🔍 Filtre actif : Compte Courant UBS [✕ Supprimer]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Solde : 5,234.50 CHF
Revenus : +8,500.00 CHF
Dépenses : -3,265.50 CHF
Transactions : 47
```

### A4. CRUD Complet depuis le Filtre

**Objectif :** Gestion complète sans quitter la vue filtrée

**Fonctionnalités :**
- [ ] Ajouter transaction depuis filtre (compte pré-rempli)
- [ ] Modifier transaction (inline ou modal)
- [ ] Supprimer transaction (avec confirmation)
- [ ] Effectuer transfert interne/externe
- [ ] Ajouter opération d'investissement (si compte plateforme)

---

## 🏷️ B. Catégories & Sous-Catégories

### B1. Système de Sous-Catégories

**Objectif :** Classification détaillée des transactions

**Structure hiérarchique :**
```
Alimentation (catégorie)
├── Courses (sous-catégorie)
├── Restaurant (sous-catégorie)
└── Livraison (sous-catégorie)

Transport (catégorie)
├── Essence (sous-catégorie)
├── Transports publics (sous-catégorie)
└── Taxi/VTC (sous-catégorie)

Investissement (catégorie)
├── Actions (sous-catégorie)
├── Crypto (sous-catégorie)
├── Immobilier (sous-catégorie)
└── P2P Lending (sous-catégorie)
```

**Fonctionnalités :**
- [ ] Champ "Sous-catégorie" dans formulaire transaction
- [ ] Dropdown 2 niveaux (catégorie → sous-catégorie)
- [ ] Création sous-catégorie à la volée
- [ ] Statistiques par catégorie ET sous-catégorie
- [ ] Graphiques ventilés par sous-catégorie

### B2. Lien avec Paramètres

**Objectif :** Gestion centralisée des catégories

**Fonctionnalités :**
- [ ] Onglet "Paramètres" → Section "Catégories"
- [ ] Liste des catégories existantes
- [ ] Gérer sous-catégories pour chaque catégorie
- [ ] Couleurs/icônes personnalisables
- [ ] Ordre personnalisable (drag & drop)
- [ ] Suppression avec réaffectation des transactions

**Interface Paramètres Catégories :**
```
📊 Gestion des Catégories

Alimentation 🍔 (45 transactions)
  ├── Courses (28)
  ├── Restaurant (12)
  └── Livraison (5)
  [+ Ajouter sous-catégorie] [✏️ Modifier] [🗑️ Supprimer]

Transport 🚗 (23 transactions)
  ├── Essence (15)
  └── Transports publics (8)
  [+ Ajouter sous-catégorie] [✏️ Modifier] [🗑️ Supprimer]

[+ Créer nouvelle catégorie]
```

### B3. Dropdown Intelligent

**Objectif :** Auto-complétion des catégories existantes

**Fonctionnalités :**
- [ ] Dropdown avec toutes les catégories/sous-catégories existantes
- [ ] Recherche/filtre en temps réel
- [ ] Fréquence d'utilisation visible
- [ ] Catégories récentes en haut
- [ ] Option "Créer nouvelle" si non trouvée
- [ ] Sauvegarde automatique en paramètres

**Exemple dropdown :**
```
┌─ Catégorie ──────────────────┐
│ 🔍 Rechercher...             │
├──────────────────────────────┤
│ ⭐ RÉCENTES                  │
│   🍔 Alimentation → Courses  │
│   ⛽ Transport → Essence     │
│                              │
│ 📊 TOUTES (par fréquence)   │
│   🍔 Alimentation (45) ▾     │
│      → Courses (28)          │
│      → Restaurant (12)       │
│      → Livraison (5)         │
│   🚗 Transport (23) ▾        │
│      → Essence (15)          │
│      → Transports publics    │
│                              │
│ [+ Créer nouvelle catégorie] │
└──────────────────────────────┘
```

### B4. Types Détaillés Revenu/Dépense

**Objectif :** Classification précise pour liaison investissements

**Types de Revenus :**
- [ ] Salaire
- [ ] Freelance
- [ ] Dividendes (→ liaison auto investissements)
- [ ] Intérêts (→ liaison auto investissements)
- [ ] Loyer reçu (→ liaison auto immobilier)
- [ ] Plus-value (→ liaison auto investissements)
- [ ] Remboursement
- [ ] Cadeau/Don reçu
- [ ] Autre

**Types de Dépenses :**
- [ ] Alimentation
- [ ] Transport
- [ ] Logement
- [ ] Loisirs
- [ ] Santé
- [ ] Éducation
- [ ] Investissement (→ liaison possible)
- [ ] Transfert (→ liaison auto autre compte)
- [ ] Impôts/Taxes
- [ ] Assurances
- [ ] Autre

**Smart Linking :**
```
Si type = "Dividendes" → Proposer liaison à investissement action
Si type = "Intérêts" → Proposer liaison à investissement obligation/P2P
Si type = "Loyer reçu" → Proposer liaison à investissement immobilier
Si type = "Investissement" → Proposer liaison à compte plateforme
```

---

## 💸 C. Transferts Complets

### C1. Transferts Internes (Compte → Compte)

**Objectif :** Déplacer fonds entre comptes de l'utilisateur

**Fonctionnalités :**
- [ ] Formulaire transfert interne
  - [ ] Compte source (dropdown comptes standard + plateforme)
  - [ ] Compte destination (dropdown comptes standard + plateforme)
  - [ ] Montant
  - [ ] Devise (conversion auto si différente)
  - [ ] Date
  - [ ] Notes
- [ ] Création automatique de 2 transactions liées :
  - Transaction 1 : Sortie compte source (-X)
  - Transaction 2 : Entrée compte destination (+X)
- [ ] Mise à jour automatique des soldes

**Workflow :**
```
[Formulaire Transfert Interne]
De : Compte Courant UBS (5,234.50 CHF)
Vers : Interactive Brokers (25,340.80 CHF)
Montant : 2,000.00 CHF
Date : 2025-01-15
Notes : Rechargement compte trading

→ [Valider]

Résultat :
- UBS : 3,234.50 CHF (-2,000)
- IB : 27,340.80 CHF (+2,000)
- 2 transactions créées et liées
```

### C2. Transferts Externes

**Objectif :** Vers/depuis entités hors comptes utilisateur

**Fonctionnalités :**
- [ ] Formulaire transfert externe
  - [ ] Type : Sortant/Entrant
  - [ ] Compte concerné
  - [ ] Montant
  - [ ] Destinataire/Source externe
  - [ ] Catégorie (optionnelle)
  - [ ] Notes
- [ ] Lien optionnel vers :
  - [ ] Investissement (si c'est un achat)
  - [ ] Dette (si c'est un remboursement)
  - [ ] Créance (si c'est un paiement reçu)

### C3. Depuis Formulaire Transactions

**Objectif :** Tout faire depuis un seul endroit

**Amélioration formulaire transaction :**
- [ ] Champ "Type de transaction"
  - Option : Transaction simple
  - Option : Transfert interne
  - Option : Transfert externe
- [ ] Affichage conditionnel des champs selon type
- [ ] Workflow unifié

**Interface améliorée :**
```
[Nouvelle Transaction]

Type : ⚪ Transaction simple
       ⚫ Transfert interne
       ⚪ Transfert externe

[Si Transfert interne sélectionné]
Compte source : [Dropdown]
Compte destination : [Dropdown]
Montant : [Input]
Conversion : CHF → EUR (taux : 1.05) ℹ️
Date : [Date picker]
Notes : [Textarea]

[Si Transfert externe sélectionné]
Direction : ⚫ Sortant  ⚪ Entrant
Compte : [Dropdown]
Entité externe : [Input]
Lier à : [Dropdown : Aucun / Investissement / Dette / Créance]
[...]
```

---

## 💱 D. Devises Cohérentes

### D1. Affichage par Onglet

**Règle d'affichage :**
- **Dashboard** : Tout converti en devise préférée (CHF)
- **Transactions** : Devise d'origine de chaque transaction
- **Comptes** : Devise du compte
- **Investissements** : Devise de l'investissement
- **Dettes/Créances** : Devise d'origine
- **Objectifs** : Devise préférée

**Implémentation :**
- [ ] Fonction `formatAmount(amount, currency, context)`
- [ ] Context = 'dashboard' | 'transaction' | 'account' | etc.
- [ ] Conversion uniquement si context === 'dashboard'
- [ ] Affichage cohérent partout

### D2. Conversions Dashboard

**Objectif :** Vue d'ensemble en une seule devise

**Fonctionnalités :**
- [ ] API conversion temps réel (frankfurter.app)
- [ ] Cache conversions (1h)
- [ ] Fallback taux fixes si API down
- [ ] Indicateur "taux au [date/heure]"

**Exemple Dashboard :**
```
💰 Valeur Nette Totale : 45,678.90 CHF
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Comptes : 15,234.50 CHF
  - UBS (CHF) : 5,234.50 CHF
  - PostFinance (EUR) : 8,500.00 EUR → 8,925.00 CHF
  - Revolut (USD) : 1,200.00 USD → 1,075.00 CHF

Investissements : 28,340.80 CHF
  - Actions (USD) : 15,000.00 USD → 13,440.80 CHF
  - Crypto (BTC) : 0.15 BTC → 14,900.00 CHF

Dettes : -2,500.00 CHF

ℹ️ Taux de change au 15/01/2025 12:34
```

### D3. Sélecteur Devise Paramètres

**Fonctionnalités :**
- [ ] Onglet Paramètres → "Devise Préférée"
- [ ] Dropdown : CHF, EUR, USD, GBP, BTC, ETH
- [ ] Sauvegarde préférence utilisateur
- [ ] Application immédiate au dashboard

---

## 📊 E. Statistiques & Rapports Avancés

### E1. Statistiques par Catégorie/Sous-Catégorie

**Fonctionnalités :**
- [ ] Graphique circulaire dépenses par catégorie
- [ ] Drill-down : clic catégorie → voir sous-catégories
- [ ] Top 5 des sous-catégories les plus chères
- [ ] Évolution temporelle par catégorie
- [ ] Comparaison mois/mois

### E2. Analyse de Performance Investissements

**Métriques détaillées :**
- [ ] Rendement annualisé (%)
- [ ] Sharpe ratio
- [ ] Volatilité
- [ ] Meilleure/pire performance
- [ ] Allocation d'actifs (%)

### E3. Export Avancé

**Formats :**
- [ ] PDF avec graphiques
- [ ] Excel avec formules
- [ ] CSV structuré

---

## 🔄 F. Automatisations

### F1. Transactions Récurrentes

**Fonctionnalités :**
- [ ] Marquer transaction comme récurrente
- [ ] Fréquence : quotidien, hebdo, mensuel, annuel
- [ ] Création automatique
- [ ] Notification avant création
- [ ] Historique des occurrences

### F2. Règles Automatiques

**Exemples de règles :**
- Si transaction contient "Migros" → catégorie "Alimentation"
- Si montant > 1000 CHF vers IB → lier comme investissement
- Si description contient "salaire" → type "Salaire"

### F3. Alertes & Notifications

**Types d'alertes :**
- [ ] Solde compte < seuil
- [ ] Objectif atteint
- [ ] Dette bientôt échue
- [ ] Investissement performance -X%

---

## 🎨 G. Améliorations UX/UI

### G1. Formulaires Intelligents

**Fonctionnalités :**
- [ ] Pré-remplissage basé sur historique
- [ ] Suggestions contextuelles
- [ ] Validation en temps réel
- [ ] Raccourcis clavier

### G2. Navigation Rapide

**Fonctionnalités :**
- [ ] Recherche globale (Ctrl+K)
- [ ] Favoris/Épingle
- [ ] Fil d'Ariane
- [ ] Navigation clavier

### G3. Mode Sombre

**Fonctionnalités :**
- [ ] Toggle mode clair/sombre
- [ ] Détection préférence système
- [ ] Personnalisation couleurs

---

## 🔐 H. Sécurité & Données

### H0. BUG CRITIQUE - Multi-Comptes Google ⚠️

**Problème actuel :**
- Impossible de se connecter avec un autre compte Google
- L'utilisateur reste bloqué avec le premier compte utilisé
- Pas de possibilité de repartir à zéro avec un nouveau compte

**Fonctionnalités à implémenter :**
- [ ] Bouton "Déconnexion" fonctionnel
- [ ] Effacement complet de la session
- [ ] Permettre connexion avec différent compte Google
- [ ] Option "Commencer avec nouveau compte"
- [ ] Séparation complète des données par compte Google
- [ ] Bouton "Supprimer toutes mes données" (RGPD)
- [ ] Confirmation sécurisée avant suppression

**Priorité :** CRITIQUE - À corriger avant Phase 1

**Workflow attendu :**
```
1. Utilisateur connecté avec compte-a@gmail.com
2. Clic "Déconnexion" → Session effacée
3. Retour écran login
4. Connexion avec compte-b@gmail.com → Nouveaux données vierges
5. Chaque compte a ses propres données isolées
```

### H1. Sauvegarde Automatique

**Fonctionnalités :**
- [ ] Export auto quotidien
- [ ] Stockage cloud (optionnel)
- [ ] Historique versions

### H2. Import Relevés Bancaires

**Formats supportés :**
- [ ] CSV (formats multiples)
- [ ] PDF (OCR amélioré)
- [ ] OFX/QFX
- [ ] API bancaire (si disponible)

---

## 📱 I. Mobile & PWA

### I1. Application Mobile Dédiée

**Fonctionnalités :**
- [ ] Scan reçus amélioré
- [ ] Notifications push
- [ ] Widget dashboard
- [ ] Mode hors ligne

### I2. Optimisations PWA

**Fonctionnalités :**
- [ ] Cache intelligent
- [ ] Sync en arrière-plan
- [ ] Installation guidée

---

## 🚀 Priorisation Suggérée

### Phase 1 - Fondations (Priorité CRITIQUE)
1. Système comptes avancé (A1, A2, A3, A4)
2. Catégories & sous-catégories (B1, B2, B3)
3. Devises cohérentes (D1, D2)

### Phase 2 - Fonctionnalités Avancées
1. Transferts complets (C1, C2, C3)
2. Types détaillés (B4)
3. Statistiques avancées (E1, E2)

### Phase 3 - Automatisation & UX
1. Transactions récurrentes (F1)
2. Règles automatiques (F2)
3. Amélioration formulaires (G1)

### Phase 4 - Raffinement
1. Alertes (F3)
2. Export avancé (E3)
3. Mode sombre (G3)
4. Mobile (I1, I2)

---

## 📝 Notes de Développement

**Considérations techniques :**
- Maintenir rétrocompatibilité avec données existantes
- Tests exhaustifs avant chaque phase
- Documentation utilisateur à jour
- Performance : < 2s chargement initial
- Accessibilité WCAG 2.1 AA

**Estimation temps développement :**
- Phase 1 : 15-20 heures
- Phase 2 : 10-15 heures
- Phase 3 : 8-12 heures
- Phase 4 : 5-8 heures

**Total : 40-55 heures de développement**

---

**Dernière mise à jour :** Janvier 2025
**Prochaine révision :** Après Phase 1
