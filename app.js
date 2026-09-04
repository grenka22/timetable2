const App = {
    init() {
        Render.renderAll();

        // Кнопки навигации
        document.getElementById('btn-upload').addEventListener('click', () => this.showView('upload'));
        document.getElementById('btn-cancel-upload').addEventListener('click', () => this.showView('home'));
        
        document.getElementById('btn-edit-manual').addEventListener('click', () => {
            Editor.init(Render.selectedDay, Render.currentWeek);
            this.showView('editor');
        });

        // Обработка загрузки файла
        document.getElementById('file-input').addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (!file) return;

            const progressContainer = document.getElementById('ocr-progress');
            const progressFill = document.getElementById('progress-fill');
            const progressText = document.getElementById('progress-text');
            
            progressContainer.classList.remove('hidden');

            try {
                const text = await OCRManager.processImage(file, (percent) => {
                    progressFill.style.width = `${percent}%`;
                    progressText.textContent = `Распознавание: ${percent}%`;
                });

                progressText.textContent = "Обработка данных...";
                const parsedSchedule = Parser.parse(text);
                
                for (let day = 1; day <= 6; day++) {
                    if (parsedSchedule[day].length > 0) {
                        DataManager.setDaySchedule(day, parsedSchedule[day], 'odd');
                    }
                }

                Editor.init(1, 'odd');
                this.showView('editor');
                
            } catch (err) {
                alert("Ошибка распознавания: " + err.message);
                console.error(err);
            } finally {
                progressContainer.classList.add('hidden');
                progressFill.style.width = '0%';
                e.target.value = '';
            }
        });
    },

    showView(viewName) {
        document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
        document.getElementById(`view-${viewName}`).classList.add('active');
        
        const titles = {
            'home': 'Расписание',
            'upload': 'Загрузка фото',
            'editor': 'Редактор'
        };
        document.getElementById('page-title').textContent = titles[viewName];

        if (viewName === 'home') {
            Render.renderAll();
        }
    }
};

document.addEventListener('DOMContentLoaded', () => {
    App.init();
});