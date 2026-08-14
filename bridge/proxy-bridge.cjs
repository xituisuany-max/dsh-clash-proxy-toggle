#!/usr/bin/env node
/**
 * Clash 代理桥接服务 — 供 DSH Web GUI 的代理开关插件调用。
 *
 * 独立 Node HTTP 服务，默认监听 127.0.0.1:54123：
 *   GET  /status        查询当前状态 { on, node, delay, sysProxy, pid }
 *   GET  /nodes         列出可用节点
 *   POST /start         启动代理（clash.ps1 -SystemProxy，常驻）
 *   POST /stop          关闭代理（clash.ps1 -Stop，自动恢复系统代理）
 *   POST /node          { node: "节点名" } 切换节点
 *   GET  /health        健康检查
 * 所有响应带 CORS 头（Access-Control-Allow-Origin: *）。
 *
 * 配置（环境变量，均可选）：
 *   CLASH_PS1            clash.ps1 路径（默认：本仓库根目录 clash.ps1）
 *   CLASH_PID_FILE       托管核心 pid 文件路径（默认：本仓库 .clash-run/clash.pid）
 *   PROXY_BRIDGE_PORT    监听端口（默认 54123）
 */
"use strict";

const http = require("http");
const net = require("net");
const fs = require("fs");
const path = require("path");
const { spawn, execFile } = require("child_process");

const BRIDGE_PORT = parseInt(process.env.PROXY_BRIDGE_PORT || "54123", 10);
const PROXY_PORT = 7890;
const CTRL_URL = "http://127.0.0.1:9090";
const CLASH_PS1 = process.env.CLASH_PS1 || path.join(__dirname, "..", "clash.ps1");
const RUN_DIR = path.join(path.dirname(CLASH_PS1), ".clash-run");
const PID_FILE = process.env.CLASH_PID_FILE || path.join(RUN_DIR, "clash.pid");
const SCRIPT_PID_FILE = path.join(RUN_DIR, "clash-script.pid");
const REG_PATH = "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Internet Settings";
const LOG_FILE = path.join(__dirname, "bridge.log");

function log(msg) {
  const line = `[${new Date().toISOString()}] ${msg}`;
  try { fs.appendFileSync(LOG_FILE, line + "\n"); } catch {}
  process.stdout.write(line + "\n");
}

function httpJson(url, method, bodyObj, timeoutMs) {
  return new Promise((resolve) => {
    const u = new URL(url);
    const payload = bodyObj ? Buffer.from(JSON.stringify(bodyObj), "utf8") : null;
    const req = http.request(
      {
        host: u.hostname,
        port: u.port,
        path: u.pathname + u.search,
        method: method || "GET",
        headers: payload ? { "Content-Type": "application/json", "Content-Length": payload.length } : {},
        timeout: timeoutMs || 4000,
      },
      (res) => {
        let d = "";
        res.on("data", (c) => (d += c));
        res.on("end", () => resolve({ status: res.statusCode, body: d }));
      }
    );
    req.on("error", () => resolve({ status: 0, body: "" }));
    req.on("timeout", () => { req.destroy(); resolve({ status: 0, body: "" }); });
    if (payload) req.write(payload);
    req.end();
  });
}

function portOpen(port, timeoutMs) {
  return new Promise((resolve) => {
    const s = net.connect({ host: "127.0.0.1", port, timeout: timeoutMs || 1500 }, () => {
      s.destroy();
      resolve(true);
    });
    s.on("timeout", () => { s.destroy(); resolve(false); });
    s.on("error", () => resolve(false));
  });
}

function runPowershell(args, capture, timeoutMs) {
  return new Promise((resolve) => {
    // 注意：stdio 必须用管道（'ignore' 会让 powershell 子进程静默死亡）；且不能 detached:true（子进程会被杀）
    const child = spawn("powershell.exe", ["-NoProfile", "-ExecutionPolicy", "Bypass", ...args], {
      windowsHide: true,
      stdio: ["ignore", "pipe", "pipe"],
      detached: false,
    });
    let out = "";
    child.stdout.on("data", (c) => { if (capture) out += c; });
    child.stderr.on("data", (c) => { if (capture) out += c; });
    if (capture) {
      const timer = setTimeout(() => { child.kill(); resolve({ code: -1, out }); }, timeoutMs || 30000);
      child.on("close", (code) => { clearTimeout(timer); resolve({ code, out }); });
    } else {
      child.unref();
      resolve({ code: null, out: "" });
    }
  });
}

function readProxyEnable() {
  return new Promise((resolve) => {
    execFile(
      "reg.exe",
      ["query", REG_PATH, "/v", "ProxyEnable"],
      { windowsHide: true, timeout: 4000 },
      (err, stdout) => {
        if (err) return resolve(null);
        const m = stdout.match(/ProxyEnable\s+REG_DWORD\s+0x([0-9a-fA-F]+)/);
        resolve(m ? parseInt(m[1], 16) : null);
      }
    );
  });
}

function readPid() {
  try {
    const raw = fs.readFileSync(PID_FILE, "utf8").trim();
    const n = parseInt(raw, 10);
    return Number.isFinite(n) ? n : null;
  } catch { return null; }
}

async function getNodeName() {
  const r = await httpJson(CTRL_URL + "/proxies/GLOBAL", "GET", null, 2000);
  if (r.status !== 200) return null;
  try { return JSON.parse(r.body).now || null; } catch { return null; }
}

async function getNodeDelay(nodeName) {
  if (!nodeName) return null;
  try {
    const n = encodeURIComponent(nodeName);
    const r = await httpJson(CTRL_URL + "/proxies/" + n + "/delay?timeout=2500&url=http://www.gstatic.com/generate_204", "GET", null, 4000);
    if (r.status !== 200) return null;
    return JSON.parse(r.body).delay || null;
  } catch { return null; }
}

async function listNodes() {
  const r = await httpJson(CTRL_URL + "/proxies", "GET", null, 4000);
  if (r.status !== 200) return [];
  try {
    const proxies = JSON.parse(r.body).proxies || {};
    return Object.keys(proxies).filter((name) => {
      const t = proxies[name] && proxies[name].type;
      return ["Shadowsocks", "Vmess", "Trojan", "Hysteria", "Hysteria2", "Wireguard", "Socks5"].indexOf(t) >= 0;
    }).sort();
  } catch { return []; }
}

async function getStatus() {
  const [on, sysProxy, node, pid] = await Promise.all([
    portOpen(PROXY_PORT),
    readProxyEnable(),
    getNodeName(),
    Promise.resolve(readPid()),
  ]);
  const delay = on && node ? await getNodeDelay(node) : null;
  return { on, sysProxy: sysProxy === 1, node, delay, pid, bridge: "v1" };
}

async function startProxy() {
  await runPowershell(["-WindowStyle", "Hidden", "-File", CLASH_PS1, "-SystemProxy"], false);
  const deadline = Date.now() + 45000;
  let st = await getStatus();
  while (!st.on && Date.now() < deadline) {
    await new Promise((r) => setTimeout(r, 1500));
    st = await getStatus();
  }
  return st;
}

async function stopProxy() {
  // 先走 clash.ps1 -Stop（杀托管核心 + 恢复系统代理），再兜底杀掉任何残留核心并清理陈旧 pid
  const cmd =
    "& '" + CLASH_PS1.replace(/'/g, "''") + "' -Stop; " +
    "Get-Process clash-win64 -ErrorAction SilentlyContinue | Stop-Process -Force; " +
    "Remove-Item '" + SCRIPT_PID_FILE.replace(/'/g, "''") + "' -Force -ErrorAction SilentlyContinue";
  const r = await runPowershell(["-Command", cmd], true, 30000);
  if (r.code !== 0 && r.code !== null) log("stop exit=" + r.code + " " + r.out.slice(0, 300));
  await new Promise((r2) => setTimeout(r2, 800));
  return getStatus();
}

async function setNode(nodeName) {
  const r = await httpJson(CTRL_URL + "/proxies", "GET", null, 4000);
  if (r.status !== 200) return { ok: false, error: "controller unreachable" };
  let groups;
  try { groups = JSON.parse(r.body).proxies; } catch { return { ok: false, error: "bad controller response" }; }
  const setGroup = (name) => {
    const g = encodeURIComponent(name);
    const body = Buffer.from(JSON.stringify({ name: nodeName }), "utf8");
    return new Promise((resolve) => {
      const req = http.request(
        { host: "127.0.0.1", port: 9090, path: "/proxies/" + g, method: "PUT", headers: { "Content-Type": "application/json; charset=utf-8", "Content-Length": body.length }, timeout: 3000 },
        (res) => { res.resume(); res.on("end", () => resolve(res.statusCode)); }
      );
      req.on("error", () => resolve(0));
      req.on("timeout", () => { req.destroy(); resolve(0); });
      req.write(body);
      req.end();
    });
  };
  const applied = [];
  const keys = Object.keys(groups);
  for (const name of ["GLOBAL", ...keys]) {
    const g = groups[name];
    if (name === "GLOBAL" || (g && g.type === "Selector" && Array.isArray(g.all) && g.all.includes(nodeName))) {
      const code = await setGroup(name);
      if (code === 204) applied.push(name);
    }
  }
  return { ok: applied.length > 0, applied };
}

function json(res, code, obj) {
  const body = JSON.stringify(obj);
  res.writeHead(code, {
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Content-Length": Buffer.byteLength(body),
  });
  res.end(body);
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, "http://127.0.0.1:" + BRIDGE_PORT);
  const route = url.pathname;
  if (req.method === "OPTIONS") {
    res.writeHead(204, {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    });
    return res.end();
  }
  let body = "";
  req.on("data", (c) => (body += c));
  req.on("end", async () => {
    try {
      if (req.method === "GET" && route === "/health") return json(res, 200, { ok: true });
      if (req.method === "GET" && route === "/status") return json(res, 200, await getStatus());
      if (req.method === "GET" && route === "/nodes") return json(res, 200, { nodes: await listNodes() });
      if (req.method === "POST" && route === "/start") {
        log("start requested");
        return json(res, 200, await startProxy());
      }
      if (req.method === "POST" && route === "/stop") {
        log("stop requested");
        return json(res, 200, await stopProxy());
      }
      if (req.method === "POST" && route === "/node") {
        let payload = {};
        try { payload = JSON.parse(body || "{}"); } catch {}
        if (!payload.node) return json(res, 400, { ok: false, error: "missing node" });
        log("switch node: " + payload.node);
        return json(res, 200, await setNode(payload.node));
      }
      return json(res, 404, { ok: false, error: "not found" });
    } catch (e) {
      log("error: " + (e && e.stack || e));
      return json(res, 500, { ok: false, error: String(e && e.message || e) });
    }
  });
});

server.listen(BRIDGE_PORT, "127.0.0.1", () => {
  log("proxy-bridge listening on 127.0.0.1:" + BRIDGE_PORT);
});
