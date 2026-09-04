const Editor = {
    currentDay: 1,
    currentWeek: 'odd',
    tempSchedule: [],

    init(day, weekType) {
        this.currentDay = day;
        this.currentWeek = weekType;
        this.tempSchedule = JSON.parse(JSON.stringify(DataManager.getDaySchedule(day, weekType)));
        this.updateDayButtons();
        this.render();
    },

    updateDayButtons() {
        document.querySelectorAll('.day-btn').forEach(btn => {
            btn.classList.toggle('active', parseInt(btn.dataset.day) === this.currentDay);
        });
    },

    render() {
        const container = document.getElementById('editor-list');
        container.innerHTML = '';

        if (this.tempSchedule.length === 0) {
            container.innerHTML = '<p style="text-align:center; color:var(--text-secondary); margin-top:40px;">Нет уроков. Нажмите «+ Урок»</p>';
        }

        this.tempSchedule.forEach((lesson, index) => {
            const div = document.createElement('div');
            div.className = 'editor-item';
            div.innerHTML = `
                <div class="editor-item-row">
                    <input type="text" value="${lesson.time}" data-index="${index}" data-field="time" placeholder="08:00-08:45" style="flex:1;">
                    <button class="btn-delete" data-index="${index}">✕</button>
                </div>
                <input type="text" value="${lesson.name}" data-index="${index}" data-field="name" placeholder="Предмет">
                <input type="text" value="${lesson.extra}" data-index="${index}" data-field="extra" placeholder="Кабинет / Учитель">
            `;
            container.appendChild(div);
        });

        // Обработчики полей ввода
        container.querySelectorAll('.editor-item input').forEach(input => {
            input.addEventListener('input', (e) => {
                const idx = e.target.dataset.index;
                const field = e.target.dataset.field;
                this.tempSchedule[idx][field] = e.target.value;
            });
        });

        // Обработчики удаления
        container.querySelectorAll('.btn-delete').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const idx = parseInt(e.target.dataset.index);
                this.tempSchedule.splice(idx, 1);
                this.render();
            });
        });
    },

    addLesson() {
        this.tempSchedule.push({ time: "08:00-08:45", name: "Новый урок", extra: "" });
        this.render();
    },

    save() {
        DataManager.setDaySchedule(this.currentDay, this.tempSchedule, this.currentWeek);
        App.showView('home');
        Render.renderAll();
    }
};

// Навешиваем обработчики на кнопки дней (Segmented Control)
document.querySelectorAll('.day-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        const day = parseInt(e.target.dataset.day);
        Editor.init(day, Editor.currentWeek);
    });
});

// Кнопка добавления урока
document.getElementById('btn-add-lesson').addEventListener('click', () => Editor.addLesson());

// Кнопки сохранения/отмены
document.getElementById('btn-save-editor').addEventListener('click', () => Editor.save());
document.getElementById('btn-cancel-editor').addEventListener('click', () => App.showView('home'));