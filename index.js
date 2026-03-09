// Dual Models Extension - Версия с кнопкой и проверкой подключения
(function() {
    'use strict';
    
    const extensionName = "dual-models";
    const extensionFolderPath = "scripts/extensions/third-party/dual-models";
    
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
            
            // Функция показа статуса
            function showStatus(message, isSuccess) {
                const statusDiv = $("#dual_models_status");
                const statusText = $("#dual_models_status_text");
                
                statusDiv.css({
                    'background': isSuccess ? 'rgba(0, 255, 0, 0.2)' : 'rgba(255, 0, 0, 0.2)',
                    'border': isSuccess ? '1px solid rgba(0, 255, 0, 0.5)' : '1px solid rgba(255, 0, 0, 0.5)'
                });
                statusText.text(message);
                statusDiv.show();
            }
            
            // Функция для отправки запроса к модели
            async function callModel(modelName, messages) {
                console.log(`📡 Отправляем запрос к модели: ${modelName}`);
                
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
                    const errorText = await response.text();
                    throw new Error(`${response.status}: ${errorText}`);
                }
                
                const data = await response.json();
                console.log(`✅ Ответ от ${modelName} получен`);
                return data.choices[0].message.content;
            }
            
            // Обработчик кнопки "Проверить подключение"
            $("#dual_models_test_connection").on("click", async function() {
                const button = $(this);
                button.prop("disabled", true).text("⏳ Проверяем...");
                
                try {
                    if (!settings.url || !settings.key) {
                        throw new Error("Заполните URL и API ключ");
                    }
                    
                    // Пробуем получить список моделей
                    const response = await fetch(`${settings.url}/models`, {
                        headers: {
                            'Authorization': `Bearer ${settings.key}`
                        }
                    });
                    
                    if (!response.ok) {
                        throw new Error(`Ошибка ${response.status}`);
                    }
                    
                    const data = await response.json();
                    const modelCount = data.data ? data.data.length : 0;
                    
                    showStatus(`✅ Подключено! Доступно моделей: ${modelCount}`, true);
                    console.log("✅ Подключение успешно:", data);
                    
                } catch (error) {
                    showStatus(`❌ Ошибка подключения: ${error.message}`, false);
                    console.error("❌ Ошибка подключения:", error);
                } finally {
                    button.prop("disabled", false).text("🔌 Проверить подключение");
                }
            });
            
            // Обработчики изменений настроек
            $("#dual_models_enable").on("change", function() {
                settings.enabled = $(this).is(":checked");
                saveSettings();
                updateDualGenButton();
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
            
            // ========== ДОБАВЛЯЕМ КНОПКУ В ЧАТ ==========
            
            function updateDualGenButton() {
                // Удаляем старую кнопку, если есть
                $("#dual_gen_button").remove();
                
                if (!settings.enabled) {
                    return;
                }
                
                // Создаем новую кнопку
                const button = $('<div id="dual_gen_button" class="mes_button" title="Генерация через две модели">')
                    .html('🎭')
                    .css({
                        'cursor': 'pointer',
                        'font-size': '20px',
                        'padding': '5px 10px'
                    });
                
                // Добавляем кнопку рядом с кнопкой отправки
                $("#send_but").parent().prepend(button);
                
                // Обработчик клика
                button.on("click", async function() {
                    await generateWithDualModels();
                });
            }
            
            // Функция двойной генерации
            async function generateWithDualModels() {
                console.log("🎭 Dual Models: Начинаем двойную генерацию...");
                
                // Проверяем настройки
                if (!settings.url || !settings.key || !settings.dialogueModel || !settings.actionModel) {
                    toastr.warning("Заполните все настройки Dual Models", "Dual Models");
                    return;
                }
                
                try {
                    // Показываем индикатор загрузки
                    $("#send_but").addClass("fa-spinner fa-spin");
                    
                    // Получаем контекст чата
                    const chatHistory = window.SillyTavern?.getContext?.()?.chat || [];
                    
                    // Формируем историю (последние 10 сообщений)
                    const messages = chatHistory.slice(-10).map(msg => ({
                        role: msg.is_user ? 'user' : 'assistant',
                        content: msg.mes
                    }));
                    
                    // ШАГ 1: Генерируем диалог
                    console.log("💬 Генерируем диалог...");
                    const dialogueMessages = [
                        { role: 'system', content: 'Напиши только прямую речь персонажа. Без описаний действий.' },
                        ...messages
                    ];
                    const dialogue = await callModel(settings.dialogueModel, dialogueMessages);
                    
                    // ШАГ 2: Генерируем описание
                    console.log("📖 Генерируем описание...");
                    const actionMessages = [
                        { role: 'system', content: `Персонаж сказал: "${dialogue}". Опиши его действия и эмоции в формате *действие*.` },
                        ...messages
                    ];
                    const action = await callModel(settings.actionModel, actionMessages);
                    
                    // ШАГ 3: Склеиваем и добавляем в чат
                    const finalMessage = `${dialogue}\n\n${action}`;
                    
                    // Добавляем сообщение в чат (используем внутренний API Таверны)
                    if (window.Generate) {
                        await window.Generate(finalMessage);
                    } else {
                        // Альтернативный способ
                        chatHistory.push({
                            name: window.name2 || 'Character',
                            is_user: false,
                            mes: finalMessage,
                            send_date: Date.now()
                        });
                        window.addOneMessage?.(chatHistory[chatHistory.length - 1]);
                    }
                    
                    console.log("🎉 Двойная генерация завершена!");
                    toastr.success("Сообщение сгенерировано через две модели", "Dual Models");
                    
                } catch (error) {
                    console.error("❌ Ошибка генерации:", error);
                    toastr.error(`Ошибка: ${error.message}`, "Dual Models");
                } finally {
                    $("#send_but").removeClass("fa-spinner fa-spin");
                }
            }
            
            // Инициализируем кнопку при загрузке
            updateDualGenButton();
            
            console.log("✅ Dual Models: Расширение полностью загружено!");
            
        } catch (error) {
            console.error("❌ Dual Models: Ошибка загрузки:", error);
        }
    });
})();
