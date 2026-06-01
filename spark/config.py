import os
from pathlib import Path


# Configuration Kafka et Spark

def env(name: str, default: str) -> str:
    return os.getenv(name, default)


def env_float(name: str, default: float) -> float:
    return float(os.getenv(name, default))


def env_bool(name: str, default: bool) -> bool:
    value = os.getenv(name)
    if value is None:
        return default
    return value.strip().lower() in {"1", "true", "yes", "on"}


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
    "TRAFFIC": env("SPARK_TOPIC_TRAFFIC", "smartcity.spark.traffic"),
    "ERRORS": env("SPARK_TOPIC_ERRORS", "smartcity.spark.errors"),
    "ALERTS": env("SPARK_TOPIC_ALERTS", "smartcity.spark.alerts")
}

# Configuration du Watermarking (pour gérer les données en retard)
WATERMARK_DELAY = env("WATERMARK_DELAY", "5 minutes")

# Fenêtre d'agrégation (ex: moyenne sur les 2 dernières minutes, mise à jour chaque minute)
WINDOW_DURATION = env("WINDOW_DURATION", "2 minutes")
SLIDING_INTERVAL = env("SLIDING_INTERVAL", "1 minute")

# Répertoire persistant pour les checkpoints Spark Streaming
CHECKPOINT_BASE_DIR = env("SPARK_CHECKPOINT_BASE_DIR", str(BASE_DIR / "checkpoints"))
CHECKPOINT_VERSION = env("SPARK_CHECKPOINT_VERSION", "v3")
CHECKPOINT_DIR = Path(CHECKPOINT_BASE_DIR) / CHECKPOINT_VERSION

CHECKPOINT_PATHS = {
    "ENVIRONMENT": str(CHECKPOINT_DIR / "environment"),
    "WATER": str(CHECKPOINT_DIR / "water"),
    "TRAFFIC": str(CHECKPOINT_DIR / "traffic"),
    "ENVIRONMENT_ERRORS": str(CHECKPOINT_DIR / "environment-errors"),
    "WATER_ERRORS": str(CHECKPOINT_DIR / "water-errors"),
    "TRAFFIC_ERRORS": str(CHECKPOINT_DIR / "traffic-errors"),
    "ENVIRONMENT_ALERTS": str(CHECKPOINT_DIR / "environment-alerts"),
    "WATER_ALERTS": str(CHECKPOINT_DIR / "water-alerts"),
    "TRAFFIC_ALERTS": str(CHECKPOINT_DIR / "traffic-alerts")
}

# Data lake local pour conserver les donnees brutes et nettoyees.
DATA_LAKE_ENABLED = env_bool("DATA_LAKE_ENABLED", True)
DATA_LAKE_BASE_DIR = Path(env("DATA_LAKE_BASE_DIR", str(BASE_DIR.parent / "data_lake")))

DATA_LAKE_PATHS = {
    "BRONZE_ENVIRONMENT": str(DATA_LAKE_BASE_DIR / "bronze" / "environment"),
    "BRONZE_WATER": str(DATA_LAKE_BASE_DIR / "bronze" / "water"),
    "BRONZE_TRAFFIC": str(DATA_LAKE_BASE_DIR / "bronze" / "traffic"),
    "SILVER_ENVIRONMENT": str(DATA_LAKE_BASE_DIR / "silver" / "environment"),
    "SILVER_WATER": str(DATA_LAKE_BASE_DIR / "silver" / "water"),
    "SILVER_TRAFFIC": str(DATA_LAKE_BASE_DIR / "silver" / "traffic")
}

DATA_LAKE_CHECKPOINT_PATHS = {
    "BRONZE_ENVIRONMENT": str(CHECKPOINT_DIR / "data-lake" / "bronze-environment"),
    "BRONZE_WATER": str(CHECKPOINT_DIR / "data-lake" / "bronze-water"),
    "BRONZE_TRAFFIC": str(CHECKPOINT_DIR / "data-lake" / "bronze-traffic"),
    "SILVER_ENVIRONMENT": str(CHECKPOINT_DIR / "data-lake" / "silver-environment"),
    "SILVER_WATER": str(CHECKPOINT_DIR / "data-lake" / "silver-water"),
    "SILVER_TRAFFIC": str(CHECKPOINT_DIR / "data-lake" / "silver-traffic")
}

# Seuils des alertes Spark
AIR_QUALITY_ALERT_THRESHOLD = env_float("AIR_QUALITY_ALERT_THRESHOLD", 150.0)
CONGESTION_ALERT_THRESHOLD = env_float("CONGESTION_ALERT_THRESHOLD", 0.75)
WATER_PH_MIN = env_float("WATER_PH_MIN", 6.5)
WATER_PH_MAX = env_float("WATER_PH_MAX", 8.5)
WATER_TURBIDITY_ALERT_THRESHOLD = env_float("WATER_TURBIDITY_ALERT_THRESHOLD", 5.0)
WATER_FLOW_DROP_THRESHOLD = env_float("WATER_FLOW_DROP_THRESHOLD", 10.0)
TEMPERATURE_TREND_THRESHOLD = env_float("TEMPERATURE_TREND_THRESHOLD", 1.0)
