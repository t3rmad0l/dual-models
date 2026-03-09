console.log("🟢 DUAL MODELS: Скрипт загружен (БЕЗ ИМПОРТОВ)!");

jQuery(async () => {
    console.log("🟢 DUAL MODELS: Начинаем сборку интерфейса...");

    const extensionName = "dual-models";

    // Проверяем, дала ли Таверна доступ к настройкам
    if (typeof extension_settings === 'undefined') {
        console.error("🔴 DUAL MODELS: Ошибка! Нет доступа к настройкам.");
        return;
    }

    const defaultSettings = {
        enabled: false,
        url: "",
        key: "",
        dialogueModel: "",
        actionModel: ""
    };

    // Загружаем настройки
    if (!extension_settings[extensionName]) {
        extension_settings[extensionName] = defaultSettings;
    }
    const settings = Object.assign({}, defaultSettings, extension_settings[extensionName]);
    extension_settings[extensionName] = settings;

    // ВШИВАЕМ HTML ПРЯМО В КОД
    const html = `
        <div class="extension_settings_drawer">
            <div class="inline-drawer">
                <div class="inline-drawer-toggle inline-drawer-header">
                    <b>🎭 Dual Models (Диалоги и Описания)</b>
                    <div class="inline-drawer-icon fa-solid fa-circle-chevron-down down"></div>
                </div>
                <div class="inline-drawer-content" style="display: none;">
                    <div class="flex-container" style="margin-bottom: 10px;">
                        <label><input type="checkbox" id="dual_models_enable"> <b>Включить расширение</b></label>
                    </div>
                    <hr>
                    <label>🌐 Proxy URL (например, http://127.0.0.1:5000/v1):</label>
                    <input type="text" id="dual_models_url" class="text_pole" placeholder="http://...">
                    <label>🔑 API Ключ пользователя:</label>
                    <input type="password" id="dual_models_key" class="text_pole" placeholder="sk-...">
                    <label>🗣️ Модель для диалогов:</label>
                    <input type="text" id="dual_models_dialogue" class="text_pole" placeholder="gpt-4">
                    <label>📖 Модель для описаний:</label>
                    <input type="text" id="dual_models_action" class="text_pole" placeholder="claude-3">
                </div>
            </div>
        </div>
    `;

    // Добавляем меню в Таверну
    $("#extensions_settings").append(html);
    console.log("🟢 DUAL MODELS: Меню успешно добавлено на экран!");

    // Заполняем поля
    $("#dual_models_enable").prop("checked", settings.enabled);
    $("#dual_models_url").val(settings.url);
    $("#dual_models_key").val(settings.key);
    $("#dual_models_dialogue").val(settings.dialogueModel);
    $("#dual_models_action").val(settings.actionModel);

    // Функция сохранения
    const save = () => {
        if (typeof saveSettingsDebounced === 'function') {
            saveSettingsDebounced();
        }
    };

    // Слушаем изменения
    $("#dual_models_enable").on("change", function () { settings.enabled = $(this).is(":checked"); save(); });
    $("#dual_models_url").on("input", function () { settings.url = $(this).val(); save(); });
    $("#dual_models_key").on("input", function () { settings.key = $(this).val(); save(); });
    $("#dual_models_dialogue").on("input", function () { settings.dialogueModel = $(this).val(); save(); });
    $("#dual_models_action").on("input", function () { settings.actionModel = $(this).val(); save(); });
});
