import { createReadStream } from "fs";
import http from "http";
import https from "https";
import { DataFactory, Parser, StreamParser } from "n3";
import { createUriAndTermNamespace } from "@treecg/types";
export function toArray(stream) {
    const output = [];
    return new Promise((res, rej) => {
        stream.on("data", (x) => output.push(x));
        stream.on("end", () => res(output));
        stream.on("close", () => res(output));
        stream.on("error", rej);
    });
}
export const OWL = createUriAndTermNamespace("http://www.w3.org/2002/07/owl#", "imports");
export const CONN2 = createUriAndTermNamespace("https://w3id.org/conn#", "install", "build", "GitInstall", "LocalInstall", "url", "procFile", "path");
const { namedNode } = DataFactory;
async function get_readstream(location) {
    if (location.startsWith("https")) {
        return new Promise((res) => {
            https.get(location, res);
        });
    }
    else if (location.startsWith("http")) {
        return new Promise((res) => {
            http.get(location, res);
        });
    }
    else {
        return createReadStream(location);
    }
}
export async function load_quads(location, baseIRI) {
    try {
        console.log("load_quads", location, baseIRI);
        const parser = new StreamParser({ baseIRI: baseIRI || location });
        const rdfStream = await get_readstream(location);
        rdfStream.pipe(parser);
        const quads = await toArray(parser);
        return quads;
    }
    catch (ex) {
        console.error("Failed to load_quads", location, baseIRI);
        console.error(ex);
        return [];
    }
}
function load_memory_quads(value, baseIRI) {
    const parser = new Parser({ baseIRI });
    return parser.parse(value);
}
const loaded = new Set();
export async function load_store(location, store, recursive = true) {
    if (loaded.has(location))
        return;
    loaded.add(location);
    const quads = location.type === "remote"
        ? await load_quads(location.location)
        : load_memory_quads(location.value, location.baseIRI);
    store.addQuads(quads);
    if (recursive) {
        const loc = location.type === "remote" ? location.location : location.baseIRI;
        const other_imports = store.getObjects(namedNode(loc), OWL.terms.imports, null);
        for (let other of other_imports) {
            await load_store({ location: other.value, type: "remote" }, store, true);
        }
    }
}
//# sourceMappingURL=util.js.map