# Smart City

Ce projet contient plusieurs parties :

- Kafka
- Node-RED
- Backend Node.js
- Frontend Next.js

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
## Création du topic Kafka pour l' Environment

Créez un topic Kafka pour la eneverenement avec la commande suivante :

```bash
sudo docker exec -it kafka-smartcity /opt/kafka/bin/kafka-topics.sh \
  --create \
  --topic smartcity.environment.readings \
  --bootstrap-server localhost:9092 \
  --partitions 3 \
  --replication-factor 1
```

Remplacez `NOM_CONTENEUR_KAFKA` par le nom du conteneur Kafka obtenu avec la commande suivante :

```bash
docker ps
```

##  Création du topic Kafka pour la qaulite d'eau

Créez un topic Kafka pour la gestion d'eau avec la commande suivante :

```bash
sudo docker exec -it kafka-smartcity /opt/kafka/bin/kafka-topics.sh \
  --create \
  --topic smartcity.water.readings \
  --bootstrap-server localhost:9092 \
  --partitions 1 \
  --replication-factor 1
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

## 4. Démarrer le frontend
(suirve README.md | frontend/README.md)

## Résumé

L’ordre recommandé est le suivant :

```text
1. Démarrer Kafka
2. Démarrer Node-RED
3. Démarrer le backend
4. Démarrer le frontend
```
