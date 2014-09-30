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


function toolNav( x, y, viewMode ) 
{
  this.viewMode = ( (typeof viewMode === 'undefined') ? false : viewMode );
  x = ( typeof x !== 'undefined' ? x : 0 );
  y = ( typeof y !== 'undefined' ? y : 0 );

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

}

toolNav.prototype.update = function(x, y)
{
  this.mouse_cur_x = x;
  this.mouse_cur_y = y;

  this.mouse_world_xy = g_painter.devToWorld(x, y);
  this.snap_world_xy = g_snapgrid.snapGrid( this.mouse_world_xy );
}


toolNav.prototype.drawOverlay = function()
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
  }

  g_schematic_controller.display_text = "x: " + this.snap_world_xy.x + ", y: " + this.snap_world_xy.y;

}

toolNav.prototype.mouseDown = function( button, x, y ) 
{
  this.mouse_down = true;

  if (button == 3)
    this.mouse_drag_flag = true;

  if (this.viewMode) { return; }

  // pass control to toolSelect 
  else if (button == 1)

  {
    var world_coord = g_painter.devToWorld( x, y );
    var id_ref =  g_schematic_controller.schematic.pick( world_coord["x"], world_coord["y"] );

    if (id_ref)
    {
      g_schematic_controller.tool = new toolMove(x, y, false);
      g_schematic_controller.tool.addElement( [ id_ref ] );

      g_painter.dirty_flag = true;

    }
    else
    {
      g_schematic_controller.tool = new toolSelect(x, y);
    }

  }
}

toolNav.prototype.doubleClick = function(button, x, y)
{
  if (this.viewMode) { return; }

  //console.log("toolNav.doubleClick");
  var world_coord = g_painter.devToWorld( x, y );
  var id_ref =  g_schematic_controller.schematic.pick( world_coord["x"], world_coord["y"] );

  //console.log(id_ref);

  // There is minor bug whereby if somone cliks, then immediately clicks again, but
  // doesn't unlick (the second time), it will put the selected component into 
  // toolMove mode.  When the second click releases, it will fire this doubleclick
  // function and will put it into toolComponentEdit.  This is a little counter
  // intuitive but isn't very major.  Either consider it a feature or get to it
  // later.
  //
  if (id_ref)
  {

    if (id_ref.ref.type == "component")
    {
      g_schematic_controller.tool = new toolComponentEdit(x, y, id_ref);
      g_painter.dirty_flag = true;
    }

    else if (id_ref.ref.type == "label")
    {
      g_schematic_controller.tool = new toolLabelEdit(x, y, id_ref);
      g_painter.dirty_flag = true;
    }

  }
  else
  {
    //g_schematic_controller.tool = new toolSelect(x, y);
  }


}

toolNav.prototype.mouseUp = function( button, x, y ) 
{
  this.mouse_down = false;

  if (button == 3)
    this.mouse_drag_flag = false;
}

toolNav.prototype.mouseMove = function( x, y ) 
{
  if ( this.mouse_drag_flag ) 
     this.mouseDrag ( x - this.mouse_cur_x, y - this.mouse_cur_y );


  this.mouse_cur_x = x;
  this.mouse_cur_y = y;

  var world_xy = g_painter.devToWorld( this.mouse_cur_x, this.mouse_cur_y );
  this.mouse_world_xy["x"] = world_xy["x"];
  this.mouse_world_xy["y"] = world_xy["y"];

  var wx = this.mouse_world_xy.x;
  var wy = this.mouse_world_xy.y;

  g_painter.dirty_flag = true;

  if (this.viewMode) { return; }

  var id_ref = g_schematic_controller.schematic.pick( wx, wy );

  if (id_ref)
  {
    g_schematic_controller.schematic.constructNet();
    var ref = g_schematic_controller.schematic.refLookup( id_ref.id );

    if (ref.type == "wireline")
    {
      g_schematic_controller.highlightBoardNetsFromSchematic( [ ref.data.netcode ] );
    }
    else if (ref.type == "component")
    {
      for (var i in ref.pinData)
      {
        if ( (Math.abs( ref.pinData[i].x - wx ) <= 25) &&
             (Math.abs( ref.pinData[i].y - wy ) <= 25) )
        {
          g_schematic_controller.highlightBoardNetsFromSchematic( [ ref.pinData[i].netcode ] );
          break;
        }
      }
    }
    else
    {
      g_schematic_controller.highlightBoardNetsFromSchematic( [] );
    }
  }
  else
  {
    g_schematic_controller.highlightBoardNetsFromSchematic( [] );
  }

}

toolNav.prototype.mouseDrag = function( dx, dy ) 
{
  g_painter.adjustPan ( dx, dy );
  g_painter.dirty_flag = true;
}

toolNav.prototype.mouseWheel = function( delta )
{
  g_painter.adjustZoom ( this.mouse_cur_x, this.mouse_cur_y, delta );
}

// TESTING

toolNav.prototype.keyDown = function( keycode, ch, ev )
{
  //console.log("toolNav keyDown: " + keycode + " " + ch );
  //console.log(ev);

  if (this.viewMode)
  {
    if ( ch == '1' ) {  // no grid
      g_painter.setGrid ( 0 );
    } else if ( ch == '2' ) {  // point grid
      g_painter.setGrid ( 1 );
    } else if ( ch == '3' ) {  // line grid
      g_painter.setGrid ( 2 );
    }

    return true;
  }

  if ( keycode == 188 )
  {

    /*
    var ele = document.getElementById("canvas");

    //ele.style.cursor = "url('/bleepsix/img/cursor_custom_test_s24.png') 4 3, cursor";
    //ele.style.cursor = "url('/bleepsix/img/cursor_custom_wire_s24.png') 4 3, cursor";
    //ele.style.cursor = "url('/bleepsix/img/cursor_custom_bus_s24.png') 4 3, cursor";
    //ele.style.cursor = "url('/bleepsix/img/cursor_custom_noconn_s24.png') 4 3, cursor";
    ele.style.cursor = "url('/bleepsix/img/cursor_custom_conn_s24.png') 4 3, cursor";

    //$("#canvas").css(" cursor: url('/bleepsix/img/cursor_custom_test_s24.png') 3 2 , auto; ");
    
    console.log("<??");
    */

  }
  else if ( keycode == 190 )
  {

    /*
    var ele = document.getElementById("canvas");
    ele.style.cursor = " auto ";
    console.log(">??");
    */

  }

  if ( keycode == 219 ) // '['
  {
    g_schematic_controller.opUndo();
  }
  else if (keycode == 221 ) // ']'
  {
    g_schematic_controller.opRedo();
  }


  var x = this.mouse_cur_x;
  var y = this.mouse_cur_y;
  var wc = g_painter.devToWorld(x, y);

  wc = g_snapgrid.snapGrid(wc);

  var wx = wc["x"];
  var wy = wc["y"];

  if ( ch == '1' ) {  // no grid
    g_painter.setGrid ( 0 );
  } else if ( ch == '2' ) {  // point grid
    g_painter.setGrid ( 1 );
  } else if ( ch == '3' ) {  // line grid
    g_painter.setGrid ( 2 );
  } else if (ch == 'A') {
    /*
    comp_name = "C";
    console.log("adding component '" + comp_name + 
                "' " + wc["x"] + " " + wc["y"] + 
                " (mouse: " + this.mouse_cur_x + " " + this.mouse_cur_y + ")");
    g_schematic_controller.schematic.addComponent( comp_name, wx, wy );
    */

  }

  else if (ch == 'I')
  {
    console.log(">>> (I)nformation");
    console.log("schematic:");
    console.log( g_schematic_controller.schematic);
    console.log( g_schematic_controller.schematic.kicad_sch_json );
    console.log( g_schematic_controller.schematic.ref_lookup );

    console.log("board:");
    console.log( g_schematic_controller.board.kicad_brd_json );
  }

  else if (ch == 'L')
  {
    //console.log("logging out!");
    //g_schnetwork.logout();
    g_schematic_controller.tool = 
      new toolLabel( this.mouse_cur_x, this.mouse_cur_y, "label" );
    
  }
  else if (ch == 'V')
  {
    //TEST FILE DOWNLOAD
    /*
    $.fileDownload( "gplv3.txt" )
    .done( function(msg) { alert('done: ' + msg); return true; })
    .fail( function(msg, err,c ) { alert('fail: ' + c + "," + err + "," + msg); return true; }) ;
    */
    //populateIframe( "downloadIframe", "gplv3.txt" );
    //populateIframe( "downloadIframe", "foo.txt" );
    //formSubmitTest("testing string");
    //formSubmitTest( g_schematic_controller.schematic.kicad_sch_json );
    //submitSchematic( g_schematic_controller.schematic.kicad_sch_json );

    //var foo = document.getElementById('downloadForm');
    //foo.submit();
    //console.log("..");

    // DUMMY (DEBUG) TESTS
    //
    //window.location.href = "https://google.com";
    //return;

    //g_schnetwork.schfullpush();

    //console.log("LOADING (schsnapshot)");
    //g_schnetwork.schsnapshot();

    //DEBUG
    g_schematic_controller.schematic.constructNet();


  }
  else if (ch == 'U')
  {


  }
  else if (ch == 'K')
  {

    g_schematic_controller.op._opDebugPrint();

    /*
    console.log("DEBUG: g_schematic_controller.schematic.ref_lookup");
    console.log( "  opHistoryIndex: " + g_schematic_controller.opHistoryIndex );
    console.log( "  opHistoryStart: " + g_schematic_controller.opHistoryStart );
    console.log( "  opHistoryEnd: " + g_schematic_controller.opHistoryEnd );
    console.log( g_schematic_controller.opHistory );
    */


  }
  else if (ch == 'B')
  {

    /*
    //uploadSchematic( g_schematic_controller.schematic.kicad_sch_json );
    uploadSchematic( );

    console.log("SAVING (schfullpush)");
    g_schnetwork.schfullpush();
    */

    //console.log("DEBUG: g_schematic_controller.schematic.ref_lookup");
    //console.log( g_schematic_controller.schematic.ref_lookup);


  }
  else if (ch == 'C')  // copy
  {
    var id_ref = g_schematic_controller.schematic.pick( wx, wy );

    if ( id_ref &&
         (id_ref.ref.type == "component") )
    {
      g_schematic_controller.tool = 
        new toolComponentPlace( this.mouse_cur_x, this.mouse_cur_y, id_ref.ref.name, id_ref.ref );
      return;
    }
  
  }

  else if (ch == 'P')
  {
    //takeSnapShotPicture();
  }
  else if (ch == 'J')
  {

    //console.log("connection? " + wx + " " + wy );

    var op = { source: "sch", destination : "sch"  };
    op.action = "add";
    op.type = "connection";
    op.data = { x:wx, y:wy };
    g_schematic_controller.opCommand( op );

  }
  else if (ch == 'X')
  {

    //console.log("connection? " + wx + " " + wy );

    var op = { source: "sch", destination: "sch" };
    op.action = "add";
    op.type = "noconn";
    op.data = { x:wx, y:wy };
    g_schematic_controller.opCommand( op );

  }
  else if (ch == 'S')
  {

    var ida = g_schematic_controller.schematic.pickAll( wx, wy );

    if (ida.length > 0) 
    {
      var t = g_painter.devToWorld(x, y);
      g_schematic_controller.tool = new toolMove(x, y);
      g_schematic_controller.tool.addElement( ida );
      return true;
    }
    else
    {
      //console.log("...nope");
    }

  }
  else if (ch == 'W')
  {

    g_schematic_controller.guiToolbox.wireSelect();
    g_schematic_controller.tool = new toolWire(x, y);

    g_schematic_controller.schematicUpdate = true;
    return true;

  }
  else if (ch == 'R') // rotate
  {
    var id = g_schematic_controller.schematic.pick( wx, wy );
    if ( id && (id["ref"]["type"] == "component") )
    {

      //console.log("R id:");
      //console.log(id);

      var op = { source: "sch", destination: "sch"  }
      op.action = "update";
      op.type = "componentRotate90";
      op.id = id.id;
      op.data = { ccw : true };
      g_schematic_controller.opCommand( op );


    }
  }
  else if (ch == 'E')  // etator
  {
    var id = g_schematic_controller.schematic.pick( wx, wy );
    if ( id && (id["ref"]["type"] == "component") )
    {

      //console.log("E id:");
      //console.log(id);

      var op = { source: "sch", destination : "sch" }
      op.action = "update";
      op.type = "componentRotate90";
      op.id = id.id;
      op.data = { ccw : false };
      g_schematic_controller.opCommand( op );

    }

  }
  else if (ch == 'H')
  {
    var id = g_schematic_controller.schematic.pick( wx, wy );
    if ( id && (id["ref"]["type"] == "component") )
    {

      var op = { source: "sch", destination : "sch" }
      op.action = "update";
      op.type = "componentRotate180";
      op.id = id.id;
      op.data = { ccw : false };
      g_schematic_controller.opCommand( op );

    }

  }
  else if (ch == 'Y')
  {
    var id = g_schematic_controller.schematic.pick( wx, wy );
    if ( id && (id.ref.type == "component") )
    {

      var op = { source: "sch", destination : "sch" }
      op.action = "update";
      op.type = "componentFlip";
      op.id = id.id;
      g_schematic_controller.opCommand( op );

    }

  }
  else if (ch == 'D')
  {
    //console.log("(D)elete: wxy: " + wx + " " + wy );

    var id_ref_ar = g_schematic_controller.schematic.pickAll( wx, wy );

    //console.log("got:");
    //console.log(id_ref_ar);

    if (id_ref_ar.length > 0)
    {

      var op = { source: "sch", destination : "sch" };
      op.action = "delete";
      op.type = "group";
      op.id = [ ];
      op.data = { element : [] };

      g_schematic_controller.schematicUpdate = true;

      for (var ind in id_ref_ar)
      {
        var ref = id_ref_ar[ind]["ref"];
        if (ref["type"] == "noconn")
        {

          op.id.push( id_ref_ar[ind].id );

          var clonedData = {};
          $.extend( true, clonedData, id_ref_ar[ind].ref );
          op.data.element.push( clonedData );

          g_schematic_controller.opCommand( op );

          return true;
        }
      }

      for (var ind in id_ref_ar)
      {
        var ref = id_ref_ar[ind]["ref"];
        if (ref["type"] == "connection")
        {

          op.id.push( id_ref_ar[ind].id );
          //op.data.element.push( { type: "connection", x: ref.x, y: ref.y } );
          var clonedData = {};
          $.extend( true, clonedData, id_ref_ar[ind].ref );
          op.data.element.push( clonedData );

          g_schematic_controller.opCommand( op );

          return true;
        }
      }

      for (var ind in id_ref_ar)
      {
        var ref = id_ref_ar[ind]["ref"];
        if (ref["type"] != "component")
        {
          op.id.push( id_ref_ar[ind].id );

          var clonedData = {};
          $.extend(true, clonedData, ref );
          op.data.element.push( clonedData );

          //console.log("pushing ref for removal:");
          //console.log(ref);

          g_schematic_controller.opCommand( op );

          return true;
        }
      }

      op.id.push( id_ref_ar[ind].id );

      var clonedData = {};
      $.extend(true, clonedData, ref );
      op.data.element.push( clonedData );

      g_schematic_controller.opCommand( op );

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

toolNav.prototype.keyUp = function( keycode, ch, ev )
{
  //console.log("toolNav keyUp: " + keycode + " " + ch );
}


