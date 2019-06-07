const fetch = require('node-fetch');
const ethers = require('ethers');
const MultisigWalletABI = require('../abi/MultisigWallet');

const walletAddress = process.env.MULTISIG_WALLET_ADDRESS;

const getEthPriceAt = (timestamp) => 
  fetch(`https://min-api.cryptocompare.com/data/histohour?fsym=ETH&tsym=USD&limit=1&toTs=${timestamp}&api_key=${process.env.CRYPTOCOMPARE_API_KEY}`).then(res => res.json());

const getTxDetails = (blockNumber, txHash, multiSigTxNum) => {
  const provider = ethers.getDefaultProvider();
  const contract = new ethers.Contract(walletAddress, MultisigWalletABI, provider);

  return Promise.all([
    provider.getBlock(blockNumber),
    provider.getTransaction(txHash),
  ]).then(function([block, tx]) {
    return Promise.all([block, tx, getEthPriceAt(block.timestamp)]);
  }).then(([block, tx, priceData]) => {
    const txData = {
      timestamp: block.timestamp,
      txHash: tx.hash,
      ethPrice: priceData.Data[0].close,
    };

    // if we have multisig tx number, then it is outgoing transaction
    if (multiSigTxNum) {
      return contract.transactions(multiSigTxNum)
        .then(multisigTx => ({
          target: multisigTx.destination,
          ethValue: -ethers.utils.formatEther(multisigTx.value),
          ...txData,
        }));
    }
    return {
      target: tx.from,
      ethValue: ethers.utils.formatEther(tx.value),
      ...txData,
    };
  });
};

module.exports = getTxDetails;