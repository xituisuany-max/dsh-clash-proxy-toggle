# dsh-reload.ps1 - Lightweight GUI refresh via Chrome DevTools Protocol.
# Requires the app to be started with --remote-debugging-port=9222 (see dsh-restart.ps1).
# If CDP is not available, exits with code 1 (caller should fall back to a full restart).
param([int]$Port = 9222)

$node = Join-Path $env:LOCALAPPDATA 'Programs\DeepSeek Harness Desktop\resources\harness\runtime\node.exe'
if (-not (Test-Path $node)) { $node = 'node' }

$code = @'
const http = require('http');
const port = Number(process.argv[1] || 9222);
http.get(`http://127.0.0.1:${port}/json`, (res) => {
  let d = '';
  res.on('data', (c) => (d += c));
  res.on('end', () => {
    try {
      const list = JSON.parse(d);
      const page = list.find((t) => t.type === 'page' && t.webSocketDebuggerUrl);
      if (!page) { console.log('NO_PAGE'); process.exit(1); }
      const ws = new WebSocket(page.webSocketDebuggerUrl);
      const done = (msg, code) => { try { ws.close(); } catch (e) {} console.log(msg); process.exit(code); };
      ws.onopen = () => ws.send(JSON.stringify({ id: 1, method: 'Runtime.evaluate', params: { expression: 'location.reload()' } }));
      ws.onmessage = () => done('RELOADED', 0);
      ws.onerror = () => done('WS_ERROR', 1);
      setTimeout(() => done('TIMEOUT', 1), 5000);
    } catch (e) { console.log('PARSE_ERR'); process.exit(1); }
  });
}).on('error', () => { console.log('NO_CDP'); process.exit(1); });
'@

$out = & $node -e $code $Port 2>&1
Write-Host $out
if ($out -match 'RELOADED') { exit 0 }
exit 1
