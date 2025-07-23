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
      savedFields.forEach((obj) => addFieldRow(obj.fieldCode, obj.label, obj.showLabel));
    } else {
      addFieldRow('', '');
    }
  });

  function addFieldRow(selectedValue, labelValue, showLabel) {
    const row = document.createElement('div');
    row.className = 'field-row kintoneplugin-row';
    row.style.alignItems = 'center';

    row.innerHTML = `
      <div class="field-cell" style="width: 10%;">
        <input type="checkbox" class="field-show-label">
      </div>
      <div class="field-cell" style="width: 35%;">
        <input type="text" class="field-label" style="width: 90%;" placeholder="ラベル名を入力">
      </div>
      <div class="field-cell" style="width: 45%;">
        <select class="field-select" style="width: 95%;">
          <option value="">-- フィールドを選択 --</option>
          ${fieldOptionsHTML}
        </select>
      </div>
      <div class="field-cell" style="width: 10%;">
        <button type="button" class="remove-field">✕</button>
      </div>
    `;

    const select = row.querySelector('.field-select');
    const label = row.querySelector('.field-label');
    const checkbox = row.querySelector('.field-show-label');

    if (selectedValue) select.value = selectedValue;
    if (labelValue) label.value = labelValue;
    if (showLabel !== undefined) checkbox.checked = showLabel;

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
        label: row.querySelector('.field-label').value.trim(),
        showLabel: row.querySelector('.field-show-label').checked
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
