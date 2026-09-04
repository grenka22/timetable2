const App = {
    init() {
        // Инициализация главного экрана
        Render.renderAll();

        // Кнопка загрузки фото
        const btnUpload = document.getElementById('btn-upload');
        if (btnUpload) {
            btnUpload.addEventListener('click', () => this.showView('upload'));
        }

        // Кнопка отмены загрузки
        const btnCancelUpload = document.getElementById('btn-cancel-upload');
        if (btnCancelUpload) {
            btnCancelUpload.addEventListener('click', () => this.showView('home'));
        }

        // Кнопка ручного редактирования
        const btnEditManual = document.getElementById('btn-edit-manual');
        if (btnEditManual) {
            btnEditManual.addEventListener('click', () => {
                Editor.init(Render.selectedDay, Render.currentWeek);
                this.showView('editor');
            });
        }

        // Обработка загрузки файла
        const fileInput = document.getElementById('file-input');
        if (fileInput) {
            fileInput.addEventListener('change', async (e) => {
                await this.handleFileUpload(e);
            });
        }

        console.log('App initialized');
    },

    async handleFileUpload(e) {
        const file = e.target.files[0];
        if (!file) {
            console.log('Файл не выбран');
            return;
        }

        // Проверяем тип файла
        const validTypes = ['image/jpeg', 'image/png', 'image/jpg'];
        if (!validTypes.includes(file.type)) {
            alert('Пожалуйста, выберите изображение (JPG, PNG)');
            e.target.value = '';
            return;
        }

        // Проверяем размер файла (макс 20MB)
        if (file.size > 20 * 1024 * 1024) {
            alert('Файл слишком большой. Максимальный размер: 20 МБ');
            e.target.value = '';
            return;
        }

        const progressContainer = document.getElementById('ocr-progress');
        const progressFill = document.getElementById('progress-fill');
        const progressText = document.getElementById('progress-text');

        if (!progressContainer || !progressFill || !progressText) {
            console.error('Элементы прогресса не найдены');
            alert('Ошибка интерфейса. Обновите страницу.');
            return;
        }

        // Показываем прогресс
        progressContainer.classList.remove('hidden');
        progressFill.style.width = '0%';
        progressText.textContent = 'Подготовка...';

        try {
            // Проверяем наличие Tesseract
            if (typeof Tesseract === 'undefined') {
                throw new Error('Tesseract.js не загружен. Проверьте подключение к интернету и обновите страницу.');
            }

            console.log('Начинаю обработку файла:', file.name);
            progressText.textContent = 'Загрузка изображения...';

            // Запускаем распознавание
            const text = await OCRManager.processImage(file, (percent) => {
                progressFill.style.width = `${percent}%`;
                progressText.textContent = `Распознавание: ${percent}%`;
            });

            console.log('Распознанный текст:', text);

            // Проверяем результат
            if (!text || text.trim().length === 0) {
                throw new Error('Текст не распознан. Попробуйте сделать фото получше или выберите другое изображение.');
            }

            progressText.textContent = 'Обработка данных...';
            
            // Парсим расписание
            const parsedSchedule = Parser.parse(text);
            
            // Считаем количество уроков
            let lessonsCount = 0;
            for (let day = 1; day <= 6; day++) {
                if (parsedSchedule[day] && parsedSchedule[day].length > 0) {
                    DataManager.setDaySchedule(day, parsedSchedule[day], 'odd');
                    lessonsCount += parsedSchedule[day].length;
                    console.log(`День ${day}: ${parsedSchedule[day].length} уроков`);
                }
            }

            if (lessonsCount === 0) {
                throw new Error('Не удалось найти уроки в расписании. Убедитесь, что на фото есть таблица с расписанием.');
            }

            console.log(`Всего распознано уроков: ${lessonsCount}`);
            progressText.textContent = `Готово! Найдено ${lessonsCount} уроков.`;

            // Открываем редактор для проверки
            setTimeout(() => {
                Editor.init(1, 'odd');
                this.showView('editor');
            }, 500);

        } catch (error) {
            console.error('Ошибка при обработке:', error);
            alert('Ошибка: ' + error.message);
            progressContainer.classList.add('hidden');
        } finally {
            // Сбрасываем input чтобы можно было выбрать тот же файл снова
            setTimeout(() => {
                progressFill.style.width = '0%';
                e.target.value = '';
            }, 1000);
        }
    },

    showView(viewName) {
        console.log('Переключение на view:', viewName);
        
        // Скрываем все view
        const views = document.querySelectorAll('.view');
        views.forEach(v => {
            v.classList.remove('active');
        });

        // Показываем нужное
        const targetView = document.getElementById(`view-${viewName}`);
        if (targetView) {
            targetView.classList.add('active');
        } else {
            console.error(`View "${viewName}" не найдена`);
            return;
        }

        // Обновляем заголовок
        const titles = {
            'home': 'Расписание',
            'upload': 'Загрузка фото',
            'editor': 'Редактор'
        };
        
        const pageTitle = document.getElementById('page-title');
        if (pageTitle) {
            pageTitle.textContent = titles[viewName] || 'Расписание';
        }

        // Если перешли на главный экран - обновляем отображение
        if (viewName === 'home') {
            Render.renderAll();
        }

        // Скрываем прогресс если ушли с экрана загрузки
        if (viewName !== 'upload') {
            const progressContainer = document.getElementById('ocr-progress');
            if (progressContainer) {
                progressContainer.classList.add('hidden');
            }
        }
    }
};

// Запуск приложения после загрузки DOM
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing app...');
    try {
        App.init();
        console.log('App initialized successfully');
    } catch (error) {
        console.error('Error initializing app:', error);
        alert('Ошибка при запуске приложения. Обновите страницу.');
    }
});

// Service Worker для PWA (офлайн режим)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        // Проверяем что мы на HTTPS или localhost
        if (window.location.protocol === 'https:' || window.location.hostname === 'localhost') {
            navigator.serviceWorker.register('/sw.js')
                .then(registration => {
                    console.log('ServiceWorker registered:', registration.scope);
                })
                .catch(error => {
                    console.log('ServiceWorker registration failed:', error);
                });
        }
    });
}
