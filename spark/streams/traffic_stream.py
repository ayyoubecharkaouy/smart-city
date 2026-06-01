from pyspark.sql.types import StructType, StructField, StringType, DoubleType, IntegerType, TimestampType
from pyspark.sql.functions import avg, col, current_timestamp, lit, max as spark_max, min as spark_min, to_date, when, window
from utils.kafka_helpers import create_raw_kafka_lake_stream, create_validated_kafka_json_stream, with_event_time_watermark, write_stream_to_kafka, write_stream_to_parquet
import config

def process_traffic_stream(spark):
    # Schéma des données de trafic
    element_schema = StructType([
        StructField("sensor_id", StringType(), True),
        StructField("route_id", StringType(), True),
        StructField("average_speed_kmh", DoubleType(), True),
        StructField("congestion_index", DoubleType(), True),
        StructField("vehicle_count", IntegerType(), True),
        StructField("timestamp", TimestampType(), True)
    ])

    if config.DATA_LAKE_ENABLED:
        bronze_df = create_raw_kafka_lake_stream(
            spark,
            config.TOPICS["TRAFFIC"],
            config.KAFKA_BOOTSTRAP_SERVERS,
            "traffic"
        )
        write_stream_to_parquet(
            bronze_df,
            config.DATA_LAKE_PATHS["BRONZE_TRAFFIC"],
            config.DATA_LAKE_CHECKPOINT_PATHS["BRONZE_TRAFFIC"],
            query_name="traffic_bronze_lake",
            partition_by=["event_date"]
        )
    
    parsed_df = create_validated_kafka_json_stream(
        spark,
        config.TOPICS["TRAFFIC"],
        config.KAFKA_BOOTSTRAP_SERVERS,
        element_schema,
        "traffic",
        config.SPARK_TOPICS["ERRORS"],
        config.CHECKPOINT_PATHS["TRAFFIC_ERRORS"],
        "traffic_errors_stream"
    )

    if config.DATA_LAKE_ENABLED:
        silver_df = parsed_df \
            .withColumn("processed_at", current_timestamp()) \
            .withColumn("event_date", to_date(col("timestamp")))
        write_stream_to_parquet(
            silver_df,
            config.DATA_LAKE_PATHS["SILVER_TRAFFIC"],
            config.DATA_LAKE_CHECKPOINT_PATHS["SILVER_TRAFFIC"],
            query_name="traffic_silver_lake",
            partition_by=["event_date"]
        )

    alert_df = parsed_df \
        .filter(col("congestion_index") > config.CONGESTION_ALERT_THRESHOLD) \
        .select(
            lit("traffic").alias("type"),
            lit("high_congestion").alias("alert_type"),
            lit("warning").alias("severity"),
            col("sensor_id"),
            col("route_id"),
            col("congestion_index").alias("value"),
            lit(">").alias("operator"),
            lit(config.CONGESTION_ALERT_THRESHOLD).alias("threshold"),
            col("timestamp"),
            current_timestamp().alias("processed_at")
        )

    write_stream_to_kafka(
        alert_df,
        config.SPARK_TOPICS["ALERTS"],
        config.KAFKA_BOOTSTRAP_SERVERS,
        config.CHECKPOINT_PATHS["TRAFFIC_ALERTS"],
        output_mode="append",
        query_name="traffic_alerts_stream"
    )

    # Calculer la vitesse moyenne et la congestion max par route sur une fenêtre
    aggregated_df = with_event_time_watermark(parsed_df, "timestamp", config.WATERMARK_DELAY) \
        .groupBy(
            window(col("timestamp"), config.WINDOW_DURATION, config.SLIDING_INTERVAL),
            col("route_id")
        ) \
        .agg(
            avg("average_speed_kmh").alias("avg_speed"),
            spark_min("average_speed_kmh").alias("min_speed"),
            avg("vehicle_count").alias("avg_vehicle_count"),
            spark_max("vehicle_count").alias("max_vehicle_count"),
            spark_max("congestion_index").alias("max_congestion")
        ) \
        .withColumn(
            "congestion_level",
            when(col("max_congestion") > config.CONGESTION_ALERT_THRESHOLD, lit("high"))
            .when(col("max_congestion") > config.CONGESTION_ALERT_THRESHOLD * 0.7, lit("medium"))
            .otherwise(lit("normal"))
        ) \
        .withColumn("is_congested_route", col("max_congestion") > config.CONGESTION_ALERT_THRESHOLD) \
        .withColumn("processed_at", current_timestamp())

    checkpoint_path = config.CHECKPOINT_PATHS["TRAFFIC"]
    return write_stream_to_kafka(
        aggregated_df, 
        config.SPARK_TOPICS["TRAFFIC"], 
        config.KAFKA_BOOTSTRAP_SERVERS, 
        checkpoint_path,
        query_name="traffic_stream"
    )
