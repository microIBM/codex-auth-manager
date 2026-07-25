import net from "node:net";
import tls from "node:tls";
import {Agent, ProxyAgent, type Dispatcher} from "undici";
import {SocksClient} from "socks";

export interface ProxyDiagnostic {
  configured: boolean;
  protocol?: string;
  host?: string;
  port?: string;
}

export function createProxyDispatcher(proxyUrl: string, allowInsecureTLS = true): Dispatcher {
  const normalized = proxyUrl.trim();
  if (!normalized) {
    return new Agent({
      connect: {
        rejectUnauthorized: !allowInsecureTLS,
      },
    });
  }

  const parsedProxyUrl = new URL(normalized);
  if (parsedProxyUrl.protocol === "http:" || parsedProxyUrl.protocol === "https:") {
    return new ProxyAgent({
      uri: normalized,
      requestTls: {
        rejectUnauthorized: !allowInsecureTLS,
      },
    });
  }

  if (isSocksProtocol(parsedProxyUrl.protocol)) {
    const connect = ((options, callback) => {
      void createSocksSocket(parsedProxyUrl, options as unknown as Record<string, unknown>, allowInsecureTLS)
        .then((socket) => callback(null, socket))
        .catch((error) => callback(error instanceof Error ? error : new Error(String(error)), null));
    }) as NonNullable<ConstructorParameters<typeof Agent>[0]>["connect"];

    return new Agent({connect});
  }

  throw new Error(`不支持的代理协议: ${parsedProxyUrl.protocol}`);
}

export function summarizeProxyUrl(value: string | undefined): ProxyDiagnostic {
  const text = String(value ?? "").trim();
  if (!text) {
    return {configured: false};
  }
  try {
    const url = new URL(text);
    return {
      configured: true,
      protocol: url.protocol.replace(/:$/, ""),
      host: url.hostname,
      port: url.port || undefined,
    };
  } catch {
    return {
      configured: true,
      host: text.length > 16 ? `${text.slice(0, 8)}...${text.slice(-4)}` : text,
    };
  }
}

export function maskProxyUrl(value: string): string {
  const text = value.trim();
  if (!text) {
    return "";
  }
  try {
    const url = new URL(text);
    if (url.username) {
      url.username = "****";
    }
    if (url.password) {
      url.password = "****";
    }
    return url.toString();
  } catch {
    return text.length > 16 ? `${text.slice(0, 8)}...${text.slice(-4)}` : text;
  }
}

export function normalizeBrowserProxyUrl(value: string): string {
  const text = value.trim();
  if (!text) {
    return "";
  }
  try {
    const url = new URL(text);
    if (url.protocol === "socks5h:") {
      url.protocol = "socks5:";
    }
    return url.toString();
  } catch {
    return text;
  }
}

function isSocksProtocol(protocol: string): boolean {
  return ["socks4:", "socks4a:", "socks5:", "socks5h:"].includes(protocol);
}

async function createSocksSocket(
  proxyUrl: URL,
  options: Record<string, unknown>,
  allowInsecureTLS: boolean,
): Promise<net.Socket> {
  const destinationHost = String(options.hostname ?? "");
  const rawPort = options.port;
  const destinationPort =
    rawPort === "" || rawPort == null
      ? (options.protocol === "https:" ? 443 : 80)
      : Number(rawPort);
  const proxyPort = Number(proxyUrl.port || (proxyUrl.protocol.startsWith("socks5") ? 1080 : 1080));
  const proxyType = proxyUrl.protocol.startsWith("socks4") ? 4 : 5;

  const connection = await SocksClient.createConnection({
    proxy: {
      host: proxyUrl.hostname,
      port: proxyPort,
      type: proxyType,
      userId: proxyUrl.username ? decodeURIComponent(proxyUrl.username) : undefined,
      password: proxyUrl.password ? decodeURIComponent(proxyUrl.password) : undefined,
    },
    command: "connect",
    destination: {
      host: destinationHost,
      port: destinationPort,
    },
  });

  const socket = connection.socket;
  if (options.protocol !== "https:") {
    return socket;
  }

  return await new Promise<net.Socket>((resolve, reject) => {
    const tlsSocket = tls.connect({
      socket,
      host: String(options.servername ?? destinationHost),
      servername: String(options.servername ?? destinationHost),
      rejectUnauthorized: !allowInsecureTLS,
    });
    tlsSocket.once("secureConnect", () => resolve(tlsSocket));
    tlsSocket.once("error", reject);
  });
}
