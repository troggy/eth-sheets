require('dotenv').config();
const fetch = require('node-fetch');
const ethers = require('ethers');
const fecha = require('fecha');

const Spreadsheet = require('./utils/spreadsheet');
const getTxDetails = require('./utils/getTxDetails');

const knownAddresses = require('../knownAddresses.json');

const wallets = [
  { 
    sheet: 'Escrow Txs',
    address: '0xc5cdcd5470aef35fc33bddff3f8ecec027f95b1d'
  },
  { 
    sheet: 'EF grant Txs',
    address: '0x9d9d3c5cdc0255f76461c54627389597b63d8ce4'
  },
  { 
    sheet: 'Chain Ops Circle Txs',
    address: '0x0876979535552f3fecd38372503d376864d31c1c'
  },
  { 
    sheet: 'Ecosystem Dev Circle',
    address: '0xdb3d918df2cb3e5486cfc39b188c6f2b268a6511'
  }
];

const spreadsheet = new Spreadsheet(
  process.env.SPREADSHEET_ID, 2,
  process.env.EMAIL, process.env.PRIVATE_KEY,
);

const getTxList = (account, fromBlock = 7813024) =>
  fetch(`https://api.etherscan.io/api?module=account&action=txlist&address=${account}&startblock=${fromBlock}&endblock=latest&sort=asc&apikey=${process.env.ES_API_KEY}`)
  .then(res => res.json()).then(res => res.result);

const getInternalTxList = (account, fromBlock = 7813024) =>
  fetch(`https://api.etherscan.io/api?module=account&action=txlistinternal&address=${account}&startblock=${fromBlock}&endblock=latest&sort=asc&apikey=${process.env.ES_API_KEY}`)
  .then(res => res.json()).then(res => res.result);

const getDaiTxs = (account, fromBlock = 7813024) =>
  fetch(`https://api.etherscan.io/api?module=account&action=tokentx&address=${account}&startblock=${fromBlock}&endblock=latest&sort=asc&apikey=${process.env.ES_API_KEY}`)
  .then(res => res.json())
  .then(res =>
    res.result.filter(({ contractAddress }) => 
      contractAddress === '0x89d24a6b4ccb1b6faa2625fe562bdd9a23260359'
    )
  );

const getDaiRecords = (address) => 
  getDaiTxs(address)
    .then(daiTxs => 
      daiTxs.map(tx => {
        const record = {
          timestamp: tx.timeStamp,
          txHash: tx.hash,
          daiValue: ethers.utils.formatEther(tx.value)
        };
        if (tx.to === address) {
          return {
            ...record,
            target: tx.from,
          };
        } else {
          return {
            ...record,
            target: tx.to,
            daiValue: -record.daiValue,
          };
        }
      })
    );

const incomingTxRecords = (address) =>
  getTxList(address)
    .then(txList => 
      txList.filter(({ value, isError }) => value !== '0' && isError === '0')
    ).then(txList => 
      txList.map(tx => getTxDetails(parseInt(tx.blockNumber), tx.hash, null))
    );

const outgoingTxRecords = (address) =>
  getInternalTxList(address)
    .then(txList => 
      txList.filter(({ value, isError }) => value !== '0' && isError === '0')
    ).then((txList) =>
      txList.map(tx => 
        getTxDetails(parseInt(tx.blockNumber), tx.hash, null)
          .then(txDetails => ({ 
            ...txDetails,
            target: tx.to,
            ethValue: -ethers.utils.formatEther(tx.value),
          }))
      )
    );

const toRow = ({ timestamp, txHash, target, ethPrice, ethValue, daiValue }) => {
  const usdValue = ethValue * ethPrice;

  return [
    '', // summary
    '', // policy
    '', // flavour,
    String(ethValue || '').replace('.', ','),
    String(daiValue || '').replace('.', ','),
    String(usdValue || '').replace('.', ','),
    String(ethPrice || '').replace('.', ','),
    target.toLowerCase(),
    knownAddresses[target.toLowerCase()] || '',
    fecha.format(new Date(timestamp * 1000), 'DD/MM/YYYY HH:mm'),
    '', // multisig tx
    '', // settled
    'https://etherscan.io/tx/' + txHash,
    '', // Notes
  ];
};

let promise = Promise.resolve();

wallets.forEach(({ sheet, address }) => {
  promise = promise.then(() => {
    return Promise.all([
      incomingTxRecords(address),
      outgoingTxRecords(address),
      getDaiRecords(address),
    ]);
  }).then(([inTx, outTx, daiTxs]) => 
    Promise.all([...inTx, ...outTx, ...daiTxs])
  ).then(records => {
    return records.sort((a, b) => a.timestamp - b.timestamp)
  }).then(records => {
    spreadsheet.appendTo(sheet, records.map(toRow))
      .then((record) => {
        console.log(record.data.tableRange, 'Added:', record.data.updates.updatedRows);
      }).catch(console.error);
  });
});
