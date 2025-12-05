
// Headless Content Script (TypeScript)
console.log('Headless: Content script loaded and running!');

const HIDE_STYLE_ID = 'headless-style';
const HIDE_CLASS = 'headless-hidden';

function getHideStyle(): HTMLElement | null {
    return document.getElementById(HIDE_STYLE_ID);
}

function removeHeader() {
    // 1. Inject Style if not exists
    if (!getHideStyle()) {
        const style = document.createElement('style');
        style.id = HIDE_STYLE_ID;
        style.textContent = `
            header, .header, #header, [role="banner"],
            .site-header, .page-header, .navbar, .nav, .top-bar,
            div[class*="header"], div[class*="nav"], div[id*="header"],
            .${HIDE_CLASS} {
                display: none !important;
            }
        `;
        document.head?.appendChild(style);
    }

    // 2. Aggressive Heuristic Check (for sticky/fixed banners)
    const winWidth = window.innerWidth;

    // Using a more specific selector strategy or just body * (careful with perf)
    // For now, let's target div and navs to optimize
    const candidates = document.querySelectorAll('div, nav, section, [role="banner"]');

    candidates.forEach((el) => {
        const element = el as HTMLElement;
        if (element.classList.contains(HIDE_CLASS)) return;

        const rect = element.getBoundingClientRect();
        if (rect.top <= 50 && rect.height > 0 && rect.height < 400 && rect.width > winWidth * 0.8) {
             const style = window.getComputedStyle(element);
             if (style.position === 'fixed' || style.position === 'sticky') {
                 element.classList.add(HIDE_CLASS);
             }
        }
    });

    console.log('Headless: Headers hidden.');
}

function restoreHeader() {
    const style = getHideStyle();
    if (style) {
        style.remove();
    }

    const hiddenElements = document.querySelectorAll(`.${HIDE_CLASS}`);
    hiddenElements.forEach(el => {
        el.classList.remove(HIDE_CLASS);
    });

    console.log('Headless: Headers restored.');
}

// Check auto-remove setting on load
chrome.storage?.local.get(['autoRemove'], (result) => {
    if (result.autoRemove) {
        removeHeader();
    }
});

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
    if (request.action === 'REMOVE') {
        removeHeader();
        sendResponse({ success: true });
    } else if (request.action === 'RESTORE') {
        restoreHeader();
        sendResponse({ success: true });
    }
});
