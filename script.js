document.getElementById('addTaskBtn').addEventListener('click', addTask);

document.getElementById('taskInput').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        addTask();
    }
});

function addTask() {
    const input = document.getElementById('taskInput');
    const taskText = input.value.trim();
    
    if (taskText === '') return;
    
    const li = document.createElement('li');
    li.innerHTML = `
        <input type="checkbox" class="complete">
        <span>${taskText}</span>
        <button class="delete">Delete</button>
    `;
    
    document.getElementById('taskList').appendChild(li);
    
    input.value = '';
    
    // Add event listeners to the new elements
    li.querySelector('.complete').addEventListener('change', toggleComplete);
    li.querySelector('.delete').addEventListener('click', deleteTask);
}

function toggleComplete(e) {
    const span = e.target.nextElementSibling;
    span.classList.toggle('completed');
}

function deleteTask(e) {
    e.target.parentElement.remove();
}