import { createTermNamespace, RDF, XSD } from "@treecg/types";
import { BasicLens, BasicLensM, empty, invPred, pred, subjects, unique, } from "rdf-lens";
export const RDFS = createTermNamespace("http://www.w3.org/2000/01/rdf-schema#", "subClassOf");
export const SHACL = createTermNamespace("http://www.w3.org/ns/shacl#", 
// Basics
"Shape", "NodeShape", "PropertyShape", 
// SHACL target constraints
"targetNode", "targetClass", "targetSubjectsOf", "targetObjectsOf", 
// Property things
"property", "path", "class", "name", "description", "defaultValue", 
// Path things
"alternativePath", "zeroOrMorePath", "inversePath", "minCount", "maxCount", "datatype");
export function toLens(shape) {
    if (shape.fields.length === 0)
        return empty().map(() => ({}));
    const fields = shape.fields.map((field) => {
        const minCount = field.minCount || 0;
        const maxCount = field.maxCount || Number.MAX_SAFE_INTEGER;
        const base = maxCount < 2 // There will be at most one
            ? field.path.one().then(field.extract)
            : field.path.thenAll(field.extract).map((xs) => {
                if (xs.length < minCount) {
                    throw `${shape.ty}:${field.name} required at least ${minCount} elements, found ${xs.length}`;
                }
                if (xs.length > maxCount) {
                    throw `${shape.ty}:${field.name} required at most ${maxCount} elements, found ${xs.length}`;
                }
                return xs;
            });
        const asField = base.map((x) => {
            const out = {};
            out[field.name] = x;
            return out;
        });
        return minCount > 0 ? asField : asField.or(empty().map(() => ({})));
    });
    return fields[0]
        .and(...fields.slice(1))
        .map((xs) => Object.assign({}, ...xs));
}
const RDFListElement = pred(RDF.terms.first)
    .one()
    .and(pred(RDF.terms.rest).one());
export const RdfList = new BasicLens((c) => {
    if (c.id.equals(RDF.terms.nil)) {
        return [];
    }
    const [first, rest] = RDFListElement.execute(c);
    const els = RdfList.execute(rest);
    els.unshift(first.id);
    return els;
});
export const ShaclSequencePath = new BasicLens((c) => {
    const pathList = RdfList.execute(c);
    if (pathList.length === 0) {
        return new BasicLensM((c) => [c]);
    }
    let start = pred(pathList[0]);
    for (let i = 1; i < pathList.length; i++) {
        start = start.thenFlat(pred(pathList[i]));
    }
    return start;
});
export const ShaclAlternativepath = new BasicLens((c) => {
    const options = pred(SHACL.alternativePath).one().then(RdfList).execute(c);
    const optionLenses = options.map((id) => ShaclPath.execute({ id, quads: c.quads }));
    return optionLenses[0].orAll(...optionLenses.slice(1));
});
export const ShaclPredicatePath = new BasicLens((c) => {
    return pred(c.id);
});
export const ShaclInversePath = pred(SHACL.inversePath)
    .one()
    .then(new BasicLens((c) => {
    const pathList = RdfList.execute(c);
    if (pathList.length === 0) {
        return new BasicLensM((c) => [c]);
    }
    pathList.reverse();
    let start = invPred(pathList[0]);
    for (let i = 1; i < pathList.length; i++) {
        start = start.thenFlat(invPred(pathList[i]));
    }
    return start;
}).or(new BasicLens((c) => {
    return invPred(c.id);
})));
export const ShaclPath = ShaclSequencePath.or(ShaclAlternativepath, ShaclInversePath, ShaclPredicatePath);
function field(predicate, name, convert) {
    const conv = convert || ((x) => x);
    return pred(predicate)
        .one()
        .map(({ id }) => {
        const out = {};
        out[name] = conv(id.value);
        return out;
    });
}
function optionalField(predicate, name, convert) {
    const conv = convert || ((x) => x);
    return pred(predicate)
        .one(undefined)
        .map((inp) => {
        const out = {};
        if (inp) {
            out[name] = conv(inp.id.value);
        }
        return out;
    });
}
function dataTypeToExtract(dataType, t) {
    if (dataType.equals(XSD.terms.integer))
        return +t.value;
    if (dataType.equals(XSD.terms.custom("float")))
        return +t.value;
    if (dataType.equals(XSD.terms.custom("double")))
        return +t.value;
    if (dataType.equals(XSD.terms.custom("decimal")))
        return +t.value;
    if (dataType.equals(XSD.terms.string))
        return t.value;
    if (dataType.equals(XSD.terms.dateTime))
        return new Date(t.value);
    if (dataType.equals(XSD.terms.custom("boolean")))
        return t.value === "true";
    return t;
}
function extractProperty(cache, subClasses, apply) {
    const pathLens = pred(SHACL.path)
        .one()
        .then(ShaclPath)
        .map((path) => ({
        path,
    }));
    const nameLens = field(SHACL.name, "name");
    const minCount = optionalField(SHACL.minCount, "minCount", (x) => +x);
    const maxCount = optionalField(SHACL.maxCount, "maxCount", (x) => +x);
    const dataTypeLens = pred(SHACL.datatype)
        .one()
        .map(({ id }) => ({
        extract: empty().map((item) => dataTypeToExtract(id, item.id)),
    }));
    const clazzLens = field(SHACL.class, "clazz").map(({ clazz: expected_class }) => {
        return {
            extract: new BasicLens(({ id, quads }) => {
                // How do I extract this value: use a pre
                let found_class = false;
                const ty = quads.find((q) => q.subject.equals(id) && q.predicate.equals(RDF.terms.type))?.object.value;
                if (!ty) {
                    // We did not find a type, so use the expected class lens
                    const lens = cache[expected_class];
                    if (!lens) {
                        throw `Tried extracting class ${expected_class} but no shape was defined`;
                    }
                    return lens.execute({ id, quads });
                }
                // We found a type, let's see if the expected class is inside the class hierachry
                const lenses = [];
                let current = ty;
                while (!!current) {
                    if (lenses.length < 2) {
                        const lens = cache[current];
                        if (lens) {
                            lenses.push(lens);
                        }
                    }
                    found_class = found_class || current === expected_class;
                    current = subClasses[current];
                }
                if (!found_class) {
                    throw `${ty} is not a subClassOf ${expected_class}`;
                }
                if (lenses.length === 0) {
                    throw `Tried the classhierarchy for ${ty}, but found no shape definition`;
                }
                const finalLens = lenses.length == 1
                    ? lenses[0]
                    : lenses[0].and(lenses[1]).map(([a, b]) => Object.assign({}, a, b));
                if (apply[ty]) {
                    return finalLens.map(apply[ty]).execute({ id, quads });
                }
                else {
                    return finalLens.execute({ id, quads });
                }
            }),
        };
    });
    return pathLens
        .and(nameLens, minCount, maxCount, clazzLens.or(dataTypeLens))
        .map((xs) => Object.assign({}, ...xs));
}
export function extractShape(cache, subclasses, apply) {
    const checkTy = pred(RDF.terms.type)
        .one()
        .map(({ id }) => {
        if (id.equals(SHACL.NodeShape))
            return {};
        throw "Shape is not sh:NodeShape";
    });
    const idLens = empty().map(({ id }) => ({ id: id.value }));
    const clazzs = pred(SHACL.targetClass);
    const multiple = clazzs.thenAll(empty().map(({ id }) => ({ ty: id })));
    // TODO: Add implictTargetClass
    const descriptionClassLens = optionalField(SHACL.description, "description");
    const fields = pred(SHACL.property)
        .thenSome(extractProperty(cache, subclasses, apply))
        .map((fields) => ({ fields }));
    return multiple
        .and(checkTy, idLens, descriptionClassLens, fields)
        .map(([multiple, ...others]) => multiple.map((xs) => Object.assign({}, xs, ...others)));
}
export function extractShapes(quads, apply = {}) {
    const cache = {};
    const subClasses = {};
    quads
        .filter((x) => x.predicate.equals(RDFS.subClassOf))
        .forEach((x) => (subClasses[x.subject.value] = x.object.value));
    const shapes = subjects()
        .then(unique())
        .asMulti()
        .thenSome(extractShape(cache, subClasses, apply))
        .execute(quads)
        .flat();
    const lenses = [];
    // Populate cache
    for (let shape of shapes) {
        const lens = toLens(shape);
        const target = cache[shape.ty.value];
        if (target) {
            cache[shape.ty.value] = target.or(lens);
            // subClasses: shape.subTypes,
        }
        else {
            cache[shape.ty.value] = lens;
        }
        lenses.push(lens);
    }
    return { lenses: cache, shapes, subClasses };
}
//# sourceMappingURL=shacl.js.map