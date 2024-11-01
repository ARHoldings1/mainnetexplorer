const Contract = require('../models/Contract');
const solc = require('solc');

exports.verifyContract = async (req, res) => {
    const { address, sourceCode, contractName, compilerVersion } = req.body;

    try {
        const contract = await Contract.findOne({ address });
        if (!contract) {
            return res.status(404).json({ error: 'Contract not found' });
        }

        // Compile the source code
        const input = {
            language: 'Solidity',
            sources: {
                'contract.sol': {
                    content: sourceCode
                }
            },
            settings: {
                outputSelection: {
                    '*': {
                        '*': ['*']
                    }
                }
            }
        };

        const output = JSON.parse(solc.compile(JSON.stringify(input)));
        const bytecode = output.contracts['contract.sol'][contractName].evm.bytecode.object;

        if ('0x' + bytecode === contract.bytecode) {
            contract.sourceCode = sourceCode;
            contract.name = contractName;
            contract.isVerified = true;
            await contract.save();
            res.json({ message: 'Contract verified successfully' });
        } else {
            res.status(400).json({ error: 'Compiled bytecode does not match the deployed bytecode' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'An error occurred during contract verification' });
    }
};
