import { createTermNamespace } from "@treecg/types";
import { startFileStreamReader, startFileStreamWriter, } from "./connectors/file";
export * from "./connectors/file";
import { startWsStreamReader, startWsStreamWriter, } from "./connectors/ws";
export * from "./connectors/ws";
import { startKafkaStreamReader, startKafkaStreamWriter, } from "./connectors/kafka";
export * from "./connectors/kafka";
import { startHttpStreamReader, startHttpStreamWriter, } from "./connectors/http";
export * from "./connectors/http";
export const Conn = createTermNamespace("https://w3id.org/conn#", "FileReaderChannel", "FileWriterChannel", "HttpReaderChannel", "HttpWriterChannel", "KafkaReaderChannel", "KafkaWriterChannel", "WsReaderChannel", "WsWriterChannel");
export const JsOntology = createTermNamespace("https://w3id.org/conn/js#", "JsProcess", "JsChannel", "JsReaderChannel", "JsWriterChannel");
export class ChannelFactory {
    inits = [];
    jsChannelsNamedNodes = {};
    jsChannelsBlankNodes = {};
    createReader(config) {
        if (config.ty.equals(Conn.FileReaderChannel)) {
            const { reader, init } = startFileStreamReader(config);
            this.inits.push(init);
            return reader;
        }
        if (config.ty.equals(Conn.WsReaderChannel)) {
            const { reader, init } = startWsStreamReader(config);
            this.inits.push(init);
            return reader;
        }
        if (config.ty.equals(Conn.KafkaReaderChannel)) {
            const { reader, init } = startKafkaStreamReader(config);
            this.inits.push(init);
            return reader;
        }
        if (config.ty.equals(Conn.HttpReaderChannel)) {
            const { reader, init } = startHttpStreamReader(config);
            this.inits.push(init);
            return reader;
        }
        if (config.ty.equals(JsOntology.JsReaderChannel)) {
            const c = config;
            if (c.channel) {
                const id = c.channel.id.value;
                if (c.channel.id.termType === "NamedNode") {
                    if (!this.jsChannelsNamedNodes[id]) {
                        this.jsChannelsNamedNodes[id] = new SimpleStream();
                    }
                    return this.jsChannelsNamedNodes[id];
                }
                if (c.channel.id.termType === "BlankNode") {
                    if (!this.jsChannelsBlankNodes[id]) {
                        this.jsChannelsBlankNodes[id] = new SimpleStream();
                    }
                    return this.jsChannelsBlankNodes[id];
                }
                throw "Should have found a thing";
            }
        }
        throw "Unknown reader channel " + config.ty.value;
    }
    createWriter(config) {
        if (config.ty.equals(Conn.FileWriterChannel)) {
            const { writer, init } = startFileStreamWriter(config);
            this.inits.push(init);
            return writer;
        }
        if (config.ty.equals(Conn.WsWriterChannel)) {
            const { writer, init } = startWsStreamWriter(config);
            this.inits.push(init);
            return writer;
        }
        if (config.ty.equals(Conn.KafkaWriterChannel)) {
            const { writer, init } = startKafkaStreamWriter(config);
            this.inits.push(init);
            return writer;
        }
        if (config.ty.equals(Conn.HttpWriterChannel)) {
            const { writer, init } = startHttpStreamWriter(config);
            this.inits.push(init);
            return writer;
        }
        if (config.ty.equals(JsOntology.JsWriterChannel)) {
            const c = config;
            if (c.channel) {
                const id = c.channel.id.value;
                if (c.channel.id.termType === "NamedNode") {
                    if (!this.jsChannelsNamedNodes[id]) {
                        this.jsChannelsNamedNodes[id] = new SimpleStream();
                    }
                    return this.jsChannelsNamedNodes[id];
                }
                if (c.channel.id.termType === "BlankNode") {
                    if (!this.jsChannelsBlankNodes[id]) {
                        this.jsChannelsBlankNodes[id] = new SimpleStream();
                    }
                    return this.jsChannelsBlankNodes[id];
                }
                throw "Should have found a thing";
            }
        }
        throw "Unknown writer channel " + config.ty.value;
    }
    async init() {
        await Promise.all(this.inits.map((x) => x()));
    }
}
export class SimpleStream {
    dataHandlers = [];
    endHandlers = [];
    disconnect;
    lastElement;
    constructor(onDisconnect) {
        this.disconnect = onDisconnect || (async () => { });
    }
    data(listener) {
        this.dataHandlers.push(listener);
        return this;
    }
    async push(data) {
        this.lastElement = data;
        await Promise.all(this.dataHandlers.map((handler) => handler(data)));
    }
    async end() {
        await this.disconnect();
        await Promise.all(this.endHandlers.map((handler) => handler()));
    }
    on(event, listener) {
        if (event === "data") {
            this.dataHandlers.push(listener);
        }
        if (event === "end") {
            this.endHandlers.push(listener);
        }
        return this;
    }
}
//# sourceMappingURL=connectors.js.map