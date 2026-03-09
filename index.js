// Dual Models Extension - Версия с выбором моделей и остановкой генерации
(function() {
    'use strict';
    
    const extensionName = "dual-models";
    const extensionFolderPath = "scripts/extensions/third-party/dual-models";
    
    let availableModels = [];
    let isGenerating = false;
    let abortController = null;
    
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
                actionModel: "",
                connected: false
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
            
            // Если уже были подключены, показываем выбор моделей
            if (settings.connected && settings.dialogueModel && settings.actionModel) {
                $("#dual_models_model_selection").show();
            }
            
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
                
                abortController = new AbortController();
                
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
                    }),
                    signal: abortController.signal
                });
                
                if (!response.ok) {
                    const errorText = await response.text();
                    throw new Error(`${response.status}: ${errorText}`);
                }
                
                const data = await response.json();
                console.log(`✅ Ответ от ${modelName} получен`);
                return data.choices[0].message.content;
            }
            
            // Обработчик кнопки "Подключиться к прокси"
            $("#dual_models_test_connection").on("click", async function() {
                const button = $(this);
                button.prop("disabled", true).text("⏳ Подключаемся...");
                
                try {
                    if (!settings.url || !settings.key) {
                        throw new Error("Заполните URL и API ключ");
                    }
                    
                    // Получаем список моделей
                    const response = await fetch(`${settings.url}/models`, {
                        headers: {
                            'Authorization': `Bearer ${settings.key}`
                        }
                    });
                    
                    if (!response.ok) {
                        throw new Error(`Ошибка ${response.status}`);
                    }
                    
                    const data = await response.json();
                    availableModels = data.data || [];
                    
                    if (availableModels.length === 0) {
                        throw new Error("Не найдено доступных моделей");
                    }
                    
                    // Заполняем выпадающие списки
                    const dialogueSelect = $("#dual_models_dialogue");
                    const actionSelect = $("#dual_models_action");
                    
                    dialogueSelect.empty().append('<option value="">Выберите модель...</option>');
                    actionSelect.empty().append('<option value="">Выберите модель...</option>');
                    
                    availableModels.forEach(model => {
                        const modelId = model.id || model;
                        dialogueSelect.append(`<option value="${modelId}">${modelId}</option>`);
                        actionSelect.append(`<option value="${modelId}">${modelId}</option>`);
                    });
                    
                    // Восстанавливаем сохраненный выбор
                    if (settings.dialogueModel) {
                        dialogueSelect.val(settings.dialogueModel);
                    }
                    if (settings.actionModel) {
                        actionSelect.val(settings.actionModel);
                    }
                    
                    settings.connected = true;
                    saveSettings();
                    
                    showStatus(`✅ Подключено! Доступно моделей: ${availableModels.length}`, true);
                    $("#dual_models_model_selection").slideDown();
                    
                    console.log("✅ Подключение успешно. Модели:", availableModels);
                    
                } catch (error) {
                    settings.connected = false;
                    saveSettings();
                    showStatus(`❌ Ошибка подключения: ${error.message}`, false);
                    console.error("❌ Ошибка подключения:", error);
                } finally {
                    button.prop("disabled", false).text("🔌 Подключиться к прокси");
                }
            });
            
            // Обработчик изменения выбора моделей
            $("#dual_models_dialogue, #dual_models_action").on("change", function() {
                const dialogueModel = $("#dual_models_dialogue").val();
                const actionModel = $("#dual_models_action").val();
                
                // Активируем кнопку подтверждения, если обе модели выбраны
                if (dialogueModel && actionModel) {
                    $("#dual_models_confirm_models").prop("disabled", false);
                } else {
                    $("#dual_models_confirm_models").prop("disabled", true);
                }
            });
            
            // Обработчик кнопки "Подтвердить выбор моделей"
            $("#dual_models_confirm_models").on("click", function() {
                settings.dialogueModel = $("#dual_models_dialogue").val();
                settings.actionModel = $("#dual_models_action").val();
                saveSettings();
                
                showStatus(`✅ Модели сохранены: ${settings.dialogueModel} + ${settings.actionModel}`, true);
                toastr.success("Модели успешно настроены!", "Dual Models");
                
                updateDualGenButton();
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
                settings.connected = false;
                saveSettings();
            });
            
            $("#dual_models_key").on("input", function() {
                settings.key = $(this).val();
                settings.connected = false;
                saveSettings();
            });
            
            // ========== ДОБАВЛЯЕМ КНОПКУ В ЧАТ ==========
            
            function updateDualGenButton() {
                // Удаляем старую кнопку
                $("#dual_gen_button").remove();
                
                if (!settings.enabled || !settings.connected || !settings.dialogueModel || !settings.actionModel) {
                    return;
                }
                
                // Создаем кнопку
                const button = $('<div id="dual_gen_button" class="mes_button" title="Генерация через две модели">')
                    .html('🎭')
                    .css({
                        'cursor': 'pointer',
                        'font-size': '20px',
                        'padding': '5px 10px',
                        'display': 'inline-block'
                    });
                
                // Добавляем рядом с кнопкой отправки
                $("#send_but").parent().prepend(button);
                
                // Обработчик клика
                button.on("click", async function() {
                    if (isGenerating) {
                        stopGeneration();
                    } else {
                        await generateWithDualModels();
                    }
                });
            }
            
            // Функция остановки генерации
            function stopGeneration() {
                if (abortController) {
                    abortController.abort();
                    abortController = null;
                }
                isGenerating = false;
                $("#dual_gen_button").html('🎭').css('color', '');
                toastr.info("Генерация остановлена", "Dual Models");
                console.log("⏹️ Генерация остановлена пользователем");
            }
            
            // Функция двойной генерации
            async function generateWithDualModels() {
                console.log("🎭 Dual Models: Начинаем двойную генерацию...");
                
                if (!settings.connected || !settings.dialogueModel || !settings.actionModel) {
                    toastr.warning("Сначала подключитесь к прокси и выберите модели", "Dual Models");
                    return;
                }
                
                try {
                    isGenerating = true;
                    
                    // Меняем иконку на "стоп"
                    $("#dual_gen_button").html('⏹️').css('color', '#ff4444');
                    
                    // Получаем историю чата
                    const context = SillyTavern.getContext();
                    const chat = context.chat;
                    const characterName = context.name2 || 'Character';
                    
                    // Формируем историю (последние 10 сообщений)
                    const messages = chat.slice(-10).map(msg => ({
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
                    
                    if (!isGenerating) return; // Проверка на отмену
                    
                    // ШАГ 2: Генерируем описание
                    console.log("📖 Генерируем описание...");
                    const actionMessages = [
                        { role: 'system', content: `Персонаж сказал: "${dialogue}". Опиши его действия и эмоции в формате *действие*.` },
                        ...messages
                    ];
                    const action = await callModel(settings.actionModel, actionMessages);
                    
                    if (!isGenerating) return; // Проверка на отмену
                    
                    // ШАГ 3: Склеиваем и добавляем в чат
                    const finalMessage = `${dialogue}\n\n${action}`;
                    
                    // Добавляем сообщение в чат (универсальный способ)
                    const newMessage = {
                        name: characterName,
                        is_user: false,
                        is_system: false,
                        mes: finalMessage,
                        send_date: new Date().toISOString()
                    };
                    
                    chat.push(newMessage);
                    context.addOneMessage(newMessage);
                    await context.saveChat();
                    
                    console.log("🎉 Двойная генерация завершена!");
                    toastr.success("Сообщение добавлено в чат", "Dual Models");
                    
                } catch (error) {
                    if (error.name === 'AbortError') {
                        console.log("⏹️ Генерация отменена");
                    } else {
                        console.error("❌ Ошибка генерации:", error);
                        toastr.error(`Ошибка: ${error.message}`, "Dual Models");
                    }
                } finally {
                    isGenerating = false;
                    $("#dual_gen_button").html('🎭').css('color', '');
                    abortController = null;
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
