/// <reference types="node" />
import stream from "stream";
import { Store } from "n3";
import { Source } from ".";
import { Quad, Term } from "@rdfjs/types";
export declare function toArray<T>(stream: stream.Readable): Promise<T[]>;
export declare const OWL: {
    namespace: string;
    custom: (input: string) => string;
} & {
    imports: string;
} & {
    terms: import("@treecg/types").Namespace<"imports"[], import("@rdfjs/types").NamedNode<string>, string>;
};
export declare const CONN2: {
    namespace: string;
    custom: (input: string) => string;
} & {
    url: string;
    path: string;
    install: string;
    build: string;
    GitInstall: string;
    LocalInstall: string;
    procFile: string;
} & {
    terms: import("@treecg/types").Namespace<("url" | "path" | "install" | "build" | "GitInstall" | "LocalInstall" | "procFile")[], import("@rdfjs/types").NamedNode<string>, string>;
};
export type Keyed<T> = {
    [Key in keyof T]: Term | undefined;
};
export type Map<V, K, T, O> = (value: V, key: K, item: T) => O;
export declare function load_quads(location: string, baseIRI?: string): Promise<Quad[]>;
export declare function load_store(location: Source, store: Store, recursive?: boolean): Promise<void>;
