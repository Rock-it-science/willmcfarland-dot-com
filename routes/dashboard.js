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
        var tableText = "";
        for (var i = 0; i < repos.length; i++){
          var row = 
            "<tr>\
            <td><a href=" + repos[i].url + ">" + repos[i].name.replace('\'','') + "</a></td>\
            <td>" + repos[i].description + "</td>\
            <td style=\"text-align:center;\">";
            for (var j = 0; j < repos[i].languages.nodes.length; j++){
              row = row.concat("<p style=\"color: white; background-color:" + repos[i].languages.nodes[j].color + ";\">" + repos[i].languages.nodes[j].name + "</p>");
            }
            row = row.concat("</td><td><p>");
            for (var j = 0; j < repos[i].repositoryTopics.nodes.length; j++){
                row = row.concat(repos[i].repositoryTopics.nodes[j].topic.name + ", ");
            }
            row = row.concat("</p></td></tr>");
          tableText = tableText.concat(row);
        }
        tableText = "document.write(\x27" + tableText.replace('\'', '') + "\x27);";
        res.type('js');
        res.send(tableText);
      });
});

//Get most used languages
router.get('/languages', function(req, res, next){
  repo_languages().then(result => {

    // List of languages and repos to exclude due to containing large data files that skew results
    var excludeRepos = ['lab-7---introduction-to-php-Rock-it-science'];
    var excludeLanguages = ['Jupyter Notebook', 'CSS'];

    var repos = result.user.repositories.nodes;
    
    //First make an array of all languages in the result
    var lang = [];
    var col = [];
    var l = "";
    var color = "";
    for(var i = 0; i < repos.length; i++){
      for(var j = 0; j < repos[i].languages.edges.length; j++){
        l = repos[i].languages.edges[j].node.name;
        color = repos[i].languages.edges[j].node.color;
        if(!(lang.includes(l)) && !(excludeLanguages.includes(l))){
          col.push(color);
          lang.push(l);
        }
      }
    }

    //Aggregate; sum size by language name
    var size = [];
    for(var i = 0; i < repos.length; i++){
      // Skip excluded repos
      console.log(repos[i].name);
      if(!excludeRepos.includes(repos[i].name)){
        for(var j = 0; j < repos[i].languages.edges.length; j++){//For every language in this repo
          //console.log('  ' + repos[i].languages.edges[j].node.name + ': ' + repos[i].languages.edges[j].size);
          // Skip excluded languages
          if(!excludeLanguages.includes(repos[i].languages.edges[j].node.name)){
            //Add to size total for this language
            var lang_index = lang.indexOf(repos[i].languages.edges[j].node.name);
            if(size[lang_index]){
              size[lang_index] = size[lang_index] + repos[i].languages.edges[j].size;
            } else{
              size[lang_index] = repos[i].languages.edges[j].size;
            }
          }
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
    lang_col_size_perc = [];
    for(var i=0; i < lang.length; i++){
      lang_col_size_perc.push([lang[i], col[i], size[i], percent[i]]);
    }

    //Put array in descending order of percentage
    lang_col_size_perc.sort(function(a, b) {
        if (a[0] === b[0]) {
            return 0;
        }
        else {
            return (a[3] < b[3]) ? 1 : -1;
        }
      }
    );

    //Put that data into the html format
    var lang_html = "document.write(\x27";
    for(var i=0; i < Math.min(10, lang_col_size_perc.length); i++){
      lang_html = lang_html.concat('\
        <h4 class="small fw-bold">' + lang_col_size_perc[i][0] + '<span class="float-end">' + lang_col_size_perc[i][3].toFixed(2) + '%</span></h4> \
        <div class="progress mb-4"> \
          <div class="progress-bar" aria-valuenow="' + lang_col_size_perc[i][3] + '" aria-valuemin="0" aria-valuemax="100" style="width: ' + lang_col_size_perc[i][3] + '%; background-color: ' + lang_col_size_perc[i][1] + '"><span class="visually-hidden">' + lang_col_size_perc[i][3] + '%</span></div> \
        </div> \
      ');
    }
    lang_html = lang_html.concat("\x27);");

    res.type('js');
    res.send(lang_html);
  })
});

//Get commits over time
router.get('/contributions', function(req, res, next){
  contributions().then(result => {
      var contribution_weeks = result.user.contributionsCollection.contributionCalendar.weeks;
      
      //Flatten weeks into a single array - 1 entry per day
      var contribution_days = [];
      for(var w=0; w<contribution_weeks.length; w++){
        for(var d=0; d<contribution_weeks[w].contributionDays.length; d++){
          contribution_days.push(contribution_weeks[w].contributionDays[d]);
        }
      }

      //Aggregate by month
      var contribution_months = [];
      var months = [];
      // Go through every single day. If new month, create new month create new entry in contribution_months. Otherwise update existing entry.
      for(var d=0; d<contribution_days.length; d++){
        var month = contribution_days[d].date.substr(0, 7);
        if(!months.includes(month)){//New month
          contribution_months.push([month, contribution_days[d].contributionCount]);
          months.push(month);
          //console.log("New month: " + month + ", " + contribution_days[d].contributionCount + " contributions.")
        } else{
          contribution_months[months.indexOf(month)][1] = contribution_months[months.indexOf(month)][1] + contribution_days[d].contributionCount;
          //console.log("Updating month " + month + ", " + contribution_days[d].contributionCount + " new contributions, total now " + contribution_months[months.indexOf(month)][1]);
        }
      }

      console.log(months.toString());

      //Add '&quot;' around all strings
      contributions_strings = [];
      months_strings = [];
      for(var i=0; i<contribution_months.length; i++){
        months_strings.push('&quot;' + contribution_months[i][0] + '&quot;');
        contributions_strings.push('&quot;' + contribution_months[i][1] + '&quot;');
      }

      // Put data into html canvas element
      var canvas_html = 'document.write(\x27 \
        <div><canvas data-bss-chart="{ \
          &quot;type&quot;:&quot;bar&quot;,\
          &quot;data&quot;:\
            {&quot;labels&quot;:\
              [' + months_strings.toString() + '], \
            &quot;datasets&quot;:[{ \
              &quot;label&quot;:&quot;Commits&quot;, \
              &quot;backgroundColor&quot;:&quot;#4e73df&quot;, \
              &quot;borderColor&quot;:&quot;#4e73df&quot;, \
              &quot;data&quot;:[' + contributions_strings.toString() + '], \
              &quot;fill&quot;:true}]}, \
              &quot;options&quot;:{&quot;maintainAspectRatio&quot;:true,&quot;legend&quot;:{&quot;display&quot;:false,&quot;labels&quot;:{&quot;bold&quot;:false,&quot;italic&quot;:false,&quot;fontStyle&quot;:&quot;normal&quot;}},&quot;title&quot;:{&quot;fontStyle&quot;:&quot;bold&quot;}}}"></canvas></div>\x27);';

      res.type('js');
      res.send(canvas_html);
    });
});

//Get recent repositories
router.get('/repos', function(req, res, next){
  recent_repos().then(result => {
      var repos = result.user.repositories.nodes;
  
      // Put data into html table row formant in one big string
      var tableText = "";
      for (var i = 0; i < repos.length; i++){
        var row = 
          "<tr>\
          <td><a href=" + repos[i].url + ">" + repos[i].name + "</a></td>\
          <td>" + repos[i].description + "</td>\
          <td style=\"text-align:center;\">";
          for (var j = 0; j < repos[i].languages.nodes.length; j++){
            row = row.concat("<p style=\"color: white; background-color:" + repos[i].languages.nodes[j].color + ";\">" + repos[i].languages.nodes[j].name + "</p>");
          }
          row = row.concat("<td><p>" + repos[i].pushedAt.substr(0, 10) + "</p></td>");
          row = row.concat("</td><td><p>");
          for (var j = 0; j < repos[i].repositoryTopics.nodes.length; j++){
              row = row.concat(repos[i].repositoryTopics.nodes[j].topic.name) + ", ";
          }
          row = row.concat("</p></td></tr>");
        tableText = tableText.concat(row);
      }
      tableText = "document.write(\x27" + tableText.replace('\'', '') + "\x27);";
      res.type('js');
      res.send(tableText);
    });
});

module.exports = router;


/*GraphQL Queries */

async function recent_repos() {
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
                color
              }
              size
            }
          }
        }
      }
    }
  }
  `);
}

async function contributions() {
  return await octokit.graphql(`
  {
    user(login: "Rock-it-science") {
      contributionsCollection {
        contributionCalendar {
          weeks {
            contributionDays {
              contributionCount
              contributionLevel
              date
            }
          }
        }
      }
    }
  }
  
  `);
}