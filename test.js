'use strict';

const assert = require('assert');
const request = require('supertest');
const jsonist = require('jsonist');
const app = request(require('./').app);
const jira = require('./lib/jira').jira;

describe('help', () => {
  it('returns help menue', (done) => {
    app.post('/api/v1')
      .send({text: 'help', token: 'foo123'})
      .expect(200)
      .expect((res) => {
        assert(/Usage: \/jira <command> \[<args>\]/.test(res.text));
      })
      .end(done)
  });
});

describe('find', () => {
  it('returns existing issue', (done) => {
    jsonist.post = (url, data, cb) => {
      assert.equal(url, 'https://hooks.slack.com/commands/1234/5678');
      assert.equal(data.text, 'Sub-task <https://turistforeningen.atlassian.net/rest/api/2/issue/19335|SHER-862>');

      done();
    };

    const fields = {
      token: 'foo123',
      text: 'find "SHER-862"',
      response_url: 'https://hooks.slack.com/commands/1234/5678',
    };

    app.post('/api/v1')
      .send(fields)
      .expect(200)
      .end((err, res) => {
        assert.ifError(err);
        assert.equal(res.text, 'Locating JIRA issue SHER-862...');
      })
  });
});

describe('create', () => {
  before(() => {
    jira.addNewIssue = (issue, cb) => {
      assert.equal(issue.fields.summary, 'As a user I should be able to do this when that');

      process.nextTick(() => {
        cb(null, {
          id: '12345',
          key: `${issue.fields.project.key}-1`,
          self: `${process.env.SLACK_URL}/rest/api/2/issue/12345`,
        });
      });
    };
  });

  it('creates issue for explicit project', (done) => {
    const fields = {
      token: 'foo123',
      text: 'FOO As a user I should be able to do this when that',
    };

    app.post('/api/v1/create/story')
      .send(fields)
      .expect(200)
      .expect((res) => {
        assert.equal(res.text, 'Story FOO-1 created successfully!');
      })
      .end(done)
  });

  it('creates issue for defualt project', (done) => {
    const fields = {
      token: 'foo123',
      text: 'As a user I should be able to do this when that',
    };

    app.post('/api/v1/create/story')
      .send(fields)
      .expect(200)
      .expect((res) => {
        assert.equal(res.text, 'Story BAR-1 created successfully!');
      })
      .end(done)
  });
});
