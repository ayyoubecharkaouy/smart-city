const mongoose = require("mongoose");

const SparkAggregationSchema = new mongoose.Schema({
  type: { type: String, required: true, enum: ["environment", "water", "traffic"] },
  district: { type: String },
  route_id: { type: String },
  data: { type: mongoose.Schema.Types.Mixed, required: true },
  window_start: { type: Date },
  window_end: { type: Date },
  timestamp: { type: Date, default: Date.now }
});

SparkAggregationSchema.index({ type: 1, timestamp: -1 });
SparkAggregationSchema.index({ type: 1, district: 1, timestamp: -1 });
SparkAggregationSchema.index({ type: 1, route_id: 1, timestamp: -1 });
SparkAggregationSchema.index({ window_end: 1 });

module.exports = mongoose.model("SparkAggregation", SparkAggregationSchema);
