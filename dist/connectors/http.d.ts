import { Config, ReaderConstructor, WriterConstructor } from "../connectors";
export interface HttpReaderConfig extends Config {
    endpoint: string;
    port: number;
    binary: boolean;
}
export declare const startHttpStreamReader: ReaderConstructor<HttpReaderConfig>;
export interface HttpWriterConfig extends Config {
    endpoint: string;
    method: string;
}
export declare const startHttpStreamWriter: WriterConstructor<HttpWriterConfig>;
