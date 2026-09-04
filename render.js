const Render = {
    currentWeek: 'odd',
    selectedDay: new Date().getDay() || 7, // 1-Пн ... 7-Вс (приводим Вс к 7, но в данных 6-Сб)

    renderAll() {
        this.renderSmartCard();
        this.renderTabs();
        this.renderLessons();
    },

    renderSmartCard() {
        const now = new Date();
        const day = now.getDay(); // 0-Вс, 1-Пн...
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
            cardContent.innerHTML = "📅 Нет уроков<br><span style='font-size:16px; opacity:0.8'>На сегодня расписание пусто</span>";
            return;
        }

        let currentLesson = null;
        let nextLesson = null;

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
            const [start, end] = currentLesson.time.split(/[-–]/);
            cardContent.innerHTML = `📖 ${currentLesson.name}<br><span style='font-size:16px; opacity:0.8'>до ${end}</span>`;
        } else if (nextLesson) {
            const [start] = nextLesson.time.split(/[-–]/);
            cardContent.innerHTML = `☀️ Скоро начнется<br><span style='font-size:16px; opacity:0.8'>${nextLesson.name} в ${start}</span>`;
        } else {
            const dayNames = ['Воскресенье', 'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота'];
            const nextDay = day === 5 ? 6 : day + 1;
            cardContent.innerHTML = `📅 День закончился<br><span style='font-size:16px; opacity:0.8'>Завтра: ${dayNames[nextDay]}</span>`;
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
                else if (currentTime < startTime && !document.querySelector('.current')) statusClass = 'next';
            }

            const div = document.createElement('div');
            div.className = `lesson-item ${statusClass}`;
            div.innerHTML = `
                <div class="lesson-time">${lesson.time}</div>
                <div class="lesson-info">
                    <div class="lesson-name">${index + 1}. ${lesson.name}</div>
                    ${lesson.extra ? `<div class="lesson-extra">${lesson.extra}</div>` : ''}
                </div>
            `;
            container.appendChild(div);
        });
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