export const PREVIEW_SHELL_RUNTIME = `    <script>
      (function () {
        var s = document.documentElement.style;
        var n = function (v) { return typeof v === 'number' && isFinite(v) && v > 0; };
        var state = { scale: 1, width: 0, height: 0 };
        var bootId = Math.random().toString(36).slice(2);
        var readySent = false;
        var root = null;
        var styleTag = null;
        var getRoot = function () {
          if (!root) root = document.getElementById('preview-scale-root');
          return root;
        };
        var getStyleTag = function () {
          if (!styleTag) styleTag = document.getElementById('preview-user-style');
          return styleTag;
        };
        var absolutizeCssUrls = function (cssText, base) {
          return String(cssText).replace(/url\\((['"]?)(.*?)\\1\\)/g, function (_m, q, raw) {
            var value = String(raw).trim();
            try {
              return 'url(' + q + new URL(value, base).href + q + ')';
            } catch (e) {
              return 'url(' + q + value + q + ')';
            }
          });
        };
        var absolutizeHtmlAttrs = function (html, base) {
          return String(html).replace(/(<img\\b[^>]*\\bsrc\\s*=\\s*)(['"])(.*?)\\2/gi, function (m, prefix, q, value) {
            try {
              return prefix + q + new URL(String(value).trim(), base).href + q;
            } catch (e) {
              return m;
            }
          });
        };
        var applyPreviewContent = function (payload) {
          var nextRoot = getRoot();
          var nextStyleTag = getStyleTag();
          if (!nextRoot || !nextStyleTag) return;
          var base = String(payload && payload.origin || '').replace(/\\/$/, '');
          var innerHtml = absolutizeHtmlAttrs(payload && payload.html || '', base);
          var resetCss = absolutizeCssUrls(payload && payload.resetCss || '', base);
          var styleCss = absolutizeCssUrls(payload && payload.styleCss || '', base);
          nextRoot.innerHTML = innerHtml;
          nextStyleTag.textContent = resetCss + '\\n' + styleCss;
        };
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
          if (!d || typeof d !== 'object') return;
          if (d.type === 'preview:update') {
            var previewPayload = d.payload || {};
            if (typeof previewPayload.bootId === 'string' && previewPayload.bootId !== bootId) return;
            applyPreviewContent(previewPayload);
            return;
          }
          if (d.type !== 'preview:layout') return;
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
      })();
    </script>
`
