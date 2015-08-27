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

function toolVia(x, y, initialPlaceFlag)
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

  this.origSnapSpacing = g_snapgrid.spacing;

  this.via_width = g_parameter.viaWidth;
  this.via_color = "rgba(255,255,255,0.4)";

  this.state = "init";
  this.initialPlaceFlag = initialPlaceFlag;
  this.startedFlag = false;
  if (this.initialPlaceFlag)
  {
    this._initViaState();
  }

  this.layer0 = 0;
  this.layer1 = 15;
  this.color = "rgba(255,255,0,0.4)";

  var ele = document.getElementById("canvas");
  ele.style.cursor = "url('img/cursor_custom_edge_s24.png') 4 3, cursor";

}

toolVia.prototype._initViaState = function()
{
  this.startedFlag = true;
}

//-----------------------------

toolVia.prototype.drawOverlay = function()
{

  var mx = this.mouse_world_xy.x;
  var my = this.mouse_world_xy.y;

  g_painter.circle(mx, my, this.via_width/2, 0, this.via_color, true, this.via_color);

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
  g_board_controller.display_text = "x: " + mouse_x + ", y: " + mouse_y;

}

//-----------------------------

toolVia.prototype._via_intersect_test = function(layer)
{
  var clearance = g_parameter.clearance;

  //add the via
  var p = { x: this.mouse_world_xy.x, y: this.mouse_world_xy.y };

  // We're only allowing vias that pierce all layers 0-15.
  // We'll have to update these for buried or blind vias.
  //
  var tracks = [];
  tracks.push( { x0: p.x, x1: p.x, y0: p.y, y1 : p.y, shape: "through",
    shape_code : "0", width: 2*clearance + this.via_width,
    layer0: this.layer0, layer1: this.layer1} );

  var hit_ele_list0 = g_board_controller.board.trackBoardIntersect(tracks, 0);
  var hit_ele_list1 = g_board_controller.board.trackBoardIntersect(tracks, 15);

  // We'll have to generalize this but for now we can keep it.
  //
  var hit_ele_list2 = g_board_controller.board.trackBoardIntersect(tracks, 1);
  var hit_ele_list3 = g_board_controller.board.trackBoardIntersect(tracks, 2);


  if ( (hit_ele_list0.length > 0) ||
       (hit_ele_list2.length > 0) ||
       (hit_ele_list3.length > 0) ||
       (hit_ele_list1.length > 0) )
  {
    return true;
  }

  return false;

}


toolVia.prototype.placeVia = function()
{

  var group_id = String(guid());

  var op = { source: "brd", destination: "brd" };
  op.action = "add";
  op.type = "via";
  var via = { x : this.mouse_world_xy.x,
              y : this.mouse_world_xy.y,
              width : this.via_width,
              layer0 : this.layer0,
              layer1 : this.layer1,
              netcode: 0, net_number: "" };

  op.data = via;

  op.groupId = group_id;
  g_board_controller.opCommand(op);

  g_board_controller.tool = new toolBoardNav(this.mouse_cur_x, this.mouse_cur_y);
  g_board_controller.guiToolbox.defaultSelect();
  g_painter.dirty_flag = true;
  g_snapgrid.spacing = this.origSnapSpacing;

  var map = g_board_controller.board.kicad_brd_json.brd_to_sch_net_map;
  g_board_controller.board.updateRatsNest(undefined, undefined, map);

}

//-----------------------------

toolVia.prototype.mouseDown = function( button, x, y )
{
  this.mouse_down = true;

  if (button == 3)
    this.mouse_drag_flag = true;

  if (button == 1) {
    if (!this._via_intersect_test(this.layer0)) {
      this.placeVia();
    } else {
      g_board_controller.fadeMessage("Via too close!");
    }
  }
}

//-----------------------------


toolVia.prototype.doubleClick = function( button, x, y ) { }

//-----------------------------

toolVia.prototype.mouseUp = function( button, x, y )
{
  this.mouse_down = false;

  if (button == 3)
    this.mouse_drag_flag = false;
}

//------------

toolVia.prototype._debug_print_v = function( v )
{
  for (var ind in v)
  {
    console.log( ind + ": " + v[ind].x + " " + v[ind].y );
  }
}


toolVia.prototype.mouseMove = function( x, y )
{

  if (this.mouse_drag_flag)
     this.mouseDrag (x-this.mouse_cur_x, y-this.mouse_cur_y);

  this.mouse_cur_x = x;
  this.mouse_cur_y = y;

  this.mouse_world_xy = g_painter.devToWorld(this.mouse_cur_x, this.mouse_cur_y);
  this.mouse_world_xy = g_snapgrid.snapGrid(this.mouse_world_xy);

  this.raw_mouse_world_xy = g_painter.devToWorld(this.mouse_cur_x, this.mouse_cur_y);

  g_painter.dirty_flag = true;

}

//-----------------------------

toolVia.prototype.mouseDrag = function( dx, dy )
{
  g_painter.adjustPan(dx, dy);
}

//-----------------------------

toolVia.prototype.mouseWheel = function( delta )
{
  g_painter.adjustZoom(this.mouse_cur_x, this.mouse_cur_y, delta);
}

//-----------------------------
// TESTING

toolVia.prototype.keyDown = function( keycode, ch, ev )
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

toolVia.prototype.keyUp = function( keycode, ch, ev ) { }
