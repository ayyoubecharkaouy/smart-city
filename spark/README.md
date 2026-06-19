# Smart City | Spark Streaming

This folder contains the Spark Structured Streaming processing jobs for the Smart City project.

## Prerequisites

- Java compatible with your Spark version
- Apache Spark installed and available via `spark-submit`
- Python with PySpark
- Kafka started before Spark
- Kafka topics created with the project script

Python Installation:

```bash
cd spark
pip install -r requirements.txt
```

Kafka Topics Creation:

```bash
cd ../backend/kafka
./create-topics.sh
```

## Startup

### Linux and macOS

From the `spark` folder:

```bash
./run_spark.sh
```

### Windows PowerShell

Install Java 17 and Python, then from the `spark` folder:

```powershell
py -m pip install -r requirements.txt
Set-ExecutionPolicy -Scope Process Bypass
.\run_spark.ps1
```

The execution policy change applies only to the current PowerShell terminal.

### Windows CMD

From the `spark` folder:

```bat
py -m pip install -r requirements.txt
run_spark.cmd
```

The `run_spark.ps1` script automatically looks for `spark-submit.cmd` in the
Python `Scripts` folder, even if this folder is not in the `PATH`.

If Spark is still not found, verify that PySpark is installed with the same
Python interpreter:

```powershell
py -3 -m pip install -r requirements.txt
py -3 -m pip show pyspark
```

To locate `spark-submit.cmd` manually:

```powershell
$scripts = py -3 -c "import sysconfig; print(sysconfig.get_path('scripts'))"
Get-ChildItem $scripts -Filter "spark-submit*"
```

Also, verify Java with `java -version`.

Kafka must be running on `localhost:9092` before Spark:

```powershell
docker compose -f ..\docker-compose.yml up -d zookeeper kafka kafka-init
```

### Windows with Docker

This method avoids installing Java and Spark directly on Windows. From the
`platform/smart-city` root directory:

```powershell
docker compose up -d zookeeper kafka kafka-init spark
docker compose logs -f spark
```

Use `Ctrl+C` to exit the log view without stopping Spark.

### Equivalent Command

On Linux/macOS:

```bash
spark-submit \
  --packages org.apache.spark:spark-sql-kafka-0-10_2.12:3.5.1 \
  main.py
```

On Windows PowerShell:

```powershell
spark-submit --packages org.apache.spark:spark-sql-kafka-0-10_2.12:3.5.1 main.py
```

## Kafka Topics

Topics read by Spark:

```text
smartcity.environment.readings
smartcity.water.readings
smartcity.traffic.readings
```

Topics produced by Spark:

```text
smartcity.spark.environment
smartcity.spark.water
smartcity.spark.traffic
smartcity.spark.errors
smartcity.spark.alerts
```

## Configuration

Default values are in `config.py`. They can be overridden with environment variables:

```bash
KAFKA_BOOTSTRAP_SERVERS=localhost:9092
WINDOW_DURATION="2 minutes"
SLIDING_INTERVAL="1 minute"
WATERMARK_DELAY="5 minutes"
SPARK_CHECKPOINT_VERSION=v3
DATA_LAKE_ENABLED=true
DATA_LAKE_BASE_DIR="../data_lake"
```

Alert thresholds:

```bash
AIR_QUALITY_ALERT_THRESHOLD=150
CONGESTION_ALERT_THRESHOLD=0.75
WATER_PH_MIN=6.5
WATER_PH_MAX=8.5
WATER_TURBIDITY_ALERT_THRESHOLD=5
WATER_FLOW_DROP_THRESHOLD=10
TEMPERATURE_TREND_THRESHOLD=1
```

If you modify Spark aggregations, use a new checkpoint version:

```bash
SPARK_CHECKPOINT_VERSION=v3 ./run_spark.sh
```

## Expected JSON Formats

Spark accepts a single JSON object or a JSON array.

### Environment

```json
{
  "sensor_id": "env-001",
  "district": "Centre",
  "temperature": 28.5,
  "air_quality": 82.0,
  "timestamp": "2026-05-24T23:50:00Z"
}
```

### Traffic

```json
{
  "sensor_id": "traffic-001",
  "route_id": "R-101",
  "average_speed_kmh": 42.5,
  "congestion_index": 0.62,
  "vehicle_count": 120,
  "timestamp": "2026-05-24T23:50:00Z"
}
```

### Water

```json
{
  "sensor_id": "water-001",
  "district": "Centre",
  "water_flow": {
    "flow_rate_l_min": 18.2
  },
  "water_quality": {
    "ph": 7.2,
    "turbidity": 2.1
  },
  "timestamp": "2026-05-24T23:50:00Z"
}
```

Example of JSON array:

```json
[
  {
    "sensor_id": "env-001",
    "district": "Centre",
    "temperature": 28.5,
    "air_quality": 82.0,
    "timestamp": "2026-05-24T23:50:00Z"
  },
  {
    "sensor_id": "env-002",
    "district": "Sidi Bouzid",
    "temperature": 26.9,
    "air_quality": 95.0,
    "timestamp": "2026-05-24T23:50:05Z"
  }
]
```

## Produced Results

Messages produced by Spark notably contain:

- `window.start` and `window.end`
- aggregated metrics
- `processed_at`, the Spark processing time

Invalid JSON messages are sent to:

```text
smartcity.spark.errors
```

Business alerts are sent to:

```text
smartcity.spark.alerts
```

## Local Data Lake

Spark jobs also write streams to a local data lake in Parquet format.
By default, files are created in:

```text
Platform/smart-city/data_lake/
```

Structure:

```text
data_lake/
  bronze/
    environment/
    water/
    traffic/
  silver/
    environment/
    water/
    traffic/
```

- `bronze` retains raw Kafka messages with topic, partition, offset, and original JSON value.
- `silver` retains JSON data parsed and validated by Spark.

Folders are partitioned by `event_date` to facilitate historical analysis.
You can disable this writing with:

```bash
DATA_LAKE_ENABLED=false ./run_spark.sh
```

Or choose another location:

```bash
DATA_LAKE_BASE_DIR=/path/to/data_lake ./run_spark.sh
```
