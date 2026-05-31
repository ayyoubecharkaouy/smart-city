# Smart City

Ce projet contient plusieurs parties :

- Kafka
- Node-RED
- Backend Node.js
- Frontend Next.js
- Spark

## Ordre de démarrage du projet

Avant de commencer, il faut installer et démarrer **Kafka**.

Il est recommandé d’utiliser **Docker** pour installer et lancer Kafka plus facilement.

## 1. Démarrer Kafka

Démarrez Kafka avant Node-RED, car Node-RED utilise Kafka pour communiquer avec les autres services.

Si vous utilisez Docker, lancez Kafka avec votre fichier `docker-compose.yml` :

```bash
docker compose up -d
```

ou, selon votre version de Docker :

```bash
docker-compose up -d
```
## Création des topics Kafka

Créez tous les topics Kafka nécessaires avec le script du projet :

```bash
cd backend/kafka
./create-topics.sh
```

Le script crée les topics d'entrée et les topics produits par Spark :

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

## 2. Démarrer Node-RED

Après le démarrage de Kafka, lancez Node-RED :

```bash
node-red
```

Puis ouvrez l’interface dans le navigateur :

```text
http://127.0.0.1:1880/
```

(suirve README.md | node-red/README.md)

## 3. Démarrer le backend
(suirve README.md | backend/README.md)

## 4. Démarrer Spark
(suirve README.md | spark/README.md)

## 4. Démarrer le frontend
(suirve README.md | frontend/README.md)

## Résumé

L’ordre recommandé est le suivant :

```text
1. Démarrer Kafka
2. Démarrer Node-RED
3. Démarrer le backend
4. Démarrer le frontend
5. Démarrer Spark
```
## License

Copyright 2026 Echarkaouy Ayyoub, Ghazi Zakaria, Ahouir Mohamed.

This software is distributed under the Apache License 2.0. See the LICENSE file for more information.
