var MinYear = 1960;
var MaxYear = (new Date()).getFullYear();
var doubleClickDelayMs = 350;
var previousTapStamp;
String.prototype.replaceAll = function(search, replacement) {
    var target = this;
    return target.replace(new RegExp(search, 'g'), replacement);
};

function randomString(length) {
    var result = '', chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    for (var i = length; i > 0; --i) result += chars[Math.floor(Math.random() * chars.length)];
    return result;
}
function toIdName(name){
  return name.toLowerCase().replaceAll('\\s', "").replaceAll('\\W', "-");
}
function getNode(id, name, type) {
  //colors: ['#51b5ce', '#89c733', '#54a329','#2f7ed8', '#0d233a', '#8bbc21', '#910000', '#1aadce', '#492970', '#f28f43', '#77a1e5', '#c42525', '#a6c96a'],
  var colors = {
    "director": "#FD5E00",
    "movie": "#0d233a",
    "actor": "#FD5E00"
  }
  var shapes = {
    "director": "hexagon",
    "movie": "ellipse",
    "actor": "rectangle"
  }
  this.Nodes[id] = {
    id: id,
    name: name,
    faveColor: '#ccc',
    weight: 30
  };
  if(shapes[type]){
    this.Nodes[id].faveShape = shapes[type]
  }
  if (type) {
    this.Nodes[id].faveColor = colors[type];
    this.Nodes[id].type = type;
  }
  return this.Nodes[id];
}
function getEdge(src, target, type) {
  var id = randomString(16);
  this.Edges[id] = { id: id,
    source: src,
    target: target
  };
  return this.Edges[id];
}
function addActorsAndMovie(movie){
  var actorsToAdd = ['actor_1_name', 'actor_2_name', 'actor_2_name'];
  var directorId = toIdName(movie.director_name);
  var movieId = toIdName(movie.movie_title);
  var finalToAdd = [{group: "nodes", data: getNode(directorId, movie.director_name, "director")}];
  finalToAdd.push({group: "nodes", data: getNode(movieId, movie.movie_title, "movie")});
  finalToAdd.push({group: "edges", data: getEdge(movieId, directorId)});
  var alreadyProcessed = [];
  _.forEach(actorsToAdd, function(actorField) {
    if (!movie[actorField] || alreadyProcessed.indexOf(movie[actorField]) > -1) {
      return
    }
    alreadyProcessed.push(movie[actorField]);
    var actorId= toIdName(movie[actorField]);
    finalToAdd.push({group: "nodes", data: getNode(actorId, movie[actorField], "actor")})
    finalToAdd.push({group: "edges", data: getEdge(movieId, actorId)})
  })
  updateGraph(finalToAdd)
}
function updateGraph(finalToAdd){
  cy.add(finalToAdd)
  setTimeout(function(){
    cy.layout({
      name: 'cose'
    }).run()
  }, 100);
}
function pointClick(e) {
  addActorsAndMovie(Demo.Movies[e.point.id]);
  $(".add-legend").addClass("add-bg")
  $(".footnote, .actions").show()
}

function shadeColor(color, percent) {

  var R = parseInt(color.substring(1,3),16);
  var G = parseInt(color.substring(3,5),16);
  var B = parseInt(color.substring(5,7),16);

  R = parseInt(R * (100 + percent) / 100);
  G = parseInt(G * (100 + percent) / 100);
  B = parseInt(B * (100 + percent) / 100);

  R = (R<255)?R:255;  
  G = (G<255)?G:255;  
  B = (B<255)?B:255;  

  var RR = ((R.toString(16).length==1)?"0"+R.toString(16):R.toString(16));
  var GG = ((G.toString(16).length==1)?"0"+G.toString(16):G.toString(16));
  var BB = ((B.toString(16).length==1)?"0"+B.toString(16):B.toString(16));

  return "#"+RR+GG+BB;
}

var Chart = {
  scatter: {
    "chart": {
      "type": "scatter",
      "zoomType": "xy",
      backgroundColor: 'rgba(255, 255, 255, 0.0)'
    },
    "title": {
      "text": "IMDB Rating distribution over the years"
    },
    subtitle: {
     text: 'Click for movie/actor associations'
    },
    "xAxis": {
      min: MinYear,
      max: MaxYear,
      "title": {
        "enabled": true,
        "text": "Year"
      },
      "startOnTick": true,
      "endOnTick": true,
      "showLastLabel": true
    },
    "yAxis": {
      min: 0, 
      max: 10,
      "title": {
        "text": "IMDB Rating"
      }
    },
    "legend": {
      "layout": "vertical",
      "align": "left",
      "verticalAlign": "bottom",
      "x": 60,
      "y": -60,
      "floating": true,
      "borderWidth": 1,
      backgroundColor: 'rgba(255, 255, 255, 0.0)'
    },
    "plotOptions": {
      "scatter": {
        color: "",
        events: {
          click: pointClick
        },
        "marker": {
          "radius": 3,
          "states": {
            "hover": {
              "enabled": true,
              "lineColor": "rgb(100,100,100)"
            }
          }
        },
        "states": {
          "hover": {
            "marker": {
              "enabled": false
            }
          }
        }
      }
    },
    "series": [],
    "tooltip": {
      useHTML: true,
      formatter: function(point) {
        var tooltip = `<div>${this.point.movie} (${this.point.x})</div>`
        if (!isNaN(parseInt(this.point.gross))) {
          tooltip += `<div>Gross: ${nFormatter(this.point.gross, 2)}</div>`;
        }
        if (!isNaN(parseInt(this.point.budget))) {
          tooltip += `<div>Budget: ${nFormatter(this.point.budget, 2)}</div>`;
        }
        tooltip += `<div><b>Rating</b>: ${this.point.y}</div>`;
        return tooltip;
      }
    },
    credits: {
      enabled: false
    }
  },
  bar: {
    credits: {
      enabled: false
    },
    legend: {
      layout: 'vertical',
      align: 'right',
      verticalAlign: 'top',
      floating: true,
      backgroundColor: 'rgba(255, 255, 255, 0.0)'
    },
    chart: {
      backgroundColor: 'rgba(255, 255, 255, 0.0)'
    },
    title: {
        text: ''
    },
    xAxis: {
      categories: [],
      crosshair: true,
      title: {
        text: 'Movies'
      }
    },
    yAxis: {
      min: 0,
      gridLineWidth: 0,
      labels: {
        enabled: false
      },
      title: {
        text: 'Revenue (in USD )'
      }
    },
    tooltip: {
      shared: true
    },
    plotOptions: {
      column: {
        pointPadding: 0.2,
        borderWidth: 0,
        dataLabels: {
          enabled: true,
          formatter: function () {
            return `${(this.point.y && this.point.y > 0)?nFormatter(this.point.y, 2): ""}`;
          }
        }
      }
    },
    series: [],
    tooltip: {
      useHTML: true,
      shared: true,
      formatter: function(point) {
        if (!this.points){
          var tooltip = `<div><b>${this.point.fieldName}</b></div>`;
          var values = _.map(this.point.series.data, "y");
          var percentage = (values[0] && values[1]) ? `${_.round((this.point.y/_.sum(values))*100, 2)}%`: false;
          tooltip += `<div>Total ${this.point.name}: ${nFormatter(this.point.y, 2)}${(percentage)?` ( ${percentage} ) `: ''}</div>`;
          return tooltip;
        } else {
          var revenue = this.points[0]
          var budget = this.points[1]
          var tooltip = `<div>${revenue.x}</div>`
          if (revenue && revenue.y && !isNaN(parseInt(revenue.y))) {
            tooltip += `<div>Gross earnings: ${nFormatter(revenue.y, 2)}</div>`;
          }
          if (budget && budget.y && !isNaN(parseInt(budget.y))) {
            tooltip += `<div>Movie budget: ${nFormatter(budget.y, 2)}</div>`;
          }
          if (revenue && budget && revenue.y && budget.y) {
            var net = (revenue.y > budget.y)? (revenue.y - budget.y): (budget.y - revenue.y);
            var type = (revenue.y > budget.y)? {cls: "green", text: "Profit"}: {cls: "red", text: "Loss"};
            tooltip += `<div><b>Net profit</b>: <span class='${type.cls}'>${nFormatter(net, 2)} ${type.text}</span></div>`;
          }
          return tooltip;
        }
      }
    }
  }
}
function nFormatter(num, digits) {
  var si = [
    { value: 1, symbol: "" },
    { value: 1E3, symbol: "k" },
    { value: 1E6, symbol: "M" },
    { value: 1E9, symbol: "B" },
    { value: 1E12, symbol: "T" },
    { value: 1E15, symbol: "P" },
    { value: 1E18, symbol: "E" }
  ];
  var rx = /\.0+$|(\.[0-9]*[1-9])0+$/;
  var i;
  for (i = si.length - 1; i > 0; i--) {
    if (num >= si[i].value) {
      break;
    }
  }
  return (num / si[i].value).toFixed(digits).replace(rx, "$1") + si[i].symbol;
}
var Demo = {}
function stringToArray(text, headerPresent) {
  var rows = _.compact(text.split("\n"))
  var final =  _.map(rows, function(row) {
    return _.map(row.trim().split(","), function(data){return data;})
  });
  if (final.length && headerPresent) {
    this.Header = final.splice(0, 1)[0];
  }
  return final;
}

function shadeBlend(p,c0,c1) {
    var n=p<0?p*-1:p,u=Math.round,w=parseInt;
    if(c0.length>7){
        var f=c0.split(","),t=(c1?c1:p<0?"rgb(0,0,0)":"rgb(255,255,255)").split(","),R=w(f[0].slice(4)),G=w(f[1]),B=w(f[2]);
        return "rgb("+(u((w(t[0].slice(4))-R)*n)+R)+","+(u((w(t[1])-G)*n)+G)+","+(u((w(t[2])-B)*n)+B)+")"
    }else{
        var f=w(c0.slice(1),16),t=w((c1?c1:p<0?"#000000":"#FFFFFF").slice(1),16),R1=f>>16,G1=f>>8&0x00FF,B1=f&0x0000FF;
        return "#"+(0x1000000+(u(((t>>16)-R1)*n)+R1)*0x10000+(u(((t>>8&0x00FF)-G1)*n)+G1)*0x100+(u(((t&0x0000FF)-B1)*n)+B1)).toString(16).slice(1)
    }
}
window.COLORS={}
function colors(){
  var color1 = "#BBBBE3";
  var color2 = "#5A003C";
  var i=1;
  while(i<=100) {
    COLORS[i] = shadeBlend(i/100,color1,color2);
    i++;
  }
}
function setParams() {
  colors()
  this.Movies = {}
  this.Nodes = {}
  this.Edges = {}
  this.$browse = $("#csv-file");
  this.$genres = $(".genres");
  this.$countries = $(".country");
  this.$revenues = $("#revenue")

}
function readCsv(parseData) {
  return function (e) {
    var file = e.target.files[0];
    if(!file)
      return;
    var reader = new FileReader();
    reader.onload = function(e) {
      parseData(e.target.result);
    };
    reader.onerror = function (e) {
      console.error("extract failed");
    }
    var result = reader.readAsText(file, "UTF-8");
  }
}
function isMovieValid(item) {
  var year = parseFloat(item.title_year), rating = parseFloat(item.imdb_score);
  var isValueValid = (year >= MinYear && year <= MaxYear) && (rating >= 0 && rating <= 10);
  var genreFiltered = this.$genres.val();
  var countryFiltered = this.$countries.val();
  return isValueValid && (!genreFiltered || genreFiltered === "all" || item.genres.split("|").indexOf(genreFiltered) > -1) && (!countryFiltered || countryFiltered === "all" || item.country == countryFiltered);
}
function addIfUnique(map, object, value) {
  value = _.trim(value)
  if (map[value]) {
    map[value].push(object.id);
  } else {
    map[value] =[object.id];
  }
}
function parseCSV(result){
  this.Map = {
    byYear: {},
    byGenre: {},
    byCountry: {}
  }
  var arrayValue = stringToArray(result, true);
  _.map(arrayValue, function(item) {
    var obj = _.zipObject(this.Header, item);
    try {
      var key = obj.movie_imdb_link.match(/(tt\d+)/)[0]
      obj.id = key;
      this.Movies[key] = obj;
    } catch {
      var didMatchWrong = obj.num_user_for_reviews.match(/(tt\d+)/)
      if (didMatchWrong && didMatchWrong.length > 0) {
        obj.movie_imdb_link = obj.num_user_for_reviews;
        obj.id = didMatchWrong[0];
        this.Movies[didMatchWrong[0]] = obj;
      }
    }
  });
  this.scatterSeries = [
    {
      name: "IMDB Ratings",
      color: "rgba(0, 0, 255, 0.7)",
      data: [],
      turboThreshold: 5000
    }
  ]
  var index = {
    profit: 0,
    loss: 1
  }
  _.forEach(this.Movies, function(item){
    if (!isMovieValid(item))return;
    addIfUnique(this.Map.byCountry, item, item.country);
    addIfUnique(this.Map.byYear, item, item.title_year);
    _.forEach(item.genres.split("|"), function(genre){
      addIfUnique(this.Map.byGenre, item, genre);
    })
  })
  renderFilters();
  renderChart();
}
function renderNodes() {
  var $container = $(".radial-node")
  $(".nodes")
    .height($container.height() - 80)
    .width($container.width())
  cytoscape({
    container: document.getElementById('nodes'),

    layout: {
      name: 'cose',
      padding: 10
    },

    style: cytoscape.stylesheet()
      .selector('node')
        .css({
        'shape': 'data(faveShape)',
        'content': 'data(name)',
        'font-size': 8,
        'background-color': '#E89393',
        'text-outline-color': 'data(faveColor)',
        'background-color': 'data(faveColor)'
      }).selector('.director')
      .css({
        'background-color': '#B999F3'
      }).selector('.movie')
      .css({
        'background-color': '#FF0000'
      })
      .selector('edge')
      .css({
        'curve-style': 'bezier',
        'width': 2,
        'target-arrow-shape': 'triangle',
        'line-color': '#ffaaaa',
        'target-arrow-color': '#ffaaaa'
      })
      .selector('.faded')
        .css({
          'opacity': 0.25,
          'text-opacity': 0
        }),

    elements: {
      nodes: [],
      edges: []
    },
    ready: function(){
      window.cy = this;
      addGraphEvents();
    }
  });
}
function showRevenueFor(clickedItem){
  var nodeObj = Demo.Nodes[clickedItem.target.id()];
  var data = _.filter(Demo.Movies, function(movie){
    if (nodeObj.type === "actor") {
      return movie.actor_3_name === nodeObj.name || movie.actor_2_name === nodeObj.name || movie.actor_1_name === nodeObj.name;
    } else {
      return movie.director_name === nodeObj.name;
    }
  });
  if (nodeObj.type === "movie") {
    data = _.filter(Demo.Movies, {movie_title: nodeObj.name})
  }
  var final = [
    {
      type: "column", 
      name: "Revenue",
      data: [],
      color: '#36009D'
    },
    {
      type: "column", 
      name: "Budget",
      data: [],
      color: '#FAA200'
    },
    {
      type: 'pie',
      name: `Statistics for ${nodeObj.name}`,
      data: [
        {
          name: 'Revenue',
          y: 0,
          fieldName: nodeObj.name,
          color: '#36009D'
        }, {
          name: 'Budget',
          y: 0,
          fieldName: nodeObj.name,
          color: '#FAA200'
        }
      ],
      center: ["95%", "18%"],
      size: 100,
      showInLegend: false,
      dataLabels: {
        enabled: false
      }
    }
  ]
  Chart.bar.xAxis.categories = []
  _.map(data, function(movie){
    Chart.bar.xAxis.categories.push(movie.movie_title)
    var gross = parseInt(movie.gross);
    final[0].data.push(gross)
    if (_.isInteger(gross)) {
      final[2].data[0].y+=gross;
    }
    var budget = parseInt(movie.budget);
    final[1].data.push(budget)
    if (_.isInteger(budget)) {
      final[2].data[1].y+=budget;
    }
  });
  Chart.bar.title.text = `Revenue for ${nodeObj.name}`;
  Chart.bar.series = final;
  Chart.bar.chart.height = $revenues.parent().outerHeight()
  Chart.bar.chart.width = $revenues.outerWidth()
  Highcharts.chart(Demo.$revenues[0], Chart.bar);
}
function addGraphEvents() {
  cy.on('click', 'node', function(evt){
    var nodeObj = Demo.Nodes[this.id()];
    addAssociationsFor(nodeObj)
  });
  $(".clear").on("click", function(){
    cy.elements().remove();
  })
  $(".refresh").on("click", function(){
    cy.layout({
      name: 'cose'
    }).run();
  });
  cy.contextMenus({
    menuItems: [{
      id: 'revenue',
      content: 'Revenue',
      tooltipText: 'Show Revenue',
      selector: 'node',
      onClickFunction: showRevenueFor
    }]
  });
}

function addMoviesForNode(from, nodesToAdd){
  if (!nodesToAdd.length) {
    $.notify("Nothing to add", "info");
  }
  var toAdd = _.map(nodesToAdd, function(movie){
    var newMovieId = toIdName(movie.movie_title);
    var newMovie = {group: "nodes", data: getNode(newMovieId, movie.movie_title, "movie")};
    var edge = {group: "edges", data: getEdge(from.id, newMovieId)}
    return [newMovie, edge];
  })
  updateGraph(_.flatten(toAdd));
}
function addAssociationsFor(nodeObj) {
  var nodesToAdd = 0;
  switch(nodeObj.type) {
    case "director":
      nodesToAdd = _.filter(Demo.Movies, function(movie){
        return movie.director_name === nodeObj.name && !Demo.Nodes[toIdName(movie.movie_title)];
      });
      addMoviesForNode(nodeObj, nodesToAdd)
      break;
    case "movie":
      addActorsAndMovie(_.head(_.filter(Demo.Movies, {movie_title: nodeObj.name}))); // single movie
      break;
    case "actor":
      nodesToAdd = _.filter(Demo.Movies, function(movie){
        return movie.actor_3_name === nodeObj.name || movie.actor_2_name === nodeObj.name || movie.actor_1_name === nodeObj.name;
      });
      addMoviesForNode(nodeObj, nodesToAdd)
      break;

  }
}
function renderFilters() {
  $(".upload-file").hide();
  var genresHtml = `<option value="all">Genres</option>`, countryHtml = `<option value="all">Countries</option>`;
  _.map(_.keys(this.Map.byGenre), function(value){
    if (value){
      genresHtml+=`<option value="${value}">${value}</option>`;
    }
  })
  _.map(_.keys(this.Map.byCountry), function(value){
    if (value){
      countryHtml+=`<option value="${value}">${value}</option>`;
    }
  })
  this.$genres.html(genresHtml)
  this.$countries.html(countryHtml)
  $(".filters").show();
  $("select").selectpicker()
}
function renderChart() {
  Demo.scatterSeries[0].data = [];
  _.map(Demo.Movies, function(item){
    if (!isMovieValid(item))return;
    Demo.scatterSeries[0].data.push({
      x: parseFloat(item.title_year),
      y: parseFloat(item.imdb_score),
      movie: item.movie_title,
      gross: item.gross,
      budget: item.budget,
      id: item.id,
      color: COLORS[parseInt(item.imdb_score)*10]
    });
  });
  Chart.scatter.series = Demo.scatterSeries;
  Highcharts.chart($('.scatter-container')[0], Chart.scatter);
}
function initateEvents() {
  this.$browse.on("click", function () {
    $.ajax({
      type: "GET",
      url: "https://raw.githubusercontent.com/sundeepblue/movie_rating_prediction/master/movie_metadata.csv",
      dataType: "text/csv"
    }).always(function(data) {
      parseCSV(data.responseText)
    });
  });
  this.$genres.on("change", renderChart);
  this.$countries.on("change", renderChart);
}
Demo = this;
$(document).ready(function(){
  setParams();
  initateEvents();
  renderNodes();
})