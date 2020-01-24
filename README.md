# eth-sheets
Simple script to dump ETH/DAI transactions into Google Sheet

## Install

1. Create service account to access Google Sheets: https://cloud.google.com/iam/docs/service-accounts. You will need email for it and private key
2. Create spreadsheet (may be blank or use the reference https://shrtco.de/leap-treasury)
3. Give service account write access to your spreadsheet (Share → add account's email)
4. Clone this repo
5. `yarn`
6. Set ENV variables in .env file:
   - ES_API_KEY — Etherscan API key
   - EMAIL — email for Google Drive service account
   - PRIVATE_KEY — private key for Google Driver service account
   - SPREADSHEET_ID — Google Spreadsheet ID to write data to
7. Inside the script:
   - setup wallet(s) to scan
   - adjust block heights to scan from
   - adjust DAI/ERC20 contract address if needed
8. (optional) add known addresses to knownAddresses.json
7. Run it`node src/`

## Reference spreadsheet

LeapDAO treasury: 

Nothing is mandatory. Import could be done in the blank vanilla google sheet, just the name of the list should match the one from the script

## Roadmap

- [x] Basic import of ethereum transactions (incoming/outgoing)
- [x] Basic import of ERC20/DAI transactions
- [ ] Protection against duplicate imports
- [ ] Integration with Gnosis Multisig
- [ ] Source extra metadata from bounty spreadsheets (bounty payout goes through google/netlify form, script reads it)
- [ ] Integration with Gnosis Safe
- [ ] Get away from using Google products
