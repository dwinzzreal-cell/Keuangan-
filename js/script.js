// ============================================
// STATE
// ============================================

let transactions = [];
let currentId = 1;

// ============================================
// DOM REFS
// ============================================

const form = document.getElementById('transactionForm');
const typeSelect = document.getElementById('transactionType');
const amountInput = document.getElementById('transactionAmount');
const categorySelect = document.getElementById('transactionCategory');
const dateInput = document.getElementById('transactionDate');
const descInput = document.getElementById('transactionDesc');
const listContainer = document.getElementById('transactionList');
const totalBalance = document.getElementById('totalBalance');
const totalIncome = document.getElementById('totalIncome');
const totalExpense = document.getElementById('totalExpense');
const filterType = document.getElementById('filterType');
const filterCategory = document.getElementById('filterCategory');
const searchInput = document.getElementById('searchInput');
const clearFilterBtn = document.getElementById('clearFilterBtn');
const transactionCount = document.getElementById('transactionCount');
const exportBtn = document.getElementById('exportBtn');
const clearAllBtn = document.getElementById('clearAllBtn');

// ============================================
// INIT
// ============================================

dateInput.value = new Date().toISOString().split('T')[0];
loadData();

// ============================================
// EVENT LISTENERS
// ============================================

form.addEventListener('submit', addTransaction);
filterType.addEventListener('change', render);
filterCategory.addEventListener('change', render);
searchInput.addEventListener('input', render);
clearFilterBtn.addEventListener('click', resetFilters);
exportBtn.addEventListener('click', exportCSV);
clearAllBtn.addEventListener('click', clearAll);

// ============================================
// DATA MANAGEMENT
// ============================================

function loadData() {
    const saved = localStorage.getItem('transactions');
    if (saved) {
        transactions = JSON.parse(saved);
        currentId = transactions.length > 0
            ? Math.max(...transactions.map(t => t.id)) + 1
            : 1;
    }
    render();
}

function saveData() {
    localStorage.setItem('transactions', JSON.stringify(transactions));
}

// ============================================
// ADD TRANSACTION
// ============================================

function addTransaction(e) {
    e.preventDefault();

    const type = typeSelect.value;
    const amount = parseInt(amountInput.value);
    const category = categorySelect.value;
    const date = dateInput.value;
    const desc = descInput.value.trim();

    if (!amount || amount <= 0) {
        alert('Masukkan jumlah yang valid');
        return;
    }

    const transaction = {
        id: currentId++,
        type: type,
        amount: amount,
        category: category,
        date: date,
        desc: desc || ''
    };

    transactions.push(transaction);
    render();
    saveData();

    form.reset();
    dateInput.value = new Date().toISOString().split('T')[0];
    amountInput.focus();
}

// ============================================
// DELETE TRANSACTION
// ============================================

function deleteTransaction(id) {
    if (confirm('Hapus transaksi ini?')) {
        transactions = transactions.filter(t => t.id !== id);
        render();
        saveData();
    }
}

// ============================================
// CLEAR ALL
// ============================================

function clearAll() {
    if (transactions.length === 0) return;
    if (confirm('Hapus semua transaksi?')) {
        transactions = [];
        currentId = 1;
        render();
        saveData();
    }
}

// ============================================
// FILTER LOGIC
// ============================================

function getFilteredTransactions() {
    let filtered = [...transactions];

    const type = filterType.value;
    const category = filterCategory.value;
    const search = searchInput.value.toLowerCase().trim();

    if (type !== 'all') {
        filtered = filtered.filter(t => t.type === type);
    }

    if (category !== 'all') {
        filtered = filtered.filter(t => t.category === category);
    }

    if (search) {
        filtered = filtered.filter(t =>
            (t.desc && t.desc.toLowerCase().includes(search)) ||
            getCategoryLabel(t.category).toLowerCase().includes(search)
        );
    }

    filtered.sort((a, b) => new Date(b.date) - new Date(a.date));

    return filtered;
}

function resetFilters() {
    filterType.value = 'all';
    filterCategory.value = 'all';
    searchInput.value = '';
    render();
}

// ============================================
// RENDER
// ============================================

function render() {
    const filtered = getFilteredTransactions();
    transactionCount.textContent = filtered.length + ' transaksi';
    updateStats();

    if (filtered.length === 0) {
        listContainer.innerHTML = `
            <div class="empty-state">
                <span class="empty-icon">+</span>
                <p class="empty-text">Tidak ada transaksi</p>
                <p class="empty-sub">${transactions.length === 0 ? 'Tambahkan transaksi pertama Anda' : 'Coba ubah filter'}</p>
            </div>
        `;
        return;
    }

    listContainer.innerHTML = filtered.map(t => `
        <div class="transaction-item ${t.type}" data-id="${t.id}">
            <div class="transaction-left">
                <span class="transaction-icon">${getIcon(t.category)}</span>
                <div class="transaction-info">
                    <span class="transaction-category">${getCategoryLabel(t.category)}</span>
                    <span class="transaction-desc">${t.desc || '-'}</span>
                    <span class="transaction-date">${formatDate(t.date)}</span>
                </div>
            </div>
            <div class="transaction-right">
                <span class="transaction-amount ${t.type}">
                    ${t.type === 'income' ? '+' : '-'} ${formatRupiah(t.amount)}
                </span>
                <button class="transaction-delete" data-id="${t.id}" title="Hapus">×</button>
            </div>
        </div>
    `).join('');

    document.querySelectorAll('.transaction-delete').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.stopPropagation();
            deleteTransaction(parseInt(this.dataset.id));
        });
    });

    saveData();
}

// ============================================
// UPDATE STATS
// ============================================

function updateStats() {
    const totalInc = transactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);

    const totalExp = transactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);

    const balance = totalInc - totalExp;

    totalIncome.textContent = formatRupiah(totalInc);
    totalExpense.textContent = formatRupiah(totalExp);
    totalBalance.textContent = formatRupiah(balance);
    totalBalance.style.color = balance >= 0 ? '#00e676' : '#ff1744';
}

// ============================================
// HELPERS
// ============================================

function formatRupiah(amount) {
    return 'Rp ' + amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

function formatDate(dateStr) {
    const date = new Date(dateStr);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    return date.getDate() + ' ' + months[date.getMonth()] + ' ' + date.getFullYear();
}

function getCategoryLabel(category) {
    const labels = {
        'gaji': 'Gaji',
        'bonus': 'Bonus',
        'investasi': 'Investasi',
        'lainnya-income': 'Lainnya (Income)',
        'makanan': 'Makanan',
        'transportasi': 'Transportasi',
        'tagihan': 'Tagihan',
        'belanja': 'Belanja',
        'hiburan': 'Hiburan',
        'kesehatan': 'Kesehatan',
        'pendidikan': 'Pendidikan',
        'lainnya-expense': 'Lainnya (Expense)'
    };
    return labels[category] || category;
}

function getIcon(category) {
    const icons = {
        'gaji': '💼',
        'bonus': '🎯',
        'investasi': '📈',
        'lainnya-income': '💰',
        'makanan': '🍽️',
        'transportasi': '🚗',
        'tagihan': '📋',
        'belanja': '🛍️',
        'hiburan': '🎮',
        'kesehatan': '🏥',
        'pendidikan': '📚',
        'lainnya-expense': '💸'
    };
    return icons[category] || '📌';
}

// ============================================
// EXPORT CSV
// ============================================

function exportCSV() {
    if (transactions.length === 0) {
        alert('Tidak ada data untuk diexport');
        return;
    }

    const headers = ['ID', 'Jenis', 'Kategori', 'Jumlah', 'Tanggal', 'Deskripsi'];
    const rows = transactions.map(t => [
        t.id,
        t.type === 'income' ? 'Pemasukan' : 'Pengeluaran',
        getCategoryLabel(t.category),
        t.amount,
        t.date,
        t.desc || ''
    ]);

    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'transactions_' + new Date().toISOString().split('T')[0] + '.csv';
    link.click();
    URL.revokeObjectURL(link.href);
}
