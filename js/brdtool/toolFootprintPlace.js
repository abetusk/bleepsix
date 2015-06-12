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

function toolFootprintPlace( mouse_x, mouse_y , footprint_name, footprint_data ) 
{

  mouse_x = ( typeof mouse_x !== 'undefined' ? mouse_x : 0 );
  mouse_y = ( typeof mouse_y !== 'undefined' ? mouse_y : 0 );

  this.angle = 0.0;

  var footprint_lib = g_board_controller.board.kicad_brd_json.footprint_lib;
  var ref_name = g_board_controller.board.getReferenceName(footprint_lib[footprint_name]);

  this.cloned_footprint = {};
  if ( typeof footprint_data === 'undefined' )
  {
    this.cloned_footprint = simplecopy(footprint_lib[ footprint_name]);
  }
  else
  {
    this.cloned_footprint = simplecopy(footprint_lib[footprint_name]);

    this.cloned_footprint.name = footprint_data.name;
    this.angle = 0.0;

  }

  this.mouse_x = mouse_x;
  this.mouse_y = mouse_y;
  this.footprint_name = footprint_name;

  this.mouse_drag_button = false;

  //this.drawHighlightRect = true;
  this.drawHighlightRect = false;

  this.world_xy = g_painter.devToWorld( mouse_x, mouse_y );
  this.snap_world_xy = g_snapgrid.snapGrid (this.world_xy);

  this.cursorSize = 6;
  this.cursorWidth = 1;

  this.highlightId = null;

  this.groupId = String(guid());

  this.allowPlaceFlag = this.canPlace();

  this.clearance = g_parameter.clearance;
  this.ghostElement = null;

  var d = new Date();
  this.move_prev_ms = d.getTime();
  this.move_heuristic_ms = 100;

  this.dirty = true;

  this.shutdown = false;

  setTimeout( function(xx) { return function() { xx.tick(); }; }(this), 100 );
}

toolFootprintPlace.prototype.tick = function()
{

  if (this.shutdown) { return; }

  if (this.dirty)
  {
    this.allowPlaceFlag = this.canPlace();

    if (this.allowPlaceFlag)
    {
      g_painter.dirty_flag = true;
    }

  }

  setTimeout( function(xx) { return function() { xx.tick(); }; }(this), 100 );

}

toolFootprintPlace.prototype.mouseDrag  = function( dx, dy ) {
  g_painter.adjustPan( dx, dy );
}

toolFootprintPlace.prototype.mouseWheel = function( delta )  {
  g_painter.adjustZoom ( this.mouse_x, this.mouse_y, delta );
}

toolFootprintPlace.prototype.drawOverlay = function()
{
  var s = this.cursorSize / 2;


  var ghostFlag = !this.allowPlaceFlag;
  g_board_controller.board.drawFootprint( this.cloned_footprint,
                                          parseFloat(this.world_xy["x"]), 
                                          parseFloat(this.world_xy["y"]), 
                                          0, true, ghostFlag );

  if (this.highlightId)
  {
    var ref = g_board_controller.board.refLookup( this.highlightId );
    var bbox = ref.bounding_box;
    var x = bbox[0][0];
    var y = bbox[0][1];
    var w = bbox[1][0] - x;
    var h = bbox[1][1] - y;

    g_painter.drawRectangle( x, y, w, h, 100, "rgb(128,128,128)", true, "rgba(255,255,255,0.25)");
  }
}

toolFootprintPlace.prototype.canPlace = function()
{
  var ref = simplecopy( this.cloned_footprint );
  ref.x = this.world_xy["x"];
  ref.y = this.world_xy["y"];
  g_board_controller.board.updateBoundingBox( ref );

  var ignore_id_map = {};
  if (this.highlightId)
  {
    ignore_id_map[ this.highlightId ] = 1;
  }

  var d = new Date();
  var cur_ms = d.getTime();
  if ((cur_ms - this.move_prev_ms) > this.move_heuristic_ms)
  {
    this.dirty = false;
    return g_board_controller.board.allowPlacement( [{"ref":ref}], this.clearance, ignore_id_map, 0 );
  }
  else
  {
    return g_board_controller.board.allowPlacement( [{"ref":ref}], this.clearance, ignore_id_map, 1 );
  }

}

toolFootprintPlace.prototype._patchUpNets = function( id )
{
  var splitnet_num = {};

  var brd = g_board_controller.board;

  var ref = g_board_controller.board.refLookup( id );
  ref.hideFlag = true;
  if ( !g_board_controller.board.intersectTest( [{ref:ref}], this.clearance ) )
  {
    ref.hideFlag = false;
    return;
  }
  ref.hideFlag = false;

  // Collect all the net numbers that we will be
  // replacing
  //
  var netReplaceSet = {};
  var ref = brd.refLookup( id );
  g_board_controller.board.updateBoundingBox( ref );

  if ("pad" in ref)
  {
    for ( var pad_ind in ref.pad )
    {
      var pad = ref.pad[pad_ind];
      netReplaceSet[ pad.net_number ] = true;
    }
  }
  else { return; }

  // Create the new nets, one for each unique net collected
  // above.
  //
  var newnets = {};
  for (var nc in netReplaceSet)
  {
    var net = brd.genNet();
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

  for (var pad_ind in ref.pad)
  {
    var nc = ref.pad[pad_ind].net_number;

    var pad_ref = brd.refLookup( ref.pad[pad_ind].id );
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


  var brd_eles = brd.kicad_brd_json.element;
  for (var brd_ind in brd_eles)
  {
    var brd_ref = brd_eles[brd_ind];
    var brd_type = brd_ref.type;

    if (brd_ref.hideFlag) continue;
    if (("name" in brd_ref) && (brd_ref.name == "unknown")) continue;

    var ele_ref = ref;

    if ( brd_type == "track" )
    {
      var l0 = { x : parseFloat(brd_ref.x0) , y : parseFloat(brd_ref.y0) };
      var l1 = { x : parseFloat(brd_ref.x1) , y : parseFloat(brd_ref.y1) };
      var w = parseFloat(brd_ref.width) ;
      var pgnBrd = brd._build_element_polygon( { type: "track", ref: brd_ref } );

      for (var p_ind in ele_ref.pad)
      {
        var pad = ele_ref.pad[p_ind];

        if ( !brd.shareLayer( brd_ref, pad ) ) continue;

        if ( brd._box_line_intersect( pad.bounding_box, l0, l1, w ) )
        {
          var pgnEle = brd._build_element_polygon( { type: "pad", ref: ele_ref, pad_ref: pad } );

          if ( brd._pgn_intersect_test( [ pgnBrd ], [ pgnEle ] ) )
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

  }


  // I'm not even sure we need this...
  //
  // This might be a significant slowdown.  If it becomes a
  // problem we'll have to speed up the split net...
  //
  /*
  for (var nc in splitnet_num )
  {
    var split_op = { source: "brd", destination: "brd" };
    split_op.action = "update";
    split_op.type = "splitnet";
    split_op.data = { net_number: nc };
    split_op.groupId = this.groupId;
    g_board_controller.opCommand( split_op );
  }
  */


  // finally update net maps and rats nest
  //
  var map_op = { source: "brd", destination: "brd" };
  map_op.action = "update";
  map_op.type = "schematicnetmap";
  map_op.groupId = this.groupId;
  g_board_controller.opCommand( map_op );

}


toolFootprintPlace.prototype.mouseDown = function( button, x, y )
{

  if (button == 1)
  {

    if (!this.allowPlaceFlag)
    {
      g_board_controller.fadeMessage( "Sorry, cannot place! There are too many intersections" );
      return;
    }

    var net_op = { source : "brd" , destination: "brd" };
    net_op.action = "add";
    net_op.type = "nets";
    net_op.data = [];
    net_op.groupId = this.groupId;

    var pad_count=0;
    for (var p_ind in this.cloned_footprint.pad ) { pad_count++; }

    //new
    var new_netcode = [];
    if (pad_count>0) {
      new_netcode = g_board_controller.board.genNets( undefined, undefined, pad_count );
    }

    // Generate new nets for each of the pads about to be created
    //
    var nc_ind = 0;
    for (var p_ind in this.cloned_footprint.pad )
    {
      net_op.data.push( { net_number : new_netcode[nc_ind].net_number,
                          net_name : new_netcode[nc_ind].net_name } );

      var pad = this.cloned_footprint.pad[p_ind];
      pad.net_number = new_netcode[nc_ind].net_number;
      pad.net_name = new_netcode[nc_ind].net_name;

      nc_ind++;
    }

    if (net_op.data.length>0)
    {
      g_board_controller.opCommand(net_op);
    }

    if (this.highlightId)
    {
      var ref = g_board_controller.board.refLookup( this.highlightId );
      var saved_ref = simplecopy(ref);

      var tx = ref.x;
      var ty = ref.y;

      this.cloned_footprint.id = ref.id;
      this.cloned_footprint.x = ref.x;
      this.cloned_footprint.y = ref.y;

      this.cloned_footprint.text[0].text = ref.text[0].text;
      this.cloned_footprint.text[1].text = ref.text[1].text;

      if ( (this.cloned_footprint.type == "module") &&
           (this.cloned_footprint.name != "unknown") )
      {
        var pads = this.cloned_footprint.pad;
        for (var ind in pads)
        {
          var pad = pads[ind];
          if (!("id" in pad))
            pad.id = g_board_controller.board._createId( this.cloned_footprint.id );
        }
      }


      var op = { source: "brd", destination: "brd" };
      op.action = "update";
      op.type = "edit";
      op.id = [ ref.id ];
      op.data = { element : [ this.cloned_footprint ] , oldElement : [ saved_ref ] };
      op.groupId = this.groupId;
      g_board_controller.opCommand( op );

      this.shutdown = true;
      g_board_controller.tool = new toolBoardNav(x, y);
      g_painter.dirty_flag = true;

      var net_op = { source : "brd", destination: "sch" };
      net_op.action = "update";
      net_op.type = "schematicnetmap";
      net_op.groupId = this.groupId;
      g_board_controller.opCommand( net_op );

      this._patchUpNets( ref.id );

      var map = g_board_controller.board.kicad_brd_json.brd_to_sch_net_map;
      g_board_controller.board.updateRatsNest( undefined, undefined, map );

      return;
    }

    var op = { source : "brd" , destination: "brd" };
    op.action = "add";
    op.type = "footprintData";
    op.data = { footprintData : this.cloned_footprint, x: this.world_xy.x, y: this.world_xy.y };
    op.groupId = this.groupId;
    g_board_controller.opCommand( op );

    this._patchUpNets( op.id );

    this.shutdown = true;
    g_board_controller.tool = new toolBoardNav(x, y);
    g_painter.dirty_flag = true;

  }
  else if (button == 3)
  {
    this.mouse_drag_button = true;
  }


}

toolFootprintPlace.prototype.mouseUp = function( button, x, y )
{
  this.mouse_drag_button = false;
}

toolFootprintPlace.prototype._moduleWithinReplaceDistance = function( ref )
{
  if ( ref.name == "unknown" )
  {
    return true;
  }

  var dist = 500;
  var x = ref.x;
  var y = ref.y;

  var dx = Math.abs( x - this.world_xy.x );
  var dy = Math.abs( y - this.world_xy.y );

  if ((dx < dist) && (dy < dist))
    return true;

  return false;

}


toolFootprintPlace.prototype.mouseMove = function( x, y )
{

  if (this.mouse_drag_button)
    this.mouseDrag ( x - this.mouse_x, y - this.mouse_y );

  this.mouse_x = x;
  this.mouse_y = y;

  if (!this.mouse_drag_button)
  {

    var d = new Date();
    this.move_prev_ms = d.getTime();
    this.dirty = true;

    this.world_xy = g_painter.devToWorld( this.mouse_x, this.mouse_y );
    this.world_xy = g_snapgrid.snapGrid( this.world_xy );

    this.ghostElement = simplecopy( this.cloned_footprint );
    var id_ref = g_board_controller.board.pick( this.world_xy.x, this.world_xy.y );
    if (id_ref && (id_ref.ref.type == "module"))
    {
      this.world_xy.x = id_ref.ref.x;
      this.world_xy.y = id_ref.ref.y;

      this.highlightId = ( this._moduleWithinReplaceDistance( id_ref.ref ) ? id_ref.id : null );
    }
    else
    {
      this.highlightId = null;
    }

    this.allowPlaceFlag = this.canPlace();
    g_painter.dirty_flag = true;

  }

}

toolFootprintPlace.prototype.keyDown = function( keycode, ch, ev )
{

  if (keycode == 27)
  {
    this.shutdown = true;
    g_board_controller.tool = new toolBoardNav( this.mouse_x, this.mouse_y );
    g_board_controller.guiToolbox.defaultSelect();
    g_painter.dirty_flag = true;
  }

  else if (ch == 'R')
  {
    this.angle += Math.PI / 2.0;
    if (this.angle >=  Math.PI)
       this.angle -= 2.0 * Math.PI;

    var id_ref = { id: this.cloned_footprint.id, ref : this.cloned_footprint };
    g_board_controller.board.rotate90( id_ref, true );
    this.allowPlaceFlag = this.canPlace();
    g_painter.dirty_flag = true;
  }

  else if (ch == 'E')
  {
    this.angle -= Math.PI / 2.0;
    if (this.angle < -Math.PI)
      this.angle += 2.0 * Math.PI;

    var id_ref = { id: this.cloned_footprint.id, ref : this.cloned_footprint };
    g_board_controller.board.rotate90( id_ref, false );
    this.allowPlaceFlag = this.canPlace();
    g_painter.dirty_flag = true;
  }
  else if (keycode == 191)
  {
  }

}

toolFootprintPlace.prototype.keyUp = function( keycode, ch, ev  )
{
}

toolFootprintPlace.prototype.update = function( x, y )
{
}


