jQuery.noConflict();
(function ($, PLUGIN_ID) {
  'use strict';

  // 自動で最新バージョンを取得
  const latestVersion = Object.keys(window.Kucs)[0];
  const Kuc = window.Kucs[latestVersion];

  const $form = $('.js-submit-settings');
  const $cancelButton = $('.js-cancel-button');
  const fieldContainer = document.getElementById('field-container');
  const addButton = document.getElementById('add-field');

  const config = kintone.plugin.app.getConfig(PLUGIN_ID);
  const savedFields = config.fields ? JSON.parse(config.fields) : [];

  let fieldOptions = [];
  const client = new window.KintoneRestAPIClient();
  const appId = kintone.app.getId();

  client.app.getFormFields({ app: appId }).then((resp) => {
    for (const [code, prop] of Object.entries(resp.properties)) {
      if (prop.type === 'SINGLE_LINE_TEXT' || prop.type === 'DATE') {
        fieldOptions.push({ label: `${prop.label}（${code}）`, value: code });
      }
    }

    if (savedFields.length > 0) {
      savedFields.forEach((obj) => addFieldRow(obj.fieldCode, obj.label, obj.showLabel));
    } else {
      addFieldRow('', '');
    }
  });

  function addFieldRow(selectedValue, labelValue, showLabel) {
    const row = document.createElement('div');
    row.className = 'field-row kintoneplugin-row';
    row.style.alignItems = 'center';

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

    const removeBtn = document.createElement('button');
    removeBtn.type = 'button';
    removeBtn.textContent = '✕';
    removeBtn.onclick = () => row.remove();
    removeBtn.className = 'remove-field';

    const checkboxCell = document.createElement('div');
    checkboxCell.className = 'field-cell shw-chbx';
    checkboxCell.appendChild(checkbox);

    const labelCell = document.createElement('div');
    labelCell.className = 'field-cell lb-txt';
    labelCell.appendChild(labelInput);

    const selectCell = document.createElement('div');
    selectCell.className = 'field-cell fld-cd';
    selectCell.appendChild(dropdown);

    const removeCell = document.createElement('div');
    removeCell.className = 'field-cell dl-btn';
    removeCell.appendChild(removeBtn);

    row.appendChild(checkboxCell);
    row.appendChild(labelCell);
    row.appendChild(selectCell);
    row.appendChild(removeCell);

    // プロパティとして保持しておく
    row._fldcd = dropdown;
    row._lbtxt = labelInput;
    row._shwchbx = checkbox;

    fieldContainer.appendChild(row);
  }

  addButton.onclick = () => addFieldRow('', '');

  $form.on('submit', function (e) {
    e.preventDefault();

    const rows = Array.from(document.querySelectorAll('.field-row'));
    const values = rows.map(row => {
      return {
        fieldCode: row._fldcd.value,
        label: row._lbtxt.value.trim(),
        showLabel: row._shwchbx.value.includes('show')
      };
    }).filter(v => v.fieldCode);

    if (values.length === 0) {
      alert('少なくとも1項目は設定してください');
      return;
    }

    kintone.plugin.app.setConfig({
      fields: JSON.stringify(values)
    }, () => {
      window.location.href = '../../' + kintone.app.getId() + '/plugin/';
    });
  });

  $cancelButton.on('click', function () {
    window.location.href = '../../' + kintone.app.getId() + '/plugin/';
  });
})(jQuery, kintone.$PLUGIN_ID);
