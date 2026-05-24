from pyspark.sql.types import StructType, StructField, StringType, DoubleType, TimestampType, ArrayType
from pyspark.sql.functions import from_json, col, window, avg, explode
from utils.kafka_helpers import create_kafka_stream, write_stream_to_kafka
import config
import os

def process_environment_stream(spark):
    # Schéma des données d'environnement
    element_schema = StructType([
        StructField("sensor_id", StringType(), True),
        StructField("district", StringType(), True),
        StructField("temperature", DoubleType(), True),
        StructField("air_quality", DoubleType(), True),
        StructField("timestamp", TimestampType(), True)
    ])
    
    # Puisque les données Kafka peuvent être un tableau d'objets ou un seul objet, 
    # on suppose ici un tableau JSON
    array_schema = ArrayType(element_schema)

    # 1. Lire le flux Kafka
    df = create_kafka_stream(spark, config.TOPICS["ENVIRONMENT"], config.KAFKA_BOOTSTRAP_SERVERS)

    # 2. Convertir la valeur binaire Kafka en String, puis parser le JSON et "éclater" le tableau
    parsed_df = df.selectExpr("CAST(value AS STRING)") \
        .select(from_json(col("value"), array_schema).alias("data")) \
        .select(explode(col("data")).alias("reading")) \
        .select("reading.*")

    # 3. Traitement : Calculer la température et qualité de l'air moyenne par quartier sur une fenêtre temporelle
    # watermark permet de gérer les données arrivant en retard
    aggregated_df = parsed_df \
        .withWatermark("timestamp", config.WATERMARK_DELAY) \
        .groupBy(
            window(col("timestamp"), config.WINDOW_DURATION, config.SLIDING_INTERVAL),
            col("district")
        ) \
        .agg(
            avg("temperature").alias("avg_temperature"),
            avg("air_quality").alias("avg_air_quality")
        )

    # 4. Envoyer le résultat à Kafka
    checkpoint_path = config.CHECKPOINT_PATHS["ENVIRONMENT"]
    return write_stream_to_kafka(
        aggregated_df, 
        config.SPARK_TOPICS["ENVIRONMENT"], 
        config.KAFKA_BOOTSTRAP_SERVERS, 
        checkpoint_path
    )
