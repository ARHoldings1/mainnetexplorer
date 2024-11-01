const { Web3 } = require('web3');
const web3 = new Web3(process.env.RPC_URL);

exports.getHomePage = async (req, res) => {
    try {
        const latestBlockNumber = await web3.eth.getBlockNumber();
        const latestBlocks = await getLatestBlocks(latestBlockNumber, 10);
        const latestTransactions = await getLatestTransactions(latestBlocks);

        res.render('index', {
            title: 'Dot Protocol Explorer',
            latestBlocks,
            latestTransactions,
            web3: web3,
            user: res.locals.user // Add this line
        });
    } catch (error) {
        console.error('Error fetching data:', error);
        res.render('index', { 
            title: 'Error', 
            error: 'Error fetching blockchain data',
            user: res.locals.user // Add this line
        });
    }
};

exports.getAllBlocks = async (req, res) => {
    try {
        const latestBlockNumber = await web3.eth.getBlockNumber();
        const blocks = await getLatestBlocks(latestBlockNumber, 50); // Fetch 50 latest blocks
        res.render('blocks', { title: 'All Blocks', blocks, web3 });
    } catch (error) {
        console.error('Error fetching blocks:', error);
        res.render('error', { title: 'Error', error: 'Error fetching blocks' });
    }
};

exports.getBlockDetails = async (req, res) => {
    try {
        const blockNumber = req.params.blockNumber;
        const block = await web3.eth.getBlock(blockNumber, true);
        const transactions = await Promise.all(block.transactions.map(async (tx) => {
            return await web3.eth.getTransaction(tx);
        }));
        res.render('block', { title: `Block #${blockNumber}`, block, transactions, web3 });
    } catch (error) {
        console.error('Error fetching block details:', error);
        res.render('error', { title: 'Error', error: 'Error fetching block details' });
    }
};

exports.getAddressDetails = async (req, res) => {
    try {
        const address = req.params.address;
        const balance = await web3.eth.getBalance(address);
        const code = await web3.eth.getCode(address);
        const isContract = code !== '0x';
        
        let contractInfo = null;
        if (isContract) {
            // If it's a contract, fetch additional information
            contractInfo = {
                name: '3DOT Token',
                symbol: '3DOT',
                totalSupply: '1,000,000,000,000,000,000', // 1 trillion tokens
                decimals: 18,
                sourceCode: `
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./IPriceOracle.sol";

contract ThreeDOTToken is ERC20, ERC20Burnable, Pausable, Ownable {
    using SafeMath for uint256;

    uint256 private constant INITIAL_SUPPLY = 1_000_000_000_000 * 10**18; // 1 trillion tokens
    uint256 private _targetPrice;
    IERC20 private _collateralToken;
    IPriceOracle private _priceOracle;
    uint256 private _epoch;
    uint256 private constant REBASE_INTERVAL = 1 days;
    uint256 private _lastRebaseTimestamp;
    uint256 private _totalCollateral;
    uint256 private constant COLLATERAL_RATIO = 150; // 150% collateralization
    uint256 private constant FLASH_LOAN_FEE = 9; // 0.09% fee

    event Rebase(uint256 indexed epoch, uint256 totalSupply);
    event PriceUpdate(uint256 newPrice);
    event CollateralAdded(address indexed user, uint256 amount);
    event CollateralRemoved(address indexed user, uint256 amount);
    event FlashLoan(address indexed borrower, uint256 amount, uint256 fee);

    constructor(address priceOracle, address collateralToken) ERC20("3DOT Token", "3DOT") {
        _mint(msg.sender, INITIAL_SUPPLY);
        _priceOracle = IPriceOracle(priceOracle);
        _collateralToken = IERC20(collateralToken);
        _targetPrice = 1 * 10**18; // Initial target price of 1 USD
        _lastRebaseTimestamp = block.timestamp;
        _epoch = 0;
    }

    function pause() public onlyOwner {
        _pause();
    }

    function unpause() public onlyOwner {
        _unpause();
    }

    function rebase() public {
        require(block.timestamp >= _lastRebaseTimestamp + REBASE_INTERVAL, "Rebase interval not reached");
        
        uint256 currentPrice = getPrice();
        uint256 currentSupply = ERC20.totalSupply();
        
        if (currentPrice > _targetPrice) {
            uint256 supplyDelta = currentSupply.mul(currentPrice.sub(_targetPrice)).div(_targetPrice);
            _mint(address(this), supplyDelta);
        } else if (currentPrice < _targetPrice) {
            uint256 supplyDelta = currentSupply.mul(_targetPrice.sub(currentPrice)).div(_targetPrice);
            _burn(address(this), supplyDelta);
        }

        _lastRebaseTimestamp = block.timestamp;
        _epoch = _epoch.add(1);

        emit Rebase(_epoch, ERC20.totalSupply());
    }

    function getCollateralRatio() public view returns (uint256) {
        uint256 totalSupplyValue = ERC20.totalSupply().mul(getPrice()).div(10**18);
        return _totalCollateral.mul(10000).div(totalSupplyValue);
    }

    function getPrice() public view returns (uint256) {
        return _priceOracle.getPrice();
    }

    function addCollateral(uint256 amount) public {
        require(amount > 0, "Amount must be greater than 0");
        require(_collateralToken.transferFrom(msg.sender, address(this), amount), "Collateral transfer failed");
        _totalCollateral = _totalCollateral.add(amount);
        emit CollateralAdded(msg.sender, amount);
    }

    function removeCollateral(uint256 amount) public {
        require(amount > 0, "Amount must be greater than 0");
        require(_totalCollateral.sub(amount) >= ERC20.totalSupply().mul(getPrice()).mul(COLLATERAL_RATIO).div(10000).div(10**18), "Collateral ratio would fall below minimum");
        require(_collateralToken.transfer(msg.sender, amount), "Collateral transfer failed");
        _totalCollateral = _totalCollateral.sub(amount);
        emit CollateralRemoved(msg.sender, amount);
    }

    function flashLoan(uint256 amount, address borrower, address target, bytes calldata data) public {
        require(amount > 0, "Amount must be greater than 0");
        uint256 fee = amount.mul(FLASH_LOAN_FEE).div(10000);
        uint256 totalDebt = amount.add(fee);
        require(totalDebt <= balanceOf(address(this)), "Not enough liquidity");

        // Transfer tokens to the borrower
        _transfer(address(this), borrower, amount);

        // Execute the flash loan logic
        (bool success, ) = target.call(data);
        require(success, "Flash loan execution failed");

        // Repay the flash loan
        require(transferFrom(borrower, address(this), totalDebt), "Flash loan repayment failed");

        emit FlashLoan(borrower, amount, fee);
    }

    function updateTargetPrice(uint256 newTargetPrice) public onlyOwner {
        _targetPrice = newTargetPrice;
        emit PriceUpdate(newTargetPrice);
    }

    function _beforeTokenTransfer(address from, address to, uint256 amount)
        internal
        whenNotPaused
        override
    {
        super._beforeTokenTransfer(from, to, amount);
    }
}
                `
            };
        }

        const transactions = await getAddressTransactions(address);
        
        res.render('address', { 
            title: `Address ${address}`, 
            address, 
            balance, 
            isContract,
            contractInfo,
            transactions, 
            web3,
            formatLargeNumber
        });
    } catch (error) {
        console.error('Error fetching address details:', error);
        res.render('error', { title: 'Error', error: 'Error fetching address details' });
    }
};

exports.search = async (req, res) => {
    const query = req.query.q;
    
    if (!query) {
        return res.redirect('/');
    }

    try {
        if (web3.utils.isAddress(query)) {
            // If the query is an address, redirect to the address page
            return res.redirect(`/address/${query}`);
        } else if (query.length === 66 && query.startsWith('0x')) {
            // If the query looks like a transaction hash
            const tx = await web3.eth.getTransaction(query);
            if (tx) {
                return res.redirect(`/tx/${query}`);
            }
        }

        // If it's not an address or transaction, try to interpret it as a block number
        const block = await web3.eth.getBlock(query);
        if (block) {
            return res.redirect(`/block/${block.number}`);
        }

        // If we couldn't interpret the query, show an error
        res.render('search', { title: 'Search Results', error: 'No results found for your query.' });
    } catch (error) {
        console.error('Search error:', error);
        res.render('search', { title: 'Search Error', error: 'An error occurred while searching.' });
    }
};

async function getLatestBlocks(latestBlockNumber, count) {
    const blocks = [];
    for (let i = 0; i < count; i++) {
        const blockNumber = Number(latestBlockNumber) - i;
        const block = await web3.eth.getBlock(blockNumber.toString());
        blocks.push(block);
    }
    return blocks;
}

async function getLatestTransactions(blocks) {
    const transactions = [];
    for (const block of blocks) {
        for (const txHash of block.transactions.slice(0, 5)) {
            const tx = await web3.eth.getTransaction(txHash);
            transactions.push(tx);
        }
        if (transactions.length >= 10) break;
    }
    return transactions;
}

async function getAddressTransactions(address) {
    // This is a placeholder. In a real-world scenario, you'd need to implement
    // a way to fetch transactions for a specific address, which might require
    // indexing transactions or using an external API.
    return [];
}

function getTimeDifference(timestamp) {
    const now = Date.now() / 1000;
    const diff = now - timestamp;
    if (diff < 60) return `${Math.floor(diff)} secs ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)} mins ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} hours ago`;
    return `${Math.floor(diff / 86400)} days ago`;
}

function calculateTxnFee(tx) {
    const gasPriceInEther = web3.utils.fromWei(tx.gasPrice, 'ether');
    return (gasPriceInEther * tx.gas).toFixed(8);
}

function formatLargeNumber(num) {
    // Convert the string to a number
    num = parseFloat(num);
    
    // If the number is less than 1, we can use toFixed
    if (num < 1) {
        return num.toFixed(18).replace(/\.?0+$/, "");
    }
    
    // For larger numbers, we'll use a more complex approach
    let [integerPart, fractionalPart] = num.toString().split('.');
    
    // Add commas to the integer part
    integerPart = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    
    // If there's a fractional part, limit it to 18 digits and remove trailing zeros
    if (fractionalPart) {
        fractionalPart = fractionalPart.slice(0, 18).replace(/\.?0+$/, "");
        return `${integerPart}.${fractionalPart}`;
    }
    
    return integerPart;
}

exports.getTerms = (req, res) => {
    res.render('terms', { title: 'Terms of Service' });
};

exports.getPrivacy = (req, res) => {
    res.render('privacy', { title: 'Privacy Policy' });
};

exports.getTermsAndPrivacy = (req, res) => {
    res.render('terms-and-privacy', { title: 'Terms of Service & Privacy Policy' });
};
