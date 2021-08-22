//Libraries
require('http');
require('dotenv').config();

//Octokit
const { Octokit } = require('octokit');
const octokit = new Octokit({auth : process.env.PAT});

//Express
var express = require('express');
var router = express.Router();

//GET
router.get('/', function(req, res, next) {
  recent_10_repos().then(result => {
    var repos = result.user.repositories.nodes
    //console.log(repos);

    // Put data into html table row formant in one big string
    var tableText = "<table>\
      <tr style=\"text-align:center;\">\
        <th>Repository</th>\
        <th>Description</th>\
        <th>Recent Push</th>\
        <th>Languages</th>\
      </tr>\
      "
    for (var i = 0; i < repos.length; i++){
      var row = 
        "<tr>\
        <td><a href=" + repos[i].url + ">" + repos[i].name + "</a></td>\
        <td>" + repos[i].description + "</td>\
        <td>" + repos[i].pushedAt + "</td>\
        <td style=\"text-align:center;\">";
        for (var j = 0; j < repos[i].languages.nodes.length; j++){
          row = row.concat("<p style=\"color: white; background-color:" + repos[i].languages.nodes[j].color + ";\">" + repos[i].languages.nodes[j].name) + "</p><br/>";
        }
        row = row.concat("</td></tr>");
      tableText = tableText.concat(row);
    }
    tableText = tableText.concat('</table>');
    res.send(tableText);
  });
});

module.exports = router;

/*GraphQL Queries */

async function recent_10_repos() {
  return await octokit.graphql(`
  {
    user(login: "Rock-it-science") {
      repositories(first: 10, privacy: PUBLIC, orderBy: {field: PUSHED_AT, direction: DESC}) {
        nodes {
          name
          description
          pushedAt
          url
          languages(first: 3) {
            nodes {
              name
              color
            }
          }
        }
      }
    }
  }
  `);
}

async function pinned_repos() {
  return await octokit.graphql(`
  {
    user(login: "Rock-it-science") {
      pinnedItems(first: 25) {
        nodes {
          ... on Repository {
            name
            url
            description
            pushedAt
            languages(first: 3) {
              nodes {
                name
                color
              }
            }
            repositoryTopics(first:10){
              nodes{
                topic{
                  name
                }
              }
            }
          }
        }
      }
    }
  }
  `);
}