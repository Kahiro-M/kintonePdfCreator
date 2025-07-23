jQuery.noConflict();

(function ($, PLUGIN_ID) {
  'use strict';

  const $form = $('.js-submit-settings');
  const $cancelButton = $('.js-cancel-button');
  const fieldContainer = document.getElementById('field-container');
  const addButton = document.getElementById('add-field');

  if (!($form.length > 0 && $cancelButton.length > 0)) {
    throw new Error('Required elements do not exist.');
  }

  const config = kintone.plugin.app.getConfig(PLUGIN_ID);
  const savedFields = config.fields ? JSON.parse(config.fields) : [];

  let fieldOptionsHTML = '';

  const client = new window.KintoneRestAPIClient();
  const appId = kintone.app.getId();

  // フィールド一覧の取得とオプション構築
  client.app.getFormFields({ app: appId })
    .then((resp) => {
      const properties = resp.properties;

      for (const [code, prop] of Object.entries(properties)) {
        if (prop.type === 'SINGLE_LINE_TEXT' || prop.type === 'DATE') {
          fieldOptionsHTML += `<option value="${code}">${prop.label}（${code}）</option>`;
        }
      }

      // 初期描画：保存済み設定 or 空行1つ
      if (savedFields.length > 0) {
        savedFields.forEach(code => addFieldRow(code));
      } else {
        addFieldRow('');
      }

    })
    .catch((error) => {
      console.error('フィールド取得失敗:', error);
      alert('フィールド情報の取得に失敗しました。');
    });

  // 行追加関数
  function addFieldRow(selectedValue) {
    const row = document.createElement('div');
    row.className = 'field-row';
    row.innerHTML = `
      <select class="field-select">
        <option value="">-- フィールドを選択 --</option>
        ${fieldOptionsHTML}
      </select>
      <button type="button" class="remove-field">✕</button>
    `;

    const select = row.querySelector('.field-select');
    if (selectedValue) {
      select.value = selectedValue;
    }

    row.querySelector('.remove-field').onclick = () => row.remove();
    fieldContainer.appendChild(row);
  }

  // 追加ボタン処理
  addButton.onclick = () => {
    addFieldRow('');
  };

  // 保存処理
  $form.on('submit', function (e) {
    e.preventDefault();

    const fieldCodes = Array.from(document.querySelectorAll('.field-select'))
      .map(select => select.value)
      .filter(val => val);

    if (fieldCodes.length === 0) {
      alert('少なくとも1つはフィールドを選択してください');
      return;
    }

    const configToSave = {
      fields: JSON.stringify(fieldCodes)
    };

    kintone.plugin.app.setConfig(configToSave, function () {
      window.location.href = '../../' + kintone.app.getId() + '/plugin/';
    });
  });

  // キャンセル処理
  $cancelButton.on('click', function () {
    window.location.href = '../../' + kintone.app.getId() + '/plugin/';
  });

})(jQuery, kintone.$PLUGIN_ID);
