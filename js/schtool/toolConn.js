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


function toolConn( x, y, type, placeOption )
{
  console.log("toolConn");

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

  //this.placeOption = "once";  // "persistent" ?
  this.placeOption = placeOption;  // "persistent" ?

  this.mouse_world_xy = g_snapgrid.snapGrid( this.mouse_world_xy );

  var ele = document.getElementById("canvas");

  console.log(type);

  if (type == "noconn")
  {
    ele.style.cursor = "url('/bleepsix/img/cursor_custom_noconn_s24.png') 4 3, cursor";
  }
  else if ( (type == "conn") || (type == "connection") )
  {
    ele.style.cursor = "url('/bleepsix/img/cursor_custom_conn_s24.png') 4 3, cursor";
  }


}

//-----------------------------


toolConn.prototype.drawOverlay = function()
{

  var tconn = { x : this.mouse_world_xy.x, y : this.mouse_world_xy.y,
                bounding_box : [ [ -10, -10 ], [10, 10] ] };


  if (this.connType == "noconn")
    g_controller.schematic.drawSchematicNoconn( tconn );
  else if (this.connType == "connection")
    g_controller.schematic.drawSchematicConnection( tconn );


  var s = this.cursorSize / 2;
  g_painter.drawRectangle( this.mouse_world_xy["x"] - s,
                           this.mouse_world_xy["y"] - s,
                           this.cursorSize ,
                           this.cursorSize ,
                           this.cursorWidth ,
                           "rgb(128, 128, 128 )" );


}

//-----------------------------

toolConn.prototype.dist1 = function( xy0, xy1 )
{

  var dx = Math.abs( xy0["x"] - xy1["x"] );
  var dy = Math.abs( xy0["y"] - xy1["y"] );

  return Math.max(dx, dy);

}

//-----------------------------


toolConn.prototype.mouseDown = function( button, x, y ) 
{
  this.mouse_down = true;

  if (button == 3)
    this.mouse_drag_flag = true;

  if (button == 1)
  {

      console.log("mouseDown..." + this.connType);

      if (this.connType == "noconn")
      {
        g_controller.schematic.addNoconn( this.mouse_world_xy.x, this.mouse_world_xy.y );
        g_controller.schematicUpdate = true;

        g_controller.schematic.eventSave();

      }
      else if (this.connType == "connection")
      {
        g_controller.schematic.addConnection( this.mouse_world_xy.x, this.mouse_world_xy.y );
        g_controller.schematicUpdate = true;

        g_controller.schematic.eventSave();

      }

    if (this.placeOption == "once")
    {
      g_controller.tool = new toolNav(x, y);
      g_controller.guiToolbox.defaultSelect();
      g_painter.dirty_flag = true;


      var ele = document.getElementById("canvas");
      ele.style.cursor = "auto";


      return;
    }

  }

}

//-----------------------------


/*
toolConn.prototype.doubleClick = function( button, x, y )
{

  if (this.placeOption == "once")
    this.placeOption = "persist";
  else 
    this.placeOption = "once";

  console.log("toolConn.doubleClick: placeOption " + this.placeOption );
}
*/

//-----------------------------

toolConn.prototype.mouseUp = function( button, x, y ) 
{
  this.mouse_down = false;

  if (button == 3)
    this.mouse_drag_flag = false;

}

//-----------------------------


toolConn.prototype.mouseMove = function( x, y ) 
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

toolConn.prototype.mouseDrag = function( dx, dy ) 
{
  g_painter.adjustPan ( dx, dy );
}

//-----------------------------

toolConn.prototype.mouseWheel = function( delta )
{
  g_painter.adjustZoom ( this.mouse_cur_x, this.mouse_cur_y, delta );
}

//-----------------------------
// TESTING

toolConn.prototype.keyDown = function( keycode, ch, ev )
{
  console.log("toolConn keyDown: " + keycode + " " + ch );

  if ((ch == 'Q') || (keycode == 27))
  {
    console.log("handing back to toolNav");
    g_controller.tool = new toolNav( this.mouse_cur_x, this.mouse_cur_y );
    g_controller.guiToolbox.defaultSelect();

    var ele = document.getElementById("canvas");
    ele.style.cursor = "auto";

    g_painter.dirty_flag = true;
  }

}

//-----------------------------

toolConn.prototype.keyUp = function( keycode, ch, ev )
{
  console.log("toolConn keyUp: " + keycode + " " + ch );
}


