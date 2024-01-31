import { SimpleStream, } from "../connectors";
import { WebSocket } from "ws";
import { WebSocketServer } from "ws";
function _connectWs(url, res) {
    const ws = new WebSocket(url, {});
    ws.on("error", () => {
        setTimeout(() => _connectWs(url, res), 300);
    });
    ws.on("ping", () => ws.pong());
    ws.on("open", () => {
        res(ws);
    });
}
function connectWs(url) {
    return new Promise((res) => _connectWs(url, res));
}
export const startWsStreamReader = (config) => {
    const server = new WebSocketServer(config);
    server.on("error", (error) => {
        console.error("Ws server error:");
        console.error(error);
    });
    const connections = [];
    const interval = setInterval(() => {
        connections.forEach((instance, i) => {
            if (!instance) {
                return;
            }
            if (!instance.alive) {
                instance.socket.terminate();
                delete connections[i];
                return;
            }
            instance.socket.ping();
            instance.alive = false;
        });
    }, 30_000);
    const reader = new SimpleStream(() => new Promise((res) => {
        clearInterval(interval);
        server.close(() => res());
    }));
    server.on("connection", (ws) => {
        const instance = { socket: ws, alive: true };
        connections.push(instance);
        ws.on("message", async (msg) => {
            reader.push(msg.toString()).catch((error) => {
                throw error;
            });
        });
        ws.on("pong", () => {
            instance.alive = true;
        });
    });
    return { reader, init: async () => { } };
};
export const startWsStreamWriter = (config) => {
    let ws;
    const init = async () => {
        ws = await connectWs(config.url);
        ws.on("open", () => console.log("open"));
    };
    const push = async (item) => {
        ws.send(item);
    };
    const end = async () => {
        ws.close();
    };
    return { writer: { push, end }, init };
};
//# sourceMappingURL=ws.js.map