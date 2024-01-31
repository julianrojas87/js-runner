import type { ProducerConfig } from "kafkajs";
import { Config, ReaderConstructor, WriterConstructor } from "../connectors";
export interface SASLOptions {
    mechanism: "plain";
    username: string;
    password: string;
}
export interface BrokerConfig {
    hosts: string[];
    ssl?: boolean;
    sasl?: SASLOptions;
}
export interface ConsumerConfig {
    groupId: string;
    metadataMaxAge?: number;
    sessionTimeout?: number;
    rebalanceTimeout?: number;
    heartbeatInterval?: number;
    maxBytesPerPartition?: number;
    minBytes?: number;
    maxBytes?: number;
    maxWaitTimeInMs?: number;
    allowAutoTopicCreation?: boolean;
    maxInFlightRequests?: number;
    readUncommitted?: boolean;
    rackId?: string;
}
export interface CSTopic {
    topic: string;
    fromBeginning?: boolean;
}
export interface KafkaReaderConfig extends Config {
    topic: {
        name: string;
        fromBeginning?: boolean;
    };
    consumer: ConsumerConfig;
    broker: string | BrokerConfig;
}
export declare const startKafkaStreamReader: ReaderConstructor<KafkaReaderConfig>;
export interface KafkaWriterConfig extends Config {
    topic: {
        name: string;
    };
    producer: ProducerConfig;
    broker: BrokerConfig | string;
}
export declare const startKafkaStreamWriter: WriterConstructor<KafkaWriterConfig>;
