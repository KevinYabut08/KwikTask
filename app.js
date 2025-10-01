const toDoForm = document.querySelector("form");
const toDoInput = document.getElementById("todo-input");
const toDoList = document.getElementById("todo-list");

let allToDos = getTodos();
updateToDoList();

toDoForm.addEventListener("submit", function(event) {
    event.preventDefault();
    addToDo();
});

function addToDo() {
    const todoText = toDoInput.value.trim();
    if (todoText.length > 0) {
        const todoObject = {
            text: todoText,
            completed: false
        };
        allToDos.push(todoObject);
        updateToDoList();
        saveToDos();
        toDoInput.value = "";
    };
}

function updateToDoList() {
    toDoList.innerHTML = "";
    allToDos.forEach((todo, todoIndex) => {
        todoItem = createToDoItem(todo, todoIndex);
        toDoList.append(todoItem);
    });
}

function createToDoItem(todo, todoIndex) {
    const todoID = "todo-" + todoIndex;
    const todoLI = document.createElement("li");
    const todoText  = todo.text;
    todoLI.className = "todo";
    todoLI.innerHTML = `
        <input type="checkbox" id="todo-${todoID}" class="todo-checkbox">
        <label for="todo-${todoID}" class="custom-checkbox">
            <svg fill="transparent" class="todo-icon" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
                <path fill="none" d="M0 0h24v24H0z"/>
                <path d="M9 16.17L4.83 12l-1.41 1.41L9 19 21.59 6.41l-1.41-1.41L9 16.17z"/>
            </svg>
        </label>
        <span class="todo-text">${todoText}</span>
        <button class="delete-button" data-index="${todoID}"><svg fill="grey" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
                   <path fill="none" d="M0 0h24v24H0z"/>
                   <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zm2-14h8V3H8v2zM4 7v2h16V7H4z"/>
               </svg></button>
    `;

    const deleteButton = todoLI.querySelector(".delete-button");
    deleteButton.addEventListener("click", function() {
        allToDos.splice(todoIndex, 1);
        updateToDoList();
        saveToDos();
    });
    const checkbox = todoLI.querySelector("input");
    checkbox.addEventListener("change", function() {
        allToDos[todoIndex].completed = checkbox.checked;
        saveToDos();
    });
    checkbox.checked = todo.completed;
    return todoLI;
}

function saveToDos() {
    const todosJson = JSON.stringify(allToDos);
    localStorage.setItem("todos", todosJson);
}

function getTodos() {
    const todosJson = localStorage.getItem("todos") || "[]";
    return JSON.parse(todosJson);
}
