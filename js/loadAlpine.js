if (typeof window.Alpine === 'undefined') {
    const scriptAlpine = document.createElement('script');
    scriptAlpine.src = "https://cdn.jsdelivr.net/npm/alpinejs@3.x.x/dist/cdn.min.js";
    scriptAlpine.defer = true;
    document.head.appendChild(scriptAlpine);
}