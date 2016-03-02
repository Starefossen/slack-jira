'use strict';

const assert = require('assert');
const request = require('supertest');
const app = request(require('./').app);
const jira = require('./lib/jira').jira;

process.env.NODE_ENV = 'testing';

let fields;

beforeEach(() => {
  fields = {
    token: 'foo123',
    user_name: 'foo',
    text: '',
  };

  jira.addNewIssue = () => { throw new Error('Not Implemented'); };
  jira.updateIssue = () => { throw new Error('Not Implemented'); };
});

describe('token', () => {
  it('returns error for no Slack token', (done) => {
    app.post('/api/v1')
      .expect(403)
      .expect((res) => {
        assert.equal(res.text, 'Invalid Slack Token');
      })
      .end(done);
  });

  it('returns error for invalid Slack token', (done) => {
    app.post('/api/v1')
      .send({ token: 'invalid' })
      .expect(403)
      .expect((res) => {
        assert.equal(res.text, 'Invalid Slack Token');
      })
      .end(done);
  });
});

describe('user', () => {
  it('returns error for no Slack user', (done) => {
    app.post('/api/v1')
      .send({ token: 'foo123' })
      .expect(403)
      .expect((res) => {
        assert.equal(res.text, 'Forbidden Slack User');
      })
      .end(done);
  });

  it('returns error for invalid Slack user', (done) => {
    app.post('/api/v1')
      .send({ token: 'foo123', user_name: 'invalid' })
      .expect(403)
      .expect((res) => {
        assert.equal(res.text, 'Forbidden Slack User');
      })
      .end(done);
  });
});

describe('create', () => {
  it('creates issue for explicit project', (done) => {
    fields.text = 'FOO As a user I should be able to do this when that';

    app.post('/api/v1/create/story')
      .send(fields)
      .expect(200)
      .expect((res) => {
        assert.equal(res.text, 'Story FOO-1 created successfully!');
      })
      .end(done);

    jira.addNewIssue = (issue, cb) => {
      assert.deepEqual(issue, {
        fields: {
          project: { key: 'FOO' },
          summary: 'As a user I should be able to do this when that',
          issuetype: { name: 'Story' },
          reporter: { name: 'foo.bar' },
        },
      });

      process.nextTick(() => {
        cb(null, {
          id: '12345',
          key: `${issue.fields.project.key}-1`,
          self: `${process.env.SLACK_URL}/rest/api/2/issue/12345`,
        });
      });
    };
  });

  it('creates issue for defualt project', (done) => {
    fields.text = 'As a user I should be able to do this when that';

    app.post('/api/v1/create/bug')
      .send(fields)
      .expect(200)
      .expect((res) => {
        assert.equal(res.text, 'Bug BAR-1 created successfully!');
      })
      .end(done);

    jira.addNewIssue = (issue, cb) => {
      assert.deepEqual(issue, {
        fields: {
          project: { key: 'BAR' },
          summary: 'As a user I should be able to do this when that',
          issuetype: { name: 'Bug' },
          reporter: { name: 'foo.bar' },
        },
      });

      process.nextTick(() => {
        cb(null, {
          id: '12345',
          key: `${issue.fields.project.key}-1`,
          self: `${process.env.SLACK_URL}/rest/api/2/issue/12345`,
        });
      });
    };
  });
});

describe('assign', () => {
  it('returns error for invalid parameters', (done) => {
    app.post('/api/v1/assign')
      .send(fields)
      .expect(400)
      .expect((res) => {
        assert.equal(res.text, 'Usage: /assign [ISSUE] @[USER]');
      })
      .end(done);
  });

  it('returns error for unknow user', (done) => {
    fields.text = 'FOO-1 baz';

    app.post('/api/v1/assign')
      .send(fields)
      .expect(400)
      .expect((res) => {
        assert.equal(res.text, 'User "@baz" was not found!');
      })
      .end(done);
  });

  it('returns error for unknown issue', (done) => {
    fields.text = 'FOO-X @foo';

    app.post('/api/v1/assign')
      .send(fields)
      .expect(400)
      .expect((res) => {
        assert.equal(res.text, 'Issue assigning failed!');
      })
      .end(done);

    jira.updateIssue = (key, data, cb) => {
      cb('400: Error while updating');
    };
  });

  it('assigns existing issue for known user', (done) => {
    fields.text = 'FOO-1 @foo';

    app.post('/api/v1/assign')
      .send(fields)
      .expect(200)
      .expect((res) => {
        assert.equal(res.text, 'FOO-1 assigned to @foo!');
      })
      .end(done);

    jira.updateIssue = (key, data, cb) => {
      assert.equal(key, 'FOO-1');
      assert.deepEqual(data, {
        fields: { assignee: { name: 'foo.bar' } },
      });

      cb(null, 'Success');
    };
  });
});
