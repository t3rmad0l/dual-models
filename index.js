// Dual Models Extension - Упрощенная версия
(function() {
    'use strict';
    
    const extensionName = "dual-models";
    const extensionFolderPath = "scripts/extensions/third-party/dual-models";
    
    // Ждем, пока jQuery и Таверна полностью загрузятся
    jQuery(async function() {
        console.log("🚀 Dual Models: Начинаем загрузку...");
        
        // Инициализируем настройки, если их еще нет
        if (typeof window.extension_settings === 'undefined') {
            window.extension_settings = {};
        }
        
        if (!window.extension_settings[extensionName]) {
            window.extension_settings[extensionName] = {
                enabled: false,
                url: "",
                key: "",
                dialogueModel: "",
                actionModel: ""
            };
        }
        
        const settings = window.extension_settings[extensionName];
        
        try {
            // Загружаем HTML
            console.log("📥 Dual Models: Загружаем settings.html...");
            const response = await fetch(`${extensionFolderPath}/settings.html`);
            const settingsHtml = await response.text();
            
            // Добавляем в меню расширений
            $("#extensions_settings").append(settingsHtml);
            console.log("✅ Dual Models: HTML успешно добавлен!");
            
            // Заполняем поля сохраненными значениями
            $("#dual_models_enable").prop("checked", settings.enabled);
            $("#dual_models_url").val(settings.url);
            $("#dual_models_key").val(settings.key);
            $("#dual_models_dialogue").val(settings.dialogueModel);
            $("#dual_models_action").val(settings.actionModel);
            
            // Функция сохранения
            function saveSettings() {
                const settingsToSave = JSON.stringify(window.extension_settings);
                localStorage.setItem('extensions_settings', settingsToSave);
                console.log("💾 Dual Models: Настройки сохранены");
            }
            
            // Обработчики изменений
            $("#dual_models_enable").on("change", function() {
                settings.enabled = $(this).is(":checked");
                saveSettings();
            });
            
            $("#dual_models_url").on("input", function() {
                settings.url = $(this).val();
                saveSettings();
            });
            
            $("#dual_models_key").on("input", function() {
                settings.key = $(this).val();
                saveSettings();
            });
            
            $("#dual_models_dialogue").on("input", function() {
                settings.dialogueModel = $(this).val();
                saveSettings();
            });
            
            $("#dual_models_action").on("input", function() {
                settings.actionModel = $(this).val();
                saveSettings();
            });
            
            console.log("✅ Dual Models: Расширение полностью загружено!");
            
        } catch (error) {
            console.error("❌ Dual Models: Ошибка загрузки:", error);
            alert("Ошибка загрузки Dual Models: " + error.message);
        }
    });
})();
