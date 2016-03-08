# Slack Jira

![Slack Jira In Action](https://raw.githubusercontent.com/Starefossen/slack-jira/master/slack-jira.gif)

## Features

Manage Jira issues directly from Slack.

* [x] Create Bugs, Tasks, and Stories
* [x] Assign issues to yourself, or team members
* [x] Transition issues between Todo, In Progress, or Done
* [ ] Add issues to current sprint
* [ ] List issues in current sprint
* [ ] Link issues to Slack history

## Test

```
$ npm test
```

## Install and Run

```
$ docker pull starefossen/slack-jira
$ docker run -e ... -p 8080:8080 starefossen/slack-jira
```

### Environment Variables

| Variable | Description |
|----------|-------------|
| JIRA_URL | Complete URL to your JIRA installation |
| JIRA_USER | JIRA API user |
| JIRA_PASS | JIRA API password |
| JIRA_DEFAULT_PROJECT | Default project for new issues |
| JIRA_DEFAULT_RAPIDVIEW | Default Rapid View for Sprint items |
| JIRA_USERS | Slack to JIRA user translation |
| SLACK_TOKENS | List of valid Slack tokens (comma seperated) |

### Jira Users

The list of Slack to Jira user translation should be on the following format:

```
<slack-user-name>@<jira-user-name>[,...]
```

## [MIT Licensed](https://github.com/Starefossen/slack-jira/blob/master/LICENSE)
