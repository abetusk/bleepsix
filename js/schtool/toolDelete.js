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


function toolDelete( x, y, type, placeOption )
{
  x = ( typeof x !== 'undefined' ? x : 0 );
  y = ( typeof x !== 'undefined' ? y : 0 );

  // default to noconn
  type = ( typeof type !== 'undefined' ? type : 'noconn' );

  // default to once
  placeOption = ( typeof placeOption !== 'undefined' ? placeOption : 'once' );

  this.connType = type;

  this.mouse_down = false;
  this.mouse_cur_x = x;
  this.mouse_cur_y = y;

  this.mouse_world_xy = g_painter.devToWorld(x, y);
  this.mouse_drag_flag = false;

  this.cursorSize = 6;
  this.cursorWidth = 1;

  this.mouse_world_xy = g_snapgrid.snapGrid( this.mouse_world_xy );

  var ele = document.getElementById("canvas");

  if (type == "noconn")
  {
    ele.style.cursor = "url('img/cursor_custom_trash_b_s24.png') 4 3, cursor";
  }

}

//-----------------------------


toolDelete.prototype.drawOverlay = function()
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

toolDelete.prototype.dist1 = function( xy0, xy1 )
{

  var dx = Math.abs( xy0["x"] - xy1["x"] );
  var dy = Math.abs( xy0["y"] - xy1["y"] );

  return Math.max(dx, dy);

}

//-----------------------------

toolDelete.prototype.mouseDown = function( button, x, y ) 
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

    var id_ref_orig = g_schematic_controller.schematic.pick( wx, wy );

    if (id_ref_orig) {
      var id_ref = simplecopy( id_ref_orig );
      var op = { source: "sch", destination : "sch" };
      op.action = "delete";
      op.type = "group";
      op.id = [ id_ref.id ];
      op.data = { element : [ id_ref.ref ] };
      g_schematic_controller.opCommand( op );
      g_schematic_controller.schematicUpdate = true;

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

toolDelete.prototype.mouseUp = function( button, x, y ) 
{
  this.mouse_down = false;

  if (button == 3)
    this.mouse_drag_flag = false;

}

//-----------------------------


toolDelete.prototype.mouseMove = function( x, y ) 
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

toolDelete.prototype.mouseDrag = function( dx, dy ) 
{
  g_painter.adjustPan ( dx, dy );
}

//-----------------------------

toolDelete.prototype.mouseWheel = function( delta )
{
  g_painter.adjustZoom ( this.mouse_cur_x, this.mouse_cur_y, delta );
}

//-----------------------------

toolDelete.prototype.keyDown = function( keycode, ch, ev )
{
  if ((ch == 'Q') || (keycode == 27))
  {
    console.log("handing back to toolNav");
    g_schematic_controller.tool = new toolNav( this.mouse_cur_x, this.mouse_cur_y );
    g_schematic_controller.guiToolbox.defaultSelect();

    var ele = document.getElementById("canvas");
    ele.style.cursor = "auto";

    g_painter.dirty_flag = true;
  }
}

//-----------------------------

toolDelete.prototype.keyUp = function( keycode, ch, ev ) { }
