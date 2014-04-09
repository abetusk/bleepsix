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



function toolBoardNav( x, y ) 
{
  x = ( typeof x !== 'undefined' ? x : 0 );
  y = ( typeof y !== 'undefined' ? y : 0 );

  //console.log("toolBoardNav");

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

  if (g_board_controller)
    this.mouseMove( x, y );

}

toolBoardNav.prototype.update = function(x, y)
{
  this.mouse_cur_x = x;
  this.mouse_cur_y = y;

  this.mouse_world_xy = g_painter.devToWorld(x, y);
  this.snap_world_xy = g_snapgrid.snapGrid( this.mouse_world_xy );
}




toolBoardNav.prototype.drawOverlay = function()
{

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

    g_board_controller.display_text = "x: " + this.snap_world_xy.x + ", y: " + this.snap_world_xy.y;
  }


}

toolBoardNav.prototype.mouseDown = function( button, x, y ) 
{
  this.mouse_down = true;

  if (button == 3)
    this.mouse_drag_flag = true;

  // pass control to toolSelect 
  else if (button == 1)

  {
    var world_coord = g_painter.devToWorld( x, y );

    var id_ref_ar = g_board_controller.board.pickAll( world_coord.x, world_coord.y );

    if (id_ref_ar && (id_ref_ar.length > 0))
    {
      var picked_id_ref = null;
      for (var ind in id_ref_ar)
      {
        picked_id_ref = id_ref_ar[ind];
        if ( picked_id_ref.ref.type == "track" )
        {
          g_board_controller.tool = new toolBoardMove(x, y, [ picked_id_ref ], false);


          g_board_controller.board.unhighlightNet();

          // EXPERIMENTAL
          g_board_controller.unhighlightNet( );
          // EXPERIMENTAL


          
          g_painter.dirty_flag = true;

          return;
        }
      }

      g_board_controller.tool = new toolBoardMove(x, y, [ picked_id_ref ], false);

      g_board_controller.board.unhighlightNet();

      // EXPERIMENTAL
      g_board_controller.unhighlightNet( );
      // EXPERIMENTAL


      g_painter.dirty_flag = true;

      return;

    }

    //var id_ref =  g_board_controller.board.pick( world_coord["x"], world_coord["y"] );
    /*
    if (id_ref)
    {
      console.log("handing to toolBoardMove");
      console.log(id_ref);
      g_board_controller.tool = new toolBoardMove(x, y, [ id_ref ], false);
      //g_board_controller.tool.addElement( [ id_ref ] );
      g_painter.dirty_flag = true;
    }
   */

    else
    {
      g_board_controller.tool = new toolBoardSelect(x, y);
    }

  }

}


toolBoardNav.prototype.doubleClick = function(button, x, y)
{
  //console.log("toolBoardNav.doubleClick");
  var world_coord = g_painter.devToWorld( x, y );

  /*
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

          var sch_nets = g_board_controller.board.kicad_brd_json.brd_to_sch_net_map[ netcode ];
          var hi_netcodes = [];

          for (var i in sch_nets)
          {
            var map = g_board_controller.board.kicad_brd_json.sch_to_brd_net_map[ sch_nets[i] ];
            for (var j in map)
            {
              hi_netcodes.push( map[j] );
            }
          }

          g_board_controller.board.highlightNetCodes( hi_netcodes );
          g_board_controller.highlightSchematicNetsFromBoard( netcode );

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
      //var net_name = g_board_controller.board.kicad_brd_json.net_code_map[ netcode ];
      //g_board_controller.board.highlightNet( net_name );

      var board = g_board_controller.board;
      if ("brd_to_sch_net_map" in board.kicad_brd_json)
      {
        var sch_nets = g_board_controller.board.kicad_brd_json.brd_to_sch_net_map[ netcode ];
        var hi_netcodes = [];
        for (var i in sch_nets)
        {
          var map = g_board_controller.board.kicad_brd_json.sch_to_brd_net_map[ sch_nets[i] ];
          for (var j in map)
          {
            hi_netcodes.push( map[j] );
          }
        }
        g_board_controller.board.highlightNetCodes( hi_netcodes );


        // EXPERIMENTAL
        g_board_controller.highlightSchematicNetsFromBoard( netcode );
        // EXPERIMENTAL


        highlightFound = true;
      }


    }
    else
    {
      g_board_controller.board.unhighlightNet();

      // EXPERIMENTAL
      g_board_controller.unhighlightNet();
      // EXPERIMENTAL


    }

  }

  if (!highlightFound)
  {
    g_board_controller.board.unhighlightNet();

    // EXPERIMENTAL
    g_board_controller.unhighlightNet();
    // EXPERIMENTAL


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

// TESTING

toolBoardNav.prototype.keyDown = function( keycode, ch, ev )
{
  //console.log("toolBoardNav keyDown: " + keycode + " " + ch );
  //console.log(ev);

  var x = this.mouse_cur_x;
  var y = this.mouse_cur_y;
  var wc = g_painter.devToWorld(x, y);

  wc = g_snapgrid.snapGrid(wc);

  var wx = wc["x"];
  var wy = wc["y"];



  if ( ch == '1' ) {
    g_painter.setGrid ( 0 );
  } else if ( ch == '2' ) {
    g_painter.setGrid ( 1 );
  } else if ( ch == '3' ) {
    g_painter.setGrid ( 2 );
  } 

  else if ( keycode == 219 )  // left bracket ('[')
  {
    g_board_controller.opUndo();

    var map = g_board_controller.board.kicad_brd_json.brd_to_sch_net_map;
    g_board_controller.board.updateRatsNest( undefined, undefined, map );

  }
  else if ( keycode == 221 ) // right bracket (']')
  {
    g_board_controller.opRedo();

    var map = g_board_controller.board.kicad_brd_json.brd_to_sch_net_map;
    g_board_controller.board.updateRatsNest( undefined, undefined, map );

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

  //else if (keycode == 192) { console.log("cli"); }

  else if (ch == 'A') {
    /*
    comp_name = "C";
    console.log("adding component '" + comp_name + 
                "' " + wc["x"] + " " + wc["y"] + 
                " (mouse: " + this.mouse_cur_x + " " + this.mouse_cur_y + ")");
    g_board_controller.board.addComponent( comp_name, wx, wy );
   */

  }
  else if (ch == 'F')
  {

    //DEBUG
    //console.log("FLIP");

    var id_ref_ar = g_board_controller.board.pickAll( wx, wy );
    if (id_ref_ar.length > 0)
    {

      for (var ind in id_ref_ar)
      {
        var ref = id_ref_ar[ind]["ref"];
        if (ref["type"] == "module")
        {

          //DEBUG
          //console.log("FOUND!!");

          var src_layer = g_board_controller.guiLayer.getActiveLayer();
          var dst_layer = g_board_controller.guiLayer.getInactiveLayer();

          //console.log(src_layer, dst_layer);

          // IN DEVELOPMENT
          //STILL NEEDS WORK!

          //g_board_controller.board.flip( id_ref_ar[ind], src_layer, dst_layer );
          //break;

          var op = { source: "brd", destination: "brd" };
          op.action = "update";
          op.type = "flip";
          op.id = id_ref_ar[ind].id;
          op.data = { sourceLayer : src_layer, destinationLayer: dst_layer};
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
    g_board_controller.board.debug_geom = [];
  }

  else if (ch == 'B')
  {

  }

  else if (ch == 'Z')
  {

    g_board_controller.tool = new toolBoardZone(x, y);
    g_board_controller.board.unhighlightNet();


    // EXPERIMENTAL
    g_board_controller.unhighlightNet( );
    // EXPERIMENTAL



  }
  else if (ch == 'J')
  {

    //console.log("J " + wx + " " + wy );

    //g_board_controller.board.addConnection( wx, wy );
    //g_painter.dirty_flag = true;
  }
  else if (ch == 'X')
  {

    g_board_controller.board.unhighlightNet();

    // EXPERIMENTAL
    g_board_controller.unhighlightNet( );
    // EXPERIMENTAL

    g_board_controller.tool = new toolTrace(x, y, [0, 15], true, this.highlightNetcodes);

  }

  else if (ch == 'V')
  {
    //console.log("V ");
    g_board_controller.guiLayer.toggleLayer();
    g_painter.dirty_flag = true;
  }

  else if (ch == 'S')
  {

    var ida = g_board_controller.board.pickAll( wx, wy );
    if (ida.length > 0) 
    {
      var t = g_painter.devToWorld(x, y);
      g_board_controller.tool = new toolBoardMove(x, y, ida);
      //g_board_controller.tool.addElement( ida );

      g_board_controller.board.unhighlightNet();

      // EXPERIMENTAL
      g_board_controller.unhighlightNet( );
      // EXPERIMENTAL


      return true;
    }
    else
    {
      console.log("...nope");
    }

  }
  else if (ch == 'W')
  {

    //g_board_controller.tool = new toolWire(x, y);
    return true;

  }
  else if ( (ch == 'R') || (ch == 'E') )
  {
    var ccw = ( (ch == 'R') ? true : false );

    var id_ref = g_board_controller.board.pick( wx, wy );
    if ( id_ref )
    {

      var op = { source: "brd", destination: "brd" };
      op.action = "update";
      op.type = "rotate90";
      op.id = id_ref.id;
      op.data = { ccw : ccw };
      g_board_controller.opCommand( op );

      //g_board_controller.board.rotate90( id_ref, ccw );
      //g_painter.dirty_flag = true;

      //g_board_controller.board.updateRatsNest();
      var map = g_board_controller.board.kicad_brd_json.brd_to_sch_net_map;
      g_board_controller.board.updateRatsNest( undefined, undefined, map );

      this.mouseMove( this.mouse_cur_x, this.mouse_cur_y );
    }

  }
  else if (ch == 'Y')
  {

    //console.log("Y");

    var id_ref = g_board_controller.board.pick( wx, wy );
    if ( id_ref )
    {
      //console.log("y pick (15deg rot), got:");
      //console.log(id_ref);

      var ang_rad =  15 * Math.PI / 180;
      var x = id_ref.ref.x;
      var y = id_ref.ref.y;

      var op = { source: "brd", destination: "brd" };
      op.action = "update";
      op.type = "rotate";
      op.id = id_ref.id;
      op.data = { ccw : ccw, cx : x, cy: y, angle : ang_rad, ccw: true };
      g_board_controller.opCommand( op );

      //g_board_controller.board.rotateAboutPoint( [ id_ref ], x, y, 15 * Math.PI / 180, true );

      this.mouseMove( this.mouse_cur_x, this.mouse_cur_y );
    }

    var map = g_board_controller.board.kicad_brd_json.brd_to_sch_net_map;
    g_board_controller.board.updateRatsNest( undefined, undefined, map );

  }

  else if ( ch == 'U' )
  {
    //console.log("adding 'unknown' part");

    var k = g_board_controller.board.makeUnknownModule( );

    var op = { source: "brd", destination: "brd" };
    op.action = "add";
    op.type = "footprintData";
    op.data = { footprintData : k,
                x : 0, y: 0 };
    g_board_controller.opCommand( op );

    //g_board_controller.board.addFootprintData( k , 0, 0 );

    g_board_controller.board.unhighlightNet();

    // EXPERIMENTAL
    g_board_controller.unhighlightNet( );
    // EXPERIMENTAL


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
  else if ( ch == 'L')
  {

  }

  else if (ch == 'K')
  {

    console.log("k");


    g_board_controller.board.updateLocalNet();

    //g_board_controller.op._opDebugPrint();

    //var pnts = 
    //g_board_controller.board.debug_point =
      //g_board_controller.board._realize_rect( 0, 0, 500, 300, 0.3 );
      //g_board_controller.board._realize_circle( 0, 0, 500, 0.3, 10 );
      //g_board_controller.board._realize_oblong( 0, 0, 700, 500, 0.3, 10, true );
      //g_board_controller.board._realize_oblong( 0, 0, 500, 700, 0.3, 10, true );
      //g_board_controller.board._realize_oblong_point_cloud( 0, 0, 500, 700, 0.3, 30 );


    //g_board_controller.board.debug_point = [];
    //g_board_controller.board._make_segment( g_board_controller.board.debug_point, 
        //{ x0: 0, y0: 0, x1 : 100, y1: 300, width: 500} , 10, true );
        //{ x0: 0, y0: 0, x1 : 100, y1: 300, width: 500} , 10 );
    //console.log( g_board_controller.board.debug_point );

    /*
    var pnts = [];
    var czone = null;
    for (var i in g_board_controller.board.kicad_brd_json.element)
    {
      var ele = g_board_controller.board.kicad_brd_json.element[i];
      if ( ele.type == "czone") 
      {
        console.log("czone ...");
        czone = ele;
        break;
      }
    }

    console.log(czone);
    if (czone)
    {
      var pc = czone.polyscorners;
      for (var i in pc)
      {
        pnts.push( [ pc[i].x0, pc[i].y0 ] );
      }

      console.log(pnts);

      //if (pc.length > 0) g_board_controller.board.debug_geom.push( pnts );

      //var pgns = g_board_controller.board._make_pwh_from_pnts( pnts );
      var pgns = g_board_controller.board._make_pgns_from_pnts ( pnts );

      console.log("got pgns:");
      console.log(pgns);

      for (var i in pgns)
        g_board_controller.board.debug_pgns.push( pgns[i] );



    }
    */


  }
  else if (ch == 'D')
  {
    //console.log("(D)elete: wxy: " + wx + " " + wy );

    var id_ref_ar = g_board_controller.board.pickAll( wx, wy );

    //console.log("got:");
    //console.log(id_ref_ar);

    if (id_ref_ar.length > 0)
    {

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
          g_board_controller.opCommand( op );

          var map = g_board_controller.board.kicad_brd_json.brd_to_sch_net_map;
          g_board_controller.board.updateRatsNest( undefined, undefined, map );

  
          g_board_controller.board.unhighlightNet();

          // EXPERIMENTAL
          g_board_controller.unhighlightNet( );
          // EXPERIMENTAL



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
          g_board_controller.opCommand( op );


          var ref = id_ref_ar[ind].ref;

          var split_op = { source: "brd", destination: "brd" };
          split_op.action = "update";
          split_op.type = "splitnet";
          split_op.data = { net_number: ref.netcode };
          g_board_controller.opCommand( split_op );
          //g_board_controller.board.splitNet( ref.netcode );


          g_board_controller.board.unhighlightNet();

          // EXPERIMENTAL
          g_board_controller.unhighlightNet( );
          // EXPERIMENTAL


          var map = g_board_controller.board.kicad_brd_json.brd_to_sch_net_map;
          g_board_controller.board.updateRatsNest( undefined, undefined, map );
          g_painter.dirty_flag = true;

          //DEBUG
          console.log(">>>>", map);


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
          g_board_controller.opCommand( op );

          var map = g_board_controller.board.kicad_brd_json.brd_to_sch_net_map;
          g_board_controller.board.updateRatsNest( undefined, undefined, map );

          g_board_controller.board.unhighlightNet();

          // EXPERIMENTAL
          g_board_controller.unhighlightNet( );
          // EXPERIMENTAL



          return true;

        }
      }

      op.id.push( id_ref_ar[ind].id );
      var clonedData = {};
      $.extend( true, clonedData, id_ref_ar[ind].ref );
      op.data.element.push( clonedData );
      g_board_controller.opCommand( op );

      var map = g_board_controller.board.kicad_brd_json.brd_to_sch_net_map;
      g_board_controller.board.updateRatsNest( undefined, undefined, map );

      g_board_controller.board.unhighlightNet();

      // EXPERIMENTAL
      g_board_controller.unhighlightNet( );
      // EXPERIMENTAL



      return true;

    }

  }
  else if (ch == 'M')
  {
    //console.log("move...\n");
  }

  if (keycode == '32') return false;
  return true;
}

toolBoardNav.prototype.keyUp = function( keycode, ch, ev )
{
  //console.log("toolBoardNav keyUp: " + keycode + " " + ch );
}


