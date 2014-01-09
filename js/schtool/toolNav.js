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


function toolNav( x, y ) 
{
  x = ( typeof x !== 'undefined' ? x : 0 );
  y = ( typeof y !== 'undefined' ? y : 0 );

  console.log("toolNav");

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

  g_controller.display_text = "x: " + this.snap_world_xy.x + ", y: " + this.snap_world_xy.y;

}

toolNav.prototype.mouseDown = function( button, x, y ) 
{
  this.mouse_down = true;

  if (button == 3)
    this.mouse_drag_flag = true;

  // pass control to toolSelect 
  else if (button == 1)

  {
    var world_coord = g_painter.devToWorld( x, y );
    var id_ref =  g_controller.schematic.pick( world_coord["x"], world_coord["y"] );

    if (id_ref)
    {
      g_controller.tool = new toolMove(x, y, false);
      g_controller.tool.addElement( [ id_ref ] );

      g_painter.dirty_flag = true;

    }
    else
    {
      g_controller.tool = new toolSelect(x, y);
    }

  }
}

toolNav.prototype.doubleClick = function(button, x, y)
{
  //console.log("toolNav.doubleClick");
  var world_coord = g_painter.devToWorld( x, y );
  var id_ref =  g_controller.schematic.pick( world_coord["x"], world_coord["y"] );

  //console.log(id_ref);

  if (id_ref)
  {

    if (id_ref.ref.type == "component")
    {
      g_controller.tool = new toolComponentEdit(x, y, id_ref);
      g_painter.dirty_flag = true;
    }

  }
  else
  {
    //g_controller.tool = new toolSelect(x, y);
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

  g_painter.dirty_flag = true;

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
  } else if (ch == 'A') {
    comp_name = "C";
    console.log("adding component '" + comp_name + 
                "' " + wc["x"] + " " + wc["y"] + 
                " (mouse: " + this.mouse_cur_x + " " + this.mouse_cur_y + ")");
    g_controller.schematic.addComponent( comp_name, wx, wy );

  }

  else if (ch == 'I')
  {
    console.log( g_controller.schematic.kicad_sch_json );
  }

  else if (ch == 'L')
  {
    console.log("logging out!");
    g_schnetwork.logout();
    
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
    //formSubmitTest( g_controller.schematic.kicad_sch_json );
    //submitSchematic( g_controller.schematic.kicad_sch_json );

    //var foo = document.getElementById('downloadForm');
    //foo.submit();
    //console.log("..");

    // DUMMY (DEBUG) TESTS
    //
    //window.location.href = "https://google.com";
    //return;

    //g_schnetwork.schfullpush();

    console.log("LOADING (schsnapshot)");
    g_schnetwork.schsnapshot();

  }
  else if (ch == 'B')
  {

    //uploadSchematic( g_controller.schematic.kicad_sch_json );
    uploadSchematic( );

    console.log("SAVING (schfullpush)");
    g_schnetwork.schfullpush();


  }
  else if (ch == 'C')
  {
    var id_ref = g_controller.schematic.pick( wx, wy );

    if ( id_ref &&
         (id_ref.ref.type == "component") )
    {
      g_controller.tool = new toolComponentPlace( this.mouse_cur_x, this.mouse_cur_y, id_ref.ref.name, id_ref.ref );
      return;
    }
  
  }

  else if (ch == 'P')
  {
    takeSnapShotPicture();
  }
  else if (ch == 'J')
  {

    console.log("connection? " + wx + " " + wy );
    g_controller.schematic.addConnection( wx, wy );
    g_painter.dirty_flag = true;
  }
  else if (ch == 'X')
  {

    console.log("connection? " + wx + " " + wy );

    g_controller.schematic.addNoconn( wx, wy );
    g_painter.dirty_flag = true;
  }
  else if (ch == 'S')
  {

    var ida = g_controller.schematic.pickAll( wx, wy );

    if (ida.length > 0) 
    {
      var t = g_painter.devToWorld(x, y);
      g_controller.tool = new toolMove(x, y);
      g_controller.tool.addElement( ida );
      return true;
    }
    else
    {
      console.log("...nope");
    }

  }
  else if (ch == 'W')
  {

    g_controller.tool = new toolWire(x, y);
    return true;

  }
  else if (ch == 'R')
  {
    var id = g_controller.schematic.pick( wx, wy );
    if ( id && (id["ref"]["type"] == "component") )
      g_controller.schematic.rotate90( id, true );
  }
  else if (ch == 'E')
  {
    var id = g_controller.schematic.pick( wx, wy );
    if ( id && (id["ref"]["type"] == "component") )
      g_controller.schematic.rotate90( id, false );

  }
  else if (ch == 'Y')
  {
    var id = g_controller.schematic.pick( wx, wy );
    if ( id && (id["ref"]["type"] == "component") )
    {
      g_controller.schematic.rotate90( id, false );
      g_controller.schematic.rotate90( id, false );
    }

  }
  else if (ch == 'D')
  {
    console.log("(D)elete: wxy: " + wx + " " + wy );

    var id_ref_ar = g_controller.schematic.pickAll( wx, wy );

    console.log("got:");
    console.log(id_ref_ar);

    if (id_ref_ar.length > 0)
    {
      for (var ind in id_ref_ar)
      {
        var ref = id_ref_ar[ind]["ref"];
        if (ref["type"] == "noconn")
        {
          g_controller.schematic.remove( id_ref_ar[ind] );
          g_painter.dirty_flag = true;
          return true;
        }
      }

      for (var ind in id_ref_ar)
      {
        var ref = id_ref_ar[ind]["ref"];
        if (ref["type"] == "connection")
        {
          g_controller.schematic.remove( id_ref_ar[ind] );
          g_painter.dirty_flag = true;
          return true;
        }
      }

      for (var ind in id_ref_ar)
      {
        var ref = id_ref_ar[ind]["ref"];
        if (ref["type"] != "component")
        {
          g_controller.schematic.remove( id_ref_ar[ind] );
          g_painter.dirty_flag = true;
          return true;
        }
      }

      g_controller.schematic.remove( id_ref_ar[0] );
      g_painter.dirty_flag = true;
      return true;

    }

  }
  else if (ch == 'M')
  {
    console.log("move...\n");
  }

  if (keycode == '32') return false;
  return true;
}

toolNav.prototype.keyUp = function( keycode, ch, ev )
{
  console.log("toolNav keyUp: " + keycode + " " + ch );
}


