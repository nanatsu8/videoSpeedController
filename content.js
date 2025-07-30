(function () {
    'use strict';

    // グローバル変数
    let settings = null;
    let currentTargetSpeed = 1;
    let videoObservers = new WeakMap();
    let savedSpeed = null;

    // デフォルト設定
    function getDefaultSettings() {
        return {
            speedControl: {
                defaultSpeed: 1.0,
                rememberLastSpeed: true,
                minSpeed: 0.1,
                maxSpeed: 5.0
            },
            ui: {
                showActionNotifications: true,
                notificationDuration: 1000,
                enableOnPageLoad: true
            },
            keyboard: {
                enableKeyboardShortcuts: true,
                defaultModifiers: ["alt"],
                actions: {
                    "=": {
                        type: "increaseSpeed",
                        step: 0.25
                    },
                    "-": {
                        type: "increaseSpeed",
                        step: -0.25
                    },
                    "0": {
                        type: "setSpeed",
                        speed: 1.0
                    },
                    "2": {
                        type: "setSpeed",
                        speed: 0.5
                    },
                    "q": {
                        type: "seekRelative",
                        time: -10
                    },
                    "w": {
                        type: "seekRelative",
                        time: 10
                    }
                }
            },
            advanced: {
                protectionMethod: "property_override",
                debugMode: false,
                autoApplyToNewVideos: true,
                checkInterval: 100
            }
        };
    }

    // 設定ファイル読み込み
    async function loadSettings() {
        try {
            const settingsUrl = chrome.runtime.getURL('settings.json');
            const response = await fetch(settingsUrl);
            if (response.ok) {
                const loadedSettings = await response.json();
                settings = { ...getDefaultSettings(), ...loadedSettings };
            } else {
                settings = getDefaultSettings();
            }
        } catch (error) {
            console.warn('[Video Speed Controller] 設定ファイルの読み込みに失敗、デフォルト設定を使用:', error);
            settings = getDefaultSettings();
        }

        // 保存された速度を復元
        if (settings.speedControl.rememberLastSpeed) {
            const saved = localStorage.getItem('videoSpeedController_lastSpeed');
            if (saved) {
                currentTargetSpeed = parseFloat(saved);
            } else {
                currentTargetSpeed = settings.speedControl.defaultSpeed;
            }
        } else {
            currentTargetSpeed = settings.speedControl.defaultSpeed;
        }
    }

    // 修飾キーのチェック
    function checkModifiers(event, requiredModifiers) {
        if (!requiredModifiers || requiredModifiers.length === 0) return true;

        for (const modifier of requiredModifiers) {
            switch (modifier.toLowerCase()) {
                case 'ctrl':
                case 'control':
                    if (!event.ctrlKey) return false;
                    break;
                case 'alt':
                    if (!event.altKey) return false;
                    break;
                case 'shift':
                    if (!event.shiftKey) return false;
                    break;
                case 'meta':
                case 'cmd':
                    if (!event.metaKey) return false;
                    break;
            }
        }
        return true;
    }

    // キーボードショートカット設定
    function setupKeyboardShortcuts() {
        if (!settings.keyboard.enableKeyboardShortcuts) return;

        document.addEventListener('keydown', (e) => {
            const action = settings.keyboard.actions[e.key];
            if (!action) return;

            // デフォルト修飾キーのチェック
            const modifiersMatch = checkModifiers(e, settings.keyboard.defaultModifiers);
            if (!modifiersMatch) return;

            e.preventDefault();
            e.stopPropagation();

            const videos = document.querySelectorAll('video');
            const activeVideo = Array.from(videos).find(v => !v.paused) || videos[0];

            if (activeVideo) {
                executeAction(action, activeVideo);
            }
        });
    }

    // アクション実行
    function executeAction(action, video) {
        switch (action.type) {
            case 'setSpeed':
                setVideoSpeed(action.speed);
                break;
            case 'increaseSpeed':
                setVideoSpeed(currentTargetSpeed + action.step);
                break;
            case 'seekRelative':
                seekRelative(video, action.time);
                break;
            default:
                console.warn('[Video Speed Controller] 未対応のアクションタイプ:', action.type);
        }
    }

    // 速度設定
    function setVideoSpeed(speed) {
        // 速度を範囲内に制限
        speed = Math.max(settings.speedControl.minSpeed, Math.min(settings.speedControl.maxSpeed, speed));
        currentTargetSpeed = speed;

        // 速度を保存
        if (settings.speedControl.rememberLastSpeed) {
            localStorage.setItem('videoSpeedController_lastSpeed', speed.toString());
        }

        // すべての動画要素に適用
        const videos = document.querySelectorAll('video');
        videos.forEach(video => {
            setupSpeedProtection(video, speed);
        });

        // 通知表示
        if (settings.ui.showActionNotifications) {
            showActionNotification(`速度: ${speed.toFixed(2)}x`);
        }

        if (settings.advanced.debugMode) {
            console.log('[Video Speed Controller] 速度設定:', speed);
        }
    }

    // 相対シーク
    function seekRelative(video, time) {
        if (!video) return;

        const newTime = video.currentTime + time;
        const clampedTime = Math.max(0, Math.min(video.duration || 0, newTime));
        video.currentTime = clampedTime;

        // 通知表示
        if (settings.ui.showActionNotifications) {
            const direction = time > 0 ? '進む' : '戻る';
            showActionNotification(`${Math.abs(time)}秒${direction}`);
        }

        if (settings.advanced.debugMode) {
            console.log('[Video Speed Controller] シーク:', time, '秒');
        }
    }

    // 速度保護設定
    function setupSpeedProtection(video, targetSpeed) {
        if (!video) return;

        // 既存の保護を解除
        if (videoObservers.has(video)) {
            videoObservers.get(video).disconnect();
        }

        // playbackRateプロパティを保護
        let protectedSpeed = targetSpeed;

        Object.defineProperty(video, 'playbackRate', {
            get: function () {
                return protectedSpeed;
            },
            set: function (value) {
                // 外部からの変更を無視し、常に保護された速度を維持
                protectedSpeed = targetSpeed;
                if (this._actualPlaybackRate !== targetSpeed) {
                    this._actualPlaybackRate = targetSpeed;
                    // 実際のレートを設定
                    Object.getPrototypeOf(this).playbackRate = targetSpeed;
                }
            },
            configurable: true
        });

        // 初期速度設定
        video._actualPlaybackRate = targetSpeed;
        Object.getPrototypeOf(video).playbackRate = targetSpeed;

        // 速度変更の監視
        const observer = new MutationObserver(() => {
            if (video.playbackRate !== targetSpeed) {
                video.playbackRate = targetSpeed;
            }
        });

        observer.observe(video, {
            attributes: true,
            attributeFilter: ['playbackRate']
        });

        videoObservers.set(video, observer);

        // 定期的な速度チェック
        const checkInterval = setInterval(() => {
            if (!document.contains(video)) {
                clearInterval(checkInterval);
                if (videoObservers.has(video)) {
                    videoObservers.get(video).disconnect();
                    videoObservers.delete(video);
                }
                return;
            }

            if (Object.getPrototypeOf(video).playbackRate !== targetSpeed) {
                Object.getPrototypeOf(video).playbackRate = targetSpeed;
            }
        }, settings.advanced.checkInterval);
    }

    // 動画要素の監視
    function observeVideos() {
        const processVideo = (video) => {
            if (!videoObservers.has(video)) {
                setupSpeedProtection(video, currentTargetSpeed);
            }
        };

        // 既存の動画要素を処理
        document.querySelectorAll('video').forEach(processVideo);

        // 新しい動画要素の監視
        if (settings.advanced.autoApplyToNewVideos) {
            const observer = new MutationObserver((mutations) => {
                mutations.forEach((mutation) => {
                    mutation.addedNodes.forEach((node) => {
                        if (node.nodeType === Node.ELEMENT_NODE) {
                            if (node.tagName === 'VIDEO') {
                                processVideo(node);
                            } else {
                                node.querySelectorAll('video').forEach(processVideo);
                            }
                        }
                    });
                });
            });

            observer.observe(document, {
                childList: true,
                subtree: true
            });
        }
    }

    // 通知表示
    function showActionNotification(message) {
        if (!settings.ui.showActionNotifications) return;

        // 既存の通知を削除
        const existingNotification = document.querySelector('#video-speed-notification');
        if (existingNotification) {
            existingNotification.remove();
        }

        // 通知要素を作成
        const notification = document.createElement('div');
        notification.id = 'video-speed-notification';
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed !important;
            top: 20px !important;
            right: 20px !important;
            background: rgba(0, 0, 0, 0.8) !important;
            color: white !important;
            padding: 10px 20px !important;
            border-radius: 5px !important;
            font-family: Arial, sans-serif !important;
            font-size: 14px !important;
            z-index: 999999 !important;
            pointer-events: none !important;
            transition: opacity 0.3s ease !important;
        `;

        document.body.appendChild(notification);

        // 自動削除
        setTimeout(() => {
            if (notification.parentNode) {
                notification.style.opacity = '0';
                setTimeout(() => {
                    if (notification.parentNode) {
                        notification.remove();
                    }
                }, 300);
            }
        }, settings.ui.notificationDuration);
    }

    // 初期化
    async function init() {
        await loadSettings();

        if (settings.ui.enableOnPageLoad) {
            // DOMContentLoaded後に実行
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', () => {
                    setupKeyboardShortcuts();
                    observeVideos();
                });
            } else {
                setupKeyboardShortcuts();
                observeVideos();
            }
        }

        if (settings.advanced.debugMode) {
            console.log('[Video Speed Controller] 初期化完了');
        }
    }

    // 拡張機能の開始
    init().catch(error => {
        console.error('[Video Speed Controller] 初期化エラー:', error);
    });

})();
