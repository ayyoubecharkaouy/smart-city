const mongoose = require("mongoose");

const EnvironmentReadingSchema = new mongoose.Schema({
  sensor_id: String,
  city: String,
  district: String,
  temperature: Number,
  unit: String,
  air_quality: {
    aqi: Number,
    status: String,
    main_pollutant: String,
    pm25: Number,
    pm10: Number,
    no2: Number,
    co: Number,
    o3: Number,
    units: Object
  },
  timestamp: { type: Date, default: Date.now }
});

EnvironmentReadingSchema.index({ timestamp: -1 });
EnvironmentReadingSchema.index({ district: 1, timestamp: -1 });
EnvironmentReadingSchema.index({ sensor_id: 1, timestamp: -1 });

module.exports = mongoose.model("EnvironmentReading", EnvironmentReadingSchema);
