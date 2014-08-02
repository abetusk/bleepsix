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


/************************
 *
 * guiList.list contains elements whose structure is
 *   type    - string "element" or "list"
 *   [list]  - if type is 'list', then contains an array
 *   name    - display name
 *   data    - user defined data
 *
 ************************/

function guiList( gui_name )
{
  this.constructor ( gui_name )   
  this.bgColor = "rgba(100, 10, 10, 0.5)";
  this.textSize = 10;
  this.textColor = "rgba(0,0,0,0.4)";

  this.boxSize = this.textSize/2;
  this.boxTextSpacing = 4;

  this.pickedData = null;

  this.pickedName = null;

  this.ready = false;

  this.list = [];

  this.listHash = {};

  this.indexStart = 1;
  this.indexN = 13;
  this.indexEnd = this.indexStart + this.indexN;

  this.pickCallback = null;

  this.once = false;

  var scrollbar = new guiScrollbar( gui_name + ":scrollbar" );
  scrollbar.width = 10;
  this.addChild(scrollbar);

  this.scrollbar = scrollbar;

}
guiList.inherits ( guiRegion );

guiList.prototype.init = function( x, y, w, h )
{

  this.width = w;
  this.height = h;
  this.move(x, y);
  this.scrollbar.init( w - this.scrollbar.width , 0, this.scrollbar.width, h );

  g_painter.dirty_flag = true;
}


//guiList.prototype.init = function( x, y, w, h ) { this.parent.init(x, y, w, h); }

//-----------------------------

guiList.prototype.handleEvent = function( ev )
{
  if (ev)
  {
    var p = ev.position;

    //console.log("guiList.handleEvent: got position " + p );

    var n = this._countDisplayableElements( 0, this ) - this.indexN;
    if (n<1)
      this.indexStart = 0;
    else
      this.indexStart = Math.floor( p*n );

    this.updateList();

  }
}

guiList.prototype.registerPickCallback = function( f )
{
  this.pickCallback = f;
}

guiList.prototype.add = function( id, name, data, parent )
{
  var l = this.list;
  if (typeof parent !== 'undefined')
  {
    if (parent in this.listHash)
      l = this.listHash[parent];
    else
      return null;
  }

  var ele = { id: id, name : name, data : data, type: "element" };
  l.push(ele);

  return ele;
}

//-----------------------------

guiList.prototype.clearList = function() 
{
  this.list = [];
}

guiList.prototype.addList = function( id, name, parent )
{
  var l = this.list;
  if (typeof parent !== 'undefined')
  {
    if (parent in this.listHash)
      l = this.listHash[parent];
    else
      return null;
  }

  var ele = { id: id , name : name, type : "list", expanded : false, list : []  };
  l.push(ele);

  this.listHash[id] = ele.list;

  return ele;
}

//-----------------------------

guiList.prototype._pickElement_r = function( ele, state ) 
{


  var sz = parseInt(this.textSize);
  var r = null;

  for (var ind in ele.list)
  {
    var y0 = (state.cur_index - this.indexStart) * sz; 
    var y1 = (state.cur_index - this.indexStart + 1) * sz;

    if ( ( state.local_y <= y1 ) && ( y0 <= state.local_y ) )
    {
      /*
      console.log("hit?  " + ele.list[ind].name + 
                  " ind: "  + ind + 
                  " y0 " + y0 + " y1 " + y1 + 
                  ", y" + state.local_y + " , " + ele.list[ind].type );
                 */

      return ele.list[ind];
    }

    if ( (ele.list[ind].type == "list") &&
          ele.list[ind].expanded )
    {
      state.cur_index++;
      r = this._pickElement_r( ele.list[ind], state);

    }
    else
      state.cur_index++;

    if (r)
      return r;

  }

  return null;

}

//-----------------------------

guiList.prototype.pickElement = function(x, y)
{
  var u = numeric.dot( this.inv_world_transform, [x,y,1] );
  return this._pickElement_r( this, { cur_index: 0, local_x: u[0], local_y : u[1] } );
}

//-----------------------------

guiList.prototype.hitTest = function(x, y)
{
  var u = numeric.dot( this.inv_world_transform, [x,y,1] );
  var r = null;

  var sx = this.guiChildren[0].x;
  var sy = this.guiChildren[0].y;
  var ex = sx + this.guiChildren[0].width;
  var ey = sy + this.guiChildren[0].height;

  if ( (sx <= u[0]) && (u[0] <= ex) &&
       (sy <= u[1]) && (u[1] <= ey) )
  {
    return this.guiChildren[0];
  }


  if ( (0 <= u[0]) && (u[0] <= this.width) &&
       (0 <= u[1]) && (u[1] <= this.height) )
    r = this;

  return r;
}

//-----------------------------

guiList.prototype.mouseDown = function( button, x, y)
{

  var r = this.hitTest(x,y);

  if (r == this.guiChildren[0])
  {
    //g_schematic_controller.tool = new toolScrollbar(x, y, this.guiChildren[0], g_schematic_controller.tool);
    g_controller.tool = new toolScrollbar(x, y, this.guiChildren[0], g_controller.tool);
    return true;
  }

  //if (this.hitTest(x, y))
  else if (r)
  {

    var ele = this.pickElement(x, y);

    if (!ele)
      return true;

    if (ele.type == "list")
    {
      ele.expanded = !ele.expanded;
      this.pickedData = null;

      if (this.pickCallback) 
        this.pickCallback(ele);

      this.updateList();
      this.updateScrollbar();

      g_painter.dirty_flag = true;
    }
    else if (ele.type == "element")
    {
      this.pickedData = ele.data;

      this.pickedName = ele.data;

      if (this.pickCallback) 
        this.pickCallback(ele);

      g_painter.dirty_flag = true;
    }

    return true;
  }

  return false;
}

//-----------------------------

guiList.prototype.mouseWheel = function(delta)
{
  //console.log("guiList.mouseWheel delta " + delta);
}


//-----------------------------

guiList.prototype.updateList = function()
{
  if (this.indexStart < 0) 
    this.indexStart = 0;

  this.indexEnd = this.indexStart + this.indexN;

  var n = this._countDisplayableElements( 0, this );

  if ( this.indexEnd >= n )
  {
    this.indexStart = n - this.indexN;
    if (this.indexStart < 0)
      this.indexStart = 0;

    this.indexEnd = this.indexStart + this.indexN;
  }

}

guiList.prototype.updateScrollbar = function()
{
  var n = this._countDisplayableElements( 0, this );
  var m = n - this.indexN;
  if ( m > 0 )
    this.scrollbar.updatePosition( this.indexStart / m );
  else
    this.scrollbar.updatePosition( 0.0 );
}


guiList.prototype.mouseWheelXY = function(delta, x, y)
{

  if (this.hitTest(x,y))
  {
    this.indexStart += -delta;

    this.updateList();
    this.updateScrollbar();

    g_painter.dirty_flag = true;
  }

}

//-----------------------------


//else draw the + or -, depending on whether it's expanded or not
guiList.prototype.drawBox = function( indent, y, ele )
{
  var box_text_spacing = this.boxTextSpacing;
  var box_size = this.boxSize;
  var ydel = (this.textSize - box_size)/2

  // draw box
  g_painter.drawRectangle( indent , y + ydel, box_size, box_size, 1, this.textColor );

  // draw dot if it's a simple element
  if (ele.type == "element")
  {
    g_painter.drawRectangle( indent + box_size/2 - 1, 
                             y + ydel + box_size/2 - 1,
                             2, 2, 
                             0, this.textColor, 
                             true, this.textColor );
  }
  else if (ele.type == "list" )
  {
    g_painter.line(indent,            y + ydel + box_size/2,
                   indent + box_size, y + ydel + box_size/2,
                   this.textColor, 1 );

    if (!ele.expanded)
    {
      g_painter.line(indent + box_size/2, y + ydel ,
                     indent + box_size/2, y + ydel + box_size,
                     this.textColor, 1 );
    }

  }

}

//-----------------------------

guiList.prototype._countDisplayableElements = function( cur_index, ele )
{

  for (var ind in ele.list)
  {
    if ( (ele.list[ind].type == "list") &&
         ele.list[ind].expanded )
      cur_index = this._countDisplayableElements( cur_index+1, ele.list[ind] );
    else
      cur_index++;
  }
  return cur_index;
}

//-----------------------------


// recursively go through list and draw appropriately
guiList.prototype._draw_r = function( indent, cur_index, ele )
{
  var list = ele.list;

  if (cur_index >= this.indexEnd) 
    return cur_index;

  for (var ind in list)
  {
    if (cur_index >= this.indexEnd) 
      return cur_index;

    if (cur_index >= this.indexStart)
    {
      var d = cur_index - this.indexStart;

      // highlight picked component
      //
      if (this.pickedName)
      {
        if (this.pickedName == list[ind].data)
        {

          g_painter.drawRectangle( indent, 
                                   this.textSize*d,
                                   this.width - indent - this.x - 5,
                                   this.textSize,
                                   0, "rgb(0,0,0)",
                                   1, "rgba(100,100,100,0.1)" );

        }
      }

      this.drawBox( indent, d*this.textSize, list[ind] );

      g_painter.drawText( list[ind].name,
                         indent + this.boxSize + this.boxTextSpacing, 
                         //this.textSize*cur_index, 
                         this.textSize*d, 
                         this.textColor, 
                         this.textSize, 
                         0, "L", "T" );

    }

    if ( (list[ind].type == "list") && list[ind].expanded )
      cur_index = this._draw_r( indent + 10, cur_index+1, list[ind] );
    else
      cur_index++;

  }

  return cur_index;

}

//-----------------------------

guiList.prototype.draw = function()
{
  this._draw_r( 10, 0, this );
}

 
