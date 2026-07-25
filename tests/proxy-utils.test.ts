import assert from "node:assert/strict";
import {maskProxyUrl, normalizeBrowserProxyUrl, summarizeProxyUrl} from "../src/core/proxy.js";

assert.equal(
  maskProxyUrl("http://user:pass@proxy.example.com:8000"),
  "http://****:****@proxy.example.com:8000/",
);
assert.equal(
  normalizeBrowserProxyUrl("socks5h://user:pass@proxy.example.com:1080"),
  "socks5://user:pass@proxy.example.com:1080",
);

const summary = summarizeProxyUrl("socks5h://user:pass@proxy.example.com:1080");
assert.equal(summary.configured, true);
assert.equal(summary.protocol, "socks5h");
assert.equal(summary.host, "proxy.example.com");
assert.equal(summary.port, "1080");
