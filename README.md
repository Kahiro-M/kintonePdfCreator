# kintone PDF生成器

kintoneのレコードからPDFを生成できるプラグインです。

## 概要

このプラグインは、**kintoneのレコードから簡単にシンプルな請求書や報告書などを作成できます。** WordやExcelからPDF作成の手間を省き、業務効率を向上させることを目的としています。

## 特徴

- kintoneのレコードデータを活用し、簡単にPDFを生成。
- 生成前にプレビューで確認可能。

## 技術スタック

このプロジェクトは以下の技術・ライブラリを使用して開発されています。

- **jsPDF**
- **create-plugin** (npmパッケージ)
- **kintone UI Component v1**
- **jQuery 3.3.1** (Cybozu CDN)
- **kintone-rest-api-client 5.7.4** (Cybozu CDN)

## 利用方法

このプラグインをkintoneアプリに適用すると、以下の手順でPDFを生成できます。

1. アプリの**レコード詳細画面**を開きます。
2. 画面上部の **[プレビュー表示]** ボタンをクリックすると、PDFのプレビューが表示されます。
3. 画面上部の **[PDF出力]** ボタンをクリックすると、PDFが自動的にダウンロードされます。

## インストール手順

このプラグインをkintoneアプリにインストールする手順です。

1. GitHubの[releasesページ](https://github.com/Kahiro-M/kintonePdfCreator/releases)から `pdfCreator.zip` をダウンロードします。
2. kintoneにログインします。
3. 対象の**アプリの設定 > プラグイン > 追加する > プラグインの追加** から、インストールしたプラグインを追加します。
4. **アプリの設定 > プラグイン > プラグインの設定** から、PDF化したい項目を設定します。
    

## 開発者向けセットアップ

このプラグインをローカル環境で開発・テストするための手順です。

1. Node.jsのインストール:
   プラグインの開発にはNode.jsが必要です。公式サイトからLTS (Long Term Support) 版をインストールしてください。
2. プロジェクトのリポジトリをクローン:
	```bash
   git clone https://github.com/Kahiro-M/kintonePdfCreator.git
   cd kintonePdfCreator
   ```
3. 依存関係のインストール:
   ```bash
   npm install
   ```
4. **プラグインのビルド**:
   ```bash
   npm start
   ```
このコマンドを実行すると、対話形式でプラグインインストール先のkintone環境のログイン情報を質問されます。全て入力すると、配布用のプラグインファイル（`*.zip`）が `dist` ディレクトリ内に生成されます。ビルドされた`.zip`ファイルは、kintone環境へインストールされます。上記の「インストール手順」と同様にkintoneにアップロードしても動作を確認できます。

## コントリビューション

バグ報告や機能追加の貢献を歓迎します。

- バグ報告はGitHubの[Issues](https://www.google.com/search?q=https://github.com/Kahiro-M/kintonePdfCreator/issues)にお願いします。
- 機能追加のプルリクエストも歓迎します。機能追加のリクエストは、Qiitaの該当記事へのコメントでも受け付けています。

## 今後の展望

このプラグインは現在公開されていますが、まだ多くの機能追加を計画しています。

- 数値フィールドなどの表示設定（カンマ区切り、前後に記号追加）を反映する機能
- 2ページ以上のPDFに対応する機能
- A4以外の用紙サイズに対応する機能
- PDF生成したデータをそのレコードの添付ファイルフィールドに保存する機能
- 一覧画面でまとめてPDF生成する機能
など、「あったらいいな」と思う機能がたくさんあります。

## ライセンス

このプロジェクトは **MITライセンス** の下で公開されています。

## 謝辞

プラグインを作成するうえで、kintoneのプラグイン開発に関する情報やサンプルコードがたくさんあり、本当に助かりました。いつもありがとうございます、サイボウズさん！

特に以下のリソースを参考にさせていただきました。
- [create-plugin](https://cybozu.dev/ja/kintone/sdk/development-environment/create-plugin/)
- [jsPDFで帳票をPDF出力しよう](https://cybozu.dev/ja/kintone/tips/development/customize/development-know-how/pdfjs/)
- [Promiseのかわりにasync/awaitを使ってみよう](https://cybozu.dev/ja/kintone/tips/development/customize/development-know-how/javascript-customize-middle-async-await/)
- [kintone UI Component v1](https://cybozu.dev/ja/kintone/sdk/library/kintone-ui-component-v1/)
- [フィールド形式](https://cybozu.dev/ja/kintone/docs/overview/field-types/)
