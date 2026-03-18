import { ipcRenderer, contextBridge } from "electron";

// Custom IpcClient implementation to avoid nanoid dependency in preload
class IpcClient {
  private namespace: string;
  private ipcRenderer: any;
  private methods: string[];

  constructor(ipcRenderer: any, namespace: string = "api-request") {
    this.ipcRenderer = ipcRenderer;
    this.namespace = namespace;
    this.methods = ["get", "post", "put", "patch", "delete"];
    this.methods.forEach((method) => {
      (this as any)[method] = this.buildRequestHandler(method);
    });
  }

  private generateId(): string {
    return Array.from(crypto.getRandomValues(new Uint8Array(16)))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  }

  send(data: any): void {
    this.ipcRenderer.send(this.namespace, data);
  }

  get(path: string, body?: any): Promise<any> {
    return this.buildRequestHandler("get")(path, body);
  }

  post(path: string, body?: any): Promise<any> {
    return this.buildRequestHandler("post")(path, body);
  }

  put(path: string, body?: any): Promise<any> {
    return this.buildRequestHandler("put")(path, body);
  }

  patch(path: string, body?: any): Promise<any> {
    return this.buildRequestHandler("patch")(path, body);
  }

  delete(path: string, body?: any): Promise<any> {
    return this.buildRequestHandler("delete")(path, body);
  }

  private buildRequestHandler(
    method: string,
  ): (path: string, body?: any) => Promise<any> {
    return (path: string, body?: any): Promise<any> => {
      return new Promise((resolve, reject) => {
        const responseId = this.generateId();
        this.send({
          method,
          path,
          body: body || {},
          responseId,
        });

        this.ipcRenderer.on(responseId, (_: any, result: any) => {
          // 处理 Buffer 类型的 data（Electron IPC 序列化保留的 Buffer）
          let data = result.data;
          if (data && (data instanceof Uint8Array || Buffer.isBuffer(data))) {
            const str = Buffer.from(data).toString("utf-8");
            try {
              data = JSON.parse(str);
            } catch {
              data = str; // 如果不是 JSON，保留字符串
            }
          }

          const processedResult = { ...result, data };

          if (
            processedResult.statusCode >= 200 &&
            processedResult.statusCode < 300
          ) {
            resolve(processedResult);
          } else {
            reject(processedResult);
          }
        });
      });
    };
  }
}

const ipcClient = new IpcClient(ipcRenderer);

// --------- Expose some API to the Renderer process ---------
contextBridge.exposeInMainWorld("ipcRenderer", {
  on(...args: Parameters<typeof ipcRenderer.on>) {
    const [channel, listener] = args;
    return ipcRenderer.on(channel, (event, ...args) =>
      listener(event, ...args),
    );
  },
  off(...args: Parameters<typeof ipcRenderer.off>) {
    const [channel, ...omit] = args;
    return ipcRenderer.off(channel, ...omit);
  },
  send(...args: Parameters<typeof ipcRenderer.send>) {
    const [channel, ...omit] = args;
    return ipcRenderer.send(channel, ...omit);
  },
  invoke(...args: Parameters<typeof ipcRenderer.invoke>) {
    const [channel, ...omit] = args;
    return ipcRenderer.invoke(channel, ...omit);
  },
});

contextBridge.exposeInMainWorld("ipcClient", ipcClient);
