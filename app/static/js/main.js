// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    // Set default date to today
    document.getElementById('date').valueAsDate = new Date();
    
    // Load initial data
    loadTransactions();
    loadSummary();
    
    // Add event listeners
    document.getElementById('transaction-form').addEventListener('submit', handleFormSubmit);
    document.getElementById('category').addEventListener('change', toggleTransportType);
});

// Toggle transport type field visibility
function toggleTransportType() {
    const transportGroup = document.getElementById('transport-type-group');
    const transportType = document.getElementById('transport-type');
    
    if (this.value === 'transport') {
        transportGroup.style.display = '';
        transportType.required = true;
    } else {
        transportGroup.style.display = 'none';
        transportType.required = false;
        transportType.value = '';
    }
}

// Load transactions from the API
async function loadTransactions() {
    try {
        const response = await fetch('/api/transactions');
        const transactions = await response.json();
        displayTransactions(transactions);
    } catch (error) {
        console.error('Error loading transactions:', error);
        showError('Failed to load transactions');
    }
}

// Display transactions in the table
function displayTransactions(transactions) {
    const tableBody = document.getElementById('transactions-table');
    tableBody.innerHTML = '';
    
    if (transactions.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="7" class="text-center">No transactions found</td></tr>';
        return;
    }
    
    transactions.forEach(transaction => {
        const row = document.createElement('tr');
        const amountClass = transaction.type === 'income' ? 'amount-income' : 'amount-expense';
        
        // Format details column
        let details = '';
        if (transaction.category === 'transport' && transaction.transport_type) {
            details = `Transport: ${transaction.transport_type}`;
        }
        
        row.innerHTML = `
            <td>${new Date(transaction.date).toLocaleDateString()}</td>
            <td>${transaction.type}</td>
            <td>${transaction.category}</td>
            <td>${transaction.description}</td>
            <td class="${amountClass}">$${parseFloat(transaction.amount).toFixed(2)}</td>
            <td>${details}</td>
            <td>
                <button class="btn btn-sm btn-danger btn-action" onclick="deleteTransaction(${transaction.id})">
                    Delete
                </button>
            </td>
        `;
        
        tableBody.appendChild(row);
    });
}

// Handle form submission
async function handleFormSubmit(event) {
    event.preventDefault();
    
    const formData = {
        date: document.getElementById('date').value,
        type: document.getElementById('type').value,
        amount: document.getElementById('amount').value,
        category: document.getElementById('category').value,
        description: document.getElementById('description').value
    };
    
    // Add transport type if category is transport
    if (formData.category === 'transport') {
        formData.transport_type = document.getElementById('transport-type').value;
    }
    
    try {
        const response = await fetch('/api/transactions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });
        
        if (response.ok) {
            // Reset form and reload data
            event.target.reset();
            document.getElementById('date').valueAsDate = new Date();
            document.getElementById('transport-type-group').style.display = 'none';
            loadTransactions();
            loadSummary();
        } else {
            const error = await response.json();
            showError(error.message || 'Failed to add transaction');
        }
    } catch (error) {
        console.error('Error adding transaction:', error);
        showError('Failed to add transaction');
    }
}

// Delete a transaction
async function deleteTransaction(id) {
    if (!confirm('Are you sure you want to delete this transaction?')) {
        return;
    }
    
    try {
        const response = await fetch(`/api/transactions/${id}`, {
            method: 'DELETE'
        });
        
        if (response.ok) {
            loadTransactions();
            loadSummary();
        } else {
            const error = await response.json();
            showError(error.message || 'Failed to delete transaction');
        }
    } catch (error) {
        console.error('Error deleting transaction:', error);
        showError('Failed to delete transaction');
    }
}

// Load summary data
async function loadSummary() {
    try {
        const response = await fetch('/api/summary');
        const data = await response.json();
        
        document.getElementById('total-income').textContent = 
            `$${data.total_income.toFixed(2)}`;
        document.getElementById('total-expenses').textContent = 
            `$${data.total_expenses.toFixed(2)}`;
        document.getElementById('balance').textContent = 
            `$${data.balance.toFixed(2)}`;
    } catch (error) {
        console.error('Error loading summary:', error);
        showError('Failed to load summary');
    }
}

// Show error message
function showError(message) {
    alert(message); // You might want to implement a better error display
} 