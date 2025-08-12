// scripts/notifications.js

function showToast(message, type = 'error') {
    // Remove any existing toasts
    const existingToast = document.querySelector('.toast');
    if (existingToast) {
        existingToast.remove();
    }

    // Create the toast element
    const toast = document.createElement('div');
    toast.className = `toast ${type}`; // e.g., 'toast error'
    toast.textContent = message;

    document.body.appendChild(toast);

    // Animate it in
    setTimeout(() => {
        toast.classList.add('show');
    }, 100); // Small delay to trigger transition

    // Automatically remove after 3 seconds
    setTimeout(() => {
        toast.classList.remove('show');
        // Remove from DOM after transition ends
        toast.addEventListener('transitionend', () => toast.remove());
    }, 3000);
}