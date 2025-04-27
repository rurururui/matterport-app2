# Matterport Tag Manager

Matterport スペース上にタグ(Mattertag)を追加・管理する Web アプリケーションです。
Vanilla TypeScript + Vite + Tailwind CSS をベースに、Matterport Showcase SDK と Matterport GraphQL API を使用しています。

---

## 📦 使用技術

- [Vite](https://vitejs.dev/)（ビルドツール）
- [TypeScript](https://www.typescriptlang.org/)
- [Tailwind CSS](https://tailwindcss.com/)（スタイリング）
- [Matterport Showcase SDK](https://support.matterport.com/s/article/Showcase-SDK-Overview)
- [Matterport Public API](https://api.matterport.com/)

---

## 🚀 セットアップ方法

### 1. プロジェクトクローン & インストール

```bash
git clone https://github.com/rurururui/matterport-app2.git
cd matterport-app2
npm install
```

### 2. `.env` ファイルを作成

プロジェクトルートに `.env` を作成し以下を記述：

```dotenv
VITE_MATTERPORT_SDK_KEY=your-matterport-sdk-key
VITE_MATTERPORT_MODEL_SID=your-matterport-model-sid
VITE_MATTERPORT_USERNAME=your-api-username
VITE_MATTERPORT_PASSWORD=your-api-password
```

> **注意**  
> `.env` ファイルは Git 等に含めないよう注意してください！

---

### 3. 開発サーバ起動

```bash
npm run dev
```

ブラウザで `http://localhost:5173` にアクセスします。

---

## 🧹 主な機能

| 機能                    | 説明                                                |
| :---------------------- | :-------------------------------------------------- |
| Matterport スペース表示 | SDK 経由で任意のスペースを表示                      |
| カーソル停止で座標取得  | ポインタ停止後、500ms でボタン表示                  |
| タグ作成                | モーダルでラベルを入力し GraphQL API 経由でタグ作成 |
| 成功トースト通知        | 操作成功時にポップアップ通知                        |

---

## ⚙️ プロジェクト構成

```
/src
  tagService.ts
  main.ts
  types.ts
  style.css
.env
index.html
vite.config.ts
```

---

## 📄 環境変数一覧

| 変数名                    | 説明                                  |
| :------------------------ | :------------------------------------ |
| VITE_MATTERPORT_SDK_KEY   | Matterport SDK Key                    |
| VITE_MATTERPORT_MODEL_SID | 表示する Matterport モデル ID         |
| VITE_MATTERPORT_USERNAME  | Matterport API Basic 認証用ユーザー名 |
| VITE_MATTERPORT_PASSWORD  | Matterport API Basic 認証用パスワード |

---

## 🛡️ 注意事項

- Matterport API は Basic 認証を使用します。クレデンシャル情報の管理には十分注意してください。
- Matterport Showcase SDK を使用するためには使用許可が必要です。
- 本番環境ではプロキシーサーバーを通して API を利用することを推奨します。

---

## 💻 おすすめの VSCode 拡張機能

開発をより速く、楽に、きれいに進めるために、以下の拡張機能の導入をおすすめします：

| 拡張機能  | 説明                                                               |
| :-------- | :----------------------------------------------------------------- |
| ESLint    | コードの文法エラーや警告をリアルタイムで検出してくれるリントツール |
| Prettier  | コードのフォーマットを自動で整えてくれる整形ツール                 |
| DotENV    | `.env`ファイルのハイライトと補完サポート                           |
| GitLens   | Git の履歴や変更内容を可視化してくれる強力な拡張                   |
| Git Graph | Git の変更履歴管理ツール                                           |

---

## 📚 参考リンク

- [Matterport Showcase SDK Overview](https://support.matterport.com/s/article/Showcase-SDK-Overview)
- [Matterport API Reference](https://api.matterport.com/docs/reference)

---
