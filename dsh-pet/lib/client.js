/* dsh-client-ui-pet v0.3.0 — 鲸鱼娘桌宠
 * 一只住在 DSH Web GUI 角落的 Q 版女仆鲸鱼娘：
 *  - 可拖动（松手吸附角落、快速甩出回弹）
 *  - 单击/长按/双击/悬停/滚轮/右键菜单 多种交互
 *  - 会话状态联动：思考/出错/完成/审批等待/任务开始/连续出错/关键词
 *  - 时间型触发：整点报时/时段问候/深夜提醒/空闲分级
 *  - 随机小动作、粒子特效、偏好持久化（localStorage）
 * 素材经桥接 /media 通道提供（127.0.0.1:54123），明暗主题自适应。 */
window.__ModuleLoader__.load({
  id: "@dsh-external/dsh-client-ui-pet",
  factory: (require) => {
    var module = { exports: {} };
    var exports = module.exports;

    var BRIDGE = (window.__DSH_PROXY_BRIDGE__ || "http://127.0.0.1:54123");
    var MARKER = "dshPetMounted";
    var SPRITE = BRIDGE + "/media/whale-pet.png";
    var SPRITE_BASE = BRIDGE + "/media/pet/";
    var PREFS_KEY = "dshPetPrefs.v3";

    // ============ 动作注册表 ============
    // prio：0=用户主动 > 1=会话状态 > 2=时间型 > 3=随机小动作；99=idle 基线
    // sleep=true 的动作只能被用户动作(prio<=0)或 idle 唤醒打断
    var ACTIONS = {
      idle:     { fps: 8,  loop: true,  prio: 99 },
      sit:      { fps: 8,  loop: true,  prio: 99 },   // 坐姿待机（吸附在输入框上方时）
      happy:    { fps: 12, loop: false, prio: 0,  particle: "heart" },
      wave:     { fps: 8,  loop: false, prio: 0 },
      sleep:    { fps: 8,  loop: true,  prio: 1,  sleep: true, particle: "zzz" },
      cry:      { fps: 8,  loop: false, prio: 1,  particle: "tear" },
      think:    { fps: 8,  loop: true,  prio: 1 },
      drag:     { fps: 8,  loop: true,  prio: 0 },
      eat:      { fps: 8,  loop: false, prio: 0 },
      dance:    { fps: 12, loop: true,  prio: 0,  particle: "note" },
      blush:    { fps: 8,  loop: false, prio: 0,  particle: "blush" },
      surprise: { fps: 8,  loop: false, prio: 1 },
      stretch:  { fps: 8,  loop: false, prio: 3 },
      angry:    { fps: 8,  loop: false, prio: 1,  particle: "anger" },
      music:    { fps: 12, loop: true,  prio: 0,  particle: "note" },
      swim:     { fps: 8,  loop: true,  prio: 0,  particle: "bubble" },
      wait:     { fps: 8,  loop: true,  prio: 1 },
    };

    // ============ 台词库（按场景） ============
    var LINES = {
      click:     ["啊呜~ 好好吃！", "今天也要加油哦~", "摸摸头~", "要吃白饭吗？", "鲸鱼娘在看着你哦~", "主人辛苦啦！", "戳我干嘛呀~", "呜哇！吓我一跳！"],
      longpress: ["呜…好舒服~", "最喜欢主人摸摸头了~", "嘿嘿，再来一下嘛~"],
      hover:     ["嗯？主人在看鲸鱼娘~", "被发现啦！", "要和我玩吗？"],
      fling:     ["呀——！飞起来了！", "呜哇哇——稳住稳住！", "扔这么远，太过分啦！"],
      wake:      ["嗯？主人叫我~", "刚梦到吃小鱼干…", "早呀主人！"],
      error:     ["呜…出错了 QAQ", "诶？好像不太对劲…", "主人，这里出问题了呜"],
      done:      ["搞定啦！🎉", "完成！快夸我！", "鲸鱼娘超厉害的~"],
      start:     ["开工啦！", "收到收到！鲸鱼娘出发！", "这个任务交给鲸鱼娘吧~"],
      waiting:   ["等主人审批中…", "怎么还没批准呀…", "鲸鱼娘等着呢~"],
      angry:     ["哼！连续出错，鲸鱼娘生气了！", "呜…怎么又失败！"],
      think_eat: ["思考也要干饭！啊呜~", "边想边吃，效率翻倍~", "干饭时间到！", "边吃边想，妙啊~"],
      greeting: {
        morning:   ["早上好呀主人！今天也要元气满满~", "早安！昨晚睡得好吗？"],
        noon:      ["中午好！记得吃午饭哦~", "午安~ 吃完饭要不要小憩一下？"],
        afternoon: ["下午好~ 工作顺利吗？", "主人下午好！鲸鱼娘在陪你哦~"],
        evening:   ["晚上好！今天辛苦啦~", "主人晚上好！要喝点热的东西吗？"],
        night:     ["夜深了…主人还在忙呀？", "熬夜冠军又出现了…"],
      },
      hourly:    ["现在 {h} 点啦~", "叮咚！{h} 点整，主人~"],
      night:     ["夜深了，主人早点休息哦~", "都这么晚了，鲸鱼娘要心疼了…"],
      idle_deep: ["呼…呼…Zzz", "呼噜…小鱼干…嗯…"],
      sleep:     ["没人理我…先睡会儿 Zzz", "困困…眯一会儿…"],
      menu:      ["主人想让我做什么呀？", "点我点我~"],
    };

    // 关键词 → 动作/台词（匹配用户新消息文本）
    var KEYWORDS = [
      { re: /睡觉|晚安|困了|去睡/, action: "sleep", line: "晚安~ 鲸鱼娘也困了 Zzz" },
      { re: /跳舞|扭一扭|蹦迪/, action: "dance", line: "那就跳一支舞吧~" },
      { re: /唱歌|唱首歌/, action: "music", line: "♪~ 鲸鱼娘开唱啦！" },
      { re: /游泳|潜水|海里/, action: "swim", line: "咕噜咕噜~ 游泳好开心！" },
      { re: /(好)?饿|吃饭|干饭|小鱼干/, action: "eat", line: "啊呜啊呜~ 好好吃！" },
      { re: /辛苦|摸摸|乖|可爱/, action: "blush", line: "呜…被夸了好害羞>///<" },
      { re: /生气|生气了|哼/, action: "angry", line: "哼！鲸鱼娘也有小脾气！" },
      { re: /挥手|你好|哈喽|hello|hi\b/i, action: "wave", line: "嗨嗨~ 主人好！" },
    ];

    var DEBUG = true;
    function dbg(msg) {
      if (DEBUG) { try { console.log("[dsh-pet] " + msg); } catch (e) {} }
    }

    // ============ 偏好持久化 ============
    var prefs = { scale: 1, opacity: 1, lines: true, hourly: true, random: true, night: true, left: null, top: null, snapId: null };
    try {
      var saved = JSON.parse(localStorage.getItem(PREFS_KEY) || "null");
      if (saved) for (var k in saved) if (k in prefs) prefs[k] = saved[k];
    } catch (e) { dbg("prefs load err: " + e.message); }
    function savePrefs() {
      try { localStorage.setItem(PREFS_KEY, JSON.stringify(prefs)); } catch (e) {}
    }

    function apply(ctx) {
      if (document.body && document.body.dataset[MARKER]) return;

      // ---------- 会话状态 ----------
      var lastRunning = false;
      var runningSince = 0;
      var angryShown = false;
      var lastUserNodeCount = 0;
      var lastUserSeq = 0;
      var greeted = false;
      var lastChimeHour = -1;
      var lastNightRemind = "";
      var sessionUnsub = null;
      var hourlyTimer = null, microTimer = null;

      // ---------- 动作管理器 ----------
      var current = { name: null, prio: 99 };
      var playing = null;      // 当前实际播放的动作名
      var resumeOnDone = null; // 用户动作打断状态动作后，播完恢复
      var afterDone = null;    // 一次性动作播完后的后续动作（如 surprise -> think）
      var frameTimer = null, frameIdx = 0, frameList = [];
      var playToken = 0;
      var currentBaseline = "idle"; // 当前基线动作（吸附输入框上方=sit，否则 idle）

      function setCurrent(name, prio) {
        current.name = name;
        current.prio = prio != null ? prio : (ACTIONS[name] ? ACTIONS[name].prio : 99);
      }

      function playAction(name, opts) {
        opts = opts || {};
        var spec = ACTIONS[name] || { fps: 8, loop: false, prio: 99 };
        var prio = opts.prio != null ? opts.prio : spec.prio;
        if (!name || name === current.name) return;
        var curSpec = ACTIONS[current.name] || {};
        var isBase = (name === "idle" || name === "sit");
        if (!isBase) {
          if (curSpec.sleep && prio > 0) return; // 睡觉只能被用户动作/唤醒打断
          if (prio > current.prio) return;       // 低优先级不能打断高优先级
        } else {
          // 基线动作（idle/sit）：允许让位切入；但睡觉时 sit 不可切入（idle 用于唤醒）
          if (curSpec.sleep && name === "sit") return;
          if (current.prio === 0) return;        // 用户动作播放中不切基线（完成回退会先置空 current）
        }
        // 用户动作打断状态动作 → 记下恢复目标
        if (current.name && current.prio === 1 && prio === 0) resumeOnDone = current.name;
        if (opts.after) afterDone = opts.after;
        var myToken = ++playToken;
        setCurrent(name, prio);
        probeFrames(name, function (frames) {
          if (myToken !== playToken) return; // 已被更新的请求取代
          if (!frames.length) {
            if (name === "idle" || name === "sit") { setStaticSprite(); return; }
            dbg("no frames for " + name + ", fallback");
            // 帧不存在：恢复被中断的状态动作或回基线，避免卡死在无帧动作上
            setCurrent(null, 99);
            if (resumeOnDone) { var r2 = resumeOnDone; resumeOnDone = null; playAction(r2, { prio: 1 }); }
            else if (afterDone) { var a2 = afterDone; afterDone = null; playAction(a2, { prio: 1 }); }
            else playAction(currentBaseline);
            return;
          }
          playing = name;
          frameList = frames;
          frameIdx = 0;
          if (frameTimer) clearInterval(frameTimer);
          var fps = spec.fps || 8;
          frameTimer = setInterval(function () {
            if (!frameList.length || playing !== name) return;
            img.src = frameList[frameIdx];
            frameIdx++;
            if (frameIdx >= frameList.length) {
              if (spec.loop) { frameIdx = 0; return; }
              clearInterval(frameTimer); frameTimer = null;
              playing = null;
              setCurrent(null, 99); // 让位：使基线/后续动作可切入
              if (afterDone) { var next = afterDone; afterDone = null; playAction(next, { prio: 1 }); }
              else if (resumeOnDone) { var r = resumeOnDone; resumeOnDone = null; playAction(r, { prio: 1 }); }
              else playAction(currentBaseline);
            }
          }, 1000 / fps);
        });
      }

      function setStaticSprite() {
        if (frameTimer) { clearInterval(frameTimer); frameTimer = null; }
        playing = null;
        img.src = SPRITE;
      }

      // ---------- 帧探测（桥接 /media/pet/<action>_0/<i>.png） ----------
      function probeFrames(action, cb) {
        var list = [];
        var dirs = [action + "_0", action];
        var dirIdx = 0;
        var probe = function (i) {
          var im = new Image();
          im.onload = function () { list.push(SPRITE_BASE + dirs[dirIdx] + "/" + i + ".png"); probe(i + 1); };
          im.onerror = function () {
            if (i === 1 && dirIdx < dirs.length - 1) { dirIdx++; probe(1); }
            else cb(list);
          };
          im.src = SPRITE_BASE + dirs[dirIdx] + "/" + i + ".png";
        };
        probe(1);
      }

      // ---------- 气泡 ----------
      function showBubble(text, ms) {
        try {
          bubble.textContent = text;
          if (!bubble.parentNode) document.body.appendChild(bubble);
          var pr = pet.getBoundingClientRect();
          bubble.style.left = (pr.left + pr.width / 2) + "px";
          bubble.style.top = (pr.top - 36) + "px";
          bubble.style.transform = "translateX(-50%)";
          bubble.style.display = "block";
          clearTimeout(bubble._t);
          bubble._t = setTimeout(function () { bubble.style.display = "none"; }, ms || 2500);
        } catch (e) {}
      }
      function say(scene, ms) {
        if (!prefs.lines) return;
        var pool = LINES[scene];
        if (!pool) return;
        if (typeof pool !== "string" && !pool.length) return;
        var text = typeof pool === "string" ? pool : pool[Math.floor(Math.random() * pool.length)];
        showBubble(text, ms || 2200);
      }
      function sayGreeting() {
        var h = new Date().getHours();
        var scene = h >= 5 && h < 11 ? "morning" : h >= 11 && h < 13 ? "noon" : h >= 13 && h < 18 ? "afternoon" : h >= 18 && h < 23 ? "evening" : "night";
        var pool = LINES.greeting[scene];
        showBubble(pool[Math.floor(Math.random() * pool.length)], 2600);
      }

      // ---------- 粒子特效 ----------
      var PARTICLE_EMOJI = {
        heart: ["❤", "💖", "💕"],
        note: ["♪", "♫", "🎵"],
        tear: ["💧"],
        bubble: ["🫧", "○"],
        blush: ["💗", ">///<"],
        anger: ["💢"],
        zzz: ["Z", "z", "💤"],
      };
      function spawnParticles(kind) {
        try {
          var emojis = PARTICLE_EMOJI[kind];
          if (!emojis) return;
          var wrap = document.createElement("div");
          wrap.setAttribute("data-dsh-pet", "fx");
          wrap.style.cssText = "position:fixed;z-index:2147483646;pointer-events:none;left:" + (pet.getBoundingClientRect().left + pet.getBoundingClientRect().width / 2) + "px;top:" + (pet.getBoundingClientRect().top + 20) + "px;";
          var n = 5 + Math.floor(Math.random() * 3);
          for (var i = 0; i < n; i++) {
            var s = document.createElement("span");
            s.textContent = emojis[Math.floor(Math.random() * emojis.length)];
            var ang = -Math.PI / 2 + (Math.random() - 0.5) * 1.6;
            var dist = 40 + Math.random() * 55;
            var dx = Math.cos(ang) * dist, dy = Math.sin(ang) * dist;
            var size = 14 + Math.random() * 10;
            s.style.cssText = "position:absolute;font-size:" + size + "px;opacity:1;animation:dshPetFx 1.1s ease-out forwards;";
            s.style.setProperty("--dx", dx.toFixed(1) + "px");
            s.style.setProperty("--dy", dy.toFixed(1) + "px");
            wrap.appendChild(s);
          }
          document.body.appendChild(wrap);
          setTimeout(function () { if (wrap.parentNode) wrap.parentNode.removeChild(wrap); }, 1300);
        } catch (e) {}
      }
      function fxFor(name) {
        var spec = ACTIONS[name];
        if (spec && spec.particle) spawnParticles(spec.particle);
      }
      function playActionFx(name, opts) {
        playAction(name, opts);
        fxFor(name);
      }

      // ---------- 空闲分级 ----------
      var IDLE_MS = 90 * 1000;
      var IDLE_DEEP_MS = 5 * 60 * 1000;
      var IDLE_CHECK_MS = 5000;
      var lastUserActivity = Date.now();
      var idleTimer = null;
      var deepSlept = false;
      function countUserNodes(nodes) {
        var c = 0;
        for (var i = 0; i < nodes.length; i++) if (nodes[i] && nodes[i].kind === "user") c++;
        return c;
      }
      function startIdleCheck() {
        if (idleTimer) clearInterval(idleTimer);
        idleTimer = setInterval(function () {
          try {
            var now = Date.now();
            if (now - lastUserActivity > IDLE_MS && !lastRunning && current.name !== "sleep" && current.name !== "drag" && current.name !== "think") {
              playActionFx("sleep", { prio: 1 });
              if (!deepSlept) showBubble(LINES.sleep[Math.floor(Math.random() * LINES.sleep.length)], 2600);
            }
            if (now - lastUserActivity > IDLE_DEEP_MS && deepSlept !== true && current.name === "sleep") {
              deepSlept = true;
              say("idle_deep", 2200);
            }
            if (now - lastUserActivity <= IDLE_MS) deepSlept = false;
          } catch (e) { dbg("idle err: " + e.message); }
        }, IDLE_CHECK_MS);
      }

      // ---------- 时间型触发 ----------
      function hourlyTick() {
        var d = new Date();
        var h = d.getHours();
        var dateStr = d.toLocaleDateString();
        // 整点报时
        if (prefs.hourly && h !== lastChimeHour) {
          lastChimeHour = h;
          var pool = LINES.hourly;
          showBubble(pool[Math.floor(Math.random() * pool.length)].replace("{h}", h), 2400);
        }
        // 深夜提醒（每天一次）
        if (prefs.night && (h >= 23 || h < 6) && lastNightRemind !== dateStr) {
          lastNightRemind = dateStr;
          var pool2 = LINES.night;
          showBubble(pool2[Math.floor(Math.random() * pool2.length)], 3000);
          if (Math.random() < 0.5 && current.prio > 0 && current.name !== "sleep") playActionFx("sleep", { prio: 2 });
        }
      }

      // ---------- 随机小动作 + 思考干饭 ----------
      var nextMicroAt = Date.now() + 40000;
      var eatCheckAt = Date.now() + 30000; // 思考干饭的检查点
      function microTick() {
        if (!prefs.random) return;
        var now = Date.now();
        // 思考中偶尔干饭：思考稳定 10s 后，每 8-15s 掷一次骰（40% 概率），
        // 触发后冷却 30-60s；eat(0) 打断 think(1) 会自动记 resumeOnDone=think，吃完继续思考
        if (lastRunning && current.name === "think" && now >= eatCheckAt && now - runningSince > 10000) {
          eatCheckAt = now + 8000 + Math.random() * 7000;
          if (Math.random() < 0.4) {
            eatCheckAt = now + 30000 + Math.random() * 30000;
            dbg("think -> eat (偶发干饭)");
            playActionFx("eat", { prio: 0 });
            if (prefs.lines) showBubble(LINES.think_eat[Math.floor(Math.random() * LINES.think_eat.length)], 2000);
          }
          return;
        }
        if (now < nextMicroAt) return;
        if (now - lastUserActivity < 20000) { nextMicroAt = now + 30000; return; }
        if (current.name !== "idle" && current.name !== "think") { nextMicroAt = now + 20000; return; }
        nextMicroAt = now + 40000 + Math.random() * 50000;
        var pool = ["stretch", "blush", "wave"];
        var pick = pool[Math.floor(Math.random() * pool.length)];
        playActionFx(pick, { prio: 3 });
      }

      // ---------- 会话联动 ----------
      function extractUserTexts(nodes) {
        var texts = [];
        for (var i = 0; i < nodes.length; i++) {
          var n = nodes[i];
          if (!n || n.kind !== "user" || !n.content) continue;
          if (n.seq != null && n.seq <= lastUserSeq) continue;
          for (var j = 0; j < n.content.length; j++) {
            var b = n.content[j];
            if (b && b.type === "text" && typeof b.text === "string" && b.text.trim()) texts.push(b.text.trim());
          }
          if (n.seq != null) lastUserSeq = n.seq;
        }
        return texts;
      }
      function matchKeywords(texts) {
        for (var t = 0; t < texts.length; t++) {
          for (var k = 0; k < KEYWORDS.length; k++) {
            if (KEYWORDS[k].re.test(texts[t])) {
              dbg("keyword -> " + KEYWORDS[k].action + " (" + texts[t].slice(0, 30) + ")");
              playActionFx(KEYWORDS[k].action, { prio: 0 });
              if (prefs.lines) showBubble(KEYWORDS[k].line, 2400);
              return;
            }
          }
        }
      }
      function hookSession(s) {
        if (!s || typeof s.subscribe !== "function") { dbg("no session face"); return; }
        if (sessionUnsub) { try { sessionUnsub(); } catch (e) {} sessionUnsub = null; }
        var firstSnap = true;
        try {
          sessionUnsub = s.subscribe(function () {
            var snap;
            try { snap = s.getSnapshot ? s.getSnapshot() : null; } catch (e) { snap = null; }
            if (!snap) return;
            var running = !!snap.running;
            var nodes = snap.nodes || [];
            // 用户活动检测 + 关键词
            var userCount = countUserNodes(nodes);
            if (userCount > lastUserNodeCount) {
              lastUserActivity = Date.now();
              dbg("user activity, reset idle");
              if (!greeted) { greeted = true; sayGreeting(); }
              if (current.name === "sleep") {
                setCurrent(null, 99); // 唤醒：绕过 sleep 守卫，回到当前基线（站姿/坐姿）
                playAction(currentBaseline);
                say("wake", 1800);
              }
              // 首次快照只登记 seq，不重放历史消息的关键词
              if (!firstSnap) {
                try { matchKeywords(extractUserTexts(nodes)); } catch (e) { dbg("kw err: " + e.message); }
              }
            }
            lastUserNodeCount = userCount;
            if (firstSnap) {
              firstSnap = false;
              // 登记当前已见过的最大 user seq，避免挂载时把旧消息当新指令
              for (var fi = 0; fi < nodes.length; fi++) {
                var fn = nodes[fi];
                if (fn && fn.kind === "user" && fn.seq != null && fn.seq > lastUserSeq) lastUserSeq = fn.seq;
              }
            }
            // 错误/工具统计（仅本 turn：time >= runningSince）
            var turnHasError = false;
            var errCount = 0, toolCount = 0;
            for (var i = 0; i < nodes.length; i++) {
              var n = nodes[i];
              if (!n) continue;
              if (n.time != null && n.time < runningSince) continue;
              if (n.kind === "turn-error") { turnHasError = true; errCount++; }
              if (n.kind === "tool-result") {
                toolCount++;
                if (n.isError) { turnHasError = true; errCount++; }
              }
            }
            // 审批等待（snap.pending: PendingInteraction[]）
            var pendingArr = snap.pending;
            var waitingApproval = !!(pendingArr && pendingArr.length);
            // 任务开始
            if (running && !lastRunning) {
              runningSince = Date.now();
              angryShown = false;
              dbg("task start -> surprise");
              playActionFx("surprise", { prio: 1, after: "think" });
              showBubble(LINES.start[Math.floor(Math.random() * LINES.start.length)], 2200);
            } else if (running) {
              // 长任务：60s 后从 think 切 wait
              if (current.name === "think" && Date.now() - runningSince > 60000) {
                playAction("wait", { prio: 1 });
              }
              // 审批等待 → wait；审批结束 → 回 think
              if (waitingApproval) {
                if (current.name !== "wait") {
                  playAction("wait", { prio: 1 });
                  if (prefs.lines) showBubble(LINES.waiting[Math.floor(Math.random() * LINES.waiting.length)], 2200);
                }
              } else if (current.name === "wait") {
                playAction("think", { prio: 1 });
              }
            }
            // 连续出错 → angry（每 turn 一次）
            if (running && errCount >= 2 && !angryShown) {
              angryShown = true;
              playActionFx("angry", { prio: 1 });
              say("angry", 2400);
            }
            if (!running && lastRunning) {
              // turn 结束
              if (turnHasError) {
                dbg("turn ended with error -> cry");
                say("error", 2600);
                playActionFx("cry", { prio: 1 });
              } else {
                var celebrate = toolCount >= 3 && Math.random() < 0.3;
                if (celebrate) {
                  dbg("turn finished -> dance");
                  showBubble("完美！跳个舞庆祝~ 🎶", 2600);
                  playActionFx("dance", { prio: 1 });
                } else {
                  dbg("turn finished -> happy");
                  say("done", 2600);
                  playActionFx("happy", { prio: 1 });
                }
              }
            } else if (!running && (current.name === "think" || current.name === "wait")) {
              playAction(currentBaseline);
            }
            lastRunning = running;
          });
          dbg("session hooked: " + (s.sessionId || "?"));
        } catch (e) { dbg("hook error: " + e.message); }
      }
      function hookSessions() {
        try {
          var sessions;
          try { sessions = ctx.get ? ctx.get("sessions") : undefined; } catch (e) { sessions = undefined; }
          if (!sessions) { dbg("ctx.get sessions unavailable"); return; }
          var list = sessions.list;
          if (!list || typeof list.subscribe !== "function") { dbg("no list.subscribe"); return; }
          var connectCurrent = function () {
            var snap = list.getSnapshot ? list.getSnapshot() : null;
            var currentId = snap ? snap.current : undefined;
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
          setTimeout(connectCurrent, 300);
          dbg("sessions hooked");
        } catch (e) { dbg("sessions hook error: " + e.message); }
      }

      // ---------- 页面可见性 ----------
      var hiddenSince = 0;
      function onVisibility() {
        if (document.hidden) {
          hiddenSince = Date.now();
          return;
        }
        // 恢复可见：离开较久 → 小概率 surprise + 欢迎
        if (hiddenSince && Date.now() - hiddenSince > 10000 && current.prio > 0) {
          playActionFx("surprise", { prio: 1 });
          showBubble("欢迎回来~ 鲸鱼娘想你了！", 2400);
        }
        hiddenSince = 0;
      }
      function onBlur() {
        dbg("window blur -> wave");
        playAction("wave", { prio: 0 });
      }

      // ---------- 桌宠元素 ----------
      var pet = document.createElement("div");
      pet.setAttribute("data-dsh-pet", "root");
      pet.style.cssText = [
        "position:fixed", "right:24px", "bottom:20px", "z-index:99999",
        "width:" + Math.round(130 * prefs.scale) + "px", "cursor:grab", "user-select:none",
        "opacity:" + prefs.opacity,
      ].join(";");
      // 位置恢复在 mount() 中执行（需 pet 挂载后才能取真实尺寸与输入框位置）
      // （旧版本 prefs 无 snapId 时按绝对坐标恢复，同样在 mount 中处理）

      var bubble = document.createElement("div");
      bubble.setAttribute("data-dsh-pet", "bubble");
      bubble.id = "dshPetBubbleGlobal";
      bubble.style.cssText = [
        "position:fixed", "display:none", "z-index:2147483647", "top:-9999px", "left:-9999px",
        "background:var(--dsw-alias-bg-module-platform,#ffffff)",
        "border:1px solid var(--dsw-alias-border-l2,rgba(77,107,254,.3))",
        "border-radius:10px", "padding:6px 10px", "font-size:12px",
        "color:var(--dsw-alias-label-primary,#1c2333)",
        "white-space:nowrap", "box-shadow:0 4px 12px rgba(0,0,0,.12)",
        "pointer-events:none",
      ].join(";");
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

      // ---------- 样式 ----------
      var style = document.createElement("style");
      style.textContent = [
        "[data-dsh-pet='root']:active{cursor:grabbing}",
        "[data-dsh-pet='fx'] span{display:block;transform:translate(0,0);animation:dshPetFx 1.1s ease-out forwards}",
        "@keyframes dshPetFx{0%{opacity:1;transform:translate(0,0) scale(.7)}100%{opacity:0;transform:translate(var(--dx),var(--dy)) scale(1.15)}}",
        "[data-dsh-pet='menu'],[data-dsh-pet='panel']{font-size:12px;color:var(--dsw-alias-label-primary,#1c2333);background:var(--dsw-alias-bg-module-platform,#fff);border:1px solid var(--dsw-alias-border-l2,rgba(77,107,254,.3));border-radius:10px;box-shadow:0 6px 20px rgba(0,0,0,.18);padding:6px;z-index:2147483646}",
        "[data-dsh-pet='menu'] div{padding:5px 12px;border-radius:6px;cursor:pointer;white-space:nowrap}",
        "[data-dsh-pet='menu'] div:hover{background:var(--dsw-alias-bg-hover,rgba(77,107,254,.1))}",
        "[data-dsh-pet='menu'] .sep{border-top:1px solid var(--dsw-alias-border-l2,rgba(77,107,254,.2));margin:4px 2px;padding:0!important;cursor:default}",
        "[data-dsh-pet='menu'] .sep:hover{background:none}",
        "[data-dsh-pet='panel']{position:fixed;right:16px;top:16px;width:230px;padding:12px 14px}",
        "[data-dsh-pet='panel'] h4{margin:0 0 8px;font-size:13px}",
        "[data-dsh-pet='panel'] label{display:flex;justify-content:space-between;align-items:center;margin:6px 0;gap:8px}",
        "[data-dsh-pet='panel'] input[type=range]{width:120px}",
        "[data-dsh-pet='panel'] .row{display:flex;gap:8px;margin-top:10px}",
        "[data-dsh-pet='panel'] button{flex:1;padding:4px 8px;border:1px solid var(--dsw-alias-border-l2,rgba(77,107,254,.3));border-radius:6px;background:var(--dsw-alias-bg-module-platform,#fff);color:var(--dsw-alias-label-primary,#1c2333);cursor:pointer;font-size:12px}",
        "[data-dsh-pet='panel'] button:hover{background:var(--dsw-alias-bg-hover,rgba(77,107,254,.1))}",
        "[data-dsh-pet='chip']{position:fixed;right:16px;bottom:16px;z-index:99999;cursor:pointer;font-size:20px;opacity:.6;filter:grayscale(.4)}",
        "[data-dsh-pet='chip']:hover{opacity:1;filter:none}",
      ].join("");
      document.head.appendChild(style);

      // ---------- 拖动 + 吸附 + 甩出 ----------
      var dragging = false, moved = false, longPressed = false;
      var startX = 0, startY = 0, origX = 0, origY = 0;
      var lastMove = { x: 0, y: 0, t: 0 };
      var pressTimer = null, hoverTimer = null;
      var hoverFiredAt = 0;

      // ---------- 多吸附点：4 角 + 输入框上方 ----------
      // 找聊天输入框（composer）：优先底部区域的 textarea，取最大可见者
      function findComposerRect() {
        try {
          var cands = [];
          var tareas = document.querySelectorAll("textarea");
          for (var i = 0; i < tareas.length; i++) {
            var r = tareas[i].getBoundingClientRect();
            if (!r || r.width < 80 || r.height < 16) continue;
            if (r.bottom < window.innerHeight - 500) continue; // 只认底部区域（composer 在底部）
            cands.push(r);
          }
          if (!cands.length) return null;
          var best = cands[0];
          for (var j = 1; j < cands.length; j++) {
            if (cands[j].width * cands[j].height > best.width * best.height) best = cands[j];
          }
          return best;
        } catch (e) { return null; }
      }
      // 候选吸附点：{id, x, y, weight}（weight<1 表示更易吸附）
      function snapPoints() {
        var r = pet.getBoundingClientRect();
        var ww = window.innerWidth, wh = window.innerHeight;
        var m = 16;
        var pts = [
          { id: "corner-tl", x: m, y: m, weight: 1 },
          { id: "corner-tr", x: ww - r.width - m, y: m, weight: 1 },
          { id: "corner-bl", x: m, y: wh - r.height - m, weight: 1 },
          { id: "corner-br", x: ww - r.width - m, y: wh - r.height - m, weight: 1 },
        ];
        var cr = findComposerRect();
        if (cr) {
          var gap = 8;
          var topY = cr.top - r.height - gap;
          if (topY < 4) topY = 4;
          pts.push({ id: "composer-tl", x: cr.left + gap, y: topY, weight: 0.8 });
          pts.push({ id: "composer-tc", x: cr.left + (cr.width - r.width) / 2, y: topY, weight: 0.85 });
          pts.push({ id: "composer-tr", x: cr.right - r.width - gap, y: topY, weight: 0.8 });
        }
        return pts;
      }
      function applySnap(pt, animate) {
        if (animate) pet.style.transition = "left .25s cubic-bezier(.34,1.56,.64,1), top .25s cubic-bezier(.34,1.56,.64,1)";
        pet.style.left = pt.x + "px";
        pet.style.top = pt.y + "px";
        setTimeout(function () { pet.style.transition = ""; }, 300);
        prefs.snapId = pt.id;
        prefs.left = pt.x; prefs.top = pt.y;
        savePrefs();
        // 按吸附点切换基线动作（输入框上方→坐姿，其余→站姿）；guard 自行裁决是否可切
        var base = (prefs.snapId.indexOf("composer") === 0) ? "sit" : "idle";
        if (base !== currentBaseline) {
          currentBaseline = base;
          if (current.name !== base) playAction(base);
        }
      }
      function snapToNearest(animate) {
        var r = pet.getBoundingClientRect();
        var cx = r.left + r.width / 2, cy = r.top + r.height / 2;
        var pts = snapPoints();
        var nearest = pts[0], minD = 1e9;
        pts.forEach(function (p) {
          var d = Math.sqrt(Math.pow(cx - (p.x + r.width / 2), 2) + Math.pow(cy - (p.y + r.height / 2), 2)) * (p.weight || 1);
          if (d < minD) { minD = d; nearest = p; }
        });
        applySnap(nearest, animate);
        return nearest;
      }
      // 布局变化（窗口缩放/输入框移动）时，若吸附在输入框上则重新对齐
      function onResize() {
        if (!prefs.snapId || prefs.snapId.indexOf("composer") !== 0) return;
        var pts = snapPoints();
        for (var i = 0; i < pts.length; i++) {
          if (pts[i].id === prefs.snapId) { applySnap(pts[i], false); return; }
        }
      }

      pet.addEventListener("mousedown", function (e) {
        if (e.button !== 0) return;
        closeMenu(); closePanel();
        dragging = true;
        moved = false;
        longPressed = false;
        startX = e.clientX; startY = e.clientY;
        var r = pet.getBoundingClientRect();
        origX = r.left; origY = r.top;
        pet.style.right = "auto"; pet.style.bottom = "auto";
        pet.style.left = origX + "px"; pet.style.top = origY + "px";
        lastMove = { x: e.clientX, y: e.clientY, t: Date.now() };
        // 长按 600ms
        if (pressTimer) clearTimeout(pressTimer);
        pressTimer = setTimeout(function () {
          pressTimer = null;
          if (dragging && !moved) {
            longPressed = true;
            dbg("longpress -> blush");
            playActionFx("blush", { prio: 0 });
            say("longpress", 2000);
          }
        }, 600);
      });
      function onWinMove(e) {
        if (!dragging) return;
        var dx = e.clientX - startX, dy = e.clientY - startY;
        if (Math.abs(dx) > 4 || Math.abs(dy) > 4) {
          if (!moved) {
            moved = true;
            if (pressTimer) { clearTimeout(pressTimer); pressTimer = null; }
            if (current.name !== "drag") playAction("drag", { prio: 0 });
          }
        }
        if (!moved) return;
        pet.style.left = (origX + dx) + "px";
        pet.style.top = (origY + dy) + "px";
        lastMove = { x: e.clientX, y: e.clientY, t: Date.now() };
      }
      function onWinUp(e) {
        if (!dragging) return;
        dragging = false;
        if (pressTimer) { clearTimeout(pressTimer); pressTimer = null; }
        if (!moved) {
          if (!longPressed) scheduleClick();
          longPressed = false;
          return;
        }
        // 甩出判定：最后一次 mousemove 到 mouseup 的位移速度 > 1.2px/ms
        var dt = Date.now() - lastMove.t;
        var dist = Math.sqrt(Math.pow(e.clientX - lastMove.x, 2) + Math.pow(e.clientY - lastMove.y, 2));
        var v = dt > 0 ? dist / dt : 0;
        if (v > 1.2) {
          dbg("fling v=" + v.toFixed(2));
          playActionFx("swim", { prio: 0 });
          say("fling", 2200);
          setTimeout(function () { setCurrent(null, 99); playAction(currentBaseline); snapToNearest(true); }, 900);
          return;
        }
        if (current.name === "drag") { setCurrent(null, 99); playAction(currentBaseline); }
        snapToNearest(false);
        longPressed = false;
      }
      window.addEventListener("mousemove", onWinMove);
      window.addEventListener("mouseup", onWinUp);

      // 单击/双击区分
      var clickTimer = null;
      function scheduleClick() {
        if (clickTimer) clearTimeout(clickTimer);
        clickTimer = setTimeout(function () {
          clickTimer = null;
          if (!greeted) { greeted = true; sayGreeting(); }
          playActionFx("happy", { prio: 0 });
          say("click", 2200);
        }, 260);
      }
      pet.addEventListener("click", function (e) { e.stopPropagation(); });

      // 双击循环切换
      var EXTRA_ACTIONS = ["wave", "sleep", "cry", "dance", "angry", "blush"];
      var EXTRA_NAMES = { wave: "挥手打招呼~", sleep: "有点困了…Zzz", cry: "呜…QAQ", dance: "来跳支舞~", angry: "哼！生气了！", blush: "呜…好害羞>///<" };
      var extraIdx = -1;
      pet.addEventListener("dblclick", function () {
        if (clickTimer) { clearTimeout(clickTimer); clickTimer = null; }
        extraIdx = (extraIdx + 1) % EXTRA_ACTIONS.length;
        var name = EXTRA_ACTIONS[extraIdx];
        playActionFx(name, { prio: 0 });
        showBubble(EXTRA_NAMES[name], 1800);
      });

      // 悬停 1.5s
      pet.addEventListener("mouseenter", function () {
        if (hoverTimer) clearTimeout(hoverTimer);
        hoverTimer = setTimeout(function () {
          hoverTimer = null;
          var now = Date.now();
          if (now - hoverFiredAt < 30000) return;
          if (current.name !== "idle" && current.name !== "think") return;
          if (Math.random() < 0.5) {
            hoverFiredAt = now;
            playAction("wave", { prio: 0 });
            say("hover", 2000);
          }
        }, 1500);
      });
      pet.addEventListener("mouseleave", function () {
        if (hoverTimer) { clearTimeout(hoverTimer); hoverTimer = null; }
      });

      // 滚轮缩放
      pet.addEventListener("wheel", function (e) {
        e.preventDefault();
        var step = e.deltaY < 0 ? 0.05 : -0.05;
        prefs.scale = Math.min(1.5, Math.max(0.8, (prefs.scale || 1) + step));
        pet.style.width = Math.round(130 * prefs.scale) + "px";
        savePrefs();
      }, { passive: false });

      // ---------- 右键菜单 ----------
      var menu = null, panel = null, chip = null;
      function closeMenu() { if (menu && menu.parentNode) menu.parentNode.removeChild(menu); menu = null; }
      function closePanel() { if (panel && panel.parentNode) panel.parentNode.removeChild(panel); panel = null; }
      function menuItem(label, onClick) {
        var d = document.createElement("div");
        d.textContent = label;
        d.addEventListener("click", function (e) { e.stopPropagation(); closeMenu(); onClick(); });
        return d;
      }
      function openMenu(x, y) {
        closeMenu();
        menu = document.createElement("div");
        menu.setAttribute("data-dsh-pet", "menu");
        menu.style.position = "fixed";
        menu.style.left = Math.min(x, window.innerWidth - 160) + "px";
        menu.style.top = Math.min(y, window.innerHeight - 240) + "px";
        // 动作点播
        var order = ["happy", "wave", "sleep", "cry", "think", "eat", "dance", "blush", "surprise", "stretch", "angry", "music", "swim", "wait", "drag"];
        var names = { happy: "开心", wave: "挥手", sleep: "睡觉", cry: "哭哭", think: "思考", eat: "干饭", dance: "跳舞", blush: "害羞", surprise: "惊吓", stretch: "伸懒腰", angry: "生气", music: "唱歌", swim: "游泳", wait: "等待", drag: "拖拽" };
        var sub = document.createElement("div");
        sub.textContent = "🎬 动作点播 ▸";
        sub.style.fontWeight = "600";
        sub.addEventListener("click", function (e) {
          e.stopPropagation();
          var list = document.createElement("div");
          list.setAttribute("data-dsh-pet", "menu");
          list.style.position = "fixed";
          list.style.left = Math.min(menu.getBoundingClientRect().left + 120, window.innerWidth - 140) + "px";
          list.style.top = menu.getBoundingClientRect().top + "px";
          order.forEach(function (a) {
            list.appendChild(menuItem("▶ " + names[a], function () { playActionFx(a, { prio: 0 }); showBubble("「" + names[a] + "」", 1500); }));
          });
          document.body.appendChild(list);
          setTimeout(function () { closeMenu(); }, 120);
          document.addEventListener("click", function h() {
            document.removeEventListener("click", h);
            setTimeout(function () { if (list.parentNode) list.parentNode.removeChild(list); }, 50);
          });
        });
        menu.appendChild(sub);
        var sep = document.createElement("div"); sep.className = "sep"; menu.appendChild(sep);
        menu.appendChild(menuItem("⚙ 设置…", openPanel));
        menu.appendChild(menuItem("📍 重置位置", function () { applySnap({ id: "corner-br", x: window.innerWidth - pet.getBoundingClientRect().width - 16, y: window.innerHeight - pet.getBoundingClientRect().height - 16 }, true); }));
        menu.appendChild(menuItem("🙈 隐藏桌宠", hidePet));
        document.body.appendChild(menu);
        // 点击外部关闭
        setTimeout(function () {
          document.addEventListener("click", function h() {
            document.removeEventListener("click", h);
            closeMenu(); closePanel();
          });
        }, 50);
      }
      pet.addEventListener("contextmenu", function (e) {
        e.preventDefault();
        if (!greeted) { greeted = true; sayGreeting(); }
        openMenu(e.clientX, e.clientY);
      });

      // ---------- 设置面板 ----------
      function openPanel() {
        closePanel();
        panel = document.createElement("div");
        panel.setAttribute("data-dsh-pet", "panel");
        var h = document.createElement("h4"); h.textContent = "🐳 鲸鱼娘设置";
        panel.appendChild(h);
        function row(label, input) {
          var l = document.createElement("label");
          var span = document.createElement("span"); span.textContent = label;
          l.appendChild(span); l.appendChild(input);
          return l;
        }
        // 大小
        var size = document.createElement("input");
        size.type = "range"; size.min = "80"; size.max = "150"; size.step = "5";
        size.value = Math.round(prefs.scale * 100);
        size.addEventListener("input", function () {
          prefs.scale = parseInt(size.value, 10) / 100;
          pet.style.width = Math.round(130 * prefs.scale) + "px";
          savePrefs();
        });
        panel.appendChild(row("大小 " + Math.round(prefs.scale * 100) + "%", size));
        // 透明度
        var op = document.createElement("input");
        op.type = "range"; op.min = "30"; op.max = "100"; op.step = "5";
        op.value = Math.round(prefs.opacity * 100);
        op.addEventListener("input", function () {
          prefs.opacity = parseInt(op.value, 10) / 100;
          pet.style.opacity = prefs.opacity;
          savePrefs();
        });
        panel.appendChild(row("透明度 " + Math.round(prefs.opacity * 100) + "%", op));
        // 开关
        function toggle(label, key) {
          var c = document.createElement("input");
          c.type = "checkbox"; c.checked = !!prefs[key];
          c.addEventListener("change", function () { prefs[key] = c.checked; savePrefs(); });
          panel.appendChild(row(label, c));
        }
        toggle("台词气泡", "lines");
        toggle("整点报时", "hourly");
        toggle("随机小动作", "random");
        toggle("深夜提醒", "night");
        // 按钮
        var rowB = document.createElement("div"); rowB.className = "row";
        var b1 = document.createElement("button"); b1.textContent = "重置位置";
        b1.addEventListener("click", function () { applySnap({ id: "corner-br", x: window.innerWidth - pet.getBoundingClientRect().width - 16, y: window.innerHeight - pet.getBoundingClientRect().height - 16 }, true); });
        var b2 = document.createElement("button"); b2.textContent = "隐藏";
        b2.addEventListener("click", hidePet);
        var b3 = document.createElement("button"); b3.textContent = "关闭";
        b3.addEventListener("click", closePanel);
        rowB.appendChild(b1); rowB.appendChild(b2); rowB.appendChild(b3);
        panel.appendChild(rowB);
        document.body.appendChild(panel);
      }

      // ---------- 隐藏 / 恢复 ----------
      function hidePet() {
        closeMenu(); closePanel();
        pet.style.display = "none";
        if (!chip) {
          chip = document.createElement("div");
          chip.setAttribute("data-dsh-pet", "chip");
          chip.textContent = "🐳";
          chip.title = "点击唤出鲸鱼娘";
          chip.addEventListener("click", function () {
            pet.style.display = "";
            if (chip.parentNode) chip.parentNode.removeChild(chip);
            chip = null;
            say("wake", 2000);
          });
          document.body.appendChild(chip);
        }
      }

      // ---------- 挂载 ----------
      function mount() {
        if (!document.body) { setTimeout(mount, 200); return; }
        if (document.body.dataset[MARKER]) return;
        document.body.appendChild(pet);
        document.body.dataset[MARKER] = "1";
        // 挂载后恢复吸附位置（此时才能拿到真实尺寸/输入框位置）
        if (prefs.snapId) {
          var pts0 = snapPoints();
          var snapFound = false;
          for (var pi = 0; pi < pts0.length; pi++) {
            if (pts0[pi].id === prefs.snapId) {
              pet.style.left = pts0[pi].x + "px";
              pet.style.top = pts0[pi].y + "px";
              snapFound = true;
              break;
            }
          }
          if (snapFound && prefs.snapId.indexOf("composer") === 0) currentBaseline = "sit";
        } else if (prefs.left != null && prefs.top != null) {
          pet.style.left = prefs.left + "px";
          pet.style.top = prefs.top + "px";
        }
        initSprites();
        document.addEventListener("visibilitychange", onVisibility);
        window.addEventListener("blur", onBlur);
        window.addEventListener("resize", onResize);
        hookSessions();
        startIdleCheck();
        // 时间型定时器（每 20s 检查整点/深夜）
        hourlyTimer = setInterval(hourlyTick, 20000);
        lastChimeHour = new Date().getHours();
        try { lastNightRemind = new Date().toLocaleDateString(); } catch (e) {}
        microTimer = setInterval(microTick, 10000);
        if (DEBUG) { try { showBubble("🐳 鲸鱼娘 v0.3 就绪", 2500); } catch (e) {} }
      }
      function initSprites() {
        // 走 playAction 的 token 机制，避免与后续动作的帧探测竞态
        playAction(currentBaseline);
      }
      mount();

      ctx.effect(function () {
        return function () {
          if (pet.parentNode) pet.parentNode.removeChild(pet);
          if (bubble.parentNode) bubble.parentNode.removeChild(bubble);
          if (style.parentNode) style.parentNode.removeChild(style);
          if (menu && menu.parentNode) menu.parentNode.removeChild(menu);
          if (panel && panel.parentNode) panel.parentNode.removeChild(panel);
          if (chip && chip.parentNode) chip.parentNode.removeChild(chip);
          if (sessionUnsub) { try { sessionUnsub(); } catch (e) {} sessionUnsub = null; }
          if (idleTimer) { clearInterval(idleTimer); idleTimer = null; }
          if (hourlyTimer) { clearInterval(hourlyTimer); hourlyTimer = null; }
          if (microTimer) { clearInterval(microTimer); microTimer = null; }
          if (frameTimer) { clearInterval(frameTimer); frameTimer = null; }
          if (pressTimer) clearTimeout(pressTimer);
          if (hoverTimer) clearTimeout(hoverTimer);
          if (clickTimer) clearTimeout(clickTimer);
          window.removeEventListener("mousemove", onWinMove);
          window.removeEventListener("mouseup", onWinUp);
          window.removeEventListener("resize", onResize);
          document.removeEventListener("visibilitychange", onVisibility);
          window.removeEventListener("blur", onBlur);
          delete document.body.dataset[MARKER];
        };
      });
    }

    exports.apply = apply;
    return module.exports;
  },
});
