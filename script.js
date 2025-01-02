document.addEventListener('DOMContentLoaded', () => { // Ждем полной загрузки DOM перед выполнением скрипта.
    const createNoteButton = document.getElementById('create-note'); // Получаем элемент кнопки для создания заметки по ID.
    const popup = document.getElementById('note-popup'); // Получаем элемент попап-окна для заметки по ID.
    const closeButton = document.getElementById('close-popup'); // Получаем элемент кнопки закрытия попапа по ID.
    const saveButton = document.getElementById('save-note'); // Получаем элемент кнопки сохранения заметки по ID.
    const noteContainer = document.getElementById('notes-container'); // Получаем контейнер для заметок по ID.
    
    const undoButton = document.getElementById('undo'); // Кнопка Undo (отмена).
    const saveNotesButton = document.getElementById('save-notes'); // Кнопка сохранения всех заметок.
    const loadNotesButton = document.getElementById('load-notes'); // Кнопка загрузки заметок.
    const loadNotesInput = document.createElement('input'); // Создаем элемент input для загрузки файла.
    loadNotesInput.type = 'file'; // Устанавливаем тип input как 'file'.
    loadNotesInput.accept = '.json'; // Ограничиваем загружаемые файлы до .json.
    loadNotesInput.style.display = 'none'; // Скрываем input, чтобы он не отображался на странице.

    document.body.appendChild(loadNotesInput); // Добавляем скрытый input для загрузки файла в тело документа.

    // Получаем кнопки для фильтрации заметок по цвету по ID.
    const allNotesButton = document.getElementById('all-notes');
    const whiteNotesButton = document.getElementById('white-notes');
    const redNotesButton = document.getElementById('red-notes');
    const yellowNotesButton = document.getElementById('yellow-notes');
    const greenNotesButton = document.getElementById('green-notes');
    const searchInput = document.getElementById('note-search'); // Получаем поле ввода для поиска заметок.

    let editingNote = null; // Переменная для отслеживания редактируемой заметки (используется для обновления).
    let notes = []; // Массив для хранения всех заметок.
    let history = []; // Массив для хранения истории действий для функции Undo.

    loadNotes(); // Загружаем заметки из localStorage при загрузке страницы.


    // Функция отработки окна alert
    //================================================фывфыв
    function showNotification(message) {
        const notification = document.getElementById('notification');
        const notificationMessage = document.getElementById('notificationMessage');
        const closeNotificationButton = document.getElementById('closeNotification');
    
        notificationMessage.innerText = message;
        notification.style.display = 'block';
    
        closeNotificationButton.onclick = () => {
            notification.style.display = 'none';
        };
    
        // Автоматически скрыть уведомление через 10 секунд
        setTimeout(() => {
            notification.style.display = 'none';
        }, 10000);
    }
    //================================================фывфыв

    // Открытие попапа для создания новой заметки
    createNoteButton.addEventListener('click', () => {
        editingNote = null; // Устанавливаем редактируемую заметку в null при создании новой.
        popup.style.display = 'block'; // Отображаем попап-окно.
        resetInput(); // Очищаем поля ввода.
    });

    // Закрытие попапа
    closeButton.addEventListener('click', () => {
        popup.style.display = 'none'; // Скрываем попап-окно.
    });

    // Закрытие попапа при клике вне его
    window.addEventListener('click', (event) => {
        if (event.target === popup) { // Проверяем, был ли клик на попапе
            popup.style.display = 'none'; // Если да, скрываем попап.
        }
    });


// Функция для оборачивания даты и времени в span с классами
function wrapDateAndTime(dateTime) {
    const date = new Date(dateTime);
    const options = { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false };
    const formattedDate = date.toLocaleString('en-GB', options); // Форматируем дату и время
    const [datePart, timePart] = formattedDate.split(' ');
    const [day, month, year] = datePart.split('/');
    const [hours, minutes, seconds] = timePart.split(':');
    
    return `
        <span class="day">${day}</span>
        <span class="separator">/</span>
        <span class="month">${month}</span>
        <span class="separator">/</span>
        <span class="year">${year}</span>
        <span class="separator">, </span>
        <span class="hours">${hours}</span>
        <span class="separator">:</span>
        <span class="minutes">${minutes}</span>
        <span class="separator">:</span>
        <span class="seconds">${seconds}</span>
    `.trim();
}
// Сохранение заметки
saveButton.addEventListener('click', () => {
    const title = document.getElementById('note-title').value; // Получаем значение заголовка заметки.
    const body = document.getElementById('note-body').value; // Получаем текст заметки.
    const color = document.getElementById('note-color').value; // Получаем цвет заметки.
    const deadline = document.getElementById('note-deadline').value; // Получаем значение дедлайна
    
    // Получаем текущую дату и время
    const currentDateTime = new Date(); // Используем объект Date напрямую

    if (title && body) { // Проверяем, что поля заголовка и текста не пустые.
        // Преобразуем текст заметки для сохранения с переносами строк
        const formattedBody = body.split('\n').map(line => line.trim()).join('<br>'); // Убираем лишние пробелы и оставляем переносы строк

        // Проверка на уникальность заголовка
        const titleExists = notes.some(note => note.title === title);
        
        if (editingNote) { // Если редактируем существующую заметку

            // Получаем заголовок редактируемой заметки
            const editingTitle = editingNote.querySelector('.note-title').innerText;

            // Находим индекс заметки, которую мы редактируем
            const index = notes.findIndex(note => note.title === editingTitle);

            if (index !== -1) {
                // Обновляем дату и время изменения
                const updatedNote = { 
                    ...notes[index], // Берем старые значения заметки
                    title, 
                    body: formattedBody, 
                    color, 
                    created: notes[index].created, // Сохраняем дату создания
                    modified: wrapDateAndTime(currentDateTime), // Обновляем дату изменения с оберткой
                    deadline: deadline ? deadline : notes[index].deadline // Обновляем дедлайн, если он указан, иначе оставляем старый
                };

                // Обновляем заметку в массиве
                notes[index] = updatedNote;

                // Обновляем хранилище localStorage
                updateLocalStorage();
            }
        } else {
            // Если это новая заметка, проверяем уникальность заголовка
            if (titleExists) {
                showNotification('Заголовок уже существует!'); // Предупреждение о существующем заголовке
                return; // Выходим, не добавляя заметку
            }
            // Если это новая заметка, добавляем в массив
            notes.push({ 
                title, 
                body: formattedBody, 
                color,
                created: wrapDateAndTime(currentDateTime), // Запоминаем дату создания с оберткой
                modified: null, // В момент создания поле "изменено" отсутствует
                deadline: deadline || null // Указываем дедлайн в новой заметке, если есть
            }); 
            updateLocalStorage(); // Обновляем хранилище localStorage.
        }
        
        // Записываем действие в историю
        const previousState = JSON.stringify(notes); // Сохраняем предыдущее состояние заметок в JSON-формате.
        history.push({ type: 'add', state: previousState }); // Добавляем последнее состояние в историю.
        if (history.length > 20) history.shift(); // Ограничиваем историю до 20 последних действий.

        // Сброс ввода после сохранения заметки
        resetInput(); // Очищаем поля ввода.
        popup.style.display = 'none'; // Закрываем попап.
        displayNotes(notes); // Обновляем отображение всех заметок.

    } else {
        showNotification('Заполните все поля!'); // Выводим сообщение, если поля пустые.
    }
});




    // Обработчик для кнопки Undo
    undoButton.addEventListener('click', () => {
        if (history.length > 0) { // Проверяем, есть ли действия для отмены
            const lastAction = history.pop(); // Удаляем последнее действие из истории
            restoreState(lastAction.state); // Восстанавливаем предыдущее состояние заметок
        }
    });

    // Восстановление состояния заметок
    function restoreState(state) {
        notes = JSON.parse(state); // Получаем заметки из сохраненного состояния
        updateLocalStorage(); // Обновляем localStorage
        displayNotes(notes); // Обновляем отображаемые заметки
    }




    // Функция для редактирования заметки
    function editNote(note) { // Определяем функцию editNote, которая принимает один параметр - объект заметки (note).

        const title = note.querySelector('.note-title').innerText; // Извлекаем заголовок заметки из элемента с классом 'note-title'.
        const body = note.querySelector('.note-body').innerText; // Извлекаем текст заметки из элемента с классом 'note-body'.
        const color = note.style.backgroundColor; // Извлекаем цвет фона заметки из стиля элемента.
        
        // Извлекаем дедлайн, если он есть
        const deadlineSpans = note.querySelectorAll('.note-deadline span span');
        let deadline = '';
    
        if (deadlineSpans.length === 6) { // Проверяем, что все 6 элементов присутствуют
            const day = deadlineSpans[1].innerText; // День
            const month = deadlineSpans[3].innerText; // Месяц
            const year = deadlineSpans[5].innerText; // Год
            deadline = `${year}-${month}-${day}`; // Форматируем в нужный формат YYYY-MM-DD
        } else {
            deadline = 'Нет'; // Если дедлайн не установлен
        }
    
        // Устанавливаем значения в поля ввода попапа
        document.getElementById('note-title').value = title; // Устанавливаем значение заголовка выбранной заметки в поле ввода заголовка попапа.
        document.getElementById('note-body').value = body; // Устанавливаем текст заметки в поле ввода тела заметки в попапе.
        document.getElementById('note-color').value = color; // Устанавливаем цвет в поле выбора цвета заметки в попапе.
        document.getElementById('note-deadline').value = deadline === 'Нет' ? '' : deadline; // Установка дедлайна в поле
    
        editingNote = note; // Сохраняем ссылку на редактируемую заметку для дальнейшего обновления.
        popup.style.display = 'block'; // Отображаем попап для редактирования заметки.
    }

 // Функция для удаления заметки
    function deleteNote(note) {
        // Отображаем модальное окно подтверждения
        const modal = document.getElementById('deleteConfirmation');
        modal.style.display = 'block';
        
        // Получаем кнопки подтверждения и отмены
        const confirmDelete = document.getElementById('confirmDelete');
        const cancelDelete = document.getElementById('cancelDelete');
    
        // Обработчик кнопки подтверждения
        confirmDelete.onclick = function() {
            const previousState = JSON.stringify(notes); // Сохраняем предыдущее состояние перед удалением
            note.remove();
            notes = notes.filter(n => n.title !== note.querySelector('.note-title').innerText);
            updateLocalStorage(); // Обновляем localStorage после удаления
    
            // Записываем действие в историю
            history.push({ type: 'delete', state: previousState });
            if (history.length > 20) history.shift(); // Ограничиваем историю до 20 действий
    
            displayNotes(notes);
            modal.style.display = 'none'; // Закрываем модальное окно
        };
    
        // Обработчик кнопки отмены
        cancelDelete.onclick = function() {
            modal.style.display = 'none'; // Закрываем модальное окно
        };
    }
    
    // Закрываем модальное окно при нажатии вне его
    window.onclick = function(event) {
        const modal = document.getElementById('deleteConfirmation');
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    };


    // Функция для сброса ввода
    function resetInput() {
        document.getElementById('note-title').value = '';
        document.getElementById('note-body').value = '';
        document.getElementById('note-color').value = 'rgba(236, 236, 236, 0.5)';
        document.getElementById('note-deadline').value = ''; // Сброс поля дедлайна
        searchInput.value = ''; // Сброс поля поиска
    }


    // Создание поля для заметки
    function createNoteElement({ title, body, color, created, modified, deadline }) {
        const noteDiv = document.createElement('div');
        noteDiv.classList.add('note');
        noteDiv.style.backgroundColor = color;
    
        // Формируем HTML для дедлайна
        let deadlineHtml = 'Нет'; // Значение по умолчанию для дедлайна
        if (deadline) {
            const [year, month, day] = deadline.split('-'); // Разделяем строку на год, месяц и день
            deadlineHtml = `
                <span class="deadline-text">Дедлайн: </span>
                <span class="deadline-day">${day}</span>
                <span>-</span>
                <span class="deadline-month">${month}</span>
                <span>-</span>
                <span class="deadline-year">${year}</span>
            `;
        }
    
        noteDiv.innerHTML = `
            <strong class="note-title">${title}</strong>
            <p class="note-body">${body}</p>
            <p class="note-date">
                <span class="note-date-wrap">${modified ? '<span class="date-text">Изменено:</span>' + modified : '<span class="date-text">Создано:</span>' + created}</span>
            </p>
            <p class="note-deadline">
                <span class="note-deadline-wrap">${deadlineHtml}</span> <!-- Подставляем сформированный HTML для дедлайна -->
            </p>
            <button class="edit-note">Редактировать</button>
            <button class="delete-note">Удалить</button>
        `;
    
        // Добавление обработчиков для редактирования и удаления
        noteDiv.querySelector('.edit-note').addEventListener('click', () => {
            editNote(noteDiv);
        });
        noteDiv.querySelector('.delete-note').addEventListener('click', () => {
            deleteNote(noteDiv);
        });
    
        return noteDiv;
    }

    // Сохранение заметки в localStorage
    function updateLocalStorage() {
        localStorage.setItem('notes', JSON.stringify(notes));
    }

    // Загрузка заметок из localStorage
    function loadNotes() {
        notes = JSON.parse(localStorage.getItem('notes')) || [];
        displayNotes(notes);
    }

 // Отображение заметок с учетом сортировки
 function displayNotes(notesToDisplay) {
    const colorOrder = {
        'rgba(236, 236, 236, 0.5)': 1,
        'rgb(236, 236, 236)': 1,
        'rgba(247, 136, 136, 0.5)': 2,
        'rgb(247, 136, 136)': 2,
        'rgba(243, 210, 80, 0.5)': 3,
        'rgb(243, 210, 80)': 3,
        'rgba(136, 189, 188, 0.5)': 4,
        'rgb(136, 189, 188)': 4
    };

    notesToDisplay.sort((a, b) => colorOrder[a.color] - colorOrder[b.color]);

    noteContainer.innerHTML = ''; // Очищаем контейнер
    notesToDisplay.forEach(note => {
        const noteDiv = createNoteElement(note);
        noteContainer.appendChild(noteDiv);
    });
}


// Функция для фильтрации заметок по цвету
function filterNotesByColor(colorFilter) {
    displayNotes(notes.filter(note => 
        note.color === colorFilter || 
        (colorFilter === 'rgba(236, 236, 236, 0.5)' || colorFilter === 'rgb(236, 236, 236)') && 
        (note.color === 'rgba(236, 236, 236, 0.5)' || note.color === 'rgb(236, 236, 236)') ||
        (colorFilter === 'rgba(247, 136, 136, 0.5)' || colorFilter === 'rgb(247, 136, 136)') && 
        (note.color === 'rgba(247, 136, 136, 0.5)' || note.color === 'rgb(247, 136, 136)') ||
        (colorFilter === 'rgba(243, 210, 80, 0.5)' || colorFilter === 'rgb(243, 210, 80)') && 
        (note.color === 'rgba(243, 210, 80, 0.5)' || note.color === 'rgb(243, 210, 80)') ||
        (colorFilter === 'rgba(136, 189, 188, 0.5)' || colorFilter === 'rgb(136, 189, 188)') && 
        (note.color === 'rgba(136, 189, 188, 0.5)' || note.color === 'rgb(136, 189, 188)')
    ));
}
// Обработчики событий для кнопок фильтрации по цвету
allNotesButton.addEventListener('click', () => displayNotes(notes));

whiteNotesButton.addEventListener('click', () => 
    filterNotesByColor('rgba(236, 236, 236, 0.5)') ||
    filterNotesByColor('rgb(236, 236, 236)') // Фильтрация по двум цветам
);

redNotesButton.addEventListener('click', () => 
    filterNotesByColor('rgba(247, 136, 136, 0.5)') ||
    filterNotesByColor('rgb(247, 136, 136)') // Фильтрация по двум цветам
);

yellowNotesButton.addEventListener('click', () => 
    filterNotesByColor('rgba(243, 210, 80, 0.5)') ||
    filterNotesByColor('rgb(243, 210, 80)') // Фильтрация по двум цветам
);

greenNotesButton.addEventListener('click', () => 
    filterNotesByColor('rgba(136, 189, 188, 0.5)') ||
    filterNotesByColor('rgb(136, 189, 188)') // Фильтрация по двум цветам
);


// Функция для извлечения дедлайна из заметки
function getDeadline(note) {
    const deadlineSpans = note.deadline; // Предполагается, что deadline теперь хранится прямо в объекте note
    let deadline = '';

    if (deadlineSpans) {
        const [year, month, day] = deadlineSpans.split('-'); // Предполагаем, что формат YYYY-MM-DD
        deadline = new Date(year, month - 1, day); // Создаем объект даты (месяцы в JS начинаются с 0)
    }
    return deadline ? deadline : null; // Возвращаем дату или null
}

// Функция для фильтрации заметок по дедлайну с диапазоном
function filterNotesByDeadlineInRange(minDays, maxDays) {
    const currentDate = new Date();
    const filteredNotes = notes.filter(note => {
        const deadlineDate = getDeadline(note); // Используем новую функцию получения дедлайна
        if (!deadlineDate) return false; // Пропускаем заметки без дедлайна
        const timeDiff = deadlineDate - currentDate;
        const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24)); // Сравниваем с разницей в днях

        // Проверяем, находится ли дедлайн в диапазоне
        return daysDiff >= minDays && daysDiff <= maxDays;
    });
    displayNotes(filteredNotes); // Отображаем отфильтрованные заметки
}

// Обработчики событий для кнопок фильтрации по дедлайну
document.getElementById('today-note').addEventListener('click', () => filterNotesByDeadlineInRange(0, 1)); // Для "Сегодня"
document.getElementById('week-note').addEventListener('click', () => filterNotesByDeadlineInRange(2, 7)); // Для "Неделя"
document.getElementById('month-note').addEventListener('click', () => filterNotesByDeadlineInRange(8, 31));  // Обработчик для кнопки "Месяц" (например, от 8 до 31 дня)
document.getElementById('quarter-note').addEventListener('click', () => filterNotesByDeadlineInRange(32, 93)); // Обработчик для кнопки "Три месяца"
document.getElementById('year-note').addEventListener('click', () => filterNotesByDeadlineInRange(94, 1000)); // Обработчик для кнопки "Год" (например, более 93 дней)


// Поиск заметок
searchInput.addEventListener('input', () => {
    const searchText = searchInput.value.toLowerCase();
    const filteredNotes = notes.filter(note => 
        note.title.toLowerCase().includes(searchText) || 
        note.body.toLowerCase().includes(searchText)
    );
    displayNotes(filteredNotes);
});

    // Сохранение заметок в файл
    saveNotesButton.addEventListener('click', () => {
        const dataStr = JSON.stringify(notes);
        const blob = new Blob([dataStr], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'notes.json';
        document.body.appendChild(a); // Этот элемент нужен для клика
        a.click();
        document.body.removeChild(a); // Убираем элемент
        URL.revokeObjectURL(url); // Освобождаем URL
    });

    // Загрузка заметок из файла
    loadNotesButton.addEventListener('click', () => {
        loadNotesInput.click(); // Открываем диалог выбора файла
    });

    loadNotesInput.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    notes = JSON.parse(e.target.result);
                    updateLocalStorage(); // Обновляем localStorage
                    displayNotes(notes); // Отображаем загруженные заметки
                } catch (error) {
                    // alert('Невозможно загрузить заметки. Убедитесь, что файл в правильном формате.');
                    showNotification('Невозможно загрузить!'); 
                }
            };
            reader.readAsText(file);
        }
    });
});