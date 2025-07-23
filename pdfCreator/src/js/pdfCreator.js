const { jsPDF } = window.jspdf;

(function () {
  'use strict';

  kintone.events.on('app.record.detail.show', function (event) {
    const record = event.record;

    const previewSpace = kintone.app.record.getSpaceElement('pdf_preview_space');
    if (previewSpace) {
      previewSpace.innerHTML = '';
      previewSpace.style.height = '600px';
      previewSpace.style.border = '1px solid #ccc';
      previewSpace.style.marginTop = '10px';
    }

    const btnSpace = kintone.app.record.getSpaceElement('pdf_export_space');
    if (!btnSpace || document.getElementById('pdf-export-button')) return;

    const btn = document.createElement('button');
    btn.id = 'pdf-export-button';
    btn.innerText = 'PDF出力';
    btn.className = 'kintoneplugin-button-normal';
    btnSpace.appendChild(btn);

    /**
     * PDF作成関数（日本語フォント付き）
     */
    function createPDF(record) {
      const doc = new jsPDF();

      // NotoSansJPGothicの登録（lib/NotoSansJPGothic-normal.jsで定義済み）
      doc.setFont('NotoSansJPGothic');

      const name = record['姓']?.value || '';
      const date = record['日付']?.value || '';

      doc.setFontSize(16);
      doc.text('PDF出力サンプル', 10, 20);
      doc.setFontSize(12);
      doc.text(`姓: ${name}`, 10, 40);
      doc.text(`日付: ${date}`, 10, 50);

      return doc;
    }

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
