# FinanceApp - Application de Gestion Financière Personnelle

## 📊 Vue d'ensemble

FinanceApp est une application web progressive (PWA) complète pour la gestion de finances personnelles, développée avec React, FastAPI et MongoDB.

## ✨ Fonctionnalités

### 💰 Gestion des Comptes
- Création de comptes bancaires multiples
- Calcul automatique des soldes basé sur les transactions
- Support multi-devises (EUR, USD, CHF, GBP, BTC, ETH)

### 📝 Transactions
- Ajout/modification/suppression de transactions
- Catégorisation automatique
- Import CSV et OCR (scan de reçus)
- Liaison aux investissements, dettes, créances
- Transactions récurrentes

### 📈 Investissements
- Suivi de portefeuille complet
- Opérations d'achat/vente
- Calculs automatiques : prix moyen, valeur actuelle, gains/pertes
- Types : actions, crypto, immobilier, etc.
- Liaison avec transactions pour traçabilité

### 🎯 Objectifs
- Définition d'objectifs d'épargne
- Suivi de progression
- Barre de progression visuelle
- Catégorisation (vacances, achat, urgence, etc.)

### 💳 Dettes
- Gestion des prêts et crédits
- Suivi des paiements
- Calcul du montant restant
- Taux d'intérêt
- Historique complet

### 💵 Créances
- Gestion des sommes à recevoir
- Suivi des paiements reçus
- Calcul du montant restant
- Liaison avec transactions

### 📊 Tableau de Bord
- Vue d'ensemble des finances
- Valeur nette (Net Worth)
- Répartition des actifs
- Évolution temporelle

### 🔐 Authentification
- Connexion Google OAuth
- Sessions sécurisées
- Isolation des données par utilisateur

### 🌐 Multi-devises
- Support de 6 devises principales
- Conversion automatique dans les rapports
- Préférence utilisateur sauvegardée

### 📱 PWA
- Installation sur mobile/desktop
- Fonctionne hors ligne
- Notifications

## 🛠️ Stack Technique

### Frontend
- **React** 18.x
- **TailwindCSS** pour le styling
- **Lucide Icons** pour les icônes
- **Axios** pour les appels API
- **Tesseract.js** pour l'OCR
- **jsPDF** pour l'export PDF

### Backend
- **FastAPI** (Python)
- **MongoDB** pour la base de données
- **Pydantic** pour la validation
- **Google OAuth** pour l'authentification

### Infrastructure
- **Supervisor** pour la gestion des processus
- **Nginx** comme reverse proxy
- Hot reload activé pour le développement

## 🚀 Installation et Démarrage

### Prérequis
- Python 3.8+
- Node.js 16+
- MongoDB
- yarn

### Installation

```bash
# Backend
cd backend
pip install -r requirements.txt

# Frontend
cd frontend
yarn install
```

### Configuration

**Backend** (`.env` dans `/backend`):
```
MONGO_URL=mongodb://localhost:27017
GOOGLE_CLIENT_ID=your_client_id
GOOGLE_CLIENT_SECRET=your_client_secret
SECRET_KEY=your_secret_key
```

**Frontend** (`.env` dans `/frontend`):
```
REACT_APP_BACKEND_URL=http://localhost:8001
REACT_APP_GOOGLE_CLIENT_ID=your_client_id
```

### Démarrage

```bash
# Démarrer tous les services
sudo supervisorctl start all

# Vérifier le statut
sudo supervisorctl status

# Redémarrer un service
sudo supervisorctl restart backend
sudo supervisorctl restart frontend
```

## 📖 Documentation API

### Endpoints principaux

#### Authentification
- `GET /api/auth/me` - Informations utilisateur
- `POST /api/auth/login` - Connexion Google
- `POST /api/auth/logout` - Déconnexion

#### Comptes
- `GET /api/accounts` - Liste des comptes
- `POST /api/accounts` - Créer un compte
- `PUT /api/accounts/{id}` - Modifier un compte
- `DELETE /api/accounts/{id}` - Supprimer un compte

#### Transactions
- `GET /api/transactions` - Liste des transactions
- `POST /api/transactions` - Créer une transaction
- `PUT /api/transactions/{id}` - Modifier une transaction
- `DELETE /api/transactions/{id}` - Supprimer une transaction

#### Investissements
- `GET /api/investments` - Liste des investissements
- `POST /api/investments` - Créer un investissement
- `PUT /api/investments/{id}` - Modifier un investissement
- `POST /api/investments/{id}/operations` - Ajouter une opération
- `DELETE /api/investments/{id}` - Supprimer un investissement

#### Dettes
- `GET /api/debts` - Liste des dettes
- `POST /api/debts` - Créer une dette
- `PUT /api/debts/{id}` - Modifier une dette
- `POST /api/debts/{id}/payments` - Ajouter un paiement
- `DELETE /api/debts/{id}` - Supprimer une dette

#### Créances
- `GET /api/receivables` - Liste des créances
- `POST /api/receivables` - Créer une créance
- `PUT /api/receivables/{id}` - Modifier une créance
- `POST /api/receivables/{id}/payments` - Ajouter un paiement
- `DELETE /api/receivables/{id}` - Supprimer une créance

#### Objectifs
- `GET /api/goals` - Liste des objectifs
- `POST /api/goals` - Créer un objectif
- `PUT /api/goals/{id}` - Modifier un objectif
- `DELETE /api/goals/{id}` - Supprimer un objectif

## 🎨 Structure du Projet

```
/app
├── backend/
│   ├── server.py          # Application FastAPI principale
│   ├── auth.py            # Authentification Google
│   ├── requirements.txt   # Dépendances Python
│   └── .env              # Configuration backend
├── frontend/
│   ├── src/
│   │   ├── App.js        # Composant principal
│   │   ├── components/   # Composants React
│   │   └── services/     # Services API
│   ├── public/
│   ├── package.json      # Dépendances Node
│   └── .env             # Configuration frontend
└── README.md            # Ce fichier
```

## 🔧 Développement

### Hot Reload
- Frontend et backend ont le hot reload activé
- Les modifications sont automatiquement rechargées
- Redémarrez seulement pour :
  - Installation de nouvelles dépendances
  - Modifications des fichiers `.env`

### Tests
```bash
# Tests backend
cd backend
pytest

# Tests frontend
cd frontend
yarn test
```

### Logs
```bash
# Logs backend
tail -f /var/log/supervisor/backend.err.log
tail -f /var/log/supervisor/backend.out.log

# Logs frontend
tail -f /var/log/supervisor/frontend.err.log
```

## 📱 Fonctionnalités Avancées

### OCR (Reconnaissance de reçus)
- Upload d'image ou PDF
- Extraction automatique des données
- Création de transactions en un clic

### Import/Export
- Import CSV de relevés bancaires
- Export PDF des rapports
- Export JSON de toutes les données

### Liaison de Transactions
- Lier une transaction à un investissement, une dette ou une créance
- Traçabilité complète
- Mise à jour automatique des calculs

## 🐛 Résolution de Problèmes

### Le frontend ne démarre pas
```bash
cd /app/frontend
yarn install
sudo supervisorctl restart frontend
```

### Le backend ne démarre pas
```bash
cd /app/backend
pip install -r requirements.txt
sudo supervisorctl restart backend
```

### Erreur de connexion MongoDB
- Vérifier que MongoDB est démarré : `sudo supervisorctl status mongodb`
- Vérifier la variable `MONGO_URL` dans `/app/backend/.env`

### Problèmes d'authentification
- Vérifier les credentials Google OAuth dans les fichiers `.env`
- Vérifier que l'URL de callback est configurée dans Google Cloud Console

## 📄 Licence

Propriétaire - Tous droits réservés

## 👨‍💻 Auteur

FinanceApp - Application de gestion financière personnelle

---

**Version:** 2.0  
**Dernière mise à jour:** Janvier 2025