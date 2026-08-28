const { MongoClient } = require('mongodb');

async function init() {
  const client = new MongoClient('mongodb://127.0.0.1:27018/?directConnection=true');
  try {
    await client.connect();
    const db = client.db('admin');
    console.log('Initiating replica set...');
    try {
      await db.command({ replSetInitiate: { _id: 'rs0', members: [{ _id: 0, host: '127.0.0.1:27018' }] } });
      console.log('Replica set initiated!');
    } catch (e) {
      if (e.message.includes('already initialized')) {
        console.log('Replica set is already initialized.');
      } else {
        throw e;
      }
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.close();
  }
}

init();
