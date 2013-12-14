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


// Need to figure out if we keep the type specific component operations here
// or move them somewhere else.
// Yeah, it's pretty bad.  We'll have to figure out a way to make it more consistent
// and robust.
//

function toolMove( mouse_x, mouse_y, processInitialMouseUp  ) 
{

  mouse_x = ( typeof mouse_x !== 'undefined' ? mouse_x : 0 );
  mouse_y = ( typeof mouse_y !== 'undefined' ? mouse_y : 0 );
  processInitialMouseUp = ( typeof processInitialMouseUp !== 'undefined' ? processInitialMouseUp : true );

  console.log("toolMove starting");

  this.mouse_cur_x = mouse_x;
  this.mouse_cur_y = mouse_y;

  this.selectedElement = null;

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

  // Since we hand back control on a mouse up instead of a mouse down event
  // and we were handed control from a mouse down event, we need to ignore
  // the initial mouse up event.
  //
  this.processMouseUp = processInitialMouseUp;

}

toolMove.prototype.mouseDrag  = function( dx, dy ) { g_painter.adjustPan( dx, dy ); }
toolMove.prototype.mouseWheel = function( delta )  { g_painter.adjustZoom ( this.mouse_cur_x, this.mouse_cur_y, delta ); }


toolMove.prototype.deep_copy_back = function( op )
{

  var non_wire_type = [ "connection", "noconn", "component", "text" ];

  var ref;
  var orig;

  for (var ind in this.selectedElement)
  {
    ref = this.selectedElement[ind]["ref"];
    orig = op[ind]["ref"];

    if (ref["type"] == "component")
      g_controller.schematic.setComponentTransform( ref, orig["transform"] );
    if ( $.inArray( ref["type"], non_wire_type ) >= 0 )
    {
      g_controller.schematic.setNonWirePosition( ref, orig["x"], orig["y"] );

      if (ref["type"] == "component")
      {
        for (var t_ind in ref["text"])
        {
          ref["text"][t_ind]["x"] = orig["text"][t_ind]["x"];
          ref["text"][t_ind]["y"] = orig["text"][t_ind]["y"];
        }

      }
    }
    else
      g_controller.schematic.setWire( ref, orig["startx"], orig["starty"], orig["endx"], orig["endy"] );

    g_painter.dirty_flag = true;

  }

}


toolMove.prototype.deep_copy_element_array = function( rop )
{
  var non_wire_type = [ "connection", "noconn", "component", "text" ];

  var ref;
  for (var ind in this.selectedElement)
  {
    var ele_state = {};
    ref  = this.selectedElement[ind]["ref"];
    ele_state["type"] = ref["type"];

    if ( $.inArray( ref["type"], non_wire_type) >= 0 )
    {

      ele_state["x"] = ref["x"];
      ele_state["y"] = ref["y"];

      if ( ref["type"] == "component" )
      {
        var t = [ [1,0],[-1,0] ];
        t[0][0] = ref["transform"][0][0];
        t[0][1] = ref["transform"][0][1];
        t[1][0] = ref["transform"][1][0];
        t[1][1] = ref["transform"][1][1];

        ele_state["transform"] = t;

        ele_state["text"] = []

        for (var t_ind in ref["text"] )
          ele_state["text"].push( { x: ref["text"][t_ind]["x"], y: ref["text"][t_ind]["y"] } );

      }

    }
    else
    {

      ele_state["startx"] = ref["startx"];
      ele_state["starty"] = ref["starty"];
      ele_state["endx"] = ref["endx"];
      ele_state["endy"] = ref["endy"];

    }

    rop.push( { id: this.selectedElement[ind]["id"], ref: ele_state } );

  }

}

toolMove.prototype.addElement = function( id_array )
{

  this.selectedElement = id_array;

  var world_xy = g_painter.devToWorld( this.mouse_cur_x, this.mouse_cur_y );

  this.prev_world_xy["x"] = world_xy["x"];
  this.prev_world_xy["y"] = world_xy["y"];

  this.cur_world_xy["x"] = world_xy["x"];
  this.cur_world_xy["y"] = world_xy["y"];

  this.orig_world_xy["x"] = world_xy["x"];
  this.orig_world_xy["y"] = world_xy["y"];

  this.snap_world_xy = g_snapgrid.snapGrid( g_painter.devToWorld( this.mouse_cur_x, this.mouse_cur_y ) );

  this.deep_copy_element_array( this.orig_element_state );
  this.deep_copy_element_array( this.base_element_state );

  g_painter.dirty_flag = true;
}

toolMove.prototype.drawOverlay = function()
{
  var s = this.cursorSize / 2;

  g_painter.drawRectangle( this.snap_world_xy["x"] - s, 
                           this.snap_world_xy["y"] - s, 
                           this.cursorSize ,
                           this.cursorSize ,
                           this.cursorWidth ,
                           "rgb(128, 128, 128 )" );

  for (var ind in this.selectedElement )
  {
    var ref = this.selectedElement[ind]["ref"];
    var bbox = ref["bounding_box"];

    var x = bbox[0][0];
    var y = bbox[0][0];
    var w = bbox[1][0] - bbox[0][0];
    var h = bbox[1][1] - bbox[0][1];

    g_painter.drawRectangle( bbox[0][0], bbox[0][1],
                             w, h, 
                             10, "rgb(128,128,128)",
                             true, "rgba(0,0,0,0.25)");
  }

}

toolMove.prototype.mouseDown = function( button, x, y )
{

  console.log("toolMove.mouseDown");

  /*
  if (button == 1)
  {
    g_controller.tool = new toolNav(x, y);
    //g_controller.tool.mouseMove( x, y );  // easy way to setup?
    g_painter.dirty_flag = true;
  }
  else 
 */
  if (button == 3)
  {
    this.mouse_drag_button = true;
  }


}

toolMove.prototype.doubleClick = function( button, x, y )
{
  console.log("toolMove.doubleClick");

  var world_coord = g_painter.devToWorld( x, y );
  var id_ref =  g_controller.schematic.pick( world_coord["x"], world_coord["y"] );

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

  }


}

toolMove.prototype.mouseUp = function( button, x, y )
{

  //console.log("mouseup : " + button + ", ignoreMouseUp: " + this.processMouseUp);
  this.mouse_drag_button = false;

  if (this.processMouseUp)
  {

    if (button == 1)
    {
      g_controller.tool = new toolNav(x, y);
      //g_controller.tool.mouseMove( x, y );  // easy way to setup?
      g_painter.dirty_flag = true;
    }
  }

  this.processMouseUp = true;


}

toolMove.prototype.mouseMove = function( x, y )
{

  if (this.mouse_drag_button == true)
    this.mouseDrag ( x - this.mouse_cur_x, y - this.mouse_cur_y );

  this.mouse_cur_x = x;
  this.mouse_cur_y = y;

  if (this.mouse_drag_button == false)
  {

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

    this.deep_copy_back( this.base_element_state );


    for (var ind in this.selectedElement)
    {

      g_controller.schematic.relativeMoveElement( this.selectedElement[ind], wdx, wdy );
      g_painter.dirty_flag = true;

    }

    this.prev_world_xy["x"] = world_xy["x"];
    this.prev_world_xy["y"] = world_xy["y"];

  }

}

toolMove.prototype.keyDown = function( keycode, ch, ev )
{

  if (keycode == 27)
  {

    this.deep_copy_back( this.orig_element_state );

    // pass control back to toolNav
    g_controller.tool = new toolNav();
    g_controller.tool.mouseMove( this.mouse_cur_x, this.mouse_cur_y );  // easy way to setup?
    g_painter.dirty_flag = true;


  }
  else if (ch == 'I')
  {
    console.log('(I)nfo for picked part(s): ' );

    for (var ind in this.selecteElement)
    {
      console.log( this.selectedElement[ind].ref.name );
      console.log( this.selectedElement[ind].ref );
    }
  }
  else if (ch == 'D')
  {
    for (var ind in this.selectedElement)
      g_controller.schematic.remove( this.selectedElement[ind] );

    g_controller.tool = new toolNav( this.mouse_cur_x, this.mouse_cur_y );
    g_painter.dirty_flag = true;

  }
  else if (ch == 'R')
  {

    com = g_controller.schematic.centerOfMass( this.base_element_state );

    // be careful, this might lead to 'drift' as we rotate things around
    //
    com = g_snapgrid.snapGrid(com);

    g_controller.schematic.rotateAboutPoint90( this.base_element_state , com["x"], com["y"], false );
    this.deep_copy_back( this.base_element_state );

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

    for (var ind in this.selectedElement)
      g_controller.schematic.relativeMoveElement( this.selectedElement[ind], wdx, wdy );

    g_painter.dirty_flag = true;

  }

}

toolMove.prototype.keyUp = function( keycode, ch, ev  )
{
}

