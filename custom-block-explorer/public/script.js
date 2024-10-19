// Dark mode toggle
const darkModeToggle = document.getElementById('darkModeToggle');
const body = document.body;

// Check for saved dark mode preference
if (localStorage.getItem('darkMode') === 'enabled') {
    body.classList.add('dark-mode');
    updateToggleButton(true);
}

darkModeToggle.addEventListener('click', function() {
    if (body.classList.contains('dark-mode')) {
        body.classList.remove('dark-mode');
        localStorage.setItem('darkMode', 'disabled');
        updateToggleButton(false);
    } else {
        body.classList.add('dark-mode');
        localStorage.setItem('darkMode', 'enabled');
        updateToggleButton(true);
    }
});

function updateToggleButton(isDarkMode) {
    const icon = darkModeToggle.querySelector('i');
    if (isDarkMode) {
        icon.classList.remove('fa-moon');
        icon.classList.add('fa-sun');
    } else {
        icon.classList.remove('fa-sun');
        icon.classList.add('fa-moon');
    }
}

// Network adding functionality
const addMainnet = document.getElementById('addMainnet');
const addTestnet = document.getElementById('addTestnet');

async function addNetwork(networkDetails) {
    console.log('Attempting to add network:', networkDetails);
    if (typeof window.ethereum !== 'undefined') {
        try {
            await window.ethereum.request({
                method: 'wallet_addEthereumChain',
                params: [networkDetails],
            });
            console.log('Network added successfully');
        } catch (error) {
            console.error('Failed to add network:', error);
        }
    } else {
        console.error('MetaMask is not installed');
    }
}

addMainnet.addEventListener('click', () => {
    console.log('Add Mainnet button clicked');
    const mainnetDetails = {
        chainId: '0x60A', // 1546 in hexadecimal
        chainName: 'Dot Protocol',
        nativeCurrency: {
            name: '3DOT',
            symbol: '3DOT',
            decimals: 18
        },
        rpcUrls: ['http://54.92.173.128:8545'],
        blockExplorerUrls: ['https://dotprotocolscan.com']
    };
    setTimeout(() => {
        addNetwork(mainnetDetails);
    }, 100);
});

addTestnet.addEventListener('click', () => {
    console.log('Add Testnet button clicked');
    const testnetDetails = {
        chainId: '0x609', // 1545 in hexadecimal
        chainName: 'Chennai Testnet',
        nativeCurrency: {
            name: 'TDOT',
            symbol: 'TDOT',
            decimals: 18
        },
        rpcUrls: ['http://3.82.11.145:8545'],
        blockExplorerUrls: ['https://chennai.dotprotocolscan.com']
    };
    setTimeout(() => {
        addNetwork(testnetDetails);
    }, 100);
});

// Check if the buttons exist and add event listeners
document.addEventListener('DOMContentLoaded', () => {
    const addMainnetBtn = document.getElementById('addMainnet');
    const addTestnetBtn = document.getElementById('addTestnet');

    if (addMainnetBtn) {
        addMainnetBtn.addEventListener('click', () => {
            console.log('Add Mainnet button clicked');
            // ... (rest of the mainnet code)
        });
    } else {
        console.error('Add Mainnet button not found');
    }

    if (addTestnetBtn) {
        addTestnetBtn.addEventListener('click', () => {
            console.log('Add Testnet button clicked');
            // ... (rest of the testnet code)
        });
    } else {
        console.error('Add Testnet button not found');
    }
});
