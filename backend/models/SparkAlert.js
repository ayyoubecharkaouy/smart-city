const mongoose = require("mongoose");

const SparkAlertSchema = new mongoose.Schema({
  type: { type: String, required: true, enum: ["environment", "water", "traffic"] },
  alert_type: { type: String, required: true },
  severity: { type: String, default: "warning" },
  sensor_id: { type: String },
  district: { type: String },
  route_id: { type: String },
  value: { type: Number },
  operator: { type: String },
  threshold: { type: Number },
  timestamp: { type: Date },
  processed_at: { type: Date },
  created_at: { type: Date, default: Date.now }
});

SparkAlertSchema.index({ type: 1, created_at: -1 });
SparkAlertSchema.index({ alert_type: 1, created_at: -1 });
SparkAlertSchema.index({ processed_at: -1 });

module.exports = mongoose.model("SparkAlert", SparkAlertSchema);
