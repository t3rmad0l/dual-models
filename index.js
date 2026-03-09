// Dual Models Extension - Полная версия с логикой генерации
(function() {
    'use strict';
    
    const extensionName = "dual-models";
    const extensionFolderPath = "scripts/extensions/third-party/dual-models";
    
    // Ждем, пока jQuery и Таверна полностью загрузятся
    jQuery(async function() {
        console.log("🚀 Dual Models: Начинаем загрузку...");
        
        // Инициализируем настройки
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
            const response = await fetch(`${extensionFolderPath}/settings.html`);
            const settingsHtml = await response.text();
            $("#extensions_settings").append(settingsHtml);
            console.log("✅ Dual Models: Интерфейс загружен!");
            
            // Заполняем поля
            $("#dual_models_enable").prop("checked", settings.enabled);
            $("#dual_models_url").val(settings.url);
            $("#dual_models_key").val(settings.key);
            $("#dual_models_dialogue").val(settings.dialogueModel);
            $("#dual_models_action").val(settings.actionModel);
            
            // Функция сохранения
            function saveSettings() {
                const settingsToSave = JSON.stringify(window.extension_settings);
                localStorage.setItem('extensions_settings', settingsToSave);
            }
            
            // Обработчики изменений
            $("#dual_models_enable").on("change", function() {
                settings.enabled = $(this).is(":checked");
                saveSettings();
                console.log("🔄 Dual Models:", settings.enabled ? "Включено" : "Выключено");
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
            
            // ========== ЛОГИКА ГЕНЕРАЦИИ ==========
            
            // Функция для отправки запроса к модели
            async function callModel(modelName, messages) {
                const response = await fetch(`${settings.url}/chat/completions`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${settings.key}`
                    },
                    body: JSON.stringify({
                        model: modelName,
                        messages: messages,
                        temperature: 0.9,
                        max_tokens: 500
                    })
                });
                
                if (!response.ok) {
                    throw new Error(`Ошибка API: ${response.status} ${response.statusText}`);
                }
                
                const data = await response.json();
                return data.choices[0].message.content;
            }
            
            // Перехватываем событие генерации ответа персонажа
            eventSource.on('CHARACTER_MESSAGE_RENDERED', async function(data) {
                // Проверяем, включено ли расширение
                if (!settings.enabled) {
                    return;
                }
                
                // Проверяем, заполнены ли все настройки
                if (!settings.url || !settings.key || !settings.dialogueModel || !settings.actionModel) {
                    console.warn("⚠️ Dual Models: Не все настройки заполнены. Пропускаем.");
                    return;
                }
                
                console.log("🎭 Dual Models: Начинаем двойную генерацию...");
                
                try {
                    // Получаем историю чата
                    const context = SillyTavern.getContext();
                    const chat = context.chat;
                    
                    // Формируем историю для моделей (последние 10 сообщений)
                    const history = chat.slice(-10).map(msg => ({
                        role: msg.is_user ? 'user' : 'assistant',
                        content: msg.mes
                    }));
                    
                    // ШАГ 1: Генерируем диалог
                    console.log("💬 Dual Models: Генерируем диалог...");
                    const dialoguePrompt = {
                        role: 'system',
                        content: 'Напиши только то, что скажет персонаж. Только прямую речь, без описаний действий.'
                    };
                    const dialogueMessages = [dialoguePrompt, ...history];
                    const dialogue = await callModel(settings.dialogueModel, dialogueMessages);
                    
                    console.log("✅ Диалог получен:", dialogue);
                    
                    // ШАГ 2: Генерируем описание действий
                    console.log("📖 Dual Models: Генерируем описание...");
                    const actionPrompt = {
                        role: 'system',
                        content: `Персонаж только что сказал: "${dialogue}". Опиши его действия, эмоции и окружение. Используй формат: *действие*`
                    };
                    const actionMessages = [actionPrompt, ...history];
                    const action = await callModel(settings.actionModel, actionMessages);
                    
                    console.log("✅ Описание получено:", action);
                    
                    // ШАГ 3: Склеиваем результат
                    const finalMessage = `${dialogue}\n\n${action}`;
                    
                    // Заменяем последнее сообщение персонажа на наш результат
                    const lastMessage = chat[chat.length - 1];
                    lastMessage.mes = finalMessage;
                    
                    // Обновляем отображение в чате
                    $('#chat').find('.mes').last().find('.mes_text').html(finalMessage);
                    
                    console.log("🎉 Dual Models: Генерация завершена успешно!");
                    
                } catch (error) {
                    console.error("❌ Dual Models: Ошибка генерации:", error);
                    toastr.error(`Ошибка Dual Models: ${error.message}`, 'Dual Models');
                }
            });
            
            console.log("✅ Dual Models: Расширение полностью загружено и готово к работе!");
            
        } catch (error) {
            console.error("❌ Dual Models: Ошибка загрузки:", error);
        }
    });
})();
