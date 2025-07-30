# 動画速度コントローラー Chrome拡張機能 作成プロンプト（軽量版）

## 概要
設定ファイル（`settings.json`）で完全にカスタマイズ可能な軽量動画再生速度コントローラーのChrome拡張機能を作成してください。キーボードショートカットで速度制御とシーク機能を提供する軽量版です。

## 🎯 基本要件

### 設計思想
- **GUIレス設計**: ポップアップ、パネル、ボタンなどの視覚的UIは完全に排除
- **設定ファイル中心**: すべての設定を`settings.json`で管理
- **キーボード操作のみ**: マウス操作は一切不要
- **軽量・高速**: 最小限のリソースで最大のパフォーマンス
- **常時保護**: ウェブサイト側の速度変更を常に阻止（切り替え不可）
- **シンプルなキーアクション**: 速度制御とシークのみに特化

### 対象サイト
- YouTube, Netflix, Amazon Prime Video, Hulu, Disney+
- すべての`<video>`タグを使用するウェブサイト

## 🎮 キーアクション設定

### キーアクション設定構造
```json
{
  "keyboard": {
    "enableKeyboardShortcuts": true,
    "defaultModifiers": ["alt"],
    "actions": {
      "=": {
        "type": "increaseSpeed",
        "step": 0.25
      },
      "-": {
        "type": "increaseSpeed",
        "step": -0.25
      },
      "0": {
        "type": "setSpeed",
        "speed": 1.0
      },
      "2": {
        "type": "setSpeed",
        "speed": 0.5
      },
      "q": {
        "type": "seekRelative",
        "time": -10
      },
      "w": {
        "type": "seekRelative",
        "time": 10
      }
    }
  }
}
```

### サポートするアクションタイプ

#### 1. 速度制御アクション
```json
// 絶対速度設定
{
  "type": "setSpeed",
  "speed": 1.0
}

// 相対速度増減（正の値で増速、負の値で減速）
{
  "type": "increaseSpeed",
  "step": 0.25
}
```

#### 2. シーク（再生位置制御）アクション
```json
// 相対時間移動（秒単位、正の値で進む、負の値で戻る）
{
  "type": "seekRelative",
  "time": 10
}
```

## ⚙️ 必要なファイルと内容

### 1. `manifest.json`
```json
{
    "manifest_version": 3,
    "name": "動画速度コントローラー",
    "version": "2.0",
    "description": "軽量動画速度・シークコントローラー",
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
    "minSpeed": 0.1,
    "maxSpeed": 5.0
  },
  "ui": {
    "showActionNotifications": true,
    "notificationDuration": 1000,
    "enableOnPageLoad": true
  },
  "keyboard": {
    "enableKeyboardShortcuts": true,
    "defaultModifiers": ["alt"],
    "actions": {
      "=": {
        "type": "increaseSpeed",
        "step": 0.25
      },
      "-": {
        "type": "increaseSpeed",
        "step": -0.25
      },
      "0": {
        "type": "setSpeed",
        "speed": 1.0
      },
      "2": {
        "type": "setSpeed",
        "speed": 0.5
      },
      "q": {
        "type": "seekRelative",
        "time": -10
      },
      "w": {
        "type": "seekRelative",
        "time": 10
      }
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
    let savedSpeed = null;

    // 必須機能
    async function loadSettings() { /* 設定ファイル読み込み */ }
    function getDefaultSettings() { /* デフォルト設定 */ }
    
    // アクション実行機能（3種類のみ）
    function executeAction(action, video) { /* アクション実行 */ }
    function setVideoSpeed(speed) { /* 速度設定 */ }
    function seekRelative(video, time) { /* 相対シーク */ }
    
    // 基盤機能
    function setupSpeedProtection(video, targetSpeed) { /* 速度保護 */ }
    function setupKeyboardShortcuts() { /* キーボード制御 */ }
    function observeVideos() { /* 動画要素監視 */ }
    function showActionNotification(message) { /* 通知表示 */ }

    // 初期化
    async function init() { /* 初期化処理 */ }
})();
```

#### キーボードショートカット処理
```javascript
function setupKeyboardShortcuts() {
    if (!settings.keyboard.enableKeyboardShortcuts) return;

    document.addEventListener('keydown', (e) => {
        const action = settings.keyboard.actions[e.key];
        if (!action) return;

        // デフォルト修飾キーのチェック
        const modifiersMatch = checkModifiers(e, settings.keyboard.defaultModifiers);
        if (!modifiersMatch) return;

        e.preventDefault();
        
        const videos = document.querySelectorAll('video');
        const activeVideo = Array.from(videos).find(v => !v.paused) || videos[0];
        
        if (activeVideo) {
            executeAction(action, activeVideo);
        }
    });
}

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
            console.warn('未対応のアクションタイプ:', action.type);
    }
}
```

## 🎮 デフォルトキーバインド

| キー組み合わせ | アクション    | 変数        | 説明                   |
| -------------- | ------------- | ----------- | ---------------------- |
| `Alt + =`      | increaseSpeed | step: 0.25  | 速度アップ（0.25刻み） |
| `Alt + -`      | increaseSpeed | step: -0.25 | 速度ダウン（0.25刻み） |
| `Alt + 0`      | setSpeed      | speed: 1.0  | 通常速度（1.0x）       |
| `Alt + 2`      | setSpeed      | speed: 0.5  | 0.5x速度               |
| `Alt + Q`      | seekRelative  | time: -10   | 10秒戻る               |
| `Alt + W`      | seekRelative  | time: 10    | 10秒進む               |

## 🔧 技術仕様

### 必須技術要素
- **IIFE**: `(function() { 'use strict'; })();`でスコープ分離
- **WeakMap**: 動画要素とオブザーバーの関連付け
- **Object.defineProperty**: playbackRateプロパティの保護
- **MutationObserver**: DOM変更の監視
- **localStorage**: 速度記憶機能
- **async/await**: 設定ファイル読み込み

### アクション処理アーキテクチャ
```javascript
// アクション実行の基本構造（3種類のアクションのみ）
function executeAction(action, video) {
    switch (action.type) {
        case 'setSpeed':      // 絶対速度設定
        case 'increaseSpeed': // 相対速度増減
        case 'seekRelative':  // 相対シーク
    }
}
```

## 📦 最終ファイル構成

```
video_speed_controller/
├── manifest.json        # 拡張機能設定
├── content.js          # メインスクリプト（約300行）
├── settings.json       # アクション設定ファイル
└── README.md           # 使用方法とカスタマイズ例
```

## 🎯 成功基準

1. **シンプル性**: 必要最小限の3つのアクションタイプのみ実装
2. **軽量性**: 不要な機能を排除した軽量設計
3. **確実性**: 速度制御とシーク機能が確実に動作
4. **カスタマイズ性**: 設定ファイルで速度やシーク時間を調整可能
5. **保護機能**: ウェブサイト側の速度変更を確実に阻止

## 🚫 実装不要な機能

以下の機能は実装しません：
- multiplySpeed（倍率速度変更）
- seekToPercent（パーセントシーク）
- seekToTime（絶対シーク）
- togglePause（再生停止切り替え）
- adjustVolume（音量調整）
- saveSpeed/restoreSpeed（速度保存復元）
- toggleFullscreen（フルスクリーン切り替え）
- その他の高度な機能

この仕様に従って、速度制御とシーク機能に特化したシンプルで軽量な動画速度コントローラーを作成してください。