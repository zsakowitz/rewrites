// A JS shortcut that adds proper keyboard shortcuts to StackBlitz and doubles
// the speed of a video in YouTube when activated. #bookmarklet

namespace Device {
  export function isPWA() {
    return window.matchMedia("(display-mode: standalone)").matches;
  }

  export function isMac() {
    return navigator.platform.includes("Mac");
  }
}

namespace Keyboard {
  export function Keys({ altKey, ctrlKey, metaKey, shiftKey }: KeyboardEvent) {
    let altOnly = altKey && !metaKey && !ctrlKey;
    let ctrlOnly = ctrlKey && !metaKey && !altKey;
    let metaOnly = metaKey && !ctrlKey && !altKey;
    let cmdOnly = Device.isMac() ? metaOnly : ctrlOnly;

    return {
      altOnly,
      cmdOnly,
      ctrlOnly,
      metaOnly,
      shift: shiftKey,
    };
  }
}

namespace VideoPlayer {
  export function Initialize() {
    for (let video of document.querySelectorAll("video")) {
      video.playbackRate = 2;
    }
  }
}

namespace StackBlitz {
  export function Handler(event: KeyboardEvent) {
    let { cmdOnly, ctrlOnly } = Keyboard.Keys(event);
    let { editorBar, editorCloseButton, terminalCloseButton } = GetFocused();

    if (event.key === "w" && ((Device.isPWA() && cmdOnly) || ctrlOnly)) {
      if (terminalCloseButton) {
        (terminalCloseButton as any).click();
      } else if (editorCloseButton) {
        (editorCloseButton as any).click();
      } else if (!editorBar) {
        // close window
        return;
      }

      event.preventDefault();
    }
  }

  export function GetFocused() {
    let editorTab =
      document.querySelector(
        '[class*="Editor-module-panel"]:focus-within #editor-tabbar-0 > [class*=focused]'
      ) || undefined;

    let terminal =
      document.querySelector(".terminal-tile:focus-within") || undefined;

    return {
      terminal,
      terminalCloseButton:
        terminal?.querySelector(".Action:last-of-type") ?? undefined,
      editorTab,
      editorCloseButton: editorTab?.children[1]!,
      editorBar: document.querySelector("#editor-tabbar-0") ?? undefined,
    };
  }

  if (window.__stackblitzPreviousHandler) {
    window.removeEventListener("keydown", window.__stackblitzPreviousHandler);
  }

  export function Initialize() {
    window.__stackblitzPreviousHandler = Handler;
    window.addEventListener("keydown", Handler);
  }
}

namespace GoogleDocs {
  function createFrame() {
    const frame = document.createElement("iframe");
    frame.style.display = "block";
    frame.style.position = "fixed";
    frame.style.zIndex = "1000000";
    frame.style.top = "122.5px";
    frame.style.right = "72px";
    frame.style.width = "420px";
    frame.style.height = "calc(100vh - 185px)";
    frame.style.border = "none";
    frame.setAttribute("crossorigin", "anonymous");
    frame.src = "https://zsnout.com/";
    return frame;
  }

  export function Initialize() {
    const frame = createFrame();
    window.frame = frame;
    document.body.appendChild(frame);
  }
}

if (location.host.includes("stackblitz.com")) {
  StackBlitz.Initialize();
} else if (
  location.host.includes("docs.google.com") &&
  location.pathname.startsWith("/document")
) {
  GoogleDocs.Initialize();
} else if (document.querySelector("video")) {
  VideoPlayer.Initialize();
}

declare global {
  var __stackblitzPreviousHandler: typeof StackBlitz.Handler;
  var frame: HTMLIFrameElement;
}

export {};
