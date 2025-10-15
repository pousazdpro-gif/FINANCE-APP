# 📘 GUIDE COMPLET - Utiliser FinanceApp en LOCAL (Étape par Étape)

## 🎯 CE GUIDE VOUS MONTRE COMMENT :
1. Télécharger TOUT le code de votre application
2. L'installer sur VOTRE ordinateur (Windows, Mac, Linux)
3. L'utiliser SANS INTERNET (100% local)
4. Importer votre ancienne sauvegarde

---

## 💰 TOUT EST 100% GRATUIT

**Aucun compte payant requis pour :**
- ✅ MongoDB (base de données) - Version Community GRATUITE
- ✅ React (frontend) - Open Source GRATUIT
- ✅ FastAPI (backend) - Open Source GRATUIT
- ✅ Node.js + Python - GRATUITS
- ✅ Emergent Auth (connexion Google) - GRATUIT (optionnel)

---

## 📥 ÉTAPE 1 : TÉLÉCHARGER LE CODE

### Option A : Via Emergent (Le Plus Simple)

1. **Dans votre chat Emergent actuel**, cliquez sur le bouton **"Save to GitHub"** en haut
   - Vous verrez une option "Connect GitHub" si pas encore fait
   - Suivez les instructions pour connecter votre compte GitHub
   - Le code sera automatiquement poussé sur votre repo GitHub

2. **Sur votre ordinateur**, ouvrez un terminal et tapez :
```bash
git clone https://github.com/VOTRE-NOM/VOTRE-REPO.git
cd VOTRE-REPO
```

### Option B : Téléchargement Manuel

1. Dans Emergent, demandez-moi : "Exporte tout le code en ZIP"
2. Téléchargez le fichier ZIP
3. Extrayez-le dans un dossier (ex: `C:\FinanceApp` sur Windows ou `~/FinanceApp` sur Mac/Linux)

---

## 💻 ÉTAPE 2 : INSTALLER LES LOGICIELS NÉCESSAIRES

### Sur Windows :

#### 2.1 Installer Python
1. Allez sur https://www.python.org/downloads/
2. Téléchargez Python 3.11 ou plus récent
3. **IMPORTANT** : Cochez "Add Python to PATH" lors de l'installation
4. Cliquez "Install Now"
5. Vérifiez dans un terminal (CMD) :
```cmd
python --version
```
Vous devez voir quelque chose comme `Python 3.11.x`

#### 2.2 Installer Node.js
1. Allez sur https://nodejs.org/
2. Téléchargez la version "LTS" (recommandée)
3. Installez avec les options par défaut
4. Vérifiez dans un terminal :
```cmd
node --version
npm --version
```

#### 2.3 Installer Yarn
Dans un terminal (CMD) :
```cmd
npm install -g yarn
```

#### 2.4 Installer MongoDB
1. Allez sur https://www.mongodb.com/try/download/community
2. Sélectionnez :
   - Version: 7.0 ou plus récent
   - Platform: Windows
   - Package: MSI
3. Téléchargez et installez
4. **IMPORTANT** : Cochez "Install MongoDB as a Service"
5. MongoDB démarrera automatiquement

---

### Sur Mac :

#### 2.1 Installer Homebrew (gestionnaire de paquets)
Dans le Terminal, tapez :
```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

#### 2.2 Installer Python, Node.js, Yarn et MongoDB
```bash
brew install python@3.11
brew install node
brew install yarn
brew install mongodb-community@7.0
```

#### 2.3 Démarrer MongoDB
```bash
brew services start mongodb-community@7.0
```

---

### Sur Linux (Ubuntu/Debian) :

```bash
# Python
sudo apt update
sudo apt install python3.11 python3.11-venv python3-pip

# Node.js et Yarn
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
sudo npm install -g yarn

# MongoDB
wget -qO - https://www.mongodb.org/static/pgp/server-7.0.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu $(lsb_release -cs)/mongodb-org/7.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list
sudo apt update
sudo apt install -y mongodb-org
sudo systemctl start mongod
sudo systemctl enable mongod
```

---

## ⚙️ ÉTAPE 3 : CONFIGURER L'APPLICATION

### 3.1 Ouvrir le dossier du projet

**Windows** : Ouvrez l'Explorateur de fichiers et naviguez vers votre dossier (ex: `C:\FinanceApp`)

**Mac/Linux** : Ouvrez le Terminal et tapez :
```bash
cd ~/FinanceApp
```
(Remplacez `~/FinanceApp` par le chemin vers votre dossier)

### 3.2 Configurer le Backend

**Ouvrez un terminal dans le dossier backend** :

```bash
cd backend
```

**Créer l'environnement virtuel Python** :

Sur Windows :
```cmd
python -m venv venv
venv\Scripts\activate
```

Sur Mac/Linux :
```bash
python3 -m venv venv
source venv/bin/activate
```

Vous verrez `(venv)` apparaître au début de votre ligne de commande.

**Installer les dépendances** :
```bash
pip install -r requirements.txt
```

Cela prendra quelques minutes (50-100 packages à installer).

**Vérifier le fichier .env** :

Ouvrez le fichier `backend/.env` avec un éditeur de texte (Notepad++, VSCode, TextEdit, etc.)

Il doit contenir :
```
MONGO_URL=mongodb://localhost:27017
DB_NAME=financeapp_local
CORS_ORIGINS=http://localhost:3000
```

**Si le fichier n'existe pas, créez-le avec ce contenu.**

### 3.3 Configurer le Frontend

**Ouvrez un NOUVEAU terminal** (gardez l'ancien ouvert) et allez dans le dossier frontend :

```bash
cd frontend
```

**Installer les dépendances** :
```bash
yarn install
```

Cela prendra quelques minutes (des centaines de packages).

**Vérifier le fichier .env** :

Ouvrez le fichier `frontend/.env` avec un éditeur de texte.

Il doit contenir :
```
REACT_APP_BACKEND_URL=http://localhost:8001
```

**Si le fichier n'existe pas, créez-le avec ce contenu.**

---

## 🚀 ÉTAPE 4 : DÉMARRER L'APPLICATION

Vous avez besoin de **2 terminaux ouverts** (un pour le backend, un pour le frontend).

### Terminal 1 : Backend

```bash
cd backend
# Activer l'environnement virtuel si pas déjà fait
# Windows: venv\Scripts\activate
# Mac/Linux: source venv/bin/activate

uvicorn server:app --host 0.0.0.0 --port 8001 --reload
```

Vous verrez :
```
INFO:     Uvicorn running on http://0.0.0.0:8001 (Press CTRL+C to quit)
INFO:     Started reloader process
INFO:     Started server process
INFO:     Application startup complete.
```

**Laissez ce terminal OUVERT !**

### Terminal 2 : Frontend

Dans un NOUVEAU terminal :

```bash
cd frontend
yarn start
```

Après quelques secondes, votre navigateur s'ouvrira automatiquement sur :
```
http://localhost:3000
```

Si ça ne s'ouvre pas automatiquement, ouvrez manuellement cette URL dans Chrome/Firefox/Safari.

**Laissez ce terminal OUVERT aussi !**

---

## ✅ ÉTAPE 5 : VÉRIFIER QUE TOUT FONCTIONNE

### 5.1 Tester le Backend

Dans votre navigateur, allez sur :
```
http://localhost:8001/api/
```

Vous devriez voir :
```json
{
  "message": "FinanceApp API v1.0",
  "status": "operational",
  "endpoints": [...]
}
```

### 5.2 Tester le Frontend

L'application devrait être visible sur `http://localhost:3000`

Vous devriez voir :
- La sidebar avec "FinanceApp"
- Les menus : Résumé, Comptes, Transactions, etc.
- Le bouton "Se connecter avec Google" en bas

### 5.3 Créer un Compte de Test

1. Cliquez sur "Comptes" dans la sidebar
2. Cliquez sur "Nouveau Compte"
3. Remplissez :
   - Nom : "Mon Compte"
   - Solde : 1000
4. Cliquez "Enregistrer"
5. Le compte apparaît dans la liste ✅

### 5.4 Créer une Transaction de Test

1. Cliquez sur "Transactions" dans la sidebar
2. Cliquez sur "Nouvelle Transaction"
3. Remplissez :
   - Sélectionnez le compte
   - Description : "Test"
   - Montant : 50
   - Catégorie : "Test"
4. Cliquez "Enregistrer"
5. La transaction apparaît dans la liste ✅

---

## 📥 ÉTAPE 6 : IMPORTER VOTRE ANCIENNE SAUVEGARDE

### 6.1 Préparer votre Fichier de Sauvegarde

Votre ancienne sauvegarde doit être un fichier JSON (ex: `backup.json`)

**Format attendu :**
```json
{
  "accounts": [...],
  "transactions": [...],
  "investments": [...],
  "goals": [...],
  "debts": [...],
  "receivables": [...],
  "products": [...],
  "shopping_lists": [...],
  "bank_connections": [...]
}
```

### 6.2 Importer dans l'Application

**Méthode 1 : Via l'Interface (Recommandé)**

1. Dans l'application (http://localhost:3000)
2. Cliquez sur le bouton "Importer" en bas de la sidebar
3. Sélectionnez votre fichier `backup.json`
4. Attendez le message "Données importées avec succès !"
5. Rafraîchissez la page (F5)
6. Toutes vos données sont là ! ✅

**Méthode 2 : Via API (Pour Utilisateurs Avancés)**

Dans un terminal :
```bash
curl -X POST http://localhost:8001/api/import/all \
  -H "Content-Type: application/json" \
  -d @backup.json
```

### 6.3 Vérifier l'Import

1. Allez dans "Comptes" - vous devriez voir tous vos comptes
2. Allez dans "Transactions" - vous devriez voir toutes vos transactions
3. Allez dans "Dashboard" - vous devriez voir vos statistiques

---

## 🔄 ÉTAPE 7 : UTILISATION QUOTIDIENNE

### Démarrer l'Application (Tous les Jours)

**Terminal 1 - Backend :**
```bash
cd /chemin/vers/financeapp/backend
source venv/bin/activate  # Mac/Linux
# OU venv\Scripts\activate  # Windows
uvicorn server:app --host 0.0.0.0 --port 8001 --reload
```

**Terminal 2 - Frontend :**
```bash
cd /chemin/vers/financeapp/frontend
yarn start
```

**Raccourci** : Vous pouvez créer un fichier de démarrage :

**Windows** - Créez `start.bat` :
```batch
@echo off
start cmd /k "cd backend && venv\Scripts\activate && uvicorn server:app --host 0.0.0.0 --port 8001 --reload"
start cmd /k "cd frontend && yarn start"
```
Double-cliquez dessus pour démarrer !

**Mac/Linux** - Créez `start.sh` :
```bash
#!/bin/bash
cd backend
source venv/bin/activate
uvicorn server:app --host 0.0.0.0 --port 8001 --reload &
cd ../frontend
yarn start
```
Rendez-le exécutable : `chmod +x start.sh`
Puis lancez-le : `./start.sh`

### Arrêter l'Application

Dans chaque terminal, appuyez sur **Ctrl + C**

### Sauvegarder Vos Données

**Régulièrement (au moins 1x par semaine) :**

1. Dans l'app, cliquez sur "Exporter"
2. Sauvegardez le fichier JSON quelque part de sûr
3. (Optionnel) Uploadez-le sur Google Drive / Dropbox

---

## 🔐 ÉTAPE 8 : ACTIVER LA CONNEXION GOOGLE (Optionnel)

Si vous voulez vous connecter avec Google (pour protéger vos données) :

### 8.1 L'Authentification Fonctionne Déjà !

Le bouton "Se connecter avec Google" est déjà dans l'app.

**MAIS** : Il fonctionne uniquement quand l'app est déployée sur Emergent (avec HTTPS).

### 8.2 Pour Utiliser l'Auth en Local

Vous avez 2 options :

**Option A : Mode Anonymous (Sans Auth)**
- Utilisez l'app sans vous connecter
- Vos données sont stockées sous "anonymous"
- Parfait pour usage personnel

**Option B : Déployer sur Emergent**
- Gardez une version en ligne sur Emergent
- Utilisez l'auth Google là-bas
- Synchronisez avec votre version locale via Export/Import

---

## 🆘 DÉPANNAGE

### Problème : "MongoDB connection refused"

**Solution :**
```bash
# Vérifier si MongoDB tourne
# Windows:
sc query MongoDB

# Mac:
brew services list | grep mongodb

# Linux:
sudo systemctl status mongod
```

Si MongoDB n'est pas démarré :
```bash
# Windows:
net start MongoDB

# Mac:
brew services start mongodb-community@7.0

# Linux:
sudo systemctl start mongod
```

### Problème : "Port 8001 already in use"

**Solution :**

Tuez le processus qui utilise le port :

**Windows :**
```cmd
netstat -ano | findstr :8001
taskkill /PID <PID_NUMBER> /F
```

**Mac/Linux :**
```bash
lsof -ti:8001 | xargs kill -9
```

### Problème : "Module not found"

**Solution :**

Réinstallez les dépendances :

**Backend :**
```bash
cd backend
pip install -r requirements.txt
```

**Frontend :**
```bash
cd frontend
rm -rf node_modules
yarn install
```

### Problème : "Can't connect to backend"

**Vérifiez :**

1. Le backend tourne bien (terminal 1)
2. L'URL est correcte dans `frontend/.env` : `REACT_APP_BACKEND_URL=http://localhost:8001`
3. Pas de firewall bloquant le port 8001

---

## 📱 BONUS : INSTALLER COMME APP NATIVE (PWA)

### Sur Chrome/Edge (Desktop)

1. Ouvrez l'app (http://localhost:3000)
2. Cliquez sur l'icône d'installation (+ ou ⊕) dans la barre d'adresse
3. Cliquez "Installer"
4. L'app s'ouvre dans une fenêtre séparée !

### Sur Mobile (Android/iOS)

1. Ouvrez l'app dans Safari (iOS) ou Chrome (Android)
2. iOS : Appuyez sur "Partager" puis "Sur l'écran d'accueil"
3. Android : Menu (⋮) puis "Ajouter à l'écran d'accueil"

---

## 🎓 RÉCAPITULATIF COMPLET

### CE QUI EST INSTALLÉ (Tout Gratuit)
- ✅ Python 3.11+ (backend)
- ✅ Node.js + Yarn (frontend)
- ✅ MongoDB Community (base de données)
- ✅ Toutes les dépendances (50+ pour backend, 1000+ pour frontend)

### OÙ SONT VOS DONNÉES
- **Base de données** : MongoDB local (`localhost:27017`)
- **Nom de la DB** : `financeapp_local`
- **Sauvegarde** : Bouton "Exporter" dans l'app

### COMMENT UTILISER
1. Ouvrez 2 terminaux
2. Terminal 1 : Démarrez le backend
3. Terminal 2 : Démarrez le frontend
4. Naviguez sur http://localhost:3000
5. Utilisez l'app !

### COMMENT SAUVEGARDER
1. Cliquez "Exporter" dans l'app
2. Sauvegardez le fichier JSON
3. Pour restaurer : Cliquez "Importer" et sélectionnez le fichier

---

## 🎉 FÉLICITATIONS !

Vous avez maintenant FinanceApp qui tourne EN LOCAL sur votre ordinateur !

**Avantages :**
- ✅ Fonctionne SANS INTERNET
- ✅ Vos données sont SUR VOTRE MACHINE
- ✅ Pas de limite d'utilisation
- ✅ 100% GRATUIT
- ✅ Vous contrôlez TOUT

**Questions ? Problèmes ?**

Revenez me voir dans le chat Emergent et je vous aide ! 💪

---

## 📞 AIDE RAPIDE

| Problème | Solution Rapide |
|----------|----------------|
| MongoDB ne démarre pas | Vérifier les services système |
| Port 8001 occupé | Tuer le processus ou changer le port |
| Modules manquants | Réinstaller les dépendances |
| Import ne marche pas | Vérifier le format JSON |
| App ne charge pas | Vérifier que les 2 serveurs tournent |

**Commandes Essentielles :**

```bash
# Vérifier que tout tourne
curl http://localhost:8001/api/           # Backend
curl http://localhost:3000                 # Frontend

# Vérifier MongoDB
mongosh mongodb://localhost:27017

# Logs backend
cd backend && tail -f logs.txt

# Nettoyer et réinstaller
cd backend && rm -rf venv && python -m venv venv && pip install -r requirements.txt
cd frontend && rm -rf node_modules && yarn install
```

---

**Bon développement avec FinanceApp ! 🚀**
