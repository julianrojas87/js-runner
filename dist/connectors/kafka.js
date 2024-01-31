import { readFileSync } from "node:fs";
import { Kafka } from "kafkajs";
import { SimpleStream, } from "../connectors";
export const startKafkaStreamReader = (config) => {
    const brokerConfig = {};
    if (typeof config.broker === "string" || config.broker instanceof String) {
        Object.assign(brokerConfig, JSON.parse(readFileSync(config.broker, "utf-8")));
    }
    else {
        Object.assign(brokerConfig, config.broker);
    }
    if (brokerConfig && brokerConfig.hosts) {
        brokerConfig.brokers = brokerConfig.hosts;
    }
    const kafka = new Kafka(brokerConfig);
    const consumer = kafka.consumer(config.consumer);
    const stream = new SimpleStream(async () => {
        await consumer.disconnect();
        await consumer.stop();
    });
    const init = async () => {
        await consumer.connect();
        await consumer.subscribe({
            topic: config.topic.name,
            fromBeginning: config.topic.fromBeginning,
        });
        consumer
            .run({
            async eachMessage({ topic, message, }) {
                if (topic === config.topic.name) {
                    const element = message.value?.toString() ?? "";
                    stream.push(element).catch((error) => {
                        throw error;
                    });
                }
            },
        })
            .catch((error) => {
            throw error;
        });
    };
    return { reader: stream, init };
};
export const startKafkaStreamWriter = (config) => {
    const topic = config.topic.name;
    const brokerConfig = {};
    if (typeof config.broker === "string" || config.broker instanceof String) {
        Object.assign(brokerConfig, JSON.parse(readFileSync(config.broker, "utf-8")));
    }
    else {
        Object.assign(brokerConfig, config.broker);
    }
    if (brokerConfig && brokerConfig.hosts) {
        brokerConfig.brokers = brokerConfig.hosts;
    }
    const kafka = new Kafka(brokerConfig);
    const producer = kafka.producer(config.producer);
    const init = () => producer.connect();
    const push = async (item) => {
        await producer.send({ topic, messages: [{ value: item }] });
    };
    const end = async () => {
        await producer.disconnect();
    };
    return { writer: { push, end }, init };
};
//# sourceMappingURL=kafka.js.map