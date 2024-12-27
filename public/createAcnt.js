const createAcntForm = document.querySelector('createAcnt');
createAcnt.addEventListener('submit', async (event) => {
    event.preventDefault(); // Prevent the default form submission
    
    const username = document.querySelector('input[name="username"]').value;
    const password = document.querySelector('input[name="password"]').value;

    const response = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
    });
            
    const result = await response.json();
    if (result.success) {
        localStorage.setItem('token', result.token);
        window.location.href = '/home.html'; // Redirect on success
    } 
});

function checkPasswordStrength() {
    const password = document.getElementById('password').value;
    const strengthMessage = document.getElementById('strengthMessage');

    // Password strength criteria
    const lengthCheck = password.length >= 8;
    const uppercaseCheck = /[A-Z]/.test(password);
    const lowercaseCheck = /[a-z]/.test(password);
    const digitCheck = /\d/.test(password);
    const specialCharCheck = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    // Determine strength
    if (!lengthCheck) {
        strengthMessage.textContent = "Password must be at least 8 characters long.";
        strengthMessage.className = "strength weak";
    } else if (!uppercaseCheck) {
        strengthMessage.textContent = "Password must include at least one uppercase letter.";
        strengthMessage.className = "strength weak";
    } else if (!lowercaseCheck) {
        strengthMessage.textContent = "Password must include at least one lowercase letter.";
        strengthMessage.className = "strength weak";
    } else if (!digitCheck) {
        strengthMessage.textContent = "Password must include at least one number.";
        strengthMessage.className = "strength weak";
    } else if (!specialCharCheck) {
        strengthMessage.textContent = "Password must include at least one special character.";
        strengthMessage.className = "strength weak";
    } else if (lengthCheck && uppercaseCheck && lowercaseCheck && digitCheck && specialCharCheck) {
        strengthMessage.textContent = "Strong Password";
        strengthMessage.className = "strength strong";
    } else {
        strengthMessage.textContent = "Moderate password.";
        strengthMessage.className = "strength moderate";
    }
}

function checkMatchingPasswords() {
    const pass = document.getElementById('password').value;
    const confirm = document.getElementById('confirmPassword').value;
    const message = document.getElementById('confirmMessage')

    if (pass != confirm) {
        message.textContent = "Passwords do not match";
        message.className = "not match"
    } else if (pass == confirm) {
        message.textContent = "Passwords match";
        message.className = "match";
    }
}