from pyspark.sql.types import StructType, StructField, StringType, DoubleType, TimestampType, ArrayType
from pyspark.sql.functions import from_json, col, window, avg, explode
from utils.kafka_helpers import create_kafka_stream, write_stream_to_kafka
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
    
    array_schema = ArrayType(element_schema)

    df = create_kafka_stream(spark, config.TOPICS["WATER"], config.KAFKA_BOOTSTRAP_SERVERS)

    parsed_df = df.selectExpr("CAST(value AS STRING)") \
        .select(from_json(col("value"), array_schema).alias("data")) \
        .select(explode(col("data")).alias("reading")) \
        .select("reading.*")

    # Aplatir les champs imbriqués
    flat_df = parsed_df \
        .withColumn("flow_rate", col("water_flow.flow_rate_l_min")) \
        .withColumn("ph", col("water_quality.ph")) \
        .withColumn("turbidity", col("water_quality.turbidity"))

    # Agréger par quartier
    aggregated_df = flat_df \
        .withWatermark("timestamp", config.WATERMARK_DELAY) \
        .groupBy(
            window(col("timestamp"), config.WINDOW_DURATION, config.SLIDING_INTERVAL),
            col("district")
        ) \
        .agg(
            avg("flow_rate").alias("avg_flow_rate"),
            avg("ph").alias("avg_ph"),
            avg("turbidity").alias("avg_turbidity")
        )

    checkpoint_path = config.CHECKPOINT_PATHS["WATER"]
    return write_stream_to_kafka(
        aggregated_df, 
        config.SPARK_TOPICS["WATER"], 
        config.KAFKA_BOOTSTRAP_SERVERS, 
        checkpoint_path
    )
