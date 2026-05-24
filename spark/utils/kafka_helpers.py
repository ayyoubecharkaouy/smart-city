from pyspark.sql import SparkSession
from pyspark.sql.functions import col, current_timestamp, explode, from_json, lit

def create_kafka_stream(spark: SparkSession, topic_name: str, kafka_servers: str):
    """
    Crée un flux de lecture Spark Streaming depuis un topic Kafka.
    """
    return spark \
        .readStream \
        .format("kafka") \
        .option("kafka.bootstrap.servers", kafka_servers) \
        .option("subscribe", topic_name) \
        .option("startingOffsets", "latest") \
        .load()

def parse_kafka_json_array(df, array_schema, stream_name: str):
    """
    Parse les messages Kafka en tableau JSON et sépare les messages invalides.
    """
    parsed = df.selectExpr("CAST(value AS STRING) AS raw_value") \
        .withColumn("data", from_json(col("raw_value"), array_schema))

    valid_df = parsed \
        .filter(col("data").isNotNull()) \
        .select(explode(col("data")).alias("reading")) \
        .select("reading.*")

    invalid_df = parsed \
        .filter(col("raw_value").isNotNull() & col("data").isNull()) \
        .select(
            lit(stream_name).alias("stream"),
            lit("invalid_json_array").alias("error_reason"),
            col("raw_value"),
            current_timestamp().alias("processed_at")
        )

    return valid_df, invalid_df

def write_stream_to_console(df, query_name: str):
    """
    Écrit le résultat d'un DataFrame agrégé dans la console.
    """
    return df \
        .writeStream \
        .outputMode("update") \
        .format("console") \
        .option("truncate", "false") \
        .queryName(query_name) \
        .start()

def write_stream_to_kafka(
    df,
    topic_name: str,
    kafka_servers: str,
    checkpoint_dir: str,
    output_mode: str = "update",
    query_name: str = None
):
    """
    Convertit le DataFrame en JSON et l'envoie vers un topic Kafka.
    """
    from pyspark.sql.functions import to_json, struct

    # Kafka attend une colonne "value" contenant le message en chaîne de caractères (JSON)
    kafka_df = df.select(to_json(struct("*")).alias("value"))

    writer = kafka_df \
        .writeStream \
        .format("kafka") \
        .option("kafka.bootstrap.servers", kafka_servers) \
        .option("topic", topic_name) \
        .option("checkpointLocation", checkpoint_dir) \
        .outputMode(output_mode)

    if query_name:
        writer = writer.queryName(query_name)

    return writer.start()
