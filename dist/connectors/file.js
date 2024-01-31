import { createReadStream, openSync } from "fs";
import { appendFile, readFile, stat, writeFile } from "fs/promises";
import { isAbsolute } from "path";
import { watch } from "node:fs";
import { SimpleStream, } from "../connectors";
async function getFileSize(path) {
    return (await stat(path)).size;
}
function readPart(path, start, end, encoding) {
    return new Promise((res) => {
        const stream = createReadStream(path, { encoding, start, end });
        let buffer = "";
        stream.on("data", (chunk) => {
            buffer += chunk;
        });
        stream.on("close", () => res(buffer));
    });
}
function debounce(func, timeout = 100) {
    let timer;
    return (...args) => {
        clearTimeout(timer);
        timer = setTimeout(() => {
            func(...args);
        }, timeout);
    };
}
export const startFileStreamReader = (config) => {
    const path = isAbsolute(config.path)
        ? config.path
        : `${process.cwd()}/${config.path}`;
    openSync(path, "a+");
    const encoding = config.encoding || "utf-8";
    const reader = new SimpleStream();
    const init = async () => {
        let currentPos = await getFileSize(path);
        const watcher = watch(path, { encoding: "utf-8" });
        watcher.on("change", debounce(async () => {
            try {
                let content;
                if (config.onReplace) {
                    content = await readFile(path, { encoding });
                }
                else {
                    const newSize = await getFileSize(path);
                    if (newSize <= currentPos) {
                        currentPos = newSize;
                        return;
                    }
                    content = await readPart(path, currentPos, newSize, encoding);
                    currentPos = newSize;
                }
                await reader.push(content);
            }
            catch (error) {
                if (error.code === "ENOENT") {
                    return;
                }
                throw error;
            }
        }));
        if (config.onReplace && config.readFirstContent) {
            console.log("reading first content");
            const content = await readFile(path, { encoding });
            await reader.push(content);
        }
    };
    return { reader, init };
};
// export interface FileWriterConfig extends FileReaderConfig {}
export const startFileStreamWriter = (config) => {
    const path = isAbsolute(config.path)
        ? config.path
        : `${process.cwd()}/${config.path}`;
    const encoding = config.encoding || "utf-8";
    const init = async () => {
        if (!config.onReplace) {
            await writeFile(path, "", { encoding });
        }
    };
    const push = async (item) => {
        if (config.onReplace) {
            await writeFile(path, item, { encoding });
        }
        else {
            await appendFile(path, item, { encoding });
        }
    };
    const end = async () => { };
    return { writer: { push, end }, init };
};
//# sourceMappingURL=file.js.map