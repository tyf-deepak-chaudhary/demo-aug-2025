document.addEventListener('DOMContentLoaded', () => {
    const API_BASE_URL = 'http://localhost:8080/api';
    let currentUserId = null;
    let accountToDelete = null;

    // DOM Elements
    const welcomeMessage = document.getElementById('welcomeMessage');
    const totalAccountsEl = document.getElementById('totalAccounts');
    const totalBalanceEl = document.getElementById('totalBalance');
    const createAccountForm = document.getElementById('createAccountForm');
    const accountsList = document.getElementById('accountsList');
    const noAccountsMessage = document.getElementById('noAccountsMessage');
    const logoutBtn = document.getElementById('logoutBtn');
    const toast = document.getElementById('toast');
    const deleteModal = document.getElementById('deleteModal');
    const confirmDeleteBtn = document.getElementById('confirmDelete');
    const cancelDeleteBtn = document.getElementById('cancelDelete');

    // Initialize dashboard
    init();

    function init() {
        // Get user ID from localStorage (set during login)
        currentUserId = localStorage.getItem('userId');
        const username = localStorage.getItem('username');

        if (!currentUserId) {
            // Redirect to login if no user ID found
            window.location.href = 'login.html';
            return;
        }

        // Update welcome message
        if (username) {
            welcomeMessage.textContent = `Welcome, ${username}!`;
        }

        // Load user accounts
        loadUserAccounts();

        // Set up event listeners
        setupEventListeners();
    }

    function setupEventListeners() {
        // Create account form submission
        createAccountForm.addEventListener('submit', handleCreateAccount);

        // Logout button
        logoutBtn.addEventListener('click', handleLogout);

        // Modal event listeners
        confirmDeleteBtn.addEventListener('click', handleConfirmDelete);
        cancelDeleteBtn.addEventListener('click', hideDeleteModal);
        deleteModal.addEventListener('click', (e) => {
            if (e.target === deleteModal) {
                hideDeleteModal();
            }
        });
    }

    async function loadUserAccounts() {
        try {
            const response = await fetch(`${API_BASE_URL}/accounts/user/${currentUserId}`);
            
            if (response.ok) {
                const accounts = await response.json();
                displayAccounts(accounts);
                updateSummary(accounts);
            } else {
                console.error('Failed to load accounts');
                showToast('Failed to load accounts', 'error');
            }
        } catch (error) {
            console.error('Error loading accounts:', error);
            showToast('Error loading accounts', 'error');
        }
    }

    function displayAccounts(accounts) {
        if (accounts.length === 0) {
            accountsList.style.display = 'none';
            noAccountsMessage.style.display = 'block';
            return;
        }

        accountsList.style.display = 'block';
        noAccountsMessage.style.display = 'none';

        accountsList.innerHTML = accounts.map(account => `
            <div class="account-card" data-account-id="${account.id}">
                <div class="account-icon ${account.accountType.toLowerCase()}">
                    <i class="fas ${getAccountIcon(account.accountType)}"></i>
                </div>
                <div class="account-details">
                    <h3>${account.accountName}</h3>
                    <p>${account.accountType} Account</p>
                    <p>Account #: ${account.accountNumber}</p>
                    <p>Created: ${formatDate(account.createdAt)}</p>
                </div>
                <div class="account-balance">
                    $${parseFloat(account.balance).toFixed(2)}
                </div>
                <div class="account-actions">
                    <button class="delete-account-btn" onclick="showDeleteModal(${account.id})" title="Delete Account">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `).join('');
    }

    function updateSummary(accounts) {
        const totalAccounts = accounts.length;
        const totalBalance = accounts.reduce((sum, account) => sum + parseFloat(account.balance), 0);

        totalAccountsEl.textContent = totalAccounts;
        totalBalanceEl.textContent = `$${totalBalance.toFixed(2)}`;
    }

    async function handleCreateAccount(event) {
        event.preventDefault();

        const formData = new FormData(createAccountForm);
        const accountData = {
            accountName: formData.get('accountName').trim(),
            accountType: formData.get('accountType'),
            initialBalance: parseFloat(formData.get('initialBalance'))
        };

        // Validate form data
        if (!accountData.accountName || !accountData.accountType || accountData.initialBalance < 0) {
            showToast('Please fill in all fields correctly', 'error');
            return;
        }

        try {
            const response = await fetch(`${API_BASE_URL}/accounts/create/${currentUserId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(accountData)
            });

            const result = await response.json();

            if (response.ok) {
                showToast('Account created successfully!', 'success');
                createAccountForm.reset();
                loadUserAccounts(); // Reload accounts
            } else {
                showToast(result.message || 'Failed to create account', 'error');
            }
        } catch (error) {
            console.error('Error creating account:', error);
            showToast('Error creating account', 'error');
        }
    }

    function showDeleteModal(accountId) {
        accountToDelete = accountId;
        deleteModal.classList.add('show');
    }

    function hideDeleteModal() {
        accountToDelete = null;
        deleteModal.classList.remove('show');
    }

    async function handleConfirmDelete() {
        if (!accountToDelete) return;

        try {
            const response = await fetch(`${API_BASE_URL}/accounts/${accountToDelete}`, {
                method: 'DELETE'
            });

            const result = await response.json();

            if (response.ok) {
                showToast('Account deleted successfully!', 'success');
                loadUserAccounts(); // Reload accounts
            } else {
                showToast(result.message || 'Failed to delete account', 'error');
            }
        } catch (error) {
            console.error('Error deleting account:', error);
            showToast('Error deleting account', 'error');
        } finally {
            hideDeleteModal();
        }
    }

    function handleLogout() {
        // Clear stored user data
        localStorage.removeItem('userId');
        localStorage.removeItem('username');
        
        // Redirect to login page
        window.location.href = 'login.html';
    }

    function getAccountIcon(accountType) {
        const icons = {
            'SAVINGS': 'fa-piggy-bank',
            'CHECKING': 'fa-money-check',
            'CREDIT': 'fa-credit-card',
            'INVESTMENT': 'fa-chart-line'
        };
        return icons[accountType] || 'fa-wallet';
    }

    function formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }

    function showToast(message, type = 'info') {
        toast.textContent = message;
        toast.className = `toast ${type}`;
        toast.classList.add('show');

        setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
    }

    // Make showDeleteModal globally accessible for inline onclick handlers
    window.showDeleteModal = showDeleteModal;
});
