FROM python:3.11-slim-bookworm

# Spark 3.5 supports Java 17. Bookworm is pinned because newer Debian releases
# no longer provide openjdk-17-jre-headless.
RUN apt-get update && apt-get install -y --no-install-recommends \
    openjdk-17-jre-headless \
    procps \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Set JAVA_HOME
ENV JAVA_HOME=/usr/lib/jvm/java-17-openjdk-amd64

WORKDIR /app

# Copy requirements and install
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Download the Kafka connector while building so Spark can start without
# contacting Maven repositories each time the container is recreated.
ARG SPARK_KAFKA_PACKAGE=org.apache.spark:spark-sql-kafka-0-10_2.12:3.5.1
RUN printf '%s\n' \
    'from pyspark.sql import SparkSession' \
    'spark = SparkSession.builder.appName("DependencyCache").getOrCreate()' \
    'spark.stop()' \
    > /tmp/cache_spark_dependencies.py \
    && spark-submit --packages "${SPARK_KAFKA_PACKAGE}" /tmp/cache_spark_dependencies.py \
    && rm /tmp/cache_spark_dependencies.py

# Copy Spark streaming code
COPY . .

# Set environment variables for Spark/PySpark
ENV KAFKA_BOOTSTRAP_SERVERS=kafka:29092
ENV DATA_LAKE_BASE_DIR=/app/data_lake
ENV SPARK_CHECKPOINT_BASE_DIR=/app/checkpoints

# Create directories for checkpoints and data lake
RUN mkdir -p /app/checkpoints /app/data_lake

# Command to run PySpark job with Kafka integration package
CMD ["spark-submit", "--packages", "org.apache.spark:spark-sql-kafka-0-10_2.12:3.5.1", "main.py"]
