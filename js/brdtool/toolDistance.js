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

function toolDistance( x, y, initialPlaceFlag ) 
{

  x = ( typeof x !== 'undefined' ? x : 0 );
  y = ( typeof y !== 'undefined' ? y : 0 );

  initialPlaceFlag = ( typeof initialPlaceFlag !== 'undefined' ? initialPlaceFlag : true );

  this.dist1_edge_eps = 10;

  this.mouse_down = false;
  this.mouse_cur_x = x;
  this.mouse_cur_y = y;


  this.show_cursor_flag = true;

  this.cursorSize = 6;
  this.cursorWidth = 1;

  this.mouse_drag_flag = false;

  this.mouse_world_xy = g_snapgrid.snapGrid( g_painter.devToWorld(x,y) );
  this.raw_mouse_world_xy = g_painter.devToWorld(x,y);

  this.tildeModifier = false;
  this.origSnapSpacing = g_snapgrid.spacing;

  this.start_point = { x:0, y:0 };
  this.end_point = {x:0, y:0 };

  this.state = "init";
  this.initialPlaceFlag = initialPlaceFlag;
  this.startedFlag = false;
  if (this.initialPlaceFlag)
  {
    this._initDistanceState();
  }

  // Needs to be taken from board design constraints.
  // Hardcoded for now.
  //
  // orange
  this.color = "rgba(255,127,0,0.4)";
  this.width = 200;

  var ele = document.getElementById("canvas");
  ele.style.cursor = "url('img/cursor_custom_edge_s24.png') 4 3, cursor";

}

toolDistance.prototype._initDistanceState = function()
{

  var xy = g_snapgrid.snapGrid( this.mouse_world_xy );
  this.startedFlag = true;

  var x = xy.x;
  var y = xy.y;

  this.start_point = { x : x, y : y };
  this.end_point = { x : x, y : y };
}

//-----------------------------

toolDistance.prototype.drawOverlay = function()
{

  var p0 = [ this.start_point.x, this.start_point.y ];
  var p1 = [ this.end_point.x, this.end_point.y ];
  var dp = numeric.sub( p1, p0 );
  var ds = numeric.norm2Squared(dp);

  if (ds > 10) {
    var theta = Math.PI/2.0;
    var R = [ [ Math.cos(theta), Math.sin(theta) ], [ -Math.sin(theta), Math.cos(theta) ] ];

    dp = numeric.div( dp, Math.sqrt(ds) );
    var v = numeric.dot( R, dp );
    v = numeric.mul( v, 500 );

    var offs = numeric.mul( dp, 400 );

    g_painter.line( this.start_point.x, this.start_point.y,
                    this.end_point.x,   this.end_point.y,
                    this.color, this.width );

    g_painter.line( this.start_point.x, this.start_point.y,
                    this.start_point.x+v[0] + offs[0], this.start_point.y+v[1] + offs[1],
                    this.color, this.width );

    g_painter.line( this.start_point.x, this.start_point.y,
                    this.start_point.x-v[0] + offs[0], this.start_point.y-v[1] + offs[1],
                    this.color, this.width );

    g_painter.line( this.end_point.x, this.end_point.y,
                    this.end_point.x+v[0]-offs[0], this.end_point.y+v[1]-offs[1],
                    this.color, this.width );

    g_painter.line( this.end_point.x, this.end_point.y,
                    this.end_point.x-v[0]-offs[0], this.end_point.y-v[1]-offs[1],
                    this.color, this.width );
  }

  // cursor
  //
  var s = this.cursorSize / 2;
  g_painter.drawRectangle( this.mouse_world_xy["x"] - s,
                           this.mouse_world_xy["y"] - s,
                           this.cursorSize ,
                           this.cursorSize ,
                           this.cursorWidth ,
                           "rgb(128, 128, 128 )" );

  var dx = this.end_point.x - this.start_point.x;
  var dy = this.end_point.y - this.start_point.y;

  var l = Math.floor(Math.sqrt((dx*dx) + (dy*dy)));

  var mouse_x = this.mouse_world_xy.x;
  var mouse_y = this.mouse_world_xy.y;
  g_board_controller.display_text = "x: " + mouse_x + ", y: " + mouse_y  ;
  g_board_controller.display_text += ", dx: " + dx + ", dy: " + dy + ", l: " + l;

}

//-----------------------------

toolDistance.prototype.mouseDown = function( button, x, y ) 
{
  this.mouse_down = true;

  if (button == 3)
    this.mouse_drag_flag = true;

  if (button == 1)
  {

    // If we haven't started placing, setup state and return
    //
    if (!this.startedFlag)
    {
      this._initDistanceState();
      return;
    }

  }

}

//-----------------------------


toolDistance.prototype.mouseUp = function( button, x, y ) 
{
  this.mouse_down = false;

  if (button == 3)
    this.mouse_drag_flag = false;

}

//------------


toolDistance.prototype.mouseMove = function( x, y ) 
{

  if ( this.mouse_drag_flag ) 
     this.mouseDrag ( x - this.mouse_cur_x, y - this.mouse_cur_y );

  this.mouse_cur_x = x;
  this.mouse_cur_y = y;

  this.mouse_world_xy = g_painter.devToWorld( this.mouse_cur_x, this.mouse_cur_y );
  this.mouse_world_xy = g_snapgrid.snapGrid( this.mouse_world_xy );

  this.raw_mouse_world_xy = g_painter.devToWorld( this.mouse_cur_x, this.mouse_cur_y );

  g_painter.dirty_flag = true;

  // If we haven't started, just return
  // We need to wait for a mouseDown (or
  // an escape)
  //
  if (!this.startedFlag)
  { 
    return; 
  }

  if ( ! this.mouse_drag_flag ) 
  {

    this.end_point.x = this.mouse_world_xy["x"];
    this.end_point.y = this.mouse_world_xy["y"];
    g_painter.dirty_flag = true;

  }

}

//-----------------------------

toolDistance.prototype.mouseDrag = function( dx, dy ) 
{
  g_painter.adjustPan ( dx, dy );
}

//-----------------------------

toolDistance.prototype.mouseWheel = function( delta )
{
  g_painter.adjustZoom ( this.mouse_cur_x, this.mouse_cur_y, delta );
}

//-----------------------------
// TESTING

toolDistance.prototype.keyDown = function( keycode, ch, ev )
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

  // tilde
  //
  else if (keycode == 192) {
    //console.log("v", keycode, ch, ev );

    this.tildeModifier = !this.tildeModifier;

    if (this.tildeModifier)
    {
      g_snapgrid.spacing = 10 * this.origSnapSpacing;
    } 
    else 
    {
      g_snapgrid.spacing = this.origSnapSpacing;
    }

  }

}

//-----------------------------

toolDistance.prototype.keyUp = function( keycode, ch, ev )
{
  //console.log("^", keycode, ch, ev );
}


