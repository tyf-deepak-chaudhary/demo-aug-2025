document.addEventListener('DOMContentLoaded', function () {
    const form = document.getElementById('loginForm');
    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');
    const message = document.getElementById('message');
    const togglePassword = document.getElementById('togglePassword');
    const eyeIcon = document.getElementById('eyeIcon');

    // Toggle password visibility
    togglePassword.addEventListener('click', function () {
        const isPassword = passwordInput.getAttribute('type') === 'password';
        passwordInput.setAttribute('type', isPassword ? 'text' : 'password');
        eyeIcon.setAttribute('fill', isPassword ? '#000' : '#888');
    });

    // Handle form submission
    form.addEventListener('submit', async function (e) {
        e.preventDefault();

        const username = usernameInput.value.trim();
        const password = passwordInput.value.trim();
        message.textContent = '';

        if (!username || !password) {
            message.textContent = 'Please fill in both fields.';
            message.style.color = 'red';
            return;
        }

        try {
            const response = await fetch('http://localhost:8080/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, password }),
            });

            const data = await response.json();

            if (response.ok) {
                message.style.color = 'green';
                message.textContent = data.message || 'Login successful!';

                // Store userId in localStorage (optional)
                localStorage.setItem('userId', data.userId);

                // Redirect to dashboard or homepage after successful login
                setTimeout(() => {
                    window.location.href = '/dashboard.html'; // Update this path as needed
                }, 1000);

            } else {
                message.style.color = 'red';
                message.textContent = data.message || 'Login failed';
            }
        } catch (error) {
            console.error('Login error:', error);
            message.style.color = 'red';
            message.textContent = 'Something went wrong. Please try again.';
        }
    });
});
