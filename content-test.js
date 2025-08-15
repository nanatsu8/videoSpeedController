(function () {
    'use strict';

    console.log('[Video Speed Controller] 拡張機能が読み込まれました');

    // 簡単なテスト通知
    function showTestNotification() {
        const notification = document.createElement('div');
        notification.textContent = 'Video Speed Controller - テスト中';
        notification.style.cssText = `
            position: fixed !important;
            top: 20px !important;
            right: 20px !important;
            background: red !important;
            color: white !important;
            padding: 10px 20px !important;
            border-radius: 5px !important;
            font-family: Arial, sans-serif !important;
            font-size: 14px !important;
            z-index: 999999 !important;
            pointer-events: none !important;
        `;
        document.body.appendChild(notification);

        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 3000);
    }

    // ページ読み込み後にテスト通知を表示
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', showTestNotification);
    } else {
        showTestNotification();
    }

    // キーボードテスト (Alt + T)
    document.addEventListener('keydown', (e) => {
        if (e.altKey && e.key === 't') {
            console.log('[Video Speed Controller] Alt+T が押されました');
            showTestNotification();
        }
    });

})();
