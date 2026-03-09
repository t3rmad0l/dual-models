import { getContext } from "../../../extensions.js";

console.log("🚀 Dual Models: Скрипт успешно подключен!");

const extensionName = "dual-models";
const extensionFolderPath = `scripts/extensions/third-party/${extensionName}`;

const defaultSettings = {
    enabled: false,
    url: "",
    key: "",
    dialogueModel: "",
    actionModel: ""
};

jQuery(async () => {
    console.log("🚀 Dual Models: Начинаем отрисовку интерфейса...");
    
    // Получаем безопасный доступ к функциям Таверны
    const context = getContext();
    
    // Загружаем настройки
    if (!context.extension_settings[extensionName]) {
        context.extension_settings[extensionName] = defaultSettings;
    }
    const settings = Object.assign({}, defaultSettings, context.extension_settings[extensionName]);
    context.extension_settings[extensionName] = settings; // сохраняем обратно

    try {
        // Загружаем наш HTML файл
        const settingsHtml = await $.get(`${extensionFolderPath}/settings.html`);
        $("#extensions_settings").append(settingsHtml);
        console.log("✅ Dual Models: Меню успешно добавлено в Таверну!");

        // Заполняем поля сохраненными значениями
        $("#dual_models_enable").prop("checked", settings.enabled);
        $("#dual_models_url").val(settings.url);
        $("#dual_models_key").val(settings.key);
        $("#dual_models_dialogue").val(settings.dialogueModel);
        $("#dual_models_action").val(settings.actionModel);

        // Функция для сохранения (теперь используем современный метод)
        const save = () => {
            context.saveSettingsDebounced();
        };

        // Сохраняем настройки при любом изменении
        $("#dual_models_enable").on("change", function () {
            settings.enabled = $(this).is(":checked");
            save();
        });
        $("#dual_models_url").on("input", function () {
            settings.url = $(this).val();
            save();
        });
        $("#dual_models_key").on("input", function () {
            settings.key = $(this).val();
            save();
        });
        $("#dual_models_dialogue").on("input", function () {
            settings.dialogueModel = $(this).val();
            save();
        });
        $("#dual_models_action").on("input", function () {
            settings.actionModel = $(this).val();
            save();
        });

    } catch (error) {
        console.error("❌ Dual Models ОШИБКА:", error);
    }
});
