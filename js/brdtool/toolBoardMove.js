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


// Need to figure out if we keep the type specific component operations here
// or move them somewhere else.
// Yeah, it's pretty bad.  We'll have to figure out a way to make it more consistent
// and robust.
//

function toolBoardMove( mouse_x, mouse_y, id_ref_array, processInitialMouseUp  ) 
{

  mouse_x = ( typeof mouse_x !== 'undefined' ? mouse_x : 0 );
  mouse_y = ( typeof mouse_y !== 'undefined' ? mouse_y : 0 );
  processInitialMouseUp = ( typeof processInitialMouseUp !== 'undefined' ? processInitialMouseUp : true );


  if ( typeof id_ref_array === 'undefined' )
  {
    console.log("toolBoardMove: WARNING: id_ref_ar, empty, handing back control to toolBoardNav");
    this.shutdown = true;
    g_board_controller.tool = new toolBoardNav(mouse_x, mouse_y);

    var brd = g_board_controller.board.kicad_brd_json;
    var map = brd.brd_to_sch_net_map;
    g_board_controller.board.updateRatsNest( undefined, undefined, map );

    return g_board_controller.tool;  // iffy, be careful
  }

  this.mouse_cur_x = mouse_x;
  this.mouse_cur_y = mouse_y;

  this.orig_element_state = [];  // so we can go back to our original state when we 'esc'
  this.base_element_state = [];  // so we can use absolute world delta position, instead of incremental ones

  this.mouse_drag_button = false;
  
  this.drawHighlightRect = true;

  this.orig_world_xy = g_painter.devToWorld( mouse_x, mouse_y );
  this.prev_world_xy = g_painter.devToWorld( mouse_x, mouse_y );
  this.cur_world_xy  = g_painter.devToWorld( mouse_x, mouse_y );

  this.snap_world_xy = g_snapgrid.snapGrid (this.prev_world_xy);

  this.cursorSize = 6;
  this.cursorWidth = 1;

  this.groupId = String(guid());


  // Since we hand back control on a mouse up instead of a mouse down event
  // and we were handed control from a mouse down event, we need to ignore
  // the initial mouse up event.
  //
  this.processMouseUp = processInitialMouseUp;

  this.rotateCount = 0;
  this.selectedElement = null;
  this.ghostElement = null;
  this.origElements = null;

  this.addElement( id_ref_array );

  // EXPERIMENTAL
  // We will need to come back to this later when we have
  // global parameters that can feed into the local paramter
  // (or just use the global parameters directly)
  //
  //this.clearance = 100;  // 10 mils
  this.clearance = g_parameter.clearance;

  //this.allowPlaceFlag = false;
  this.allowPlaceFlag = this.canPlace();

  var d = new Date();
  this.move_prev_ms = d.getTime();
  this.move_heuristic_ms = 100;

  this.dirty = true;

  this.shutdown = false;

  //setInterval( function(xx) { return function() { xx.tick(); }; }(this), 100 );
  setTimeout( function(xx) { return function() { xx.tick(); }; }(this), 100 );

}

toolBoardMove.prototype.tick = function()
{

  if (this.shutdown) { return; }

  if (this.dirty)
  {

    this.allowPlaceFlag = this.canPlace();

    this.selectedElement = simplecopy( this.base_element_state );
    var world_xy = g_painter.devToWorld( this.mouse_cur_x, this.mouse_cur_y );

    var wdx = world_xy["x"] - this.orig_world_xy["x"];
    var wdy = world_xy["y"] - this.orig_world_xy["y"];

    if (this.allowPlaceFlag)
    {
      for (var ind in this.selectedElement)
      {
        g_board_controller.board.relativeMoveElement( this.selectedElement[ind], wdx, wdy );
        g_painter.dirty_flag = true;
      }
      this.updateSelectedRatsnest();
    }
    else
    {
      this.updateSelectedRatsnest();
    }

  }

  setTimeout( function(xx) { return function() { xx.tick(); }; }(this), 100 );
}

toolBoardMove.prototype.mouseDrag  = function( dx, dy ) { g_painter.adjustPan( dx, dy ); }
toolBoardMove.prototype.mouseWheel = function( delta )  { g_painter.adjustZoom ( this.mouse_cur_x, this.mouse_cur_y, delta ); }



toolBoardMove.prototype.addElement = function( id_ref_array )
{

  this.origElements = id_ref_array;
  this.selectedElement = simplecopy( id_ref_array );
  this.ghostElement = simplecopy( id_ref_array );

  for (var ind in this.origElements)
  {
    this.origElements[ind].ref.hideFlag = true;
  }

  var world_xy = g_painter.devToWorld( this.mouse_cur_x, this.mouse_cur_y );

  this.prev_world_xy["x"] = world_xy["x"];
  this.prev_world_xy["y"] = world_xy["y"];

  this.cur_world_xy["x"] = world_xy["x"];
  this.cur_world_xy["y"] = world_xy["y"];

  this.orig_world_xy["x"] = world_xy["x"];
  this.orig_world_xy["y"] = world_xy["y"];

  this.snap_world_xy = g_snapgrid.snapGrid( g_painter.devToWorld( this.mouse_cur_x, this.mouse_cur_y ) );

  this.orig_element_state = simplecopy( id_ref_array );
  this.base_element_state = simplecopy( id_ref_array );

  g_painter.dirty_flag = true;
}

toolBoardMove.prototype.drawOverlayElementArray = function( ele_ar, ghostFlag )
{

  for (var ind in ele_ar )
  {
    //var ref = this.selectedElement[ind]["ref"];
    var ref = ele_ar[ind].ref;

    g_board_controller.board.updateBoundingBox( ref );

    if (ghostFlag)
      g_board_controller.board.drawGhostElement( ref );
    else
      g_board_controller.board.drawElement( ref );

    if (!ghostFlag)
    {

      if ( (ref.type == "track") || (ref.type == "drawsegment") )
      {
        var w = parseFloat( ref.width );
        g_painter.line( ref.x0, ref.y0, ref.x1, ref.y1, "rgba(255,255,255,0.25)", 2*w );
      }
      else
      {
        var bbox = ref["bounding_box"];

        var x = bbox[0][0];
        var y = bbox[0][0];
        var w = bbox[1][0] - bbox[0][0];
        var h = bbox[1][1] - bbox[0][1];

        g_painter.drawRectangle( bbox[0][0], bbox[0][1],
                                 w, h, 
                                 10, "rgb(128,128,128)",
                                 true, "rgba(255,255,255,0.25)");
      }

    }

  }

}

toolBoardMove.prototype.drawOverlay = function()
{

  var s = this.cursorSize / 2;

  g_painter.drawRectangle( this.snap_world_xy["x"] - s, 
                           this.snap_world_xy["y"] - s, 
                           this.cursorSize ,
                           this.cursorSize ,
                           this.cursorWidth ,
                           "rgb(128, 128, 128 )" );

  if (this.allowPlaceFlag)
  {
    this.drawOverlayElementArray( this.selectedElement, false );
  }
  else
  {
    this.drawOverlayElementArray( this.ghostElement , true );
  }


  g_board_controller.display_text = "x: " + this.snap_world_xy.x + ", y: " + this.snap_world_xy.y;

}

// Moved release control to mouse up so double clicks work out.
//
toolBoardMove.prototype.mouseDown = function( button, x, y )
{

  if (button == 3)
  {
    this.mouse_drag_button = true;
  }

}

toolBoardMove.prototype.doubleClick = function( button, x, y )
{

  var world_coord = g_painter.devToWorld( x, y );
  var id_ref =  g_board_controller.board.pick( world_coord["x"], world_coord["y"] );

  if (id_ref)
  {

    for (var ind in this.origElements)
    {
      this.origElements[ind].ref.hideFlag = false;
    }

    if (id_ref.ref.type == "module")
    {
      console.log("toolBoardMove.doubleClick: editing not implemented " +
          "(not passing control), passing off to toolBoardNav instead");

      this.shutdown = true;
      g_board_controller.tool = new toolBoardNav(x, y);


      g_painter.dirty_flag = true;

      var brd = g_board_controller.board.kicad_brd_json;
      var map = brd.brd_to_sch_net_map;
      g_board_controller.board.updateRatsNest( undefined, undefined, map );

    }

  }
  else
  {

  }


}

// Return true on first collision, false otherwise.
//
// Do a simple sweep to see if we have any collisions.  If we do, then
// we'll have to do net allocations and the like, but if not, we can just
// keep nets as they are.  
//
toolBoardMove.prototype._testForModuleCollision = function( ref )
{
  /*
  var n = this.selectedElement.length;
  if ( n != 1 ) return false;

  var ref = this.selectedElement[0].ref;
  var type = ref.type;
  if ( type != "module" ) return false;
  */


  var board = g_board_controller.board;
  var brd_eles = board.kicad_brd_json.element;

  var pads = ref.pad;

  for (var ind in pads)
  {
    var pad = pads[ind];

    for (var brd_ind in brd_eles)
    {
      var brd_ele = brd_eles[brd_ind];
      var brd_type = brd_ele.type;
      if ( brd_type != "track" ) continue;
      if ( !board._box_box_intersect( brd_ele.bounding_box, pad.bounding_box ) ) continue;

      var pgnBrd = board._build_element_polygon( { type: "track", ref: brd_ele } );
      var pgnEle = board._build_element_polygon( { type: "pad", ref: ref, pad_ref: pad, id : pad.id } );

      if ( board._pgn_intersect_test( [ pgnBrd ], [ pgnEle ] ) ) 
        return true;

    }

  }

  return false;

}

toolBoardMove.prototype._testForTrackCollision = function( ref )
{

  var board = g_board_controller.board;
  var brd_eles = board.kicad_brd_json.element;

  var pgnTrack = board._build_element_polygon( { type: "track", ref: ref, id : ref.id } );
  var brd_track_ref = board.refLookup( ref.id );

  for (var brd_ind in brd_eles)
  {
    var brd_ele = brd_eles[brd_ind];
    var brd_type = brd_ele.type;
    if ( brd_ele.hideFlag ) continue;
    if ( brd_type != "track" ) continue;  // only allow track-track overlaying

    var l0 = { x : parseFloat(ref.x0) , y : parseFloat(ref.y0) };
    var l1 = { x : parseFloat(ref.x1) , y : parseFloat(ref.y1) };
    var w = parseFloat(ref.width) + this.clearance;

    if ( !board._box_line_intersect( brd_ele.bounding_box, l0, l1, w ) ) continue;

    var pgnBrd = board._build_element_polygon( { type: "track", ref: brd_ele, id : brd_ele.id } );

    if ( board._pgn_intersect_test( [ pgnBrd ], [ pgnTrack ] ) ) 
    {
      return true;
    }

  }

  return false;

}

// Check for track and pad detection
toolBoardMove.prototype._testForTrackCollisionAll = function( ref )
{

  var board = g_board_controller.board;
  var brd_eles = board.kicad_brd_json.element;

  var pgnTrack = board._build_element_polygon( { type: "track", ref: ref, id : ref.id } );
  var brd_track_ref = board.refLookup( ref.id );

  for (var brd_ind in brd_eles)
  {
    var brd_ele = brd_eles[brd_ind];
    var brd_type = brd_ele.type;
    if ( brd_ele.hideFlag ) continue;
    //if ( brd_type != "track" ) continue;  // only allow track-track overlaying

    if ( (brd_type != "track") && (brd_type != "module") ) continue;

    var l0 = { x : parseFloat(ref.x0) , y : parseFloat(ref.y0) };
    var l1 = { x : parseFloat(ref.x1) , y : parseFloat(ref.y1) };
    var w = parseFloat(ref.width) + this.clearance;

    if ( !board._box_line_intersect( brd_ele.bounding_box, l0, l1, w ) ) continue;

    if (brd_type == "track")
    {
      var pgnBrd = board._build_element_polygon( { type: "track", ref: brd_ele, id : brd_ele.id } );
      if ( board._pgn_intersect_test( [ pgnBrd ], [ pgnTrack ] ) ) 
        return true;
    }

    else if (brd_type == "module")
    {
      if (!("pad" in brd_ele)) continue;

      for (var p_ind in brd_ele.pad)
      {
        var pad = brd_ele.pad[p_ind];
        var pgnBrd = board._build_element_polygon( { type: "pad", ref: brd_ele, pad_ref: pad, id : pad.id } );
        if ( board._pgn_intersect_test( [ pgnBrd ], [ pgnTrack ] ) ) 
          return true;
      }

    }

  }

  return false;

}





// Initially, allocate completely new net numbers for each module
// pad that we're placing.
// For each mergenet operation (pad-track intersection), get the
// pad net number from doing a ref lookup by id to ensure we
// have the most current version of the pad name, then do a merge.
//
// 

// deprecated...
//
toolBoardMove.prototype._createPadModuleNets = function( pads )
{
  var board = g_board_controller.board;
  var brd_eles = board.kicad_brd_json.element;

  // Create new nets for pads of module
  //
  for (var ind in pads)
  {
    var pad = pads[ind];

    var newnet = board.genNet();

    var op = { source: "brd", destination: "brd" };
    op.action = "add";
    op.type = "net";
    op.data = { net_number : newnet.net_number,
                net_name : newnet.net_name };
    op.groupId = this.groupId;
    g_board_controller.opCommand( op );

    var brd_pad_ref = board.refLookup( pad.id );

    var old_pad = {};
    var new_pad = {};

    $.extend( true, old_pad, brd_pad_ref );
    $.extend( true, new_pad, brd_pad_ref );

    new_pad.net_number = newnet.net_number;
    new_pad.net_name = newnet.net_name;

    var op2 = { source: "brd", destination: "brd" };
    op2.action = "update";
    op2.type = "edit";
    op2.id = [ brd_pad_ref.id ];
    op2.data = { element: [ new_pad ], oldElement: [ old_pad ] };
    op2.groupId = this.groupId;
    g_board_controller.opCommand( op2 );

  }

}

toolBoardMove.prototype._hasCollisionFromTo = function()
{

  if ( g_board_controller.board.intersectTest( this.orig_element_state, this.clearance ) )
  {
    return true;
  }

  if ( g_board_controller.board.intersectTest( this.selectedElement, this.clearance ) )
  {
    return true;
  }

  return false;

}

//----------------------------------------------
//----------------------------------------------
//----------------------------------------------
//----------------------------------------------
//----------------------------------------------

// This should be double checkd, there might be some lurking
// bugs...
//
toolBoardMove.prototype._patchUpNets = function()
{
  var splitnet_num = {};

  if ( !this._hasCollisionFromTo() )
  {
    return;
  }

  // Collect all the net numbers that we will be
  // replacing
  //
  var netReplaceSet = {};
  for (var ind in this.selectedElement)
  {
    var ref = this.selectedElement[ind].ref;
    var type = ref.type;

    if ( type == "track" )
      netReplaceSet[ ref.netcode ] = true;
    else if ( type == "module" )
    {
      if (!("pad" in ref)) continue;
      for ( var pad_ind in ref.pad )
      {
        var pad = ref.pad[pad_ind];
        netReplaceSet[ pad.net_number ] = true;
      }
    }

  }

  // Create the new nets, one for each unique net collected
  // above.
  //
  var newnets = {};
  for (var nc in netReplaceSet)
  {
    var net = g_board_controller.board.genNet();
    newnets[ nc ] = net;

    var net_op = { source: "brd", destination: "brd" };
    net_op.action = "add";
    net_op.type = "net";
    net_op.data = { net_number : net.net_number,
                net_name : net.net_name };
    net_op.groupId = this.groupId;
    g_board_controller.opCommand( net_op );

  }

  // Allocate the net numbers to the relevant elements
  //
  var board = g_board_controller.board;
  for (var ind in this.selectedElement)
  {
    var ref = this.selectedElement[ind].ref;
    var type = ref.type;

    if (type == "track")
    {
      var nc = ref.netcode;
      ref.netcode = newnets[ nc ].net_number;

      var brd_track_ref = board.refLookup( ref.id );
      var old_data = {};
      var new_data = {};

      $.extend( true, old_data, brd_track_ref );
      $.extend( true, new_data, brd_track_ref );

      // We've created it from doing a refLookup,
      // so it's hidden while we move it around
      // in this tool.  Unhide it.
      old_data.hideFlag = false;
      new_data.hideFlag = false;

      new_data.netcode = newnets[ nc ].net_number;

      var update_op = { source: "brd", destination: "brd" };
      update_op.action = "update";
      update_op.type = "edit";
      update_op.id = [ brd_track_ref.id ];
      update_op.data = { element: [ new_data ], oldElement: [ old_data ] };
      update_op.groupId = this.groupId;
      g_board_controller.opCommand( update_op );

    }

    else if (type == "module")
    {
      if (!("pad" in ref)) continue;

      for (var pad_ind in ref.pad)
      {
        var nc = ref.pad[pad_ind].net_number;

        var pad_ref = board.refLookup( ref.pad[pad_ind].id );
        var old_data = {};
        var new_data = {};

        $.extend( true, old_data, pad_ref );
        $.extend( true, new_data, pad_ref );

        new_data.net_number = newnets[ nc ].net_number;
        new_data.net_name   = newnets[ nc ].net_name;

        var update_op = { source: "brd", destination: "brd" };
        update_op.action = "update";
        update_op.type = "edit";
        update_op.id = [ pad_ref.id ];
        update_op.data = { element: [ new_data ], oldElement: [ old_data ] };
        update_op.groupId = this.groupId;
        g_board_controller.opCommand( update_op );

      }
    }

  }

  var brd_eles = board.kicad_brd_json.element;
  for (var brd_ind in brd_eles)
  {
    var brd_ref = brd_eles[brd_ind];
    var brd_type = brd_ref.type;

    if (brd_ref.hideFlag) continue;
    if (("name" in brd_ref) && (brd_ref.name == "unknown")) continue;

    for ( var ind in this.selectedElement )
    {
      var ele_ref = this.selectedElement[ind].ref;

      ele_ref = board.refLookup( ele_ref.id );
      var ele_type = ele_ref.type;

      if ( (ele_type == "track") && (brd_type == "track") )
      {
        var l0 = { x : parseFloat(ele_ref.x0) , y : parseFloat(ele_ref.y0) };
        var l1 = { x : parseFloat(ele_ref.x1) , y : parseFloat(ele_ref.y1) };
        var w = parseFloat(ele_ref.width) ;

        if ( !board.shareLayer( brd_ref, ele_ref ) ) continue;

        //if ( !board._box_line_intersect( brd_ref.bounding_box, l0, l1, w ) ) continue;

        if ( board._box_line_intersect( brd_ref.bounding_box, l0, l1, w ) )
        {

          var pgnEle = board._build_element_polygon( { type: "track", ref: ele_ref } );
          var pgnBrd = board._build_element_polygon( { type: "track", ref: brd_ref } );

          if ( board._pgn_intersect_test( [ pgnBrd ], [ pgnEle ] ) )
          {
            var op = { source: "brd", destination: "brd" };
            op.action = "update";
            op.type = "mergenet";
            op.data = { net_number0: brd_ref.netcode, net_number1: ele_ref.netcode };
            op.groupId = this.groupId;
            g_board_controller.opCommand( op );
          }

        }

        splitnet_num[ ele_ref.netcode ] = 1;
        splitnet_num[ brd_ref.netcode ] = 1;

      }
      else if ( (type == "track") && (brd_type == "module") )
      {

        var l0 = { x : parseFloat(ele_ref.x0) , y : parseFloat(ele_ref.y0) };
        var l1 = { x : parseFloat(ele_ref.x1) , y : parseFloat(ele_ref.y1) };
        var w = parseFloat(ele_ref.width) ;
        var pgnTrack = board._build_element_polygon( { type: "track", ref: ele_ref } );

        for (var p_ind in brd_ref.pad)
        {
          var pad = brd_ref.pad[p_ind];
          if ( !board.shareLayer( pad, ele_ref ) ) continue;

          //if ( !board._box_line_intersect( pad.bounding_box, l0, l1, w ) ) continue;

          if ( board._box_line_intersect( pad.bounding_box, l0, l1, w ) )
          {

            var pgnBrd = board._build_element_polygon( { type: "pad", ref: brd_ref, pad_ref: pad } );

            if ( board._pgn_intersect_test( [ pgnBrd ], [ pgnTrack ] ) )
            {
              var op = { source: "brd", destination: "brd" };
              op.action = "update";
              op.type = "mergenet";
              op.data = { net_number0: pad.net_number, net_number1: ele_ref.netcode };
              op.groupId = this.groupId;
              g_board_controller.opCommand( op );
            }

          }

          splitnet_num[ ele_ref.netcode ] = 1;
          splitnet_num[ pad.net_number ] = 1;

        }

      }
      else if ( (type == "module") && (brd_type == "track") )
      {

        var l0 = { x : parseFloat(brd_ref.x0) , y : parseFloat(brd_ref.y0) };
        var l1 = { x : parseFloat(brd_ref.x1) , y : parseFloat(brd_ref.y1) };
        var w = parseFloat(brd_ref.width) ;
        var pgnBrd = board._build_element_polygon( { type: "track", ref: brd_ref } );

        for (var p_ind in ele_ref.pad)
        {
          var pad = ele_ref.pad[p_ind];

          if ( !board.shareLayer( brd_ref, pad ) ) continue;

          //if ( !board._box_line_intersect( pad.bounding_box, l0, l1, w ) ) continue;

          if ( board._box_line_intersect( pad.bounding_box, l0, l1, w ) )
          {

            var pgnEle = board._build_element_polygon( { type: "pad", ref: ele_ref, pad_ref: pad } );

            if ( board._pgn_intersect_test( [ pgnBrd ], [ pgnEle ] ) )
            {
              var op = { source: "brd", destination: "brd" };
              op.action = "update";
              op.type = "mergenet";
              op.data = { net_number0: brd_ref.netcode, net_number1: pad.net_number };
              op.groupId = this.groupId;
              g_board_controller.opCommand( op );
            }

          }

          splitnet_num[ pad.net_number ] = 1;
          splitnet_num[ brd_ref.netcode ] = 1;

        }

      }

      // I'm not sure this should happen...
      //
      else if ( (type == "module") && (brd_type == "module") )
      {

        for (var brd_p_ind in brd_ref.pad)
        {
          var brd_pad = brd_ref.pad[brd_p_ind];
          var pgnBrd = board._build_element_polygon( { type: "pad", ref: brd_ref, pad_ref: brd_pad } );

          for (var ele_p_ind in ele_ref.pad)
          {
            var ele_pad = ele_ref.pad[ele_p_ind];

            //if ( !board._box_box_intersect( brd_pad.bounding_box, ele_pad.bounding_box, this.clearance ) )
            //  continue;

            if ( board._box_box_intersect( brd_pad.bounding_box, ele_pad.bounding_box, this.clearance ) )
            {

              var pgnEle = board._build_element_polygon( { type: "pad", ref: ele_ref, pad_ref: ele_pad } );

              if ( board._pgn_intersect_test( [ pgnBrd ], [ pgnEle ] ) )
              {
                var op = { source: "brd", destination: "brd" };
                op.action = "update";
                op.type = "mergenet";
                op.data = { net_number0: ele_pad.net_number, net_number1: brd_pad.net_number };
                op.groupId = this.groupId;
                g_board_controller.opCommand( op );
              }

            }

            splitnet_num[ ele_pad.net_number ] = 1;
            splitnet_num[ brd_pad.net_number ] = 1;

          }

        }

      }

    }

  }

  var count = 0;

  /*
  // This might be a significant slowdown.  If it becomes a
  // problem we'll have to speed up the split net...
  //
  for (var nc in splitnet_num ) {
    var split_op = { source: "brd", destination: "brd" };
    split_op.action = "update";
    split_op.type = "splitnet";
    split_op.data = { net_number: nc };
    split_op.groupId = this.groupId;
    g_board_controller.opCommand( split_op );

    console.log(nc);
    count++;
  }
  */

  // This might be a significant slowdown.  If it becomes a
  // problem we'll have to speed up the split net...
  //
  var split_op = { source: "brd", destination: "brd" };
  split_op.action = "update";
  split_op.type = "splitnets";
  split_op.data = [] ; //{ net_number: nc };
  split_op.groupId = this.groupId;

  for (var nc in splitnet_num ) {
    split_op.data.push( { net_number : nc } );
    count++;
  }
  g_board_controller.opCommand( split_op );

  // finally update net maps and rats nest
  //
  var map_op = { source: "brd", destination: "brd" };
  map_op.action = "update";
  map_op.type = "schematicnetmap";
  map_op.groupId = this.groupId;
  g_board_controller.opCommand( map_op );


}

//----------------------------------------------
//----------------------------------------------
//----------------------------------------------
//----------------------------------------------
//----------------------------------------------


toolBoardMove.prototype.mouseUp = function( button, x, y )
{

  this.mouse_drag_button = false;

  if (this.processMouseUp)
  {

    if (button == 1)
    {

      if (!this.allowPlaceFlag)
      {
        g_board_controller.fadeMessage( "Sorry, cannot place! There are too many intersections" );
        return;
      }

      var world_xy = g_painter.devToWorld( this.mouse_cur_x, this.mouse_cur_y );
      var wdx = world_xy["x"] - this.orig_world_xy["x"];
      var wdy = world_xy["y"] - this.orig_world_xy["y"];
      if ( g_snapgrid.active )
      {
        var ta = g_snapgrid.snapGrid( world_xy );
        var tb = g_snapgrid.snapGrid( this.orig_world_xy );
        wdx = ta["x"] - tb["x"];
        wdy = ta["y"] - tb["y"];
      }

      var com = g_board_controller.board.centerOfMass( this.base_element_state );
      com = g_snapgrid.snapGrid(com);


      // moveGroup pushes state?  Make sure to unset hideFlag
      // before we push state.
      //
      for (var ind in this.origElements )
      {
        var ref = g_board_controller.board.refLookup( this.selectedElement[ind].id );
        ref.hideFlag = false;
      }

      if ( (wdx != 0) || (wdy != 0) ||
           (this.rotateCount != 0) )
      {
        var op = { "source" : "brd", "destination" : "brd" };
        op.action = "update";
        op.type = "moveGroup";
        op.id = [];
        op.data = { dx: wdx, dy: wdy,
                    rotateCount : this.rotateCount,
                    cx : com.x, cy: com.y };

        for (var ind in this.selectedElement)
        {
          op.id.push( this.selectedElement[ind].id );
        }
        op.groupId = this.groupId;
        g_board_controller.opCommand( op );


        // We have to hid them (again) to make sure it
        // doesn't fail the intersectino test above
        // because it's unhidden.
        //
        var se = this.selectedElement;
        for (var ind in se)
        {
          var r = g_board_controller.board.refLookup( se[ind].id );
          r.hideFlag = true;
        }

        this._patchUpNets();

        // restore state.
        //
        for (var ind in this.selectedElement)
        {
          var r = g_board_controller.board.refLookup( se[ind].id );
          r.hideFlag = true;
        }

      }


      // refs could have changed out from under us, so 
      // be sure to use .refLookup to find the current version.
      //
      for (var ind in this.origElements )
      {
        var ref = g_board_controller.board.refLookup( this.origElements[ind].ref.id );
        ref.hideFlag = false;
      }

      this.shutdown = true;
      g_board_controller.tool = new toolBoardNav(x, y);
      g_painter.dirty_flag = true;

      var brd = g_board_controller.board.kicad_brd_json;
      var map = brd.brd_to_sch_net_map;
      g_board_controller.board.updateRatsNest( undefined, undefined, map );

    }
  }

  this.processMouseUp = true;


}

// Update rats nest for selected elements.  It's too slow to
// recalculate all rats nest, so select only the nets that appear
// int the selected elements to upate.
//
toolBoardMove.prototype.updateSelectedRatsnest = function( )
{

  var selected_ar = this.ghostElement;

  var brd = g_board_controller.board.kicad_brd_json;
  var map = brd.brd_to_sch_net_map;

  var ncs = {};
  for (var ind in selected_ar)
  {
    var ref = selected_ar[ind].ref;

    if (ref.type == "track")
    {
      var nc = parseInt(ref.netcode);
      ncs[ nc ] = nc;
    }
    else if (ref.type == "module")
    {
      if ("pad" in ref)
      {
        for (var p_ind in ref.pad)
        {
          var nc = parseInt(ref.pad[p_ind].net_number);
          ncs[ nc ] = nc;
        }
      }
    }

  }

  for (var nc in ncs)
  {
    //g_board_controller.board.updateRatsNest( nc, this.selectedElement, map );
    g_board_controller.board.updateRatsNest( nc, selected_ar, map );
  }

}

// clipperlib is just too slow for real time intersection testing.
// As a compromise, call allowPlacement with a heuristic that will
// only do bounding box intersections if we've recently moved.
// Heuristic level of 0 is the full test, with polygon intersections
// and only allow that to happen if we've stabalized.
//
toolBoardMove.prototype.canPlace = function()
{
  var d = new Date();
  var cur_ms = d.getTime();
  if ((cur_ms - this.move_prev_ms) > this.move_heuristic_ms)
  {
    this.dirty = false;
    return g_board_controller.board.allowPlacement( this.ghostElement, this.clearance, undefined, 0 );
  }
  else
  {
    return g_board_controller.board.allowPlacement( this.ghostElement, this.clearance, undefined, 1 );
  }

}


// Move is a bit slow.  I think it's jquery's extend.
// We probably want to do our own deep copy.
// We can probably expect roughly 4x improvement. extend is soaking 
// up about 10-20% (maybe more) cpu when doing a toolmove.
// for future refernce:
// http://stackoverflow.com/questions/122102/most-efficient-way-to-clone-an-object/5344074#5344074
// http://jsperf.com/cloning-an-object/2
// http://stackoverflow.com/questions/122102/most-efficient-way-to-clone-an-object
//
//

toolBoardMove.prototype.mouseMove = function( x, y )
{

  if (this.mouse_drag_button == true)
    this.mouseDrag ( x - this.mouse_cur_x, y - this.mouse_cur_y );

  this.mouse_cur_x = x;
  this.mouse_cur_y = y;

  if (this.mouse_drag_button == false)
  {

    var d = new Date();
    this.move_prev_ms = d.getTime();
    this.dirty = true;


    var world_xy = g_painter.devToWorld( this.mouse_cur_x, this.mouse_cur_y );

    var wdx = world_xy["x"] - this.orig_world_xy["x"];
    var wdy = world_xy["y"] - this.orig_world_xy["y"];

    if ( g_snapgrid.active )
    {
      var ta = g_snapgrid.snapGrid( world_xy );
      var tb = g_snapgrid.snapGrid( this.orig_world_xy );
      wdx = ta["x"] - tb["x"];
      wdy = ta["y"] - tb["y"];
    }

    // Copy original information back to do relative move
    //
    this.selectedElement = simplecopy( this.base_element_state );
    this.ghostElement = simplecopy( this.base_element_state );
    for (var ind in this.ghostElement)
    {
      g_board_controller.board.relativeMoveElement( this.ghostElement[ind], wdx, wdy );

      var ele = this.ghostElement[ind].ref ;
      var type = ele.type;

      if ( type == "module")
        g_board_controller.board._find_footprint_bbox( ele );
      else if ( type == "track" )
        g_board_controller.board._find_line_bbox( ele );

      g_painter.dirty_flag = true;
    }

    this.allowPlaceFlag = this.canPlace();

    if (this.allowPlaceFlag)
    {
      for (var ind in this.selectedElement)
      {
        g_board_controller.board.relativeMoveElement( this.selectedElement[ind], wdx, wdy );
        g_painter.dirty_flag = true;
      }
      this.updateSelectedRatsnest();
    }
    else
    {
      this.updateSelectedRatsnest();
    }

    this.prev_world_xy["x"] = world_xy["x"];
    this.prev_world_xy["y"] = world_xy["y"];


  }

}

toolBoardMove.prototype.keyDown = function( keycode, ch, ev )
{

  if (keycode == 27)
  {

    for (var ind in this.origElements)
    {
      this.origElements[ind].ref.hideFlag = false;
    }

    this.shutdown = true;
    g_board_controller.tool = new toolBoardNav(this.mouse_cur_x, this.mouse_cur_y);

    //TESTING
    var brd = g_board_controller.board.kicad_brd_json;
    var map = brd.brd_to_sch_net_map;
    g_board_controller.board.updateRatsNest( undefined, undefined, map );

    g_painter.dirty_flag = true;

  }
  else if (ch == 'I')
  { 
    console.log('(I)nfo for picked part(s): ' );

    for (var ind in this.selectedElement)
    { 
      console.log( this.selectedElement[ind].ref.name );
      console.log( this.selectedElement[ind].ref );
    }

  } 
  else if (ch == 'D')
  {

    var netsAffected = {};

    var op = { source: "brd", destination: "brd" };
    op.action = "delete";
    op.type = "group";
    op.id = [];
    op.data = { element: [] };

    for (var ind in this.selectedElement)
    {
      op.id.push( this.selectedElement[ind].id );

      var ref = g_board_controller.board.refLookup( this.selectedElement[ind].id );

      if (ref.type == "track")
      {
        netsAffected[ ref.netcode ] = ref;
      }

      //var clonedData = simplecopy( this.selectedElement[ind].ref );
      var clonedData = simplecopy( ref );

      op.data.element.push( clonedData );
    }

    op.groupId = this.groupId;
    g_board_controller.opCommand( op );

    for (var nc in netsAffected)
    {
      var split_op = { source: "brd", destination: "brd" };
      split_op.action = "update";
      split_op.type = "splitnet";
      split_op.data = { net_number: nc };
      split_op.groupId = this.groupId;
      g_board_controller.opCommand( split_op );
    }

    this.shutdown = true;
    g_board_controller.tool = new toolBoardNav( this.mouse_cur_x, this.mouse_cur_y );
    g_painter.dirty_flag = true;

    var brd = g_board_controller.board.kicad_brd_json;
    var map = brd.brd_to_sch_net_map;
    g_board_controller.board.updateRatsNest( undefined, undefined, map );



  }
  else if ( (ch == 'R') || (ch == 'E') )
  {

    var drot = ( (ch == 'R') ? 1 : 3 );
    this.rotateCount = (this.rotateCount+drot)%4;

    var com = g_board_controller.board.centerOfMass( this.base_element_state );

    // be careful, this might lead to 'drift' as we rotate things around
    //
    com = g_snapgrid.snapGrid(com);

    var ccw = ( (ch == 'R') ? false : true );
    g_board_controller.board.rotateAboutPoint90( this.base_element_state , com.x, com.y, ccw );
    this.selectedElement = simplecopy( this.base_element_state );


    var world_xy = g_painter.devToWorld( this.mouse_cur_x, this.mouse_cur_y );
    var wdx = world_xy["x"] - this.orig_world_xy["x"];
    var wdy = world_xy["y"] - this.orig_world_xy["y"];

    if ( g_snapgrid.active )
    {
      var ta = g_snapgrid.snapGrid( world_xy );
      var tb = g_snapgrid.snapGrid( this.orig_world_xy );
      wdx = ta["x"] - tb["x"];
      wdy = ta["y"] - tb["y"];
    }

    this.selectedElement = simplecopy( this.base_element_state );
    this.ghostElement = simplecopy( this.base_element_state );
    for (var ind in this.ghostElement)
    {
      g_board_controller.board.relativeMoveElement( this.ghostElement[ind], wdx, wdy );

      var ele = this.ghostElement[ind].ref ;
      var type = ele.type;

      if ( type == "module")
        g_board_controller.board._find_footprint_bbox( ele );
      else if ( type == "track" )
        g_board_controller.board._find_line_bbox( ele );

      g_painter.dirty_flag = true;
    }

    this.allowPlaceFlag = this.canPlace();

    if (this.allowPlaceFlag)
    {
      for (var ind in this.selectedElement)
      {
        g_board_controller.board.relativeMoveElement( this.selectedElement[ind], wdx, wdy );
        g_painter.dirty_flag = true;
      }
      this.updateSelectedRatsnest();
    }
    else
    {
      this.updateSelectedRatsnest();
    }



    /*
    for (var ind in this.selectedElement)
      g_board_controller.board.relativeMoveElement( this.selectedElement[ind], wdx, wdy );

    var brd = g_board_controller.board.kicad_brd_json;
    var map = brd.brd_to_sch_net_map;
    g_board_controller.board.updateRatsNest( undefined, this.selectedElement, map );
    */

    var d = new Date();
    this.move_prev_ms = d.getTime();
    this.dirty = true;

    this.allowPlaceFlag = this.canPlace();

    g_painter.dirty_flag = true;

  }
  else if ( ch == 'Z' )
  {

    for (var i in this.selectedElement )
    {
      var ele = this.selectedElement[i];
      if (ele.type == "czone")
      {

        //-------------------- 
        //  move command
        //
        var world_xy = g_painter.devToWorld( this.mouse_cur_x, this.mouse_cur_y );
        var wdx = world_xy["x"] - this.orig_world_xy["x"];
        var wdy = world_xy["y"] - this.orig_world_xy["y"];
        if ( g_snapgrid.active )
        {
          var ta = g_snapgrid.snapGrid( world_xy );
          var tb = g_snapgrid.snapGrid( this.orig_world_xy );
          wdx = ta["x"] - tb["x"];
          wdy = ta["y"] - tb["y"];
        }

        var com = g_board_controller.board.centerOfMass( this.base_element_state );
        com = g_snapgrid.snapGrid(com);


        if ( (wdx != 0) || (wdy != 0) ||
             (this.rotateCount != 0) )
        {

          var op = { "source" : "brd", "destination" : "brd" };
          op.action = "update";
          op.type = "moveGroup";
          op.id = [ ele.id ];
          op.data = { dx: wdx, dy: wdy,
          rotateCount : this.rotateCount,
          cx : com.x, cy: com.y };
          op.groupId = this.groupId;
          g_board_controller.opCommand( op );
        }

        //------------------------
        //  fill CZone command
        //

        var op = { source : "brd", destination: "brd" };
        op.action = "update";
        op.type = "fillczone";
        op.id = [ ele.id ];

        var clonedCZone = simplecopy( ele.ref );

        op.data = { element : [ clonedCZone ] };

        op.groupId = this.groupId;
        g_board_controller.opCommand( op );


        for (var j in this.origElements)
        {
          this.origElements[j].ref.hideFlag = false;
        }

        this.shutdown = true;
        g_board_controller.tool = new toolBoardNav( this.mouse_cur_x, this.mouse_cur_y );
        g_painter.dirty_flag = true;

        var brd = g_board_controller.board.kicad_brd_json;
        var map = brd.brd_to_sch_net_map;
        g_board_controller.board.updateRatsNest( undefined, undefined, map );

        return;

      }
    }

  }

}

toolBoardMove.prototype.keyUp = function( keycode, ch, ev  )
{
}


