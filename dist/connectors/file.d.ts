import { Config, ReaderConstructor, WriterConstructor } from "../connectors";
export interface FileReaderConfig extends Config {
    path: string;
    onReplace: boolean;
    readFirstContent?: boolean;
    encoding?: string;
}
export interface FileWriterConfig extends Config {
    path: string;
    onReplace: boolean;
    readFirstContent?: boolean;
    encoding?: string;
}
export declare const startFileStreamReader: ReaderConstructor<FileReaderConfig>;
export declare const startFileStreamWriter: WriterConstructor<FileWriterConfig>;
