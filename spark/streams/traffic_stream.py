from pyspark.sql.types import StructType, StructField, StringType, DoubleType, IntegerType, TimestampType, ArrayType
from pyspark.sql.functions import from_json, col, window, avg, max, explode
from utils.kafka_helpers import create_kafka_stream, write_stream_to_kafka
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
    
    array_schema = ArrayType(element_schema)

    df = create_kafka_stream(spark, config.TOPICS["TRAFFIC"], config.KAFKA_BOOTSTRAP_SERVERS)

    parsed_df = df.selectExpr("CAST(value AS STRING)") \
        .select(from_json(col("value"), array_schema).alias("data")) \
        .select(explode(col("data")).alias("reading")) \
        .select("reading.*")

    # Calculer la vitesse moyenne et la congestion max par route sur une fenêtre
    aggregated_df = parsed_df \
        .withWatermark("timestamp", config.WATERMARK_DELAY) \
        .groupBy(
            window(col("timestamp"), config.WINDOW_DURATION, config.SLIDING_INTERVAL),
            col("route_id")
        ) \
        .agg(
            avg("average_speed_kmh").alias("avg_speed"),
            max("congestion_index").alias("max_congestion")
        )

    checkpoint_path = config.CHECKPOINT_PATHS["TRAFFIC"]
    return write_stream_to_kafka(
        aggregated_df, 
        config.SPARK_TOPICS["TRAFFIC"], 
        config.KAFKA_BOOTSTRAP_SERVERS, 
        checkpoint_path
    )
