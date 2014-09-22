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

function toolScrollbar( x, y, scrollbar, orig_tool ) 
{
  x = ( typeof x !== 'undefined' ? x : 0 );
  y = ( typeof x !== 'undefined' ? y : 0 );

  //finished_callback = ( typeof finished_callback !== 'undefined' ? finished_callback : toolNav );

  this.orig_tool = orig_tool;

  console.log("toolScrollbar constructor");

  this.mouse_cur_x = x;
  this.mouse_cur_y = y;

  this.mouse_start_x = x;
  this.mouse_start_y = y;


  this.scrollbar = scrollbar;

  this.p = scrollbar.getPosition();

  this.effective_height = scrollbar.height - scrollbar.bar_height;
  if (this.effective_height < 1)
    this.effective_height = 1;

  this.begin_y = y - this.p*this.effective_height;
  this.end_y = this.begin_y + this.effective_height;

  //this.start_y = this.mouse_start_y;
  //this.end_y = this.mouse_start_y + this.effective_height;

}


toolScrollbar.prototype.update= function(x, y)
{

  console.log("toolScrollBar.update");

  this.mouse_cur_x = x;
  this.mouse_cur_y = y;
}

toolScrollbar.prototype.drawOverlay = function()
{
}



toolScrollbar.prototype.mouseDown = function( button, x, y ) 
{

  console.log("toolScrollbar.mouseDown: handing back control ");

  if (typeof this.orig_tool === 'undefined' )
  {
    g_schematic_controller.tool = new toolNav(x, y);
    g_painter.dirty_flag = true;
  }
  else
  {
    g_schematic_controller.tool = this.orig_tool;
    g_schematic_controller.tool.update(x,y);
    g_painter.dirty_flag = true;
  }


  // ignore
  return;
}

toolScrollbar.prototype.mouseUp = function( button, x, y ) 
{

  console.log("toolScrollbar.mouseUp: handing back to toolNav");

  if (typeof this.orig_tool === 'undefined' )
  {
    if (g_controller.type == "schematic")
    {
      g_controller.tool = new toolNav(x, y);
    }
    else if (g_controller.type == "board")
    {
      g_controller.tool = new toolBoardNav(x, y);
    }

    g_painter.dirty_flag = true;
  }
  else
  {
    //g_schematic_controller.tool = this.orig_tool;
    //g_schematic_controller.tool.update(x,y);
    g_controller.tool = this.orig_tool;
    if ( typeof g_controller.tool.update !== 'undefined' )
    {
      g_controller.tool.update(x,y);
    }
    g_painter.dirty_flag = true;
  }

}

function clamp(n, min, max)
{
  return Math.min(Math.max(n, min), max);
}

toolScrollbar.prototype.mouseMove = function( x, y ) 
{

  //console.log("toolScrollBar.mouseMove");

  this.mouse_cur_x = x;
  this.mouse_cur_y = y;

  // update scroll bar and the rest

  //var p = clamp((y - this.start_y) / this.effective_height, 0, 1);
  var p = clamp((y - this.begin_y) / this.effective_height, 0, 1);

  this.scrollbar.updatePosition(p);
  this.scrollbar.notifyPositionChange();

  g_painter.dirty_flag = true;

}

// TESTING

toolScrollbar.prototype.keyDown = function( keycode, ch, ev )
{
  console.log("toolScrollbar.keyDown: " + keycode + " " + ch );
  return;
}

toolScrollbar.prototype.keyUp = function( keycode, ch, ev )
{
  console.log("toolScrollbar keyUp: " + keycode + " " + ch );
}


