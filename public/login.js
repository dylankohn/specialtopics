const loginForm = document.querySelector('form');
loginForm.addEventListener('submit', async (event) => {
    event.preventDefault(); // Prevent the default form submission
    
    const username = document.querySelector('input[name="username"]').value;
    const password = document.querySelector('input[name="password"]').value;

    const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
    });

    const result = await response.json();
    if (result.success) {
        localStorage.setItem('token', result.token);
        window.location.href = 'http://localhost:3000/home.html'; // Redirect on success
    } else {
        console.error('Login failed:', result.error);
        alert('Invalid username or password.');
    }
});

window.onpageshow = function(event) {
    if (event.persisted) { // Check if the page was loaded from cache
        const form = document.getElementById('form');
        form.reset(); // Reset all form fields
    }
};

const passwordField = document.getElementById("password");
        const showPasswordCheckbox = document.getElementById("showPassword");

        // Add event listener to the checkbox
        showPasswordCheckbox.addEventListener("change", function () {
            if (this.checked) {
                // Change input type to text to show the password
                passwordField.type = "text";
            } else {
                // Change input type back to password to hide it
                passwordField.type = "password";
            }
        });