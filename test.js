'use strict';

const assert = require('assert');
const request = require('supertest');
const jsonist = require('jsonist');
const app = request(require('./').app);

describe('help', () => {
  it('returns help menue', (done) => {
    app.post('/api/v1')
      .send({text: 'help', token: process.env.SLACK_TOKEN})
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
      token: process.env.SLACK_TOKEN,
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
