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
      previewSpace.style.width = '600px';
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
      doc.setFontSize(16);
      doc.text('PDF出力プレビュー', 10, 20);
      doc.setFontSize(12);

      let y = 40;
      fieldCodes.forEach((code, index) => {
        const val = record[code]?.value ?? '(未設定)';
        doc.text(`項目${index + 1}: ${val}`, 10, y);
        y += 10;
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
