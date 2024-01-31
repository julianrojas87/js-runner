import { Quad, Term } from "@rdfjs/types";
import { BasicLens, BasicLensM, Cont } from "rdf-lens";
export declare const RDFS: import("@treecg/types").Namespace<"subClassOf"[], import("@rdfjs/types").NamedNode<string>, string>;
export declare const SHACL: import("@treecg/types").Namespace<("name" | "path" | "description" | "class" | "property" | "NodeShape" | "targetClass" | "alternativePath" | "datatype" | "defaultValue" | "minCount" | "maxCount" | "Shape" | "PropertyShape" | "targetNode" | "targetSubjectsOf" | "targetObjectsOf" | "zeroOrMorePath" | "inversePath")[], import("@rdfjs/types").NamedNode<string>, string>;
export interface ShapeField {
    name: string;
    path: BasicLensM<Cont, Cont>;
    minCount?: number;
    maxCount?: number;
    extract: BasicLens<Cont, any>;
}
export interface Shape {
    id: string;
    ty: Term;
    description?: string;
    fields: ShapeField[];
}
export declare function toLens(shape: Shape): BasicLens<Cont, {
    [label: string]: any;
}>;
export declare const RdfList: BasicLens<Cont, Term[]>;
export declare const ShaclSequencePath: BasicLens<Cont, BasicLensM<Cont, Cont>>;
export declare const ShaclAlternativepath: BasicLens<Cont, BasicLensM<Cont, Cont>>;
export declare const ShaclPredicatePath: BasicLens<Cont, BasicLensM<Cont, Cont>>;
export declare const ShaclInversePath: BasicLens<Cont, BasicLensM<Cont, Cont>>;
export declare const ShaclPath: BasicLens<Cont, BasicLensM<Cont, Cont>>;
type Cache = {
    [clazz: string]: BasicLens<Cont, any>;
};
type SubClasses = {
    [clazz: string]: string;
};
export declare function extractShape(cache: Cache, subclasses: {
    [label: string]: string;
}, apply: {
    [label: string]: (item: any) => any;
}): BasicLens<Cont, Shape[]>;
export type Shapes = {
    shapes: Shape[];
    lenses: Cache;
    subClasses: SubClasses;
};
export declare function extractShapes(quads: Quad[], apply?: {
    [label: string]: (item: any) => any;
}): Shapes;
export {};
