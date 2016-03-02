'use strict';

const express = require('express');
const bodyParser = require('body-parser');

const app = module.exports.app = express();
const cmd = require('./lib/cmd');
const jira = require('./lib/jira');

app.set('x-powered-by', false);
app.set('trust proxy', 1);

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.get('/favicon.ico', (req, res) => {
  res.set('Content-Type', 'image/x-icon');
  res.end();
});

app.post('/api/v1', (req, res, next) => {
  const slackTokens = new Set(process.env.SLACK_TOKENS.split(','));

  if (!slackTokens.has(req.body.token)) {
    return res.status(403).end('Invalid Slack Token');
  };

  next();
});

app.post('/api/v1', (req, res, next) => {
  cmd(req.body).then(res.end.bind(res));
});

app.param('type', (req, res, next, type) => {
  const types = new Map([
    ['bug', 'Bug'],
    ['task', 'Task'],
    ['story', 'Story'],
    ['epic', 'Epic'],
  ]);

  if (!types.has(type)) {
    return res.status(401).end('Invalid Task Type');
  }

  req.params.type = types.get(type);

  next();
});

app.post('/api/v1/create/:type', (req, res, next) => {
  const type = req.params.type;

  let project = process.env.JIRA_DEFAULT_PROJECT;
  let summary = req.body.text;

  if (/^[A-Z]+ /.test(summary)) {
    summary = summary.split(' ');
    project = summary.splice(0, 1).join('');
    summary = summary.join(' ');
  }

  jira.create(type, project, summary, (err, issue) => {
    if (err) {
      console.error(err);

      return res.status(401).end('Issue creation failed!');
    }

    res.end(`${type} ${issue.key} created successfully!`);
  });
});

app.use((err, req, res, next) => {
  console.log(err);
  process.exit(1);
});

if (!module.parent) {
  app.listen(8080);
  console.log('Express started on port 8080');
}
