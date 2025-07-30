// 動画速度コントローラー - 設定ファイルベース版
(function () {
    'use strict';

    // 設定オブジェクト
    let settings = null;

    // グローバル変数
    let currentTargetSpeed = 1;
    let videoObservers = new WeakMap();

    // 設定ファイルを読み込む
    async function loadSettings() {
        try {
            const response = await fetch(chrome.runtime.getURL('settings.json'));
            settings = await response.json();

            // 設定を適用
            currentTargetSpeed = settings.speedControl.defaultSpeed;

            if (settings.advanced.debugMode) {
                console.log('動画速度コントローラー設定読み込み完了:', settings);
            }
        } catch (error) {
            console.error('設定ファイルの読み込みに失敗:', error);
            // デフォルト設定を使用
            settings = getDefaultSettings();
        }
    }

    // デフォルト設定
    function getDefaultSettings() {
        return {
            speedControl: {
                defaultSpeed: 1.0,
                presetSpeeds: [0.25, 0.5, 0.75, 1.0, 1.25, 1.5, 1.75, 2.0, 2.5, 3.0],
                rememberLastSpeed: true,
                speedStep: 0.25,
                minSpeed: 0.1,
                maxSpeed: 5.0
            },
            ui: {
                showSpeedNotifications: true,
                notificationDuration: 1000,
                enableOnPageLoad: true
            },
            keyboard: {
                enableKeyboardShortcuts: true,
                keys: {
                    increaseSpeed: "=",
                    decreaseSpeed: "-",
                    normalSpeed: "0",
                    setSpeed025: "1",
                    setSpeed050: "2",
                    setSpeed075: "3",
                    setSpeed100: "4",
                    setSpeed125: "5",
                    setSpeed150: "6",
                    setSpeed175: "7",
                    setSpeed200: "8",
                    setSpeed250: "9",
                    setSpeed300: "q"
                },
                modifiers: {
                    increaseSpeed: ["alt"],
                    decreaseSpeed: ["alt"],
                    normalSpeed: ["alt"],
                    setSpeed025: ["alt"],
                    setSpeed050: ["alt"],
                    setSpeed075: ["alt"],
                    setSpeed100: ["alt"],
                    setSpeed125: ["alt"],
                    setSpeed150: ["alt"],
                    setSpeed175: ["alt"],
                    setSpeed200: ["alt"],
                    setSpeed250: ["alt"],
                    setSpeed300: ["alt"]
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

    // 動画の速度を設定
    function setVideoSpeed(speed) {
        currentTargetSpeed = Math.max(settings.speedControl.minSpeed,
            Math.min(settings.speedControl.maxSpeed, speed));

        const videos = document.querySelectorAll('video');
        videos.forEach(video => {
            setVideoSpeedWithProtection(video, currentTargetSpeed);
        });

        // 速度を保存（設定で有効な場合）
        if (settings.speedControl.rememberLastSpeed) {
            localStorage.setItem('videoSpeedController_speed', currentTargetSpeed);
        }

        // 通知表示（設定で有効な場合）
        if (settings.ui.showSpeedNotifications) {
            showSpeedNotification(`再生速度: ${currentTargetSpeed}x`);
        }
    }

    // 保護機能付きの速度設定
    function setVideoSpeedWithProtection(video, speed) {
        video.playbackRate = speed;
        setupSpeedProtection(video, speed);
    }

    // 速度保護機能のセットアップ
    function setupSpeedProtection(video, targetSpeed) {
        if (videoObservers.has(video)) {
            videoObservers.get(video).disconnect();
        }

        const originalPlaybackRateDescriptor = Object.getOwnPropertyDescriptor(HTMLMediaElement.prototype, 'playbackRate');

        Object.defineProperty(video, '_protectedPlaybackRate', {
            value: targetSpeed,
            writable: true,
            configurable: true
        });

        Object.defineProperty(video, 'playbackRate', {
            get: function () {
                return this._protectedPlaybackRate || originalPlaybackRateDescriptor.get.call(this);
            },
            set: function (value) {
                if (Math.abs(value - targetSpeed) > 0.01) {
                    if (settings.advanced.debugMode) {
                        console.log(`速度変更を阻止: ${value} -> ${targetSpeed}`);
                    }
                    this._protectedPlaybackRate = targetSpeed;
                    originalPlaybackRateDescriptor.set.call(this, targetSpeed);
                    return;
                }
                this._protectedPlaybackRate = value;
                originalPlaybackRateDescriptor.set.call(this, value);
            },
            configurable: true
        });

        const observer = new MutationObserver(() => {
            if (Math.abs(video.playbackRate - targetSpeed) > 0.01) {
                video.playbackRate = targetSpeed;
            }
        });

        observer.observe(video, { attributes: true, attributeFilter: ['playbackRate'] });
        videoObservers.set(video, observer);

        const protectSpeed = () => {
            if (Math.abs(video.playbackRate - targetSpeed) > 0.01) {
                video.playbackRate = targetSpeed;
            }
        };

        video.addEventListener('ratechange', protectSpeed);
        video.addEventListener('loadedmetadata', protectSpeed);
        video.addEventListener('play', protectSpeed);
    }

    // 通知表示
    function showSpeedNotification(message) {
        const notification = document.createElement('div');
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(0, 0, 0, 0.8);
            color: white;
            padding: 10px 20px;
            border-radius: 20px;
            z-index: 10001;
            font-family: Arial, sans-serif;
            font-size: 16px;
            pointer-events: none;
        `;

        document.body.appendChild(notification);

        setTimeout(() => {
            notification.remove();
        }, settings.ui.notificationDuration);
    }

    // キーボードイベントのチェック
    function checkKeyboardEvent(e, action) {
        const key = settings.keyboard.keys[action];
        const modifiers = settings.keyboard.modifiers[action] || [];

        if (e.key !== key) return false;

        const requiredModifiers = {
            alt: modifiers.includes('alt'),
            ctrl: modifiers.includes('ctrl'),
            shift: modifiers.includes('shift'),
            meta: modifiers.includes('meta')
        };

        return e.altKey === requiredModifiers.alt &&
            e.ctrlKey === requiredModifiers.ctrl &&
            e.shiftKey === requiredModifiers.shift &&
            e.metaKey === requiredModifiers.meta;
    }

    // キーボードショートカット
    function setupKeyboardShortcuts() {
        if (!settings.keyboard.enableKeyboardShortcuts) return;

        document.addEventListener('keydown', (e) => {
            let handled = false;

            // 速度増加
            if (checkKeyboardEvent(e, 'increaseSpeed')) {
                e.preventDefault();
                const newSpeed = Math.min(settings.speedControl.maxSpeed,
                    currentTargetSpeed + settings.speedControl.speedStep);
                setVideoSpeed(newSpeed);
                handled = true;
            }
            // 速度減少
            else if (checkKeyboardEvent(e, 'decreaseSpeed')) {
                e.preventDefault();
                const newSpeed = Math.max(settings.speedControl.minSpeed,
                    currentTargetSpeed - settings.speedControl.speedStep);
                setVideoSpeed(newSpeed);
                handled = true;
            }
            // 通常速度
            else if (checkKeyboardEvent(e, 'normalSpeed')) {
                e.preventDefault();
                setVideoSpeed(settings.speedControl.defaultSpeed);
                handled = true;
            }
            // プリセット速度
            else {
                const speedActions = [
                    { action: 'setSpeed025', speed: 0.25 },
                    { action: 'setSpeed050', speed: 0.5 },
                    { action: 'setSpeed075', speed: 0.75 },
                    { action: 'setSpeed100', speed: 1.0 },
                    { action: 'setSpeed125', speed: 1.25 },
                    { action: 'setSpeed150', speed: 1.5 },
                    { action: 'setSpeed175', speed: 1.75 },
                    { action: 'setSpeed200', speed: 2.0 },
                    { action: 'setSpeed250', speed: 2.5 },
                    { action: 'setSpeed300', speed: 3.0 }
                ];

                for (const speedAction of speedActions) {
                    if (checkKeyboardEvent(e, speedAction.action)) {
                        e.preventDefault();
                        setVideoSpeed(speedAction.speed);
                        handled = true;
                        break;
                    }
                }
            }

            if (handled && settings.advanced.debugMode) {
                console.log('キーボードショートカット実行:', e.key, '現在の速度:', currentTargetSpeed);
            }
        });
    }

    // 保存された速度を適用
    function applySavedSpeed() {
        if (settings.speedControl.rememberLastSpeed) {
            const savedSpeed = localStorage.getItem('videoSpeedController_speed');
            if (savedSpeed) {
                setVideoSpeed(parseFloat(savedSpeed));
                return;
            }
        }

        if (settings.ui.enableOnPageLoad && currentTargetSpeed !== settings.speedControl.defaultSpeed) {
            setVideoSpeed(settings.speedControl.defaultSpeed);
        }
    }

    // 動画要素の監視
    function observeVideos() {
        if (!settings.advanced.autoApplyToNewVideos) return;

        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeType === 1) {
                        const videos = node.querySelectorAll ? node.querySelectorAll('video') : [];
                        if (node.tagName === 'VIDEO') {
                            videos.push(node);
                        }

                        videos.forEach(video => {
                            video.addEventListener('loadedmetadata', applySavedSpeed);
                            if (settings.advanced.debugMode) {
                                console.log('新しい動画要素を検出:', video);
                            }
                        });
                    }
                });
            });
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    // 初期化
    async function init() {
        await loadSettings();

        if (settings.advanced.debugMode) {
            console.log('動画速度コントローラー初期化開始');
        }

        setupKeyboardShortcuts();
        observeVideos();

        // 既存の動画に適用
        const existingVideos = document.querySelectorAll('video');
        existingVideos.forEach(video => {
            video.addEventListener('loadedmetadata', applySavedSpeed);
        });

        if (existingVideos.length > 0) {
            applySavedSpeed();
        }

        if (settings.advanced.debugMode) {
            console.log('動画速度コントローラー初期化完了');
            showSpeedNotification('動画速度コントローラー: 起動完了');
        }
    }

    // ページ読み込み完了後に初期化
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
