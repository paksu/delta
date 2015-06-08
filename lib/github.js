var GitHubApi = require("github");
var config = require("../config.js");
var _ = require("lodash");
var Q = require("q");

var github = new GitHubApi({ version: "3.0.0", timeout: 5000 });

function filterPullRequestMerges(data) {
    return /Merge pull request #(\d+) from .+/.test(data.commit.message);
}

function extractPullRequestId(data) {
  var matches = /Merge pull request #(\d+) from .+/.exec(data.commit.message);
  return matches[1];
}

function fetchPullRequest(id) {
  var user = config.GITHUB_TARGET_REPO.split('/')[0];
  var repo = config.GITHUB_TARGET_REPO.split('/')[1];
  return Q.ninvoke(github.pullRequests, "get",{
    user: user,
    repo: repo,
    number: id
  });
}

function filterPublicContent(pullRequest) {
  // TODO: Do some filtering, we may not want to display the
  // whole pull request body
  pullRequest.filteredBody = pullRequest.body;
  return pullRequest;
}

function renderPullRequest(pullRequest, publicContent) {
  console.log("rendering pr", pullRequest.id);
  return Q.ninvoke(github.markdown, "render",{
    text: pullRequest.filteredBody,
    mode: "gfm",
    context: config.GITHUB_TARGET_REPO
  }).then(function(renderedBody) {
    pullRequest.renderedBody = renderedBody;
    return pullRequest;
  });
}

function getRenderedPullRequests() {
  // TODO: maybe authentication should be mandatory
  if(config.GITHUB_TOKEN) {
    github.authenticate({
        type: "oauth",
        token: config.GITHUB_TOKEN
    });
  }


  var user = config.GITHUB_TARGET_REPO.split('/')[0];
  var repo = config.GITHUB_TARGET_REPO.split('/')[1];

  return Q.ninvoke(github.repos, "getCommits", {
    user: user,
    repo: repo,
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
    var pullRequestBodyToRender = _.map(pullRequests, filterPublicContent);
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
