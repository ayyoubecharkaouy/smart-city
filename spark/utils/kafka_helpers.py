from pyspark.sql import SparkSession
from pyspark.sql.functions import array, col, current_timestamp, explode, from_json, lit, to_date, when
from pyspark.sql.types import ArrayType

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

def create_raw_kafka_lake_stream(spark: SparkSession, topic_name: str, kafka_servers: str, source: str):
    """
    Prepare un flux brut Kafka pour la zone bronze du data lake.
    """
    return create_kafka_stream(spark, topic_name, kafka_servers) \
        .select(
            lit(source).alias("source"),
            col("topic"),
            col("partition"),
            col("offset"),
            col("timestamp").alias("kafka_timestamp"),
            col("key").cast("string").alias("key"),
            col("value").cast("string").alias("raw_value"),
            current_timestamp().alias("ingested_at")
        ) \
        .withColumn("event_date", to_date(col("kafka_timestamp")))

def parse_kafka_json_records(df, element_schema, stream_name: str):
    """
    Parse les messages Kafka en objet JSON ou tableau JSON et sépare les messages invalides.
    """
    array_schema = ArrayType(element_schema)

    parsed = df.selectExpr("CAST(value AS STRING) AS raw_value") \
        .withColumn("array_data", from_json(col("raw_value"), array_schema)) \
        .withColumn("object_data", from_json(col("raw_value"), element_schema)) \
        .withColumn(
            "data",
            when(col("array_data").isNotNull(), col("array_data"))
            .when(col("object_data").isNotNull(), array(col("object_data")))
        )

    valid_df = parsed \
        .filter(col("data").isNotNull()) \
        .select(explode(col("data")).alias("reading")) \
        .select("reading.*")

    invalid_df = parsed \
        .filter(col("raw_value").isNotNull() & col("data").isNull()) \
        .select(
            lit(stream_name).alias("stream"),
            lit("invalid_json").alias("error_reason"),
            col("raw_value"),
            current_timestamp().alias("processed_at")
        )

    return valid_df, invalid_df

def parse_kafka_json_array(df, element_schema, stream_name: str):
    return parse_kafka_json_records(df, element_schema, stream_name)

def create_validated_kafka_json_stream(
    spark: SparkSession,
    input_topic: str,
    kafka_servers: str,
    element_schema,
    stream_name: str,
    error_topic: str,
    error_checkpoint_dir: str,
    error_query_name: str
):
    """
    Lit un topic Kafka, parse les messages JSON et publie les erreurs de parsing.
    """
    df = create_kafka_stream(spark, input_topic, kafka_servers)
    parsed_df, invalid_df = parse_kafka_json_records(df, element_schema, stream_name)

    write_stream_to_kafka(
        invalid_df,
        error_topic,
        kafka_servers,
        error_checkpoint_dir,
        output_mode="append",
        query_name=error_query_name
    )

    return parsed_df

def with_event_time_watermark(df, timestamp_col: str, delay: str):
    return df.withWatermark(timestamp_col, delay)

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

def write_stream_to_parquet(
    df,
    output_path: str,
    checkpoint_dir: str,
    output_mode: str = "append",
    query_name: str = None,
    partition_by: list = None
):
    """
    Ecrit un flux Spark dans le data lake local au format Parquet.
    """
    writer = df \
        .writeStream \
        .format("parquet") \
        .option("path", output_path) \
        .option("checkpointLocation", checkpoint_dir) \
        .outputMode(output_mode)

    if query_name:
        writer = writer.queryName(query_name)

    if partition_by:
        writer = writer.partitionBy(*partition_by)

    return writer.start()

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

    final_query_name = query_name or topic_name.replace(".", "_")

    return kafka_df \
        .writeStream \
        .format("kafka") \
        .option("kafka.bootstrap.servers", kafka_servers) \
        .option("topic", topic_name) \
        .option("checkpointLocation", checkpoint_dir) \
        .outputMode(output_mode) \
        .queryName(final_query_name) \
        .start()
