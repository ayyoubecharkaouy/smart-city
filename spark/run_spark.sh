#!/bin/bash

# Package Kafka pour Spark. La version doit correspondre à pyspark dans requirements.txt.
KAFKA_PACKAGE="org.apache.spark:spark-sql-kafka-0-10_2.12:3.5.1"

# Se déplacer dans le dossier du script pour trouver main.py
cd "$(dirname "$0")" || exit 1

echo "Lancement de PySpark Streaming..."
spark-submit --packages $KAFKA_PACKAGE main.py
