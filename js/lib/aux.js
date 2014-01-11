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

function imageCache()
{
  this.image = {};
}

imageCache.prototype.add = function( name, path )
{
  var obj = {};

  //DEBUG
  console.log("add: " + name + " " + path);

  obj.path = path;
  obj.ready = 0;

  obj.image = new Image();
  obj.image.onload = function() { 

    //DEBUG
    console.log("image " + name + " " + path + " ready");

    obj.ready = 1; 

  };
  obj.image.src = path;


  this.image[name] = obj;
}

imageCache.prototype.remove = function( name )
{

  //DEBUG
  console.log("remove " + name);

  if (name in this.image)
  {

    //DEBUG
    console.log(" found it, deleting " + name);


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

  if ( !this.image.ready )
  {
    console.log("WARNING: " + name + " not in ready");
    return;
  }

  var img = this.image[name].image;
  g_painter.drawImage( img, x, y, w, h );

}

