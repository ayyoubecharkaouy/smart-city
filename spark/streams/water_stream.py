from pyspark.sql.types import StructType, StructField, StringType, DoubleType, TimestampType
from pyspark.sql.functions import abs as spark_abs, avg, col, current_timestamp, greatest, least, lit, max_by, min_by, sum as spark_sum, when, window
from utils.kafka_helpers import create_kafka_stream, parse_kafka_json_records, write_stream_to_kafka
import config

def process_water_stream(spark):
    # Schéma imbriqué pour le débit
    flow_schema = StructType([
        StructField("flow_rate_l_min", DoubleType(), True)
    ])
    
    # Schéma imbriqué pour la qualité
    quality_schema = StructType([
        StructField("ph", DoubleType(), True),
        StructField("turbidity", DoubleType(), True)
    ])

    # Schéma principal
    element_schema = StructType([
        StructField("sensor_id", StringType(), True),
        StructField("district", StringType(), True),
        StructField("water_flow", flow_schema, True),
        StructField("water_quality", quality_schema, True),
        StructField("timestamp", TimestampType(), True)
    ])
    
    df = create_kafka_stream(spark, config.TOPICS["WATER"], config.KAFKA_BOOTSTRAP_SERVERS)

    parsed_df, invalid_df = parse_kafka_json_records(df, element_schema, "water")

    write_stream_to_kafka(
        invalid_df,
        config.SPARK_TOPICS["ERRORS"],
        config.KAFKA_BOOTSTRAP_SERVERS,
        config.CHECKPOINT_PATHS["WATER_ERRORS"],
        output_mode="append",
        query_name="water_errors_stream"
    )

    # Aplatir les champs imbriqués
    flat_df = parsed_df \
        .withColumn("flow_rate", col("water_flow.flow_rate_l_min")) \
        .withColumn("ph", col("water_quality.ph")) \
        .withColumn("turbidity", col("water_quality.turbidity"))

    alert_df = flat_df \
        .filter(
            (col("ph") < config.WATER_PH_MIN) |
            (col("ph") > config.WATER_PH_MAX) |
            (col("turbidity") > config.WATER_TURBIDITY_ALERT_THRESHOLD)
        ) \
        .withColumn(
            "alert_type",
            when((col("ph") < config.WATER_PH_MIN) | (col("ph") > config.WATER_PH_MAX), lit("abnormal_ph"))
            .otherwise(lit("high_turbidity"))
        ) \
        .withColumn(
            "value",
            when((col("ph") < config.WATER_PH_MIN) | (col("ph") > config.WATER_PH_MAX), col("ph"))
            .otherwise(col("turbidity"))
        ) \
        .withColumn(
            "threshold",
            when(col("ph") < config.WATER_PH_MIN, lit(config.WATER_PH_MIN))
            .when(col("ph") > config.WATER_PH_MAX, lit(config.WATER_PH_MAX))
            .otherwise(lit(config.WATER_TURBIDITY_ALERT_THRESHOLD))
        ) \
        .withColumn(
            "operator",
            when(col("ph") < config.WATER_PH_MIN, lit("<"))
            .otherwise(lit(">"))
        ) \
        .select(
            lit("water").alias("type"),
            col("alert_type"),
            lit("warning").alias("severity"),
            col("sensor_id"),
            col("district"),
            col("value"),
            col("operator"),
            col("threshold"),
            col("timestamp"),
            current_timestamp().alias("processed_at")
        )

    write_stream_to_kafka(
        alert_df,
        config.SPARK_TOPICS["ALERTS"],
        config.KAFKA_BOOTSTRAP_SERVERS,
        config.CHECKPOINT_PATHS["WATER_ALERTS"],
        output_mode="append",
        query_name="water_alerts_stream"
    )

    # Agréger par quartier
    aggregated_df = flat_df \
        .withWatermark("timestamp", config.WATERMARK_DELAY) \
        .groupBy(
            window(col("timestamp"), config.WINDOW_DURATION, config.SLIDING_INTERVAL),
            col("district")
        ) \
        .agg(
            avg("flow_rate").alias("avg_flow_rate"),
            spark_sum("flow_rate").alias("total_flow_rate"),
            avg("ph").alias("avg_ph"),
            avg("turbidity").alias("avg_turbidity"),
            min_by(col("flow_rate"), col("timestamp")).alias("first_flow_rate"),
            max_by(col("flow_rate"), col("timestamp")).alias("last_flow_rate")
        ) \
        .withColumn("flow_drop", col("first_flow_rate") - col("last_flow_rate")) \
        .withColumn("sudden_flow_drop", col("flow_drop") > config.WATER_FLOW_DROP_THRESHOLD) \
        .withColumn(
            "water_quality_score",
            least(
                lit(100.0),
                greatest(
                    lit(0.0),
                    lit(100.0)
                    - (spark_abs(col("avg_ph") - lit(7.0)) * lit(12.0))
                    - (col("avg_turbidity") * lit(6.0))
                )
            )
        )

    checkpoint_path = config.CHECKPOINT_PATHS["WATER"]
    return write_stream_to_kafka(
        aggregated_df, 
        config.SPARK_TOPICS["WATER"], 
        config.KAFKA_BOOTSTRAP_SERVERS, 
        checkpoint_path,
        query_name="water_stream"
    )
