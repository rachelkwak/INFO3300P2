var margin = {top: 10, right: 10, bottom: 100, left: 40},
    margin2 = {top: 430, right: 10, bottom: 20, left: 40},
    width = 960 - margin.left - margin.right,
    height = 500 - margin.top - margin.bottom,
    height2 = 500 - margin2.top - margin2.bottom;

var data,
    paths = [],
    scaledPaths = [],
    points = [],
    selectedProjects;

//var parseDate = d3.time.format("%Y-%m-%dT%H:%M:%S-%Z").parse;
var parseDate = d3.time.format("%b %Y").parse;

var xScale = d3.time.scale().range([0, width]),
    x2Scale = d3.time.scale().range([0, width]),
    yScale = d3.scale.linear().range([height, 0]),
    y2Scale = d3.scale.linear().range([height2, 0]);

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

var checkbox = d3.select("#checkbox");

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

d3.json("testCases.json", function(error, json) {
  if (error) return console.warn(error);
  
  data = json.data;
  var n = 0;
  var lowestRank = 0;

  data.forEach(function(datum){
    datum.id = n++;
    datum.started = new Date(datum.started);
    datum.end = new Date(datum.end);
    datum.startStar = +datum.startStar;
    datum.endStar = +datum.endStar;

    datum.ghStars.forEach(function(ghStar){
      ghStar.time = new Date(ghStar.time);
    });

    datum.hnRanks.forEach(function(hnRank){
      hnRank.time = new Date(hnRank.time);
      hnRank.stars = +hnRank.stars;
      hnRank.rank = +hnRank.rank;
      hnRank.starsIncreased = +hnRank.starsIncreased;

      if (hnRank.rank > lowestRank) lowestRank = hnRank.rank;
    });
  });  

//fix
  xScale.domain([data[0].started, data[0].end]);
  yScale.domain([lowestRank, 1]);
  x2Scale.domain(xScale.domain());
  y2Scale.domain(yScale.domain());

  data.forEach(function(datum){
    var path = focus.append("path")
        .datum(datum.hnRanks)
        .attr("class", "line")
        .attr("d", line)
        .classed("visible", false);

    var scaledPath = context.append("path")
        .datum(datum.hnRanks)
        .attr("class", "line")
        .attr("d", line2)
        .classed("visible", false);

    var point = focus.selectAll("point")
    .data(datum.ghStars)
    .enter()
    .append("circle")
    .attr("class", "point")
    .attr("cx", function(star){return xScale(star.time);})
    .attr("cy", function(star){
      return findRank(star.time);
     })
    .attr("r", 3)
    .classed("visible", false);

    paths.push(path);
    scaledPaths.push(scaledPath);
    points.push(point);
  });

  //add checkbox

  checkbox.selectAll("input").data(data).enter()
  .append("label")
    .attr("for","project")
    .text(function(d){return d.ghName})
  .append("input")
    .attr("type", "checkbox")
    .attr("name","project")
    .attr("value", function(d){return d.id;})
    .attr("onclick", 'clicked(this)');
  

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
  focus.select(".x.axis").call(xAxis);
}

function findRank(start, end, rankStart, rankEnd, time){
  var slope = (yScale(rankEnd) - yScale(rankStart))/(xScale(end) - xScale(start));
  return yScale(rankStart) + slope*xScale(time);
}

function findRank(time){
//Elaine's code
  var difference = Number.MAX_VALUE,
      nearest = 0,
      arr = data[0].hnRanks;

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

  //Rachel's code
  /*var smallestDiff = nextSmallestDiff = Number.MAX_SAFE_INTEGER;
    var smallestTime, nextSmallestTime;
    

    data.forEach(function(datum){
      datum.hnRanks.forEach(function(dat){
      var difference = Math.abs(dat.time-time);
      if (difference < smallestDiff) {
        nextSmallestDiff = smallestDiff;
        nextSmallestTime = smallestTime;
        smallestDiff = difference;
        smallestTime = dat.time;
      }
      });   
  });


  if(smallestTime > nextSmallestTime){
    var temp = smallestTime;
    smallestTime = nextSmallestTime;
    nextSmallestTime = temp;
  }

  console.log(smallestTime);
  console.log(nextSmallestTime);

  var startRank, endRank;

  data.forEach(function(datum){
    datum.hnRanks.forEach(function(tick){
      if (tick.time == smallestTime){
        startRank = tick.rank;
      } else if (tick.time == nextSmallestTime) {
        endRank = tick.rank;
      }
    });
  });
      
  var slope = (endRank-startRank)/(nextSmallestTime-smallestTime);
  var b = startRank-slope*smallestTime;
  console.log(slope);
  console.log(b);

  var finalRank = slope*time+b;
  return finalRank;*/


}


function clicked(selected){

  var id = selected.value;
  //highlight visible attributes
  paths[id].classed("visible", function(){return selected.checked});
  points[id].classed("visible", function(){return selected.checked});
  scaledPaths[id].classed("visible", function(){return selected.checked});
}