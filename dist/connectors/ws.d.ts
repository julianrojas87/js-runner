import { Config, ReaderConstructor, WriterConstructor } from "../connectors";
export interface WsWriterConfig extends Config {
    url: string;
}
export interface WsReaderConfig extends Config {
    host: string;
    port: number;
}
export declare const startWsStreamReader: ReaderConstructor<WsReaderConfig>;
export declare const startWsStreamWriter: WriterConstructor<WsWriterConfig>;
