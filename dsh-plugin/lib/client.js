/* dsh-client-ui-proxy-toggle — 右上角小鲸鱼代理开关（悬停显示详情面板）
 * 风格与 DSH Web GUI 一致：使用 --dsw-alias-* 主题变量，明暗模式自适应。 */
window.__ModuleLoader__.load({
  id: "@dsh-external/dsh-client-ui-proxy-toggle",
  factory: (require) => {
    var module = { exports: {} };
    var exports = module.exports;

    // 桥接服务地址：可用 window.__DSH_PROXY_BRIDGE__ 覆盖（默认本机 54123）
    var BRIDGE = (window.__DSH_PROXY_BRIDGE__ || "http://127.0.0.1:54123");
    var POLL_MS = 2000;
    var MARKER = "dshProxyToggleMounted";
    var CLIP_ID = "dsh-proxy-whale-clip";
    // 官方 DeepSeek 鲸鱼（FishLogo）路径
    var WHALE_PATH =
      "M22.9168 1.43018C22.6713 1.31018 22.5658 1.53918 22.4223 1.65519C22.3733 1.69269 22.3318 1.74169 22.2903 1.78669C21.9317 2.1697 21.5127 2.42121 20.9657 2.39121C20.1657 2.34621 19.4827 2.59771 18.8787 3.20973C18.7502 2.45521 18.3236 2.0047 17.6746 1.71569C17.3351 1.56568 16.9916 1.41518 16.7536 1.08867C16.5876 0.856163 16.5421 0.597155 16.4591 0.341647C16.4061 0.187643 16.3536 0.0301382 16.1761 0.00363739C15.9836 -0.0263635 15.9081 0.135141 15.8326 0.270145C15.5306 0.822162 15.4136 1.43018 15.4251 2.0462C15.4516 3.43174 16.0366 4.53527 17.1991 5.3203C17.3311 5.4103 17.3651 5.5003 17.3236 5.63181C17.2441 5.90231 17.1501 6.16482 17.0671 6.43533C17.0141 6.60784 16.9351 6.64584 16.7501 6.57033C16.1121 6.30383 15.5611 5.90931 15.074 5.4328C14.2475 4.63328 13.5 3.75075 12.568 3.05973C12.349 2.89822 12.13 2.74822 11.9034 2.60522C10.9524 1.68169 12.028 0.923165 12.277 0.833162C12.5375 0.739159 12.3675 0.41615 11.5259 0.42015C10.6844 0.42365 9.91439 0.705658 8.93286 1.08117C8.78935 1.13767 8.63835 1.17867 8.48384 1.21267C7.59332 1.04367 6.66829 1.00617 5.70226 1.11517C3.88321 1.31768 2.43016 2.1777 1.36213 3.64575C0.0790928 5.4103 -0.222916 7.41536 0.146595 9.50642C0.535106 11.7105 1.66014 13.535 3.38869 14.9616C5.18125 16.4406 7.24581 17.1657 9.60138 17.0266C11.0319 16.9441 12.6245 16.7526 14.421 15.2321C14.874 15.4576 15.3496 15.5476 16.1381 15.6151C16.7456 15.6716 17.3306 15.5851 17.7836 15.4911C18.4931 15.3411 18.4441 14.6841 18.1876 14.5636C16.1081 13.595 16.5646 13.9891 16.1496 13.67C17.2061 12.42 18.8202 10.1979 19.3182 7.17235C19.3672 6.83834 19.4297 6.36783 19.4222 6.09732C19.4182 5.93231 19.4562 5.86831 19.6447 5.84931C20.1657 5.78931 20.6712 5.64681 21.1357 5.3913C22.4833 4.65528 23.0268 3.44624 23.1548 1.9972C23.1738 1.77569 23.1508 1.54668 22.9168 1.43018ZM11.1749 14.4736C9.15936 12.889 8.18184 12.3675 7.77832 12.39C7.40081 12.4125 7.46881 12.8445 7.55182 13.126C7.63882 13.404 7.75182 13.5955 7.91033 13.8396C8.01983 14.0011 8.09533 14.2411 7.80083 14.4216C7.15181 14.8231 6.02327 14.2866 5.97027 14.2601C4.65673 13.4865 3.5587 12.4655 2.78467 11.069C2.03715 9.72493 1.60314 8.28289 1.53164 6.74384C1.51264 6.37233 1.62214 6.24082 1.99215 6.17332C2.47916 6.08332 2.98118 6.06432 3.46769 6.13582C5.52476 6.43633 7.27581 7.35586 8.74385 8.8129C9.58188 9.64243 10.2159 10.634 10.8689 11.6025C11.5634 12.631 12.3105 13.611 13.262 14.4146C13.598 14.6961 13.866 14.9101 14.1225 15.0681C13.349 15.1546 12.058 15.1731 11.1749 14.4746L11.1749 14.4736ZM12.141 8.25988C12.141 8.09488 12.273 7.96338 12.439 7.96338C12.4765 7.96338 12.5105 7.97088 12.541 7.98188C12.5825 7.99688 12.6205 8.01938 12.6505 8.05338C12.7035 8.10588 12.7335 8.18088 12.7335 8.25988C12.7335 8.42489 12.6015 8.55639 12.4355 8.55639C12.2695 8.55639 12.141 8.42489 12.141 8.25988ZM15.1415 9.79893C14.949 9.87793 14.7565 9.94544 14.5715 9.95294C14.2845 9.96794 13.9715 9.85143 13.8015 9.70893C13.5375 9.48742 13.3485 9.36342 13.2695 8.97691C13.2355 8.8119 13.2545 8.55639 13.2845 8.40989C13.3525 8.09438 13.277 7.89187 13.0545 7.70787C12.8735 7.55786 12.643 7.51636 12.39 7.51636C12.2955 7.51636 12.209 7.47486 12.1445 7.44136C12.039 7.38886 11.9519 7.25735 12.035 7.09585C12.0615 7.04335 12.19 6.91584 12.22 6.89334C12.5635 6.69784 12.9595 6.76184 13.326 6.90834C13.6655 7.04735 13.9225 7.30236 14.292 7.66287C14.6695 8.09838 14.7375 8.21838 14.9525 8.54539C15.1225 8.8009 15.277 9.06341 15.3831 9.36392C15.4471 9.55142 15.3641 9.70493 15.1415 9.79893Z";

    var GREEN = "#3fae6a";
    var AMBER = "#d9a441";
    // 官方鲸鱼路径由 4 个子路径组成：主体、肚子(镂空)、眼睛、鳍部细节
    var WHALE_PARTS = WHALE_PATH.split(/(?=M)/);
    var WHALE_BODY_NO_BELLY = WHALE_PARTS.length >= 4 ? WHALE_PARTS[0] + WHALE_PARTS[2] + WHALE_PARTS[3] : WHALE_PATH;
    var WHALE_BELLY = WHALE_PARTS.length >= 4 ? WHALE_PARTS[1] : "";

    function apply(ctx) {
      if (document.body && document.body.dataset[MARKER]) return;

      var state = { on: null, node: "", delay: null, sysProxy: false, busy: false, bridgeDown: false, nodes: [] };
      var hideTimer = null;

      // ---------- 鲸鱼按钮 ----------
      var btn = document.createElement("button");
      btn.type = "button";
      btn.setAttribute("data-proxy-toggle", "btn");
      btn.title = "代理开关：点击切换，悬停查看详情";
      btn.setAttribute("aria-label", "代理开关");
      btn.style.cssText = [
        "position:fixed", "top:100px", "right:14px", "z-index:9999",
        "width:44px", "height:44px", "padding:0",
        "display:flex", "align-items:center", "justify-content:center",
        "border-radius:13px", "border:1px solid transparent", "cursor:pointer",
        "background:transparent", "transition:background .15s,border-color .15s,transform .12s",
      ].join(";");

      // ---------- 拖拽上传任意文件（视频/音频/文档/压缩包 → 输入框附件） ----------
      // 通用附件注入：任意格式文件 → 模拟粘贴进输入框（与截图同一机制，支持多文件）
      function attachFilesToComposer(files) {
        var C = findComposer();
        var input = C ? (C.querySelector("textarea") || C.querySelector("[contenteditable='true']") || C.querySelector("input[type='text']")) : null;
        if (!input) {
          diag("file attach: composer input not found");
          alert("未找到输入框，请稍后重试");
          return;
        }
        try {
          var dt = new DataTransfer();
          var oversized = [];
          files.forEach(function (f) {
            // 超 200MB 提示（浏览器/组件常见限制）
            if (f.size > 200 * 1024 * 1024) { oversized.push(f.name + " (" + Math.round(f.size / 1048576) + "MB)"); }
            dt.items.add(f);
          });
          if (oversized.length) {
            alert("以下文件超过 200MB，可能无法作为附件发送：\n" + oversized.join("\n"));
          }
          var ev = new ClipboardEvent("paste", { clipboardData: dt, bubbles: true, cancelable: true });
          input.dispatchEvent(ev);
          diag("files attached: " + files.map(function (f) { return f.name + "(" + f.size + ")"; }).join(" | "));


        } catch (e) {
          diag("file attach error: " + e.message);
        }
      }

      // document 级兜底：即使 composer 定位失败，也拦截文件拖放
      function hookDocumentDrop() {
        if (document.documentElement.dataset.dshFileDropDocHooked) return;
        document.documentElement.dataset.dshFileDropDocHooked = "1";
        ["dragover", "dragenter"].forEach(function (evName) {
          document.addEventListener(evName, function (e) {
            if (e.dataTransfer && Array.prototype.indexOf.call(e.dataTransfer.types, "Files") >= 0) {
              e.preventDefault();
              e.stopPropagation();
              e.dataTransfer.dropEffect = "copy";
            }
          }, true);
        });
        document.addEventListener("drop", function (e) {
          if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length) {
            var files = Array.prototype.slice.call(e.dataTransfer.files);
            // 若事件已被 composer 层处理（已 preventDefault 且已注入），这里不再重复
            var handled = e.defaultPrevented;
            if (!handled) {
              e.preventDefault();
              e.stopPropagation();
              attachFilesToComposer(files);
            }
          }
        }, true);
        diag("document drop hooked");
      }

      // 拦截 composer 区域的文件拖放（解决"拖文件进输入框没反应"）
      function hookComposerDrop() {
        var C = findComposer();
        if (!C || C.dataset.dshFileDropHooked) return;
        C.dataset.dshFileDropHooked = "1";
        ["dragover", "dragenter"].forEach(function (evName) {
          C.addEventListener(evName, function (e) {
            if (e.dataTransfer && Array.prototype.indexOf.call(e.dataTransfer.types, "Files") >= 0) {
              e.preventDefault();
              e.stopPropagation();
              e.dataTransfer.dropEffect = "copy";
              C.style.outline = "2px dashed var(--dsw-alias-accent,rgba(77,107,254,.6))";
            }
          }, true);
        });
        C.addEventListener("dragleave", function () { C.style.outline = ""; }, true);
        C.addEventListener("drop", function (e) {
          if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length) {
            e.preventDefault();
            e.stopPropagation();
            C.style.outline = "";
            var files = Array.prototype.slice.call(e.dataTransfer.files);
            attachFilesToComposer(files);
          }
        }, true);
        diag("composer drop hooked");
      }

      // ---------- 截图按钮（QQ 风格：放在聊天输入框左按钮行） ----------
      var shotBtn = document.createElement("button");
      shotBtn.type = "button";
      shotBtn.setAttribute("data-proxy-toggle", "shotbtn");
      shotBtn.title = "截屏：一键截取屏幕区域，自动放入输入框";
      shotBtn.setAttribute("aria-label", "截屏");
      // 矢量相机图标（保证任何系统都正常显示，不依赖 emoji 字体）
      shotBtn.innerHTML = '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>';
      var SHOTBTN_INLINE = [
        "width:26px", "height:26px", "padding:0", "flex:none",
        "display:inline-flex", "align-items:center", "justify-content:center",
        "border-radius:7px", "border:1px solid transparent", "cursor:pointer",
        "background:transparent", "color:var(--dsw-alias-label-secondary,#4a5670)",
        "transition:background .15s,border-color .15s",
      ].join(";");
      shotBtn.style.cssText = SHOTBTN_INLINE;

      // ---------- 强刷按钮（等价 Ctrl+F5：清缓存 + 重载） ----------
      var refBtn = document.createElement("button");
      refBtn.type = "button";
      refBtn.setAttribute("data-proxy-toggle", "refbtn");
      refBtn.title = "强制刷新页面（等价 Ctrl+F5，加载插件最新代码）";
      refBtn.setAttribute("aria-label", "强制刷新");
      refBtn.innerHTML = '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>';
      // 纯白样式（顶栏深色背景上醒目）
      var REFBTN_INLINE = [
        "width:26px", "height:26px", "padding:0", "flex:none",
        "display:inline-flex", "align-items:center", "justify-content:center",
        "border-radius:7px", "cursor:pointer",
        "color:#ffffff", "background:rgba(255,255,255,.14)",
        "border:1px solid rgba(255,255,255,.30)",
        "transition:background .15s,border-color .15s",
      ].join(";");
      refBtn.style.cssText = REFBTN_INLINE;
      refBtn.addEventListener("click", hardRefresh);

      function hardRefresh() {
        // 1) 清 Cache Storage（脚本/样式缓存）
        try {
          if (window.caches) {
            caches.keys().then(function (ks) {
              return Promise.all(ks.map(function (k) { return caches.delete(k); }));
            }).catch(function () {});
          }
        } catch (e) {}
        // 2) 带新鲜参数重载（强制重新请求所有资源）
        var u = location.href.split("#")[0];
        var sep = u.indexOf("?") >= 0 ? "&" : "?";
        location.href = u + sep + "_r=" + Date.now();
      }


      function findComposer() {
        var C = document.querySelector("[data-composer-card]");
        if (!C) {
          var all = document.querySelectorAll("[class*='composer' i]");
          for (var i = 0; i < all.length; i++) {
            var el = all[i];
            if (el.offsetParent !== null &&
                (el.querySelector("textarea") || el.querySelector("[contenteditable='true']") || el.querySelector("[data-input-mirror]"))) {
              C = el; break;
            }
          }
        }
        if (!C) {
          // 更宽泛：直接找输入元素，向上找含附件/发送按钮的容器
          var input = document.querySelector("[contenteditable='true']") || document.querySelector("textarea");
          if (input) {
            var up = input.parentElement;
            for (var k = 0; k < 5 && up; k++) {
              if (up.querySelector("[class*='attach' i], [class*='send' i], [title*='发送'], [title*='附件']")) { C = up; break; }
              up = up.parentElement;
            }
            if (!C) C = input.closest("[data-composer-card], [class*='composer' i]") || input.parentElement;
          }
        }
        return C;
      }
      var composerShotMounted = false;
      var fallbackMounted = false;
      // 截图按钮固定圆形样式（白底金边，与 + / 盾牌圆形按钮一致，保证可见）
      var SHOTBTN_CIRCLE = [
        "width:28px", "height:28px", "padding:0", "flex:none",
        "display:inline-flex", "align-items:center", "justify-content:center",
        "border-radius:50%", "cursor:pointer",
        "background:var(--dsw-alias-bg-module-platform,#ffffff)",
        "border:1px solid var(--dsw-alias-border-l2,rgba(176,141,79,.6))",
        "color:var(--dsw-alias-label-secondary,#4a5670)",
        "transition:background .15s,border-color .15s",
      ].join(";");
      function diag(msg) {
        try { fetch(BRIDGE + "/debug", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ msg: msg }), cache: "no-store" }).catch(function () {}); } catch (e) {}
      }
      // 复制源按钮的样式（大小/圆角/背景/边框/颜色随主题自动统一），图标按按钮尺寸缩放
      function copyButtonStyle(srcBtn, dstBtn) {
        try {
          var cs = window.getComputedStyle(srcBtn);
          dstBtn.style.width = cs.width;
          dstBtn.style.height = cs.height;
          dstBtn.style.borderRadius = cs.borderRadius;
          dstBtn.style.background = cs.backgroundColor;
          dstBtn.style.border = cs.border;
          dstBtn.style.color = cs.color;
          dstBtn.style.padding = cs.padding;
          dstBtn.style.margin = cs.margin;
          dstBtn.style.display = "inline-flex";
          dstBtn.style.alignItems = "center";
          dstBtn.style.justifyContent = "center";
          dstBtn.style.flex = "none";
          var svg = dstBtn.querySelector("svg");
          if (svg && cs.width) {
            var w = parseFloat(cs.width);
            if (w > 18 && w < 60) {
              var icon = Math.round(w * 0.45);
              svg.setAttribute("width", String(icon));
              svg.setAttribute("height", String(icon));
            }
          }
        } catch (e) {}
      }
      // 识别"+"附件按钮（文字为 + 或含加号 SVG）
      function isPlusBtn(b) {
        var t = (b.textContent || "").replace(/\s/g, "");
        if (t === "+") return true;
        var h = (b.innerHTML || "");
        return /M12 5v14|M5 12h14|lucide-plus|icon-plus/i.test(h) || /plus|add/i.test(b.className || "");
      }
      // 识别盾牌按钮（盾牌 SVG 路径 / shield 类名）
      function isShieldBtn(b) {
        var h = (b.innerHTML || "");
        return /M12 22s8-4 8-10V5l-8-3|M20 13c0 5-3\.5 7\.5-7\.66 8\.95|shield/i.test(h) || /shield/i.test(b.className || "");
      }
      function mountComposerShotButton() {
        if (composerShotMounted) return;
        var C = findComposer();
        diag("mount attempt: composer=" + !!C);
        if (!C) return;
        // 若在兜底位置，先移出
        if (fallbackMounted && shotBtn.parentNode) shotBtn.parentNode.removeChild(shotBtn);
        fallbackMounted = false;
        var clickables = C.querySelectorAll("button, [role='button']");
        // 结构转储：把输入框附近的元素顺序发给诊断日志，便于精确定位
        try {
          var dump = [];
          var cands = C.querySelectorAll("button, [role='button'], [class*='mode' i], [class*='shield' i], [aria-label]");
          for (var dd = 0; dd < Math.min(cands.length, 30); dd++) {
            var ce = cands[dd];
            dump.push("#" + dd + " " + ce.tagName + "." + String(ce.className || "").slice(0, 22) + " aria=" + (ce.getAttribute && (ce.getAttribute("aria-label") || "")) + " txt=" + (ce.textContent || "").trim().slice(0, 10));
          }
          var plusEl = null;
          for (var pe = 0; pe < clickables.length; pe++) { if (isPlusBtn(clickables[pe])) { plusEl = clickables[pe]; break; } }
          if (plusEl && plusEl.parentNode) {
            var sibs = plusEl.parentNode.children;
            var chain = [];
            for (var ss = 0; ss < sibs.length; ss++) chain.push(sibs[ss].tagName + "." + String(sibs[ss].className || "").slice(0, 14));
            dump.push("PLUS-SIBLINGS: " + chain.join(" | "));
          }
          diag("STRUCTURE: " + dump.join(" ;; "));
        } catch (e) {}
        // 1) 优先：找到盾牌 → 插到它右边
        var shield = null;
        for (var s = 0; s < clickables.length; s++) { if (isShieldBtn(clickables[s])) { shield = clickables[s]; break; } }
        if (shield) {
          shield.insertAdjacentElement("afterend", shotBtn);
          copyButtonStyle(shield, shotBtn);
          diag("shot placed after SHIELD (found=" + clickables.length + ")");
        } else {
          // 2) 找"+"，插到它文档顺序的下一个按钮（盾牌）右边
          var plus = null;
          for (var p = 0; p < clickables.length; p++) { if (isPlusBtn(clickables[p])) { plus = clickables[p]; break; } }
          diag("shield found=" + !!shield + " plus found=" + !!plus + " totalBtns=" + clickables.length);
          if (plus) {
            // 盾牌可能不是 <button>：直接用 "+" 的 nextElementSibling（视觉上盾牌紧跟其后）
            var target = plus.nextElementSibling;
            // 防止误跟到"发送"：若目标像发送按钮，继续往右找盾牌
            if (target) {
              var tH = (target.innerHTML || "");
              var tT = (target.textContent || "").replace(/\s/g, "");
              var isSend = /M22 2L11 13|M22 2l-7 20-4-9-9-4z|lucide-send/i.test(tH) || /发送|send/i.test(tT) || /send/i.test(target.className || "");
              if (isSend && target.nextElementSibling) target = target.nextElementSibling;
            }
            if (!target) target = plus;
            target.insertAdjacentElement("afterend", shotBtn);
            // 样式以真实的圆形按钮为基准（+ 或目标按钮），保证大小/边框完全一致
            var styleRef = (target.tagName === "BUTTON" || (target.getAttribute && target.getAttribute("role") === "button")) ? target : plus;
            copyButtonStyle(styleRef, shotBtn);
            diag("shot after tag=" + target.tagName + " cls=" + String(target.className || "").slice(0, 30));
          } else {
            // 3) 兜底：第一个方形小按钮之后
            var anchor = null;
            for (var a = 0; a < clickables.length; a++) {
              var btn = clickables[a];
              var bs = btn.getBoundingClientRect();
              if (bs.width > 18 && bs.width < 46 && Math.abs(bs.width - bs.height) < 6) { anchor = btn; break; }
            }
            if (anchor) { anchor.insertAdjacentElement("afterend", shotBtn); shotBtn.style.cssText = SHOTBTN_CIRCLE; }
            else C.insertBefore(shotBtn, C.firstChild);
          }
        }
        composerShotMounted = true;
        diag("mounted in composer, connected=" + shotBtn.isConnected);
      }
      // 兜底：20 秒后若仍未挂进输入框，放左下角；一旦找到输入框会自动移进去
      var fallbackTicks = 0;
      var fallbackTimer = setInterval(function () {
        if (composerShotMounted) { clearInterval(fallbackTimer); return; }
        fallbackTicks++;
        if (fallbackTicks < 20) return;
        if (!fallbackMounted && document.body && !shotBtn.isConnected) {
          diag("fallback floating mounted (composer still not found)");
          var FLOAT_STYLE = [
            "position:fixed", "left:14px", "bottom:14px", "z-index:9999",
            "width:32px", "height:32px", "padding:0",
            "display:flex", "align-items:center", "justify-content:center",
            "border-radius:10px", "cursor:pointer",
            "background:var(--dsw-alias-bg-module-platform,rgba(255,255,255,.9))",
            "border:1px solid var(--dsw-alias-border-l2,rgba(120,130,150,.35))",
            "color:var(--dsw-alias-label-secondary,#4a5670)",
          ].join(";");
          shotBtn.style.cssText = FLOAT_STYLE;
          document.body.appendChild(shotBtn);
          refBtn.style.cssText = FLOAT_STYLE;
          shotBtn.insertAdjacentElement("afterend", refBtn);
          fallbackMounted = true;
        }
      }, 1000);
      var fallbackGuard = setInterval(function () { if (composerShotMounted) clearInterval(fallbackTimer); }, 25000);

      // 强刷按钮：fixed 定位挂在代理开关（右上角鲸鱼）上方，可靠不依赖顶栏结构
      var refMountedTop = false;
      function mountRefButtonTop() {
        if (refMountedTop && refBtn.isConnected) return;
        if (refMountedTop && !refBtn.isConnected) refMountedTop = false;
        var all = document.querySelectorAll("body *");
        var target = null;
        for (var i = 0; i < all.length; i++) {
          var el = all[i];
          if (el.offsetParent === null) continue;
          var txt = (el.textContent || "").replace(/\s/g, "");
          if (txt.indexOf("标准模式") < 0) continue;
          var hasInner = false;
          for (var c = 0; c < el.children.length; c++) {
            if (((el.children[c].textContent || "").replace(/\s/g, "")).indexOf("标准模式") >= 0) { hasInner = true; break; }
          }
          if (!hasInner) { target = el; break; }  // 最内层
        }
        if (!target) {
          // 备选：顶栏里含"DeepSeek"/模型名/自动识图的最内层元素（放宽 children 限制）
          var probeList = [];
          for (var j = 0; j < all.length; j++) {
            var e2 = all[j];
            if (e2.offsetParent === null) continue;
            var rect = e2.getBoundingClientRect();
            // 只看顶部区域（y < 90）的短文本元素
            if (rect.top > 90 || rect.height > 60) continue;
            var t2 = (e2.textContent || "").replace(/\s/g, "");
            if (t2.length < 1 || t2.length > 40) continue;
            if (!/DeepSeek|V4|High|模型|识图|自动|标准|模式|选择|预设|Agent|agent|会话|session|标题/.test(t2)) continue;
            if (probeList.length < 25) probeList.push((e2.tagName || "") + " <" + (e2.className || "").toString().slice(0, 30) + "> " + t2.slice(0, 22));
            var hasInner2 = false;
            for (var c2 = 0; c2 < e2.children.length; c2++) {
              if (/DeepSeek|V4|High|模型|识图|自动|标准|模式|选择|预设|Agent|agent|会话/.test((e2.children[c2].textContent || "").replace(/\s/g, ""))) { hasInner2 = true; break; }
            }
            if (!hasInner2 && e2.children.length <= 6 && t2.length >= 2) { target = e2; break; }
          }
          if (probeList.length && !window.__dshRefProbeLogged) {
            window.__dshRefProbeLogged = true;
            diag("TOP PROBE: " + probeList.slice(0, 12).join(" | "));
            // 桌面端无控制台：浮层持续显示（含关闭按钮），供用户截图
            try {
              var ov = document.createElement("div");
              ov.setAttribute("data-ref-probe", "1");
              ov.style.cssText = "position:fixed;top:140px;left:50%;transform:translateX(-50%);z-index:2147483647;background:#fff;border:2px solid #e00;border-radius:12px;padding:14px 18px;font-size:13px;color:#111;max-width:86vw;max-height:60vh;overflow:auto;box-shadow:0 8px 32px rgba(0,0,0,.35);font-family:Consolas,monospace;white-space:pre-wrap;line-height:1.6";
              ov.innerHTML = "<b style='color:#e00'>TOP PROBE — 顶栏元素（截图发我）</b><br>" + probeList.slice(0, 15).map(function (s) { return "• " + s; }).join("<br>") + "<br><button data-ref-probe-close style='margin-top:10px;padding:4px 12px;border:1px solid #ccc;border-radius:6px;background:#f5f5f5;cursor:pointer'>关闭</button>";
              var closeBtn = ov.querySelector("[data-ref-probe-close]");
              if (closeBtn) closeBtn.addEventListener("click", function () { if (ov.parentNode) ov.parentNode.removeChild(ov); });
              document.body.appendChild(ov);
            } catch (e) {}
          }
        }
        if (target) {
          // 优先：插入到"标准模式"/模型选择器元素后面（顶栏内联）
          refBtn.style.cssText = REFBTN_INLINE;
          target.insertAdjacentElement("afterend", refBtn);
          refMountedTop = true;
          diag("ref mounted next to innermost: " + (target.textContent || "").trim().slice(0, 12) + " tag=" + target.tagName);
        } else {
          // 兜底：fixed 定位，放在代理开关（右上角鲸鱼，top:100px right:14px 宽44px）左侧并排同一水平线
          refBtn.style.cssText = REFBTN_INLINE + ";position:fixed;top:100px;right:64px;z-index:9999;background:var(--dsw-alias-bg-module-platform,#fff);border:1px solid var(--dsw-alias-border-l2,rgba(77,107,254,.3));border-radius:7px;box-shadow:0 2px 8px rgba(0,0,0,.15)";
          if (!refBtn.parentNode) document.body.appendChild(refBtn);
          refMountedTop = true;
          diag("ref mounted beside proxy whale (right:64px)");
        }
      }
      var refTimer = setInterval(function () {
        if (refMountedTop && refBtn.isConnected) return;
        mountRefButtonTop();
      }, 1000);
      var refGuard = setInterval(function () { if (refMountedTop && refBtn.isConnected) clearInterval(refTimer); }, 30000);

      function ensureComposerShotButton() {
        if (composerShotMounted && !shotBtn.isConnected) composerShotMounted = false;
        mountComposerShotButton();
      }
      // 截图自动进入输入框（QQ 风格）：写入剪贴板 + 模拟粘贴到输入框
      function attachShotToComposer(url) {
        fetch(url, { cache: "no-store" })
          .then(function (r) { return r.blob(); })
          .then(function (blob) {
            var file = new File([blob], "screenshot.png", { type: "image/png" });
            // 1) 写剪贴板（随时可 Ctrl+V）
            try {
              navigator.clipboard.write([new ClipboardItem({ "image/png": file })]).catch(function () {});
            } catch (e) {}
            // 2) 模拟粘贴到输入框（触发组件的 onPaste 附件处理）
            var C = findComposer();
            var input = C ? (C.querySelector("textarea") || C.querySelector("[contenteditable='true']") || C.querySelector("input[type='text']")) : null;
            if (input) {
              try {
                var dt = new DataTransfer();
                dt.items.add(file);
                var ev = new ClipboardEvent("paste", { clipboardData: dt, bubbles: true, cancelable: true });
                input.dispatchEvent(ev);
              } catch (e) {}
            }
          })
          .catch(function () {});
      }

      function buildWhale(size) {
        var w = size || 33;
        var svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        svg.setAttribute("viewBox", "0 0 23.16 17.04");
        svg.setAttribute("width", String(w));
        svg.setAttribute("height", String((w * 17.04 / 23.16).toFixed(2)));
        svg.setAttribute("aria-hidden", "true");
        var bodyColor = "var(--dsw-alias-label-tertiary,#9aa3b5)";
        var bellyFill = "transparent";
        var bodyPath = WHALE_PATH;
        if (state.bridgeDown) { bodyColor = AMBER; }
        else if (state.on) {
          bodyColor = "var(--dsw-alias-label-primary,#1c2333)";
          bellyFill = GREEN;
          bodyPath = WHALE_BODY_NO_BELLY;
        }
        var body = document.createElementNS("http://www.w3.org/2000/svg", "path");
        body.setAttribute("d", bodyPath);
        body.setAttribute("fill", bodyColor);
        body.style.transition = "fill .3s";
        var belly = document.createElementNS("http://www.w3.org/2000/svg", "path");
        belly.setAttribute("d", WHALE_BELLY);
        belly.setAttribute("fill", bellyFill);
        belly.style.transition = "fill .3s";
        svg.appendChild(body);
        svg.appendChild(belly);
        if (state.on) {
          svg.style.filter = "drop-shadow(0 0 3px rgba(63,174,106,.7))";
        }
        if (state.busy) {
          svg.style.animation = "dshProxyWhalePulse 1s ease-in-out infinite";
        }
        return svg;
      }

      function setWhale() {
        while (btn.firstChild) btn.removeChild(btn.firstChild);
        btn.appendChild(buildWhale());
      }

      // ---------- 详情面板（精致版） ----------
      var panel = document.createElement("div");
      panel.setAttribute("data-proxy-toggle", "panel");
      panel.style.cssText = [
        "position:fixed", "top:152px", "right:14px", "z-index:9999", "display:none",
        "width:264px", "padding:0 0 12px", "border-radius:14px",
        "background:var(--dsw-alias-bg-module-platform,#ffffff)",
        "border:1px solid var(--dsw-alias-border-l2,rgba(120,130,150,.35))",
        "box-shadow:0 16px 44px rgba(0,0,0,.26),0 2px 8px rgba(0,0,0,.08)",
        "font:13px/1.5 system-ui,-apple-system,'Segoe UI',sans-serif",
        "color:var(--dsw-alias-label-primary,#1c2333)",
        "backdrop-filter:blur(14px) saturate(1.1)",
        "animation:dshProxyPanelIn .18s ease-out",
      ].join(";");

      // 指向鲸鱼的箭头尾巴
      var caret = document.createElement("div");
      caret.setAttribute("data-proxy-toggle", "caret");
      caret.style.cssText = [
        "position:absolute", "top:-6px", "right:19px", "width:10px", "height:10px",
        "background:var(--dsw-alias-bg-module-platform,#ffffff)",
        "border-left:1px solid var(--dsw-alias-border-l2,rgba(120,130,150,.35))",
        "border-top:1px solid var(--dsw-alias-border-l2,rgba(120,130,150,.35))",
        "transform:rotate(45deg)", "pointer-events:none",
      ].join(";");
      panel.appendChild(caret);

      // 头部：小鲸鱼 + 标题 + 状态徽章
      var pHead = document.createElement("div");
      pHead.style.cssText = "display:flex;align-items:center;gap:8px;padding:11px 12px 7px;";
      var pMiniBox = document.createElement("span");
      pMiniBox.style.cssText = "display:flex;flex:none;";
      pMiniBox.appendChild(buildWhale(18));
      var pTitle = document.createElement("span");
      pTitle.style.cssText = "font-weight:650;font-size:13.5px;letter-spacing:.01em;";
      pTitle.textContent = "代理";
      var pill = document.createElement("span");
      pill.style.cssText = "margin-left:auto;font-size:11px;font-weight:650;padding:2.5px 9px;border-radius:999px;letter-spacing:.02em;transition:background .25s,color .25s;";
      pHead.append(pMiniBox, pTitle, pill);

      // 状态色条
      var accent = document.createElement("div");
      accent.setAttribute("data-proxy-toggle", "accent");
      accent.style.cssText = "height:3px;margin:0 12px 9px;border-radius:999px;background:#9aa3b5;transition:background .3s;";
      panel.append(accent);

      // 信息区
      var info = document.createElement("div");
      info.style.cssText = "padding:0 12px;";
      function row(label) {
        var r = document.createElement("div");
        r.style.cssText = "display:flex;justify-content:space-between;align-items:center;gap:10px;padding:4px 0;font-size:12px;";
        var l = document.createElement("span");
        l.style.cssText = "color:var(--dsw-alias-label-tertiary,#77839c);flex:none;";
        l.textContent = label;
        var v = document.createElement("span");
        v.style.cssText = "display:flex;align-items:center;gap:6px;min-width:0;color:var(--dsw-alias-label-primary,#1c2333);text-align:right;font-weight:500;";
        r.append(l, v);
        r._value = v;
        return r;
      }
      var rowNode = row("节点");
      var rowDelay = row("延迟");
      var rowSys = row("系统代理");
      var delayDot = document.createElement("span");
      delayDot.style.cssText = "width:7px;height:7px;border-radius:50%;flex:none;background:#9aa3b5;transition:background .3s;";
      var delayText = document.createElement("span");
      delayText.style.cssText = "overflow:hidden;text-overflow:ellipsis;white-space:nowrap;";
      rowDelay._value.append(delayDot, delayText);
      info.append(rowNode, rowDelay, rowSys);

      var divider = document.createElement("div");
      divider.style.cssText = "height:1px;margin:8px 12px;background:var(--dsw-alias-border-l1,rgba(120,130,150,.18));";
      panel.append(info, divider);

      // 切换节点
      var selBox = document.createElement("div");
      selBox.style.cssText = "margin:0 12px 10px;display:flex;align-items:center;gap:8px;";
      var selLabel = document.createElement("span");
      selLabel.style.cssText = "color:var(--dsw-alias-label-tertiary,#77839c);font-size:12px;flex:none;";
      selLabel.textContent = "切换节点";
      var sel = document.createElement("select");
      sel.setAttribute("data-proxy-toggle", "select");
      sel.style.cssText = [
        "flex:1", "min-width:0", "padding:5px 8px", "border-radius:8px",
        "border:1px solid var(--dsw-alias-border-l2,rgba(120,130,150,.35))",
        "background:var(--dsw-alias-bg-module-platform,#ffffff)",
        "color:var(--dsw-alias-label-primary,#1c2333)",
        "font-size:12px", "outline:none", "cursor:pointer",
        "transition:border-color .15s",
      ].join(";");
      selBox.append(selLabel, sel);

      // 主按钮（渐变）
      var pBtn = document.createElement("button");
      pBtn.type = "button";
      pBtn.setAttribute("data-proxy-toggle", "pbtn");
      pBtn.style.cssText = [
        "margin:0 12px", "width:calc(100% - 24px)", "padding:9px 0", "border-radius:9px",
        "border:1px solid transparent", "font-weight:650", "font-size:13px",
        "cursor:pointer", "color:#fff",
        "transition:filter .15s,transform .12s,box-shadow .15s",
      ].join(";");
      panel.append(selBox, pBtn);

      // ---------- 截图预览区 ----------
      var shotBox = document.createElement("div");
      shotBox.style.cssText = "display:none;margin:10px 12px 0;";
      var shotImg = document.createElement("img");
      shotImg.style.cssText = "max-width:100%;border-radius:8px;border:1px solid var(--dsw-alias-border-l2,rgba(120,130,150,.35));display:block;cursor:zoom-in;";
      shotImg.title = "点击查看大图";
      shotImg.addEventListener("click", function () { if (shotImg.src) window.open(shotImg.src, "_blank"); });
      var shotHint = document.createElement("div");
      shotHint.style.cssText = "font-size:11px;color:var(--dsw-alias-label-tertiary,#77839c);margin-top:4px;";
      shotBox.append(shotImg, shotHint);
      panel.append(shotBox);

      // ---------- 截屏 ----------
      function takeScreenshot() {
        if (state.shotBusy) return;
        state.shotBusy = true;
        shotHint.textContent = "请在屏幕上拖动框选截图区域（Esc 取消）…";
        shotBox.style.display = "block";
        fetch(BRIDGE + "/screenshot", { method: "POST", cache: "no-store" })
          .then(function (r) { return r.json(); })
          .then(function (d) {
            if (d.ok) {
              state.lastShot = d;
              shotImg.src = d.url + "?t=" + Date.now();
              shotHint.textContent = "已放入输入框，回车发送（或 Ctrl+V 粘贴）: " + d.file;
              shotBox.style.display = "block";
              attachShotToComposer(d.url);
            } else if (d.cancelled) {
              shotHint.textContent = "已取消截图";
            } else {
              shotHint.textContent = "截屏失败: " + (d.error || "未知错误");
            }
          })
          .catch(function () { shotHint.textContent = "截屏失败：桥接不可用"; })
          .then(function () { state.shotBusy = false; });
      }

      // ---------- 渲染 ----------
      function render() {
        // 徽章
        pill.textContent = state.bridgeDown ? "离线" : (state.on ? "已开启" : "已关闭");
        pill.style.background = state.bridgeDown ? "rgba(217,164,65,.16)" : (state.on ? "rgba(63,174,106,.15)" : "rgba(120,130,150,.13)");
        pill.style.color = state.bridgeDown ? AMBER : (state.on ? GREEN : "var(--dsw-alias-label-tertiary,#77839c)");
        // 色条
        accent.style.background = state.bridgeDown ? AMBER : (state.on ? GREEN : "#9aa3b5");
        // 信息
        rowNode._value.textContent = state.on ? (state.node || "—") : "—";
        if (state.delay != null) {
          delayText.textContent = state.delay + " ms";
          delayDot.style.background = state.delay < 300 ? GREEN : (state.delay < 700 ? AMBER : "#c44f4a");
        } else {
          delayText.textContent = "—";
          delayDot.style.background = "#9aa3b5";
        }
        rowSys._value.textContent = state.sysProxy ? "开" : "关";
        // 主按钮
        if (state.busy) {
          pBtn.disabled = true;
          pBtn.style.opacity = ".6";
          pBtn.textContent = "处理中…";
        } else {
          pBtn.disabled = false;
          pBtn.style.opacity = "1";
          if (state.bridgeDown) { pBtn.textContent = "重试"; pBtn.style.background = AMBER; }
          else if (state.on) { pBtn.textContent = "关闭代理"; pBtn.style.background = "linear-gradient(135deg,#e0524d,#c13d3a)"; }
          else { pBtn.textContent = "开启代理"; pBtn.style.background = "linear-gradient(135deg,#4d6bfe,#6a5cff)"; }
        }
        setWhale();
        pMiniBox.innerHTML = "";
        pMiniBox.appendChild(buildWhale(18));
      }

      // ---------- 数据 ----------
      function refresh() {
        fetch(BRIDGE + "/status", { cache: "no-store" })
          .then(function (r) { return r.json(); })
          .then(function (s) {
            state.on = !!s.on;
            state.node = s.node || "";
            state.delay = s.delay != null ? s.delay : null;
            state.sysProxy = !!s.sysProxy;
            state.bridgeDown = false;
            render();
          })
          .catch(function () {
            state.on = null;
            state.delay = null;
            state.bridgeDown = true;
            render();
          });
      }

      function loadNodes() {
        fetch(BRIDGE + "/nodes", { cache: "no-store" })
          .then(function (r) { return r.json(); })
          .then(function (d) { state.nodes = d.nodes || []; fillSelect(); })
          .catch(function () { state.nodes = []; fillSelect(); });
      }

      function fillSelect() {
        var prev = sel.value;
        sel.innerHTML = "";
        if (!state.on || state.nodes.length === 0) {
          var opt = document.createElement("option");
          opt.textContent = state.on ? "加载节点…" : "开启代理后可切换";
          opt.value = "";
          sel.appendChild(opt);
          sel.disabled = !state.on;
          return;
        }
        sel.disabled = false;
        state.nodes.forEach(function (n) {
          var o = document.createElement("option");
          o.value = n;
          o.textContent = n;
          sel.appendChild(o);
        });
        if (prev && state.nodes.indexOf(prev) >= 0) sel.value = prev;
        else if (state.node && state.nodes.indexOf(state.node) >= 0) sel.value = state.node;
      }

      // ---------- 动作 ----------
      function toggle() {
        if (state.busy) return;
        state.busy = true;
        render();
        var action = state.bridgeDown ? "/status" : (state.on ? "/stop" : "/start");
        fetch(BRIDGE + action, { method: "POST", cache: "no-store" })
          .then(function (r) { return r.json(); })
          .then(function (s) {
            state.on = !!s.on;
            state.node = s.node || "";
            state.delay = s.delay != null ? s.delay : null;
            state.sysProxy = !!s.sysProxy;
            state.bridgeDown = false;
          })
          .catch(function () { state.bridgeDown = true; })
          .then(function () { state.busy = false; render(); if (state.on) loadNodes(); });
      }

      function onNodeChange() {
        var name = sel.value;
        if (!name || name === state.node) return;
        sel.disabled = true;
        fetch(BRIDGE + "/node", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ node: name }),
          cache: "no-store",
        })
          .then(function (r) { return r.json(); })
          .then(function () { refresh(); })
          .catch(function () { sel.disabled = false; });
      }

      // ---------- 悬停显示/隐藏 ----------
      function openPanel() {
        if (hideTimer) { clearTimeout(hideTimer); hideTimer = null; }
        panel.style.display = "block";
        loadNodes();
      }
      function scheduleHide() {
        if (hideTimer) clearTimeout(hideTimer);
        hideTimer = setTimeout(function () { panel.style.display = "none"; hideTimer = null; }, 220);
      }
      function onClickOutside(e) {
        if (!panel.contains(e.target) && !btn.contains(e.target)) {
          panel.style.display = "none";
        }
      }

      btn.addEventListener("mouseenter", openPanel);
      btn.addEventListener("mouseleave", scheduleHide);
      panel.addEventListener("mouseenter", function () { if (hideTimer) { clearTimeout(hideTimer); hideTimer = null; } });
      panel.addEventListener("mouseleave", scheduleHide);
      btn.addEventListener("click", toggle);
      pBtn.addEventListener("click", toggle);
      shotBtn.addEventListener("click", takeScreenshot);
      sel.addEventListener("change", onNodeChange);
      document.addEventListener("click", onClickOutside);

      // ---------- 对话区音视频内嵌 ----------
      var VIDEO_EXTS = [".mp4", ".webm", ".mov", ".m4v", ".ogv"];
      var AUDIO_EXTS = [".mp3", ".wav", ".ogg", ".oga", ".m4a", ".aac", ".flac", ".opus"];
      function isMediaUrl(u, exts) {
        try {
          var p = new URL(u).pathname.toLowerCase();
          return exts.some(function (e) { return p.endsWith(e); });
        } catch { return false; }
      }
      function inConversation(el) {
        return !!(el.closest('[data-pane="conversation"]') || el.closest("[data-chat-flow-kind]"));
      }
      function makePlayer(src, kind) {
        var el = document.createElement(kind);
        el.src = src;
        el.controls = true;
        el.preload = "metadata";
        if (kind === "video") {
          el.style.cssText = "max-width:100%;max-height:420px;border-radius:10px;background:#000;display:block;box-shadow:0 4px 14px rgba(0,0,0,.18);";
        } else {
          el.style.cssText = "max-width:100%;display:block;margin:6px 0;";
        }
        return el;
      }
      function upgradeMedia() {
        ensureComposerShotButton();
        decorateAttachmentIcons();  // 输入框重渲染后恢复截图按钮

        // 消息里的媒体链接 [文字](xxx.mp4/mp3) → 内嵌播放器
        document.querySelectorAll("a[href]").forEach(function (a) {
          if (a.dataset.dshMediaDone || !inConversation(a)) return;
          var kind = isMediaUrl(a.href, VIDEO_EXTS) ? "video" : (isMediaUrl(a.href, AUDIO_EXTS) ? "audio" : null);
          if (!kind) return;
          a.dataset.dshMediaDone = "1";
          var wrap = document.createElement("div");
          wrap.style.cssText = "margin:6px 0;";
          var player = makePlayer(a.href, kind);
          wrap.appendChild(player);
          var link = a.cloneNode(false);   // 保留原链接（小字）
          link.textContent = kind === "video" ? "打开原视频 ↗" : "下载原音频 ↘";
          link.style.cssText = "font-size:12px;color:var(--dsw-alias-label-tertiary,#77839c);display:inline-block;margin-top:4px;";
          wrap.appendChild(link);
          a.replaceWith(wrap);
        });
        // markdown 图片语法指向媒体（![](xxx.mp4)）→ 也升级
        document.querySelectorAll("img[src]").forEach(function (img) {
          if (img.dataset.dshMediaDone || !inConversation(img)) return;
          var kind = isMediaUrl(img.src, VIDEO_EXTS) ? "video" : (isMediaUrl(img.src, AUDIO_EXTS) ? "audio" : null);
          if (!kind) return;
          img.dataset.dshMediaDone = "1";
          var player = makePlayer(img.src, kind);
          img.replaceWith(player);
        });
      }
      // ---------- 附件图标装饰：未知格式文件 → 对应格式图标 ----------
      // 文件扩展名 → 图标类型映射
      var FILE_ICON_MAP = [
        { re: /\.(png|jpe?g|gif|webp|bmp|svg|ico|avif)$/i, type: "image" },
        { re: /\.(mp4|webm|mov|m4v|avi|mkv|ogv|flv|wmv)$/i, type: "video" },
        { re: /\.(mp3|wav|ogg|oga|m4a|aac|flac|opus|wma|midi?)$/i, type: "audio" },
        { re: /\.(zip|rar|7z|tar|gz|bz2|xz|iso)$/i, type: "archive" },
        { re: /\.(pdf)$/i, type: "pdf" },
        { re: /\.(docx?|doc|rtf|odt|pages)$/i, type: "doc" },
        { re: /\.(xlsx?|xls|csv|ods|numbers)$/i, type: "sheet" },
        { re: /\.(pptx?|ppt|odp|key)$/i, type: "slides" },
        { re: /\.(txt|md|markdown|log)$/i, type: "text" },
        { re: /\.(js|ts|jsx|tsx|py|java|c|cpp|h|go|rs|rb|php|html|css|json|xml|yaml|yml|sh|bat|ps1|sql)$/i, type: "code" },
      ];
      function fileIconType(name) {
        if (!name) return "file";
        for (var i = 0; i < FILE_ICON_MAP.length; i++) {
          if (FILE_ICON_MAP[i].re.test(name)) return FILE_ICON_MAP[i].type;
        }
        return "file";
      }
      // 各类型 SVG 图标（线性风格，与 DSH 图标一致）
      function fileIconSVG(type, size) {
        var s = size || 20;
        var paths = {
          image: '<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/>',
          video: '<rect x="2" y="4" width="20" height="16" rx="2"/><path d="M10 9l5 3-5 3z"/>',
          audio: '<path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>',
          archive: '<path d="M21 8v13H3V8"/><path d="M1 3h22v5H1z"/><path d="M10 12h4"/>',
          pdf: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M9 15h6M9 11h2"/>',
          doc: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M8 13h8M8 17h5"/>',
          sheet: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M8 13h2v2H8zM12 13h2v2h-2zM16 13h2v2h-2zM8 17h2v2H8zM12 17h2v2h-2z"/>',
          slides: '<path d="M2 3h20v11H2z"/><path d="M7 21h10M12 18v3"/>',
          text: '<path d="M4 6h16M4 12h16M4 18h10"/>',
          code: '<path d="M16 18l6-6-6-6M8 6l-6 6 6 6"/>',
          file: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/>',
        };
        var d = paths[type] || paths.file;
        return '<svg viewBox="0 0 24 24" width="' + s + '" height="' + s + '" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + d + '</svg>';
      }
      // 扫描输入框附件条，替换未知格式图标的缩略图
      // 美化版格式图标（浅蓝灰圆角底 + 深灰蓝线条，与 DSH UI 一致）
var FICON_DATA = {"video":"data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2048%2048%22%3E%3Crect%20x%3D%224%22%20y%3D%224%22%20width%3D%2240%22%20height%3D%2240%22%20rx%3D%2210%22%20fill%3D%22%23e8edf5%22%2F%3E%3Cg%20fill%3D%22none%22%20stroke%3D%22%233d4a63%22%20stroke-width%3D%222.6%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20transform%3D%22translate(12%2012)%20scale(1)%22%3E%3Crect%20x%3D%222%22%20y%3D%224%22%20width%3D%2220%22%20height%3D%2216%22%20rx%3D%223%22%2F%3E%3Cpath%20d%3D%22M10%209l5%203-5%203z%22%2F%3E%3C%2Fg%3E%3C%2Fsvg%3E","audio":"data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2048%2048%22%3E%3Crect%20x%3D%224%22%20y%3D%224%22%20width%3D%2240%22%20height%3D%2240%22%20rx%3D%2210%22%20fill%3D%22%23e8edf5%22%2F%3E%3Cg%20fill%3D%22none%22%20stroke%3D%22%233d4a63%22%20stroke-width%3D%222.6%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20transform%3D%22translate(12%2012)%20scale(1)%22%3E%3Cpath%20d%3D%22M9%2018V5l12-2v13%22%2F%3E%3Ccircle%20cx%3D%226%22%20cy%3D%2218%22%20r%3D%223%22%2F%3E%3Ccircle%20cx%3D%2218%22%20cy%3D%2216%22%20r%3D%223%22%2F%3E%3C%2Fg%3E%3C%2Fsvg%3E","archive":"data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2048%2048%22%3E%3Crect%20x%3D%224%22%20y%3D%224%22%20width%3D%2240%22%20height%3D%2240%22%20rx%3D%2210%22%20fill%3D%22%23e8edf5%22%2F%3E%3Cg%20fill%3D%22none%22%20stroke%3D%22%233d4a63%22%20stroke-width%3D%222.6%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20transform%3D%22translate(12%2012)%20scale(1)%22%3E%3Cpath%20d%3D%22M21%208v13H3V8%22%2F%3E%3Cpath%20d%3D%22M1%203h22v5H1z%22%2F%3E%3Cpath%20d%3D%22M10%2012h4%22%2F%3E%3C%2Fg%3E%3C%2Fsvg%3E","pdf":"data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2048%2048%22%3E%3Crect%20x%3D%224%22%20y%3D%224%22%20width%3D%2240%22%20height%3D%2240%22%20rx%3D%2210%22%20fill%3D%22%23e8edf5%22%2F%3E%3Cg%20fill%3D%22none%22%20stroke%3D%22%233d4a63%22%20stroke-width%3D%222.6%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20transform%3D%22translate(12%2012)%20scale(1)%22%3E%3Cpath%20d%3D%22M14%202H6a2%202%200%200%200-2%202v16a2%202%200%200%200%202%202h12a2%202%200%200%200%202-2V8z%22%2F%3E%3Cpath%20d%3D%22M14%202v6h6%22%2F%3E%3Cpath%20d%3D%22M9%2015h6M9%2011h2%22%2F%3E%3C%2Fg%3E%3C%2Fsvg%3E","doc":"data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2048%2048%22%3E%3Crect%20x%3D%224%22%20y%3D%224%22%20width%3D%2240%22%20height%3D%2240%22%20rx%3D%2210%22%20fill%3D%22%23e8edf5%22%2F%3E%3Cg%20fill%3D%22none%22%20stroke%3D%22%233d4a63%22%20stroke-width%3D%222.6%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20transform%3D%22translate(12%2012)%20scale(1)%22%3E%3Cpath%20d%3D%22M14%202H6a2%202%200%200%200-2%202v16a2%202%200%200%200%202%202h12a2%202%200%200%200%202-2V8z%22%2F%3E%3Cpath%20d%3D%22M14%202v6h6%22%2F%3E%3Cpath%20d%3D%22M8%2013h8M8%2017h5%22%2F%3E%3C%2Fg%3E%3C%2Fsvg%3E","sheet":"data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2048%2048%22%3E%3Crect%20x%3D%224%22%20y%3D%224%22%20width%3D%2240%22%20height%3D%2240%22%20rx%3D%2210%22%20fill%3D%22%23e8edf5%22%2F%3E%3Cg%20fill%3D%22none%22%20stroke%3D%22%233d4a63%22%20stroke-width%3D%222.6%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20transform%3D%22translate(12%2012)%20scale(1)%22%3E%3Cpath%20d%3D%22M14%202H6a2%202%200%200%200-2%202v16a2%202%200%200%200%202%202h12a2%202%200%200%200%202-2V8z%22%2F%3E%3Cpath%20d%3D%22M14%202v6h6%22%2F%3E%3Cpath%20d%3D%22M8%2013h2v2H8zM12%2013h2v2h-2zM16%2013h2v2h-2zM8%2017h2v2H8zM12%2017h2v2h-2z%22%2F%3E%3C%2Fg%3E%3C%2Fsvg%3E","slides":"data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2048%2048%22%3E%3Crect%20x%3D%224%22%20y%3D%224%22%20width%3D%2240%22%20height%3D%2240%22%20rx%3D%2210%22%20fill%3D%22%23e8edf5%22%2F%3E%3Cg%20fill%3D%22none%22%20stroke%3D%22%233d4a63%22%20stroke-width%3D%222.6%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20transform%3D%22translate(12%2012)%20scale(1)%22%3E%3Cpath%20d%3D%22M2%203h20v11H2z%22%2F%3E%3Cpath%20d%3D%22M7%2021h10M12%2018v3%22%2F%3E%3C%2Fg%3E%3C%2Fsvg%3E","text":"data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2048%2048%22%3E%3Crect%20x%3D%224%22%20y%3D%224%22%20width%3D%2240%22%20height%3D%2240%22%20rx%3D%2210%22%20fill%3D%22%23e8edf5%22%2F%3E%3Cg%20fill%3D%22none%22%20stroke%3D%22%233d4a63%22%20stroke-width%3D%222.6%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20transform%3D%22translate(12%2012)%20scale(1)%22%3E%3Cpath%20d%3D%22M4%206h16M4%2012h16M4%2018h10%22%2F%3E%3C%2Fg%3E%3C%2Fsvg%3E","code":"data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2048%2048%22%3E%3Crect%20x%3D%224%22%20y%3D%224%22%20width%3D%2240%22%20height%3D%2240%22%20rx%3D%2210%22%20fill%3D%22%23e8edf5%22%2F%3E%3Cg%20fill%3D%22none%22%20stroke%3D%22%233d4a63%22%20stroke-width%3D%222.6%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20transform%3D%22translate(12%2012)%20scale(1)%22%3E%3Cpath%20d%3D%22M16%2018l6-6-6-6M8%206l-6%206%206%206%22%2F%3E%3C%2Fg%3E%3C%2Fsvg%3E","image":"data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2048%2048%22%3E%3Crect%20x%3D%224%22%20y%3D%224%22%20width%3D%2240%22%20height%3D%2240%22%20rx%3D%2210%22%20fill%3D%22%23e8edf5%22%2F%3E%3Cg%20fill%3D%22none%22%20stroke%3D%22%233d4a63%22%20stroke-width%3D%222.6%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20transform%3D%22translate(12%2012)%20scale(1)%22%3E%3Crect%20x%3D%223%22%20y%3D%223%22%20width%3D%2218%22%20height%3D%2218%22%20rx%3D%222%22%2F%3E%3Ccircle%20cx%3D%228.5%22%20cy%3D%228.5%22%20r%3D%221.5%22%2F%3E%3Cpath%20d%3D%22M21%2015l-5-5L5%2021%22%2F%3E%3C%2Fg%3E%3C%2Fsvg%3E","file":"data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2048%2048%22%3E%3Crect%20x%3D%224%22%20y%3D%224%22%20width%3D%2240%22%20height%3D%2240%22%20rx%3D%2210%22%20fill%3D%22%23e8edf5%22%2F%3E%3Cg%20fill%3D%22none%22%20stroke%3D%22%233d4a63%22%20stroke-width%3D%222.6%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20transform%3D%22translate(12%2012)%20scale(1)%22%3E%3Cpath%20d%3D%22M14%202H6a2%202%200%200%200-2%202v16a2%202%200%200%200%202%202h12a2%202%200%200%200%202-2V8z%22%2F%3E%3Cpath%20d%3D%22M14%202v6h6%22%2F%3E%3C%2Fg%3E%3C%2Fsvg%3E"};
      // 按文件名判断类型（与 FILE_ICON_MAP 一致，返回 FICON_DATA 键）
      function ficonType(name) {
        if (!name) return "file";
        var map = [
          [/\.(png|jpe?g|gif|webp|bmp|svg|ico|avif)$/i, "image"],
          [/\.(mp4|webm|mov|m4v|avi|mkv|ogv|flv|wmv)$/i, "video"],
          [/\.(mp3|wav|ogg|oga|m4a|aac|flac|opus|wma|midi?)$/i, "audio"],
          [/\.(zip|rar|7z|tar|gz|bz2|xz|iso)$/i, "archive"],
          [/\.pdf$/i, "pdf"],
          [/\.(docx?|doc|rtf|odt|pages)$/i, "doc"],
          [/\.(xlsx?|xls|csv|ods|numbers)$/i, "sheet"],
          [/\.(pptx?|ppt|odp|key)$/i, "slides"],
          [/\.(txt|md|markdown|log)$/i, "text"],
          [/\.(js|ts|jsx|tsx|py|java|c|cpp|h|go|rs|rb|php|html|css|json|xml|yaml|yml|sh|bat|ps1|sql)$/i, "code"],
        ];
        for (var i = 0; i < map.length; i++) if (map[i][0].test(name)) return map[i][1];
        return "file";
      }
      // 核心：附件栏 img 加载失败 → 替换为格式图标（DSH AttachmentRail 只渲染 img）
      function fixAttachmentImg(img) {
        if (img.dataset.dshFIcon) return;
        var fname = img.alt || "";
        if (!fname) {
          var parent = img.closest("[class*='item' i], [class*='card' i], [class*='attach' i], [class*='thumb' i]");
          if (parent) {
            var m = (parent.textContent || "").match(/([\w\u4e00-\u9fa5][\w\u4e00-\u9fa5 ._-]*\.\w{2,5})/);
            if (m) fname = m[1];
          }
        }
        var type = ficonType(fname);
        if (type === "image" && !/failed|error|broken/i.test(img.alt || "")) return;
        img.dataset.dshFIcon = type;
        img.src = FICON_DATA[type] || FICON_DATA.file;
        // 美化：图标放大、卡片居中、圆角
        img.style.width = "36px";
        img.style.height = "36px";
        img.style.objectFit = "contain";
        img.style.margin = "6px auto 2px";
        img.style.display = "block";
        // 卡片改为纵向布局（图标在上、文件名在下）
        var card = img.closest("button") || img.parentElement;
        if (card) {
          card.style.display = "flex";
          card.style.flexDirection = "column";
          card.style.alignItems = "center";
          card.style.justifyContent = "center";
          card.style.padding = "4px 6px";
          card.style.background = "transparent";
          card.style.border = "none";
          // 注入文件名小字（若尚无）
          if (!card.querySelector("[data-dsh-fname]")) {
            var nameSpan = document.createElement("span");
            nameSpan.setAttribute("data-dsh-fname", "1");
            nameSpan.textContent = fname;
            nameSpan.style.cssText = "font-size:10px;color:var(--dsw-alias-label-tertiary,#8a94a8);max-width:76px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;line-height:1.2;padding:0 2px;";
            card.appendChild(nameSpan);
          }
        }
      }
      function decorateAttachmentIcons() {
        try {
          var imgs = document.querySelectorAll("img");
          for (var i = 0; i < imgs.length; i++) {
            var img = imgs[i];
            if (img.dataset.dshFIcon) continue;
            // 只处理附件栏的 img（父链含 item/card/attach/rail）
            var p = img.parentElement;
            var isAttach = false;
            for (var lv = 0; lv < 4 && p; lv++) {
              if (/item|card|attach|rail|thumb|preview/i.test(String(p.className||""))) { isAttach = true; break; }
              p = p.parentElement;
            }
            if (!isAttach) continue;
            // 已加载成功（naturalWidth>0 且 src 非 data:）→ 保留
            if (img.complete && img.naturalWidth > 0 && !/^data:/.test(img.src)) continue;
            // 未加载/失败 → 监听 onerror 或直接尝试
            img.addEventListener("error", function () { fixAttachmentImg(this); });
            if (img.complete && img.naturalWidth === 0) fixAttachmentImg(img);
            // 非 data: 的 src，延迟检查（等加载结果）
            if (!/^data:/.test(img.src)) {
              (function (im) {
                setTimeout(function () { if (!im.dataset.dshFIcon && im.naturalWidth === 0) fixAttachmentImg(im); }, 1500);
              })(img);
            }
          }
        } catch (e) { diag("FICON-ERR: " + e.message); }
      }
      var ficonObs = null;
      function startIconObserver() {
        decorateAttachmentIcons();
        var t = null;
        ficonObs = new MutationObserver(function () {
          if (t) clearTimeout(t);
          t = setTimeout(decorateAttachmentIcons, 400);
        });
        ficonObs.observe(document.body, { childList: true, subtree: true });
      }
      function startMediaObserver() {
        upgradeMedia();
        var obs = new MutationObserver(function () { upgradeMedia(); });
        obs.observe(document.body, { childList: true, subtree: true });
        return obs;
      }

      // ---------- 挂载 ----------
      function mount() {
        if (!document.body) {
          if (window.__dshProxyToggleTries > 300) return;
          window.__dshProxyToggleTries = (window.__dshProxyToggleTries || 0) + 1;
          setTimeout(mount, 100);
          return;
        }
        if (document.body.dataset[MARKER]) return;
        var style = document.createElement("style");
        style.textContent = [
          "@keyframes dshProxyWhalePulse{0%,100%{opacity:1}50%{opacity:.45}}",
          "@keyframes dshProxyPanelIn{from{opacity:0;transform:translateY(-6px) scale(.97)}to{opacity:1;transform:none}}",
          "[data-proxy-toggle='btn']:hover{background:var(--dsw-alias-interactive-bg-hover,rgba(0,0,0,.06));border-color:var(--dsw-alias-border-l2,rgba(120,130,150,.35))}",
          "[data-proxy-toggle='btn']:active{transform:scale(.94)}",
          "[data-proxy-toggle='btn']:focus-visible{outline:2px solid rgba(77,107,254,.55);outline-offset:1px}",
          "[data-proxy-toggle='select']:hover{border-color:var(--dsw-alias-border-l2,rgba(120,130,150,.6))}",
          "[data-proxy-toggle='select']:focus-visible{outline:2px solid rgba(77,107,254,.5);outline-offset:0}",
          "[data-proxy-toggle='pbtn']:not(:disabled):hover{filter:brightness(1.08);transform:translateY(-1px);box-shadow:0 4px 14px rgba(0,0,0,.18)}",
          "[data-proxy-toggle='pbtn']:not(:disabled):active{transform:translateY(0);filter:brightness(.96)}",
          "[data-proxy-toggle='refbtn']:hover{background:rgba(255,255,255,.32);border-color:rgba(255,255,255,.55)}",
          "[data-proxy-toggle='shotbtn']:hover{background:var(--dsw-alias-interactive-bg-hover,rgba(0,0,0,.07));border-color:var(--dsw-alias-border-l2,rgba(120,130,150,.35))}",
        ].join("");
        document.head.appendChild(style);
        document.body.appendChild(btn);
        document.body.appendChild(panel);
        document.body.dataset[MARKER] = "1";
        render();
        refresh();
        var timer = setInterval(refresh, POLL_MS);
        var videoObs = startMediaObserver();
        // 截图按钮挂到输入框（composer），轮询等待输入框出现；强刷按钮挂顶栏
        mountComposerShotButton();
        mountRefButtonTop();
        hookComposerDrop();
        hookDocumentDrop();
        startIconObserver();
        // 独立顶栏探测（不依赖按钮挂载状态）：延迟等 React 渲染完成后，列出顶部元素供定位
        setTimeout(function () {
          try {
            if (window.__dshTopProbeShown) return;
            window.__dshTopProbeShown = true;
            var list = [];
            var els = document.querySelectorAll("body *");
            for (var i = 0; i < els.length; i++) {
              var el = els[i];
              if (!el.offsetParent) continue;
              var r = el.getBoundingClientRect();
              if (r.top < 0 || r.top > 80 || r.height > 56) continue;
              var txt = (el.textContent || "").replace(/\s+/g, " ").trim();
              if (txt.length < 1 || txt.length > 40) continue;
              var tag = (el.tagName || "") + "." + (el.className || "").toString().split(" ").slice(0, 2).join(".");
              list.push(tag + " => " + txt.slice(0, 26));
              if (list.length >= 30) break;
            }
            diag("TOP DUMP: " + JSON.stringify(list));
            var ov = document.createElement("div");
            ov.style.cssText = "position:fixed;top:150px;left:50%;transform:translateX(-50%);z-index:2147483647;background:#fff;border:2px solid #e00;border-radius:12px;padding:14px 18px;font-size:12px;color:#111;max-width:88vw;max-height:62vh;overflow:auto;box-shadow:0 8px 32px rgba(0,0,0,.35);font-family:Consolas,monospace;white-space:pre-wrap;line-height:1.5";
            ov.innerHTML = "<b style='color:#e00'>TOP DUMP — 顶部元素（截图发我）</b><br>" + list.map(function (s) { return "• " + s; }).join("<br>") + "<br><button data-probe-close style='margin-top:10px;padding:4px 12px;border:1px solid #ccc;border-radius:6px;background:#f5f5f5;cursor:pointer'>关闭</button>";
            var cb = ov.querySelector("[data-probe-close]");
            if (cb) cb.addEventListener("click", function () { if (ov.parentNode) ov.parentNode.removeChild(ov); });
            document.body.appendChild(ov);
          } catch (e) { diag("probe err: " + e.message); }
        }, 2500);
        var composerTimer = setInterval(function () {
          mountComposerShotButton();
        }, 800);
        ctx.effect(function () {
          return function () {
            clearInterval(timer);
            clearInterval(composerTimer);
            clearInterval(fallbackTimer);
            clearInterval(fallbackGuard);
            clearInterval(refTimer);
            clearInterval(refGuard);
            if (hideTimer) clearTimeout(hideTimer);
            if (videoObs) videoObs.disconnect();
            if (ficonObs) ficonObs.disconnect();
            if (btn.parentNode) btn.parentNode.removeChild(btn);
            if (shotBtn.parentNode) shotBtn.parentNode.removeChild(shotBtn);
            if (refBtn.parentNode) refBtn.parentNode.removeChild(refBtn);
            if (panel.parentNode) panel.parentNode.removeChild(panel);
            if (style.parentNode) style.parentNode.removeChild(style);
            delete document.body.dataset[MARKER];
            delete document.documentElement.dataset.dshFileDropDocHooked;
          };
        });
      }

      mount();
    }

    exports.apply = apply;
    return module.exports;
  },
});
