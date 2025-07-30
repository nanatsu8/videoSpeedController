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
                "actions": {
                    "q": {
                        "type": "setSpeed",
                        "speed": 1.0
                    },
                    "w": {
                        "type": "setSpeed",
                        "speed": 1.5
                    },
                    "e": {
                        "type": "setSpeed",
                        "speed": 2.0
                    },
                    "a": {
                        "type": "increaseSpeed",
                        "step": -0.5
                    },
                    "d": {
                        "type": "increaseSpeed",
                        "step": 0.5
                    },
                    "z": {
                        "type": "increaseSpeed",
                        "step": -0.1
                    },
                    "x": {
                        "type": "increaseSpeed",
                        "step": 0.1
                    },
                    "v": {
                        "type": "seekRelative",
                        "time": -2
                    },
                    "b": {
                        "type": "seekRelative",
                        "time": 2
                    },
                    "g": {
                        "type": "seekRelative",
                        "time": -6
                    },
                    "h": {
                        "type": "seekRelative",
                        "time": 6
                    },
                    "y": {
                        "type": "seekRelative",
                        "time": -18
                    },
                    "u": {
                        "type": "seekRelative",
                        "time": 18
                    },
                    "n": {
                        "type": "seekRelative",
                        "time": 80
                    },
                    "p": {
                        "type": "seekRelative",
                        "time": 36000
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
            if (video._updateSpeed) {
                // 既に保護されている動画の場合は専用関数を使用
                video._updateSpeed(speed);
            } else {
                // 新しい動画の場合は保護設定から開始
                setupSpeedProtection(video, speed);
            }
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
            const existingData = videoObservers.get(video);
            if (existingData.observer) existingData.observer.disconnect();
            if (existingData.interval) clearInterval(existingData.interval);
        }

        // 元のplaybackRateプロパティの記述子を取得
        const originalDescriptor = Object.getOwnPropertyDescriptor(video, 'playbackRate') ||
            Object.getOwnPropertyDescriptor(Object.getPrototypeOf(video), 'playbackRate') ||
            Object.getOwnPropertyDescriptor(HTMLMediaElement.prototype, 'playbackRate');

        // まず直接速度を設定
        try {
            if (originalDescriptor && originalDescriptor.set) {
                originalDescriptor.set.call(video, targetSpeed);
            } else {
                video.playbackRate = targetSpeed;
            }
        } catch (error) {
            console.warn('[Video Speed Controller] 初期速度設定エラー:', error);
        }

        // 保護されたplaybackRateプロパティを定義
        let protectedSpeed = targetSpeed;
        let isInternalChange = false;

        Object.defineProperty(video, 'playbackRate', {
            get: function () {
                return protectedSpeed;
            },
            set: function (value) {
                if (isInternalChange) {
                    // 内部からの変更は許可
                    protectedSpeed = value;
                    if (originalDescriptor && originalDescriptor.set) {
                        originalDescriptor.set.call(this, value);
                    }
                } else {
                    // 外部からの変更は拒否し、保護された速度に戻す
                    setTimeout(() => {
                        if (protectedSpeed !== value) {
                            isInternalChange = true;
                            this.playbackRate = protectedSpeed;
                            isInternalChange = false;
                        }
                    }, 0);
                }
            },
            configurable: true
        });

        // 速度更新用の関数
        video._updateSpeed = function (newSpeed) {
            protectedSpeed = newSpeed;
            isInternalChange = true;
            this.playbackRate = newSpeed;
            isInternalChange = false;
        };

        // 初期速度を設定
        video._updateSpeed(targetSpeed);

        // 速度変更の監視（MutationObserverは使用しない）
        const observer = null;

        // 定期的な速度チェック
        const checkInterval = setInterval(() => {
            if (!document.contains(video)) {
                clearInterval(checkInterval);
                if (videoObservers.has(video)) {
                    videoObservers.delete(video);
                }
                return;
            }

            // 実際の再生速度をチェックして強制的に修正
            try {
                if (originalDescriptor && originalDescriptor.get) {
                    const actualRate = originalDescriptor.get.call(video);
                    if (Math.abs(actualRate - protectedSpeed) > 0.01) {
                        video._updateSpeed(protectedSpeed);
                    }
                }
            } catch (error) {
                // エラーは無視
            }
        }, settings.advanced.checkInterval);

        videoObservers.set(video, { observer, interval: checkInterval });
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
