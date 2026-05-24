const express = require("express");
const router = express.Router();
const EnvironmentReading = require("../models/EnvironmentReading");
const WaterReading = require("../models/WaterReading");
const TrafficReading = require("../models/TrafficReading");
const SparkAggregation = require("../models/SparkAggregation");
const SparkAlert = require("../models/SparkAlert");

const DEFAULT_LATEST_LIMIT = 100;
const MAX_LATEST_LIMIT = 500;

function parseLimit(value, fallback = DEFAULT_LATEST_LIMIT) {
  const parsed = Number.parseInt(value, 10);

  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }

  return Math.min(parsed, MAX_LATEST_LIMIT);
}

function asyncRoute(handler) {
  return async (req, res, next) => {
    try {
      await handler(req, res, next);
    } catch (err) {
      next(err);
    }
  };
}

function setShortCache(res) {
  res.set("Cache-Control", "public, max-age=2, stale-while-revalidate=10");
}

const environmentProjection = {
  _id: 0,
  sensor_id: 1,
  city: 1,
  district: 1,
  temperature: 1,
  unit: 1,
  air_quality: 1,
  timestamp: 1
};

const waterProjection = {
  _id: 0,
  sensor_id: 1,
  city: 1,
  district: 1,
  type: 1,
  water_flow: 1,
  water_quality: 1,
  timestamp: 1
};

const trafficProjection = {
  _id: 0,
  sensor_id: 1,
  route_id: 1,
  city: 1,
  sensor_type: 1,
  observation_time_s: 1,
  occupied_time_s: 1,
  occupancy_rate: 1,
  congestion_index: 1,
  average_speed_kmh: 1,
  vehicle_count: 1,
  vehicle_detected: 1,
  traffic_status: 1,
  timestamp: 1
};

function buildSparkAggregationPayload(item) {
  return {
    type: item.type,
    district: item.district,
    route_id: item.route_id,
    window: {
      start: item.window_start,
      end: item.window_end
    },
    ...(item.data || {}),
    timestamp: item.timestamp
  };
}

function buildSparkAlertPayload(item) {
  return {
    type: item.type,
    alert_type: item.alert_type,
    severity: item.severity,
    sensor_id: item.sensor_id,
    district: item.district,
    route_id: item.route_id,
    value: item.value,
    operator: item.operator,
    threshold: item.threshold,
    timestamp: item.timestamp,
    processed_at: item.processed_at
  };
}

function parseSparkType(value) {
  return ["environment", "water", "traffic"].includes(value) ? value : null;
}

// ── SPARK ENDPOINTS ──

router.get("/spark/aggregations", asyncRoute(async (req, res) => {
  setShortCache(res);
  const type = parseSparkType(req.query.type);
  const query = type ? { type } : {};

  const data = await SparkAggregation.find(query)
    .sort({ timestamp: -1 })
    .limit(parseLimit(req.query.limit, 100))
    .lean();

  res.json(data.map(buildSparkAggregationPayload));
}));

router.get("/spark/alerts", asyncRoute(async (req, res) => {
  setShortCache(res);
  const type = parseSparkType(req.query.type);
  const query = type ? { type } : {};

  const data = await SparkAlert.find(query)
    .sort({ created_at: -1 })
    .limit(parseLimit(req.query.limit, 100))
    .lean();

  res.json(data.map(buildSparkAlertPayload));
}));

// ── ENVIRONMENT ENDPOINTS ──

router.get("/temperatures/latest", asyncRoute(async (req, res) => {
  const data = await EnvironmentReading.find({}, environmentProjection)
    .sort({ timestamp: -1 })
    .limit(parseLimit(req.query.limit))
    .lean();

  res.json(data);
}));

router.get("/temperatures/avg-by-district", asyncRoute(async (req, res) => {
  setShortCache(res);
  const result = await SparkAggregation.aggregate([
    { $match: { type: "environment", district: { $exists: true, $ne: null } } },
    { $sort: { district: 1, timestamp: -1 } },
    {
      $group: {
        _id: "$district",
        avgTemperature: { $first: "$data.avg_temperature" },
        avgAqi: { $first: "$data.avg_air_quality" },
        lastUpdate: { $first: "$timestamp" }
      }
    },
    { $sort: { _id: 1 } }
  ]);

  res.json(result.map(item => ({
    district: item._id,
    avg_temperature: item.avgTemperature,
    max_temperature: item.avgTemperature,
    min_temperature: item.avgTemperature,
    avg_aqi: item.avgAqi,
    sensor_count: 1,
    last_update: item.lastUpdate
  })));
}));

router.get("/temperatures/history", asyncRoute(async (req, res) => {
  setShortCache(res);
  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const history = await SparkAggregation.aggregate([
    {
      $match: {
        type: "environment",
        timestamp: { $gte: twentyFourHoursAgo }
      }
    },
    {
      $group: {
        _id: {
          year: { $year: "$timestamp" },
          month: { $month: "$timestamp" },
          day: { $dayOfMonth: "$timestamp" },
          hour: { $hour: "$timestamp" }
        },
        avgTemp: { $avg: "$data.avg_temperature" },
        avgAqi: { $avg: "$data.avg_air_quality" },
        timestamp: { $min: "$timestamp" }
      },
    },
    { $sort: { timestamp: 1 } }
  ]);

  res.json(history.map(h => ({
    time: h.timestamp,
    temperature: h.avgTemp,
    aqi: h.avgAqi
  })));
}));

// ── WATER ENDPOINTS ──

router.get("/water/latest", asyncRoute(async (req, res) => {
  const data = await WaterReading.find({}, waterProjection)
    .sort({ timestamp: -1 })
    .limit(parseLimit(req.query.limit))
    .lean();

  res.json(data);
}));

router.get("/water/stats-by-district", asyncRoute(async (req, res) => {
  setShortCache(res);
  const result = await SparkAggregation.aggregate([
    { $match: { type: "water", district: { $exists: true, $ne: null } } },
    { $sort: { district: 1, timestamp: -1 } },
    {
      $group: {
        _id: "$district",
        avgFlow: { $first: "$data.avg_flow_rate" },
        avgPh: { $first: "$data.avg_ph" },
        avgTurbidity: { $first: "$data.avg_turbidity" },
        lastUpdate: { $first: "$timestamp" }
      }
    },
    { $sort: { _id: 1 } }
  ]);

  res.json(result.map(item => ({
    district: item._id,
    avg_flow: item.avgFlow,
    total_volume: 0,
    avg_ph: item.avgPh,
    avg_turbidity: item.avgTurbidity,
    sensor_count: 1,
    last_update: item.lastUpdate
  })));
}));

router.get("/water/history", asyncRoute(async (req, res) => {
  setShortCache(res);
  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const history = await SparkAggregation.aggregate([
    {
      $match: {
        type: "water",
        timestamp: { $gte: twentyFourHoursAgo }
      }
    },
    {
      $group: {
        _id: {
          year: { $year: "$timestamp" },
          month: { $month: "$timestamp" },
          day: { $dayOfMonth: "$timestamp" },
          hour: { $hour: "$timestamp" }
        },
        avgFlow: { $avg: "$data.avg_flow_rate" },
        timestamp: { $min: "$timestamp" }
      },
    },
    { $sort: { timestamp: 1 } }
  ]);

  res.json(history.map(h => ({
    time: h.timestamp,
    flow: h.avgFlow
  })));
}));

// ── TRAFFIC ENDPOINTS ──

router.get("/traffic/latest", asyncRoute(async (req, res) => {
  const data = await TrafficReading.find({}, trafficProjection)
    .sort({ timestamp: -1 })
    .limit(parseLimit(req.query.limit))
    .lean();

  res.json(data);
}));

router.get("/traffic/stats-by-route", asyncRoute(async (req, res) => {
  setShortCache(res);
  const result = await SparkAggregation.aggregate([
    { $match: { type: "traffic", route_id: { $exists: true, $ne: null } } },
    { $sort: { route_id: 1, timestamp: -1 } },
    {
      $group: {
        _id: "$route_id",
        avgSpeed: { $first: "$data.avg_speed" },
        maxCongestion: { $first: "$data.max_congestion" },
        lastUpdate: { $first: "$timestamp" }
      }
    },
    { $sort: { _id: 1 } }
  ]);

  res.json(result.map(item => ({
    route_id: item._id,
    avg_speed: item.avgSpeed,
    avg_occupancy: 0,
    avg_congestion: item.maxCongestion,
    total_vehicles: 0,
    sensor_count: 1,
    last_update: item.lastUpdate
  })));
}));

router.get("/traffic/history", asyncRoute(async (req, res) => {
  setShortCache(res);
  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const history = await SparkAggregation.aggregate([
    {
      $match: {
        type: "traffic",
        timestamp: { $gte: twentyFourHoursAgo }
      }
    },
    {
      $group: {
        _id: {
          year: { $year: "$timestamp" },
          month: { $month: "$timestamp" },
          day: { $dayOfMonth: "$timestamp" },
          hour: { $hour: "$timestamp" }
        },
        avgSpeed: { $avg: "$data.avg_speed" },
        avgCongestion: { $avg: "$data.max_congestion" },
        timestamp: { $min: "$timestamp" }
      },
    },
    { $sort: { timestamp: 1 } }
  ]);

  res.json(history.map(h => ({
    time: h.timestamp,
    avg_speed: h.avgSpeed,
    avg_congestion: h.avgCongestion
  })));
}));

module.exports = router;
