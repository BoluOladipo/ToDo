document.getElementById('add-btn').onclick = async () => {
  const title = document.getElementById('todo-input').value.trim();
  if (!title) return alert('Please enter a todo');

  const token = localStorage.getItem('token');
  if (!token) return alert('Please log in first');

  try {
    const res = await fetch('https://todo-backend-pe6h.onrender.com/todos', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ title })
    });

    const data = await res.json();
    if (res.ok) {
      alert('✅ Todo added');
      document.getElementById('todo-input').value = '';
      loadTodos(); // optionally reload the list
    } else {
      alert(data.error || '❌ Failed to add todo');
    }
  } catch (err) {
    alert('❌ Error: ' + err.message);
  }
};
