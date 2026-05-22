const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const connectDB = require("./config/db");
const apiRoutes = require("./routes/api");
const { startKafkaConsumer } = require("./kafka/consumer");

const app = express();
app.disable("x-powered-by");
app.use(cors());
app.use(express.json({ limit: "1mb" }));

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*", methods: ["GET", "POST"] }
});

// Database
connectDB();

// Routes
app.use("/api", apiRoutes);

app.use((err, req, res, next) => {
  console.error(`[API] ${req.method} ${req.originalUrl}:`, err);
  res.status(500).json({ error: "Internal server error" });
});

// Socket.IO
io.on("connection", (socket) => {
  console.log("Client connected:", socket.id);
  socket.on("disconnect", () => console.log("Client disconnected"));
});

// Kafka Consumer
startKafkaConsumer(io);

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
});
