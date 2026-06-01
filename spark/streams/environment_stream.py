from pyspark.sql.types import StructType, StructField, StringType, DoubleType, TimestampType
from pyspark.sql.functions import avg, col, current_timestamp, lit, max as spark_max, max_by, min as spark_min, min_by, to_date, when, window
from utils.kafka_helpers import create_raw_kafka_lake_stream, create_validated_kafka_json_stream, with_event_time_watermark, write_stream_to_kafka, write_stream_to_parquet
import config

def process_environment_stream(spark):
    air_quality_schema = StructType([
        StructField("aqi", DoubleType(), True),
        StructField("status", StringType(), True),
        StructField("main_pollutant", StringType(), True),
        StructField("pm25", DoubleType(), True),
        StructField("pm10", DoubleType(), True),
        StructField("no2", DoubleType(), True),
        StructField("co", DoubleType(), True),
        StructField("o3", DoubleType(), True)
    ])

    # Schéma des données d'environnement
    element_schema = StructType([
        StructField("sensor_id", StringType(), True),
        StructField("district", StringType(), True),
        StructField("temperature", DoubleType(), True),
        StructField("air_quality", air_quality_schema, True),
        StructField("timestamp", TimestampType(), True)
    ])

    if config.DATA_LAKE_ENABLED:
        bronze_df = create_raw_kafka_lake_stream(
            spark,
            config.TOPICS["ENVIRONMENT"],
            config.KAFKA_BOOTSTRAP_SERVERS,
            "environment"
        )
        write_stream_to_parquet(
            bronze_df,
            config.DATA_LAKE_PATHS["BRONZE_ENVIRONMENT"],
            config.DATA_LAKE_CHECKPOINT_PATHS["BRONZE_ENVIRONMENT"],
            query_name="environment_bronze_lake",
            partition_by=["event_date"]
        )
    
    parsed_df = create_validated_kafka_json_stream(
        spark,
        config.TOPICS["ENVIRONMENT"],
        config.KAFKA_BOOTSTRAP_SERVERS,
        element_schema,
        "environment",
        config.SPARK_TOPICS["ERRORS"],
        config.CHECKPOINT_PATHS["ENVIRONMENT_ERRORS"],
        "environment_errors_stream"
    )

    if config.DATA_LAKE_ENABLED:
        silver_df = parsed_df \
            .withColumn("processed_at", current_timestamp()) \
            .withColumn("event_date", to_date(col("timestamp")))
        write_stream_to_parquet(
            silver_df,
            config.DATA_LAKE_PATHS["SILVER_ENVIRONMENT"],
            config.DATA_LAKE_CHECKPOINT_PATHS["SILVER_ENVIRONMENT"],
            query_name="environment_silver_lake",
            partition_by=["event_date"]
        )

    enriched_df = parsed_df \
        .withColumn("air_quality_value", col("air_quality.aqi"))

    alert_df = enriched_df \
        .filter(col("air_quality_value") > config.AIR_QUALITY_ALERT_THRESHOLD) \
        .select(
            lit("environment").alias("type"),
            lit("high_air_quality").alias("alert_type"),
            lit("warning").alias("severity"),
            col("sensor_id"),
            col("district"),
            col("air_quality_value").alias("value"),
            lit(">").alias("operator"),
            lit(config.AIR_QUALITY_ALERT_THRESHOLD).alias("threshold"),
            col("timestamp"),
            current_timestamp().alias("processed_at")
        )

    write_stream_to_kafka(
        alert_df,
        config.SPARK_TOPICS["ALERTS"],
        config.KAFKA_BOOTSTRAP_SERVERS,
        config.CHECKPOINT_PATHS["ENVIRONMENT_ALERTS"],
        output_mode="append",
        query_name="environment_alerts_stream"
    )

    # 3. Traitement : Calculer la température et qualité de l'air moyenne par quartier sur une fenêtre temporelle
    # watermark permet de gérer les données arrivant en retard
    aggregated_df = with_event_time_watermark(enriched_df, "timestamp", config.WATERMARK_DELAY) \
        .groupBy(
            window(col("timestamp"), config.WINDOW_DURATION, config.SLIDING_INTERVAL),
            col("district")
        ) \
        .agg(
            avg("temperature").alias("avg_temperature"),
            spark_min("temperature").alias("min_temperature"),
            spark_max("temperature").alias("max_temperature"),
            avg("air_quality_value").alias("avg_air_quality"),
            spark_max("air_quality_value").alias("max_air_quality"),
            min_by(col("temperature"), col("timestamp")).alias("first_temperature"),
            max_by(col("temperature"), col("timestamp")).alias("last_temperature")
        ) \
        .withColumn("temperature_delta", col("last_temperature") - col("first_temperature")) \
        .withColumn(
            "temperature_trend",
            when(col("temperature_delta") > config.TEMPERATURE_TREND_THRESHOLD, lit("warming"))
            .when(col("temperature_delta") < -config.TEMPERATURE_TREND_THRESHOLD, lit("cooling"))
            .otherwise(lit("stable"))
        ) \
        .withColumn("processed_at", current_timestamp())

    # 4. Envoyer le résultat à Kafka
    checkpoint_path = config.CHECKPOINT_PATHS["ENVIRONMENT"]
    return write_stream_to_kafka(
        aggregated_df, 
        config.SPARK_TOPICS["ENVIRONMENT"], 
        config.KAFKA_BOOTSTRAP_SERVERS, 
        checkpoint_path,
        query_name="environment_stream"
    )
