'use strict';

const jsonist = require('jsonist');

const base = require('url').parse(process.env.JIRA_URL);
const user = process.env.JIRA_USER;
const pass = process.env.JIRA_PASS;

const Jira = require('jira').JiraApi;
const jira = exports.jira = new Jira(base.protocol, base.hostname, base.port, user, pass, '2');

exports.TYPES = new Map([
  ['bug', 'Bug'],
  ['task', 'Task'],
  ['story', 'Story'],
  ['epic', 'Epic'],
]);

exports.TRANSITIONS = new Map([
  ['todo', '11'],
  ['doing', '21'],
  ['done', '31'],
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

exports.transition = (issueKey, status, actor, comment, cb) => {
  const id = exports.TRANSITIONS.get(status);

  const data = {
    transition: { id },
  };

  if (actor) {
    data.historyMetadata = data.historyMetadata || {};
    data.historyMetadata.actor = {
      id: actor,
    };
  }

  if (comment) {
    data.update = {
      comment: [{
        add: {
          body: comment,
        },
      }],
    };
  }

  jira.transitionIssue(issueKey, data, cb);
};

exports.issue = (issueKey, cb) => {
  const url = `${process.env.JIRA_URL}/rest/agile/1.0/issue/${issueKey}`;
  const opts = {
    auth: `${process.env.JIRA_USER}:${process.env.JIRA_PASS}`,
  };

  jsonist.get(url, opts, cb);
};

exports.sprint = cb => {
  const id = process.env.JIRA_DEFAULT_RAPIDVIEW;
  const q = 'state=active';
  const url = `${process.env.JIRA_URL}/rest/agile/latest/board/${id}/sprint?${q}`;

  const opts = {
    auth: `${process.env.JIRA_USER}:${process.env.JIRA_PASS}`,
  };

  jsonist.get(url, opts, cb);
};
