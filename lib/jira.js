'use strict';

const url = require('url').parse(process.env.JIRA_URL);
const user = process.env.JIRA_USER;
const pass = process.env.JIRA_PASS;

const Jira = require('jira').JiraApi;
const jira = exports.jira = new Jira(url.protocol, url.hostname, url.port, user, pass, '2');

exports.create = (type, project, summary, cb) => {
  const issue = {
    fields: {
      project: { key: project },
      summary,
      issuetype: { name: type },
    },
  }

  jira.addNewIssue(issue, (err, newIssue) => {
    if (err) { return cb(err); }

    cb(null, Object.assign({}, issue, newIssue));
  });
};
