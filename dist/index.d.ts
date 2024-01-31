export * from "./connectors";
export * from "./shacl";
import { Shapes } from "./shacl";
import { Quad, Term } from "@rdfjs/types";
type Processor = {
    ty: Term;
    file: string;
    location: string;
    func: string;
    mapping: {
        parameters: {
            parameter: string;
            position: number;
        }[];
    };
};
export type Source = {
    type: "remote";
    location: string;
} | {
    type: "memory";
    value: string;
    baseIRI: string;
};
export type Extracted = {
    processors: Processor[];
    quads: Quad[];
    shapes: Shapes;
};
export declare function extractProcessors(source: Source, apply?: {
    [label: string]: (item: any) => any;
}): Promise<Extracted>;
export declare function extractSteps(proc: Processor, quads: Quad[], config: Shapes): any[][];
export declare function jsRunner(): Promise<void>;
