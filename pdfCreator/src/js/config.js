jQuery.noConflict();

(function($, PLUGIN_ID) {
  'use strict';

  var $form = $('.js-submit-settings');
  var $cancelButton = $('.js-cancel-button');
  if (!($form.length > 0 && $cancelButton.length > 0)) {
    throw new Error('Required elements do not exist.');
  }
  var config = kintone.plugin.app.getConfig(PLUGIN_ID);

  function loadFields() {
    const client = new window.KintoneRestAPIClient();
    const appId = kintone.app.getId();
    const fieldSelect = document.getElementById('field-select');

    // 念のため初期化
    fieldSelect.innerHTML = '<option value="">-- フィールドを選択 --</option>';

    client.app.getFormFields({ app: appId })
      .then((resp) => {
        const properties = resp.properties;

        for (const [code, prop] of Object.entries(properties)) {
          // 任意でフィールドタイプを制限（例: 文字列1行だけにする場合）
          if (prop.type === 'SINGLE_LINE_TEXT' || prop.type === 'DATE') {
            const option = document.createElement('option');
            option.value = code;
            option.textContent = `${prop.label}（${code}）`;
            // ✅ 保存された値と一致すれば selected を付与
            if (config.fieldCode === code) {
              option.selected = true;
            }
            fieldSelect.appendChild(option);
          }
        }
      })
      .catch((error) => {
        console.error('フィールド一覧の取得に失敗:', error);
        alert('フィールド情報の取得に失敗しました。権限やAPIの利用制限を確認してください。');
      });
  }
  $form.on('submit', function(e) {
    e.preventDefault();
    const configInfo = {
      fieldCode: document.getElementById('field-select').value,
    };
    const selectedCode = document.getElementById('field-select').value;
    kintone.plugin.app.setConfig(configInfo,function(){
      console.log(configInfo);
      window.location.href = '../../' + kintone.app.getId() + '/plugin/';
    });
  });
  $cancelButton.on('click', function() {
    window.location.href = '../../' + kintone.app.getId() + '/plugin/';
  });

  
  loadFields();
})(jQuery, kintone.$PLUGIN_ID);
