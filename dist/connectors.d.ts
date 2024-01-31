/// <reference types="node" />
import { NamedNode } from "@rdfjs/types";
export * from "./connectors/file";
export * from "./connectors/ws";
export * from "./connectors/kafka";
export * from "./connectors/http";
export declare const Conn: import("@treecg/types").Namespace<("FileReaderChannel" | "FileWriterChannel" | "HttpReaderChannel" | "HttpWriterChannel" | "KafkaReaderChannel" | "KafkaWriterChannel" | "WsReaderChannel" | "WsWriterChannel")[], NamedNode<string>, string>;
export interface Config {
    ty: NamedNode;
}
export type ReaderConstructor<C extends Config> = (config: C) => {
    reader: Stream<string | Buffer>;
    init: () => Promise<void>;
};
export type WriterConstructor<C extends Config> = (config: C) => {
    writer: Writer<string | Buffer>;
    init: () => Promise<void>;
};
export declare const JsOntology: import("@treecg/types").Namespace<("JsProcess" | "JsChannel" | "JsReaderChannel" | "JsWriterChannel")[], NamedNode<string>, string>;
export declare class ChannelFactory {
    private inits;
    private jsChannelsNamedNodes;
    private jsChannelsBlankNodes;
    createReader(config: Config): Stream<string | Buffer>;
    createWriter(config: Config): Writer<string | Buffer>;
    init(): Promise<void>;
}
export interface Writer<T> {
    push(item: T): Promise<void>;
    end(): Promise<void>;
}
export interface Stream<T> {
    lastElement?: T;
    end(): Promise<void>;
    data(listener: (t: T) => PromiseLike<void> | void): this;
    on(event: "data", listener: (t: T) => PromiseLike<void> | void): this;
    on(event: "end", listener: () => PromiseLike<void> | void): this;
}
export type Handler<T> = (item: T) => Promise<void> | void;
export declare class SimpleStream<T> implements Stream<T> {
    private readonly dataHandlers;
    private readonly endHandlers;
    readonly disconnect: () => Promise<void>;
    lastElement?: T | undefined;
    constructor(onDisconnect?: () => Promise<void>);
    data(listener: Handler<T>): this;
    push(data: T): Promise<void>;
    end(): Promise<void>;
    on(event: "data", listener: Handler<T>): this;
    on(event: "end", listener: Handler<void>): this;
}
