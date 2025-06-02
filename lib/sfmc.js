const FuelRest = require('fuel-rest');
const logger = require('./logger');

// Read environment variables safely and split into arrays
const SFMC_MIDs = (process.env.SFMC_MID || '').split(',').map(s => s.trim()).filter(Boolean);
const SFMC_TENANTs = (process.env.SFMC_TENANT || '').split(',').map(s => s.trim()).filter(Boolean);
const SFMC_CLIENTs = (process.env.SFMC_CLIENT || '').split(',').map(s => s.trim()).filter(Boolean);
const SFMC_SECRETs = (process.env.SFMC_SECRET || '').split(',').map(s => s.trim()).filter(Boolean);
const SFMC_LOG_DE = process.env.SFMC_LOG_DE ? process.env.SFMC_LOG_DE.split(',').map(s => s.trim()) : [];

// Validate all credential arrays have the same length
if (
  SFMC_MIDs.length === 0 ||
  SFMC_MIDs.length !== SFMC_TENANTs.length ||
  SFMC_MIDs.length !== SFMC_CLIENTs.length ||
  SFMC_MIDs.length !== SFMC_SECRETs.length
) {
  throw new Error(
    'Environment variables SFMC_MID, SFMC_TENANT, SFMC_CLIENT, and SFMC_SECRET must be defined with the same number of comma-separated values.'
  );
}

// Debug logs to verify values (remove or comment out in production)
console.log('SFMC_MIDs:', SFMC_MIDs);
console.log('SFMC_TENANTs:', SFMC_TENANTs);
console.log('SFMC_CLIENTs:', SFMC_CLIENTs);
console.log('SFMC_SECRETs:', SFMC_SECRETs);
console.log('SFMC_LOG_DE:', SFMC_LOG_DE);

let sfmcClients = {};
let sfmcLogDEs = {};

SFMC_MIDs.forEach((mid, index) => {
  sfmcClients[mid] = new FuelRest({
    auth: {
      authOptions: {
        authVersion: 2,
        accountId: mid
      },
      clientId: SFMC_CLIENTs[index],
      clientSecret: SFMC_SECRETs[index],
      authUrl: `https://${SFMC_TENANTs[index]}.auth.marketingcloudapis.com/v2/token`
    }
  });

  sfmcLogDEs[mid] = SFMC_LOG_DE[index] || null;

  // Test connection
  sfmcClients[mid].get({ uri: '/platform/v1/tokenContext' }, (error, response) => {
    if (error) {
      logger.error(`[sfmc.js] mid: ${mid} | catch: ${JSON.stringify(error.res)}`);
    } else {
      logger.info(`[sfmc.js] mid: ${mid} | tokenContext: ${response.res.body}`);
    }
  });
});

module.exports = {
  logDE: (mid) => {
    return {
      externalKey: sfmcLogDEs[mid]
    };
  },
  getJourney: (mid, definitionId) => new Promise((resolve, reject) => {
    sfmcClients[mid].get({
      uri: `/interaction/v1/interactions/${definitionId}`,
      json: true
    }, (error, response) => {
      if (error) {
        reject(error);
      } else if (response.res.statusCode === 403 || response.res.statusCode === 400) {
        if (response.res.body === 'InteractionStudio') {
          reject({ message: 'Insufficient privileges to complete this action.' });
        } else {
          reject(response.res.body);
        }
      } else {
        resolve(response.body);
      }
    });
  }),
  postDataExtensionRows: (mid, deExternalKey, deRows) => new Promise((resolve, reject) => {
    sfmcClients[mid].post({
      uri: `/data/v1/async/dataextensions/key:${deExternalKey}/rows`,
      json: true,
      body: { items: deRows }
    }, (error, response) => {
      if (error) {
        reject(error);
      } else if (response.res.statusCode === 403 || response.res.statusCode === 400) {
        reject(response.res.body);
      } else {
        resolve(response.body);
      }
    });
  })
};
