jQuery.noConflict();
(function ($, PLUGIN_ID) {
  'use strict';

  // 自動で最新バージョンを取得
  const latestVersion = Object.keys(window.Kucs)[0];
  const Kuc = window.Kucs[latestVersion];

  // プラグイン設定の要素を取得
  const $form = $('.js-submit-settings');
  const $cancelButton = $('.js-cancel-button');
  const fieldContainer = document.getElementById('field-container');
  const addButton = document.getElementById('add-field');
  const pdfImgClearButton = document.getElementById('pdf-bg-img-clear');
  let titleInput = document.getElementById('pdf-title');
  let titleFontsizeInput = document.getElementById('pdf-title-fontsize');
  let bodyFontsizeInput = document.getElementById('pdf-body-fontsize');
  let titleXInput = document.getElementById('pdf-title-fld-x');
  let titleYInput = document.getElementById('pdf-title-fld-y');
  let title_font = document.getElementById('pdf-title-font');
  let body_font = document.getElementById('pdf-body-font');
  let bgImgInput = '';
  let bgImgPreview = document.getElementById('pdf-bg-img-preview');
  let bgSizeMode = document.getElementById('pdf-bg-img-size-mode');
  let bgImgAlignX = document.getElementById('pdf-bg-img-align-x');
  let bgImgAlignY = document.getElementById('pdf-bg-img-align-y');

  // kintoneのプラグイン設定から初期値を取得
  const config = kintone.plugin.app.getConfig(PLUGIN_ID);
  const savedFields = config.fields ? JSON.parse(config.fields) : [];
  if (config.title) {
    titleInput.value = config.title;
  }
  if (config.title_fontsize) {
    titleFontsizeInput.value = config.title_fontsize;
  }
  if (config.body_fontsize) {
    bodyFontsizeInput.value = config.body_fontsize;
  }
  if (config.title_x) {
    titleXInput.value = config.title_x;
  }
  if (config.title_y) {
    titleYInput.value = config.title_y;
  }
  if (config.title_font) {
    title_font.value = config.title_font;
  }
  if (config.body_font) {
    body_font.value = config.body_font;
  }
  if (config.bg_img) {
    bgImgInput = config.bg_img;
    bgImgPreview.src = config.bg_img;
  }else{
    bgImgPreview.classList.add('broken')
  }
  if (config.bg_img_size) {
    bgSizeMode.value = config.bg_img_size;
  }
  if (config.bg_img_size) {
    bgImgAlignX.value = config.bg_img_align_x;
  }
  if (config.bg_img_size) {
    bgImgAlignY.value = config.bg_img_align_y;
  }

  // フィールドコードの選択肢を取得
  let fieldOptions = [];
  const client = new window.KintoneRestAPIClient();
  const appId = kintone.app.getId();

  client.app.getFormFields({ app: appId }).then((resp) => {
    for (const [code, prop] of Object.entries(resp.properties)) {
      if (prop.type === 'SINGLE_LINE_TEXT' || prop.type === 'DATE') {
        fieldOptions.push({ label: `${prop.label}（${code}）`, value: code });
      }
    }
    // フィールドコードの選択肢生成
    if (savedFields.length > 0) {
      savedFields.forEach((obj) => addFieldRow(obj.fieldCode, obj.label, obj.showLabel, obj.x, obj.y));
    } else {
      addFieldRow('', '', false, '', '');
    }
  });

  // PDF追加項目の行を追加する関数
  function addFieldRow(selectedValue, labelValue, showLabel, x, y) {
    // 行の要素を生成
    const row = document.createElement('div');
    row.className = 'field-row kintoneplugin-row';
    row.style.alignItems = 'center';

    // チェックボックス、ラベル入力、ドロップダウン、削除ボタンを生成
    const checkbox = new Kuc.Checkbox({
      items: [{ label: 'ラベル名を表示する', value: 'show' }],
      value: showLabel ? ['show'] : [],
      className: 'field-show-label'
    });

    const labelInput = new Kuc.Text({
      value: labelValue || '',
      placeholder: 'ラベル名を入力',
      className: 'field-label'
    });

    const dropdown = new Kuc.Dropdown({
      items: [{ label: '-- フィールドを選択 --', value: '' }, ...fieldOptions],
      value: selectedValue || '',
      className: 'field-select'
    });

    const xInput = new Kuc.Text({
      value: x || '',
      placeholder: 'X座標',
      className: 'field-x'
    });

    const yInput = new Kuc.Text({
      value: y || '',
      placeholder: 'Y座標',
      className: 'field-y'
    });

    const removeBtn = document.createElement('button');
    removeBtn.type = 'button';
    removeBtn.textContent = '✕';
    removeBtn.onclick = () => row.remove();
    removeBtn.className = 'remove-field';

    // 行に要素を追加
    const checkboxCell = document.createElement('div');
    checkboxCell.className = 'field-cell shw-chbx';
    checkboxCell.appendChild(checkbox);

    const labelCell = document.createElement('div');
    labelCell.className = 'field-cell lb-txt';
    labelCell.appendChild(labelInput);

    const selectCell = document.createElement('div');
    selectCell.className = 'field-cell fld-cd';
    selectCell.appendChild(dropdown);

    const xCell = document.createElement('div');
    xCell.className = 'field-cell fld-x';
    xCell.appendChild(xInput);

    const yCell = document.createElement('div');
    yCell.className = 'field-cell fld-y';
    yCell.appendChild(yInput);

    const removeCell = document.createElement('div');
    removeCell.className = 'field-cell dl-btn';
    removeCell.appendChild(removeBtn);

    row.appendChild(checkboxCell);
    row.appendChild(labelCell);
    row.appendChild(selectCell);
    row.appendChild(xCell);
    row.appendChild(yCell);
    row.appendChild(removeCell);

    // プロパティとして保持しておく
    row._fldcd = dropdown;
    row._lbtxt = labelInput;
    row._shwchbx = checkbox;
    row._x = xInput;
    row._y = yInput;

    fieldContainer.appendChild(row);
  }

  // 画像の自動圧縮関数
  function convertAndCompressImage(file, maxWidth = 595, maxBase64Length = 60000, callback) {
    const reader = new FileReader();
    const mimeType = file.type; // image/png, image/jpeg, image/webp など
    const isPng = mimeType === 'image/png'; // PNGならtrue

    reader.onload = function (e) {
      const img = new Image();

      img.onload = function () {
        // スケーリング計算（A4横幅＝595ptに合わせる）
        const scale = maxWidth / img.width;
        const width = maxWidth;
        const height = img.height * scale;

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');

        // 背景白塗り（PNGの透過に備えて）
        if (!isPng) {
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
        }

        ctx.drawImage(img, 0, 0, width, height);

        let quality = 0.9;
        let base64 = '';

        // 圧縮ループ（PNGは圧縮無し1回だけ）
        if (isPng) {
          base64 = canvas.toDataURL('image/png');
        }else{
          while (quality >= 0.3) {
            base64 = canvas.toDataURL('image/jpeg', quality);
            if (base64.length <= maxBase64Length) break;
            quality -= 0.05;
          }
        }
        if (base64.length > maxBase64Length) {
          alert('画像を自動圧縮しましたが、容量制限を超えています。さらに小さい画像を選んでください。');
          callback(null);
        } else {
          callback(base64);
        }
      };

      img.onerror = () => {
        alert('画像の読み込みに失敗しました');
        callback(null);
      };

      img.src = e.target.result;
    };

    reader.onerror = () => {
      alert('ファイルの読み込みに失敗しました');
      callback(null);
    };

    reader.readAsDataURL(file);
  }


  // 背景画像のファイル選択イベント
  document.getElementById('pdf-bg-img').addEventListener('change', (e) => {
    const file = e.target.files[0];
    // ファイルが選択されていない場合は何もしない
    if(!file){
      return;
    }

    convertAndCompressImage(file, 595, 60000, (base64) => {
      if (base64) {
        bgImgInput = base64;
        bgImgPreview.src = base64;
        bgImgPreview.classList.remove('broken')
      }
    });
  });

  // 追加ボタンのイベントリスナー
  addButton.onclick = () => addFieldRow('', '', false, '', '');

  // 背景画像削除ボタンのイベントリスナー
  pdfImgClearButton.addEventListener('click', (e) => {
    bgImgInput = '';
    bgImgPreview.src = '';
    bgImgPreview.classList.add('broken')
    document.getElementById('pdf-bg-img').value = ''; // ファイル選択をリセット
  });

  // フォームの送信イベント
  $form.on('submit', function (e) {
    e.preventDefault();

    const rows = Array.from(document.querySelectorAll('.field-row'));
    const values = rows.map(row => {
      return {
        fieldCode: row._fldcd.value,
        label: row._lbtxt.value.trim(),
        showLabel: row._shwchbx.value.includes('show'),
        x: row._x.value.trim(),
        y: row._y.value.trim()
      };
    }).filter(v => v.fieldCode);

    if (values.length === 0) {
      alert('少なくとも1項目は設定してください');
      return;
    }

    // PDFタイトルの取得
    const pdf_title = document.getElementById('pdf-title').value.trim();
    const pdf_title_fontsize = document.getElementById('pdf-title-fontsize').value.trim();
    const pdf_title_fld_x = document.getElementById('pdf-title-fld-x').value.trim();
    const pdf_title_fld_y = document.getElementById('pdf-title-fld-y').value.trim();
    const pdf_title_font = document.getElementById('pdf-title-font').value.trim();
    const pdf_body_fontsize = document.getElementById('pdf-body-fontsize').value.trim();
    const pdf_body_font = document.getElementById('pdf-body-font').value.trim();
    const pdf_bg_img = bgImgInput;
    const pdf_bg_img_size = document.getElementById('pdf-bg-img-size-mode').value.trim();
    const pdf_bg_img_align_x = document.getElementById('pdf-bg-img-align-x').value.trim();
    const pdf_bg_img_align_y = document.getElementById('pdf-bg-img-align-y').value.trim();

    kintone.plugin.app.setConfig({
      title: pdf_title,
      title_fontsize: pdf_title_fontsize,
      title_x: pdf_title_fld_x,
      title_y: pdf_title_fld_y,
      title_font: pdf_title_font,
      body_fontsize: pdf_body_fontsize,
      body_font: pdf_body_font,
      bg_img: pdf_bg_img,
      bg_img_size: pdf_bg_img_size,
      bg_img_align_x: pdf_bg_img_align_x,
      bg_img_align_y: pdf_bg_img_align_y,
      fields: JSON.stringify(values)
    }, () => {
      window.location.href = '../../' + kintone.app.getId() + '/plugin/';
    });
  });

  $cancelButton.on('click', function () {
    window.location.href = '../../' + kintone.app.getId() + '/plugin/';
  });
})(jQuery, kintone.$PLUGIN_ID);
