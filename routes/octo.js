require('http');
require('dotenv').config();

const { Octokit } = require('octokit');
const octokit = new Octokit({auth : process.env.PAT});

var express = require('express');
var router = express.Router();

router.get('/', function(req, res, next) {
  graphql_repos().then(result => {
    var repos = result.user.repositories.nodes
    //console.log(repos);

    // Put data into html table row formant in one big string
    var tableText = "\
      <tr>\
        <th>Repository</th>\
        <th>Description</th>\
        <th>Recent Push</th>\
        <th>Languages</th>\
      </tr>\
      "
    for (var i = 0; i < repos.length; i++){
      var row = 
        "<tr>\
        <td>" + repos[i].name + "</td>\
        <td>" + repos[i].description + "</td>\
        <td>" + repos[i].pushedAt + "</td>\
        <td>" + repos[i].languages + "</td>\
        </tr>";
      tableText = tableText.concat(row);
    }
    res.send(tableText);
  });
});

module.exports = router;

/* Functions */

async function graphql_repos() {
  return await octokit.graphql(`
    {
      user(login : "Rock-it-science") {
        repositories(first:10, privacy : PUBLIC, orderBy: {field: PUSHED_AT, direction: DESC}) {
          nodes{
            name
            description
            pushedAt
            url
            languages(first : 3) {
              nodes {
                name
              }
            }
          }
        }
      }
    }
`);
}