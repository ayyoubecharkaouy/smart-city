# Smart City | Spark Streaming

Ce dossier contient les traitements Spark Structured Streaming du projet Smart City.

## Prerequis

- Java compatible avec votre version de Spark
- Apache Spark installe et disponible via `spark-submit`
- Python avec PySpark
- Kafka demarre avant Spark
- Topics Kafka crees avec le script du projet

Installation Python :

```bash
cd spark
pip install -r requirements.txt
```

Creation des topics Kafka :

```bash
cd ../backend/kafka
./create-topics.sh
```

## Lancement

Depuis le dossier `spark` :

```bash
./run_spark.sh
```

Commande equivalente :

```bash
spark-submit \
  --packages org.apache.spark:spark-sql-kafka-0-10_2.12:3.5.1 \
  main.py
```

## Topics Kafka

Topics lus par Spark :

```text
smartcity.environment.readings
smartcity.water.readings
smartcity.traffic.readings
```

Topics produits par Spark :

```text
smartcity.spark.environment
smartcity.spark.water
smartcity.spark.traffic
smartcity.spark.errors
smartcity.spark.alerts
```

## Configuration

Les valeurs par defaut sont dans `config.py`. Elles peuvent etre surchargees avec des variables d'environnement :

```bash
KAFKA_BOOTSTRAP_SERVERS=localhost:9092
WINDOW_DURATION="2 minutes"
SLIDING_INTERVAL="1 minute"
WATERMARK_DELAY="5 minutes"
SPARK_CHECKPOINT_VERSION=v3
DATA_LAKE_ENABLED=true
DATA_LAKE_BASE_DIR="../data_lake"
```

Seuils d'alertes :

```bash
AIR_QUALITY_ALERT_THRESHOLD=150
CONGESTION_ALERT_THRESHOLD=0.75
WATER_PH_MIN=6.5
WATER_PH_MAX=8.5
WATER_TURBIDITY_ALERT_THRESHOLD=5
WATER_FLOW_DROP_THRESHOLD=10
TEMPERATURE_TREND_THRESHOLD=1
```

Si vous modifiez les agregations Spark, utilisez une nouvelle version de checkpoint :

```bash
SPARK_CHECKPOINT_VERSION=v3 ./run_spark.sh
```

## Formats JSON attendus

Spark accepte un objet JSON simple ou un tableau JSON.

### Environnement

```json
{
  "sensor_id": "env-001",
  "district": "Centre",
  "temperature": 28.5,
  "air_quality": 82.0,
  "timestamp": "2026-05-24T23:50:00Z"
}
```

### Trafic

```json
{
  "sensor_id": "traffic-001",
  "route_id": "R-101",
  "average_speed_kmh": 42.5,
  "congestion_index": 0.62,
  "vehicle_count": 120,
  "timestamp": "2026-05-24T23:50:00Z"
}
```

### Eau

```json
{
  "sensor_id": "water-001",
  "district": "Centre",
  "water_flow": {
    "flow_rate_l_min": 18.2
  },
  "water_quality": {
    "ph": 7.2,
    "turbidity": 2.1
  },
  "timestamp": "2026-05-24T23:50:00Z"
}
```

Exemple de tableau JSON :

```json
[
  {
    "sensor_id": "env-001",
    "district": "Centre",
    "temperature": 28.5,
    "air_quality": 82.0,
    "timestamp": "2026-05-24T23:50:00Z"
  },
  {
    "sensor_id": "env-002",
    "district": "Sidi Bouzid",
    "temperature": 26.9,
    "air_quality": 95.0,
    "timestamp": "2026-05-24T23:50:05Z"
  }
]
```

## Resultats produits

Les messages produits par Spark contiennent notamment :

- `window.start` et `window.end`
- les metriques agregees
- `processed_at`, l'heure de traitement Spark

Les messages JSON invalides sont envoyes vers :

```text
smartcity.spark.errors
```

Les alertes metier sont envoyees vers :

```text
smartcity.spark.alerts
```

## Data lake local

Les jobs Spark ecrivent aussi les flux dans un data lake local au format Parquet.
Par defaut, les fichiers sont crees dans :

```text
Platform/smart-city/data_lake/
```

Structure :

```text
data_lake/
  bronze/
    environment/
    water/
    traffic/
  silver/
    environment/
    water/
    traffic/
```

- `bronze` conserve les messages Kafka bruts avec topic, partition, offset et valeur JSON originale.
- `silver` conserve les donnees JSON parsees et validees par Spark.

Les dossiers sont partitionnes par `event_date` pour faciliter les analyses historiques.
Vous pouvez desactiver cette ecriture avec :

```bash
DATA_LAKE_ENABLED=false ./run_spark.sh
```

Ou choisir un autre emplacement :

```bash
DATA_LAKE_BASE_DIR=/chemin/vers/data_lake ./run_spark.sh
```
