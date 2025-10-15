# 💰 FinanceApp - Application Complète de Gestion Financière

## 🎯 Qu'est-ce que c'est ?

**FinanceApp** est une application web progressive (PWA) complète pour gérer vos finances personnelles, vos investissements, et bien plus encore !

---

## ✨ Fonctionnalités

### 💵 Gestion Financière
- **Comptes multiples** : Gérez tous vos comptes (courant, épargne, investissement)
- **Transactions** : Revenus, dépenses, virements
- **Transactions fractionnées** : Divisez une dépense en plusieurs catégories
- **Transactions récurrentes** : Salaires, loyers, abonnements automatiques

### 📈 Investissements
- **Portfolio** : Suivez vos actions, cryptos, ETFs
- **Calculs automatiques** : PRU, plus/moins-values
- **Opérations** : Achat, vente, dividendes
- **Performance en temps réel**

### 🎯 Objectifs & Suivi
- **Objectifs d'épargne** : Définissez et suivez vos objectifs
- **Dettes** : Gérez vos emprunts et crédits
- **Créances** : Suivez l'argent qu'on vous doit

### 🛒 Module Courses (UNIQUE !)
- **Base de données de produits** : Noms, prix, catégories
- **Historique d'achats** : Date et lieu de chaque achat
- **Promotions** : Marquez les produits en promo
- **Listes de courses** : Créez et gérez vos listes
- **Export** : Téléchargez vos listes en .txt

### 🏦 Connexions Bancaires
- **Intégration bancaire** : Structure prête pour APIs bancaires
- **Synchronisation** : Importez vos relevés automatiquement

### 📊 Dashboard & Analyses
- **Graphiques interactifs** : Pie, Bar, Line charts
- **Statistiques** : Valeur nette, revenus/dépenses, taux d'épargne
- **Répartition** : Visualisez vos actifs et dépenses

### 🔐 Sécurité
- **Authentification Google** : Connexion sécurisée (optionnel)
- **Isolation des données** : Chaque utilisateur voit uniquement ses données
- **Sessions sécurisées** : Cookies httpOnly, expiration automatique

### 💾 Sauvegarde
- **Export complet** : JSON avec toutes vos données
- **Import** : Restaurez vos données en 1 clic
- **Synchronisation** : Entre version locale et déployée

### 📱 PWA (Progressive Web App)
- **Installable** : Sur mobile et desktop
- **Hors ligne** : Fonctionne sans Internet
- **Native** : Comme une vraie application

---

## 🚀 Démarrage Rapide

### En Ligne (Déjà Déployé)
1. Allez sur : https://finance-buddy-308.preview.emergentagent.com
2. Utilisez l'application !

### En Local (Sur Votre Ordinateur)

**Voir le guide complet :** [`GUIDE_INSTALLATION_LOCALE_DETAILLE.md`](/app/GUIDE_INSTALLATION_LOCALE_DETAILLE.md)

**Résumé Ultra-Rapide :**

```bash
# 1. Clonez le repo
git clone https://github.com/VOTRE-REPO/financeapp.git
cd financeapp

# 2. Backend
cd backend
python -m venv venv
source venv/bin/activate  # Mac/Linux
# venv\Scripts\activate    # Windows
pip install -r requirements.txt
uvicorn server:app --host 0.0.0.0 --port 8001 --reload

# 3. Frontend (nouveau terminal)
cd frontend
yarn install
yarn start

# 4. MongoDB (installer d'abord)
# Mac: brew services start mongodb-community
# Windows: net start MongoDB
# Linux: sudo systemctl start mongod

# 5. Ouvrez http://localhost:3000
```

---

## 🛠️ Technologies

### Backend
- **FastAPI** - Framework Python moderne et rapide
- **MongoDB** - Base de données NoSQL
- **Motor** - Driver MongoDB asynchrone
- **Pydantic** - Validation des données
- **Emergent Auth** - Authentification Google (gratuite)

### Frontend
- **React 19** - Framework UI moderne
- **Tailwind CSS** - Design system
- **Chart.js** - Graphiques interactifs
- **Lucide Icons** - Icônes modernes
- **Axios** - Requêtes HTTP

### Infrastructure
- **PWA** - Service Worker + Manifest
- **Emergent** - Plateforme de déploiement
- **Supervisor** - Gestion des processus

---

## 📂 Structure du Projet

```
financeapp/
├── backend/
│   ├── server.py           # API FastAPI principale
│   ├── auth.py             # Authentification Google
│   ├── requirements.txt    # Dépendances Python
│   └── .env                # Variables d'environnement
├── frontend/
│   ├── src/
│   │   ├── App.js          # Application React principale
│   │   ├── App.css         # Styles
│   │   ├── services/
│   │   │   └── api.js      # Client API
│   │   └── components/
│   │       └── AuthButton.js # Bouton de connexion
│   ├── public/
│   │   ├── manifest.json   # Manifest PWA
│   │   └── sw.js           # Service Worker
│   ├── package.json        # Dépendances Node
│   └── .env                # Variables d'environnement
├── GUIDE_INSTALLATION_LOCALE_DETAILLE.md  # Guide complet
├── GUIDE_UTILISATEUR.md                   # Guide d'utilisation
└── README_FINANCEAPP.md                   # Ce fichier
```

---

## 📖 Documentation

| Document | Description |
|----------|-------------|
| [Guide d'Installation Locale](/app/GUIDE_INSTALLATION_LOCALE_DETAILLE.md) | Guide étape par étape pour installer en local |
| [Guide Utilisateur](/app/GUIDE_UTILISATEUR.md) | Comment utiliser l'application |
| Ce README | Vue d'ensemble du projet |

---

## 💰 Coût & Gratuité

### 100% GRATUIT
- ✅ Toutes les technologies (MongoDB, React, FastAPI, Node.js, Python)
- ✅ Emergent Auth (connexion Google)
- ✅ Déploiement sur Emergent (pendant le développement)
- ✅ Utilisation en local (illimitée)
- ✅ APIs externes (Frankfurter, CoinGecko gratuit)

### Aucun Compte Payant Requis
- ❌ Pas de carte bancaire demandée
- ❌ Pas d'abonnement
- ❌ Pas de limite d'utilisation
- ❌ Pas de publicité

---

## 🔧 API Endpoints Principaux

### Authentification
- `POST /api/auth/session` - Créer une session
- `GET /api/auth/me` - Obtenir l'utilisateur actuel
- `POST /api/auth/logout` - Se déconnecter

### Comptes
- `GET /api/accounts` - Liste des comptes
- `POST /api/accounts` - Créer un compte
- `PUT /api/accounts/{id}` - Modifier un compte
- `DELETE /api/accounts/{id}` - Supprimer un compte

### Transactions
- `GET /api/transactions` - Liste des transactions
- `POST /api/transactions` - Créer une transaction
- `PUT /api/transactions/{id}` - Modifier une transaction
- `DELETE /api/transactions/{id}` - Supprimer une transaction

### Investissements
- `GET /api/investments` - Liste des investissements
- `POST /api/investments` - Créer un investissement
- `POST /api/investments/{id}/operations` - Ajouter une opération

### Courses
- `GET /api/products` - Liste des produits
- `POST /api/products` - Créer un produit
- `GET /api/shopping-lists` - Listes de courses
- `POST /api/shopping-lists` - Créer une liste
- `GET /api/shopping-lists/{id}/download` - Télécharger une liste

### Dashboard & Export
- `GET /api/dashboard/summary` - Statistiques globales
- `GET /api/export/all` - Exporter toutes les données
- `POST /api/import/all` - Importer des données

**Documentation API complète :** http://localhost:8001/docs (quand l'app tourne)

---

## 🎨 Design

- **Couleurs** : Indigo (#4f46e5) comme couleur principale
- **Typographie** : Système de fonts natifs
- **Layout** : Sidebar responsive
- **Dark Mode** : (À venir)

---

## 🤝 Contribution

Ce projet est privé mais vous pouvez :
- Utiliser le code pour votre usage personnel
- Modifier et personnaliser à volonté
- Demander de l'aide dans le chat Emergent

---

## 📝 Licence

Usage personnel uniquement.

---

## 🆘 Support

**Questions ? Problèmes ?**

1. Consultez les guides :
   - [Guide d'Installation](/app/GUIDE_INSTALLATION_LOCALE_DETAILLE.md)
   - [Guide Utilisateur](/app/GUIDE_UTILISATEUR.md)

2. Revenez dans le chat Emergent

3. Vérifiez les logs :
```bash
# Backend
tail -f /var/log/supervisor/backend.err.log

# Frontend
tail -f /var/log/supervisor/frontend.out.log
```

---

## 🎉 Remerciements

Développé avec ❤️ par l'IA E1 d'Emergent

**Bon usage de FinanceApp ! 💰📈**
