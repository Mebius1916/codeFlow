export const PREVIEW_SHELL_RUNTIME = `    <script>
      (function () {
        var s = document.documentElement.style;
        var n = function (v) { return typeof v === 'number' && isFinite(v) && v > 0; };
        var state = { scale: 1, width: 0, height: 0 };
        var bootId = Math.random().toString(36).slice(2);
        var readySent = false;
        var notifyReady = function () {
          if (readySent) return;
          readySent = true;
          try {
            window.parent && window.parent.postMessage && window.parent.postMessage({ type: 'preview:ready', payload: { bootId: bootId } }, '*');
          } catch (e) {}
        };
        function layout() {
          var scale = state.scale;
          var width = state.width;
          var height = state.height;
          if (!n(scale) || !n(width) || !n(height)) return;
          var scaledW = width * scale;
          var scaledH = height * scale;
          var offsetX = (window.innerWidth - scaledW) / 2;
          var offsetY = (window.innerHeight - scaledH) / 2;
          s.setProperty('--preview-scale', String(scale));
          s.setProperty('--preview-width', width + 'px');
          s.setProperty('--preview-height', height + 'px');
          s.setProperty('--preview-offset-x', offsetX + 'px');
          s.setProperty('--preview-offset-y', offsetY + 'px');
          s.setProperty('--preview-ready-opacity', '1');
          try {
            window.parent && window.parent.postMessage && window.parent.postMessage({ type: 'preview:layout:applied', payload: { bootId: bootId } }, '*');
          } catch (e) {}
        }
        window.addEventListener('message', function (e) {
          var d = e && e.data;
          if (!d || typeof d !== 'object' || d.type !== 'preview:layout') return;
          var p = d.payload || d;
          var scale = p.scale, width = p.width, height = p.height, bid = p.bootId;
          if (typeof bid === 'string' && bid !== bootId) return;
          if (n(scale)) state.scale = scale;
          if (n(width)) state.width = width;
          if (n(height)) state.height = height;
          layout();
        });
        if (document.readyState === 'complete' || document.readyState === 'interactive') {
          notifyReady();
        } else {
          document.addEventListener('DOMContentLoaded', notifyReady);
        }
        window.addEventListener('load', notifyReady);
        window.addEventListener('resize', function () { layout(); });

        // 截图：监听 preview:capture，使用 modern-screenshot 的 domToBlob
        window.addEventListener('message', function (e) {
          var d = e && e.data;
          if (!d || typeof d !== 'object' || d.type !== 'preview:capture') return;
          var p = d.payload || {};
          var w = p.width;
          var h = p.height;
          var root = document.getElementById('preview-scale-root');
          if (!root || !window.modernScreenshot) {
            try { window.parent.postMessage({ type: 'preview:capture:error', payload: { message: 'modern-screenshot not ready' } }, '*'); } catch (_) {}
            return;
          }

          window.modernScreenshot.domToBlob(root, {
            width: w || root.scrollWidth,
            height: h || root.scrollHeight,
            scale: 1,
            backgroundColor: '#ffffff',
            // 在克隆节点上去掉 transform
            onCloneNode: function (cloned) {
              if (cloned && cloned.id === 'preview-scale-root') {
                cloned.style.transform = 'none';
                cloned.style.transformOrigin = 'top left';
                if (w) cloned.style.width = w + 'px';
                if (h) cloned.style.height = h + 'px';
              }
            },
          }).then(function (blob) {
            if (!blob) {
              try { window.parent.postMessage({ type: 'preview:capture:error', payload: { message: 'domToBlob returned null' } }, '*'); } catch (_) {}
              return;
            }
            var reader = new FileReader();
            reader.onload = function () {
              try {
                window.parent.postMessage({
                  type: 'preview:capture:done',
                  payload: { buffer: reader.result, width: w, height: h },
                }, '*', [reader.result]);
              } catch (_) {}
            };
            reader.readAsArrayBuffer(blob);
          }).catch(function (err) {
            try { window.parent.postMessage({ type: 'preview:capture:error', payload: { message: String(err) } }, '*'); } catch (_) {}
          });
        });
      })();
    </script>
`
