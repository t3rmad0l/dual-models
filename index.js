console.log("🚀 Файл index.js расширения Dual Models загружается!");

import { extension_settings } from "../../../extensions.js";
import { saveSettingsDebounced } from "../../../../script.js";

const extensionName = "dual-models"; 
const extensionFolderPath = "scripts/extensions/third-party/dual-models";

const defaultSettings = {
    enabled: false,
    url: "",
    key: "",
    dialogueModel: "",
    actionModel: ""
};

async function loadSettings() {
    if (!extension_settings[extensionName]) {
        extension_settings[extensionName] = defaultSettings;
    }
    extension_settings[extensionName] = Object.assign({}, defaultSettings, extension_settings[extensionName]);
}

jQuery(async () => {
    await loadSettings();

    // Загружаем наш HTML файл
    const settingsHtml = await $.get(`${extensionFolderPath}/settings.html`);
    $("#extensions_settings").append(settingsHtml);

    // Заполняем поля
    $("#dual_models_enable").prop("checked", extension_settings[extensionName].enabled);
    $("#dual_models_url").val(extension_settings[extensionName].url);
    $("#dual_models_key").val(extension_settings[extensionName].key);
    $("#dual_models_dialogue").val(extension_settings[extensionName].dialogueModel);
    $("#dual_models_action").val(extension_settings[extensionName].actionModel);

    // Сохраняем настройки при изменении
    $("#dual_models_enable").on("change", function () {
        extension_settings[extensionName].enabled = $(this).is(":checked");
        saveSettingsDebounced();
    });

    $("#dual_models_url").on("input", function () {
        extension_settings[extensionName].url = $(this).val();
        saveSettingsDebounced();
    });

    $("#dual_models_key").on("input", function () {
        extension_settings[extensionName].key = $(this).val();
        saveSettingsDebounced();
    });

    $("#dual_models_dialogue").on("input", function () {
        extension_settings[extensionName].dialogueModel = $(this).val();
        saveSettingsDebounced();
    });

    $("#dual_models_action").on("input", function () {
        extension_settings[extensionName].actionModel = $(this).val();
        saveSettingsDebounced();
    });
    
    console.log("✅ Интерфейс Dual Models успешно отрисован!");
});
