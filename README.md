# 動画速度コントローラー Chrome拡張機能 v2.0

設定ファイル（settings.json）で完全にカスタマイズ可能な軽量動画再生速度コントローラーです。
GUIを廃止し、キーボードショートカットのみで操作する高速・軽量版です。

## 特徴

- **設定ファイルベース**: すべての設定を`settings.json`で管理
- **完全キーボード操作**: マウス不要の高速操作
- **軽量設計**: GUIなしで最小限のリソース使用
- **カスタマイズ可能**: キーバインド、速度、動作すべて設定可能
- **常時速度保護**: ウェブサイト側の速度変更を常に阻止

## 機能

- **プリセット速度**: 設定可能な任意の速度プリセット
- **カスタマイズ可能キーバインド**: すべてのキーを自由に設定
- **常時速度保護**: ウェブサイト側の再生速度上書きを常に防止
- **速度記憶機能**: 最後に設定した速度を保存・復元
- **デバッグモード**: 開発者向けの詳細ログ出力

## インストール方法

1. Chromeを開き、`chrome://extensions/` にアクセス
2. 右上の「デベロッパーモード」を有効にする
3. 「パッケージ化されていない拡張機能を読み込む」をクリック
4. このフォルダを選択

## 設定方法

`settings.json`ファイルを編集して動作をカスタマイズできます：

### 基本設定例

```json
{
  "speedControl": {
    "defaultSpeed": 1.0,
    "rememberLastSpeed": true,
    "speedStep": 0.25,
    "minSpeed": 0.1,
    "maxSpeed": 5.0
  },
  "keyboard": {
    "enableKeyboardShortcuts": true,
    "keys": {
      "increaseSpeed": "=",
      "decreaseSpeed": "-", 
      "normalSpeed": "0",
      "setSpeed100": "4"
    },
    "modifiers": {
      "increaseSpeed": ["alt"],
      "decreaseSpeed": ["alt"],
      "normalSpeed": ["alt"],
      "setSpeed100": ["alt"]
    }
  }
}
```

## デフォルトキーバインド

| キー組み合わせ | 機能                  |
| -------------- | --------------------- |
| `Alt + =`      | 速度アップ (0.25刻み) |
| `Alt + -`      | 速度ダウン (0.25刻み) |
| `Alt + 0`      | 通常速度 (1.0x)       |
| `Alt + 1`      | 0.25x速度             |
| `Alt + 2`      | 0.5x速度              |
| `Alt + 3`      | 0.75x速度             |
| `Alt + 4`      | 1.0x速度              |
| `Alt + 5`      | 1.25x速度             |
| `Alt + 6`      | 1.5x速度              |
| `Alt + 7`      | 1.75x速度             |
| `Alt + 8`      | 2.0x速度              |
| `Alt + 9`      | 2.5x速度              |
| `Alt + Q`      | 3.0x速度              |

## 設定項目詳細

### speedControl
- `defaultSpeed`: 初期速度
- `presetSpeeds`: プリセット速度一覧
- `rememberLastSpeed`: 速度記憶機能
- `speedStep`: 増減時のステップ幅
- `minSpeed`/`maxSpeed`: 速度の最小/最大値

### keyboard
- `enableKeyboardShortcuts`: ショートカット機能の有効/無効
- `keys`: 各機能のキー設定
- `modifiers`: 修飾キー設定 (alt, ctrl, shift, meta)

### ui
- `showSpeedNotifications`: 速度変更通知の表示
- `notificationDuration`: 通知表示時間(ms)
- `enableOnPageLoad`: ページ読み込み時の自動適用

### advanced
- `protectionMethod`: 保護方式 ("property_override")
- `debugMode`: デバッグモード
- `autoApplyToNewVideos`: 新しい動画への自動適用
- `checkInterval`: チェック間隔(ms)

## カスタマイズ例

### 速度を細かく制御したい場合
```json
{
  "speedControl": {
    "speedStep": 0.1,
    "presetSpeeds": [0.1, 0.25, 0.5, 0.75, 1.0, 1.1, 1.2, 1.3, 1.4, 1.5, 2.0, 3.0]
  }
}
```

### 異なるキーバインドを使用したい場合
```json
{
  "keyboard": {
    "keys": {
      "increaseSpeed": "ArrowUp",
      "decreaseSpeed": "ArrowDown",
      "normalSpeed": "Home"
    },
    "modifiers": {
      "increaseSpeed": ["ctrl"],
      "decreaseSpeed": ["ctrl"],
      "normalSpeed": ["ctrl"]
    }
  }
}
```

## 対応サイト

この拡張機能は `<video>` タグを使用しているすべてのサイトで動作します：

- YouTube
- Netflix
- Amazon Prime Video
- Hulu
- Disney+
- その他多数の動画サイト

## トラブルシューティング

### 設定が反映されない場合
1. `settings.json`の構文が正しいか確認
2. ページをリロード
3. Chrome拡張機能を再読み込み

### キーショートカットが動作しない場合
1. `enableKeyboardShortcuts`が`true`か確認
2. 他の拡張機能との競合を確認
3. デバッグモードを有効にしてコンソールを確認

### 速度保護が効かない場合
1. `enableSpeedProtection`が`true`か確認
2. `protectionMethod`の設定を確認
3. 一部のサイトは特殊な実装のため完全に防げない場合があります

## ファイル構成

- `manifest.json`: 拡張機能の設定
- `content.js`: メインスクリプト
- `settings.json`: 設定ファイル（カスタマイズ可能）

## 更新履歴

### v2.0
- GUI完全削除
- 設定ファイルベースに移行
- キーボードショートカット完全カスタマイズ対応
- 軽量化・高速化
- デバッグモード追加

### v1.0
- 初回リリース（GUI版）
