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

function guiIcon( name )
{
  this.constructor(name);
  this.selected = false;

  // debugging...
  this.uniq = parseInt(256.0*Math.random());
  //this.bgColor = "rgba(" + this.uniq + ",0,0," + "0.2)";
  //this.bgColor = "rgba(0,0," + this.uniq +",0.7)";
  this.bgColor = "rgba(0," + this.uniq +",0,0.5)";
  //this.bgColor = "rgba(0,0,0,0.2)";
  //this.fgColor = "rgb(0,0,0)";
  this.fgColor = "rgb(0,0,0)";

  this.dimColor = "rgba(0,0,0,0.9)";

  this.bgColorTT = this.bgColor;

  this.drawShape = null;

  this.box_highlight=true;
}
guiIcon.inherits( guiRegion );


/*
guiIcon.prototype.mouseMove = function(button, x, y)
{
  var ev = { type: "mouseMove", owner: this.name, ref: this, button : button, x : x, y : y };

  console.log("mousemove...");

  this.parent.handleEvent(ev);

  return true;
}
*/

guiIcon.prototype.mouseDown = function(button, x, y)
{
  var ev = { type: "mouseDown", owner: this.name, ref: this, button : button, x : x, y : y };

  this.parent.handleEvent(ev);

  return true;
}

guiIcon.prototype.doubleClick = function(ev, x, y)
{
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

    if (this.box_highlight) {
      g_painter.drawRectangle( 0, 0, this.width, this.height,  
                               1, this.fgColor );
    } else {
      g_painter.drawRectangle( 1, 1, this.width-2, this.height-2,
                               0, "rgb(0,0,0)", true, this.dimColor );
    }
  }

  if (this.tooltip_display) {
    this.tooltip_width = this.tooltip_text.length * this.tooltip_font_size/1.6;
    g_painter.drawRectangle( this.tooltip_x, this.tooltip_y,
                             this.tooltip_width, this.tooltip_height,
                             0, "rgba(128,128,128,0.5)",
                             true, this.bgColorTT);
    g_painter.drawText( this.tooltip_text, this.tooltip_x, this.tooltip_y,
                        this.fgColor, this.tooltip_font_size, 0, 'L', 'T');

    var tx = this.tooltip_x;
    var ty = this.tooltip_y;
    var sz = this.tooltip_height;
    var p = [ [ 0, sz/4], [ 0, 3*sz/4 ], [ -sz/2, sz/2] ];
    g_painter.drawBarePolygon( p, tx, ty, this.bgColorTT );
  }

  if (this.drawShape)
    this.drawShape();
}

