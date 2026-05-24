#!/bin/bash

set -e

KAFKA_CONTAINER="${KAFKA_CONTAINER:-kafka-smartcity}"
KAFKA_BOOTSTRAP_SERVER="${KAFKA_BOOTSTRAP_SERVER:-localhost:9092}"
KAFKA_TOPICS_SCRIPT="/opt/kafka/bin/kafka-topics.sh"

create_topic() {
  local topic_name="$1"
  local partitions="$2"

  docker exec "$KAFKA_CONTAINER" "$KAFKA_TOPICS_SCRIPT" \
    --create \
    --if-not-exists \
    --topic "$topic_name" \
    --bootstrap-server "$KAFKA_BOOTSTRAP_SERVER" \
    --partitions "$partitions" \
    --replication-factor 1
}

create_topic "smartcity.environment.readings" 3
create_topic "smartcity.water.readings" 1
create_topic "smartcity.traffic.readings" 1

create_topic "smartcity.spark.environment" 1
create_topic "smartcity.spark.water" 1
create_topic "smartcity.spark.traffic" 1
create_topic "smartcity.spark.errors" 1

docker exec "$KAFKA_CONTAINER" "$KAFKA_TOPICS_SCRIPT" \
  --list \
  --bootstrap-server "$KAFKA_BOOTSTRAP_SERVER"
