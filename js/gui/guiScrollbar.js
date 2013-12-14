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

function guiScrollbar( gui_name )
{
  this.constructor ( gui_name )   
  this.bgColor = "rgba(100, 10, 10, 0.3)";


  var w = this.width;
  var h = this.height;

  this.bar_width = w;
  this.bar_height = 20;

  this.bar_position = 0;

  console.log("scrollbar: " + w + " " + h );

  this.ready = false;

  this.once = false;

}
guiScrollbar.inherits ( guiRegion );

//-----------------------------


guiScrollbar.prototype.init = function(x, y, w, h)
{
  this.width = w;
  this.height = h;
  this.move( x, y );

  this.ready = true;

  this.bar_width = this.width;
  this.bar_height = 100;

  //this.bar_position = 0;

  this.bgColor = "rbga(150,150,150, 0.3)";
  this.barColor = "rbga(230,230,230, 0.3)";
}

//-----------------------------

guiScrollbar.prototype.hitTest = function(x, y)
{
  var u = numeric.dot( this.inv_world_transform, [x,y,1] );
  var r = null;

  if ( (0 <= u[0]) && (u[0] <= this.width) &&
       (0 <= u[1]) && (u[1] <= this.height) )
    r = this;

  return r;
}

//-----------------------------

guiScrollbar.prototype.mouseDown = function( button, x, y)
{

  //console.log("guiScrollbar");


  if (this.hitTest(x, y))
  {
    //console.log("  hit");
    return true;
  }

  return false;
}

//-----------------------------

guiScrollbar.prototype.mouseWheel = function(delta)
{
  //console.log("guiScrollbar.mouseWheel delta " + delta);
}


//-----------------------------

guiScrollbar.prototype.mouseWheelXY = function(delta, x, y)
{

  if (this.hitTest(x,y))
  {
    //console.log("guiScrollbar.mouseWheelXY hit");
  }

}

//-----------------------------

guiScrollbar.prototype.refresh = function() 
{

  if (this.parent)
  {
    this.height = this.parent.height;
    this.x = this.parent.width - this.width;
    this.y = 0;
    //this.move( this.x, this.y );
    //this.move( this.parent.width - this.width, 0 );
    this.ready = true;

    this.bar_width = this.width;
    this.bar_height = 100;

    //this.bar_position = 0;

    this.bgColor = "rbga(150,150,150, 0.3)";
    this.barColor = "rbga(230,230,230, 0.3)";
  }

}

//-----------------------------

guiScrollbar.prototype.updatePosition = function( r )
{
  var H = this.height - this.bar_height;
  this.bar_position = r*H;

  //console.log("guiScrollbar.updatePosition: bar_position " + this.bar_position);
}

guiScrollbar.prototype.getPosition = function( )
{
  var H = this.height - this.bar_height;

  var r = 0.0;
  if (H > 1)
    r = this.bar_position  / H;

  return r;

}

guiScrollbar.prototype.notifyPositionChange = function()
{

  var H = this.height - this.bar_height;
  var r = 0.0;
  if (H > 1)
    r = this.bar_position / H;

  var ev = { owner: this.name, type: "updatePosition", position : r };

  this.parent.handleEvent( ev );

}

guiScrollbar.prototype.draw = function()
{

  // update here
  //this.refresh();

  if (this.ready)
  {
    //g_painter.drawRectangle(this.x, this.y, this.width, this.height,
    g_painter.drawRectangle(0, 0, this.width, this.height,
                            1, "rgb(0,0,0)",
                            true, this.bgColor);

    //g_painter.drawRectangle(this.x, this.bar_position, this.bar_width, this.bar_height,
    g_painter.drawRectangle(0, this.bar_position, this.bar_width, this.bar_height,
                            0, "rgb(0,0,0)",
                            true, this.barColor);
  }
  else 
  {
    g_painter.drawRectangle(this.x, this.y, this.width, this.height,
                            0, "rgb(0,0,0)",
                            true, this.bgColor );
  }

}

 
