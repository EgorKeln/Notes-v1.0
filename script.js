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

    //Сохранение заметки
    saveButton.addEventListener('click', () => {
        const title = document.getElementById('note-title').value; // Получаем значение заголовка заметки.
        const body = document.getElementById('note-body').value; // Получаем текст заметки.
        const color = document.getElementById('note-color').value; // Получаем цвет заметки.
    
        if (title && body) { // Проверяем, что поля заголовка и текста не пустые.
            // Проверка на уникальность заголовка
            const titleExists = notes.some(note => note.title === title);
            
            if (editingNote) { // Если редактируем существующую заметку
 
                    // Получаем заголовок редактируемой заметки
                    const editingTitle = editingNote.querySelector('.note-title').innerText;

                    // Находим индекс заметки, которую мы редактируем
                    const index = notes.findIndex(note => note.title === editingTitle);

                    if (index !== -1) {
                        // Удаляем старую заметку
                        notes.splice(index, 1);

                        // Создаем новый объект с обновленными значениями
                        const updatedNote = { title, body, color };

                        // Добавляем новую заметку в массив
                        notes.push(updatedNote);

                        // Обновляем хранилище localStorage
                        updateLocalStorage();
                    }
            } else {
                // Если это новая заметка, проверяем уникальность заголовка
                if (titleExists) {
                    alert('Заголовок уже существует! Пожалуйста, используйте другой заголовок.'); // Предупреждение о существующем заголовке
                    return; // Выходим, не добавляя заметку
                }
                // Если это новая заметка, добавляем в массив
                notes.push({ title, body, color }); // Добавляем новую заметку в массив.
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
            alert('Пожалуйста, заполните все поля!'); // Выводим сообщение, если поля пустые.
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
    
    document.getElementById('note-title').value = title; // Устанавливаем значение заголовка выбранной заметки в поле ввода заголовка попапа.
    document.getElementById('note-body').value = body; // Устанавливаем текст заметки в поле ввода тела заметки в попапе.
    document.getElementById('note-color').value = color; // Устанавливаем цвет в поле выбора цвета заметки в попапе.

    editingNote = note; // Сохраняем ссылку на редактируемую заметку для дальнейшего обновления.
    popup.style.display = 'block'; // Отображаем попап для редактирования заметки.
}


    // Функция для удаления заметки
    function deleteNote(note) {
        if (confirm('Вы уверены, что хотите удалить эту заметку?')) {
            const previousState = JSON.stringify(notes); // Сохраняем предыдущее состояние перед удалением
            note.remove();
            notes = notes.filter(n => n.title !== note.querySelector('.note-title').innerText);
            updateLocalStorage(); // Обновляем localStorage после удаления

            // Записываем действие в историю
            history.push({ type: 'delete', state: previousState });
            if (history.length > 20) history.shift(); // Ограничиваем историю до 20 действий

            displayNotes(notes);
        }
    }

    // Функция для сброса ввода
    function resetInput() {
        document.getElementById('note-title').value = '';
        document.getElementById('note-body').value = '';
        document.getElementById('note-color').value = 'rgb(236, 236, 236)';
        searchInput.value = ''; // Сброс поля поиска
    }

    // Создание элемента заметки
    function createNoteElement({ title, body, color }) {
        const noteDiv = document.createElement('div');
        noteDiv.classList.add('note');
        noteDiv.style.backgroundColor = color;
        
        noteDiv.innerHTML = `
            <strong class="note-title">${title}</strong>
            <p class="note-body">${body}</p>
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
        'rgb(236, 236, 236)': 1,
        'rgb(247, 136, 136)': 2,
        'rgb(243, 210, 80)': 3,
        'rgb(136, 189, 188)': 4
    };

    notesToDisplay.sort((a, b) => colorOrder[a.color] - colorOrder[b.color]);

    noteContainer.innerHTML = ''; // Очищаем контейнер
    notesToDisplay.forEach(note => {
        const noteDiv = createNoteElement(note);
        noteContainer.appendChild(noteDiv);
    });
}

// Фильтрация заметок по цвету
allNotesButton.addEventListener('click', () => displayNotes(notes));
whiteNotesButton.addEventListener('click', () => displayNotes(notes.filter(note => note.color === 'rgb(236, 236, 236)')));
redNotesButton.addEventListener('click', () => displayNotes(notes.filter(note => note.color === 'rgb(247, 136, 136)')));
yellowNotesButton.addEventListener('click', () => displayNotes(notes.filter(note => note.color === 'rgb(243, 210, 80)')));
greenNotesButton.addEventListener('click', () => displayNotes(notes.filter(note => note.color === 'rgb(136, 189, 188)')));

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
                    alert('Невозможно загрузить заметки. Убедитесь, что файл в правильном формате.');
                }
            };
            reader.readAsText(file);
        }
    });
});