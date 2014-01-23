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

function toolBoardZone( x, y) 
{

  console.log("toolBoardZone");


  this.mouse_cur_x = x;
  this.mouse_cur_y = y;

  this.orig_world_coord = g_painter.devToWorld( x, y );
  this.cur_world_coord = g_painter.devToWorld( x, y );

  this.region_box_threshold_size = 50;
  this.drawing_box_flag = false;

  this.mouse_drag_flag = false;

  //DUMMY!!
  this.netcode = 1;
  this.netname = "GND";

  this.layer = 15;
}

toolBoardZone.prototype.debug_print = function()
{
  console.log("toolBoardZone:");
  console.log("  mouse_cur_x " + this.mouse_cur_x + ", mouse_cur_y " + this.mouse_cur_y );
  console.log("  orig_world_coord: " + this.orig_world_coord[0] + " " + this.orig_world_coord[1] );
  console.log("  cur_world_coord: " + this.cur_world_coord[0] + " " + this.cur_world_coord[1] );
  console.log("  region_box_threshold " + this.region_box_threshold_size );
  console.log("  drawing_box_flag " + this.drawing_box_flag );
  console.log("  mouse_drag_flag " + this.drawing_box_flag );
  console.log("  netcode " + this.netcode +  ", netname " + this.netname + ", " + this.layer );
}


toolBoardZone.prototype.drawOverlay = function()
{

  if (this.drawing_box_flag)
  {
    var mx = Math.min( this.cur_world_coord["x"], this.orig_world_coord["x"] );
    var my = Math.min( this.cur_world_coord["y"], this.orig_world_coord["y"] );

    var w = Math.abs( this.cur_world_coord["x"] - this.orig_world_coord["x"] );
    var h = Math.abs( this.cur_world_coord["y"] - this.orig_world_coord["y"] );

    g_painter.drawRectangle( mx, my, w, h, 100, "rgb(128, 128, 128)" );
  }

}

toolBoardZone.prototype.mouseDown = function( button, x, y )
{

  if (button == 3)
    this.mouse_drag_flag = true;

}

toolBoardZone.prototype.mouseUp = function( button, x, y )
{

  if (button == 3)
    this.mouse_drag_flag = false;

  var world_coord = g_painter.devToWorld(x, y);

  if (button == 1)
  {
    if (this.drawing_box_flag)
    {
      var mx = Math.min( this.cur_world_coord["x"], this.orig_world_coord["x"] );
      var my = Math.min( this.cur_world_coord["y"], this.orig_world_coord["y"] );

      var Mx = Math.max( this.cur_world_coord["x"], this.orig_world_coord["x"] );
      var My = Math.max( this.cur_world_coord["y"], this.orig_world_coord["y"] );


      console.log("bang: " + mx + " " + my + " " + Mx + " " + My );

      console.log("  trying to add czone:");

      //var pnts = [ [mx, my], [mx, My], [Mx, My], [Mx, my] ];
      var pnts = [ [mx, my], [Mx, my], [Mx, My], [mx, My] ];
      g_board_controller.board.addCZone( pnts, this.netcode, this.layer );

      console.log("...");

    }

    g_board_controller.tool = new toolBoardNav(x, y);
    g_painter.dirty_flag = true;

  }

}

toolBoardZone.prototype.mouseMove = function( x, y )
{

  if (this.mouse_drag_flag)
    this.mouseDrag( x - this.mouse_cur_x, y - this.mouse_cur_y );

  this.mouse_cur_x = x;
  this.mouse_cur_y = y;

  if (!this.mouse_drag_flag)
  {

    this.cur_world_coord = g_painter.devToWorld( x, y );

    var tx = this.cur_world_coord["x"];
    var ox = this.orig_world_coord["y"];

    var ty = this.cur_world_coord["x"];
    var oy = this.orig_world_coord["y"];

    var dx = Math.abs( this.cur_world_coord["x"] - this.orig_world_coord["x"]) ;
    var dy = Math.abs( this.cur_world_coord["y"] - this.orig_world_coord["y"]) ;

    if ( ( Math.abs( this.cur_world_coord["x"] - this.orig_world_coord["x"]) > this.region_box_threshold_size ) ||
         ( Math.abs( this.cur_world_coord["y"] - this.orig_world_coord["y"]) > this.region_box_threshold_size ) )
      this.drawing_box_flag = true;

  }


  if (this.drawing_box_flag == true)
    g_painter.dirty_flag = true;

}

toolBoardZone.prototype.mouseDrag = function( dx, dy )
{
  g_painter.adjustPan( dx, dy );
}

toolBoardZone.prototype.mouseWheel = function( delta )
{
  g_painter.adjustZoom( this.mouse_cur_x, this.mouse_cur_y, delta );
}

toolBoardZone.prototype.keyDown = function( keycode, ch, ev )
{
  if (ch == 'I')
  {
    this.debug_print();
  }
  else if (ch == 'Z')
  {
    console.log("Z!");
    this.netcode ++;

    if (this.netcode in g_board_controller.board.kicad_brd_json.net_code_map)
      this.netname = g_board_controller.board.kicad_brd_json.net_code_map[ this.netcode ] ;

    this.debug_print();
  }
  else if (ch == 'A')
  {
    console.log("A.");
    this.netcode--;

    if (this.netcode in g_board_controller.board.kicad_brd_json.net_code_map)
      this.netname = g_board_controller.board.kicad_brd_json.net_code_map[ this.netcode ] ;

    this.debug_print();
  }
  else if (keycode == 27)
  {
    g_board_controller.tool = new toolBoardNav(this.mouse_cur_x, this.mouse_cur_y);
    g_painter.dirty_flag = true;
  }
}

toolBoardZone.prototype.keyUp = function( keycode, ch, ev  )
{
}


