document.addEventListener('DOMContentLoaded', () => {
    const API_BASE_URL = 'http://localhost:8080/api';
    let currentUserId = null;
    let accountToDelete = null;

    // DOM Elements
    const welcomeMessage = document.getElementById('welcomeMessage');
    const totalAccountsEl = document.getElementById('totalAccounts');
    const createAccountForm = document.getElementById('createAccountForm');
    const accountsList = document.getElementById('accountsList');
    const noAccountsMessage = document.getElementById('noAccountsMessage');
    const logoutBtn = document.getElementById('logoutBtn');
    const toast = document.getElementById('toast');
    const deleteModal = document.getElementById('deleteModal');
    const confirmDeleteBtn = document.getElementById('confirmDelete');
    const cancelDeleteBtn = document.getElementById('cancelDelete');

    init();

    function init() {
        currentUserId = localStorage.getItem('userId');
        const username = localStorage.getItem('username');

        if (!currentUserId) {
            window.location.href = 'login.html';
            return;
        }

        if (username) {
            welcomeMessage.textContent = `Welcome, ${username}!`;
        }

        updateSummary(0);
        loadUserAccounts();
        setupEventListeners();
    }

    function setupEventListeners() {
        createAccountForm.addEventListener('submit', handleCreateAccount);
        logoutBtn.addEventListener('click', handleLogout);
        confirmDeleteBtn.addEventListener('click', handleConfirmDelete);
        cancelDeleteBtn.addEventListener('click', hideDeleteModal);
        deleteModal.addEventListener('click', (e) => {
            if (e.target === deleteModal) hideDeleteModal();
        });
        accountsList.addEventListener('click', handleAccountAction);
    }

    async function loadUserAccounts() {
        try {
            const response = await fetch(`${API_BASE_URL}/accounts/user/${currentUserId}`);
            if (response.ok) {
                const accounts = await response.json();
                displayAccounts(accounts);
                updateSummary(accounts.length);
            } else {
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
                <div class="account-balance-view">
                    <div class="balance-view-container" data-account-id="${account.id}">
                        <button class="view-balance-btn">View Balance</button>
                    </div>
                </div>
                <div class="account-actions">
                    <button class="delete-account-btn" data-account-id="${account.id}" title="Delete Account">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `).join('');
    }

    function updateSummary(totalAccounts) {
        totalAccountsEl.textContent = totalAccounts;
        const totalBalanceCard = document.getElementById('totalBalanceEl');
        if (totalBalanceCard) {
            totalBalanceCard.closest('.summary-card').style.display = 'none';
        }
    }

    // --- MODIFIED: handleCreateAccount now sends the account PIN ---
    async function handleCreateAccount(event) {
        event.preventDefault();

        const formData = new FormData(createAccountForm);
        const accountData = {
            accountName: formData.get('accountName').trim(),
            accountType: formData.get('accountType'),
            initialBalance: parseFloat(formData.get('initialBalance')),
            // --- Get the new PIN from the form ---
            // IMPORTANT: You must add an input with name="accountPin" to your HTML form
            pin: formData.get('accountPin')
        };

        if (!accountData.accountName || !accountData.accountType || isNaN(accountData.initialBalance) || accountData.initialBalance < 0) {
            showToast('Please fill in all fields correctly', 'error');
            return;
        }

        // --- Add client-side validation for the PIN ---
        if (!accountData.pin || !/^\d{4}$/.test(accountData.pin)) {
            showToast('You must set a valid 4-digit PIN for the account.', 'error');
            return;
        }

        try {
            const response = await fetch(`${API_BASE_URL}/accounts/create/${currentUserId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(accountData) // The pin is now included
            });

            const result = await response.json();

            if (response.ok) {
                showToast('Account created successfully!', 'success');
                createAccountForm.reset();
                loadUserAccounts();
            } else {
                showToast(result.message || 'Failed to create account', 'error');
            }
        } catch (error) {
            console.error('Error creating account:', error);
            showToast('Error creating account', 'error');
        }
    }

    function handleAccountAction(event) {
        const target = event.target;

        if (target.matches('.view-balance-btn')) {
            const container = target.closest('.balance-view-container');
            showPinInput(container);
        }

        if (target.matches('.submit-pin-btn')) {
            const container = target.closest('.balance-view-container');
            const accountId = container.dataset.accountId;
            const pinInput = container.querySelector('.pin-input');
            verifyPinAndShowBalance(accountId, pinInput.value);
        }

        if(target.matches('.hide-balance-btn')){
            const container = target.closest('.balance-view-container');
            hideBalance(container);
        }

        if (target.closest('.delete-account-btn')) {
            const accountId = target.closest('.delete-account-btn').dataset.accountId;
            showDeleteModal(accountId);
        }
    }

    function showPinInput(container) {
        container.innerHTML = `
            <div class="pin-entry">
                <input type="password" class="pin-input" placeholder="Enter PIN" maxlength="4" />
                <button class="submit-pin-btn">Go</button>
            </div>
        `;
        container.querySelector('.pin-input').focus();
    }

    function hideBalance(container) {
        container.innerHTML = `<button class="view-balance-btn">View Balance</button>`;
    }

    async function verifyPinAndShowBalance(accountId, pin) {
        if (!pin || pin.length < 4) {
            showToast('Please enter a valid 4-digit PIN', 'error');
            return;
        }

        try {
            const response = await fetch(`${API_BASE_URL}/accounts/${accountId}/balance`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ pin })
            });

            const result = await response.json();
            const container = document.querySelector(`.balance-view-container[data-account-id='${accountId}']`);

            if (response.ok) {
                container.innerHTML = `
                    <p class="account-balance">$${parseFloat(result.balance).toFixed(2)}</p>
                    <button class="hide-balance-btn">Hide</button>
                `;
            } else {
                showToast(result.message || 'Invalid PIN', 'error');
                showPinInput(container);
            }
        } catch (error) {
            showToast('Error verifying PIN', 'error');
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

            if (response.ok) {
                showToast('Account deleted successfully!', 'success');
                loadUserAccounts();
            } else {
                const result = await response.json();
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
        localStorage.removeItem('userId');
        localStorage.removeItem('username');
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
        setTimeout(() => toast.classList.remove('show'), 3000);
    }
});