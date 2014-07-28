/*

    Copyright (C) 2013 Abram Connelly

    This file is part of bleepsix v2.

    bleepsix is free software: you can redistribute it and/or modify
    it under the terms of the GNU Affero General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    bleepsix is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU Affero General Public License for more details.

    You should have received a copy of the GNU Affero General Public License
    along with bleepsix.  If not, see <http://www.gnu.org/licenses/>.

    Parts based on bleepsix v1. BSD license
    by Rama Hoetzlein and Abram Connelly.

*/


var g_footprint_cache = {};
var g_footprint_location = {};
var g_footprint_library_map = {};

var g_footprint_location_ready = false;


var g_component_cache = {};
var g_component_location = {};
var g_component_library_map = {};

var g_component_location_ready = false;


function load_footprint_location( userId, sessionId  )
{

  $.ajaxSetup({ cache : false });
  var req = { op : "MOD_LOC" };
  if ((typeof userId !== "undefined") && (typeof userId !== "undefined"))
  {
    req = { op : "MOD_LOC", userId : userId, sessionId : sessionId  };
  }

  $.ajax({
    url : "cgi/libmodmanager.py",
    type: "POST",
    data: JSON.stringify(req),
    dataType: "json",
    success:
    function(data) {
      g_footprint_location = data;
      g_footprint_location_ready = true;
    },
    error:
    function(jqxr, textStatus, error ){
      console.log("FAIL");
      console.log(jqxr);
      console.log(textStatus);
      console.log(error);
    }
  });

}

function load_footprint_cache_part( name, location, userId, sessionId )
{

  if ( !(name in g_footprint_cache) )
  {

    g_board_controller.board.queued_display_footprint_count++;

    part_json = location;
    var brd = g_board_controller.board;

    var req = { op: "MOD_ELE", name : name, location : location };
    if ((typeof userId !== 'undefined') && (typeof sessionId !== 'undefined'))
    {
      req.userId = userId;
      req.sessionId = sessionId;
    }

    $.ajaxSetup({ cache : false });
    $.ajax({
      url: "cgi/libmodmanager.py",
      type: "POST",
      data: JSON.stringify(req),
      success:
      ( function(a) {
          return function(data) {
            brd.load_part(a, data);
          }
        }
      )(name),
      error:
      ( function(a) {
          return function(jqxhr, textStatus, error) {
            brd.load_part_error(a, jqxhr, textStatus, error);
          }
        }
      )(part_json)
    });

  }
  else 
  {
    //console.log(" load_footprint_cache_part: " + name + " already loaded");
  }
}

function load_component_location( userId, sessionId )
{

  $.ajaxSetup({ cache : false });
  var req = { op : "COMP_LOC" };
  if ((typeof userId !== "undefined") && (typeof userId !== "undefined"))
  {
    req = { op : "COMP_LOC", userId : userId, sessionId : sessionId  };
  }

  $.ajax({
    url : "cgi/libmodmanager.py",
    type: "POST",
    data: JSON.stringify(req),
    dataType: "json",
    success:
    function(data) {
      g_component_location = data;
      g_component_location_ready = true;
    },
    error:
    function(jqxr, textStatus, error ){
      console.log("FAIL");
      console.log(jqxr);
      console.log(textStatus);
      console.log(error);
    }
  });

}


function load_component_cache_part( name, location, userId, sessionId )
{
  if ( !(name in g_component_cache) )
  {
    g_schematic_controller.schematic.queued_display_component_count++;

    part_json = location;
    var schem = g_schematic_controller.schematic;

    var req = { op: "COMP_ELE", name : name, location: location };
    if ((typeof userId !== 'undefined') && (typeof sessionId !== 'undefined'))
    {
      req.userId = userId;
      req.sessionId = sessionId;
    }

    $.ajaxSetup({ cache : false });

    $.ajax({
      url: "cgi/libmodmanager.py",
      type: "POST",
      data: JSON.stringify(req),
      success:
      ( function(a) {
          return function(data) {
            schem.load_part(a, data);
          }
        }
      )(name),
      error:
      ( function(a) {
          return function(jqxhr, textStatus, error) {
            schem.load_part_error(a, jqxhr, textStatus, error);
          }
        }
      )(part_json)
    });

  }
  else 
  {
    console.log(" load_componet_cache_part: " + name + " already loaded");
  }
}


/*
 * from the accepted (as of 2013-12-21) answer from user John Millikin
 * http://stackoverflow.com/questions/105034/how-to-create-a-guid-uuid-in-javascript/105074#105074
 *
 */


function s4() {
    return Math.floor((1 + Math.random()) * 0x10000)
               .toString(16)
               .substring(1);
};

function guid() {
    return s4() + s4() + '-' + 
           s4() + '-' + 
           s4() + '-' +
           s4() + '-' + s4() + s4() + s4();
}

function simplecopy( src )
{
  return JSON.parse( JSON.stringify(src) );
}

function imageCache()
{
  this.image = {};
}

imageCache.prototype.add = function( name, path )
{
  var obj = {};

  //DEBUG
  //console.log("add: " + name + " " + path);

  obj.path = path;
  obj.ready = 0;

  obj.image = new Image();
  obj.image.onload = function() { 

    //DEBUG
    //console.log("image " + name + " " + path + " ready");

    obj.ready = 1; 

  };
  obj.image.src = path;


  this.image[name] = obj;
}

imageCache.prototype.remove = function( name )
{

  //DEBUG
  //console.log("remove " + name);

  if (name in this.image)
  {

    //DEBUG
    //console.log(" found it, deleting " + name);


    delete this.image[name];
  }
}

imageCache.prototype.draw = function( name, x, y, w, h )
{
  if (!(name in this.image))
  {
    console.log("WARNING: " + name + " not in imageCache ");
    return;
  }

  if ( !this.image[name].ready )
  {
    console.log("WARNING: " + name + " not ready");
    return;
  }

  var img = this.image[name].image;
  g_painter.drawImage( img, x, y, w, h );

}

if (typeof module !== 'undefined')
{
  module.exports = {
    s4 : s4,
    guid : guid,
    simplecopy : simplecopy
  };
}






// Converted from (a slightly buggy) python version
// from user Alex Martelli posted on Math 13 2010 5:31.
// http://stackoverflow.com/questions/2824478/shortest-distance-between-two-line-segments

//   distance between two segments in the plane:
//   one segment is (x11, y11) to (x12, y12)
//   the other is   (x21, y21) to (x22, y22)
//
function segments_distance(x11, y11, x12, y12, x21, y21, x22, y22)
{

  if (segments_intersect(x11, y11, x12, y12, x21, y21, x22, y22))
    return 0;

  // try each of the 4 vertices w/the other segment
  var distances = [];
  distances.push(point_segment_distance(x11, y11, x21, y21, x22, y22));
  distances.push(point_segment_distance(x12, y12, x21, y21, x22, y22));
  distances.push(point_segment_distance(x21, y21, x11, y11, x12, y12));
  distances.push(point_segment_distance(x22, y22, x11, y11, x12, y12));

  return Math.min.apply(null, distances);

}

// whether two segments in the plane intersect:
// one segment is (x11, y11) to (x12, y12)
// the other is   (x21, y21) to (x22, y22)
//
function segments_intersect(x11, y11, x12, y12, x21, y21, x22, y22)
{
  var local_eps = 0.00001;
  var dx1 = x12 - x11;
  var dy1 = y12 - y11;
  var dx2 = x22 - x21;
  var dy2 = y22 - y21;
  var delta = dx2 * dy1 - dy2 * dx1;

  if (Math.abs(delta) < local_eps)
    return false;

  var s = (dx1 * (y21 - y11) + dy1 * (x11 - x21)) / delta;
  var t = (dx2 * (y11 - y21) + dy2 * (x21 - x11)) / (-delta);

  return (0 <= s) && (s  <= 1) && (0 <= t) && (t  <= 1);

}

function point_segment_distance(px, py, x1, y1, x2, y2)
{
  var local_eps = 0.00001;
  var dx = x2 - x1;
  var dy = y2 - y1;
  if ( (Math.abs(dx - dy) < local_eps) &&
       (Math.abs(dy) < local_eps) )
    return Math.sqrt(((px-x1)*(px-x1) + (py-y1)*(py-y1)));

  var t = ((px - x1) * dx + (py - y1) * dy) / (dx*dx + dy*dy);

  if (t < 0)
  {
    dx = px - x1;
    dy = py - y1;
  }
  else if (t > 1)
  {
    dx = px - x2;
    dy = py - y2;
  }
  else
  {
    var near_x = x1 + t * dx;
    var near_y = y1 + t * dy;
    dx = px - near_x;
    dy = py - near_y;
  }

  return Math.sqrt(dx*dx + dy*dy);

}


