//Libraries
require('http');
require('dotenv').config();

//Octokit
const { Octokit } = require('octokit');
const octokit = new Octokit({auth : process.env.PAT});

//Express
var express = require('express');
const { table } = require('console');
var router = express.Router();


/* Express functions */

//Get pinned repositories
router.get('/pinned', function(req, res, next){
    pinned_repos().then(result => {
        var repos = result.user.pinnedItems.nodes;
    
        // Put data into html table row formant in one big string
        var tableText = "document.write(\x27";
        for (var i = 0; i < repos.length; i++){
          var row = 
            "<tr>\
            <td><a href=" + repos[i].url + ">" + repos[i].name + "</a></td>\
            <td>" + repos[i].description + "</td>\
            <td style=\"text-align:center;\">";
            for (var j = 0; j < repos[i].languages.nodes.length; j++){
              row = row.concat("<p style=\"color: white; background-color:" + repos[i].languages.nodes[j].color + ";\">" + repos[i].languages.nodes[j].name + "</p>");
            }
            row = row.concat("</td>");
            for (var j = 0; j < repos[i].repositoryTopics.nodes.length; j++){
                row = row.concat("<p>" + repos[i].repositoryTopics.nodes[j].name);
            }
            row = row.concat("</td></tr>");
          tableText = tableText.concat(row);
        }
        tableText = tableText.concat("\x27);")
        res.type('js');
        res.send(tableText);
      });
});

//Get most used languages
router.get('/languages', function(req, res, next){
  repo_languages().then(result => {

    var repos = result.user.repositories.nodes;
    
    //First make an array of all languages in the result
    var lang = [];
    var l = "";
    for(var i = 0; i < repos.length; i++){
      for(var j = 0; j < repos[i].languages.edges.length; j++){
        l = repos[i].languages.edges[j].node.name;
        if(!(lang.includes(l))){
          lang.push(l);
        }
      }
    }

    //Aggregate; sum size by language name
    var size = [];
    for(var i = 0; i < repos.length; i++){
      for(var j = 0; j < repos[i].languages.edges.length; j++){//For every language in this repo
        //Add to size total for this language
        var lang_index = lang.indexOf(repos[i].languages.edges[j].node.name);
        if(size[lang_index]){
          size[lang_index] = size[lang_index] + repos[i].languages.edges[j].size;
        } else{
          size[lang_index] = repos[i].languages.edges[j].size;
        }
      }
    }

    //Percent of total
    var total_size = 0;
    for(var i=0; i<size.length; i++){
      total_size = total_size + parseInt(size[i]);
    }

    var percent = [];
    for(var i=0; i<size.length; i++){
      percent.push(size[i] / total_size * 100);
    }

    //Put it all in one multi-d array
    lang_size_perc = [];
    for(var i=0; i < lang.length; i++){
      lang_size_perc.push([lang[i], size[i], percent[i]]);
    }

    //Put array in descending order of percentage
    lang_size_perc.sort(function(a, b) {
        if (a[0] === b[0]) {
            return 0;
        }
        else {
            return (a[2] < b[2]) ? 1 : -1;
        }
      }
    );

    //Put that data into the html format
    var lang_html = "document.write(\x27";
    for(var i=0; i < Math.min(10, lang_size_perc.length); i++){
      lang_html = lang_html.concat('\
        <h4 class="small fw-bold">' + lang_size_perc[i][0] + '<span class="float-end">' + lang_size_perc[i][2].toFixed(2) + '%</span></h4> \
        <div class="progress mb-4"> \
          <div class="progress-bar bg-danger" aria-valuenow="' + lang_size_perc[i][2] + '" aria-valuemin="0" aria-valuemax="100" style="width: ' + lang_size_perc[i][2] + '%;"><span class="visually-hidden">' + lang_size_perc[i][2] + '%</span></div> \
        </div> \
      ');
    }
    lang_html = lang_html.concat("\x27);");

    res.type('js');
    res.send(lang_html);
  })
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

async function repo_languages() {
  return await octokit.graphql(`
  {
    user(login: "Rock-it-science") {
      repositories(first: 100) {
        nodes {
          name
          languages(first: 100) {
            edges {
              node {
                name
              }
              size
            }
          }
        }
      }
    }
  }
  `)
}