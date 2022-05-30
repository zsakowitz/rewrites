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

    if (event.key === 'w' && ((Device.isPWA() && cmdOnly) || ctrlOnly)) {
      let currentTab = document.querySelector(
        '[class*="Editor-module-panel"]:focus-within #editor-tabbar-0 > [class*=focused]'
      );

      if (currentTab) {
        (currentTab.children[1] as any).click();
      }

      event.preventDefault();
    }
  }

  if (StackBlitz.PreviousHandler) {
    window.removeEventListener('keydown', StackBlitz.PreviousHandler);
  }

  export function Initialize() {
    window.addEventListener('keydown', Handler);
  }

  export let PreviousHandler = Handler;
}

if (location.host.includes('stackblitz.com')) {
  StackBlitz.Initialize();
} else if (document.querySelector('video')) {
  VideoPlayer.Initialize();
}
