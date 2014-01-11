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

function guiIcon( name )
{
  this.constructor(name);
  this.selected = false;

  // debugging...
  this.uniq = parseInt(256.0*Math.random());
  //this.bgColor = "rgba(" + this.uniq + ",0,0," + "0.2)";
  //this.bgColor = "rgba(0,0," + this.uniq +",0.7)";
  this.bgColor = "rgba(0," + this.uniq +",0,0.5)";

  this.drawShape = null;

  //console.log("uniq: " + this.uniq);
}
guiIcon.inherits( guiRegion );


guiIcon.prototype.mouseDown = function(button, x, y)
{
  console.log("guiIcon.mouseDown(" + this.name + "): " + button + " " + x + " " + y);

  var ev = { type: "mouseDown", owner: this.name, ref: this, button : button, x : x, y : y };

  this.parent.handleEvent(ev);

  return true;
}

guiIcon.prototype.doubleClick = function(ev, x, y)
{
  //console.log("guiIcon.doubleClick(" + this.name + ")");
  //console.log(ev);

  var ev = { type: "doubleClick", owner: this.name, button : ev.button, x : x, y : y };

  this.parent.handleEvent(ev);

  return true;
}

guiIcon.prototype.draw = function()
{

  g_painter.drawRectangle( 0, 0, this.width, this.height,  
                           0, "rgb(0,0,0)", 
                           true, this.bgColor );

  if (this.selected)
  {
    g_painter.drawRectangle( 0, 0, this.width, this.height,  
                             1, "rgb(0,0,0)" );
  }



  if (this.drawShape)
    this.drawShape();
}

