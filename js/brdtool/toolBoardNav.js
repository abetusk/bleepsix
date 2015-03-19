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



function toolBoardNav( x, y, viewMode ) 
{
  x = ( typeof x !== 'undefined' ? x : 0 );
  y = ( typeof y !== 'undefined' ? y : 0 );
  this.viewMode = ( (typeof viewMode === 'undefined') ? false : viewMode );

  this.mouse_down = false;
  this.mouse_cur_x = x;
  this.mouse_cur_y = y;

  this.lock_grid_flag = true;
  this.show_cursor_flag = true;

  this.cursorSize = 6;
  this.cursorWidth = 1;

  this.mouse_drag_flag = false;

  this.mouse_world_xy = g_painter.devToWorld(x, y);
  this.snap_world_xy = g_snapgrid.snapGrid( this.mouse_world_xy );

  this.highlightNetcodes = [];

  this.clearance = g_parameter.clearance;

  this.drc_flag = false;

  if (g_board_controller)
  {
    this.mouseMove( x, y );
  }

}

toolBoardNav.prototype.update = function(x, y)
{
  this.mouse_cur_x = x;
  this.mouse_cur_y = y;

  this.mouse_world_xy = g_painter.devToWorld(x, y);
  this.snap_world_xy = g_snapgrid.snapGrid( this.mouse_world_xy );
}



toolBoardNav.prototype.drawCaution = function(x, y, w, h)
{

  var bg_color = "rgba(255,255,128,0.8)";
  var bg_color2 = "rgba(255,255,255,0.8)";
  var fg_color = "rgba(0,0,0,0.8)";

  var stripe_color0 = "rgba(255,0,0,0.8)";
  var stripe_color1 = "rgba(255,255,128,0.8)";

  var dx = w/3.0;
  var dy = h/3.0;


  var poly0 = [ [0, 0], [dx, 0], [0, dy] ];
  g_painter.drawBarePolygon(poly0, x-w/2, y-h/2, stripe_color0 );

  var poly1 = [ [dx, 0], [2*dx, 0], [0, 2*dy], [0, dy] ];
  g_painter.drawBarePolygon(poly1,  x-w/2, y-h/2, stripe_color1 );

  var poly2 = [ [2*dx,0], [3*dx,0], [0, 3*dy], [0, 2*dy] ];
  g_painter.drawBarePolygon(poly2,  x-w/2, y-h/2, stripe_color0 );

  var poly3 = [ [0,3*dy], [3*dx,0], [3*dx, dy], [dx, 3*dy] ];
  g_painter.drawBarePolygon(poly3,  x-w/2, y-h/2, stripe_color1 );

  var poly4 = [ [dx, 3*dy], [3*dx, dy], [3*dx, 2*dy], [2*dx, 3*dy] ];
  g_painter.drawBarePolygon(poly4,  x-w/2, y-h/2, stripe_color0 );

  var poly5 = [ [2*dx, 3*dy], [3*dx, 2*dy], [3*dx, 3*dy] ];
  g_painter.drawBarePolygon(poly5, x-w/2, y-h/2, stripe_color1 );

  g_painter.strokeRect(x,y,w,h, bg_color2);
  g_painter.fillRect(x, y+h/4, w/8, h/8, fg_color );
  var poly_bang = [
    [-w/16,-h/8],
    [+w/16,-h/8],
    [+w/8,-h/2],
    [-w/8,-h/2]
  ];
  g_painter.drawBarePolygon(poly_bang, x, y+h/4, fg_color );


}

toolBoardNav.prototype.caution_intersect = function( cx, cy, w, h )
{
  var x = this.mouse_world_xy.x;
  var y = this.mouse_world_xy.y;

  var x0 = cx - w/2;
  var y0 = cy - h/2;

  var x1 = cx + w/2;
  var y1 = cy + h/2;
  //this.snap_world_xy = g_snapgrid.snapGrid( this.mouse_world_xy );

  if ( (x0 < x) && (x < x1) && (y0 < y) && (y < y1) )
    return true;

  return false
}

toolBoardNav.prototype.drawOverlay = function()
{
  var caution_msg = "";

  if (this.drc_flag) {
    var cautw = 250;
    var cauth = 250;
    var brd = g_board_controller.board;
    var drc = g_board_controller.DRC();

    // Tag floating pins
    //
    for (var ind in drc.float_pin) {
      if (!("id" in drc.float_pin[ind])) { continue; }

      var ele = brd.refLookup( drc.float_pin[ind].id );
      if (!ele) { continue; }
      for (var pad_ind in ele.pad) {
        if (ele.pad[pad_ind].name == drc.float_pin[ind].pad_name) {

          var bbox = ele.pad[pad_ind].bounding_box;
          this.drawCaution(bbox[1][0]+cautw/2, bbox[0][1]-cauth/2, cautw, cauth);

          if (this.caution_intersect(bbox[1][0]+cautw/2, bbox[0][1]-cauth/2, cautw, cauth)) {
            caution_msg = "Floating pad\n";
          }

        }
      }
    }

    // Tag pads with netcode issues
    //
    eles = brd.kicad_brd_json.element;
    for (var ind in eles) {
      var ele = eles[ind];
      if (ele.type == "module") {
        if (!("pad" in ele)) { continue; }
        for (var pad_ind in ele.pad) {
          var pad = ele.pad[pad_ind];
          if (pad.net_number in drc.brd_from_sch_issue) {

            var bbox = pad.bounding_box;
            this.drawCaution(bbox[1][0]+cautw/2, bbox[0][1]-cauth/2, cautw, cauth);

            if (this.caution_intersect(bbox[1][0]+cautw/2, bbox[0][1]-cauth/2, cautw, cauth)) {
              caution_msg = "Schematic mismatch\n";
            }
          }

        }
      }
    }
  }


  if ( !this.mouse_drag_flag )
  {
    this.snap_world_xy = g_snapgrid.snapGrid( this.mouse_world_xy );

    var s = this.cursorSize / 2;
    g_painter.drawRectangle( this.snap_world_xy["x"] - s,
                             this.snap_world_xy["y"] - s,
                             this.cursorSize ,
                             this.cursorSize ,
                             this.cursorWidth ,
                             "rgb(128, 128, 128 )" );

    g_board_controller.display_text = caution_msg + "x: " + this.snap_world_xy.x + ", y: " + this.snap_world_xy.y;
  }


}

toolBoardNav.prototype.mouseDown = function( button, x, y ) 
{
  this.mouse_down = true;

  if (button == 3)
    this.mouse_drag_flag = true;

  // pass control to toolSelect 
  //
  else if (button == 1)
  {
    var world_coord = g_painter.devToWorld( x, y );

    // First get all elements that fall under the click point
    //
    var id_ref_ar = g_board_controller.board.pickAll( world_coord.x, world_coord.y );

    if (id_ref_ar && (id_ref_ar.length > 0))
    {

      var picked_id_ref = null;
      var preferred_id_ref = null;
      var save_size = 0;

      for (var ind in id_ref_ar)
      {

        // If it's a track, just pick the first one straight away
        //
        picked_id_ref = id_ref_ar[ind];
        if ( picked_id_ref.ref.type == "track" )
        {

          if (!this.viewMode)
            g_board_controller.tool = new toolBoardMove(x, y, [ picked_id_ref ], false);

          g_board_controller.board.unhighlightNet();
          g_board_controller.unhighlightNet( );
         
          g_painter.dirty_flag = true;
          return;
        }

        if (!preferred_id_ref) {
          preferred_id_ref = picked_id_ref;
        }

        var tref = picked_id_ref.ref;
        if ("bounding_box" in tref)
        {
          var bbox = tref.bounding_box;
          var cur_size = Math.abs( (bbox[0][0] - bbox[1][0])*(bbox[0][1] - bbox[1][1]) );

          if (save_size < 1) { save_size = cur_size; }
          if (cur_size < save_size)
          {
            preferred_id_ref  = picked_id_ref;
            save_size = cur_size;
          }
        }

      }

      if (!this.viewMode)
        g_board_controller.tool = new toolBoardMove(x, y, [ preferred_id_ref ], false);

      g_board_controller.board.unhighlightNet();
      g_board_controller.unhighlightNet( );

      g_painter.dirty_flag = true;

      return;

    }

    else
    {
      if (!this.viewMode)
      {
        g_board_controller.tool = new toolBoardSelect(x, y);
      }
    }

  }

}


toolBoardNav.prototype.doubleClick = function(button, x, y)
{

  /*
  var world_coord = g_painter.devToWorld( x, y );
  var id_ref =  g_board_controller.board.pick( world_coord["x"], world_coord["y"] );
  if (id_ref)
  {

    if (id_ref.ref.type == "component")
    {
      g_board_controller.tool = new toolComponentEdit(x, y, id_ref);
      g_painter.dirty_flag = true;
    }

  }
  else
  {
    //g_board_controller.tool = new toolSelect(x, y);
  }
 */


}

toolBoardNav.prototype.mouseUp = function( button, x, y ) 
{
  this.mouse_down = false;

  if (button == 3)
    this.mouse_drag_flag = false;
}

toolBoardNav.prototype.mouseMove = function( x, y ) 
{

  if ( this.mouse_drag_flag ) 
     this.mouseDrag ( x - this.mouse_cur_x, y - this.mouse_cur_y );

  this.mouse_cur_x = x;
  this.mouse_cur_y = y;

  var world_xy = g_painter.devToWorld( this.mouse_cur_x, this.mouse_cur_y );
  this.mouse_world_xy["x"] = world_xy["x"];
  this.mouse_world_xy["y"] = world_xy["y"];

  if (this.mouse_drag_flag)
  {
    g_painter.dirty_flag = true;
    return;
  }

  var ida = g_board_controller.board.pickAll( world_xy.x, world_xy.y );
  var pad_ar = g_board_controller.board.pickPads( world_xy.x, world_xy.y );

  var highlightFound = false;

  if (ida.length > 0)
  {
    for ( var ida_ind in ida )
    {
      var ref = ida[ida_ind].ref;

      var netcode = -1;
      if (ref.type == "track")
      {
        netcode = parseInt(ref.netcode);
      }

      if (netcode >= 0)
      {
        var board = g_board_controller.board;
        if ("brd_to_sch_net_map" in board.kicad_brd_json)
        {

          // `netcode` is the net name of the picked element.
          // We find all implied schematic nets from the board netcode.
          // We then map back all implied board netcodes from the
          // schematic netcodes. 
          //
          //          sch               brd
          //           .  ________\_______x
          //             /        /
          //           ./__/____
          //               \    \___/___ nc
          //           .___/____/   \
          //            \   \
          //           . \________\_______x
          //                      /
          //
          // Where 'nc' is also mapped back.
          //
          // I think we did this as an initial attempt.  On further
          // reflection, this is too coarse and confusing.  Better to
          // differentiate what's an implied board and schematic net
          // and to color them differently depending.
          //

          var hi_netcodes = [];
          var sub_pad_ids = [];

          g_board_controller.board.getBoardNetCodesAndSubPads( netcode, undefined, hi_netcodes, sub_pad_ids );
          g_board_controller.board.highlightNetCodesSubPads( hi_netcodes, sub_pad_ids );

          g_board_controller.highlightSchematicNetsFromBoard( netcode, sub_pad_ids );
          this.highlightNetcodes = hi_netcodes;

          highlightFound = true;

        }

      }

      if (highlightFound)
        break;

    }

  }

  if ((!highlightFound) && (pad_ar.length > 0))
  {
    var pad_ref = pad_ar[0].pad_ref;
    var netcode = parseInt( pad_ref.net_number );

    if (netcode >= 0)
    {
      var board = g_board_controller.board;
      if ("brd_to_sch_net_map" in board.kicad_brd_json)
      {
        var hi_netcodes = [];
        var sub_pad_ids = [];

        var xy = pad_ref.id.split(",");
        var base_pad_id = xy[0] + ":" + pad_ref.name;

        g_board_controller.board.getBoardNetCodesAndSubPads( netcode, base_pad_id, hi_netcodes, sub_pad_ids );

        g_board_controller.board.highlightNetCodesSubPads( hi_netcodes, sub_pad_ids );

        // Highlight netcodes in companion schematic.
        //
        g_board_controller.highlightSchematicNetsFromBoard( netcode, sub_pad_ids );

        this.highlightNetcodes = hi_netcodes;

        highlightFound = true;
      }


    }
    else
    {
      g_board_controller.board.unhighlightNet();
      g_board_controller.unhighlightNet();
    }

  }

  if (!highlightFound)
  {
    g_board_controller.board.unhighlightNet();
    g_board_controller.unhighlightNet();
  }

  g_painter.dirty_flag = true;

}

toolBoardNav.prototype.mouseDrag = function( dx, dy ) 
{
  g_painter.adjustPan ( dx, dy );
  g_painter.dirty_flag = true;
}

toolBoardNav.prototype.mouseWheel = function( delta )
{
  g_painter.adjustZoom ( this.mouse_cur_x, this.mouse_cur_y, delta );
}

toolBoardNav.prototype.keyDown = function( keycode, ch, ev )
{

  var x = this.mouse_cur_x;
  var y = this.mouse_cur_y;
  var wc = g_painter.devToWorld(x, y);

  wc = g_snapgrid.snapGrid(wc);

  var wx = wc["x"];
  var wy = wc["y"];


  if (this.viewMode)
  {
    if ( ch == '1' ) {
      g_painter.setGrid ( 0 );
    } else if ( ch == '2' ) {
      g_painter.setGrid ( 1 );
    } else if ( ch == '3' ) {
      g_painter.setGrid ( 2 );
    } 

    return true;
  }


  if ((ch=='2') && ev.shiftKey)
  {
    console.log("!!");

    g_board_controller.board.flag_draw_ratsnest = !g_board_controller.board.flag_draw_ratsnest;
    if (g_board_controller.board.flag_draw_ratsnest)
    {
      g_board_controller.board.updateRatsNest();
    }
    else
    {
      g_board_controller.board.clearRatsNest();
    }
    g_painter.dirty_flag=true;
  }

  else if ( ch == '1' ) {
    g_painter.setGrid ( 0 );
  } else if ( ch == '2' ) {
    g_painter.setGrid ( 1 );
  } else if ( ch == '3' ) {
    g_painter.setGrid ( 2 );
  } 

  // left bracket ('[')
  //
  else if ( keycode == 219 )
  {
    g_board_controller.opUndo();

    var map = g_board_controller.board.kicad_brd_json.brd_to_sch_net_map;
    g_board_controller.board.updateRatsNest( undefined, undefined, map );

    g_board_controller.board.unhighlightNet();
    g_board_controller.unhighlightNet( );


  }

  else if ( keycode == 192 )
  {
    g_board_controller.board.draw_id_text_flag =
      !g_board_controller.board.draw_id_text_flag;
    g_board_controller.board.flag_draw_bounding_box =
      !g_board_controller.board.flag_draw_bounding_box;
    g_painter.dirty_flag = true;
  }

  // right bracket (']')
  //
  else if ( keycode == 221 )
  {
    g_board_controller.opRedo();

    var map = g_board_controller.board.kicad_brd_json.brd_to_sch_net_map;
    g_board_controller.board.updateRatsNest( undefined, undefined, map );

    g_board_controller.board.unhighlightNet();
    g_board_controller.unhighlightNet( );

  }


  else if ( keycode == 188 )
  {
    g_painter.adjustZoom( this.mouse_cur_x, this.mouse_cur_y, -1 );
  }
  else if ( keycode == 190 )
  {
    g_painter.adjustZoom( this.mouse_cur_x, this.mouse_cur_y, 1 );
  }

  else if (keycode == 37)
  {
    g_painter.adjustPan( 50, 0 );
    return false;
  }
  else if (keycode == 38)
  {
    g_painter.adjustPan( 0, 50 );
    return false;
  }
  else if (keycode == 39)
  {
    g_painter.adjustPan( -50, 0 );
    return false;
  }
  else if (keycode == 40)
  {
    g_painter.adjustPan( 0, -50 );
    return false;
  }

  else if ((keycode == 186) || (ch == ':'))
  {
    console.log("cli");
  }

  else if (ch == 'A') {
  }

  // 'F'lip
  //
  else if (ch == 'F')
  {

    var id_ref_ar = g_board_controller.board.pickAll( wx, wy );
    if (id_ref_ar.length > 0)
    {

      var group_id = String(guid());

      for (var ind in id_ref_ar)
      {
        var ref = id_ref_ar[ind]["ref"];
        if (ref["type"] == "module")
        {

          var src_layer = g_board_controller.guiLayer.getActiveLayer();
          var dst_layer = g_board_controller.guiLayer.getInactiveLayer();

          var op = { source: "brd", destination: "brd" };
          op.action = "update";
          op.type = "flip";
          op.id = id_ref_ar[ind].id;
          op.data = { sourceLayer : src_layer, destinationLayer: dst_layer};
          op.groupId = group_id;
          g_board_controller.opCommand( op );

          var map = g_board_controller.board.kicad_brd_json.brd_to_sch_net_map;
          g_board_controller.board.updateRatsNest( undefined, undefined, map );


        }
      }

    }
    
  }
  else if (ch == 'I')
  {
    console.log("info (board state):");
    console.log( g_board_controller.board );
    console.log( g_board_controller.schematic );

    console.log("kicad_sch_json:");
    console.log( g_board_controller.schematic.kicad_sch_json);

    console.log("kicad_brd_json:");
    console.log( g_board_controller.board.kicad_brd_json);
  }
  else if (ch == 'C')
  {
    //g_board_controller.board.debug_geom = [];
    this.drc_flag = !this.drc_flag;
    g_painter.dirty_flag = true;
  }

  else if (ch == 'B')
  {

  }

  else if (ch == 'Z')
  {

    if (!this.viewMode)
    {
      g_board_controller.tool = new toolBoardZone(x, y);
    }

    g_board_controller.board.unhighlightNet();
    g_board_controller.unhighlightNet( );

  }
  else if (ch == 'J')
  {
  }
  else if (ch == 'L')
  {
    g_board_controller.board.unhighlightNet();
    g_board_controller.unhighlightNet( );

    if (!this.viewMode)
    {
      g_board_controller.tool = new toolDistance(x, y, true);
    }

  }
  else if (ch == 'X')
  {

    g_board_controller.board.unhighlightNet();
    g_board_controller.unhighlightNet( );

    if (!this.viewMode)
    {
      g_board_controller.tool = new toolTrace(x, y, [0, 15], true, this.highlightNetcodes);
    }

  }

  else if (ch == 'V')
  {
    g_board_controller.guiLayer.toggleLayer();
    g_painter.dirty_flag = true;
  }

  else if (ch == 'S')
  {

    var ida = g_board_controller.board.pickAll( wx, wy );
    if (ida.length > 0) 
    {
      var t = g_painter.devToWorld(x, y);

      if (!this.viewMode)
      {
        g_board_controller.tool = new toolBoardMove(x, y, ida);
      }

      g_board_controller.board.unhighlightNet();
      g_board_controller.unhighlightNet( );

      return true;
    }
    else
    {
    }

  }
  else if (ch == 'W')
  {
    return true;
  }

  // 'R'otate, 'E'tator
  //
  else if ( (ch == 'R') || (ch == 'E') )
  {
    var ccw = ( (ch == 'R') ? true : false );

    var group_id = String(guid());

    var id_ref = g_board_controller.board.pick( wx, wy );
    if ( id_ref )
    {
      var ref = g_board_controller.board.refLookup( id_ref.id );
      var cloned_id_ref = simplecopy( id_ref );

      ref.hideFlag = true;

      var com = g_board_controller.board.centerOfMass( [ cloned_id_ref ] );

      g_board_controller.board.rotateAboutPoint90( [ cloned_id_ref ], com.x, com.y, ccw );
      g_board_controller.board.updateBoundingBox( cloned_id_ref.ref );

      if ( g_board_controller.board.intersectTest( [ cloned_id_ref ] , this.clearance ) )
      {
        g_board_controller.fadeMessage( "Sorry, cannot rotate!  Too many intersections" );
        ref.hideFlag = false;
        return true;
      }

      ref.hideFlag = false;

      var op = { source: "brd", destination: "brd" };
      op.action = "update";
      op.type = "rotate90";
      op.id = id_ref.id;
      op.data = { ccw : ccw };
      op.groupId = group_id;
      g_board_controller.opCommand( op );

      var map = g_board_controller.board.kicad_brd_json.brd_to_sch_net_map;
      g_board_controller.board.updateRatsNest( undefined, undefined, map );

      this.mouseMove( this.mouse_cur_x, this.mouse_cur_y );
    }

  }

  // rotate by 15 deg.
  //
  else if (ch == 'Y')
  {
    var group_id = String(guid());

    var id_ref = g_board_controller.board.pick( wx, wy );
    if ( id_ref )
    {
      var ang_rad =  15 * Math.PI / 180;
      var x = id_ref.ref.x;
      var y = id_ref.ref.y;

      var op = { source: "brd", destination: "brd" };
      op.action = "update";
      op.type = "rotate";
      op.id = id_ref.id;
      op.data = { ccw : ccw, cx : x, cy: y, angle : ang_rad, ccw: true };
      op.groupId = group_id;
      g_board_controller.opCommand( op );

      this.mouseMove( this.mouse_cur_x, this.mouse_cur_y );
    }

    var map = g_board_controller.board.kicad_brd_json.brd_to_sch_net_map;
    g_board_controller.board.updateRatsNest( undefined, undefined, map );

  }

  // add 'U'nknown part
  //
  else if ( ( ch == 'U' ) && ( ev.shiftKey ) )
  {
    var group_id = String(guid());
    var k = g_board_controller.board.makeUnknownModule( );


    var op = { source: "brd", destination: "brd" };
    op.action = "add";
    op.type = "footprintData";
    op.data = { footprintData : k,
                x : 0, y: 0 };
    op.groupId = group_id;
    g_board_controller.opCommand( op );

    g_board_controller.board.unhighlightNet();
    g_board_controller.unhighlightNet( );

  }

  else if ( ch == 'M')
  {
    console.log("TESTING RATS NEST FUNCTIONALITY");

    //g_board_controller.board.updateRatsNest();

    var brd = g_board_controller.board.kicad_brd_json;
    var map = brd.brd_to_sch_net_map;
    g_board_controller.board.updateRatsNest( undefined, undefined, map );

    console.log("update rat's nest done");

  }

  else if (ch == 'K')
  {
    g_board_controller.board.updateLocalNet();
  }

  // 'D'elete
  //
  else if (ch == 'D')
  {

    var id_ref_ar = g_board_controller.board.pickAll( wx, wy );

    if (id_ref_ar.length > 0)
    {

      var group_id = String(guid());

      var op = { source: "brd", destination: "brd" };
      op.action = "delete";
      op.type = "group";
      op.id = [];
      op.data = { element: [] };

      for (var ind in id_ref_ar)
      {
        var ref = id_ref_ar[ind]["ref"];
        if (ref["type"] == "drawsegment")
        {

          op.id.push( id_ref_ar[ind].id );
          var clonedData = {};
          $.extend( true, clonedData, id_ref_ar[ind].ref );
          op.data.element.push( clonedData );
          op.groupId = group_id;
          g_board_controller.opCommand( op );

          var map = g_board_controller.board.kicad_brd_json.brd_to_sch_net_map;
          g_board_controller.board.updateRatsNest( undefined, undefined, map );

          g_board_controller.board.unhighlightNet();
          g_board_controller.unhighlightNet( );

          return true;
        }
      }

      for (var ind in id_ref_ar)
      {
        var ref = id_ref_ar[ind]["ref"];
        if (ref["type"] == "track")
        {

          op.id.push( id_ref_ar[ind].id );
          var clonedData = {};
          $.extend( true, clonedData, id_ref_ar[ind].ref );
          op.data.element.push( clonedData );
          op.groupId = group_id;
          g_board_controller.opCommand( op );

          var ref = id_ref_ar[ind].ref;

          var split_op = { source: "brd", destination: "brd" };
          split_op.action = "update";
          split_op.type = "splitnet";
          split_op.data = { net_number: ref.netcode };
          split_op.groupId = group_id;
          g_board_controller.opCommand( split_op );

          g_board_controller.board.unhighlightNet();
          g_board_controller.unhighlightNet( );

          var map = g_board_controller.board.kicad_brd_json.brd_to_sch_net_map;
          g_board_controller.board.updateRatsNest( undefined, undefined, map );
          g_painter.dirty_flag = true;

          return true;
        }
      }

      for (var ind in id_ref_ar)
      {
        var ref = id_ref_ar[ind]["ref"];
        if (ref["type"] != "module")
        {

          op.id.push( id_ref_ar[ind].id );
          var clonedData = {};
          $.extend( true, clonedData, id_ref_ar[ind].ref );
          op.data.element.push( clonedData );
          op.groupId = group_id;
          g_board_controller.opCommand( op );

          var map = g_board_controller.board.kicad_brd_json.brd_to_sch_net_map;
          g_board_controller.board.updateRatsNest( undefined, undefined, map );

          g_board_controller.board.unhighlightNet();
          g_board_controller.unhighlightNet( );

          return true;

        }
      }

      op.id.push( id_ref_ar[ind].id );
      var clonedData = {};
      $.extend( true, clonedData, id_ref_ar[ind].ref );
      op.data.element.push( clonedData );
      op.groupId = group_id;
      g_board_controller.opCommand( op );

      var map = g_board_controller.board.kicad_brd_json.brd_to_sch_net_map;
      g_board_controller.board.updateRatsNest( undefined, undefined, map );

      // Once for the actual board, again on the controller
      // to pass the message...
      //
      g_board_controller.board.unhighlightNet();
      g_board_controller.unhighlightNet( );

      return true;

    }

  }
  else if (ch == 'M')
  {
  }

  if (keycode == '32') return false;
  return true;
}

toolBoardNav.prototype.keyUp = function( keycode, ch, ev )
{
}


