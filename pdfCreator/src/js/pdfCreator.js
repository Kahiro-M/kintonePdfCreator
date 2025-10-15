const { jsPDF } = window.jspdf;

(function () {
  'use strict';
  const PLUGIN_ID = kintone.$PLUGIN_ID;

  kintone.events.on('app.record.index.show', async function (event) {
    const config = kintone.plugin.app.getConfig(PLUGIN_ID);
    try{
      const records = event.records;
      const appId = event.appId;
      const viewType = event.viewType;
      const offset = event.offset;
      const size = event.size;
      const qry = kintone.app.getQueryCondition();

      const resconfirm = confirm('現在の一覧でPDF出力をします。\n【検索条件】\n'+qry);
      if(!resconfirm){
        return event;
      }

      // カーソルAPIでレコード取得
      const body = {
        app: appId,
        query: qry,
        size: 500
      };
      let cursor = await kintone.api(kintone.api.url('/k/v1/records/cursor.json', true), 'POST', body);

      // レコードが1件以上ある場合のみ処理
      if(Number(cursor.totalCount)>0){
        let allRecords = [];
        let allPDF = [];
        let next = true;
        while(next){
          // カーソルを利用して全レコードを配列に格納
          const resp = await kintone.api(kintone.api.url('/k/v1/records/cursor.json', true), 'GET', { id: cursor.id });
          allRecords.push(resp.records);
          for (let i = 0; i < Number(cursor.totalCount); i++) {
            const doc = await createPDF(records[i],config);
            allPDF.push(doc);
          }
          next = resp.next;
        }

        // 結合して1つのPDFとして出力
        await downloadMergeJsPdfDocs(allPDF);
      }
    }catch(err){
      console.error(err);
    }
    return event;
  });

  kintone.events.on('app.record.detail.show', function (event) {
    const record = event.record;
    const recordId = event.recordId;
    const appId = event.appId;
    const timestamp = getCurrentTimestamp();
    const previewSpace = getPreviewSpace('pdf_preview_space');
    if (previewSpace) {
      previewSpace.innerHTML = '';
      previewSpace.style.height = '600px';
      previewSpace.style.width = '390px';
      previewSpace.style.border = '1px solid #ccc';
      previewSpace.style.marginTop = '10px';
    }

    const config = kintone.plugin.app.getConfig(PLUGIN_ID);

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

    // 初期プレビュー（背景画像の拡大縮小処理のために、非同期処理）
    (async () => {
      if(!previewSpace){
        return;
      }else{
        const previewDoc = await createPDF(record,config);
        previewPDF(previewDoc,previewSpace);
      }
    })();

    // 出力ボタン
    btn.onclick = async function () {
      const downloadDoc = await createPDF(record,config);
      downloadDoc.save('app'+appId+'_record'+recordId+'_'+timestamp+'.pdf');
    };

    // プレビュー表示ボタン
    document.getElementById('show_pdf_preview_space').addEventListener('click', (e) => {
      $('.pdf-preview').slideToggle();
    });

    return event;
  });

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
  async function createPDF(record,config) {
    const doc = new jsPDF();
    const fieldCodes = config.fields ? JSON.parse(config.fields) : [];

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
  function previewPDF(doc,previewSpace) {
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

  // プレビュー表示スペース取得or作成する関数
  function getPreviewSpace(idName='pdf_preview_space') {
    const previewSpaceOnRecordBody = kintone.app.record.getSpaceElement(idName);
    if (previewSpaceOnRecordBody) {
      return kintone.app.record.getSpaceElement(idName);
    }else{
      // ヘッダーメニューにプレビューボタンを追加
      const previewBtn = document.createElement('button');
      previewBtn.id = 'show_pdf_preview_space';
      previewBtn.textContent = 'プレビュー表示👁️';
      previewBtn.className = 'kintoneplugin-button-normal'; // kintone風の見た目に
      previewBtn.style.marginLeft = '8px';
      kintone.app.record.getHeaderMenuSpaceElement().appendChild(previewBtn);
      // プレビュー表示スペースをヘッダーメニューに追加
      const previewSpaceOnHeader = document.createElement('div');
      previewSpaceOnHeader.id = idName;
      previewSpaceOnHeader.className = "pdf-preview preview-hide";
      kintone.app.record.getHeaderMenuSpaceElement().appendChild(previewSpaceOnHeader);
      return document.getElementById(idName);

    }
  }

// 複数の jsPDF オブジェクトを連結して1つにする関数
async function downloadMergeJsPdfDocs(jsPDFDocs) {
  // pdf結合してByteデータを取得
  const mergedBytes = await mergeJsPdfDocs(jsPDFDocs);
  
  // 結合後のPDFをBlobに変換してダウンロード
  const blob = new Blob([mergedBytes], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = "merged.pdf";
  // console.log(a.href);
  
  a.click();
  URL.revokeObjectURL(url);

  console.log("PDF結合&ダウンロード完了");
}

// 複数の jsPDF オブジェクトを連結して1つにする関数
async function mergeJsPdfDocs(jsPDFDocs) {
  // pdf-libを使用
  const mergedPdf = await PDFLib.PDFDocument.create();

  for (const doc of jsPDFDocs) {
    // jsPDFインスタンスをArrayBuffer化
    const pdfBytes = doc.output('arraybuffer');
    const srcPdf = await PDFLib.PDFDocument.load(pdfBytes);

    // ページをコピーして追加
    const copiedPages = await mergedPdf.copyPages(srcPdf, srcPdf.getPageIndices());
    copiedPages.forEach((page) => mergedPdf.addPage(page));
  }

  return await mergedPdf.save();
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
