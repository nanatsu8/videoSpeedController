# 動画速度コントローラー Chrome拡張機能

設定ファイル（`settings.json`）で完全にカスタマイズ可能な軽量動画再生速度コントローラーのChrome拡張機能です。

## 特徴

- **GUIレス設計**: ポップアップ、パネル、ボタンなどの視覚的UIは完全に排除
- **設定ファイル中心**: すべての設定を`settings.json`で管理
- **キーボード操作のみ**: マウス操作は一切不要
- **軽量・高速**: 最小限のリソースで最大のパフォーマンス
- **常時保護**: ウェブサイト側の速度変更を常に阻止
- **シンプルなキーアクション**: 速度制御とシークのみに特化

## デフォルトキーバインド

| キー組み合わせ | アクション | 説明                   |
| -------------- | ---------- | ---------------------- |
| `Alt + =`      | 速度アップ | 0.25刻みで速度を上げる |
| `Alt + -`      | 速度ダウン | 0.25刻みで速度を下げる |
| `Alt + 0`      | 通常速度   | 1.0x速度に設定         |
| `Alt + 2`      | 0.5x速度   | 0.5x速度に設定         |
| `Alt + Q`      | 10秒戻る   | 再生位置を10秒戻す     |
| `Alt + W`      | 10秒進む   | 再生位置を10秒進める   |

## 対応サイト

- YouTube, Netflix, Amazon Prime Video, Hulu, Disney+
- すべての`<video>`タグを使用するウェブサイト

## インストール

1. このリポジトリをダウンロードまたはクローン
2. Chrome拡張機能管理ページ（`chrome://extensions/`）を開く
3. 「デベロッパーモード」を有効にする
4. 「パッケージ化されていない拡張機能を読み込む」をクリック
5. このフォルダーを選択

## カスタマイズ

### settings.json編集

`settings.json`ファイルを編集することで、キーバインドや動作をカスタマイズできます。

#### キーアクション設定例

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
      "1": {
        "type": "setSpeed",
        "speed": 0.75
      },
      "3": {
        "type": "setSpeed",
        "speed": 1.5
      },
      "e": {
        "type": "seekRelative",
        "time": -5
      },
      "r": {
        "type": "seekRelative",
        "time": 5
      }
    }
  }
}
```

#### サポートするアクションタイプ

##### 1. 速度制御アクション

**絶対速度設定**
```json
{
  "type": "setSpeed",
  "speed": 1.5
}
```

**相対速度増減**
```json
{
  "type": "increaseSpeed",
  "step": 0.25
}
```
※ 正の値で増速、負の値で減速

##### 2. シーク（再生位置制御）アクション

**相対時間移動**
```json
{
  "type": "seekRelative",
  "time": 30
}
```
※ 秒単位、正の値で進む、負の値で戻る

#### 修飾キー設定

`defaultModifiers`で修飾キーを設定できます：

```json
{
  "defaultModifiers": ["ctrl"],          // Ctrl + キー
  "defaultModifiers": ["alt"],           // Alt + キー  
  "defaultModifiers": ["shift"],         // Shift + キー
  "defaultModifiers": ["ctrl", "alt"],   // Ctrl + Alt + キー
  "defaultModifiers": []                 // 修飾キーなし
}
```

#### その他の設定

```json
{
  "speedControl": {
    "defaultSpeed": 1.0,        // デフォルト速度
    "rememberLastSpeed": true,  // 最後の速度を記憶
    "minSpeed": 0.1,           // 最小速度
    "maxSpeed": 5.0            // 最大速度
  },
  "ui": {
    "showActionNotifications": true,  // アクション通知表示
    "notificationDuration": 1000,     // 通知表示時間（ミリ秒）
    "enableOnPageLoad": true          // ページ読み込み時に有効化
  },
  "advanced": {
    "debugMode": false,              // デバッグモード
    "autoApplyToNewVideos": true,    // 新しい動画に自動適用
    "checkInterval": 100             // 速度チェック間隔（ミリ秒）
  }
}
```

## ファイル構成

```
video_speed_controller/
├── manifest.json        # 拡張機能設定
├── content.js          # メインスクリプト
├── settings.json       # アクション設定ファイル
└── README.md           # 使用方法とカスタマイズ例
```

## トラブルシューティング

### キーボードショートカットが効かない場合

1. `settings.json`の`enableKeyboardShortcuts`が`true`になっているか確認
2. 修飾キー（デフォルトはAlt）が正しく押されているか確認
3. 動画が表示されているページで操作しているか確認

### 速度変更が効かない場合

1. 動画要素が正しく検出されているか確認
2. `settings.json`の`minSpeed`と`maxSpeed`の範囲内で操作しているか確認
3. ブラウザコンソールでエラーメッセージを確認

### 設定変更が反映されない場合

1. `settings.json`の文法（JSON形式）が正しいか確認
2. 拡張機能を再読み込み
3. ページをリフレッシュ

## ライセンス

MIT License
