'use strict';

const url = require('url').parse(process.env.JIRA_URL);
const user = process.env.JIRA_USER;
const pass = process.env.JIRA_PASS;

const Jira = require('jira').JiraApi;
const jira = exports.jira = new Jira(url.protocol, url.hostname, url.port, user, pass, '2');

exports.TYPES = new Map([
  ['bug', 'Bug'],
  ['task', 'Task'],
  ['story', 'Story'],
  ['epic', 'Epic'],
]);

const users = process.env.JIRA_USERS.split(',');
exports.USERS = new Map(users.map((val) => val.split('@')));

exports.create = (type, project, summary, reporter, cb) => {
  const issue = {
    fields: {
      project: { key: project },
      summary,
      issuetype: { name: type },
      reporter: { name: reporter },
    },
  };

  jira.addNewIssue(issue, (err, newIssue) => {
    if (err) { return cb(err); }

    return cb(null, Object.assign({}, issue, newIssue));
  });
};

exports.assign = (issueKey, userId, cb) => {
  const update = {
    fields: {
      assignee: { name: userId },
    },
  };

  jira.updateIssue(issueKey, update, cb);
};
