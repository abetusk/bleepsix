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

function toolTrace( x, y, layerPair, initialPlaceFlag, highlightNets ) 
{
  //console.log("toolTrace " + x + " " + y + " " + initialPlaceFlag );

  x = ( typeof x !== 'undefined' ? x : 0 );
  y = ( typeof y !== 'undefined' ? y : 0 );
  layerPair = ( (typeof layerPair !== 'undefined') ? layerPair : [ 0, 15 ] );
  initialPlaceFlag = ( typeof initialPlaceFlag !== 'undefined' ? initialPlaceFlag : true );
  highlightNets = ( (typeof highlightNets !== 'undefined' ) ? highlightNets : [] );

  this.dist1_trace_eps = 10;

  this.mouse_down = false;
  this.mouse_cur_x = x;
  this.mouse_cur_y = y;


  this.show_cursor_flag = true;

  this.cursorSize = 6;
  this.cursorWidth = 1;

  this.mouse_drag_flag = false;

  this.laydownFormat = "J";  // F for free, J for jointed
  //this.laydownFormat = "F";  // F for free, J for jointed
  this.traceType = "traceline";

  this.mouse_world_xy = g_snapgrid.snapGrid( g_painter.devToWorld(x,y) );
  this.raw_mouse_world_xy = g_painter.devToWorld(x,y);

  this.trace_history = [];
  this.cur_trace_point = [];
  this.ghost_trace_point = [];

  this.show_ghost_trace_flag = true;
  this.allow_place_flag = true;

  this.prev_trace_point = [];

  this.state = "init";

  this.groupId = String(guid());

  this.initialPlaceFlag = initialPlaceFlag;

  this.startedFlag = false;
  if (this.initialPlaceFlag)
  {
    this._initTraceState();
  }
  

  // Needs to be taken from board design constraints.
  // Hardcoded for now.
  //
  this.trace_width = g_parameter.traceWidth;
  this.via_width = g_parameter.viaWidth;

  this.small_magnet_size = 50;
  this.small_trace_magnet_size = 15;

  // DEPENDENCE ON guiBoardLayer
  // FIGURE OUT HOW TO TAKE OUT

  this.layer = g_board_controller.guiLayer.layer ;
  this.cur_layer = g_board_controller.guiLayer.selectedLayer;
  this.color = g_board_controller.board.layer_color[ this.cur_layer ];

  this.cur_layer_ind = 0;
  for (var ind in this.layer)
  {
    if ( this.cur_layer == this.layer[ this.cur_layer_ind ])
      break;
    this.cur_layer_ind++;
  }

  this.ghost_color = "rgba(255,255,255,0.1)";

  this.jointStateAngled = false;

  this.netcode = -1;
  this.netcode_src = -1;
  this.netcode_dst = -1;

  // If the source or destinationg pad/track
  // has no net (net 0,), then we need to 
  // keep a reference to them in order to update
  // them when we create our new net.
  //
  this.ele_src = null;
  this.ele_dst = null;

  this.netname = "N/A";

  this.highlightNetcodes = highlightNets;
  if ( this.highlightNetcodes.length > 0 )
  {
    g_board_controller.board.highlightNetCodes( this.highlightNetcodes );
  }


  var ele = document.getElementById("canvas");
  if ( this.cur_layer < 10 )
    ele.style.cursor = "url('img/cursor_custom_wire_s24_2.png') 4 3, cursor";
  else
    ele.style.cursor = "url('img/cursor_custom_wire_s24_red2.png') 4 3, cursor";

}

toolTrace.prototype._initTraceState = function()
{
  var xy = g_snapgrid.snapGrid( this.mouse_world_xy );

  this.startedFlag = true;

  var x = xy.x;
  var y = xy.y;

  this.cur_trace_point.push( { x : x, y : y } );
  this.prev_trace_point.push( { x : x, y : y } );
  this.ghost_trace_point.push( { x : x, y : y } );

  if (this.laydownFormat == 'F')
  {
    this.cur_trace_point.push( { x : x, y : y } );
    this.prev_trace_point.push( { x : x, y : y } );
    this.ghost_trace_point.push( { x : x, y : y } );
  }

  else if (this.laydownFormat == 'J')
  {
    this.cur_trace_point.push( { x : x, y : y } );
    this.cur_trace_point.push( { x : x, y : y } );

    this.prev_trace_point.push( { x : x, y : y } );
    this.prev_trace_point.push( { x : x, y : y } );

    this.ghost_trace_point.push( { x : x, y : y } );
    this.ghost_trace_point.push( { x : x, y : y } );
  }

}

//-----------------------------

toolTrace.prototype.drawOverlay = function()
{
  var th = this.trace_history;
  for ( var ind in th )
  {
    if (th[ind].shape == 'through')
    {
      g_painter.circle( th[ind].x, th[ind].y, th[ind].width/2,
                        0, null, true, "rgba(255,255,255, 0.4)" );

    }
    else if (th[ind].shape == 'track' )
    {
      g_painter.line( th[ind].x0, th[ind].y0,
                      th[ind].x1, th[ind].y1,
                      th[ind].color, th[ind].width );
    }
  }

  for (var ind=1; ind < this.cur_trace_point.length; ind++)
  {
    g_painter.line( this.cur_trace_point[ind-1]["x"], this.cur_trace_point[ind-1]["y"],
                    this.cur_trace_point[ind]["x"],   this.cur_trace_point[ind]["y"],
                    this.color, this.trace_width);
  }

  if ( this.show_ghost_trace_flag  )
  {
    for (var ind=1; ind < this.ghost_trace_point.length; ind++)
    {
      g_painter.line( this.ghost_trace_point[ind-1]["x"], this.ghost_trace_point[ind-1]["y"],
                      this.ghost_trace_point[ind]["x"],   this.ghost_trace_point[ind]["y"],
                      this.ghost_color, this.trace_width);
    }
  }


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

toolTrace.prototype.dist1 = function( xy0, xy1 )
{

  var dx = Math.abs( xy0["x"] - xy1["x"] );
  var dy = Math.abs( xy0["y"] - xy1["y"] );

  return Math.max(dx, dy);

}

//-----------------------------

toolTrace.prototype._giveElementNetName = function( ele_id_ref )
{
  if (!ele_id_ref)
    return ele_id_ref;

  var type = ele_id_ref.type;
  var giveNetName = false;

  if (type == "pad")
  {
    if (parseFloat(ele_id_ref.pad_ref.net_number) <= 0)
    {
      giveNetName = true;
    }
  }
  else if (type == "track")
  {
    if (parseFloat(ele_id_ref.ref.netcode) <= 0)
    {
      giveNetName = true;
    }
  }

  if (!giveNetName)
    return ele_id_ref;

  if (giveNetName)
  {
    var new_net = g_board_controller.board.genNet();

    var op = { source: "brd", destination: "brd" };
    op.action = "add";
    op.type = "net";
    op.data = { net_number : new_net.net_number,
                net_name : new_net.net_name };
    op.groupId = this.groupId;
    g_board_controller.opCommand( op );

    this.netcode = new_net.net_number;

    if (type == "pad")
    {
      var old_pad = {};
      var new_pad = {};

      var pad_ref = g_board_controller.board.refLookup( ele_id_ref.pad_ref.id );

      $.extend( true, old_pad, pad_ref );
      $.extend( true, new_pad, pad_ref );

      new_pad.net_number = this.netcode;

      var op2 = { source: "brd", destination: "brd" };
      op2.action = "update";
      op2.type = "edit";
      op2.id = [ pad_ref.id ];
      op2.data = { element : [ new_pad ], oldElement : [ old_pad ] };
      op2.groupId = this.groupId;

      g_board_controller.opCommand( op2 );

      var dummy_pad_ref = g_board_controller.board.refLookup( ele_id_ref.pad_ref.id );
      var dummy_ref = g_board_controller.board.refLookup( ele_id_ref.id );

      return { type : "pad", ref: dummy_ref, id : dummy_ref.id, 
                      pad_ref : dummy_pad_ref, name: dummy_pad_ref.name };

    }
    else if (type == "track")
    {
      var old_track = {};
      var new_track = {};

      var track_ref = g_board_controller.board.refLookup( ele_id_ref.ref.id );

      $.extend( true, old_track, track_ref );
      $.extend( true, new_track, track_ref );

      new_track.netcode = this.netcode;
      new_track.net_number = this.netcode; //??

      var op2 = { source: "brd", destination: "brd" };
      op2.action = "update";
      op2.type = "edit";
      op2.id = [ pad_ref.id ];
      op2.data = { element : [ new_track ], oldElement : [ old_track ] };

      op2.groupId = this.groupId;
      g_board_controller.opCommand( op2 );

    }

  }

  return ele_id_ref;

}

toolTrace.prototype.placeTrack = function()
{

  var netsUpdates = false;

  var inheritDestNetFlag = false;
  var curNetCode = -1;

  this.ele_src = this._giveElementNetName( this.ele_src );
  this.ele_dst = this._giveElementNetName( this.ele_dst );

  if ( this.netcode <= 0 )
  {
    if (this.ele_dst)
    {

      if ( (this.ele_dst.type == "pad") &&
           (parseFloat(this.ele_dst.pad_ref.netcode) > 0) )
      {
        //nc = parseFloat( this.ele_dst.pad_ref.net_number );
        //finalNetCode = parseFloat( this.ele_dst.pad_ref.net_number );
        inheritDestNetFlag = true;
      }
      else if ( (this.ele_dst.type == "track") &&
                (parseFloat(this.ele_dst.ref.netcode) > 0) )
      {
        //nc = parseFloat( this.ele_dst.ref.netcode );
        //finalNetCode = parseFloat( this.ele_dst.ref.netcode );
        inheritDestNetFlag = true;
      }

    }

    // if src_dst is non-null, then current net code should already be 
    // set (this.netcode).
    //
    else if (this.ele_src)
    {
      inheritDestNetFlag = false;
    }

  }

  // We didn't pick up a netcode from source or destination (if
  // they existed), so we need to allocate a new one and assign
  // it to the tracks being laid down.
  //
  //if ( nc <= 0 )
  // If we either don't have a netcode or we inherit from the Destination
  // net name (as opposed to inherting from the source), create a 
  // new net.  If we inherit from the destination, this net will
  // be temporary and will be merged at the end.
  //
  if ( ( this.netcode <= 0 ) ||
       inheritDestNetFlag )
  {

    var new_net = g_board_controller.board.genNet();

    var op = { source: "brd", destination: "brd" };
    op.action = "add";
    op.type = "net";
    op.data = { net_number : new_net.net_number,
                net_name : new_net.net_name };
    op.groupId = this.groupId;
    g_board_controller.opCommand( op );

    netsUpdated = true;

    curNetCode = new_net.net_number;
  }
  else
  {
    curNetCode = this.netcode; 
  }

  // checking to see if we need to add a source connection
  //
  var th = this.trace_history;


  for ( var ind in th )
  {
    if ( th[ind].shape == "through" )
    {

      var op = { source: "brd", destination: "brd" };
      op.action = "add";
      op.type = "via";
      op.data = { x : th[ind].x, y : th[ind].y,
                  width: th[ind].width,
                  layer0 : this.layer[0],
                  layer1 : this.layer[1], 
                  netcode: curNetCode,
                  net_number: curNetCode };
                  //net_number: nc };
      op.groupId = this.groupId;
      g_board_controller.opCommand( op );

      netsUpdated = true;
    }
    else if (th[ind].shape == "track" )
    {

      if ( (Math.abs(th[ind].x0 - th[ind].x1) < 1.0) &&
           (Math.abs(th[ind].y0 - th[ind].y1) < 1.0) )
      {
        continue
      }


      var op = { source: "brd", destination: "brd" };
      op.action = "add";
      op.type = "track";
      op.data = { x0 : th[ind].x0, y0 : th[ind].y0,
                  x1 : th[ind].x1, y1 : th[ind].y1,
                  width: th[ind].width,
                  layer : th[ind].layer,
                  netcode: curNetCode,
                  net_number: curNetCode };
                  //net_number: nc };
      op.groupId = this.groupId;
      g_board_controller.opCommand( op );

      netsUpdated = true;
    }
  }

  // also need to add the cur_trace
  //
  if (this.laydownFormat == 'J')
  {

    var ctp = this.cur_trace_point;

    for (var ind=1; ind < ctp.length; ind++)
    {

      if (this.dist1( ctp[ind-1], ctp[ind] ) > this.dist1_trace_eps )
      {

        if ( (Math.abs(ctp[ind-1].x - ctp[ind].x) < 1.0) &&
             (Math.abs(ctp[ind-1].y - ctp[ind].y) < 1.0) )
        {
          continue
        }

        var op = { source: "brd", destination: "brd" };
        op.action = "add";
        op.type = "track";
        op.data = { x0 : ctp[ind-1].x, y0 : ctp[ind-1].y,
                    x1 : ctp[ind].x, y1 : ctp[ind].y,
                    //width: ctp[ind].width,
                    width: this.trace_width,
                    layer : this.cur_layer,
                    netcode: curNetCode,
                    net_number: curNetCode };
                    //net_number: nc };
        op.groupId = this.groupId;
        g_board_controller.opCommand( op );

        netsUpdated = true;
      }

    }
  }

  if (this.ele_dst)
  {
    var dst_netcode = -1;
    if (this.ele_dst.type == "pad")
      dst_netcode = this.ele_dst.pad_ref.net_number;
    else if (this.ele_dst.type == "track")
      dst_netcode = this.ele_dst.ref.netcode;

    if (dst_netcode > 0)
    {

      if ( dst_netcode != curNetCode )
      {

        var op = { source: "brd", destination: "brd" };
        op.action = "update";
        op.type = "mergenet";
        op.data = { net_number0 : dst_netcode, net_number1 : curNetCode };
        op.groupId = this.groupId;

        g_board_controller.opCommand( op );

        curNetCode = op.result.net_number ;

        netsUpdated = true;

      }

    }

  }

  if (this.ele_src)
  {
    var src_netcode = -1;
    if (this.ele_src.type == "pad")
      src_netcode = this.ele_src.pad_ref.net_number;
    else if (this.ele_src.type == "track")
      src_netcode = this.ele_src.ref.netcode;


    if (src_netcode > 0)
    {

      if ( src_netcode != curNetCode )
      {

        var op = { source: "brd", destination: "brd" };
        op.action = "update";
        op.type = "mergenet";
        op.data = { net_number0 : src_netcode, net_number1 : curNetCode };
        op.groupId = this.groupId;
        g_board_controller.opCommand( op );

        curNetCode = op.result.net_number ;

        netsUpdated = true;

      }
    }
  }

  if (netsUpdated)
  {
    var sch_net_op = { source: "brd", destination: "sch" };
    sch_net_op.action = "update";
    sch_net_op.type = "net";
    sch_net_op.groupId = this.groupId;
    g_board_controller.opCommand( sch_net_op );

  }

  g_board_controller.board.unhighlightNet(); 

  g_board_controller.tool = new toolBoardNav( this.mouse_cur_x, this.mouse_cur_y );
  g_board_controller.guiToolbox.defaultSelect();

  var map = g_board_controller.board.kicad_brd_json.brd_to_sch_net_map;
  g_board_controller.board.updateRatsNest( undefined, undefined, map );

  g_painter.dirty_flag = true;

}

//-----------------------------

// Returns true if it hanlded the connection.  
// placeTrack and handoff back to toolBoardNav is done here.
//
toolTrace.prototype.handlePossibleConnection = function( ex, ey, layer )
{

  var n = this.cur_trace_point.length;
  var  dst_track = {};

  this._make_point_track( dst_track, this.cur_trace_point[n-1], this.trace_width );
  var hit_ele_dst = g_board_controller.board.trackBoardIntersect( [ dst_track ] , layer );

  var dst_hit = this._choose_hit_element( hit_ele_dst, this.cur_trace_point[n-1]  );

  if (dst_hit)
  {
    if (dst_hit.type == "pad" )
    {
      var pad_center = g_board_controller.board.getPadCenter( dst_hit.ref, dst_hit.pad_ref );

      this._magnet_pad( this.cur_trace_point[n-1], dst_hit.ref, dst_hit.pad_ref );
      this.cur_trace_point = this._make_joint_trace( this.cur_trace_point );

      this.placeTrack();

      return true;
    }
    else if (dst_hit.type == "track")
    {
      this._magnet_trace( this.cur_trace_point[n-1], dst_hit.ref );
      this.cur_trace_point = this._make_joint_trace( this.cur_trace_point );
      this.placeTrack();

      return true;
    }
  }

  return false;
}

//-----------------------------

toolTrace.prototype.mouseDown = function( button, x, y ) 
{
  //var dist1_trace_eps = 5;
  this.mouse_down = true;

  if (button == 3)
    this.mouse_drag_flag = true;

  if (button == 1)
  {

    // If we haven't started placing, setup state and return
    //
    if (!this.startedFlag)
    {

      //console.log("calling _initTraceState() (" + this.laydownFormat + ")" );

      this._initTraceState();
      return;
    }

    if (this.laydownFormat == 'F' )
    {

      if ( this.dist1( this.cur_trace_point[1], this.cur_trace_point[0] ) < this.dist1_trace_eps )
      {
        //console.log("skipping extra add trace event (traces too close) [F]");
      }
      else
      {

        var ex = this.mouse_world_xy["x"];
        var ey = this.mouse_world_xy["y"];

        this.trace.push( { x : this.mouse_world_xy["x"], y : this.mouse_world_xy["y"] } );
        this.cur_trace_point.shift();
        this.cur_trace_point.push( { x : this.mouse_world_xy["x"], y : this.mouse_world_xy["y"] } );

        if (this.handlePossibleConnection( ex, ey, this.cur_layer ))
          return;

      }

    }
    else if (this.laydownFormat == 'J' )
    {

      if ( this.dist1( this.cur_trace_point[1], this.cur_trace_point[0] ) < this.dist1_trace_eps )
      {

        if ( this.dist1( this.cur_trace_point[2], this.cur_trace_point[1] ) < this.dist1_trace_eps )
        {
          //check for special case when direction blah blah blah
          //console.log("skipping extra add trace event (traces too close) [J]");

          return;
        }

      }
      else
      {
        var ex = this.mouse_world_xy["x"];
        var ey = this.mouse_world_xy["y"];

        if ( this.handlePossibleConnection( ex, ey, this.cur_layer ) )
        {
          return;
        }

        // if we in a weird state, don't let the user place the track
        //
        if (!this.allow_place_flag)
        {
          return;
        }

        /*
        for (var ind in this.cur_trace_point)
          if (this.dist1( this.cur_trace_point[ind], this.ghost_trace_point[ind] ) >= 1 )
            return;
           */

        var track = { x0 : this.cur_trace_point[0].x,
                      y0 : this.cur_trace_point[0].y,
                      x1 : this.cur_trace_point[1].x,
                      y1 : this.cur_trace_point[1].y,
                      width: this.trace_width,
                      layer : this.cur_layer,
                      color : this.color,
                      netcode: this.netcode,
                      shape : "track" };
                    
        this.trace_history.push(track);

        this.cur_trace_point.shift();

        var xy = g_snapgrid.snapGrid( this.mouse_world_xy );
        this.cur_trace_point.push( { x : xy.x, y : xy.y } );

        this.jointStateAngled = !this.jointStateAngled;

      }

    }

  }

}

//-----------------------------


toolTrace.prototype.doubleClick = function( button, x, y )
{

  // if we in a weird state, don't let the user place the track
  //
  if (!this.allow_place_flag)
  {
    return;
  }

  if (this.trace_history.length > 0)
  {
    this.placeTrack();
  }
  else
  {
    // If we've selected the toolTrace tool but haven't started placing a trace
    // (and we receive a doubleClick event),
    // do nothing but give control back to toolBoardNav
    //
    g_board_controller.board.unhighlightNet(); 

    g_board_controller.tool = new toolBoardNav( this.mouse_cur_x, this.mouse_cur_y );
    g_board_controller.guiToolbox.defaultSelect();

    var map = g_board_controller.board.kicad_brd_json.brd_to_sch_net_map;
    g_board_controller.board.updateRatsNest( undefined, undefined, map );

    g_painter.dirty_flag = true;
  }
}

//-----------------------------

toolTrace.prototype.mouseUp = function( button, x, y ) 
{
  this.mouse_down = false;

  if (button == 3)
    this.mouse_drag_flag = false;

}

//-----------------------------

//toolTrace.prototype._createAlignedJoint = function( start_point, end_point )
toolTrace.prototype._createAlignedJoint = function( s_point, e_point )
{
  var start_point = g_snapgrid.snapGrid( s_point );
  var end_point = g_snapgrid.snapGrid( e_point );

  var tracks = [];

  tracks.push( { x: start_point.x, y: start_point.y } );

  var cx = end_point.x;
  var cy = end_point.y;

  var dx = cx - start_point.x;
  var dy = cy - start_point.y;

  var mid_point = { x:0, y:0 };
  if ( Math.abs(dy) > Math.abs(dx) )
  {
    mid_point.x = start_point.x;
    if (dy > 0) mid_point.y = cy - Math.abs(dx);
    else        mid_point.y = cy + Math.abs(dx);
  }
  else
  {
    mid_point.y = start_point.y;
    if (dx > 0) mid_point.x = cx - Math.abs(dy);
    else        mid_point.x = cx + Math.abs(dy);
  }

  tracks.push(mid_point);
  tracks.push( { x : cx, y : cy } );

  return tracks;

}

//------------

//toolTrace.prototype._createAngledJoint = function( start_point, end_point )
toolTrace.prototype._createAngledJoint = function( s_point, e_point )
{
  var start_point = g_snapgrid.snapGrid( s_point );
  var end_point = g_snapgrid.snapGrid( e_point );

  var tracks = [];

  tracks.push( { x : start_point.x, y: start_point.y } );

  var cx = end_point.x;
  var cy = end_point.y;

  var dx = cx - start_point.x;
  var dy = cy - start_point.y;

  var mid_point = { x:0,y:0 };
  if ( Math.abs(dy) > Math.abs(dx) )
  {
    mid_point.x = cx; 
    if (dy > 0) mid_point.y = start_point.y + Math.abs(dx);
    else        mid_point.y = start_point.y - Math.abs(dx);
  }
  else
  {
    mid_point.y = cy;
    if (dx > 0) mid_point.x = start_point.x + Math.abs(dy);
    else        mid_point.x = start_point.x - Math.abs(dy);
  }

  tracks.push( mid_point );
  tracks.push( { x : cx, y : cy } );
  
  return tracks;
}

//------------

toolTrace.prototype._debug_print_v = function( v )
{
  for (var ind in v)
  {
    console.log( ind + ": " + v[ind].x + " " + v[ind].y );
  }
}

toolTrace.prototype._copy_trace = function( dst_trace, src_trace )
{
  for (var ind in src_trace )
  {
    dst_trace[ind].x = src_trace[ind].x;
    dst_trace[ind].y = src_trace[ind].y;
  }

}

toolTrace.prototype._load_prev_trace = function()
{

  for (var ind in this.cur_trace_point)
  {
    this.cur_trace_point[ind].x = this.prev_trace_point[ind].x ;
    this.cur_trace_point[ind].y = this.prev_trace_point[ind].y ;
  }

}


toolTrace.prototype._save_current_trace = function( )
{
  for (var ind in this.cur_trace_point)
  {
    this.prev_trace_point[ind].x = this.cur_trace_point[ind].x;
    this.prev_trace_point[ind].y = this.cur_trace_point[ind].y;
  }

}

toolTrace.prototype._load_current_trace = function( virtual_trace )
{
  for (var ind in this.cur_trace_point)
  {
    //this.prev_trace_point[ind].x = this.cur_trace_point[ind].x;
    //this.prev_trace_point[ind].y = this.cur_trace_point[ind].y;

    this.cur_trace_point[ind].x = virtual_trace[ind].x;
    this.cur_trace_point[ind].y = virtual_trace[ind].y;
  }

  this._copy_trace( this.ghost_trace_point, virtual_trace );
}

toolTrace.prototype._make_point_track = function( pnt_track, track, width )
{
  pnt_track["x0"] = track.x;
  pnt_track["y0"] = track.y;

  pnt_track["x1"] = track.x;
  pnt_track["y1"] = track.y;

  pnt_track["layer"] = track.layer;

  //pnt_track["width"] = this.trace_width;
  pnt_track["width"] = width;
  pnt_track["shape"] = track;
  pnt_track["shape_code"] = "0";
}


toolTrace.prototype._hitlist_has_middle_geometry = function( hit_ele_list, hit_ele_src, hit_ele_dst )
{

  for ( var ind in hit_ele_list)
  {
    var c=0;
    var id = hit_ele_list[ind].id;

    for (var s_ind in hit_ele_src)
    {
      if (hit_ele_src[ s_ind ].id == id) { 
        c++; 
      }
    }

    for (var d_ind in hit_ele_dst)
    {
      if (hit_ele_dst[ d_ind ].id == id) { 
        c++; 
      }
    }

    // There is geometry somewhere in the middle 
    // of the path, don't update, return
    //
    if (c==0) 
    {
      return 1;
    }
  }

  return 0;

}

toolTrace.prototype._choose_hit_element = function( hit_ele_list, pnt )
{
  var hit_ele = null;
  var min_d ;
  var track_hit_ele;

  for (var ind in hit_ele_list)
  {
    hit_ele = hit_ele_list[ind];
    if (hit_ele_list[ind].type == "pad")
      return hit_ele_list[ind];
    else 
    {
      //var d = this._point_trace_distance( hit_ele_list[ind], pnt );
      var d = this._point_trace_distance( pnt, hit_ele_list[ind].ref );

      if ( (ind == 0)  || ( d < min_d ))
      {
        track_hit_ele = hit_ele;
        min_d = d;
      }

    }
  }

  //return hit_ele;
  return track_hit_ele;

}


// "suck" trace point into pad
//
toolTrace.prototype._magnet_pad = function( trace_point, mod, pad )
{
  var pad_center = g_board_controller.board.getPadCenter( mod, pad );
  var snap_point = g_snapgrid.snapGrid( pad_center );
  trace_point.x = snap_point.x;
  trace_point.y = snap_point.y;
}

// "suck" users trace point into board's trace point
// 
toolTrace.prototype._magnet_trace = function( trace_point, track_ref )
{
  var eps = 0.00001;

  var u = [ parseFloat( track_ref.x0 ), parseFloat( track_ref.y0 ) ];
  var v = [ parseFloat( track_ref.x1 ), parseFloat( track_ref.y1 ) ];
  var p = [ parseFloat( trace_point.x ), parseFloat( trace_point.y ) ];

  var L = numeric.sub(v, u);
  var L_2 = numeric.norm2Squared( L );

  var alpha = u;
  if (L_2 > eps)
  {
    var P = numeric.sub(p, u);
    var t = numeric.dot( P, L ) / L_2;

    //var alpha = numeric.add( u, numeric.mul(t, L) );
    alpha = numeric.add( u, numeric.mul(t, L) );
  }

  var snap_point = g_snapgrid.snapGrid( { x: alpha[0], y: alpha[1] } );
  trace_point.x = snap_point.x;
  trace_point.y = snap_point.y;

}

// get distance between the trace_point and the line implied by track_ref
//
toolTrace.prototype._point_trace_distance = function( trace_point, track_ref )
{
  var dummy_point = {  x: trace_point.x, y: trace_point.y };

  this._magnet_trace( dummy_point, track_ref );

  var dx = dummy_point.x - trace_point.x;
  var dy = dummy_point.y - trace_point.y;

  var d = Math.sqrt(dx*dx + dy*dy);
  return d;

}

// Figure out what the joint should be from current jointStateAngled
// and return it.
//
toolTrace.prototype._make_joint_trace = function( virtual_trace )
{
  var n = virtual_trace.length;
  var fiddled_trace;
  if (this.jointStateAngled)
    fiddled_trace = 
      this._createAngledJoint( virtual_trace[0], virtual_trace[n-1] );
  else
    fiddled_trace =
      this._createAlignedJoint( virtual_trace[0], virtual_trace[n-1]);
  return fiddled_trace;
}

// Convert point array into list of tracks
//
// Inflate the width by clearance to make sure tracks don't get too close.
//
toolTrace.prototype._make_tracks_from_points = function( virtual_trace, layer, clearance )
{
  clearance = ( (typeof clearance !== 'undefined') ? parseInt(clearance) : 0 );
  var tracks = [];

  for (var ind=1; ind < virtual_trace.length; ind++)
  {
    var u = g_snapgrid.snapGrid( virtual_trace[ind-1] );
    var v = g_snapgrid.snapGrid( virtual_trace[ind] );
    var track =
    { x0 : u.x, y0 : u.y,
      x1 : v.x, y1 : v.y,
      shape : "track", shape_code : "0", width : parseFloat(this.trace_width) + parseFloat(clearance) ,
      layer : layer
    };
    tracks.push(track);

  }
  return tracks;
}


// This function does all the heavy lifting of figuring out if the track
// can be placed or not.
//
// We can start from a track or pad and end on a track or pad, as long as
// they are of the same net.  This is why we have start and end
// geometry considerations, to take into account the start and end pad/track.
//
// If there is middle geometry, regardless of whether it is of the same net,
// don't allow a placement (if this is desired, force the user to explicitely
// make a connection to bridge the pad/track).
//
// If the destination pad is of the same net, then 'suck' the trace point
// to the center.  If not of the same net, then 'suck' when it's within a small
// window (net joins will happen later).
//
// Finally, since we could have moved the trace, we might have introduced
// some extra collisions, so do a final check at the end.  If it fails, don't
// allow the placement, if it succeeds, then allow the placement.
//
// Populate non_intersect_trace_point if there is no intersecting middle 
// geometry and if there is no destination pad/track collision.  This
// will allow us to go back to a known good state.
//
// 
toolTrace.prototype.handleMagnetPoint = function( virtual_trace, layer )
{
  var clearance = g_parameter.clearance;



  // clearance as last value (in deci-mils)
  //
  var tracks = this._make_tracks_from_points( virtual_trace, layer, 2*clearance );  // WIDTH, not radius
  //var tracks = this._make_tracks_from_points( virtual_trace, layer, 0);

  var n = virtual_trace.length;
  //virtual_trace[n-1] = g_snapgrid.snapGrid( virtual_trace[n-1] );

  var src_track = {}, dst_track = {};
  this._make_point_track( src_track, virtual_trace[0], this.trace_width + 2*clearance );
  this._make_point_track( dst_track, virtual_trace[n-1], this.trace_width + 2*clearance );

  var hit_ele_list = g_board_controller.board.trackBoardIntersect( tracks, layer );
  var hit_ele_src = g_board_controller.board.trackBoardIntersect( [ src_track ], layer );
  var hit_ele_dst = g_board_controller.board.trackBoardIntersect( [ dst_track ], layer );

  if (this._hitlist_has_middle_geometry( hit_ele_list, hit_ele_src, hit_ele_dst ))
  {
    this._load_prev_trace();

    this.allow_place_flag = false;
    this.netcode_dst = -1;
    this.ele_dst = null;
    return;
  }
  else if (hit_ele_dst.length == 0)
  {
    this._save_current_trace();
  }

  var src_hit = this._choose_hit_element( hit_ele_src, virtual_trace[0]  );
  var dst_hit = this._choose_hit_element( hit_ele_dst, virtual_trace[n-1]  );

  var board = g_board_controller.board;

  // If we're starting out at a pad or track, suck the start 
  // to the element
  //
  if (this.trace_history.length == 0)
  {
    if (src_hit)
    {
      if ( src_hit.type == "pad" )
      {

        this._magnet_pad( virtual_trace[0], src_hit.ref, src_hit.pad_ref  );

        this.netcode = parseInt(src_hit.pad_ref.net_number);
        this.netcode_src = this.netcode;
        this.ele_src = src_hit;
      }
      else if (src_hit.type == "track")
      {
        this._magnet_trace( virtual_trace[0], src_hit.ref );

        this.netcode = parseInt(src_hit.ref.netcode);
        this.netcode_src = this.netcode;
        this.ele_src = src_hit;
      }

    }
  }


  if (dst_hit)
  {
    if (dst_hit.type == "pad" )
    {

      // If it's the same net, or within the small square window of the center, 
      // end it there.
      // Else, just return without updating anything.
      //
      var pad_center = g_board_controller.board.getPadCenter( dst_hit.ref, dst_hit.pad_ref );

      if ( board.areBoardNetsEqual( dst_hit.pad_ref.net_number, this.netcode ) ||
           (this.dist1( virtual_trace[n-1], pad_center ) < this.small_magnet_size) )
      {

        this._magnet_pad( virtual_trace[n-1], dst_hit.ref, dst_hit.pad_ref );
        virtual_trace = this._make_joint_trace( virtual_trace );

        // final check to make sure 'magnetized' track doesn't also
        // interect anything else.  
        // The final candidate for placed track might need to re-update
        // it's concept of what's the source and destination hit list,
        // so update those as well to determine placment.
        // If the fiddled track does intersect something, , just don't move.
        // Otherwise, commit the change.
        //
        // TODO: make this more modular so we can reuse it in other places.
        //
        //
        var fin_src_track = {}, fin_dst_track = {};
        this._make_point_track( fin_src_track, virtual_trace[0], this.trace_width + 2*clearance );
        this._make_point_track( fin_dst_track, virtual_trace[n-1], this.trace_width + 2*clearance );

        var fin_hit_ele_src = g_board_controller.board.trackBoardIntersect( [ fin_src_track ], layer );
        var fin_hit_ele_dst = g_board_controller.board.trackBoardIntersect( [ fin_dst_track ], layer );
        var fin_tracks = this._make_tracks_from_points( virtual_trace, layer,  2*clearance );
        var fin_hit_ele_list = g_board_controller.board.trackBoardIntersect( fin_tracks, layer );
        if (this._hitlist_has_middle_geometry( fin_hit_ele_list, fin_hit_ele_src, fin_hit_ele_dst ))
        {
          this.allow_place_flag = false;
          return;
        }


        if (this.state != "destination_magnet_pad")
        {
          //this._save_current_trace();
        }

        this._load_current_trace( virtual_trace );

        this.state = "destination_magnet_pad";
        this.allow_place_flag = true;

        this.netcode_dst = parseInt(dst_hit.pad_ref.netcode);
        this.ele_dst = dst_hit;

        return;

      }
      else
      {
        this.state = "destination_repel_pad";
        this._load_prev_trace();

        this.allow_place_flag = false;
        this.netcode_dst = -1;
        this.ele_dst = dst_hit;

        return;
      }

    }
    else if (dst_hit.type == "track")
    {

      var d = this._point_trace_distance( virtual_trace[n-1], dst_hit.ref);

      if ( board.areBoardNetsEqual( dst_hit.ref.netcode, this.netcode ) ||
           (d < this.small_trace_magnet_size) )
      {
        this._magnet_trace( virtual_trace[n-1], dst_hit.ref );
        virtual_trace = this._make_joint_trace( virtual_trace );

        if (this.state != "destination_magnet_trace")
        {
          //this._save_current_trace();
        }
        this._load_current_trace( virtual_trace );

        this.state = "destination_magnet_trace";
        this.allow_place_flag = true;

        this.netcode_dst = parseInt(dst_hit.ref.netcode);
        this.ele_dst = dst_hit;

        return;

      }
      else
      {
        this.state = "destination_repel_trace";
        this._load_prev_trace();

        this.allow_place_flag = false;
        this.netcode_dst = -1;
        this.ele_dst = null;

        return;

      }
    }

    virtual_trace = this._make_joint_trace( virtual_trace );

  } // if (dst_hit)


  this.netcode_dst = -1;
  this.ele_dst = null;

  // final check to make sure 'magnetized' track doesn't also
  // interect anything else.  
  // If the fiddled track does intersect something, , just don't move.
  // Otherwise, commit the change.
  //
  //var fin_tracks = this._make_tracks_from_points( virtual_trace, layer );
  var fin_tracks = this._make_tracks_from_points( virtual_trace, layer,  2*clearance );

  var fin_hit_ele_list = g_board_controller.board.trackBoardIntersect( fin_tracks, layer );

  if (this._hitlist_has_middle_geometry( fin_hit_ele_list, hit_ele_src, hit_ele_dst ))
  {
    this.allow_place_flag = false;
    return;
  }

  this.allow_place_flag = true;
  this._load_current_trace( virtual_trace );

  return;


}

toolTrace.prototype._via_intersect_test = function( virtual_trace, layer )
{
  var clearance = g_parameter.clearance;

  //add the via
  var p = virtual_trace[ virtual_trace.length-1 ];

  var tracks = [];
  tracks.push( { x0: p.x, x1: p.x, y0: p.y, y1 : p.y, shape: "through",
    shape_code : "0", width: 2*clearance + this.via_width,
    layer0: 0, layer1: 15 } );

  var hit_ele_list0 = g_board_controller.board.trackBoardIntersect( tracks, 0 );
  var hit_ele_list1 = g_board_controller.board.trackBoardIntersect( tracks, 15 );

  if ( (hit_ele_list0.length > 0) ||
       (hit_ele_list1.length > 0) )
  {
    return true;
  }

  return false;

}

toolTrace.prototype.mouseMove = function( x, y ) 
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

    if      (this.laydownFormat == 'F')
    {
      this.cur_trace_point[1]["x"] = this.mouse_world_xy["x"];
      this.cur_trace_point[1]["y"] = this.mouse_world_xy["y"];

      g_painter.dirty_flag = true;
    }
    else if (this.laydownFormat == 'J')
    {

      if (this.jointStateAngled)
      {
        var virtual_trace_point = 
          this._createAngledJoint( this.cur_trace_point[0], this.raw_mouse_world_xy );
      }
      else
      {
        var virtual_trace_point = 
          this._createAlignedJoint( this.cur_trace_point[0], this.raw_mouse_world_xy );
      }

      this._copy_trace( this.ghost_trace_point, virtual_trace_point );
      this.handleMagnetPoint( virtual_trace_point, this.cur_layer );

    }

  }


}

//-----------------------------

toolTrace.prototype.mouseDrag = function( dx, dy ) 
{
  g_painter.adjustPan ( dx, dy );
}

//-----------------------------

toolTrace.prototype.mouseWheel = function( delta )
{
  g_painter.adjustZoom ( this.mouse_cur_x, this.mouse_cur_y, delta );
}

//-----------------------------
// TESTING

toolTrace.prototype.keyDown = function( keycode, ch, ev )
{

  if ((ch == 'Q') || (keycode == 27))
  {
    g_board_controller.board.unhighlightNet(); 

    g_board_controller.tool = new toolBoardNav( this.mouse_cur_x, this.mouse_cur_y );
    g_board_controller.guiToolbox.defaultSelect();

    var map = g_board_controller.board.kicad_brd_json.brd_to_sch_net_map;
    g_board_controller.board.updateRatsNest( undefined, undefined, map );

    g_painter.dirty_flag = true;
  }

  // '+'
  else if ( keycode == 187 )
  {

    g_parameter.traceWidth += 10;
    this.trace_width = g_parameter.traceWidth;

    this.mouseMove( this.mouse_cur_x, this.mouse_cur_y );

  }

  // '-'
  else if ( keycode == 189 )
  {

    g_parameter.traceWidth -= 10;
    if (g_parameter.traceWidth < 80)
      g_parameter.traceWidth = 80;
    this.trace_width = g_parameter.traceWidth;

    this.mouseMove( this.mouse_cur_x, this.mouse_cur_y );

  }

  else if (ch =='V')
  {
    if (!this.allow_place_flag)
    {
      //console.log("intermediate state, ignoring via place request");
      return;
    }

    if (!this.startedFlag)
    {
      g_board_controller.guiLayer.toggleLayer();

      this.cur_layer_ind = (this.cur_layer_ind+1)%2;
      this.cur_layer = this.layer[ this.cur_layer_ind ];
      this.color = g_board_controller.board.layer_color[ this.layer[ this.cur_layer_ind ] ] ;

      var ele = document.getElementById("canvas");
      if ( this.cur_layer < 10 )
        ele.style.cursor = "url('img/cursor_custom_wire_s24_2.png') 4 3, cursor";
      else
        ele.style.cursor = "url('img/cursor_custom_wire_s24_red2.png') 4 3, cursor";

      g_painter.dirty_flag = true;
      return;
    }


    var ctp = this.cur_trace_point;

    if ( this._via_intersect_test( ctp, 0 ) )
    {
      return;
    }

    for (var ind = 1; ind < ctp.length; ind++ )
    {

      var track = { x0 : ctp[ind-1].x,
                    y0 : ctp[ind-1].y,
                    x1 : ctp[ind].x,
                    y1 : ctp[ind].y,
                    width : this.trace_width,
                    layer : this.cur_layer,
                    color : this.color,
                    shape : "track" };

      this.trace_history.push( track );

    }

    var via = { x : this.mouse_world_xy.x,
                y : this.mouse_world_xy.y,
                width : this.via_width,
                shape : "through",
                layer0 : this.layer[0],
                layer1 : this.layer[1] };

    this.trace_history.push( via );

    var x = this.mouse_world_xy.x;
    var y = this.mouse_world_xy.y;

    if ( this.laydownFormat == 'J' )
    {
      this.cur_trace_point = [ 
        { x : x, y : y },
        { x : x, y : y },
        { x : x, y : y } 
      ];

      // deferring to how KiCAD does it...
      // Since we're laying down two tracks and starting
      // ont a third, state would be shifted if we didn't
      // explicitely change it.  This way, tracks can
      // extend straight, but it also means they can
      // run at right angles to each other (at a via 'joint')...
      //
      this.jointStateAngled = !this.jointStateAngled;
    }
    else
    {
      this.cur_trace_point = [ 
        { x : x, y : y }, 
        { x : x, y : y } 
      ];
    }


    g_board_controller.guiLayer.toggleLayer();

    this.cur_layer_ind = (this.cur_layer_ind+1)%2;
    this.cur_layer = this.layer[ this.cur_layer_ind ];
    this.color = g_board_controller.board.layer_color[ this.layer[ this.cur_layer_ind ] ] ;

    var ele = document.getElementById("canvas");
    if ( this.cur_layer < 10 )
      ele.style.cursor = "url('img/cursor_custom_wire_s24_2.png') 4 3, cursor";
    else
      ele.style.cursor = "url('img/cursor_custom_wire_s24_red2.png') 4 3, cursor";



    g_painter.dirty_flag = true;
  }

}

//-----------------------------

toolTrace.prototype.keyUp = function( keycode, ch, ev )
{
  //console.log("toolTrace keyUp: " + keycode + " " + ch );
}


