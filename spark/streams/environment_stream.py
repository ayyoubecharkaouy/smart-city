from pyspark.sql.types import StructType, StructField, StringType, DoubleType, TimestampType
from pyspark.sql.functions import col, window, avg
from utils.kafka_helpers import create_kafka_stream, parse_kafka_json_records, write_stream_to_kafka
import config

def process_environment_stream(spark):
    # Schéma des données d'environnement
    element_schema = StructType([
        StructField("sensor_id", StringType(), True),
        StructField("district", StringType(), True),
        StructField("temperature", DoubleType(), True),
        StructField("air_quality", DoubleType(), True),
        StructField("timestamp", TimestampType(), True)
    ])
    
    # 1. Lire le flux Kafka
    df = create_kafka_stream(spark, config.TOPICS["ENVIRONMENT"], config.KAFKA_BOOTSTRAP_SERVERS)

    # 2. Convertir la valeur Kafka en String, puis parser un objet JSON ou un tableau JSON
    parsed_df, invalid_df = parse_kafka_json_records(df, element_schema, "environment")

    write_stream_to_kafka(
        invalid_df,
        config.SPARK_TOPICS["ERRORS"],
        config.KAFKA_BOOTSTRAP_SERVERS,
        config.CHECKPOINT_PATHS["ENVIRONMENT_ERRORS"],
        output_mode="append",
        query_name="environment_json_errors"
    )

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
        checkpoint_path,
        query_name="environment_aggregations"
    )
