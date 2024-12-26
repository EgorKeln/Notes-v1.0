document.addEventListener('DOMContentLoaded', () => {
    const createNoteButton = document.getElementById('create-note');
    const popup = document.getElementById('note-popup');
    const closeButton = document.getElementById('close-popup');
    const saveButton = document.getElementById('save-note');
    const noteContainer = document.getElementById('notes-container');
    
    const undoButton = document.getElementById('undo'); // Кнопка Undo
    const saveNotesButton = document.getElementById('save-notes'); // Кнопка сохранения заметок
    const loadNotesButton = document.getElementById('load-notes'); // Кнопка загрузки заметок
    const loadNotesInput = document.createElement('input'); // Создаем input для загрузки файла
    loadNotesInput.type = 'file'; // Задаем тип
    loadNotesInput.accept = '.json'; // Ограничиваем выбор файлов до .json
    loadNotesInput.style.display = 'none'; // Скрываем input

    document.body.appendChild(loadNotesInput); // Добавляем input в body

    const allNotesButton = document.getElementById('all-notes');
    const whiteNotesButton = document.getElementById('white-notes');
    const redNotesButton = document.getElementById('red-notes');
    const yellowNotesButton = document.getElementById('yellow-notes');
    const greenNotesButton = document.getElementById('green-notes');
    const searchInput = document.getElementById('note-search');

    let editingNote = null; // Для отслеживания редактируемой заметки
    let notes = []; // Используем массив для хранения заметок
    let history = []; // Стек действий для Undo

    // Загрузка заметок из localStorage при загрузке страницы
    loadNotes();

    // Открытие попапа
    createNoteButton.addEventListener('click', () => {
        editingNote = null; // Сброс на новой заметке
        popup.style.display = 'block';
    });

    // Закрыть попап
    closeButton.addEventListener('click', () => {
        popup.style.display = 'none';
    });

    window.addEventListener('click', (event) => {
        if (event.target === popup) {
            popup.style.display = 'none';
        }
    });

    // Сохранение заметки
    saveButton.addEventListener('click', () => {
        const title = document.getElementById('note-title').value;
        const body = document.getElementById('note-body').value;
        const color = document.getElementById('note-color').value;

        if (title && body) {
            const newNote = { title, body, color };
            const previousState = JSON.stringify(notes); // Сохраняем предыдущее состояние

            if (editingNote) {
                // Обновление существующей заметки
                editingNote.querySelector('.note-title').innerText = title;
                editingNote.querySelector('.note-body').innerText = body;
                editingNote.style.backgroundColor = color;

                // Удаляем старую заметку из массива и добавляем обновленную
                notes = notes.map(note => (note.title === editingNote.querySelector('.note-title').innerText)
                    ? newNote : note);
                updateLocalStorage();
            } else {
                // Создание новой заметки
                notes.push(newNote);
                updateLocalStorage();
            }
            // Записываем действие в историю
            history.push({ type: 'add', state: previousState });
            if (history.length > 5) history.shift(); // Ограничиваем историю до 5 действий

            // Сброс ввода после сохранения заметки
            resetInput();
            popup.style.display = 'none';
            displayNotes(notes);
        } else {
            alert('Пожалуйста, заполните все поля!');
        }
    });

    // Обработчик для кнопки Undo
    undoButton.addEventListener('click', () => {
        if (history.length > 0) {
            const lastAction = history.pop(); // Удаляем последнее действие из истории
            restoreState(lastAction.state); // Восстанавливаем предыдущее состояние
        }
    });

    // Восстановление состояния заметок
    function restoreState(state) {
        notes = JSON.parse(state); // Получаем заметки из сохраненного состояния
        updateLocalStorage(); // Обновляем localStorage
        displayNotes(notes); // Обновляем отображаемые заметки
    }

    // Функция для редактирования заметки
    function editNote(note) {
        const title = note.querySelector('.note-title').innerText;
        const body = note.querySelector('.note-body').innerText;
        const color = note.style.backgroundColor;

        document.getElementById('note-title').value = title;
        document.getElementById('note-body').value = body;
        document.getElementById('note-color').value = color;

        editingNote = note;
        popup.style.display = 'block';
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
            if (history.length > 5) history.shift(); // Ограничиваем историю до 5 действий

            displayNotes(notes);
        }
    }

    // Функция для сброса ввода
    function resetInput() {
        document.getElementById('note-title').value = '';
        document.getElementById('note-body').value = '';
        document.getElementById('note-color').value = 'white';
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
            'white': 1,
            'red': 2,
            'yellow': 3,
            'green': 4
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
    whiteNotesButton.addEventListener('click', () => displayNotes(notes.filter(note => note.color === 'white')));
    redNotesButton.addEventListener('click', () => displayNotes(notes.filter(note => note.color === 'red')));
    yellowNotesButton.addEventListener('click', () => displayNotes(notes.filter(note => note.color === 'yellow')));
    greenNotesButton.addEventListener('click', () => displayNotes(notes.filter(note => note.color === 'green')));

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