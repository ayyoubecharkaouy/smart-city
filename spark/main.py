from pyspark.sql import SparkSession
import logging

from streams.environment_stream import process_environment_stream
from streams.traffic_stream import process_traffic_stream
from streams.water_stream import process_water_stream

def main():
    # 1. Initialiser la session Spark
    spark = SparkSession.builder \
        .appName("SmartCityStreaming") \
        .config("spark.sql.adaptive.enabled", "false") \
        .getOrCreate()
        
    spark.sparkContext.setLogLevel("WARN")

    logging.warning("=== Lancement des traitements Spark Streaming ===")

    # 2. Lancer chaque flux séparément
    query_env = process_environment_stream(spark)
    query_traffic = process_traffic_stream(spark)
    query_water = process_water_stream(spark)

    # 3. Attendre la fin des flux (tourne en continu)
    spark.streams.awaitAnyTermination()

if __name__ == "__main__":
    main()
