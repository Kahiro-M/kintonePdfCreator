jQuery.noConflict();
(function ($, PLUGIN_ID) {
  'use strict';

  const $form = $('.js-submit-settings');
  const $cancelButton = $('.js-cancel-button');
  const fieldContainer = document.getElementById('field-container');
  const addButton = document.getElementById('add-field');

  const config = kintone.plugin.app.getConfig(PLUGIN_ID);
  const savedFields = config.fields ? JSON.parse(config.fields) : [];

  let fieldOptionsHTML = '';
  const client = new window.KintoneRestAPIClient();
  const appId = kintone.app.getId();

  client.app.getFormFields({ app: appId }).then((resp) => {
    for (const [code, prop] of Object.entries(resp.properties)) {
      if (prop.type === 'SINGLE_LINE_TEXT' || prop.type === 'DATE') {
        fieldOptionsHTML += `<option value="${code}">${prop.label}（${code}）</option>`;
      }
    }

    if (savedFields.length > 0) {
      savedFields.forEach((obj) => addFieldRow(obj.fieldCode, obj.label));
    } else {
      addFieldRow('', '');
    }
  });

  function addFieldRow(selectedValue, labelValue) {
    const row = document.createElement('div');
    row.className = 'field-row';
    row.innerHTML = `
      <select class="field-select">
        <option value="">-- フィールドを選択 --</option>
        ${fieldOptionsHTML}
      </select>
      <input type="text" class="field-label" placeholder="ラベル名を入力">
      <button type="button" class="remove-field">✕</button>
    `;

    const select = row.querySelector('.field-select');
    const label = row.querySelector('.field-label');

    if (selectedValue) select.value = selectedValue;
    if (labelValue) label.value = labelValue;

    row.querySelector('.remove-field').onclick = () => row.remove();
    fieldContainer.appendChild(row);
  }

  addButton.onclick = () => addFieldRow('', '');

  $form.on('submit', function (e) {
    e.preventDefault();

    const rows = Array.from(document.querySelectorAll('.field-row'));
    const values = rows.map(row => {
      return {
        fieldCode: row.querySelector('.field-select').value,
        label: row.querySelector('.field-label').value.trim()
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
