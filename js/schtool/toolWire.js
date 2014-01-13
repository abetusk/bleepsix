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

function toolWire( x, y, initialPlaceFlag ) 
{
  console.log("toolWire");

  x = ( typeof x !== 'undefined' ? x : 0 );
  y = ( typeof x !== 'undefined' ? y : 0 );
  initialPlaceFlag = ( typeof initialPlaceFlag !== 'undefined' ? initialPlaceFlag : true );

  this.dist1_wire_eps = 1;

  this.mouse_down = false;
  this.mouse_cur_x = x;
  this.mouse_cur_y = y;

  this.mouse_world_xy = g_painter.devToWorld(x, y);

  this.show_cursor_flag = true;

  this.cursorSize = 6;
  this.cursorWidth = 1;

  this.mouse_drag_flag = false;

  this.laydownFormat = "J";  // F for free, J for jointed
  this.wireType = "wireline";

  this.mouse_world_xy = g_snapgrid.snapGrid( this.mouse_world_xy );

  this.cur_wire = [];
  //this.wire = [ { x : this.mouse_world_xy["x"], y : this.mouse_world_xy["y"] } ];
  this.wire = []; 

  // which direction the first of the potential two wires goes in
  //
  this.jointWireVerticalFlag = true;
  this.jointIntermediateFlag = true;

  this.initialPlaceFlag = initialPlaceFlag;

  this.forceVertical = false;
  this.forceHorizontal = false;

  if (this.initialPlaceFlag)
  {
    this._initWireState();
  }
  

  var ele = document.getElementById("canvas");
  ele.style.cursor = "url('/bleepsix/img/cursor_custom_wire_s24.png') 4 3, cursor";


}

toolWire.prototype._isHorizontalWire = function( wire )
{
  var wire_starty = parseInt( wire["starty"] );
  var wire_endy = parseInt( wire["endy"] );
  if ( wire_starty == wire_endy )
    return true;
  return false;
}

toolWire.prototype._isVerticalWire = function( wire )
{
  var wire_startx = parseInt( wire["startx"] );
  var wire_endx = parseInt( wire["endx"] );
  if ( wire_startx == wire_endx )
    return true;
  return false;
}

toolWire.prototype._initWireState = function()
{

  var x = this.mouse_world_xy.x;
  var y = this.mouse_world_xy.y;
  // If we start from a connection, only allow perpendicular
  // wires to jut out from that wire.
  // It is appropriate to defer placing a connection until
  // the wire is committed to being placed.
  //
  var non_wire_type = ["component", "connection", "noconn", "text" ];
  var id_ref_ar = g_controller.schematic.pickAll( x, y );
  for (var ind in id_ref_ar)
  {

    var ref = id_ref_ar[ind].ref;
    if ($.inArray( ref.type, non_wire_type) >= 0 ) continue;

    if (this.isConnection(ref, x, y))
    {
      if      ( this._isHorizontalWire( ref ) )
        this.forceVertical = true;
      else if ( this._isVerticalWire( ref) )
        this.forceHorizontal = true;
      break;
    }

  }

  this.wire.push( { x : x, y : y } );
  if (this.laydownFormat == 'F')
  {
    this.cur_wire.push( { x : x, y : y } );
    this.cur_wire.push( { x : x, y : y } );
  }
  else if (this.laydownFormat == 'J')
  {
    this.cur_wire.push( { x : x, y : y } );
    this.cur_wire.push( { x : x, y : y } );
    this.cur_wire.push( { x : x, y : y } );
  }
}

//-----------------------------

toolWire.prototype.drawOverlay = function()
{

  var w = this.wire;

  for (var ind =1; ind < w.length; ind++)
  {
    g_painter.line( w[ind-1]["x"], w[ind-1]["y"], 
                    w[ind]["x"],   w[ind]["y"], 
                    "rgb(0,132,0)", 5 );

  }

  for (var ind=1; ind < this.cur_wire.length; ind++)
  {
    g_painter.line( this.cur_wire[ind-1]["x"], this.cur_wire[ind-1]["y"],
                    this.cur_wire[ind]["x"],   this.cur_wire[ind]["y"],
                    "rgb(0,132,0)", 5);
  }

  var s = this.cursorSize / 2;
  g_painter.drawRectangle( this.mouse_world_xy["x"] - s,
                           this.mouse_world_xy["y"] - s,
                           this.cursorSize ,
                           this.cursorSize ,
                           this.cursorWidth ,
                           "rgb(128, 128, 128 )" );


}

//-----------------------------

toolWire.prototype.dist1 = function( xy0, xy1 )
{

  var dx = Math.abs( xy0["x"] - xy1["x"] );
  var dy = Math.abs( xy0["y"] - xy1["y"] );

  return Math.max(dx, dy);

}

//-----------------------------

toolWire.prototype.placeWire = function()
{
  var non_wire_type = ["component", "connection", "noconn", "text" ];

  g_controller.schematicUpdate = true;

  // checking to see if we need to add a source connection
  //
  var x = this.wire[0].x;
  var y = this.wire[0].y;

  var id_ref_ar = g_controller.schematic.pickAll( x, y );

  for (var ind in id_ref_ar)
  {

    var ref = id_ref_ar[ind].ref;
    if ($.inArray( ref.type, non_wire_type) >= 0 ) continue;

    if (this.isConnection(ref, x, y))
    {
      g_controller.schematic.addConnection(x, y);
      break;
    }

  }


  for (var ind=1; ind < this.wire.length; ind++)
  {
    g_controller.schematic.addWire( this.wire[ind-1]["x"], this.wire[ind-1]["y"],
                                    this.wire[ind]["x"], this.wire[ind]["y"] );
  }


  // also need to add the cur_wire
  if (this.laydownFormat == 'J')
  {
    for (var ind=1; ind < this.cur_wire.length; ind++)
    {

      //var d = this.dist1( this.cur_wire[ind-1], this.cur_wire[ind] ) ;
      //console.log("d: " + d);

      if (this.dist1( this.cur_wire[ind-1], this.cur_wire[ind] ) > 1 )
      {
        g_controller.schematic.addWire( this.cur_wire[ind-1]["x"], this.cur_wire[ind-1]["y"],
                                        this.cur_wire[ind]["x"],   this.cur_wire[ind]["y"] );

      }
      else console.log("skipping cause too close");

    }
  }

  g_controller.tool = new toolNav( this.mouse_cur_x, this.mouse_cur_y );
  g_controller.guiToolbox.defaultSelect();
  g_painter.dirty_flag = true;
  g_controller.schematic.eventSave();

  var ele = document.getElementById("canvas");
  ele.style.cursor = "auto";



}

//-----------------------------

toolWire.prototype.isConnection = function( wire, ex, ey)
{
  var wire_startx = parseInt( wire["startx"] );
  var wire_starty = parseInt( wire["starty"] );

  var wire_endx = parseInt( wire["endx"] );
  var wire_endy = parseInt( wire["endy"] );

  var mx = Math.min( wire_startx, wire_endx );
  var my = Math.min( wire_starty, wire_endy );

  var Mx = Math.max( wire_startx, wire_endx );
  var My = Math.max( wire_starty, wire_endy );

  if ( ( mx == ex) && (Mx == ex) && 
       ( my <= ey) && (My >= ey) )
    return true;
  else if ( (my == ey) && (My == ey) &&
            (mx <= ex) && (Mx >= ex) )
    return true; 

  return false;
}

//-----------------------------

toolWire.prototype.handlePossibleConnection = function( ex, ey )
{
  var non_wire_type = ["component", "connection", "noconn", "text" ];

  // first check schematic to see if we hit any wires
  //
  var id_ref_ar = g_controller.schematic.pickAll( ex, ey );

  for (var ind in id_ref_ar)
  {
    var ref = id_ref_ar[ind]["ref"];

    if (ref["type"] == "component")
    {

      //pin returned, as it apperas in the cache, so co-ords are relative 
      //  to part origin (and transform).
      //
      var pin = g_controller.schematic.pickComponentPin( ref, ex, ey );

      if (pin)
      {
        this.placeWire();
        return true;
      }
    }

    // If this isn't a component or a wire, skip to next entry
    //
    if ($.inArray( ref["type"], non_wire_type) >= 0 ) continue;

    if ( this.isConnection( ref, ex, ey ) )
    {
      g_controller.schematic.addConnection( ex, ey );
      this.placeWire();
      return true;
    }
   
  }

  // then check our wires
  //
  for (var ind = 1; ind < this.wire.length; ind ++) 
  {

    var wire = {};
    wire["startx"] = this.wire[ind-1]["x"];
    wire["starty"] = this.wire[ind-1]["y"];
    wire["endx"] = this.wire[ind]["x"];
    wire["endy"] = this.wire[ind]["y"];

    if (this.isConnection( wire, ex, ey ))
    {
      g_controller.schematic.addConnection( ex, ey );
      this.placeWire();
      return true;
    }

  }

  return false;

}

//-----------------------------

toolWire.prototype.mouseDown = function( button, x, y ) 
{
  //var dist1_wire_eps = 5;
  this.mouse_down = true;

  if (button == 3)
    this.mouse_drag_flag = true;

  if (button == 1)
  {

    if (this.wire.length == 0)
    {
      this._initWireState();
      return;
    }

    if (this.laydownFormat == 'F' )
    {

      if ( this.dist1( this.cur_wire[1], this.cur_wire[0] ) < this.dist1_wire_eps )
      {
        console.log("skipping extra add wire event (wires too close) [F]");
      }
      else
      {

        var ex = this.mouse_world_xy["x"];
        var ey = this.mouse_world_xy["y"];

        this.wire.push( { x : this.mouse_world_xy["x"], y : this.mouse_world_xy["y"] } );
        this.cur_wire.shift();
        this.cur_wire.push( { x : this.mouse_world_xy["x"], y : this.mouse_world_xy["y"] } );

        if (this.handlePossibleConnection( ex, ey ))
          return;

      }

    }
    else if (this.laydownFormat == 'J' )
    {

      var d = this.dist1( this.cur_wire[1], this.cur_wire[0] ) ;
      console.log("d: " + d);

      if ( this.dist1( this.cur_wire[1], this.cur_wire[0] ) < this.dist1_wire_eps )
      {

        if ( this.dist1( this.cur_wire[2], this.cur_wire[1] ) < this.dist1_wire_eps )
        {
          //check for special case when direction blah blah blah
          console.log("skipping extra add wire event (wires too close) [J]");

          console.log(this.cur_wire);
          console.log(this.wire);
          return;
        }

        if (this.jointWireVerticalFlag)
        {
          this._makeHorizontalJoint();
        }
        else
        {
          this._makeVerticalJoint();
        }

        this.jointWireVerticalFlag = !this.jointWireVerticalFlag;

      }
      else
      {
        var ex = this.mouse_world_xy["x"];
        var ey = this.mouse_world_xy["y"];

        if ( this.handlePossibleConnection( ex, ey ) )
          return;

        this.wire.push( { x : this.cur_wire[1]["x"], y : this.cur_wire[1]["y"] } );
        this.cur_wire.shift();
        this.cur_wire.push( { x : this.mouse_world_xy["x"], y : this.mouse_world_xy["y"] } );

        if (this.jointWireVerticalFlag)
          this.jointWireVerticalFlag = false;
        else
          this.jointWireVerticalFlag = true;

      }


    }

  }

}

//-----------------------------


toolWire.prototype.doubleClick = function( button, x, y )
{

  if (this.wire.length > 0)
  {
    this.placeWire();
  }
  else
  {
    // If we've selected the toolWire tool but haven't started placing a wire
    // (and we receive a doubleClick event),
    // do nothing but give control back to toolNav
    //
    g_controller.tool = new toolNav( this.mouse_cur_x, this.mouse_cur_y );
    g_controller.guiToolbox.defaultSelect();
    g_painter.dirty_flag = true;

    var ele = document.getElementById("canvas");
    ele.style.cursor = "auto";


  }
}

//-----------------------------

toolWire.prototype.mouseUp = function( button, x, y ) 
{
  this.mouse_down = false;

  if (button == 3)
    this.mouse_drag_flag = false;

}

//-----------------------------


toolWire.prototype._makeVerticalJoint = function()
{
  this.cur_wire[1]["x"] = this.cur_wire[0]["x"];
  this.cur_wire[1]["y"] = this.mouse_world_xy["y"];

  this.cur_wire[2]["x"] = this.mouse_world_xy["x"];
  this.cur_wire[2]["y"] = this.mouse_world_xy["y"];
}

toolWire.prototype._makeHorizontalJoint = function()
{
  this.cur_wire[1]["x"] = this.mouse_world_xy["x"];
  this.cur_wire[1]["y"] = this.cur_wire[0]["y"];

  this.cur_wire[2]["x"] = this.mouse_world_xy["x"];
  this.cur_wire[2]["y"] = this.mouse_world_xy["y"];
}

toolWire.prototype.mouseMove = function( x, y ) 
{

  if ( this.mouse_drag_flag ) 
     this.mouseDrag ( x - this.mouse_cur_x, y - this.mouse_cur_y );

  this.mouse_cur_x = x;
  this.mouse_cur_y = y;

  this.mouse_world_xy = g_painter.devToWorld( this.mouse_cur_x, this.mouse_cur_y );
  this.mouse_world_xy = g_snapgrid.snapGrid( this.mouse_world_xy );

  g_painter.dirty_flag = true;

  if (this.wire.length == 0)
  {
    return;
  }

  if ( ! this.mouse_drag_flag ) 
  {

    if      (this.laydownFormat == 'F')
    {
      this.cur_wire[1]["x"] = this.mouse_world_xy["x"];
      this.cur_wire[1]["y"] = this.mouse_world_xy["y"];

      g_painter.dirty_flag = true;
    }
    else if (this.laydownFormat == 'J')
    {

      if ( this.dist1( this.mouse_world_xy , this.cur_wire[0] ) < 10 )
      {
        this.jointIntermediateFlag = true;

        // it's so small, so it shouldnt' be visible, but just for completeness, default to vertical
        //
        this.cur_wire[1]["x"] = this.mouse_world_xy["x"];
        this.cur_wire[1]["y"] = this.cur_wire[0]["y"];

        this.cur_wire[2]["x"] = this.mouse_world_xy["x"];
        this.cur_wire[2]["y"] = this.mouse_world_xy["y"];


      }
      else if (this.jointIntermediateFlag)
      {
        this.jointIntermediateFlag = false;

        if ( (this.wire.length == 1) &&
             (this.forceVertical || this.forceHorizontal) )
        {
          if (this.forceVertical)
          {

            console.log("forcing vertical");

            this.jointWireVerticalFlag = true;
          }
          else
          {

            console.log("forcing horizontal");

            this.jointWireVerticalFlag = false;
          }
        }
        else
        {

          if (this.wire.length > 1 )
          {
            this.forceVertical = false;
            this.forceHorizontal = false;
          }

          if ( Math.abs( this.mouse_world_xy["x"] - this.cur_wire[0]["x"] ) > 
               Math.abs( this.mouse_world_xy["y"] - this.cur_wire[0]["y"] ) )
            this.jointWireVerticalFlag = false;
          else
            this.jointWireVerticalFlag = true;

        }

      }
      
      if (!this.jointIntermediateFlag)
      {
        if (this.jointWireVerticalFlag)
          this._makeVerticalJoint();
        else
          this._makeHorizontalJoint();
      }

    }

  }

}

//-----------------------------

toolWire.prototype.mouseDrag = function( dx, dy ) 
{
  g_painter.adjustPan ( dx, dy );
}

//-----------------------------

toolWire.prototype.mouseWheel = function( delta )
{
  g_painter.adjustZoom ( this.mouse_cur_x, this.mouse_cur_y, delta );
}

//-----------------------------
// TESTING

toolWire.prototype.keyDown = function( keycode, ch, ev )
{
  console.log("toolWire keyDown: " + keycode + " " + ch );

  if ((ch == 'Q') || (keycode == 27))
  {
    console.log("handing back to toolNav");
    g_controller.tool = new toolNav( this.mouse_cur_x, this.mouse_cur_y );
    g_controller.guiToolbox.defaultSelect();

    g_painter.dirty_flag = true;

    var ele = document.getElementById("canvas");
    ele.style.cursor = "auto";

  }

}

//-----------------------------

toolWire.prototype.keyUp = function( keycode, ch, ev )
{
  console.log("toolWire keyUp: " + keycode + " " + ch );
}


