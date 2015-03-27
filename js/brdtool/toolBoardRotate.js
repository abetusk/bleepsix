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

function toolBoardRotate( x, y, type ) 
{

  x = ( typeof x !== 'undefined' ? x : 0 );
  y = ( typeof y !== 'undefined' ? y : 0 );

  initialPlaceFlag = ( typeof initialPlaceFlag !== 'undefined' ? initialPlaceFlag : true );

  this.dist1_edge_eps = 10;

  this.mouse_down = false;
  this.mouse_cur_x = x;
  this.mouse_cur_y = y;

  this.rotateType = ( (typeof type === "undefined") ? "ccw" : type );

  this.show_cursor_flag = true;

  this.cursorSize = 6;
  this.cursorWidth = 1;

  this.mouse_drag_flag = false;

  this.mouse_world_xy = g_snapgrid.snapGrid( g_painter.devToWorld(x,y) );
  this.raw_mouse_world_xy = g_painter.devToWorld(x,y);

  this.origSnapSpacing = g_snapgrid.spacing;

  var ele = document.getElementById("canvas");
  ele.style.cursor = "url('img/cursor_custom_edge_s24.png') 4 3, cursor";

}

//-----------------------------

toolBoardRotate.prototype.drawOverlay = function()
{
  // cursor
  //
  var s = this.cursorSize / 2;
  g_painter.drawRectangle( this.mouse_world_xy["x"] - s,
                           this.mouse_world_xy["y"] - s,
                           this.cursorSize ,
                           this.cursorSize ,
                           this.cursorWidth ,
                           "rgb(128, 128, 128 )" );

  var mouse_x = this.mouse_world_xy.x;
  var mouse_y = this.mouse_world_xy.y;
  g_board_controller.display_text = "x: " + mouse_x + ", y: " + mouse_y  ;
}

//-----------------------------

toolBoardRotate.prototype.mouseDown = function( button, x, y ) 
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

    var id_ref = g_board_controller.board.pick( wx, wy );
    if (id_ref) {

      var ccw_flag = true;
      if      (this.rotateType == "ccw") { ccw_flag = true; }
      else if (this.rotateType ==  "cw") { ccw_flag = false; }

      var op = { source: "brd", destination: "brd" };
      op.action = "update";
      op.type = "rotate90";
      op.id = id_ref.id;
      op.data = { ccw : ccw_flag };
      g_board_controller.opCommand( op );

      var map = g_board_controller.board.kicad_brd_json.brd_to_sch_net_map;
      g_board_controller.board.updateRatsNest( undefined, undefined, map );

      g_board_controller.board.unhighlightNet();
      g_board_controller.unhighlightNet( );

      g_painter.dirty_flag = true;
      g_board_controller.tool = new toolBoardNav( this.mouse_cur_x, this.mouse_cur_y );
      g_board_controller.guiToolbox.defaultSelect();

    }

  }

}

//-----------------------------


toolBoardRotate.prototype.mouseUp = function( button, x, y ) 
{
  this.mouse_down = false;

  if (button == 3)
    this.mouse_drag_flag = false;

}

//------------


toolBoardRotate.prototype.mouseMove = function( x, y ) 
{

  if ( this.mouse_drag_flag ) 
     this.mouseDrag ( x - this.mouse_cur_x, y - this.mouse_cur_y );

  this.mouse_cur_x = x;
  this.mouse_cur_y = y;

  this.mouse_world_xy = g_painter.devToWorld( this.mouse_cur_x, this.mouse_cur_y );
  this.mouse_world_xy = g_snapgrid.snapGrid( this.mouse_world_xy );

  this.raw_mouse_world_xy = g_painter.devToWorld( this.mouse_cur_x, this.mouse_cur_y );

  g_painter.dirty_flag = true;

  if ( ! this.mouse_drag_flag ) 
  {
  }

}

//-----------------------------

toolBoardRotate.prototype.mouseDrag = function( dx, dy ) 
{
  g_painter.adjustPan ( dx, dy );
}

//-----------------------------

toolBoardRotate.prototype.mouseWheel = function( delta )
{
  g_painter.adjustZoom ( this.mouse_cur_x, this.mouse_cur_y, delta );
}

//-----------------------------

toolBoardRotate.prototype.keyDown = function( keycode, ch, ev )
{

  if ((ch == 'Q') || (keycode == 27))
  {
    g_board_controller.tool = new toolBoardNav( this.mouse_cur_x, this.mouse_cur_y );
    g_board_controller.guiToolbox.defaultSelect();

    g_painter.dirty_flag = true;
    g_snapgrid.spacing = this.origSnapSpacing;

    var map = g_board_controller.board.kicad_brd_json.brd_to_sch_net_map;
    g_board_controller.board.updateRatsNest( undefined, undefined, map );

  }

}

//-----------------------------

toolBoardRotate.prototype.keyUp = function( keycode, ch, ev ) { }
