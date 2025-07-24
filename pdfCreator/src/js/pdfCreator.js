const { jsPDF } = window.jspdf;

(function () {
  'use strict';
  const PLUGIN_ID = kintone.$PLUGIN_ID;

  kintone.events.on('app.record.detail.show', function (event) {
    const record = event.record;
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

    const btnSpace = kintone.app.record.getSpaceElement('pdf_export_space');
    if (!btnSpace || document.getElementById('pdf-export-button')) return;

    const btn = document.createElement('button');
    btn.id = 'pdf-export-button';
    btn.innerText = 'PDF出力';
    btn.className = 'kintoneplugin-button-normal';
    btnSpace.appendChild(btn);

    /**
     * PDF作成関数（複数フィールド対応）
     */
    function createPDF(record) {
      const doc = new jsPDF();
      doc.setFont('NotoSansJPGothic'); // 使用フォント

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
        const output = field.showLabel ? `${label} ${val}` : `${val}`;

        // 数値でなければデフォルト位置で印字
        const x = parseFloat(field.x);
        const y = parseFloat(field.y);
        
        if (!isNaN(x) && !isNaN(y)) {
          doc.text(output, x, y);
        } else {
          doc.text(output, defaultX, defaultY);
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

    // 初期プレビュー
    const previewDoc = createPDF(record);
    previewPDF(previewDoc);

    // 出力ボタン
    btn.onclick = function () {
      const downloadDoc = createPDF(record);
      downloadDoc.save('kintone_record.pdf');
    };

    return event;
  });
})();
