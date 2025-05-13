// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    // Set default date to today
    document.getElementById('date').valueAsDate = new Date();
    
    loadDashboard();
    
    // Add event listeners
    document.getElementById('toggle-income-chart').addEventListener('click', toggleIncomeChart);
    document.getElementById('transaction-form').addEventListener('submit', handleFormSubmit);
    document.getElementById('category').addEventListener('change', toggleTransportType);
});

let incomeChart = null;

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

// Toggle income chart visibility
function toggleIncomeChart() {
    const container = document.getElementById('income-chart-container');
    const button = document.getElementById('toggle-income-chart');
    
    if (container.style.display === 'none') {
        container.style.display = 'block';
        button.textContent = 'Hide Chart';
        if (!incomeChart) {
            // Recreate the chart if it doesn't exist
            loadDashboard();
        }
    } else {
        container.style.display = 'none';
        button.textContent = 'Show Chart';
    }
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
    
    const editId = event.target.dataset.editId;
    const method = editId ? 'PUT' : 'POST';
    const url = editId ? `/api/transactions/${editId}` : '/api/transactions';
    
    try {
        const response = await fetch(url, {
            method: method,
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
            
            // Reset the form button
            const submitButton = event.target.querySelector('button[type="submit"]');
            submitButton.textContent = 'Add Transaction';
            submitButton.classList.remove('btn-warning');
            submitButton.classList.add('btn-primary');
            delete event.target.dataset.editId;
            
            loadDashboard();
        } else {
            const error = await response.json();
            showError(error.message || 'Failed to save transaction');
        }
    } catch (error) {
        console.error('Error saving transaction:', error);
        showError('Failed to save transaction');
    }
}

// Load all dashboard data
async function loadDashboard() {
    try {
        const [summary, transactions] = await Promise.all([
            fetch('/api/summary').then(res => res.json()),
            fetch('/api/transactions').then(res => res.json())
        ]);
        
        updateSummary(summary);
        updateCharts(transactions);
        displayRecentTransactions(transactions);
    } catch (error) {
        console.error('Error loading dashboard:', error);
        showError('Failed to load dashboard data');
    }
}

// Update summary cards
function updateSummary(summary) {
    document.getElementById('total-income').textContent = 
        `$${summary.total_income.toFixed(2)}`;
    document.getElementById('total-expenses').textContent = 
        `$${summary.total_expenses.toFixed(2)}`;
    document.getElementById('balance').textContent = 
        `$${summary.balance.toFixed(2)}`;
}

// Update charts
function updateCharts(transactions) {
    // Prepare data for charts
    const expensesByCategory = {};
    const incomeByCategory = {};
    
    transactions.forEach(transaction => {
        const amount = parseFloat(transaction.amount);
        if (transaction.type === 'expense') {
            // For transport category, include transport type in the label
            const category = transaction.category === 'transport' 
                ? `${transaction.category} (${transaction.transport_type})`
                : transaction.category;
            expensesByCategory[category] = (expensesByCategory[category] || 0) + amount;
        } else {
            incomeByCategory[transaction.category] = (incomeByCategory[transaction.category] || 0) + amount;
        }
    });
    
    // Destroy existing chart if it exists
    const expensesChartElement = document.getElementById('expenses-chart');
    if (window.expensesChart) {
        window.expensesChart.destroy();
    }
    
    // Create expenses bar chart
    window.expensesChart = new Chart(expensesChartElement, {
        type: 'bar',
        data: {
            labels: Object.keys(expensesByCategory),
            datasets: [{
                label: 'Expenses by Category',
                data: Object.values(expensesByCategory),
                backgroundColor: [
                    '#FF6384',
                    '#36A2EB',
                    '#FFCE56',
                    '#4BC0C0',
                    '#9966FF',
                    '#FF9F40'
                ]
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return '$' + value.toFixed(2);
                        }
                    }
                }
            }
        }
    });
    
    // Create income pie chart (only if container is visible)
    const incomeContainer = document.getElementById('income-chart-container');
    if (incomeContainer.style.display !== 'none') {
        if (incomeChart) {
            incomeChart.destroy();
        }
        
        incomeChart = new Chart(document.getElementById('income-chart'), {
            type: 'pie',
            data: {
                labels: Object.keys(incomeByCategory),
                datasets: [{
                    data: Object.values(incomeByCategory),
                    backgroundColor: [
                        '#4BC0C0',
                        '#36A2EB',
                        '#FFCE56',
                        '#FF6384',
                        '#9966FF',
                        '#FF9F40'
                    ]
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'right'
                    }
                }
            }
        });
    }
}

// Display recent transactions
function displayRecentTransactions(transactions) {
    const tableBody = document.getElementById('recent-transactions');
    tableBody.innerHTML = '';
    
    // Sort by date and get the 5 most recent transactions
    const recent = transactions
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, 5);
    
    if (recent.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="6" class="text-center">No transactions found</td></tr>';
        return;
    }
    
    recent.forEach(transaction => {
        const row = document.createElement('tr');
        const amountClass = transaction.type === 'income' ? 'amount-income' : 'amount-expense';
        
        row.innerHTML = `
            <td>${new Date(transaction.date).toLocaleDateString()}</td>
            <td>${transaction.type}</td>
            <td>${transaction.category}</td>
            <td>${transaction.description}</td>
            <td class="${amountClass}">$${parseFloat(transaction.amount).toFixed(2)}</td>
            <td>
                <button class="btn btn-sm btn-primary btn-action me-1" onclick="editTransaction(${transaction.id})">
                    Edit
                </button>
                <button class="btn btn-sm btn-danger btn-action" onclick="deleteTransaction(${transaction.id})">
                    Delete
                </button>
            </td>
        `;
        
        tableBody.appendChild(row);
    });
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
            loadDashboard();
        } else {
            const error = await response.json();
            showError(error.message || 'Failed to delete transaction');
        }
    } catch (error) {
        console.error('Error deleting transaction:', error);
        showError('Failed to delete transaction');
    }
}

// Edit a transaction
async function editTransaction(id) {
    try {
        const response = await fetch(`/api/transactions/${id}`);
        if (!response.ok) {
            throw new Error('Failed to fetch transaction');
        }
        
        const transaction = await response.json();
        
        // Populate the form with transaction data
        document.getElementById('date').value = transaction.date.split('T')[0];
        document.getElementById('type').value = transaction.type;
        document.getElementById('amount').value = transaction.amount;
        document.getElementById('category').value = transaction.category;
        document.getElementById('description').value = transaction.description;
        
        // Handle transport type if applicable
        const transportGroup = document.getElementById('transport-type-group');
        const transportType = document.getElementById('transport-type');
        if (transaction.category === 'transport') {
            transportGroup.style.display = '';
            transportType.required = true;
            transportType.value = transaction.transport_type;
        } else {
            transportGroup.style.display = 'none';
            transportType.required = false;
            transportType.value = '';
        }
        
        // Change form submit button to update
        const submitButton = document.querySelector('#transaction-form button[type="submit"]');
        submitButton.textContent = 'Update Transaction';
        submitButton.classList.remove('btn-primary');
        submitButton.classList.add('btn-warning');
        
        // Store the transaction ID for the update
        document.getElementById('transaction-form').dataset.editId = id;
        
        // Scroll to the form
        document.getElementById('transaction-form').scrollIntoView({ behavior: 'smooth' });
    } catch (error) {
        console.error('Error fetching transaction:', error);
        showError('Failed to load transaction for editing');
    }
}

// Show error message
function showError(message) {
    alert(message); // You might want to implement a better error display
} 