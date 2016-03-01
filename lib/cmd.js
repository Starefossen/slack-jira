'use strict';

const url = require('url').parse(process.env.JIRA_URL);
const user = process.env.JIRA_USER;
const pass = process.env.JIRA_PASS;

const Jira = require('jira').JiraApi;
const jira = new Jira(url.protocol, url.hostname, url.port, user, pass, '2');

const parse = require('shell-quote').parse;
const jsonist = require('jsonist');

module.exports = function cmd(opts) {
  const argv = require('minimist')(parse(opts.text));
  const response_url = opts.response_url;

  return new Promise((resolve, reject) => {
    switch (argv._[0]) {
      case "find":
        const id = argv._[1];

        if (!id) {
          resolve('Usage: /jira find [id]');
        } else {
          resolve(`Locating JIRA issue ${id}...`);

          module.exports.find(id, (err, issue) => {
            let response = {};

            if (err) {
              response = {
                response_type: 'ephemeral',
                text: `JIRA issue ${id} was not found!`,
              }
            } else {
              const key = issue.key;
              const url = issue.self;
              const type = issue.fields.issuetype.name;

              const summary = issue.fields.summary;
              const assignee = (issue.fields.assignee || {}).displayName;
              const priority = issue.fields.priority.name;

              response = {
                response_type: 'ephemeral',
                fallback: `${type} ${key}: ${url}`,
                text: `${type} <${url}|${key}>`,
                attachments: [{
                  fields: [{
                    title: 'Summary',
                    value: summary,
                    short: false,
                  },{
                    title: 'Assignee',
                    value: assignee,
                    short: true
                  },{
                    title: 'Priority',
                    value: priority,
                    short: true,
                  }],
                }],
              }
            }

            jsonist.post(response_url, response, (err, data, res) => {
              if (err) { throw err; }

              console.log(data);
            });
          });
        }

        break;

      case "create":
        const project = argv._[1];
        const type = argv._[2];
        const summary = argv._[3];

        if (!project || !type || !summary) {
          resolve('Usage: /jira create [project] [type] [summary]');
        } else {
          resolve('Comming soon... ;)');
        }

        break;

      default:
        resolve(module.exports.help());
    }
  });
};

module.exports.help = function help() {
  return `Usage: /jira <command> [<args>]

Commands:
  find    Find something
  create  Create something`;
};

module.exports.find = function find(id, cb) {
  jira.findIssue(id, cb);
};

module.exports.create = function create(project, summary, type, cb) {

};
