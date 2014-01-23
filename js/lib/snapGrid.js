
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


function snapGrid(active_flag , unit, spacing)
{
  this.active = active_flag;
  this.unit = unit;
  this.spacing = parseFloat(spacing);
  this.cursorSize = 6;
  this.cursorWidth = 1;
  this.color = "rgb(128,128,128)";
}

snapGrid.prototype.snapGrid = function( xy )
{
  var snap_pos = {};

  snap_pos["x"] = parseFloat( xy["x"] );
  snap_pos["y"] = parseFloat( xy["y"] );

  if ( this.active )
  {
    snap_pos["x"] = this.spacing * Math.round( snap_pos["x"] / this.spacing );
    snap_pos["y"] = this.spacing * Math.round( snap_pos["y"] / this.spacing );
  }

  return snap_pos;
}

snapGrid.prototype.drawCursor = function( xy )
{
  var s = this.cursorSize / 2;

  g_painter.drawRectangle( xy.x - s,
                           xy.y - s,
                           this.cursorSize ,
                           this.cursorSize ,
                           this.cursorWidth ,
                           this.color );

}


