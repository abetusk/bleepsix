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

  this.highlightBoxFlag = false;
  this.highlightBox = { x:0, y:0, w:0, h:0 };
  this.highlightBoxWidth = 10;
  this.highlightBoxColor = "rgba(0,0,0,0.4)";
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

  if ( this.highlightBoxFlag )
  {
    g_painter.drawRectangle( this.highlightBox.x,
                             this.highlightBox.y,
                             this.highlightBox.w,
                             this.highlightBox.h,
                             this.highlightBoxWidth,
                             "rgb(128,128,128)",
                             true,
                             this.highlightBoxColor );
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
  //
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

  this.snap_xy = g_snapgrid.snapGrid( this.mouse_world_xy );

  var found = false;
  var id_ref = g_schematic_controller.schematic.pick( wx, wy );

  // highlight pin logic
  //
  if (!this.mouse_drag_flag)
  {
    var snapx = this.snap_xy.x;
    var snapy = this.snap_xy.y;

    var hi_id_ref = g_schematic_controller.schematic.pick( snapx, snapy );
    this.highlightBoxFlag = false;

    if (hi_id_ref)
    { 
      var ref = hi_id_ref.ref;

      if (hi_id_ref.ref.type == "component")
      { 
        var pin = g_schematic_controller.schematic.pickComponentPin( hi_id_ref.ref, snapx, snapy );
        if (pin)
        { 
          var comp = g_controller.schematic._lookup_comp( hi_id_ref.ref.name );

          if (comp && ("transform" in ref))
          { 
            var p = numeric.dot( ref.transform, [ parseInt(pin.x), parseInt(pin.y) ] );

            var w = 50;
            var pinx = parseInt(hi_id_ref.ref.x) + p[0];
            var piny = parseInt(hi_id_ref.ref.y) + p[1];
            this.highlightBoxFlag = true;
            this.highlightBox = { x: pinx - w/2, y: piny - w/2, w: w, h: w};
          }
        }
      }
    }
  }


  if (!id_ref)
  {
    var snap_xy = g_snapgrid.snapGrid( this.mouse_world_xy );
    wx = snap_xy.x;
    wy = snap_xy.y;
    id_ref = g_schematic_controller.schematic.pick( wx, wy );
  }


  if (id_ref)
  {
    g_schematic_controller.schematic.constructNet();
    var ref = g_schematic_controller.schematic.refLookup( id_ref.id );

    if (ref.type == "wireline")
    {
      npim = g_schematic_controller.schematic.kicad_sch_json.net_pin_id_map;
      var pin_arr = [];

      for (var ind in npim)
      {
        if (npim[ind].netcode == ref.data.netcode)
        {
          pin_arr.push( ind );
        }
      }
      pin_arr.sort();

      if (pin_arr.length==0)
      {
        g_schematic_controller.highlightBoardNetsFromSchematic( [ ref.data.netcode ] );
      }
      else
      {
        var id_pin = pin_arr[0].split( ":" );
        var msg_ele = "h;" + id_pin[0] + "/" + id_pin[1] + "," + ref.data.netcode ;
        g_schematic_controller.highlightBoardNetsFromSchematic( [ msg_ele ] );

      }

      found = true;
    }
    else if (ref.type == "component")
    {
      for (var i in ref.pinData)
      {
        if ( (Math.abs( ref.pinData[i].x - wx ) <= 25) &&
             (Math.abs( ref.pinData[i].y - wy ) <= 25) )
        {

          var msg_ele = "h;" + ref.id + "/" + i + "," + ref.pinData[i].netcode;
          g_schematic_controller.highlightBoardNetsFromSchematic( [ msg_ele ] );

          found = true;
          break;
        }
      }
    }

  }

  if (!found) {
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

toolNav.prototype._recenter = function() {
  var width = 1600, height = 1600;
  var bbox = g_schematic_controller.schematic.getSchematicBoundingBox();
  var cx = (bbox[0][0] + bbox[1][0])/2.0;
  var cy = (bbox[0][1] + bbox[1][1])/2.0;

  var dx = (bbox[1][0] - bbox[0][0]);
  var dy = (bbox[1][1] - bbox[0][1]);

  var dmax = ( (dx<dy) ? dy : dx );
  var viewmax = ( (width < height) ? height : width );

  var f = dmax / viewmax;
  if (f < 1) f = 1.0;

  var sch_fudge = 8.0;
  f *= sch_fudge;

  g_painter.setView( cx, cy, 1/f );
}

toolNav.prototype.keyDown = function( keycode, ch, ev )
{

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

  else if (ch == '0')
  {
    this._recenter();
    g_painter.dirty_flag = true;
  }


  else if ( keycode == 192 )
  {
    g_schematic_controller.schematic.draw_id_text_flag =
      !g_schematic_controller.schematic.draw_id_text_flag;
    g_schematic_controller.schematic.draw_bounding_box_flag =
      !g_schematic_controller.schematic.draw_bounding_box_flag;
    g_painter.dirty_flag = true;
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
    g_schematic_controller.tool = 
      new toolLabel( this.mouse_cur_x, this.mouse_cur_y, "label" );
    
  }
  else if (ch == 'V')
  {
    //DEBUG
    g_schematic_controller.schematic.constructNet();
  }
  else if (ch == 'U')
  {


  }
  else if (ch == 'K')
  {
    g_schematic_controller.op._opDebugPrint();
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

  else if (ch == 'J')
  {
    var op = { source: "sch", destination : "sch"  };
    op.action = "add";
    op.type = "connection";
    op.data = { x:wx, y:wy };
    g_schematic_controller.opCommand( op );

  }
  else if (ch == 'X')
  {
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
    var id_ref_ar = g_schematic_controller.schematic.pickAll( wx, wy );

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

  if (keycode == '32') return false;
  return true;
}

toolNav.prototype.keyUp = function( keycode, ch, ev ) { }
