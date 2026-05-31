# Smart City

Plateforme Big Data & IoT pour une ville intelligente. Le dépôt contient plusieurs composants qui interagissent via Kafka :

- Kafka
- Node-RED (flux et simulateurs de capteurs)
- Backend (Node.js + Socket.IO)
- Frontend (Next.js)
- Spark (jobs de streaming et d'agrégation)

## Prérequis

- Docker (recommandé pour Kafka)
- Node.js (pour le backend et le frontend)
- Python 3.11+ et `pip` (pour les jobs Spark)

Installez les dépendances Python nécessaires pour les jobs Spark :

```bash
pip install -r requirements.txt
```

## Ordre recommandé de démarrage

1. Démarrer Kafka
	- Si vous utilisez Docker :

	```bash
	docker compose up -d
	# ou, selon votre version:
	docker-compose up -d
	```

2. Créer les topics Kafka

```bash
cd backend/kafka
./create-topics.sh
```

Les topics créés incluent notamment :

```text
smartcity.environment.readings
smartcity.water.readings
smartcity.traffic.readings
smartcity.spark.environment
smartcity.spark.water
smartcity.spark.traffic
smartcity.spark.errors
smartcity.spark.alerts
```

3. Démarrer Node-RED

```bash
node-red
```

Ouvrez ensuite l'interface :

```text
http://127.0.0.1:1880/
```

Voir les détails et les flows : [node-red/README.md](node-red/README.md)

4. Démarrer le backend

```bash
node server.js
```

Voir les instructions spécifiques : [backend/README.md](backend/README.md)

5. Démarrer le frontend

```bash
cd frontend
npm install
npm run dev
```

Voir les détails : [frontend/README.md](frontend/README.md)

6. (Optionnel) Démarrer les jobs Spark

```bash
cd spark
./run_spark.sh
```

Voir la documentation Spark : [spark/README.md](spark/README.md)

## Résumé de l'ordre

1. Kafka
2. Node-RED
3. Backend
4. Frontend
5. Spark

## Licence

Copyright 2026 Echarkaouy Ayyoub, Ghazi Zakaria, Ahouir Mohamed.

Ce projet est distribué sous la licence Apache 2.0.
