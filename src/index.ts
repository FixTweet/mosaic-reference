import express from 'express';
import 'dotenv/config';

// Basic express setup
const app = express();

app.get('/', (req, res) => {
    const { a, b, c, d } = req.query;
    console.log(a,b,c,d);

    res.send('Hello world!');
});

app.listen(process.env.LISTEN_PORT, () => {});