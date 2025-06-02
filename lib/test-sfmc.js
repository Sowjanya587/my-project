require('dotenv').config();
const sfmc = require('./lib/sfmc'); // adjust path if needed

const mid = process.env.SFMC_MID.split(',')[0];  // pick first MID from env
const journeyId = 'YOUR_JOURNEY_ID_HERE'; // replace with actual journey ID

// Test getJourney
sfmc.getJourney(mid, journeyId)
  .then(data => console.log('Journey data:', data))
  .catch(err => console.error('Error fetching journey:', err));

// Test logDE
console.log('Log Data Extension key:', sfmc.logDE(mid).externalKey);

// Test postDataExtensionRows
const rows = [
  { SubscriberKey: 'test@example.com', EventDate: new Date().toISOString() }
];
sfmc.postDataExtensionRows(mid, sfmc.logDE(mid).externalKey, rows)
  .then(res => console.log('Rows inserted:', res))
  .catch(err => console.error('Error inserting rows:', err));
