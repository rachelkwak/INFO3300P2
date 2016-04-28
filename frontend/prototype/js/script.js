var margin = {top: 10, right: 10, bottom: 100, left: 40},
    margin2 = {top: 430, right: 10, bottom: 20, left: 40},
    width = 800 - margin.left - margin.right,
    height = 500 - margin.top - margin.bottom,
    height2 = 500 - margin2.top - margin2.bottom,
    barWidth = 220,
    barHeight = 20,
    labelHeight = 15;

var data,
    paths = [],
    scaledPaths = [],
    points = [],
    selectedPaths = [],
    //store clustering data
    centroidData = [],
    pointData = [];

var xScale = d3.time.scale().range([0, width]),
    x2Scale = d3.time.scale().range([0, width]),
    yScale = d3.scale.linear().range([height, 0]),
    y2Scale = d3.scale.linear().range([height2, 0]),
    barScale = d3.scale.linear().range([0, barWidth]);

 // xScale.tickFormat("%b %d %I:%M");
  //x2Scale.tickFormat("%b %d %I:%M");

var xAxis = d3.svg.axis().scale(xScale).orient("bottom"),
    xAxis2 = d3.svg.axis().scale(x2Scale).orient("bottom"),
    yAxis = d3.svg.axis().scale(yScale).orient("left");

var brush = d3.svg.brush()
    .x(x2Scale)
    .on("brush", brushed);

var line = d3.svg.line()
  //.interpolate("monotone")
  .x(function(d){return xScale(d.time);})
  .y(function(d){return yScale(d.rank);});

var line2 = d3.svg.line()
  //.interpolate("monotone")
  .x(function(d){return x2Scale(d.time);})
  .y(function(d){return y2Scale(d.rank);});

var svg = d3.select("#graph").append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom);

svg.append("defs").append("clipPath")
    .attr("id", "clip")
  .append("rect")
    .attr("width", width)
    .attr("height", height);

var focus = svg.append("g")
    .attr("class", "focus")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

var context = svg.append("g")
    .attr("class", "context")
    .attr("transform", "translate(" + margin2.left + "," + margin2.top + ")");

//create bar
var barSVG = d3.select("#bar")
.append("svg")
.attr("height", barHeight+labelHeight)
.attr("width", barWidth)
.append("g");


var barContainer = barSVG.append("rect")
.attr("class", "barContainer")
.attr("height", barHeight)
.attr("width", barWidth);

var bar = barSVG.append("rect").attr("class", "bar").attr("height", barHeight).attr('width', 0);

var barLabel = barSVG.append("text")
.attr("class", "barLabel")
.attr("y", barHeight+(labelHeight))
.attr("text-anchor", "middle");

var startMark = barSVG.append("line").attr("class", "mark").attr("y1", 0).attr("y2", barHeight);

var checkbox = d3.select("#checkbox");

d3.json("newData.json", function(error, json) {
  if (error) return console.warn(error);
  
  data = json.data;
  var lowestRank = 100;

  data.forEach(function(datum, index){
    datum.id = index;
    datum.started = new Date(datum.started);
    datum.end = new Date(datum.end);
    datum.startStar = +datum.startStar;

    datum.endStar = +datum.endStar;

    datum.ghStars.forEach(function(ghStar){
      ghStar.time = new Date(ghStar.time);
    });

    datum.hnRanks.forEach(function(hnRank){
      hnRank.time = new Date(hnRank.time);
      hnRank.rank = +hnRank.rank;

      //if (hnRank.rank > lowestRank) lowestRank = hnRank.rank;
    });
  });  

  //find start and end times
  var start = end = data[0].started;
  data.forEach(function(d){
    if (d.started < start) start = d.started;
    if (d.end > end) end = d.end;

  });

  xScale.domain([start, end]);
  yScale.domain([lowestRank, 1]);
  x2Scale.domain(xScale.domain());
  y2Scale.domain(yScale.domain());

  data.forEach(function(datum, index){
    var path = focus.append("path")
        .datum(datum.hnRanks)
        .attr("class", "line")
        .attr("d", line)
        .attr("data-projectID", index)
        .attr("onmouseover", "onLineHover(this)");

    var scaledPath = context.append("path")
        .datum(datum.hnRanks)
        .attr("class", "line")
        .attr("d", line2);

    var pointDatum = [];

    var point = focus.selectAll("point")
    .data(datum.ghStars)
    .enter()
    .append("circle")
    .attr("class", "point")
    .attr("cx", function(star){return xScale(star.time);})
    .attr("cy", function(star){
      //bad style, but create and store data about point here:
      var yCoord = findRank(star.time, index),
          d = {x: star.time, y: yScale.invert(yCoord)};
      pointDatum.push(d);
      return yCoord;
     })
    .attr("r", 3)
    .attr("data-projectID", index)
    .attr("onmouseover", "onPointHover(this)")
    .attr("style", "display:none;");

    paths.push(path);
    scaledPaths.push(scaledPath);
    points.push(point);
    pointData.push(pointDatum);
    selectedPaths.push(false);

    //for clustering:
    let threshold = 10000;
    cluster(threshold, index);
  });


  //add checkboxes
  var checkboxes = checkbox.selectAll("input").data(data).enter().append("div");
  checkboxes.append("input")
    .attr("type", "checkbox")
    .attr("id",function(d){return d.id;})
    .attr("class", "css-checkbox")
    .attr("value", function(d){return d.id;})
    .attr("onclick", 'clicked(this)');
  checkboxes.append("label")
    .attr("for",function(d){return d.id;})
    .attr("class", "css-label")
    .text(function(d){return d.ghName});
  
  //add axes
  focus.append("g")
      .attr("class", "x axis")
      .attr("transform", "translate(0," + height + ")")
      .call(xAxis);

  focus.append("g")
      .attr("class", "y axis")
      .call(yAxis);

  context.append("g")
      .attr("class", "x axis")
      .attr("transform", "translate(0," + height2 + ")")
      .call(xAxis2);

  //add brush
  context.append("g")
      .attr("class", "x brush")
      .call(brush)
    .selectAll("rect")
      .attr("y", -6)
      .attr("height", height2 + 7);
});

function brushed() {
  xScale.domain(brush.empty() ? x2Scale.domain() : brush.extent());
  //recalculate lines
  focus.selectAll(".line").attr("d", line);
  //recalculate points
  focus.selectAll(".point").attr("cx", function(d){return xScale(d.time);});
  //recalulate clusters
  focus.selectAll(".cluster").attr("cx", function(d){ return xScale(d.x); });
  focus.select(".x.axis").call(xAxis);
}



function findRank(time, id){
//Elaine's code
  var difference = Number.MAX_VALUE,
      nearest = 0,
      arr = data[id].hnRanks;

  for (var i = 0; i < arr.length - 1; i++){
    if (Math.abs(time - arr[i].time) < difference){
      nearest = i;
      difference = Math.abs(time - arr[i].time);
    }
  }

  var start = arr[nearest].time,
      end = arr[nearest+1].time,
      rankStart = arr[nearest].rank,
      rankEnd = arr[nearest+1].rank;

  var slope = (yScale(rankEnd) - yScale(rankStart))/(xScale(end) - xScale(start));
  return yScale(rankStart) + slope*xScale(time);
}


function clicked(selected){
  var display = "display:"+(selected.checked ? "":"none")+";";
  console.log(selected.checked);
  var id = selected.value;

  selectedPaths[id] = selected.checked;
  //highlight visible attributes
  paths[id].classed("visible", selected.checked);
  points[id].attr("style", display);
  scaledPaths[id].classed("visible", selected.checked);
  
  //bad style but whatevs
  //tab defined in page.js
  if (tab === "cluster") focus.selectAll("#cluster_"+id).attr("style", display);

}

function cluster(threshold, id){
  //create new centroids Array
  var centroids = centroidData[id] = new Array(1);
  var points = pointData[id];
  if (points.length == 0) return;
  var randomPoint = points[Math.floor(Math.random() * points.length)];
  centroids[0] = { x: randomPoint.x, y: randomPoint.y};
  var n = iterate(threshold, id);
  //run iterate
  while (n > 0){
    n = iterate(threshold, id);
  }

  //filter out empty centroids
  centroids = centroids.filter(function(c){return c.nElements > 0});
  var selection = focus.selectAll("#cluster_"+id).data(centroids, function(d){return d.x;});
  
  selection.enter()
    .append('circle')
    .attr('class', 'cluster')
    .attr('id','cluster_'+id)
    .attr("cx", function(d){ return xScale(d.x); })
    .attr("cy", function(d){ return yScale(d.y); })
    .attr("r", 7)
    .attr("style", "display:none;")
    .attr("onmouseover", "onClusterHover(this)")
    .attr("data-nElements", function(d){return d.nElements;})
    .attr("data-projectID", id);

  selection.exit().remove();

}

function iterate(threshold, id){
  //reassign points to clusters
  var n = 0,
      points = pointData[id],
      centroids = centroidData[id];

  points.forEach(function(point){
    var old = point.cluster;
    var nearest = centroids[findClosest(point, centroids)];
    var distance = Math.sqrt( 
      (nearest.x - point.x) * (nearest.x - point.x) +
      (nearest.y - point.y) * (nearest.y - point.y)
    ); 
    if (distance > threshold){
      var length = centroids.push({x: point.x, y: point.y});
      point.cluster = length - 1;
    }
    if (old != point.cluster) n++;
  });

  //recalculate centroids
  centroids.forEach(function (centroid, i) {
    var assignedPoints = 
      points.filter(function (point) { return point.cluster == i; });
    
    centroid.x = d3.mean(assignedPoints, function (point) { 
      //convert to Date object?
      return point.x; });
    centroid.y = d3.mean(assignedPoints, function (point) { return point.y; });
    centroid.nElements = assignedPoints.length;
  });
  
  return n;
}

function findClosest(point, centroids){
  var nearest;
  var shortestDistance = Number.MAX_VALUE;
  for (var i = 0; i < centroids.length; i++) {
    var c = centroids[i];
    var distance = Math.sqrt( 
      (c.x - point.x) * (c.x - point.x) +
      (c.y - point.y) * (c.y - point.y)
    );
  
    if (distance < shortestDistance) {
      shortestDistance = distance;
      nearest = i;
    }
  }
  point.cluster = nearest;
  return nearest;
}

function callCluster(){
  console.log('called cluster');
  
  selectedPaths.forEach(function(isSelected, i){
    var display = "display:"+(isSelected ? "":"none")+";";
    focus.selectAll("#cluster_"+i).attr("style", display);
  });

}

function clearCluster(){
  console.log(focus.selectAll('.cluster'));
  focus.selectAll(".cluster").attr("style", "display:none;");
}


//Create progress bar
function createBar(id, time){
  var d = data[id],
      nStars = d.startStar;
  //find number of stars
  d.ghStars.forEach(function(star, i){
    if (star.time <= time){ nStars++;}
  });
  
  //initialize bar
  barScale.domain([0, d.endStar]);

  //increase bar width
  bar.transition()
  .attr("width", barScale(nStars))
  .delay(500)
  .duration(1000)
  .ease('cubic-in-out');

  return nStars;
}

function onLineHover(selected){
  var id = +selected.getAttribute("data-projectID"),
      d = data[id],
      popup = document.getElementById("main_popup");
  //if line is not selected, don't do anything
  if (!selectedPaths[id]) return;
  if (popup.getAttribute("data-projectID") == id) return;
  popup.setAttribute("data-projectID", id);

  //initialize bar
  barScale.domain([0, d.endStar]);
  var xPos = barScale(d.startStar);
  
  bar.transition()
  .attr("width", xPos)
  .delay(500)
  .duration(1000)
  .ease('cubic-in-out');

  //initialize bar label
  barLabel.attr("x", xPos).text("start");
  startMark.attr("x1", xPos).attr("x2", xPos);

  //populate the popup
  document.getElementById("title").innerHTML = d.ghName;
  document.getElementById("title").setAttribute("href", d.ghUrl);
  document.getElementById("description").innerHTML = d.ghDesc;
  document.getElementById("comments").setAttribute("href", d.hnLink);
}

function onPointHover(selected){
  var id = +selected.getAttribute("data-projectID"),
      popup = document.getElementById("main_popup");
  //if line is not selected, don't do anything
  if (!selectedPaths[id]) return;
  if (popup.getAttribute("data-projectID") != id){onLineHover(selected);}
  var time = xScale.invert(selected.getAttribute("cx"));

  var nStars = createBar(id, time),
      rank = yScale.invert(selected.getAttribute("cy")); 

   //populate the popup
   document.getElementById("stars").innerHTML = nStars;  
   document.getElementById("rank").innerHTML = rank;
}

function onClusterHover(selected){
  var id = +selected.getAttribute("data-projectID"),
      time = xScale.invert(+selected.getAttribute('cx'));
  if (!selectedPaths[id]) return;

  var format = d3.time.format("%a %b %e %Y %H:%M:%S");

  document.getElementById("clusterRank").innerHTML = yScale.invert(+selected.getAttribute('cy'));
  document.getElementById("clusterTime").innerHTML = format(time);
  document.getElementById("nElements").innerHTML = selected.getAttribute('data-nElements');


}

function formatDate(date){

}