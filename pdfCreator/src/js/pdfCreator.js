const { jsPDF } = window.jspdf;

(function () {
  'use strict';
  const PLUGIN_ID = kintone.$PLUGIN_ID;

  kintone.events.on('app.record.detail.show', function (event) {
    const record = event.record;
    const recordId = kintone.app.record.getId();
    const appId = kintone.app.getId();
    const timestamp = getCurrentTimestamp();
    const previewSpace = kintone.app.record.getSpaceElement('pdf_preview_space');
    if (previewSpace) {
      previewSpace.innerHTML = '';
      previewSpace.style.height = '600px';
      previewSpace.style.width = '390px';
      previewSpace.style.border = '1px solid #ccc';
      previewSpace.style.marginTop = '10px';
    }

    const config = kintone.plugin.app.getConfig(PLUGIN_ID);
    const fieldCodes = config.fields ? JSON.parse(config.fields) : [];

    // PDF出力ボタンの作成
    if(document.getElementById('pdf-export-button')===null){
      const exportBtn = document.createElement('button');
      exportBtn.id = 'pdf-export-button';
      exportBtn.textContent = 'PDF出力📃';
      exportBtn.className = 'kintoneplugin-button-normal'; // kintone風の見た目に
      exportBtn.style.marginLeft = '8px';
      kintone.app.record.getHeaderMenuSpaceElement().appendChild(exportBtn);
    }
    const btn = document.getElementById('pdf-export-button');

    // 画像形式を取得する関数
    function getImageFormatFromDataURL(dataURL) {
      if(typeof dataURL !== 'string'){
        return null;
      }
      if(dataURL.startsWith('data:image/png')){
        return 'PNG';
      }
      if(dataURL.startsWith('data:image/jpeg')){
        return 'JPEG';
      }
      if(dataURL.startsWith('data:image/jpg')){
        return 'JPEG';
      }
      if(dataURL.startsWith('data:image/webp')){
        return 'WEBP'; // jsPDF対応は環境による
      }
      // 対応してない/不明な形式はPNGをデフォルトに
      return 'PNG';
    }

    // 画像の読み込みをPromiseでラップする関数
    function loadImage(base64) {
      return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error('画像の読み込みに失敗しました'));
        img.src = base64;
      });
    }

    /**
     * PDF作成関数（複数フィールド対応）
     */
    async function createPDF(record) {
      const doc = new jsPDF();

      // 背景画像の設定
      const bgImg = config.bg_img;
      if (bgImg) {
        const img = await loadImage(config.bg_img);
        const imgW = img.width;
        const imgH = img.height;

        // mm単位のページサイズ
        const pageW = doc.internal.pageSize.getWidth();  // 単位: mm
        const pageH = doc.internal.pageSize.getHeight();

        // 解像度：imgのピクセル → mm 変換スケール
        const pxToMm = (px) => px * 25.4 / 300; // assume 300dpi

        const imgWmm = pxToMm(imgW);
        const imgHmm = pxToMm(imgH);

        let drawW = imgWmm;
        let drawH = imgHmm;

        // 拡大縮小モード
        switch (config.bg_img_size) {
          case 'contain': {
            const scaleW = pageW / imgWmm;
            const scaleH = pageH / imgHmm;
            drawW = imgWmm * scaleW;
            drawH = imgHmm * scaleH;
            break;
          }
          case 'wfit': {
            const scale = pageW / imgWmm;
            drawW = pageW;
            drawH = imgHmm * scale;
            break;
          }
          case 'hfit': {
            const scale = pageH / imgHmm;
            drawH = pageH;
            drawW = imgWmm * scale;
            break;
          }
          case 'actual':
          default:
            drawW = imgWmm;
            drawH = imgHmm;
            break;
        }

        // 表示位置
        let x = 0;
        let y = 0;

        switch (config.bg_img_align_x) {
          case 'center':
            x = (pageW - drawW) / 2;
            break;
          case 'right':
            x = pageW - drawW;
            break;
          case 'left':
          default:
            x = 0;
            break;
        }

        switch (config.bg_img_align_y) {
          case 'middle':
            y = (pageH - drawH) / 2;
            break;
          case 'bottom':
            y = pageH - drawH;
            break;
          case 'top':
          default:
            y = 0;
            break;
        }

        // 画像形式判定
        const imgFormat = getImageFormatFromDataURL(bgImg);
        if (imgFormat) {
          doc.addImage(bgImg, imgFormat, x, y, drawW, drawH);
        }
      }

      // タイトルフォントの設定
      doc.setFont(config.title_font);

      // 設定されたタイトルを出力
      const title = config.title || '';
      // デフォルトのタイトルフォントサイズ
      const defaultTitleFontsize = 16;
      // 数値でなければデフォルトタイトルフォントサイズで印字
      const titleFontsize = parseFloat(config.title_fontsize);
      if (!isNaN(titleFontsize)) {
        doc.setFontSize(titleFontsize);
      } else {
        doc.setFontSize(defaultTitleFontsize);
      }

      // デフォルトの初期座標
      const defaultTitleX = 10;
      const defaultTitleY = 20;


      // 数値でなければデフォルト位置で印字
      const titleX = parseFloat(config.title_x);
      const titleY = parseFloat(config.title_y);
      if (!isNaN(titleX) && !isNaN(titleY)) {
        doc.text(title, titleX, titleY);
      } else {
        doc.text(title, defaultTitleX, defaultTitleY);
      }

      // 本文タイトルフォントの設定
      doc.setFont(config.body_font);

      // デフォルトの本文フォントサイズ
      const defaultBodyFontsize = 12;
      // 数値でなければデフォルト本文フォントサイズで印字
      const bodyFontsize = parseFloat(config.body_fontsize);
      if (!isNaN(bodyFontsize)) {
        doc.setFontSize(bodyFontsize);
      } else {
        doc.setFontSize(defaultBodyFontsize);
      }

      // デフォルトの初期座標
      const defaultX = 10;
      let defaultY = 40;

      fieldCodes.forEach((field, i) => {
        const val = record[field.fieldCode]?.value ?? '(未設定)';
        const label = field.label || field.fieldCode;
        const output = field.showLabel ? `${label} ${formatValue(val)}` : `${formatValue(val)}`;

        // 数値でなければデフォルト位置で印字
        const x = parseFloat(field.x);
        const y = parseFloat(field.y);
        const maxw = Number.isNaN(parseFloat(field.maxw)) ? Infinity : parseFloat(field.maxw);
        
        if (!isNaN(x) && !isNaN(y)) {
          const defaultMaxW = doc.internal.pageSize.getWidth()-x;
          doc.text(output, x, y,{ maxWidth:Math.min(maxw,defaultMaxW) });
        } else {
          const defaultMaxW = doc.internal.pageSize.getWidth()-defaultX;
          doc.text(output, defaultX, defaultY,{ maxWidth:Math.min(maxw,defaultMaxW) });
          defaultY += 10;
        }
      });

      return doc;
    }

    /**
     * プレビュー表示関数
     */
    function previewPDF(doc) {
      const blob = doc.output('blob');
      const url = URL.createObjectURL(blob);
      if (previewSpace) {
        previewSpace.innerHTML = '';
        const iframe = document.createElement('iframe');
        iframe.src = url;
        iframe.style.width = '100%';
        iframe.style.height = '100%';
        iframe.style.border = 'none';
        previewSpace.appendChild(iframe);
      }
    }

    // 初期プレビュー（背景画像の拡大縮小処理のために、非同期処理）
    (async () => {
      if(!previewSpace){
        return;
      }else{
        const previewDoc = await createPDF(record);
        previewPDF(previewDoc);
      }
    })();

    // 出力ボタン
    btn.onclick = async function () {
      const downloadDoc = await createPDF(record);
      downloadDoc.save('app'+appId+'_record'+recordId+'_'+timestamp+'.pdf');
    };

    return event;
  });

  // オブジェクトや配列を整形してJSON文字列に変換する関数
  function formatValue(value, indent = 0) {
    const space = ' '.repeat(indent);
    if (Array.isArray(value)) { // 配列の場合
      if (value.length === 0){
        return `${space}[]`;
      }
      // 各要素をインデント付きで出力
      return value.map((v, i) => `${formatValue(v, indent + 2)}`).join(', ');
    } else if (typeof value === 'object' && value !== null) { // オブジェクトの場合
      const entries = Object.entries(value);
      if (entries.length === 0){ // 空のオブジェクトの場合
        return `${space}{}`;
      }
      // 各キーと値をインデント付きで出力
      return entries.map(([k, v]) => { //  キーと値をインデント付きで出力
        const formatted = formatValue(v, indent + 2);
        return `${space}${k}: ${formatted}`;
      }).join('\n');
    } else {
      return `${value}`; // プリミティブ型（数値・文字列など）はそのまま
    }
  }

  // 現在のタイムスタンプを取得する関数
  function getCurrentTimestamp() {
    const now = new Date();

    // ゼロ埋め関数
    const pad = (n) => n.toString().padStart(2, '0');

    const year = now.getFullYear();
    const month = pad(now.getMonth() + 1);      // 月は0始まりなので+1
    const day = pad(now.getDate());
    const hour = pad(now.getHours());
    const minute = pad(now.getMinutes());
    const second = pad(now.getSeconds());

    return `${year}${month}${day}_${hour}${minute}${second}`;
  }

})();
