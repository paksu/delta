var GitHubApi = require("github");
var _ = require("lodash");
var Q = require("q");

var github = new GitHubApi({
    // required
    version: "3.0.0",
    // optional
    timeout: 5000
});

function filterPullRequestMerges(data) {
    return /Merge pull request #(\d+) from .+/.test(data.commit.message);
}

function extractPullRequestId(data) {
  var matches = /Merge pull request #(\d+) from .+/.exec(data.commit.message);
  return matches[1];
}

function fetchPullRequest(id) {
  return Q.ninvoke(github.pullRequests, "get",{
    user: "paksu",
    repo: "duke",
    number: id
  });
}

function renderPullRequest(pullRequest) {
  console.log("rendering pr", pullRequest.id);
  return Q.ninvoke(github.markdown, "renxder",{
    text: pullRequest.body,
    repo: "gfm",
  }).then(function(renderedBody) {
    pullRequest.renderedBody = renderedBody;
    return pullRequest;
  });
}

function getRenderedPullRequests() {
  github.authenticate({
      type: "oauth",
      token: undefined
  });

  return Q.ninvoke(github.repos, "getCommits", {
    user: "paksu",
    repo: "duke",
    sha: "master"
  })
  .then(function(res) {
    return _.chain(res)
      .filter(filterPullRequestMerges)
      .map(extractPullRequestId)
      .value();
  })
  .then(function(pullRequestIds) {
    var promises = _.map(pullRequestIds, fetchPullRequest);
    return Q.all(promises);
  })
  .then(function(pullRequests) {
    var promises = _.map(pullRequests, renderPullRequest);
    return Q.all(promises);
  })
  .then(function(renderedPullRequests) {
    // TODO: Do some processing here
    return renderedPullRequests;
  });
}

module.exports = {
  getRenderedPullRequests: getRenderedPullRequests
};
