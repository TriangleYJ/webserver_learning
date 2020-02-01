let express = require('express');
let app = express();

const PORT = 3000;

app.set('view engine', 'pug');
app.set('views', 'projects/basic');
app.locals.pretty = true;

app.get('/', (req, res) => {
    res.send('Hello world!');
});

app.get('/index', (req, res) => {
    res.render('index.pug');
});

app.listen(PORT, () => {
    console.log('Node.js server running at ' + PORT);
});