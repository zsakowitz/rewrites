function isPWA() {
  return window.matchMedia('(display-mode: standalone)').matches;
}

function isMac() {
  return navigator.platform.includes('Mac');
}

function getActiveShortcuts(event: KeyboardEvent) {
  let altOnly = event.altKey && !event.metaKey && !event.ctrlKey;
  let ctrlOnly = event.ctrlKey && !event.metaKey && !event.altKey;
  let metaOnly = event.metaKey && !event.ctrlKey && !event.altKey;
  let cmdOnly = isMac() ? metaOnly : ctrlOnly;

  return { altOnly, cmdOnly, ctrlOnly, metaOnly };
}

function handler(event: KeyboardEvent) {
  let { cmdOnly } = getActiveShortcuts(event);

  if (cmdOnly && event.key === 'w') {
    let currentTab = document.querySelector(
      '[class*="Editor-module-panel"]:focus-within #editor-tabbar-0 > [class*=focused]'
    );

    if (currentTab) {
      (currentTab.children[1] as any).click();
    }

    event.preventDefault();
  }
}

window.oldChromeHome = handler;

if (location.host.includes('stackblitz.com')) {
  if (oldChromeHome) {
    window.removeEventListener('keydown', oldChromeHome);
  }

  window.addEventListener('keydown', handler);
}

declare var oldChromeHome: typeof handler | undefined;
