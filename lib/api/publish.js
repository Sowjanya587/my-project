// publish.js
export default async function handler(req, res) {
  if (req.method === 'POST') {
    console.log('Publish triggered:', req.body);
    res.status(200).json({ message: 'Published successfully!' });
  } else {
    res.status(405).json({ error: 'Method Not Allowed' });
  }
}
