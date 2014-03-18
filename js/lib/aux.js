/*

    Copyright (C) 2013 Abram Connelly

    This file is part of bleepsix v2.

    bleepsix is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    bleepsix is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with bleepsix.  If not, see <http://www.gnu.org/licenses/>.

    Parts based on bleepsix v1. BSD license
    by Rama Hoetzlein and Abram Connelly.

*/


/*
 * from the accepted (as of 2013-12-21) answer from user John Millikin
 * http://stackoverflow.com/questions/105034/how-to-create-a-guid-uuid-in-javascript/105074#105074
 *
 */

var g_footprint_cache = {};
var g_footprint_location = {};
var g_footprint_library_map = {};

var g_footprint_location_ready = false;


var g_component_cache = {};
var g_component_location = {};
var g_component_library_map = {};

var g_component_location_ready = false;


function load_footprint_location( footprint_location_json )
{

  //console.log("load_footprint_location");

  $.ajaxSetup({ cache : false });
  $.getJSON( footprint_location_json,
    function(data) {
      g_footprint_location = data;
      g_footprint_location_ready = true;

     //console.log("module location data loaded:");
     //console.log(g_footprint_location);

    }
  ).fail(
    function(jqxhr, textStatus, error) {
      console.log("could not load " + footprint_location_json + ": " + error);
  });

}

function load_footprint_cache_part( name, location )
{

  //console.log("load_footprint_cache_part: " + name + ", " + location);

  if ( !(name in g_footprint_cache) )
  {
    g_board_controller.board.queued_display_footprint_count++;

    //part_json = "json/" + name + ".json";
    part_json = location;
    var brd = g_board_controller.board;

    //console.log("load_footprint_cache_part: footprint " + name + " " + location );

    $.ajaxSetup({ cache : false });
    $.getJSON( part_json,
      ( function(a) {
          return function(data) {
            brd.load_part(a, data);
          }
        }
      )(name)
    ).fail(
      ( function(a) {
        return function(jqxhr, textStatus, error) {
          brd.load_part_error(a, jqxhr, textStatus, error);
        }
      }
      )(part_json)
    );

  }
  else 
  {
    //console.log(" load_footprint_cache_part: " + name + " already loaded");
  }
}

function load_component_location( component_location_json )
{
  $.ajaxSetup({ cache : false });
  //var component_location_json = "json/component_location.json";
  $.getJSON( component_location_json,
    function(data) {
      g_component_location = data;
      g_component_location_ready = true;

      //console.log(component_location_json + " loaded");
      //console.log(g_component_location);
    }
  ).fail(
    function(jqxhr, textStatus, error) {
      console.log("could not load " + component_location_json + ": " + error);
    }
  );


}


function load_component_cache_part( name, location )
{
  if ( !(name in g_component_cache) )
  {
    g_schematic_controller.schematic.queued_display_component_count++;

    //part_json = "json/" + name + ".json";
    part_json = location;
    var schem = g_schematic_controller.schematic;

    $.ajaxSetup({ cache : false });
    $.getJSON( part_json,
      ( function(a) {
          return function(data) {
            schem.load_part(a, data);
          }
        }
      )(name)
    ).fail(
      ( function(a) {
        return function(jqxhr, textStatus, error) {
          schem.load_part_error(a, jqxhr, textStatus, error);
        }
      }
      )(part_json)
    );

  }
  else 
  {
    console.log(" load_componet_cache_part: " + name + " already loaded");
  }
}



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


