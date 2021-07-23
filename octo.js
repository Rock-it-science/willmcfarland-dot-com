import { createServer } from "http";
import { Octokit, App } from "octokit";
import { config } from "dotenv";

// Configure environment variables (needed for PAT)
config();

/* Octokit Stuff */
const octokit = new Octokit({auth : process.env.PAT});

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
  build(tableText);
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

/* Output Values to browser */
async function build(tableText){
  const hostname = 'localhost';
  const port = 3005;
  const html = `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8"/>
  </head>
  <body>
    
    <a href="test.html">Go to test page</a>

    <H2>Recently Updated Repositories</H2>
    <table id=event-table>` + tableText + `</table>
  </body>
  </html>
  `
  const server = createServer((req, res) => {
      res.statusCode = 200;
      res.setHeader('Content-Type', 'text/html');
      res.end(html);
  });

  server.listen(port, hostname, () => {
      console.log('Server running at http://${hostname}:${port}/');
  });
}