// ======================================================
// SMART CITY EL JADIDA — TRAFIC & CONGESTION SENSOR
// Node-RED Function Node
// Données simulées réalistes par capteur
// ======================================================

const observationTime = 60; // secondes
const criticalOccupancy = 0.35;

// Coefficients techniques uniquement pour la simulation
const routeFactors = {
    r1: 0.20,
    r2: 1.35,
    r3: 1.05,
    r4: 0.80
};

const trafficSensors = msg.trafficSensors || [];

if (!Array.isArray(trafficSensors) || trafficSensors.length === 0) {
    node.warn("Aucun capteur trouvé dans msg.trafficSensors");
    msg.topic = "smartcity.traffic.readings";
    msg.payload = JSON.stringify([]);
    return msg;
}

function simulateTraffic(hour, routeId) {

    let baseOccupancy = 0.15;

    if (hour >= 7 && hour <= 9) {
        baseOccupancy = 0.55;
    }
    else if (hour >= 17 && hour <= 20) {
        baseOccupancy = 0.65;
    }
    else if (hour >= 0 && hour <= 5) {
        baseOccupancy = 0.05;
    }
    else if (hour >= 12 && hour <= 14) {
        baseOccupancy = 0.40;
    }

    const routeFactor = routeFactors[routeId] || 1;

    baseOccupancy *= routeFactor;

    const variation = (Math.random() * 0.10) - 0.05;

    let occupancyRate = baseOccupancy + variation;

    if (occupancyRate > 0.95) occupancyRate = 0.95;
    if (occupancyRate < 0.01) occupancyRate = 0.01;

    const occupiedTime = occupancyRate * observationTime;

    const congestionIndex = occupancyRate / criticalOccupancy;

    let avgSpeed;

    if (congestionIndex >= 1.5) {
        avgSpeed = 8 + Math.random() * 12;
    }
    else if (congestionIndex >= 1) {
        avgSpeed = 20 + Math.random() * 15;
    }
    else if (congestionIndex >= 0.7) {
        avgSpeed = 35 + Math.random() * 20;
    }
    else {
        avgSpeed = 50 + Math.random() * 25;
    }

    const vehicleCount = Math.round(occupancyRate * 120);

    let trafficStatus = "fluide";

    if (congestionIndex >= 1.5) {
        trafficStatus = "forte_congestion";
    }
    else if (congestionIndex >= 1) {
        trafficStatus = "congestion";
    }
    else if (congestionIndex >= 0.7) {
        trafficStatus = "dense";
    }

    return {
        occupancyRate,
        occupiedTime,
        congestionIndex,
        avgSpeed,
        vehicleCount,
        trafficStatus
    };
}

const now = new Date();
const hour = now.getHours();

const allTrafficData = trafficSensors.map((sensor) => {

    const traffic = simulateTraffic(hour, sensor.routeId);

    return {
        sensor_id: sensor.id,
        route_id: sensor.routeId,
        city: "El Jadida",
        sensor_type: "IR + Inductive Loop",

        observation_time_s: observationTime,

        occupied_time_s: Number(traffic.occupiedTime.toFixed(2)),
        occupancy_rate: Number(traffic.occupancyRate.toFixed(2)),
        congestion_index: Number(traffic.congestionIndex.toFixed(2)),
        average_speed_kmh: Number(traffic.avgSpeed.toFixed(2)),
        vehicle_count: traffic.vehicleCount,
        vehicle_detected: traffic.vehicleCount > 0 ? 1 : 0,
        traffic_status: traffic.trafficStatus,

        timestamp: new Date().toISOString()
    };
});

msg.topic = "smartcity.traffic.readings";
msg.payload = JSON.stringify(allTrafficData);

return msg;