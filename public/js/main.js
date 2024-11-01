document.addEventListener('DOMContentLoaded', () => {
    const themeToggle = document.getElementById('theme-toggle');
    const connectWallet = document.getElementById('connect-wallet');

    // Theme toggle functionality
    themeToggle.addEventListener('click', () => {
        document.body.classList.toggle('light-mode');
        themeToggle.textContent = document.body.classList.contains('light-mode') ? '🌙' : '☀️';
    });

    // Connect wallet functionality (placeholder)
    connectWallet.addEventListener('click', () => {
        alert('Wallet connection feature coming soon!');
    });

    // Fetch and display latest block number
    fetchLatestBlock();

    // Fetch and display latest blocks
    fetchLatestBlocks();

    // Fetch and display latest transactions
    fetchLatestTransactions();
});

async function fetchLatestBlock() {
    try {
        const response = await fetch('/api/latest-block');
        const data = await response.json();
        document.getElementById('latest-block').textContent = data.blockNumber;
    } catch (error) {
        console.error('Error fetching latest block:', error);
    }
}

async function fetchLatestBlocks() {
    try {
        const response = await fetch('/api/latest-blocks');
        const blocks = await response.json();
        const tbody = document.querySelector('#blocks-table tbody');
        tbody.innerHTML = '';
        blocks.forEach(block => {
            const row = `
                <tr>
                    <td>${block.number}</td>
                    <td>${formatAge(block.timestamp)}</td>
                    <td>${block.transactions.length}</td>
                    <td>${block.miner}</td>
                </tr>
            `;
            tbody.innerHTML += row;
        });
    } catch (error) {
        console.error('Error fetching latest blocks:', error);
    }
}

async function fetchLatestTransactions() {
    try {
        const response = await fetch('/api/latest-transactions');
        const transactions = await response.json();
        const tbody = document.querySelector('#transactions-table tbody');
        tbody.innerHTML = '';
        transactions.forEach(tx => {
            const row = `
                <tr>
                    <td>${tx.hash.substr(0, 10)}...</td>
                    <td>${formatAge(tx.timestamp)}</td>
                    <td>${tx.from.substr(0, 10)}...</td>
                    <td>${tx.to.substr(0, 10)}...</td>
                    <td>${tx.value} 3DOT</td>
                </tr>
            `;
            tbody.innerHTML += row;
        });
    } catch (error) {
        console.error('Error fetching latest transactions:', error);
    }
}

function formatAge(timestamp) {
    const now = Date.now() / 1000;
    const diff = now - timestamp;
    if (diff < 60) return `${Math.floor(diff)} secs ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)} mins ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} hours ago`;
    return `${Math.floor(diff / 86400)} days ago`;
}
