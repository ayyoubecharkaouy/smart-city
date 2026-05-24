const { Kafka } = require("kafkajs");
const SparkAggregation = require("../models/SparkAggregation");

const kafka = new Kafka({
  clientId: "smartcity-multi-service",
  brokers: ["localhost:9092"]
});

const consumer = kafka.consumer({
  groupId: "smartcity-aggregator-group"
});

const TOPICS = {
  ENVIRONMENT: "smartcity.environment.readings",
  WATER: "smartcity.water.readings",
  TRAFFIC: "smartcity.traffic.readings"
};

const SPARK_TOPICS = {
  ENVIRONMENT: "smartcity.spark.environment",
  WATER: "smartcity.spark.water",
  TRAFFIC: "smartcity.spark.traffic",
  ERRORS: "smartcity.spark.errors"
};

async function startKafkaConsumer(io) {
  await consumer.connect();
  console.log("Kafka Consumer Connected");

  const allTopics = [...Object.values(TOPICS), ...Object.values(SPARK_TOPICS)];
  await consumer.subscribe({ topics: allTopics, fromBeginning: false });

  await consumer.run({
    eachMessage: async ({ topic, message }) => {
      try {
        const value = JSON.parse(message.value.toString());
        const dataArray = Array.isArray(value) ? value : [value];

        // --- Données Brutes : ON NE STOCKE PLUS, ON EMIT SEULEMENT POUR LE LIVE ---
        if (topic === TOPICS.ENVIRONMENT) {
          io.volatile.emit("temperature:new", dataArray);
        } 
        else if (topic === TOPICS.WATER) {
          io.volatile.emit("water:new", dataArray);
        }
        else if (topic === TOPICS.TRAFFIC) {
          io.volatile.emit("traffic:new", dataArray);
        }

        // --- Spark Topics : ON STOCKE POUR L'HISTORIQUE ET ON EMIT ---
        else if (topic === SPARK_TOPICS.ENVIRONMENT) {
          const entry = new SparkAggregation({
            type: "environment",
            district: value.district,
            window_start: value.window?.start,
            window_end: value.window?.end,
            data: {
              avg_temperature: value.avg_temperature,
              avg_air_quality: value.avg_air_quality
            }
          });
          await entry.save();
          io.emit("spark:environment", value);
        }
        else if (topic === SPARK_TOPICS.WATER) {
          const entry = new SparkAggregation({
            type: "water",
            district: value.district,
            window_start: value.window?.start,
            window_end: value.window?.end,
            data: {
              avg_flow_rate: value.avg_flow_rate,
              avg_ph: value.avg_ph,
              avg_turbidity: value.avg_turbidity
            }
          });
          await entry.save();
          io.emit("spark:water", value);
        }
        else if (topic === SPARK_TOPICS.TRAFFIC) {
          const entry = new SparkAggregation({
            type: "traffic",
            route_id: value.route_id,
            window_start: value.window?.start,
            window_end: value.window?.end,
            data: {
              avg_speed: value.avg_speed,
              max_congestion: value.max_congestion
            }
          });
          await entry.save();
          io.emit("spark:traffic", value);
        }
        else if (topic === SPARK_TOPICS.ERRORS) {
          console.warn("[Spark JSON Error]", value);
          io.emit("spark:error", value);
        }
      } catch (error) {
        console.error(`[Kafka] Error processing topic ${topic}:`, error);
      }
    }
  });
}

module.exports = { startKafkaConsumer };
