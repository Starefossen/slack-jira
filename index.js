'use strict';

const express = require('express');
const bodyParser = require('body-parser');

const app = module.exports.app = express();
const cmd = require('./lib/cmd');

app.set('x-powered-by', false);
app.set('trust proxy', 1);

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.get('/favicon.ico', (req, res) => {
  res.set('Content-Type', 'image/x-icon');
  res.end();
});

app.post('/api/v1', (req, res, next) => {
  if (req.body.token !== process.env.SLACK_TOKEN) {
    return res.status(403).end('Invalid Slack Token');
  };

  next();
});

app.post('/api/v1', (req, res, next) => {
  cmd(req.body).then(res.end.bind(res));
});

app.use((err, req, res, next) => {
  console.log(err);
  process.exit(1);
});

if (!module.parent) {
  app.listen(8080);
  console.log('Express started on port 8080');
}
