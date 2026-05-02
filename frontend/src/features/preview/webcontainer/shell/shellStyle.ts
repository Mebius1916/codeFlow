export const PREVIEW_SHELL_STYLE = `    <style>
      html, body {
        width: 100%;
        height: 100%;
        margin: 0;
        padding: 0;
        background: rgb(12, 14, 23) !important;
      }
      #preview-container {
        position: relative;
        overflow: hidden;
        width: 100%;
        height: 100%;
        background: rgb(12, 14, 23) !important;
      }
      #preview-scale-root {
        width: var(--preview-width, 0px);
        height: var(--preview-height, 0px);
        position: absolute;
        left: 0;
        top: 0;
        opacity: var(--preview-ready-opacity, 0);
        transition: opacity 120ms ease;
        background-color: #ffffff;
        background-size: 24px 24px;
        background-position: 0 0, 12px 12px;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.25);
        outline: 1px solid rgba(255, 255, 255, 0.16);
        transform: translate(var(--preview-offset-x, 0px), var(--preview-offset-y, 0px)) scale(var(--preview-scale, 1));
        transform-origin: top left;
        will-change: transform;
      }
    </style>
`
