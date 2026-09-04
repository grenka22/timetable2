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
            // Разбиваем время на начало и конец
            const [startTime, endTime] = lesson.time ? lesson.time.split(/[-–]/) : ['08:00', '08:45'];
            
            const div = document.createElement('div');
            div.className = 'editor-item';
            div.innerHTML = `
                <div class="editor-item-row">
                    <div class="time-picker-group">
                        <label>Начало</label>
                        <input type="time" value="${startTime}" data-index="${index}" data-field="startTime" class="time-input">
                    </div>
                    <div class="time-picker-group">
                        <label>Конец</label>
                        <input type="time" value="${endTime}" data-index="${index}" data-field="endTime" class="time-input">
                    </div>
                    <button class="btn-delete" data-index="${index}">✕</button>
                </div>
                <input type="text" value="${lesson.name}" data-index="${index}" data-field="name" placeholder="Предмет" class="editor-input">
                <input type="text" value="${lesson.extra}" data-index="${index}" data-field="extra" placeholder="Кабинет / Учитель" class="editor-input">
            `;
            container.appendChild(div);
        });

        // Обработчики полей ввода
        container.querySelectorAll('.editor-item input').forEach(input => {
            input.addEventListener('input', (e) => {
                const idx = e.target.dataset.index;
                const field = e.target.dataset.field;
                
                if (field === 'startTime' || field === 'endTime') {
                    // Обновляем поле time в формате "08:00-08:45"
                    const currentLesson = this.tempSchedule[idx];
                    const [currentStart, currentEnd] = currentLesson.time ? currentLesson.time.split(/[-–]/) : ['08:00', '08:45'];
                    
                    if (field === 'startTime') {
                        currentLesson.time = `${e.target.value}-${currentEnd}`;
                    } else {
                        currentLesson.time = `${currentStart}-${e.target.value}`;
                    }
                } else {
                    this.tempSchedule[idx][field] = e.target.value;
                }
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
        this.tempSchedule.push({ 
            time: "08:00-08:45", 
            name: "Новый урок", 
            extra: "",
            homework: ""
        });
        this.render();
    },

    save() {
        DataManager.setDaySchedule(this.currentDay, this.tempSchedule, this.currentWeek);
        App.showView('home');
        Render.renderAll();
    }
};

// Навешиваем обработчики на кнопки дней
document.querySelectorAll('.day-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        const day = parseInt(e.target.dataset.day);
        Editor.init(day, Editor.currentWeek);
    });
});

document.getElementById('btn-add-lesson').addEventListener('click', () => Editor.addLesson());
document.getElementById('btn-save-editor').addEventListener('click', () => Editor.save());
document.getElementById('btn-cancel-editor').addEventListener('click', () => App.showView('home'));
