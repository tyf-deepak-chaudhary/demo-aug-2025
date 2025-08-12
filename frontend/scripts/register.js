document.addEventListener('DOMContentLoaded', function () {
    const form = document.getElementById('registerForm');
    const usernameInput = document.getElementById('username');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const message = document.getElementById('message');
    const togglePassword = document.getElementById('togglePassword');
    const eyeIcon = document.getElementById('eyeIcon');

    // Toggle password visibility
    togglePassword.addEventListener('click', function () {
        const isPassword = passwordInput.type === 'password';
        passwordInput.type = isPassword ? 'text' : 'password';
        eyeIcon.setAttribute('fill', isPassword ? '#000' : '#888');
    });

    // Handle form submission
    form.addEventListener('submit', async function (e) {
        e.preventDefault();

        const username = usernameInput.value.trim();
        const email = emailInput.value.trim();
        const password = passwordInput.value.trim();
        message.textContent = '';

        if (!username || !email || !password) {
            message.textContent = 'Please fill in all fields.';
            message.style.color = 'red';
            return;
        }

        try {
            const response = await fetch('http://localhost:8080/api/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, email, password }),
            });

            const data = await response.json();

            if (response.ok) {
                message.style.color = 'green';
                message.textContent = data.message || 'Registration successful!';

                // Redirect to login after short delay
                setTimeout(() => {
                    window.location.href = 'login.html';
                }, 1000);

            } else {
                message.style.color = 'red';
                message.textContent = data.message || 'Registration failed';
            }
        } catch (error) {
            console.error('Registration error:', error);
            message.style.color = 'red';
            message.textContent = 'Something went wrong. Please try again.';
        }
    });
});
