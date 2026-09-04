const Render = {
    currentWeek: 'odd',
    selectedDay: new Date().getDay() || 7,

    renderAll() {
        this.renderSmartCard();
        this.renderTabs();
        this.renderLessons();
    },

    renderSmartCard() {
        const now = new Date();
        const day = now.getDay();
        const hours = now.getHours();
        const minutes = now.getMinutes();
        const currentTime = hours * 60 + minutes;
        const cardContent = document.getElementById('smart-card-content');
        
        if (day === 0 || day === 6) {
            cardContent.innerHTML = "📖 Выходной<br><span style='font-size:16px; opacity:0.8'>Отдыхайте!</span>";
            return;
        }

        const lessons = DataManager.getDaySchedule(day, this.currentWeek);
        if (!lessons || lessons.length === 0) {
            cardContent.innerHTML = "📅 Нет уроков<br><span style='font-size:16px; opacity:0.8'>Добавьте расписание</span>";
            return;
        }

        let currentLesson = null, nextLesson = null;
        for (let i = 0; i < lessons.length; i++) {
            const [start, end] = lessons[i].time.split(/[-–]/);
            const [sh, sm] = start.split(':').map(Number);
            const [eh, em] = end.split(':').map(Number);
            const startTime = sh * 60 + sm;
            const endTime = eh * 60 + em;

            if (currentTime >= startTime && currentTime <= endTime) {
                currentLesson = lessons[i];
                nextLesson = lessons[i + 1] || null;
                break;
            } else if (currentTime < startTime) {
                nextLesson = lessons[i];
                break;
            }
        }

        if (currentLesson) {
            const [, end] = currentLesson.time.split(/[-–]/);
            cardContent.innerHTML = `📖 ${currentLesson.name}<br><span style='font-size:16px; opacity:0.8'>до ${end}</span>`;
        } else if (nextLesson) {
            const [start] = nextLesson.time.split(/[-–]/);
            cardContent.innerHTML = `☀️ Скоро начнется<br><span style='font-size:16px; opacity:0.8'>${nextLesson.name} в ${start}</span>`;
        } else {
            cardContent.innerHTML = `📅 День закончился<br><span style='font-size:16px; opacity:0.8'>Завтра: новый день</span>`;
        }
    },

    renderTabs() {
        const container = document.getElementById('day-tabs');
        container.innerHTML = '';
        const days = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
        const today = new Date().getDay();

        days.forEach((dayName, index) => {
            const dayNum = index + 1;
            const btn = document.createElement('button');
            btn.className = `day-tab ${this.selectedDay === dayNum ? 'active' : ''} ${today === dayNum ? 'today' : ''}`;
            btn.textContent = dayName;
            btn.addEventListener('click', () => {
                this.selectedDay = dayNum;
                this.renderTabs();
                this.renderLessons();
            });
            container.appendChild(btn);
        });
    },

    renderLessons() {
        const container = document.getElementById('lessons-list');
        container.innerHTML = '';
        const lessons = DataManager.getDaySchedule(this.selectedDay, this.currentWeek);

        if (!lessons || lessons.length === 0) {
            container.innerHTML = '<p style="text-align:center; color:var(--text-secondary); margin-top:40px;">Нет уроков</p>';
            return;
        }

        const now = new Date();
        const currentTime = now.getHours() * 60 + now.getMinutes();
        const isToday = this.selectedDay === (now.getDay() === 0 ? 7 : now.getDay());

        lessons.forEach((lesson, index) => {
            const [start, end] = lesson.time.split(/[-–]/);
            const [sh, sm] = start.split(':').map(Number);
            const [eh, em] = end.split(':').map(Number);
            const startTime = sh * 60 + sm;
            const endTime = eh * 60 + em;

            let statusClass = '';
            if (isToday) {
                if (currentTime >= startTime && currentTime <= endTime) statusClass = 'current';
                else if (currentTime < startTime && !document.querySelector('.lesson-item.current')) statusClass = 'next';
            }

            const div = document.createElement('div');
            div.className = `lesson-item ${statusClass}`;
            
            let homeworkHtml = '';
            if (lesson.homework) {
                homeworkHtml = `
                    <div class="lesson-homework">
                        <span class="homework-icon">📝</span>
                        <span class="homework-text">${lesson.homework}</span>
                    </div>
                `;
            } else {
                homeworkHtml = `
                    <div class="lesson-homework-empty">
                        <button class="btn-add-homework" data-day="${this.selectedDay}" data-index="${index}" data-week="${this.currentWeek}">
                            + Добавить ДЗ
                        </button>
                    </div>
                `;
            }
            
            div.innerHTML = `
                <div class="lesson-main">
                    <div class="lesson-time">${lesson.time}</div>
                    <div class="lesson-info">
                        <div class="lesson-name">${index + 1}. ${lesson.name}</div>
                        ${lesson.extra ? `<div class="lesson-extra">${lesson.extra}</div>` : ''}
                    </div>
                </div>
                ${homeworkHtml}
            `;
            container.appendChild(div);
        });

        // Обработчики кнопок добавления ДЗ
        container.querySelectorAll('.btn-add-homework').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const day = parseInt(e.target.dataset.day);
                const index = parseInt(e.target.dataset.index);
                const week = e.target.dataset.week;
                this.showHomeworkInput(day, index, week);
            });
        });
    },

    showHomeworkInput(day, lessonIndex, weekType) {
        const homework = prompt('Введите домашнее задание:');
        if (homework !== null) {
            DataManager.updateLessonHomework(day, lessonIndex, homework, weekType);
            this.renderLessons();
        }
    }
};

// Переключатель недель
document.querySelectorAll('.toggle-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        document.querySelectorAll('.toggle-btn').forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        Render.currentWeek = e.target.dataset.week;
        Render.renderAll();
    });
});
