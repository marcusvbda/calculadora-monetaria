if (typeof window.tailwind === 'undefined') {
    const scriptTailwind = document.createElement('script');
    scriptTailwind.src = "https://cdn.tailwindcss.com";
    scriptTailwind.onload = () => {
        tailwind.config = {
            important: '#monetary-correction-calculator',
            corePlugins: {
                preflight: false,
            },
            theme: {
                extend: {
                    fontFamily: {
                        verdana: ['Verdana'],
                    },
                },
            },
        };
        document.querySelector('#monetary-correction-calculator').style.visibility = 'visible';
    };
    document.head.appendChild(scriptTailwind);
}
