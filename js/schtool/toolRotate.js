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


function toolRotate( x, y, type )
{
  x = ( typeof x !== 'undefined' ? x : 0 );
  y = ( typeof x !== 'undefined' ? y : 0 );

  // default to noconn
  type = ( typeof type !== 'undefined' ? type : 'ccw' );

  this.rotateType = type;

  this.mouse_down = false;
  this.mouse_cur_x = x;
  this.mouse_cur_y = y;

  this.mouse_world_xy = g_painter.devToWorld(x, y);
  this.mouse_drag_flag = false;

  this.cursorSize = 6;
  this.cursorWidth = 1;

  this.mouse_world_xy = g_snapgrid.snapGrid( this.mouse_world_xy );

  var ele = document.getElementById("canvas");

  if (type == "ccw")
  {
    ele.style.cursor = "url('img/cursor_custom_ccw_b_s24.png') 4 3, cursor";
  }
  else if (type == "cw")
  {
    ele.style.cursor = "url('img/cursor_custom_cw_b_s24.png') 4 3, cursor";
  }

}

//-----------------------------


toolRotate.prototype.drawOverlay = function()
{

  var s = this.cursorSize / 2;
  g_painter.drawRectangle( this.mouse_world_xy["x"] - s,
                           this.mouse_world_xy["y"] - s,
                           this.cursorSize ,
                           this.cursorSize ,
                           this.cursorWidth ,
                           "rgb(128, 128, 128 )" );


  g_schematic_controller.display_text = "x: " + this.mouse_world_xy.x + ", y: " + this.mouse_world_xy.y;

}

//-----------------------------

toolRotate.prototype.dist1 = function( xy0, xy1 )
{

  var dx = Math.abs( xy0["x"] - xy1["x"] );
  var dy = Math.abs( xy0["y"] - xy1["y"] );

  return Math.max(dx, dy);

}

//-----------------------------

toolRotate.prototype.mouseDown = function( button, x, y ) 
{
  this.mouse_down = true;

  if (button == 3)
    this.mouse_drag_flag = true;

  if (button == 1)
  {
    var wc = g_painter.devToWorld(x, y);
    wc = g_snapgrid.snapGrid(wc);
    var wx = wc["x"];
    var wy = wc["y"];

    var id = g_schematic_controller.schematic.pick( wx, wy );
    if ( id && (id["ref"]["type"] == "component") )
    {

      var ccw_flag = true;

      if      (this.rotateType == "ccw") ccw_flag = true;
      else if (this.rotateType == "cw")  ccw_flag = false;

      var op = { source: "sch", destination: "sch"  }
      op.action = "update";
      op.type = "componentRotate90";
      op.id = id.id;
      op.data = { ccw : ccw_flag };
      g_schematic_controller.opCommand( op );

      // Hand back control to toolNav
      //
      g_schematic_controller.tool = new toolNav(x, y);
      g_schematic_controller.guiToolbox.defaultSelect();
      g_painter.dirty_flag = true;

      var ele = document.getElementById("canvas");
      ele.style.cursor = "auto";

      return;
    }

  }

}

//-----------------------------

toolRotate.prototype.mouseUp = function( button, x, y ) 
{
  this.mouse_down = false;

  if (button == 3)
    this.mouse_drag_flag = false;

}

//-----------------------------


toolRotate.prototype.mouseMove = function( x, y ) 
{

  if ( this.mouse_drag_flag ) 
     this.mouseDrag ( x - this.mouse_cur_x, y - this.mouse_cur_y );


  this.mouse_cur_x = x;
  this.mouse_cur_y = y;

  this.mouse_world_xy = g_painter.devToWorld( this.mouse_cur_x, this.mouse_cur_y );

  this.mouse_world_xy = g_snapgrid.snapGrid( this.mouse_world_xy );

  g_painter.dirty_flag = true;

  if ( ! this.mouse_drag_flag ) 
  {

  }

}

//-----------------------------

toolRotate.prototype.mouseDrag = function( dx, dy ) 
{
  g_painter.adjustPan ( dx, dy );
}

//-----------------------------

toolRotate.prototype.mouseWheel = function( delta )
{
  delta = clamp(delta, -1, 1);
  g_painter.adjustZoom ( this.mouse_cur_x, this.mouse_cur_y, delta );
}

//-----------------------------

toolRotate.prototype.keyDown = function( keycode, ch, ev )
{
  if ((ch == 'Q') || (keycode == 27))
  {
    g_schematic_controller.tool = new toolNav( this.mouse_cur_x, this.mouse_cur_y );
    g_schematic_controller.guiToolbox.defaultSelect();

    var ele = document.getElementById("canvas");
    ele.style.cursor = "auto";

    g_painter.dirty_flag = true;
  }
}

//-----------------------------

toolRotate.prototype.keyUp = function( keycode, ch, ev ) { }
