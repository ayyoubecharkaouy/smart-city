# Kafka

Ce dossier contient les fichiers liés à Kafka côté backend.

## Créer les topics

Lancez Kafka avec Docker, puis exécutez :

```bash
cd backend/kafka
chmod +x create-topics.sh
./create-topics.sh
```

Le script crée les topics nécessaires au projet, dont le topic des erreurs Spark :

```text
smartcity.spark.errors
```

Si votre conteneur Kafka n'a pas le nom par défaut `kafka-smartcity`, utilisez :

```bash
KAFKA_CONTAINER=nom_du_conteneur ./create-topics.sh
```
