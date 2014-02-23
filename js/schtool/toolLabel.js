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


function toolLabel( x, y, type, initialPlaceFlag, initialName )
{
  console.log("toolLabel");

  x = ( typeof x !== 'undefined' ? x : 0 );
  y = ( typeof y !== 'undefined' ? y : 0 );
  type = ( typeof type !== 'undefined' ? type : 'label' );
  initialPlaceFlag = ( typeof initialPlaceFlag !== 'undefined' ? initialPlaceFlag : true );
  initialName = ( typeof initialName !== 'undefined' ? initialName : "label" );

  this.mouse_down = false;
  this.mouse_cur_x = x;
  this.mouse_cur_y = y;

  this.mouse_world_xy = g_painter.devToWorld(x, y);
  this.mouse_drag_flag = false;

  this.cursorSize = 6;
  this.cursorWidth = 1;

  this.edit_pos = 0;


  if (initialPlaceFlag == false)
    this.state = "positionChoose";  // "textedit" 
  else
    this.state = "textedit";

  this.mouse_world_xy = g_snapgrid.snapGrid( this.mouse_world_xy );

  var wxy =  [ this.mouse_world_xy.x , this.mouse_world_xy.y ] ;
  this.label = { 
    x : wxy[0], 
    y : wxy[1], 
    text : initialName,
    dimension: 40,
    type: type , 
    orientation : 0 
  };
  g_schematic_controller.schematic.updateLabelBoundingBox( this.label );

  var ele = document.getElementById("canvas");
  if (type == "label")
  {
    ele.style.cursor = "url('img/cursor_custom_noconn_s24.png') 4 3, cursor";
  }
  else if (type == "heirlabel")
  {
    ele.style.cursor = "url('img/cursor_custom_conn_s24.png') 4 3, cursor";
  }
  else if (type == "globlabel")
  {
    ele.style.cursor = "url('img/cursor_custom_conn_s24.png') 4 3, cursor";
  }

  g_painter.dirty_flag = true;

}

//-----------------------------

toolLabel.prototype._drawBBoxOverlay = function( bbox )
{
  var x = bbox[0][0];
  var y = bbox[0][0];
  var w = bbox[1][0] - bbox[0][0];
  var h = bbox[1][1] - bbox[0][1];

  g_painter.drawRectangle( bbox[0][0], bbox[0][1],
                           w, h,
                           2, "rgb(128,128,128)",
                           true, "rgba(0,0,0,0.25)");

}

toolLabel.prototype._drawCursor = function()
{
  var s = this.label.text;

  var tbbox = this.label.coarse_bounding_box;

  var text_width = parseFloat(this.label.dimension);
  var text_height = text_width / .6;

  var vec = [ 0, 0 ];
  if ( this.label.orientation == 0 )
    vec = [ 1, 0 ];
  else if (this.label.orientation == 1)
    vec = [ 0, 1];
  else if (this.label.orientation == 2)
    vec = [ -1, 0];
  else if (this.label.orientation == 3)
    vec = [ 0, -1];

  if ( Math.abs(vec[0]) > 0.5 )
  {
    var x = parseFloat(tbbox[0][0]) + text_width * this.edit_pos;
    var y = parseFloat(tbbox[0][1]);

    g_painter.line(x, y, x, y + text_height, "rgba(0,0,0, .3)", 10);
  }
  else if ( Math.abs(vec[1]) > 0.5 )
  {
    var x = parseFloat(tbbox[0][0]) ;
    var y = parseFloat(tbbox[0][1]) + text_width * this.edit_pos;

    g_painter.line(x, y, x + text_height, y, "rgba(0,0,0, .3)", 10);
  }



}



toolLabel.prototype.drawOverlay = function()
{


  var s = this.cursorSize / 2;
  g_painter.drawRectangle( this.mouse_world_xy["x"] - s,
                           this.mouse_world_xy["y"] - s,
                           this.cursorSize ,
                           this.cursorSize ,
                           this.cursorWidth ,
                           "rgb(128, 128, 128 )" );

  g_schematic_controller.schematic.drawSchematicLabel( this.label );
  this._drawBBoxOverlay( this.label.bounding_box );
  this._drawBBoxOverlay( this.label.coarse_bounding_box );

  this._drawCursor();

  g_schematic_controller.display_text = "x: " + this.mouse_world_xy.x + ", y: " + this.mouse_world_xy.y;



}

//-----------------------------

toolLabel.prototype.dist1 = function( xy0, xy1 )
{

  var dx = Math.abs( xy0["x"] - xy1["x"] );
  var dy = Math.abs( xy0["y"] - xy1["y"] );

  return Math.max(dx, dy);

}

//-----------------------------

//toolLabel.prototype._addLabelType = function( type, x, y ) 
toolLabel.prototype._addLabel = function()
{
  console.log("toolLabel._addLabelType");

  var op = { source: "sch", destination: "sch" };
  op.action = "add";
  op.type = this.label.type;
  op.data = { x : this.label.x, 
              y : this.label.y, 
              orientation: this.label.orientation,
              dimension : this.label.dimension ,
              text : this.label.text };
  g_schematic_controller.opCommand( op );

}

toolLabel.prototype._handoff = function()
{
  console.log("handing back to toolNav");
  g_schematic_controller.tool = new toolNav( this.mouse_cur_x, this.mouse_cur_y );
  g_schematic_controller.guiToolbox.defaultSelect();

  var ele = document.getElementById("canvas");
  ele.style.cursor = "auto";

  g_painter.dirty_flag = true;
}


toolLabel.prototype.mouseDown = function( button, x, y ) 
{
  this.mouse_down = true;

  if (button == 3)
    this.mouse_drag_flag = true;

  if (button == 1)
  {

    if (this.state == "positionChoose")
    {
      this.state = "textedit";
    }

    else if (this.state == "textedit")
    {
      this.mouse_world_xy = g_painter.devToWorld( this.mouse_cur_x, this.mouse_cur_y );
      this.mouse_world_xy = g_snapgrid.snapGrid( this.mouse_world_xy );


      //var id_ref = g_schematic_controller.schematic.pickElement(

      this._addLabel();
      this._handoff();

    }

  }

}

//-----------------------------


/*
toolLabel.prototype.doubleClick = function( button, x, y )
{

  if (this.placeOption == "once")
    this.placeOption = "persist";
  else 
    this.placeOption = "once";

  console.log("toolLabel.doubleClick: placeOption " + this.placeOption );
}
*/

//-----------------------------

toolLabel.prototype.mouseUp = function( button, x, y ) 
{
  this.mouse_down = false;

  if (button == 3)
    this.mouse_drag_flag = false;

}

//-----------------------------


toolLabel.prototype.mouseMove = function( x, y ) 
{

  if ( this.mouse_drag_flag ) 
     this.mouseDrag ( x - this.mouse_cur_x, y - this.mouse_cur_y );


  this.mouse_cur_x = x;
  this.mouse_cur_y = y;

  this.mouse_world_xy = g_painter.devToWorld( this.mouse_cur_x, this.mouse_cur_y );
  this.mouse_world_xy = g_snapgrid.snapGrid( this.mouse_world_xy );

  g_painter.dirty_flag = true;

  if ( ! this.mouse_drag_flag ) 
  {

    if (this.state == "positionChoose")
    {
      this.label.x = this.mouse_world_xy.x;
      this.label.y = this.mouse_world_xy.y;
      g_schematic_controller.schematic.updateLabelBoundingBox( this.label );
    }

  }

}

//-----------------------------

toolLabel.prototype.mouseDrag = function( dx, dy ) 
{
  g_painter.adjustPan ( dx, dy );
}

//-----------------------------

toolLabel.prototype.mouseWheel = function( delta )
{
  g_painter.adjustZoom ( this.mouse_cur_x, this.mouse_cur_y, delta );
}

//-----------------------------


toolLabel.prototype._addch = function( ch, indicator )
{
  indicator = ( typeof indicator !== 'undefined' ? indicator : "none" );

  var s = this.label.text;
  var p = this.edit_pos;

  if ((p<0) || (p>s.length))
    return;

  var lpos=p, rpos=p;
  var ds = 1;
  if (indicator == "bs")
  {
    lpos--;
    if (lpos<0)
      lpos=0;
    ds = -1;


  }
  if (indicator == "del")
  {
    rpos++;
    if (rpos>s.length)
      rpos=s.length;
    ds = 0;

  }


  var new_s = s.slice(0, lpos) + ch + s.slice(rpos, s.length);
  this.edit_pos += ds;
  if (this.edit_pos<0) this.edit_pos = 0;
  if (this.edit_pos>new_s.length) this.edit_pos=new_s.length;

  this.label.text = new_s;

  g_painter.dirty_flag = true;

}


toolLabel.prototype.keyPress = function( keycode, ch, ev )
{
  if (this.state == "textedit")
  {

    if ( keycode == 13)
    {
      this._addLabel();
      this._handoff();
      return;
    }

    this._addch( ch );
    g_schematic_controller.schematic.updateLabelBoundingBox( this.label );

  }

}

toolLabel.prototype.keyDown = function( keycode, ch, ev )
{
  var pass_key = true;
  var dirty_text = false;

  if ((ch == 'Q') || (keycode == 27))
  {
    this._handoff( );
    return;
    /*
    console.log("handing back to toolNav");
    g_schematic_controller.tool = new toolNav( this.mouse_cur_x, this.mouse_cur_y );
    g_schematic_controller.guiToolbox.defaultSelect();

    var ele = document.getElementById("canvas");
    ele.style.cursor = "auto";

    g_painter.dirty_flag = true;
    */
  }

  if (this.state == "positionChoose")
  {

    if (ch == "R")
    {
      this.label.orientation = ( this.label.orientation + 1 ) % 4;
      g_schematic_controller.schematic.updateLabelBoundingBox( this.label );
      g_painter.dirty_flag = true;
    }

    else if (ch == "E")
    {
      this.label.orientation = ( this.label.orientation + 3 ) % 4;
      g_schematic_controller.schematic.updateLabelBoundingBox( this.label );
      g_painter.dirty_flag = true;
    }

  }

  else if (this.state == "textedit")
  {
    if (keycode == 8)  // BS
    {
      this._addch( "", "bs" );
      pass_key = false;
      g_schematic_controller.schematic.updateLabelBoundingBox( this.label );
    }

    else if (keycode == 46) // DEL
    {
      this._addch( "", "del" );
      pass_key = false;
      g_schematic_controller.schematic.updateLabelBoundingBox( this.label );
    }

    else if (keycode == 32) // SPACE
    {
      //DEBUG
      console.log("SPACE");
      pass_key = false;
      g_schematic_controller.schematic.updateLabelBoundingBox( this.label );
    }

    else if (keycode == 13) // ESC
    {
      //DEBUG
      console.log("...");
    }

    else if ( (keycode == 37)  ||   // left arrow
              (keycode == 38) )     // up
    {
      this._clamp_add_edit_pos(-1)
      pass_key = false;
      g_painter.dirty_flag = true;
    }

    else if ( (keycode == 39)  ||   // right arrow
              (keycode == 40) )     // down arrow
    {
      this._clamp_add_edit_pos(+1)
      pass_key = false;
      g_painter.dirty_flag = true;
    }

    
  }

  return pass_key;

}

toolLabel.prototype._clamp_add_edit_pos = function( ds )
{
  this.edit_pos += ds;
  if (this.edit_pos < 0) 
    this.edit_pos = 0;
  else if (this.edit_pos > this.label.text.length)
    this.edit_pos = this.label.text.length ;
}

//-----------------------------

toolLabel.prototype.keyUp = function( keycode, ch, ev )
{
  console.log("toolLabel keyUp: " + keycode + " " + ch );
}


