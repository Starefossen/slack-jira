/* eslint no-console: 0 */
'use strict';

const express = require('express');
const bodyParser = require('body-parser');

const app = module.exports.app = express();
const jira = require('./lib/jira');

app.set('x-powered-by', false);
app.set('trust proxy', 1);

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.get('/favicon.ico', (req, res) => {
  res.set('Content-Type', 'image/x-icon');
  res.end();
});

// slack token check
app.use('/api/v1', (req, res, next) => {
  const slackTokens = new Set(process.env.SLACK_TOKENS.split(','));

  if (!slackTokens.has(req.body.token)) {
    res.status(403).end('Invalid Slack Token');
  } else {
    next();
  }
});

// slack user check
app.use('/api/v1', (req, res, next) => {
  if (!jira.USERS.has(req.body.user_name)) {
    res.status(403).end('Forbidden Slack User');
  } else {
    next();
  }
});

app.param('type', (req, res, next, type) => {
  if (!jira.TYPES.has(type)) {
    res.status(400).end('Invalid Task Type');
  } else {
    req.params.type = jira.TYPES.get(type);
    next();
  }
});

app.post('/api/v1/create/:type', (req, res) => {
  const type = req.params.type;

  let project = process.env.JIRA_DEFAULT_PROJECT;
  let summary = req.body.text;
  const reporter = jira.USERS.get(req.body.user_name);

  if (/^[A-Z]+ /.test(summary)) {
    summary = summary.split(' ');
    project = summary.splice(0, 1).join('');
    summary = summary.join(' ');
  }

  jira.create(type, project, summary, reporter, (err, issue) => {
    if (err) {
      if (process.env.NODE_ENV !== 'testing') { console.error(err); }
      res.status(400).end('Issue creation failed!');
    } else {
      res.end(`${type} ${issue.key} created successfully!`);
    }
  });
});

app.post('/api/v1/assign', (req, res) => {
  const argv = req.body.text.split(' ');
  const issue = argv[0];
  const userName = (argv[1] || '').replace('@', '') || req.body.user_name;

  if (!issue || !userName) {
    return res.status(400).end('Usage: /assign [ISSUE] @[USER]');
  }

  if (!jira.USERS.has(userName)) {
    return res.status(400).end(`User "@${userName}" was not found!`);
  }

  return jira.assign(issue, jira.USERS.get(userName), (err) => {
    if (err) {
      if (process.env.NODE_ENV !== 'testing') { console.error(err); }
      res.status(400).end('Issue assigning failed!');
    } else {
      res.end(`${issue} assigned to @${userName}!`);
    }
  });
});

app.param('status', (req, res, next, status) => {
  if (!jira.TRANSITIONS.has(status)) {
    return res.status(400).end(`Invalid status ${status}`);
  }

  return next();
});

app.post('/api/v1/issue/:status', (req, res) => {
  const status = req.params.status;
  const user = jira.USERS.get(req.body.user_name);

  const argv = req.body.text.split(' ');
  const key = argv.splice(0, 1)[0];
  const comment = argv.join(' ');

  jira.issue(key, (issueErr, issue) => {
    if (issueErr) { throw issueErr; }

    if (!issue || issue.errors) {
      return res.status(404).end(`Issue ${key} was not found!`);
    }

    // issue is not in the sprint
    if (!issue.fields.sprint) {
      console.log('issue not in a sprint');

      // jira.sprint((err, sprint) => {
      //   if (err) { throw err; }

      //   console.log(sprint);
      // });
    }

    return jira.transition(key, status, user, comment, (transitionErr) => {
      if (transitionErr) { throw transitionErr; }

      res.end(`Status for ${key} updated successfully`);
    });
  });
});

// eslint-disable-next-line
app.use((err, req, res, next) => {
  res.end('ε(´סּ︵סּ`)з');

  throw err;
});

if (!module.parent) {
  app.listen(8080);
  console.log('Server is ready for connections on port 8080');
}
