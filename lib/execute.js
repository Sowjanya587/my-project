export default async function handler(req, res) {
  if (req.method === 'POST') {
    console.log('Execute triggered:', req.body);
    // Process payload
    res.status(200).json({ message: 'Executed successfully!' });
  } else {
    res.status(405).json({ error: 'Method Not Allowed' });
  }
}
