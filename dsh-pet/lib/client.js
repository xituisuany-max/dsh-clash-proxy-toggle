/* dsh-client-ui-pet — 鲸鱼娘桌宠
 * 一只住在 DSH Web GUI 角落的 Q 版女仆鲸鱼娘：
 *  - 可拖动（松手自动吸附最近的屏幕角）
 *  - 单击：蹦跳 + 随机台词气泡；双击：切换动作
 * 素材经桥接 /media 通道提供（127.0.0.1:54123），明暗主题自适应。 */
window.__ModuleLoader__.load({
  id: "@dsh-external/dsh-client-ui-pet",
  factory: (require) => {
    var module = { exports: {} };
    var exports = module.exports;

    var BRIDGE = (window.__DSH_PROXY_BRIDGE__ || "http://127.0.0.1:54123");
    var MARKER = "dshPetMounted";
    var SPRITE = BRIDGE + "/media/whale-pet.png";
    // ---------- 序列帧引擎 ----------
    // 帧目录：sprites/<action>_<n>/1.png 2.png ...（DeskPet 规范）
    // 由桥接 /media 提供；无帧时回退静态图 SPRITE
    var SPRITE_BASE = BRIDGE + "/media/pet/";
    var ACTIONS = {
      idle:  { fps: 8,  loop: true  },
      happy: { fps: 12, loop: false },
      wave:  { fps: 8,  loop: false },
      sleep: { fps: 8,  loop: true  },
      cry:   { fps: 8,  loop: false },
    };
    var frameTimer = null, currentAction = "idle", frameIdx = 0, frameList = [];

    // 随机台词
    var LINES = [
      "啊呜~ 好好吃！",
      "今天也要加油哦~",
      "摸摸头~",
      "要吃白饭吗？",
      "鲸鱼娘在看着你哦~",
      "主人辛苦啦！",
    ];

    function apply(ctx) {
      if (document.body && document.body.dataset[MARKER]) return;

      // ---------- 工作状态联动 ----------
      // 完成工作 -> happy；出错 -> cry；用户离开 -> wave
      var DEBUG = true;
      var lastProbeShown = "";
      function dbg(msg) {
        if (DEBUG) {
          try { console.log("[dsh-pet] " + msg); } catch (e) {}
        }
      }
      // 把关键状态显示到气泡（用户可见，用于验证）
      function showBubbleText(text, ms) {
        try {
          bubble.textContent = text;
          if (!bubble.parentNode) document.body.appendChild(bubble);
          var pr = pet.getBoundingClientRect();
          bubble.style.left = (pr.left + pr.width / 2) + "px";
          bubble.style.top = (pr.top - 36) + "px";
          bubble.style.transform = "translateX(-50%)";
          bubble.style.display = "block";
          setTimeout(function () { bubble.style.display = "none"; }, ms || 2500);
        } catch (e) {}
      }

      // 会话状态联动（ctx.sessions 由 dsh-client-runtime 提供，若不可用则跳过）
      var lastRunning = false;
      var lastErrorSeqs = [];
      var sessionUnsub = null;
      // 空闲检测：长时间无用户指令 -> 困困
      var IDLE_MS = 90 * 1000;          // 90 秒无指令视为空闲
      var IDLE_CHECK_MS = 5000;         // 每 5 秒检查一次
      var lastUserActivity = Date.now();
      var lastUserNodeCount = 0;
      var idleTimer = null;
      function countUserNodes(nodes) {
        var c = 0;
        for (var i = 0; i < nodes.length; i++) {
          if (nodes[i] && nodes[i].kind === "user") c++;
        }
        return c;
      }
      function startIdleCheck() {
        if (idleTimer) clearInterval(idleTimer);
        idleTimer = setInterval(function () {
          try {
            var now = Date.now();
            if (now - lastUserActivity > IDLE_MS && !lastRunning && currentAction !== "sleep") {
              dbg("idle -> sleep");
              playAction("sleep");
              showBubbleText("没人理我…先睡会儿 Zzz", 2600);
            }
          } catch (e) { dbg("idle err: " + e.message); }
        }, IDLE_CHECK_MS);
      }
      function hookSession(s) {
        if (!s || typeof s.subscribe !== "function") { dbg("no session face"); return; }
        if (sessionUnsub) { try { sessionUnsub(); } catch (e) {} sessionUnsub = null; }
        try {
          sessionUnsub = s.subscribe(function () {
            var snap;
            try { snap = s.getSnapshot ? s.getSnapshot() : null; } catch (e) { snap = null; }
            if (!snap) return;
            var running = !!snap.running;
            var nodes = snap.nodes || [];
            // 用户活动检测：user 节点数增加 = 用户发了新指令
            var userCount = countUserNodes(nodes);
            if (userCount > lastUserNodeCount) {
              lastUserActivity = Date.now();
              dbg("user activity, reset idle");
              // 若正在睡觉则唤醒回 idle
              if (currentAction === "sleep") {
                playAction("idle");
                showBubbleText("嗯？主人叫我~", 1800);
              }
            }
            lastUserNodeCount = userCount;
            // 出错检测：turn-error 或 tool-result.error 或 command outcome error
            var hasError = false;
            for (var i = 0; i < nodes.length; i++) {
              var n = nodes[i];
              if (!n) continue;
              if (n.kind === "turn-error") { hasError = true; break; }
              if (n.kind === "tool-result" && n.error) { hasError = true; break; }
              if (n.kind === "command" && n.outcome && n.outcome.kind === "error") { hasError = true; break; }
            }
            if (hasError) {
              dbg("error node detected -> cry");
              showBubbleText("呜…出错了 QAQ", 2600);
              playAction("cry");
            } else if (lastRunning && !running) {
              // turn 刚结束且无错误 -> 完成 -> happy
              dbg("turn finished -> happy");
              showBubbleText("搞定啦！🎉", 2600);
              playAction("happy");
            }
            lastRunning = running;
          });
          dbg("session hooked: " + (s.sessionId || "?"));
        } catch (e) { dbg("hook error: " + e.message); }
      }
      function hookSessions() {
        try {
          // 用 ctx.get("sessions") 可选查找（不触发 inject 门控，失败返回 undefined）
          var sessions;
          try { sessions = ctx.get ? ctx.get("sessions") : undefined; } catch (e) { sessions = undefined; }
          if (!sessions) { dbg("ctx.get sessions unavailable"); return; }
          // 探测结构
          var probe = {};
          try { probe.keys = Object.keys(sessions).slice(0, 30); } catch (e) { probe.keysErr = e.message; }
          try { probe.listType = typeof sessions.list; } catch (e) { probe.listErr = e.message; }
          try { probe.bindingType = typeof sessions.binding; } catch (e) { probe.bindingErr = e.message; }
          try { probe.scopeType = typeof sessions.scope; } catch (e) { probe.scopeErr = e.message; }
          try { probe.current = sessions.list ? sessions.list.getSnapshot().current : undefined; } catch (e) { probe.currentErr = e.message; }
          dbg("sessions probe: " + JSON.stringify(probe));
          try { showBubbleText("🐳 联动就绪 " + (sessions ? "S" : "noS"), 3000); } catch (e) {}

          var list = sessions.list;
          if (!list || typeof list.subscribe !== "function") { dbg("no list.subscribe"); return; }
          var connectCurrent = function () {
            var snap = list.getSnapshot ? list.getSnapshot() : null;
            var currentId = snap ? snap.current : undefined;
            dbg("current=" + currentId);
            var cur = undefined;
            try {
              if (currentId && typeof sessions.binding === "function") {
                var b = sessions.binding(currentId);
                cur = b && b.session;
              }
            } catch (e) { dbg("binding err: " + e.message); }
            if (!cur && currentId && typeof sessions.scope === "function") {
              try { cur = sessions.scope(currentId); } catch (e) { dbg("scope err: " + e.message); }
            }
            hookSession(cur);
          };
          list.subscribe(connectCurrent);
          // 初始立即连接当前会话（subscribe 只在变化时回调）
          setTimeout(connectCurrent, 300);
          dbg("sessions hooked");
        } catch (e) { dbg("sessions hook error: " + e.message); }
      }

      // 用户离开：页面隐藏或窗口失焦 -> wave（注册延迟到 mount，避免元素未就绪时触发）
      var leftTimer = null;
      function onLeave() {
        if (document.hidden) {
          dbg("page hidden -> wave");
          playAction("wave");
        }
      }
      function onBlur() {
        dbg("window blur -> wave");
        playAction("wave");
      }

      // ---------- 桌宠元素 ----------
      var pet = document.createElement("div");
      pet.setAttribute("data-dsh-pet", "root");
      pet.style.cssText = [
        "position:fixed", "right:24px", "bottom:20px", "z-index:99999",
        "width:130px", "cursor:grab", "user-select:none",
      ].join(";");

      var bubble = document.createElement("div");
      bubble.setAttribute("data-dsh-pet", "bubble");
      bubble.style.cssText = [
        "position:fixed", "display:none", "z-index:2147483647", "top:-9999px", "left:-9999px",
        "background:var(--dsw-alias-bg-module-platform,#ffffff)",
        "border:1px solid var(--dsw-alias-border-l2,rgba(77,107,254,.3))",
        "border-radius:10px", "padding:6px 10px", "font-size:12px",
        "color:var(--dsw-alias-label-primary,#1c2333)",
        "white-space:nowrap", "box-shadow:0 4px 12px rgba(0,0,0,.12)",
        "pointer-events:none",
      ].join(";");
      // 气泡小尾巴
      bubble.style.setProperty("--tail", "");
      var tail = document.createElement("div");
      tail.style.cssText = [
        "position:absolute", "top:100%", "left:50%", "transform:translateX(-50%)",
        "border:6px solid transparent", "border-top-color:var(--dsw-alias-bg-module-platform,#ffffff)",
      ].join(";");
      bubble.appendChild(tail);

      var img = document.createElement("img");
      img.setAttribute("data-dsh-pet", "img");
      img.src = SPRITE;
      img.alt = "鲸鱼娘桌宠";
      img.draggable = false;
      img.style.cssText = [
        "width:100%", "display:block", "pointer-events:none",
        "filter:drop-shadow(0 6px 12px rgba(0,0,0,.18))",
      ].join(";");

      pet.appendChild(img);
      // 气泡独立挂 body 顶层（脱离 pet 的 transform 上下文）
      bubble.id = "dshPetBubbleGlobal";

      // ---------- 样式 ----------
      var style = document.createElement("style");
      style.textContent = [
        "[data-dsh-pet='root']:active{cursor:grabbing}",
      ].join("");
      document.head.appendChild(style);

      // ---------- 拖动 + 吸附角落 ----------
      var dragging = false, moved = false, startX = 0, startY = 0, origX = 0, origY = 0;
      pet.addEventListener("mousedown", function (e) {
        if (e.button !== 0) return;
        dragging = true;
        moved = false;
        startX = e.clientX; startY = e.clientY;
        var r = pet.getBoundingClientRect();
        origX = r.left; origY = r.top;
        pet.style.right = "auto"; pet.style.bottom = "auto";
        pet.style.left = origX + "px"; pet.style.top = origY + "px";
        // 不 preventDefault，保证 click 事件能触发
      });
      window.addEventListener("mousemove", function (e) {
        if (!dragging) return;
        var dx = e.clientX - startX, dy = e.clientY - startY;
        if (Math.abs(dx) > 4 || Math.abs(dy) > 4) moved = true;
        if (!moved) return;
        pet.style.left = (origX + dx) + "px";
        pet.style.top = (origY + dy) + "px";
      });
      window.addEventListener("mouseup", function () {
        if (!dragging) return;
        dragging = false;
        if (!moved) { onPetClick(); return; }
        var r = pet.getBoundingClientRect();
        var ww = window.innerWidth, wh = window.innerHeight;
        var cx = r.left + r.width / 2, cy = r.top + r.height / 2;
        var corners = [
          { x: 16, y: 16 },
          { x: ww - r.width - 16, y: 16 },
          { x: 16, y: wh - r.height - 16 },
          { x: ww - r.width - 16, y: wh - r.height - 16 },
        ];
        var nearest = corners[0], minD = 1e9;
        corners.forEach(function (c) {
          var d = Math.sqrt(Math.pow(cx - (c.x + r.width / 2), 2) + Math.pow(cy - (c.y + r.height / 2), 2));
          if (d < minD) { minD = d; nearest = c; }
        });
        pet.style.left = nearest.x + "px";
        pet.style.top = nearest.y + "px";
        pet.style.transition = "left .2s ease, top .2s ease";
        setTimeout(function () { pet.style.transition = ""; }, 250);
      });

      // ---------- 点击：蹦跳 + 气泡 ----------
      // ---------- 序列帧播放 ----------
      // 尝试加载某动作的帧列表（桥接 /media/pet/<action>/<i>.png）
      function probeFrames(action, cb) {
        var list = [];
        // 先试 <action>_0（DeskPet 规范），没有再试 <action>
        var dirs = [action + "_0", action];
        var dirIdx = 0, frameDir = dirs[0];
        var probe = function (i) {
          var img = new Image();
          img.onload = function () { list.push(SPRITE_BASE + frameDir + "/" + i + ".png"); probe(i + 1); };
          img.onerror = function () {
            if (i === 1 && dirIdx < dirs.length - 1) {
              dirIdx++; frameDir = dirs[dirIdx]; probe(1);  // 换目录重试
            } else { cb(list); }
          };
          img.src = SPRITE_BASE + frameDir + "/" + i + ".png";
        };
        probe(1);
      }
      function playAction(action) {
        probeFrames(action, function (frames) {
          if (!frames.length) { setStaticSprite(); return; }
          frameList = frames;
          currentAction = action;
          frameIdx = 0;
          if (frameTimer) clearInterval(frameTimer);
          var fps = ACTIONS[action] ? ACTIONS[action].fps : 8;
          frameTimer = setInterval(function () {
            if (!frameList.length) return;
            img.src = frameList[frameIdx];
            frameIdx++;
            if (frameIdx >= frameList.length) {
              if (ACTIONS[action] && ACTIONS[action].loop) frameIdx = 0;
              else { clearInterval(frameTimer); frameTimer = null; playAction("idle"); }
            }
          }, 1000 / fps);
        });
      }
      function setStaticSprite() {
        if (frameTimer) { clearInterval(frameTimer); frameTimer = null; }
        img.src = SPRITE;
      }
      function initSprites() {
        // 有帧则播放 idle，否则静态图
        probeFrames("idle", function (frames) {
          if (frames.length) { frameList = frames; playAction("idle"); }
          else setStaticSprite();
        });
      }
      // 点击时播放 happy（播完回 idle）
      function playHappy() {
        probeFrames("happy", function (frames) {
          if (frames.length) playAction("happy");
        });
      }

      function onPetClick() {
        playHappy();
        // 气泡
        bubble.textContent = LINES[Math.floor(Math.random() * LINES.length)];
        if (!bubble.parentNode) document.body.appendChild(bubble);
        var pr = pet.getBoundingClientRect();
        bubble.style.left = (pr.left + pr.width / 2) + "px";
        bubble.style.top = (pr.top - 36) + "px";
        bubble.style.transform = "translateX(-50%)";
        bubble.style.display = "block";
        setTimeout(function () { bubble.style.display = "none"; }, 2200);
      }
      // 单击/双击区分：click 延迟 260ms 执行，dblclick 取消待定的单击
      var clickTimer = null;
      function scheduleClick() {
        if (clickTimer) clearTimeout(clickTimer);
        clickTimer = setTimeout(function () {
          clickTimer = null;
          onPetClick();
        }, 260);
      }
      pet.addEventListener("click", scheduleClick);

      // ---------- 双击切换动作（wave/sleep/cry 循环）----------
      var EXTRA_ACTIONS = ["wave", "sleep", "cry"];
      var extraIdx = -1;
      pet.addEventListener("dblclick", function () {
        if (clickTimer) { clearTimeout(clickTimer); clickTimer = null; }
        extraIdx = (extraIdx + 1) % EXTRA_ACTIONS.length;
        playAction(EXTRA_ACTIONS[extraIdx]);
        // 气泡提示当前动作
        var names = { wave: "挥手打招呼~", sleep: "有点困了…Zzz", cry: "呜…QAQ" };
        bubble.textContent = names[EXTRA_ACTIONS[extraIdx]];
        if (!bubble.parentNode) document.body.appendChild(bubble);
        var pr = pet.getBoundingClientRect();
        bubble.style.left = (pr.left + pr.width / 2) + "px";
        bubble.style.top = (pr.top - 36) + "px";
        bubble.style.transform = "translateX(-50%)";
        bubble.style.display = "block";
        setTimeout(function () { bubble.style.display = "none"; }, 1800);
      });

      // ---------- 挂载 ----------
      function mount() {
        if (!document.body) { setTimeout(mount, 200); return; }
        if (document.body.dataset[MARKER]) return;
        document.body.appendChild(pet);
        document.body.dataset[MARKER] = "1";
        initSprites();
        document.addEventListener("visibilitychange", onLeave);
        window.addEventListener("blur", onBlur);
        hookSessions();
        startIdleCheck();
      }
      mount();

      ctx.effect(function () {
        return function () {
          if (pet.parentNode) pet.parentNode.removeChild(pet);
          if (bubble.parentNode) bubble.parentNode.removeChild(bubble);
          if (style.parentNode) style.parentNode.removeChild(style);
          if (sessionUnsub) { try { sessionUnsub(); } catch (e) {} sessionUnsub = null; }
          if (idleTimer) { clearInterval(idleTimer); idleTimer = null; }
          document.removeEventListener("visibilitychange", onLeave);
          window.removeEventListener("blur", onBlur);
          delete document.body.dataset[MARKER];
        };
      });
    }

    exports.apply = apply;
    return module.exports;
  },
});
