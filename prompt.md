# 動画速度コントローラー Chrome拡張機能 作成プロンプト

## 概要
設定ファイル（`settings.json`）で完全にカスタマイズ可能な軽量動画再生速度コントローラーのChrome拡張機能を作成してください。GUIを一切使用せず、キーボードショートカットのみで操作する高速・軽量版です。

## 🎯 基本要件

### 設計思想
- **GUIレス設計**: ポップアップ、パネル、ボタンなどの視覚的UIは完全に排除
- **設定ファイル中心**: すべての設定を`settings.json`で管理
- **キーボード操作のみ**: マウス操作は一切不要
- **軽量・高速**: 最小限のリソースで最大のパフォーマンス
- **常時保護**: ウェブサイト側の速度変更を常に阻止（切り替え不可）

### 対象サイト
- YouTube, Netflix, Amazon Prime Video, Hulu, Disney+
- すべての`<video>`タグを使用するウェブサイト

## 🛡️ 速度保護機能（必須）

### 保護メカニズム
```javascript
// playbackRateプロパティの完全保護
Object.defineProperty(video, 'playbackRate', {
    get: function() { return this._protectedPlaybackRate; },
    set: function(value) { 
        // ウェブサイト側の変更を無視し、常に目標速度を維持
        this._protectedPlaybackRate = currentTargetSpeed;
    },
    configurable: true
});
```

### 監視機能
- `ratechange`イベントの監視
- `loadedmetadata`イベントでの速度再適用
- MutationObserverによる新しい動画要素の検出

## ⚙️ 必要なファイルと内容

### 1. `manifest.json`
```json
{
    "manifest_version": 3,
    "name": "動画速度コントローラー",
    "version": "2.0",
    "description": "設定ファイルで管理する軽量な動画再生速度コントローラー",
    "permissions": [
        "activeTab"
    ],
    "content_scripts": [
        {
            "matches": [
                "<all_urls>"
            ],
            "js": [
                "content.js"
            ]
        }
    ],
    "web_accessible_resources": [
        {
            "resources": [
                "settings.json"
            ],
            "matches": [
                "<all_urls>"
            ]
        }
    ]
}
```

### 2. `settings.json`
```json
{
  "speedControl": {
    "defaultSpeed": 1.0,
    "rememberLastSpeed": true,
    "speedStep": 0.25,
    "minSpeed": 0.1,
    "maxSpeed": 5.0,
    "presetSpeeds": {
      "1": 0.25,
      "2": 0.5,
      "3": 0.75,
      "4": 1.0,
      "5": 1.25,
      "6": 1.5,
      "7": 1.75,
      "8": 2.0,
      "9": 2.5,
      "q": 3.0
    }
  },
  "ui": {
    "showSpeedNotifications": true,
    "notificationDuration": 1000,
    "enableOnPageLoad": true
  },
  "keyboard": {
    "enableKeyboardShortcuts": true,
    "keys": {
      "increaseSpeed": "=",
      "decreaseSpeed": "-",
      "normalSpeed": "0"
    },
    "modifiers": {
      "increaseSpeed": ["alt"],
      "decreaseSpeed": ["alt"],
      "normalSpeed": ["alt"]
    }
  },
  "advanced": {
    "protectionMethod": "property_override",
    "debugMode": false,
    "autoApplyToNewVideos": true,
    "checkInterval": 100
  }
}
```

### 3. `content.js` の主要機能

#### 必須実装項目
```javascript
(function () {
    'use strict';

    // グローバル変数
    let settings = null;
    let currentTargetSpeed = 1;
    let videoObservers = new WeakMap();

    // 必須機能
    async function loadSettings() { /* 設定ファイル読み込み */ }
    function getDefaultSettings() { /* デフォルト設定 */ }
    function setVideoSpeed(speed) { /* 速度設定 */ }
    function setupSpeedProtection(video, targetSpeed) { /* 速度保護 */ }
    function setupKeyboardShortcuts() { /* キーボード制御 */ }
    function observeVideos() { /* 動画要素監視 */ }
    function showSpeedNotification(message) { /* 通知表示 */ }

    // 初期化
    async function init() { /* 初期化処理 */ }
})();
```

#### キーボードショートカット処理
```javascript
// プリセット速度の動的処理
for (const [key, speed] of Object.entries(settings.speedControl.presetSpeeds)) {
    if (e.key === key && checkModifiers(e)) {
        e.preventDefault();
        setVideoSpeed(speed);
        handled = true;
        break;
    }
}
```

### 4. `README.md`

#### 必要なセクション
- インストール方法
- 設定方法の詳細説明
- デフォルトキーバインド表
- カスタマイズ例（学習用、エンターテイメント用など）
- 設定項目の詳細説明
- トラブルシューティング

## 🎮 デフォルトキーバインド

| キー組み合わせ | 機能                   |
| -------------- | ---------------------- |
| `Alt + =`      | 速度アップ（0.25刻み） |
| `Alt + -`      | 速度ダウン（0.25刻み） |
| `Alt + 0`      | 通常速度（1.0x）       |
| `Alt + 1`      | 0.25x速度              |
| `Alt + 2`      | 0.5x速度               |
| `Alt + 3`      | 0.75x速度              |
| `Alt + 4`      | 1.0x速度               |
| `Alt + 5`      | 1.25x速度              |
| `Alt + 6`      | 1.5x速度               |
| `Alt + 7`      | 1.75x速度              |
| `Alt + 8`      | 2.0x速度               |
| `Alt + 9`      | 2.5x速度               |
| `Alt + Q`      | 3.0x速度               |

## 🔧 技術仕様

### 必須技術要素
- **IIFE**: `(function() { 'use strict'; })();`でスコープ分離
- **WeakMap**: 動画要素とオブザーバーの関連付け
- **Object.defineProperty**: playbackRateプロパティの保護
- **MutationObserver**: DOM変更の監視
- **localStorage**: 速度記憶機能
- **async/await**: 設定ファイル読み込み

### エラーハンドリング
```javascript
try {
    const response = await fetch(chrome.runtime.getURL('settings.json'));
    settings = await response.json();
} catch (error) {
    console.error('設定ファイルの読み込みに失敗:', error);
    settings = getDefaultSettings();
}
```

## 🚫 禁止事項

### 実装してはいけない機能
- ポップアップUI（popup.html, popup.js）
- 画面上パネル表示
- ボタンやスライダーなどのGUI要素
- 速度保護の切り替え機能
- マウス操作による制御
- 不要な権限要求

### 削除すべきファイル
- `popup.html`
- `popup.js`
- `styles.css`

## 📦 最終ファイル構成

```
video_speed_controller/
├── manifest.json        # 拡張機能設定
├── content.js          # メインスクリプト（約300行）
└── settings.json       # 設定ファイル