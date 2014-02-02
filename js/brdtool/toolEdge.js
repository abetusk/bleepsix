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

function toolEdge( x, y, initialPlaceFlag ) 
{
  console.log("toolEdge " + x + " " + y + " " + initialPlaceFlag );

  x = ( typeof x !== 'undefined' ? x : 0 );
  y = ( typeof x !== 'undefined' ? y : 0 );

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

  this.edge_history = [];
  this.cur_edge_point = [];


  this.state = "init";
  this.initialPlaceFlag = initialPlaceFlag;
  this.startedFlag = false;
  if (this.initialPlaceFlag)
  {
    this._initEdgeState();
  }

  // Needs to be taken from board design constraints.
  // Hardcoded for now.
  //
  this.edge_width = 200;

  this.layer = 28;
  this.color = "rgba(255,255,0,0.4)";

  console.log("toolEdge : " + this.layer );


  var ele = document.getElementById("canvas");
  ele.style.cursor = "url('img/cursor_custom_wire_s24.png') 4 3, cursor";

}

toolEdge.prototype._initEdgeState = function()
{

  //DEBUG
  console.log("_initEdgeState");

  var xy = g_snapgrid.snapGrid( this.mouse_world_xy );

  this.startedFlag = true;

  var x = xy.x;
  var y = xy.y;

  this.cur_edge_point.push( { x : x, y : y } );
  this.cur_edge_point.push( { x : x, y : y } );
}

//-----------------------------

toolEdge.prototype.drawOverlay = function()
{

  // what we've already laid down
  //
  var th = this.edge_history;
  for ( var ind in th )
  {
    if (th[ind].shape == 'drawsegment' )
    {
      g_painter.line( th[ind].x0, th[ind].y0,
                      th[ind].x1, th[ind].y1,
                      th[ind].color, th[ind].width );
    }
  }

  // current end of segment
  //
  for (var ind=1; ind < this.cur_edge_point.length; ind++)
  {
    g_painter.line( this.cur_edge_point[ind-1]["x"], this.cur_edge_point[ind-1]["y"],
                    this.cur_edge_point[ind]["x"],   this.cur_edge_point[ind]["y"],
                    this.color, this.edge_width);
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


}

//-----------------------------

toolEdge.prototype.dist1 = function( xy0, xy1 )
{

  var dx = Math.abs( xy0["x"] - xy1["x"] );
  var dy = Math.abs( xy0["y"] - xy1["y"] );

  return Math.max(dx, dy);

}

//-----------------------------

toolEdge.prototype.placeEdge = function()
{

  // checking to see if we need to add a source connection
  //
  var eh = this.edge_history;
  for ( var ind in eh )
  {
    if (eh[ind].shape == "drawsegment" )
    {
      g_board_controller.board.addDrawSegment( eh[ind].x0, eh[ind].y0,
                                   eh[ind].x1, eh[ind].y1,
                                   eh[ind].width,
                                   eh[ind].layer );
    }
  }

  var cep = this.cur_edge_point;
  for (var ind=1; ind < cep.length; ind++)
  {
    if (this.dist1( cep[ind-1], cep[ind] ) > this.dist1_edge_eps )
    {
      g_board_controller.board.addDrawSegment( cep[ind-1].x, cep[ind-1].y,
                                   cep[ind].x,   cep[ind].y,
                                   this.edge_width, 
                                   this.layer );

    }
    else console.log("skipping addEdge: points are too close");

  }

  g_board_controller.tool = new toolBoardNav( this.mouse_cur_x, this.mouse_cur_y );
  g_board_controller.guiToolbox.defaultSelect();
  g_painter.dirty_flag = true;

}

//-----------------------------

// Returns true if it hanlded the connection.  
// placeTrack and handoff back to toolBoardNav is done here.
//
toolEdge.prototype.handlePossibleConnection = function( ex, ey )
{

  var n = this.cur_edge_point.length;
  var  dst_edge = {};
  this._make_point_edge( dst_edge, this.cur_edge_point[n-1] );
  var hit_ele_dst = g_board_controller.board.edgeBoardIntersect( [ dst_edge ] );

  var dst_hit = this._choose_hit_element( hit_ele_dst );

  if (dst_hit)
  {
    if (dst_hit.type == "drawsegment")
    {
      this._magnet_edge( this.cur_edge_point[n-1], dst_hit.ref );
      this.cur_edge_point = this._make_joint_edge( this.cur_edge_point );
      this.placeTrack();

      return true;
    }
  }

  return false;
}

//-----------------------------

toolEdge.prototype.mouseDown = function( button, x, y ) 
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
      this._initEdgeState();
      return;
    }

    if ( this.dist1( this.cur_edge_point[1], this.cur_edge_point[0] ) < this.dist1_edge_eps )
    {
      console.log("skipping extra add edge event (edges too close)");

      console.log(this.cur_edge_point);
      console.log(this.edge);
      return;
    }
    else
    {
      var ex = this.mouse_world_xy["x"];
      var ey = this.mouse_world_xy["y"];

      //if ( this.handlePossibleConnection( ex, ey ) ) { return; }

      var drawsegment = { x0 : this.cur_edge_point[0].x,
                    y0 : this.cur_edge_point[0].y,
                    x1 : this.cur_edge_point[1].x,
                    y1 : this.cur_edge_point[1].y,
                    width: this.edge_width,
                    layer : this.layer,
                    color : this.color,
                    shape : "drawsegment" };
                  
      this.edge_history.push(drawsegment);

      this.cur_edge_point.shift();

      //this.cur_edge_point.push( { x : this.mouse_world_xy["x"], y : this.mouse_world_xy["y"] } );
      var xy = g_snapgrid.snapGrid( this.mouse_world_xy );
      this.cur_edge_point.push( { x : xy.x, y : xy.y } );


      this.jointStateAngled = !this.jointStateAngled;

      console.log("edge_history");
      console.log(this.edge_history);

    }

  }

}

//-----------------------------


toolEdge.prototype.doubleClick = function( button, x, y )
{

  if (this.edge_history.length > 0)
  {
    this.placeEdge();
  }
  else
  {
    // If we've selected the toolEdge tool but haven't started placing a trace
    // (and we receive a doubleClick event),
    // do nothing but give control back to toolBoardNav
    //
    g_board_controller.tool = new toolBoardNav( this.mouse_cur_x, this.mouse_cur_y );
    g_board_controller.guiToolbox.defaultSelect();

    g_painter.dirty_flag = true;
  }
}

//-----------------------------

toolEdge.prototype.mouseUp = function( button, x, y ) 
{
  this.mouse_down = false;

  if (button == 3)
    this.mouse_drag_flag = false;

}

//------------

toolEdge.prototype._debug_print_v = function( v )
{
  for (var ind in v)
  {
    console.log( ind + ": " + v[ind].x + " " + v[ind].y );
  }
}

toolEdge.prototype._make_point_edge = function( pnt_edge, edge )
{
  pnt_edge["x0"] = edge.x;
  pnt_edge["y0"] = edge.y;

  pnt_edge["x1"] = edge.x;
  pnt_edge["y1"] = edge.y;

  pnt_edge["layer"] = edge.layer;

  pnt_edge["width"] = this.edge_width;
  pnt_edge["shape"] = "drawsegment";
  pnt_edge["shape_code"] = "0";
}



toolEdge.prototype._choose_hit_element = function( hit_ele_list )
{
  var hit_ele = null;

  for (var ind in hit_ele_list)
  {
    hit_ele = hit_ele_list[ind];
    if (hit_ele_list[ind].type == "drawsegment")
      return hit_ele_list[ind];
  }

  return hit_ele;

}


// Figure out what the joint should be from current jointStateAngled
// and return it.
//
toolEdge.prototype._make_joint_edge = function( virtual_edge )
{
  var n = virtual_edge.length;
  var fiddled_edge;
  if (this.jointStateAngled)
    fiddled_edge = 
      this._createAngledJoint( virtual_edge[0], virtual_edge[n-1] );
  else
    fiddled_edge =
      this._createAlignedJoint( virtual_edge[0], virtual_edge[n-1]);
  return fiddled_edge;
}

toolEdge.prototype.mouseMove = function( x, y ) 
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

    this.cur_edge_point[1]["x"] = this.mouse_world_xy["x"];
    this.cur_edge_point[1]["y"] = this.mouse_world_xy["y"];

    g_painter.dirty_flag = true;

  }

}

//-----------------------------

toolEdge.prototype.mouseDrag = function( dx, dy ) 
{
  g_painter.adjustPan ( dx, dy );
}

//-----------------------------

toolEdge.prototype.mouseWheel = function( delta )
{
  g_painter.adjustZoom ( this.mouse_cur_x, this.mouse_cur_y, delta );
}

//-----------------------------
// TESTING

toolEdge.prototype.keyDown = function( keycode, ch, ev )
{
  console.log("toolEdge keyDown: " + keycode + " " + ch );

  if ((ch == 'Q') || (keycode == 27))
  {
    console.log("handing back to toolBoardNav");
    g_board_controller.tool = new toolBoardNav( this.mouse_cur_x, this.mouse_cur_y );
    g_board_controller.guiToolbox.defaultSelect();

    g_painter.dirty_flag = true;
  }

}

//-----------------------------

toolEdge.prototype.keyUp = function( keycode, ch, ev )
{
  console.log("toolEdge keyUp: " + keycode + " " + ch );
}


