const http = require('http');
const hostname = 'localhost';
const port = 3005;
const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
</head>
<body>
  <H2>Recently Updated Repositories</H2>
  <p>Test text</p>
  <table id=event-table></table>
</body>
</html>
`
const server = http.createServer((req, res) => {
    res.statusCode = 200;
    res.setHeader('Content-Type', 'text/html');
    res.end(html);
});

server.listen(port, hostname, () => {
    console.log('Server running at http://${hostname}:${port}/');
});

/*
import { Octokit, App, Action } from "octokit";
const octokit = new Octokit({auth : "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"});

graphql_repos().then(result => {
  var repos = result.user.repositories.nodes
  console.log(repos);

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
  document.getElementById("event-table").innerHTML = tableText; //Write to table
});

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
*/
