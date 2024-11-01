const Web3 = require('web3');
const Contract = require('../models/Contract');

const web3 = new Web3(process.env.RPC_URL);

async function processBlock(blockNumber) {
    const block = await web3.eth.getBlock(blockNumber, true);
    
    for (let tx of block.transactions) {
        if (tx.to === null && tx.input !== '0x') {
            // This is a contract creation transaction
            const receipt = await web3.eth.getTransactionReceipt(tx.hash);
            if (receipt.contractAddress) {
                await saveContract(receipt.contractAddress, tx.from, tx.input, tx.hash, block.timestamp);
            }
        }
    }
}

async function saveContract(address, creator, bytecode, txHash, timestamp) {
    const contract = new Contract({
        address: address,
        creatorAddress: creator,
        bytecode: bytecode,
        creationTransaction: txHash,
        creationTimestamp: new Date(timestamp * 1000)
    });
    await contract.save();
}

module.exports = { processBlock };
