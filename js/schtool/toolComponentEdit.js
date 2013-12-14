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

function toolComponentEdit( mouse_x, mouse_y, id_ref ) 
{

  mouse_x = ( typeof mouse_x !== 'undefined' ? mouse_x : 0 );
  mouse_y = ( typeof mouse_y !== 'undefined' ? mouse_y : 0 );

  //console.log("toolComponentEdit starting");

  this.mouse_cur_x = mouse_x;
  this.mouse_cur_y = mouse_y;
  this.id_ref = id_ref;

  this.selectedElement = null;

  this.orig_element_state = [];  // so we can go back to our original state when we 'esc'
  this.base_element_state = [];  // so we can use absolute world delta position, instead of incremental ones

  //this.mouse_drag_button = false;
  this.mouse_pan_zoom_drag_button = false;
  

  this.edit_state = "none";  // "textedit", "textmove", "textintermediate"
  this.edit_pos = 0;
  this.edit_text_orig = null;


  this.drawHighlightRect = true;

  this.orig_world_xy = g_painter.devToWorld( mouse_x, mouse_y );
  this.prev_world_xy = g_painter.devToWorld( mouse_x, mouse_y );
  this.cur_world_xy  = g_painter.devToWorld( mouse_x, mouse_y );

  this.snap_world_xy = g_snapgrid.snapGrid (this.prev_world_xy);

  this.picked_id_ref = 
    g_controller.schematic.pickElement( id_ref.ref, 
                                        this.cur_world_xy.x, 
                                        this.cur_world_xy.y );

  if (! this.picked_id_ref )
  {
    console.log("ERROR: in toolComponentEdit constructor.  pickElement returned null");
    g_controller.tool = new toolNav(mouse_x, mouse_y);
    return;
  }

  //console.log("toolComponentEdit constructor:");
  //console.log(this.picked_id_ref);
  


  this.cursorSize = 6;
  this.cursorWidth = 1;
}

toolComponentEdit.prototype.mouseDrag  = function( dx, dy ) { g_painter.adjustPan( dx, dy ); }
toolComponentEdit.prototype.mouseWheel = function( delta )  { g_painter.adjustZoom ( this.mouse_cur_x, this.mouse_cur_y, delta ); }

toolComponentEdit.prototype._handoff = function(x, y)  
{ 
  g_controller.tool = new toolNav();
  g_controller.tool.mouseMove( x, y );  // easy way to setup?
  g_painter.dirty_flag = true;
}

toolComponentEdit.prototype._drawBBoxOverlay = function( bbox )
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

toolComponentEdit.prototype._drawPaw = function()
{
  var ref = this.picked_id_ref.ref;
  var bbox = ref.bounding_box;

  var paw_offset = 100;
  var cx = bbox[1][0] + paw_offset;
  var cy = bbox[1][1] - paw_offset;
  var r = 50;
  var rr = 22;
  var fudge = 0.4;
  var ang = [-(1.0 + 0)*Math.PI/6.0, 
             -(2.0 + fudge)*Math.PI/6.0, 
             -(4.0 - fudge)*Math.PI/6.0, 
             -(5.0 - 0)*Math.PI/6.0 ];
  var d = r + rr + 10;

  g_painter.circle( cx, cy, r, 0, "rgb(0,0,0)", true, "rgba(0,0,0,0.4)");
  for (var ind in ang)
  {
    lcx = d*Math.cos( ang[ind] ) + cx;
    lcy = d*Math.sin( ang[ind] ) + cy;
    g_painter.circle( lcx, lcy, rr,  0, "rgb(0,0,0)", true, "rgba(0,0,0,0.4)");
  }

}

toolComponentEdit.prototype._drawCursor = function()
{

  var id_ref = this.picked_id_ref;
  var ref = id_ref.ref;
  var ind = id_ref.index;
  var text_ref = ref.text[ind];
  var s = text_ref.text;

  var tbbox = text_ref.bounding_box;

  var text_width = parseFloat(text_ref.size);
  var text_height = text_width / .6;

  var vec = [ 0, 0 ];
  if ( text_ref.orientation == "H" )
    vec = [ 1, 0 ];
  else if (text_ref.orientation == "V")
    vec = [ 0, 1];

  vec = numeric.dot( ref.transform, vec );

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


toolComponentEdit.prototype.drawOverlay = function()
{
  g_snapgrid.drawCursor( this.snap_world_xy );

  var ref = this.picked_id_ref.ref;

  if (ref.text[0].visible)
    this._drawBBoxOverlay( ref.text[0].bounding_box );

  if (ref.text[1].visible)
    this._drawBBoxOverlay( ref.text[1].bounding_box );

  this._drawBBoxOverlay( ref.bounding_box );

  if (this.edit_state == "textedit")
    this._drawCursor();

  this._drawPaw( );

}

toolComponentEdit.prototype.mouseDown = function( button, x, y )
{

  console.log("toolComponentEdit.mouseDown");

  if (button == 1)
  {
    //this.mouse_drag_button = true;
    this.edit_state = "textintermediate";


    var wc = g_painter.devToWorld(x, y);
    var id_ref = g_controller.schematic.pick( wc.x, wc.y );

    // if we clicked anywhere else other than this component, 
    // hand it back to toolNav
    if (!id_ref || id_ref.ref.id != this.picked_id_ref.ref.id)
      return this._handoff(x, y);

    // if we haven't selected a text field, hand it back to toolNav
    //
    if ( (!("type" in id_ref)) || (id_ref.type != "text") )
      return this._handoff(x,y);

    this.picked_id_ref = id_ref;

  }
  else if (button == 3)
  {
    this.mouse_pan_zoom_drag_button = true;
  }


}

toolComponentEdit.prototype.doubleClick = function( button, x, y )
{
  console.log("toolComponentEdit.doubleClick");
}

toolComponentEdit.prototype._get_edit_pos= function( id_ref, wc )
{

  var ref = id_ref.ref;
  var ind = id_ref.index;
  var text_ref = ref.text[ind];

  var text_bbox = ref.text[ind].bounding_box;

  var vec = [0,0];
  if ( text_ref.orientation == "H")
    vec = [ 1, 0 ];
  else if ( text_ref.orientation = "V" )
    vec = [ 0, 1];
  else
    return -1;

  vec = numeric.dot( ref.transform, vec );

  var ds = 0.0;
  if ( Math.abs(vec[0]) > 0.5 )
    ds = wc.x - text_bbox[0][0];
  else if ( Math.abs(vec[1]) > 0.5 )
    ds = wc.y - text_bbox[0][1];

  var sz = ref.text[ind].size;
  var f = (ds/sz) ;
  var ep = Math.floor( f + 0.4 ); 

  return ep;
}


toolComponentEdit.prototype.mouseUp = function( button, x, y )
{
  if (button == 3)
  {
    this.mouse_pan_zoom_drag_button = false;
    return;
  }


  if (this.edit_state == "none")
  {
    var wc = g_painter.devToWorld(x,y);
    var id_ref = g_controller.schematic.pick( wc.x, wc.y );

    if ( (!id_ref) ||
         (id_ref.ref.id != this.picked_id_ref.ref.id) )
      return this._handoff(x,y);

    if ( (this.edit_state == "none") &&
         ( (!("type" in id_ref)) || (id_ref.type != "text") ) )
      return this._handoff(x,y);

    console.log("WARNING: reached toolComponentEdit.mouseUp state while in none (shouldn't have happened)");
  }

  //if (this.mouse_drag_button)
  else if (this.edit_state == "textmove")
  {
    if (button == 1)
      //this.mouse_drag_button = false;
      this.edit_state = "none";
  }
  else if (this.edit_state == "textintermediate")
  {

    var wc = g_painter.devToWorld(x,y);
    var id_ref = g_controller.schematic.pick( wc.x, wc.y );

    if (id_ref &&
        id_ref.ref.id == this.picked_id_ref.ref.id)
    {
      if (("type" in id_ref) && 
          (id_ref.type == "text"))
      {

        var ref = id_ref.ref;
        var ind = id_ref.index;
        var ep = this._get_edit_pos( id_ref, wc );

        /*
        var text_bbox = ref.text[ind].bounding_box;

        var ds = wc.x - text_bbox[0][0];
        var sz = ref.text[ind].size;
        var f = (ds/sz) ;
        var ep = Math.floor( f + 0.4 ); 

        */
        var l = ref.text[ind].length;


        if ((ep < 0) || (ep > l))
        {
          //console.log("nope");
        }
        else
        {
          this.edit_state = "textedit";
          this.edit_pos = ep;
          this.edit_text_orig = ref.text[ind].text;

          g_painter.dirty_flag = true;  // draw cursor
        }

      }
    }
    else { this._handoff( x, y); }

  }

}

toolComponentEdit.prototype.mouseMove = function( x, y )
{
  this.snap_world_xy = g_snapgrid.snapGrid (this.prev_world_xy);
  g_painter.dirty_flag = true;

  if (this.mouse_pan_zoom_drag_button == true)
    this.mouseDrag ( x - this.mouse_cur_x, y - this.mouse_cur_y );

  this.mouse_cur_x = x;
  this.mouse_cur_y = y;

  if (this.edit_state == "textintermediate")
  {
    this.edit_state = "textmove";
  }

  if (this.mouse_pan_zoom_drag_button == false)
  {

    var world_xy = g_painter.devToWorld( this.mouse_cur_x, this.mouse_cur_y );

    this.prev_world_xy["x"] = world_xy["x"];
    this.prev_world_xy["y"] = world_xy["y"];

  }

  //if (this.mouse_drag_button)
  if (this.edit_state == "textmove")
  {
    var ref = this.picked_id_ref.ref;
    if ( !("type" in this.picked_id_ref)) return;
    var type = this.picked_id_ref.type;
    if (type != "text") return;
    var ind = this.picked_id_ref.index;

    var snapxy = g_snapgrid.snapGrid( this.prev_world_xy );

    g_controller.schematic.moveComponentTextField( ref, ind, snapxy.x, snapxy.y );

    //ref.text[ind].x = snapxy.x;
    //ref.text[ind].y = snapxy.y;
    g_painter.dirty_flag = true;

  }

}

toolComponentEdit.prototype.keyDown = function( keycode, ch, ev )
{
  var pass_key = true;

  if (keycode == 27)
  {

    // pass control back to toolNav
    this._handoff( this.mouse_cur_x, this.mouse_cur_y );
    return;

    g_controller.tool = new toolNav( this.mouse_cur_x, this.mouse_cur_y );
    g_controller.tool.mouseMove( this.mouse_cur_x, this.mouse_cur_y );  // easy way to setup?
    g_painter.dirty_flag = true;


  }

  if (this.edit_state == "textedit")
  {

    console.log("textedit: keycode: " + keycode);

    if (keycode == 8) // backspace
    {
      console.log("bs");

      console.log("??");

      this._addch( "", "bs" );

    }
    else if (keycode == 46)   // DEL key
    {
      console.log("DEL");

      this._addch( "", "del" );

    }
    else if (keycode == 16)
    {
      console.log("shift");
    }
    else if (keycode == 20)
    {
      console.log("caps");
    }
    else if (keycode == 32)
    {
      console.log("space");
      pass_key = false;
    }
    else if (keycode == 13)
    {
      this.edit_state = "none";
      console.log(" locking in change...");
    }
    else if ((keycode == 40) || (keycode == 39)) // 38 - up, 39 - right
    {
      this._clamp_add_edit_pos(+1);
      pass_key = false;
      g_painter.dirty_flag = true;
    }
    else if ((keycode == 37) || (keycode == 38)) // 37 - left, 40 - down
    {
      this._clamp_add_edit_pos(-1);
      pass_key = false;
      g_painter.dirty_flag = true;
    }

  }

  else if (ch == 'R')
  {
    var wc = g_painter.devToWorld(this.mouse_cur_x,this.mouse_cur_y);
    var id_ref = g_controller.schematic.pick( wc.x, wc.y );

    if (  id_ref &&
         (id_ref.ref.id == this.picked_id_ref.ref.id) &&
         ("type" in id_ref) &&
         (id_ref.type == "text") )
    {
      var ind = id_ref.index;
      var ref = id_ref.ref;

      if (ref.text[ind].orientation == "V")
        ref.text[ind].orientation = "H";
      else if (ref.text[ind].orientation == "H")
        ref.text[ind].orientation = "V";

      g_painter.dirty_flag = true;

    }
  
  }

  return pass_key;

}

toolComponentEdit.prototype._clamp_add_edit_pos = function( ds )
{
  var id_ref = this.picked_id_ref;
  var ref = id_ref.ref;
  var ind = id_ref.index;
  var s = ref.text[ind].text;

  this.edit_pos += ds;
  if (this.edit_pos < 0)        this.edit_pos  = 0;
  if (this.edit_pos > s.length) this.edit_pos = s.length;

  console.log("edit pos now: " + this.edit_pos);
}


toolComponentEdit.prototype._addch = function( ch, indicator )
{
  indicator = ( typeof indicator !== 'undefined' ? indicator : "none" );

  var id_ref = this.picked_id_ref;
  var ref = id_ref.ref;
  var ind = id_ref.index;
  
  var s = ref.text[ind].text;
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

  console.log("p: " + p + ", lpos: " + lpos + ", rpos: " + rpos);


  var new_s = s.slice(0, lpos) + ch + s.slice(rpos, s.length);
  this.edit_pos += ds;
  if (this.edit_pos<0) this.edit_pos = 0;
  if (this.edit_pos>new_s.length) this.edit_pos=new_s.length;

  ref.text[ind].text = new_s;

  g_painter.dirty_flag = true;

}


toolComponentEdit.prototype.keyPress = function( keycode, ch, ev  )
{
  //console.log("toolComponentEdit.keyPress: " + ch);

  if (keycode == 13)
  {
    console.log("skipping return");
    return;
  }

  if (this.edit_state == "textedit")
  {
    console.log("editing text: " + ch);

    this._addch( ch );

  }

}

toolComponentEdit.prototype.keyUp = function( keycode, ch, ev  )
{
}

