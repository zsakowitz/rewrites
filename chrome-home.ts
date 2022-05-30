namespace Device {
  export function isPWA() {
    return window.matchMedia('(display-mode: standalone)').matches;
  }

  export function isMac() {
    return navigator.platform.includes('Mac');
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
    for (let video of document.querySelectorAll('video')) {
      video.playbackRate = 2;
    }
  }
}

namespace StackBlitz {
  export function Handler(event: KeyboardEvent) {
    let { cmdOnly, ctrlOnly } = Keyboard.Keys(event);
    let { editorBar, editorCloseButton, terminalCloseButton } = GetFocused();

    if (event.key === 'w' && ((Device.isPWA() && cmdOnly) || ctrlOnly)) {
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
      document.querySelector('.terminal-tile:focus-within') || undefined;

    return {
      terminal,
      terminalCloseButton:
        terminal?.querySelector('.Action:last-of-type') ?? undefined,
      editorTab,
      editorCloseButton: editorTab?.children[1]!,
      editorBar: document.querySelector('#editor-tabbar-0') ?? undefined,
    };
  }

  if (window.__stackblitzPreviousHandler) {
    window.removeEventListener('keydown', window.__stackblitzPreviousHandler);
  }

  export function Initialize() {
    window.__stackblitzPreviousHandler = Handler;
    window.addEventListener('keydown', Handler);
  }
}

if (location.host.includes('stackblitz.com')) {
  StackBlitz.Initialize();
} else if (document.querySelector('video')) {
  VideoPlayer.Initialize();
}

declare var __stackblitzPreviousHandler: typeof StackBlitz.Handler;
