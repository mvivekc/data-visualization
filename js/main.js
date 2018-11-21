var MinYear = 1960;
var MaxYear = (new Date()).getFullYear();
var Chart = {
  "chart": {
    "type": "scatter",
    "zoomType": "xy"
  },
  "title": {
    "text": "Year vs IMDB Rating of Movies"
  },
  "subtitle": {
    "text": "Source: Github link"
  },
  "xAxis": {
    min: MinYear,
    max: MaxYear,
    "title": {
      "enabled": true,
      "text": "Year(YYYY)"
    },
    "startOnTick": true,
    "endOnTick": true,
    "showLastLabel": true
  },
  "yAxis": {
    min: 0, 
    max: 10,
    "title": {
      "text": "IMDB Rating ( out of 10 )"
    }
  },
  "legend": {
    "layout": "vertical",
    "align": "left",
    "verticalAlign": "top",
    "x": 100,
    "y": 70,
    "floating": true,
    "borderWidth": 1
  },
  "plotOptions": {
    "scatter": {
      "marker": {
        "radius": 2,
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
    formatter: function(point) {
      var tooltip = "Movie</b>: "+this.point.movie
      if (!isNaN(parseInt(this.point.gross))) {
      tooltip += ", Gross: "+nFormatter(this.point.gross, 2);
      }
      if (!isNaN(parseInt(this.point.budget))) {
      tooltip += ", Budget: "+nFormatter(this.point.budget, 2);
      }
      tooltip += ", Rating: "+this.point.y+", Year: "+this.point.x;
      return tooltip;
    }
  }
}

function nFormatter(num, digits) {
  var si = [
    { value: 1, symbol: "" },
    { value: 1E3, symbol: "k" },
    { value: 1E6, symbol: "M" },
    { value: 1E9, symbol: "G" },
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
function setParams() {
  this.$browse = $("#csv-file");
  this.$genres = $(".genres");
  this.$countries = $(".country");

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
  this.Movies = {}
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
  this.Series = [
    {
      name: "Movies",
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
  renderNodes();
}
function renderNodes() {
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
          'background-color': 'data(faveColor)',
          'color': '#fff'
        })
      .selector(':selected')
        .css({
          'border-width': 3,
          'border-color': '#333'
        })
      .selector('edge')
        .css({
          'opacity': 0.666,
          'width': 'mapData(strength, 70, 100, 2, 6)',
          'line-color': 'data(faveColor)',
        })
      .selector('.faded')
        .css({
          'opacity': 0.25,
          'text-opacity': 0
        }),

    elements: {
      nodes: [
        /*{ data: { id: 'j', name: 'Jerry', weight: 65, faveColor: '#6FB1FC', faveShape: 'triangle' } },
        { data: { id: 'e', name: 'Elaine', weight: 45, faveColor: '#EDA1ED', faveShape: 'ellipse' } },
        { data: { id: 'k', name: 'Kramer', weight: 75, faveColor: '#86B342', faveShape: 'octagon' } },
        { data: { id: 'g', name: 'George', weight: 70, faveColor: '#F5A45D', faveShape: 'rectangle' } }*/
      ],
      edges: [
        /*{ data: { source: 'j', target: 'e', faveColor: '#ccc', strength: 80 } },
        { data: { source: 'j', target: 'k', faveColor: '#ccc', strength: 80 } },
        { data: { source: 'j', target: 'g', faveColor: '#ccc', strength: 80 } },
        { data: { source: 'e', target: 'j', faveColor: '#ccc', strength: 80 } },
        { data: { source: 'e', target: 'k', faveColor: '#ccc', strength: 80 }, classes: 'questionable' },
        { data: { source: 'k', target: 'j', faveColor: '#ccc', strength: 80 } },
        { data: { source: 'k', target: 'e', faveColor: '#ccc', strength: 80 } },
        { data: { source: 'k', target: 'g', faveColor: '#ccc', strength: 80 } },
        { data: { source: 'g', target: 'j', faveColor: '#ccc', strength: 80 } }*/
      ]
    },

    /*cy.add([
      {group: "nodes", data: { id: 'v', name: 'Vivek', weight: 65, faveColor: '#ccc', faveShape: 'triangle' }},
      { group: "edges", data: { source: 'j', target: 'v', faveColor: '#ccc', strength: 80 }}
    ])
    cy.layout({
      name: 'cose'
    }).run()
    */
    ready: function(){
      window.cy = this;
    }
  });
}
function renderFilters() {
  $(".upload-file").hide();
  var genresHtml = `<option value="all">All</option>`, countryHtml = `<option value="all">All</option>`;
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
  //$("select.selectpicker").selectpicker()
}
function renderChart() {
  Demo.Series[0].data = [];
  _.map(Demo.Movies, function(item){
    if (!isMovieValid(item))return;
    Demo.Series[0].data.push({x: parseFloat(item.title_year), y: parseFloat(item.imdb_score), movie: item.movie_title, gross: item.gross, budget: item.budget});
  });
  Chart.series = Demo.Series;
  Highcharts.chart($('.scatter-container')[0], Chart);
}
function initateEvents() {
  this.$browse.on("change", readCsv(parseCSV));
  this.$genres.on("change", renderChart);
  this.$countries.on("change", renderChart);
}
Demo = this;
$(document).ready(function(){
  setParams();
  initateEvents();
})