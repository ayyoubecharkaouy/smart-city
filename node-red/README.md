# Smart City | Node-RED

## Node-RED Installation

Before starting, make sure that **Node.js** is installed on your machine.

You can verify the installation with the following commands:

```bash
node -v
npm -v
```

Next, install Node-RED with the following command:

```bash
npm install -g node-red
```

## Starting Node-RED

To start Node-RED, run:

```bash
node-red
```

Node-RED will display a URL like this:

```text
http://127.0.0.1:1880/
```

Copy this URL into the browser of the same machine to access the Node-RED interface.

## Connecting Node-RED with Kafka

To connect Node-RED with Kafka, you need to install the KafkaJS module.

In the Node-RED interface, open:

```text
Menu ☰ → Manage palette → Install
```

Search for the following module:

```text
node-red-contrib-kafkajs
```

Then click on **Install**.

After installation, you will find the following nodes in the Node-RED palette:

```text
kafkajs-producer
kafkajs-consumer
kafkajs-client
```

The `kafkajs-client` node allows you to configure the connection with the Kafka broker.

## Kafka Broker Example

If Kafka is installed on the same machine, you can use:

```text
localhost:9092
```

**FOR MORE DETAILS, CHECK THE `images/` FOLDER WHICH CONTAINS SCREENSHOTS**

If Node-RED is launched with Docker, use the Kafka service name, for example:

```text
kafka:9092
```
