import * as http from "http";
import { createServer } from "http";
import { SimpleStream, } from "../connectors";
function streamToString(stream, binary) {
    const datas = [];
    return new Promise((res) => {
        stream.on("data", (data) => {
            datas.push(data);
        });
        stream.on("end", () => {
            const streamData = Buffer.concat(datas);
            res(binary ? streamData : streamData.toString());
        });
    });
}
export const startHttpStreamReader = (config) => {
    let server;
    const stream = new SimpleStream(() => new Promise((res) => {
        const cb = () => res();
        if (server !== undefined) {
            server.close(cb);
        }
        else {
            cb();
        }
    }));
    const requestListener = async function (req, res) {
        try {
            const content = await streamToString(req, config.binary);
            stream.push(content).catch((error) => {
                throw error;
            });
        }
        catch (error) {
            console.error("Failed", error);
        }
        res.writeHead(200);
        res.end("OK");
    };
    server = createServer(requestListener);
    const init = () => {
        console.log("HTTP init!");
        return new Promise((res) => {
            const cb = () => res(undefined);
            if (server) {
                server.listen(config.port, config.endpoint, cb);
            }
            else {
                cb();
            }
        });
    };
    return { reader: stream, init };
};
export const startHttpStreamWriter = (config) => {
    const requestConfig = new URL(config.endpoint);
    const push = async (item) => {
        await new Promise((res) => {
            const options = {
                hostname: requestConfig.hostname,
                path: requestConfig.path,
                method: config.method,
                port: requestConfig.port,
            };
            const cb = (response) => {
                response.on("data", () => { });
                response.on("end", () => {
                    res(null);
                });
            };
            const req = http.request(options, cb);
            req.write(item, () => res(null));
            req.end();
        });
    };
    const end = async () => { };
    return { writer: { push, end }, init: async () => { } };
};
//# sourceMappingURL=http.js.map