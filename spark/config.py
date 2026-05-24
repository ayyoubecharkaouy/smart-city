import os
from pathlib import Path


# Configuration Kafka et Spark

def env(name: str, default: str) -> str:
    return os.getenv(name, default)


BASE_DIR = Path(__file__).resolve().parent

# Adresse du broker Kafka
KAFKA_BOOTSTRAP_SERVERS = env("KAFKA_BOOTSTRAP_SERVERS", "localhost:9092")

# Noms des topics d'entrée
TOPICS = {
    "ENVIRONMENT": env("KAFKA_TOPIC_ENVIRONMENT", "smartcity.environment.readings"),
    "WATER": env("KAFKA_TOPIC_WATER", "smartcity.water.readings"),
    "TRAFFIC": env("KAFKA_TOPIC_TRAFFIC", "smartcity.traffic.readings")
}

# Noms des topics de sortie (résultats Spark)
SPARK_TOPICS = {
    "ENVIRONMENT": env("SPARK_TOPIC_ENVIRONMENT", "smartcity.spark.environment"),
    "WATER": env("SPARK_TOPIC_WATER", "smartcity.spark.water"),
    "TRAFFIC": env("SPARK_TOPIC_TRAFFIC", "smartcity.spark.traffic")
}

# Configuration du Watermarking (pour gérer les données en retard)
WATERMARK_DELAY = env("WATERMARK_DELAY", "5 minutes")

# Fenêtre d'agrégation (ex: moyenne sur les 2 dernières minutes, mise à jour chaque minute)
WINDOW_DURATION = env("WINDOW_DURATION", "2 minutes")
SLIDING_INTERVAL = env("SLIDING_INTERVAL", "1 minute")

# Répertoire persistant pour les checkpoints Spark Streaming
CHECKPOINT_BASE_DIR = env("SPARK_CHECKPOINT_BASE_DIR", str(BASE_DIR / "checkpoints"))

CHECKPOINT_PATHS = {
    "ENVIRONMENT": str(Path(CHECKPOINT_BASE_DIR) / "environment"),
    "WATER": str(Path(CHECKPOINT_BASE_DIR) / "water"),
    "TRAFFIC": str(Path(CHECKPOINT_BASE_DIR) / "traffic")
}
