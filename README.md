# Smart City

Plateforme Big Data & IoT pour une ville intelligente. Le dépôt contient plusieurs composants intégrés qui communiquent via Apache Kafka :

- **Ingestion & Simulation** : Node-RED (simulateurs de capteurs environnementaux, d'eau et de trafic).
* **Traitement de Flux** : Apache Spark / PySpark (streaming structuré, agrégations et alertes).
- **Messagerie** : Apache Kafka (avec Zookeeper et initialisation automatisée des topics).
- **Stockage** : MongoDB (base de données pour les données froides et agrégées).
- **Service API** : Backend (Node.js + Express + Socket.IO pour le temps réel).
- **Visualisation** : Frontend (Next.js + TailwindCSS + Dashboard temps réel).

---

## 🛠️ Prérequis

- **Docker** et **Docker Compose** (installés et démarrés).
- **Apache Kafka 4.2.0**, fourni par l'image Docker `apache/kafka:4.2.0`.
- *Optionnel (si développement hors conteneur)* :
  - **Node.js** (v20+ recommandé)
  - **Python 3.11+** (pour les jobs Spark en local)

---

## 🚀 Options de Démarrage

Deux approches de démarrage s'offrent à vous selon votre objectif (production/démonstration ou développement actif).

### Option A : Tout-en-un avec Docker (Recommandé & Automatisé) 🐳

Cette méthode lance **l'intégralité de la plateforme** (infrastructure, base de données, backend, frontend, simulateurs et traitement Spark) avec une seule commande. L'ordre de démarrage et la création des topics Kafka sont entièrement gérés et automatisés par Docker Compose.

```bash
# 1. Ajuster les permissions pour Linux (évite les erreurs de droits sur les volumes)
chmod -R 777 ./node-red ./data_lake ./spark/checkpoints

# 2. Lancer l'ensemble des services en arrière-plan
docker compose up -d

# 3. Vérifier le bon fonctionnement des conteneurs
docker compose ps
```

#### Accès aux services :
- 🖥️ **Dashboard Frontend** : [http://localhost:3000](http://localhost:3000)
- 🔌 **API Backend** : [http://localhost:4000/api/health](http://localhost:4000/api/health)
- ⚙️ **Interface Node-RED** (simulateurs) : [http://localhost:1880](http://localhost:1880)

---

### Option B : Approche Hybride (Développement Local) 💻

Idéale pour modifier le code du frontend, du backend ou des scripts Spark avec rechargement à chaud (*live-reload*), sans avoir à reconstruire les images Docker.

#### 1. Démarrer uniquement l'infrastructure (Zookeeper, Kafka, MongoDB)
Nous lançons uniquement les briques de stockage et de messagerie dans Docker :
```bash
docker compose up -d zookeeper kafka kafka-init mongodb
```
*Note : Le conteneur éphémère `kafka-init` se chargera de créer automatiquement les topics Kafka.*

#### 2. Démarrer Node-RED en local
```bash
# Installer Node-RED globalement si ce n'est pas déjà fait
npm install -g --unsafe-perm node-red
# Démarrer Node-RED
node-red
```
*Importez ensuite les flux présents dans `./node-red/flows.json`.*

#### 3. Démarrer le Backend en local
```bash
cd backend
npm install
npm run dev # ou node server.js
```

#### 4. Démarrer le Frontend en local
```bash
cd frontend
npm install
npm run dev
```

#### 5. Exécuter les jobs Spark en local
Installez d'abord les dépendances Python nécessaires :
```bash
pip install -r requirements.txt
```
Lancez ensuite le script d'initialisation et d'exécution Spark :
```bash
cd spark
./run_spark.sh
```

---

## 📊 Topics Kafka Utilisés

Les topics suivants sont automatiquement créés au démarrage :
*   `smartcity.environment.readings` (capteurs d'environnement, 3 partitions)
*   `smartcity.water.readings` (capteurs d'eau)
*   `smartcity.traffic.readings` (capteurs de trafic)
*   `smartcity.spark.environment` (données environnementales traitées par Spark)
*   `smartcity.spark.water` (données d'eau traitées par Spark)
*   `smartcity.spark.traffic` (données de trafic traitées par Spark)
*   `smartcity.spark.errors` (erreurs détectées)
*   `smartcity.spark.alerts` (alertes générées par Spark)

---

## 🧹 Nettoyage de l'Environnement

Pour éteindre tous les services Docker et nettoyer les volumes de stockage associés :
```bash
docker compose down -v
```

---

## 📝 Licence

Copyright 2026 Echarkaouy Ayyoub, Ghazi Zakaria, Ahouir Mohamed.

Ce projet est distribué sous la licence Apache 2.0.
