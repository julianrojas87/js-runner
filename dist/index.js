import { Store } from "n3";
import { getArgs } from "./args";
import { load_store } from "./util";
export * from "./connectors";
export * from "./shacl";
import path from "path";
import { extractShapes } from "./shacl";
import { RDF } from "@treecg/types";
import { ChannelFactory, Conn, JsOntology } from "./connectors";
function safeJoin(a, b) {
    if (b.startsWith("/")) {
        return b;
    }
    return path.join(a, b);
}
export async function extractProcessors(source, apply) {
    const store = new Store();
    await load_store(source, store);
    const quads = store.getQuads(null, null, null, null);
    const config = extractShapes(quads, apply);
    const subjects = quads
        .filter((x) => x.predicate.equals(RDF.terms.type) &&
        x.object.equals(JsOntology.JsProcess))
        .map((x) => x.subject);
    const processorLens = config.lenses[JsOntology.JsProcess.value];
    const processors = subjects.map((id) => processorLens.execute({ id, quads }));
    return { processors, quads, shapes: config };
}
export function extractSteps(proc, quads, config) {
    const out = [];
    const subjects = quads
        .filter((x) => x.predicate.equals(RDF.terms.type) && x.object.equals(proc.ty))
        .map((x) => x.subject);
    const processorLens = config.lenses[proc.ty.value];
    const fields = proc.mapping.parameters;
    for (let id of subjects) {
        const obj = processorLens.execute({ id, quads });
        const functionArgs = new Array(fields.length);
        for (let field of fields) {
            functionArgs[field.position] = obj[field.parameter];
        }
        out.push(functionArgs);
    }
    return out;
}
export async function jsRunner() {
    console.log("JS runner is running!");
    const args = getArgs();
    const cwd = process.cwd();
    const source = {
        location: safeJoin(cwd, args.input).replaceAll("\\", "/"),
        type: "remote",
    };
    const factory = new ChannelFactory();
    /// Small hack, if something is extracted from these types, that should be converted to a reader/writer
    const apply = {};
    for (let ty of [
        Conn.FileReaderChannel,
        Conn.WsReaderChannel,
        Conn.HttpReaderChannel,
        Conn.KafkaReaderChannel,
        JsOntology.JsReaderChannel,
    ]) {
        apply[ty.value] = (x) => factory.createReader(x);
    }
    for (let ty of [
        Conn.FileWriterChannel,
        Conn.WsWriterChannel,
        Conn.HttpWriterChannel,
        Conn.KafkaWriterChannel,
        JsOntology.JsWriterChannel,
    ]) {
        apply[ty.value] = (x) => factory.createWriter(x);
    }
    const { processors, quads, shapes: config, } = await extractProcessors(source, apply);
    const starts = [];
    for (let proc of processors) {
        const argss = extractSteps(proc, quads, config);
        const jsProgram = await import("file://" + proc.file);
        process.chdir(proc.location);
        for (let args of argss) {
            starts.push(await jsProgram[proc.func](...args));
        }
    }
    await factory.init();
    for (let s of starts) {
        if (s && typeof s === "function") {
            s();
        }
    }
}
//# sourceMappingURL=index.js.map