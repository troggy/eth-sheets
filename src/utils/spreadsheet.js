const { google } = require('googleapis');

class Spreadsheet {
  constructor(spreadsheetId, startFromRow, email, privateKey) {
    this.jwtClient = new google.auth.JWT(
      email,
      null,
      privateKey.replace(/\\n/g, '\n'),
      ['https://www.googleapis.com/auth/drive'],
      null,
    );

    this.auth = new Promise((resolve, reject) => {
      this.jwtClient.authorize((err) => {
        if (err) {
          return reject(err);
        }
        return resolve(google.sheets({ version: 'v4', auth: this.jwtClient }));
      });
    });

    this.spreadsheetId = spreadsheetId;
    this.startFromRow = startFromRow;
  }

  appendTo(worksheetName, dataArray) {
    if (dataArray.length === 0) return Promise.resolve();
    return this.auth.then(sheets => new Promise((resolve, reject) => {
      const params = {
        spreadsheetId: this.spreadsheetId,
        range: `${worksheetName}!A${this.startFromRow}:N2000`,
        valueInputOption: 'USER_ENTERED',
        insertDataOption: 'INSERT_ROWS',
        resource: {
          values: dataArray,
        },
      };

      sheets.spreadsheets.values.append(params, (err, response) => {
        if (err) {
          reject(err);
        } else {
          resolve(response);
        }
      });
    }));
  }
}

module.exports = Spreadsheet;
