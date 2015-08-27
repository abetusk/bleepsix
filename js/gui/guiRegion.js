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

function guiRegion( name )
{
  // All regions have this
  this.x = 0;
  this.y = 0;
  this.width = 40;
  this.height = 40;
  this.visible = true;    
  this.parent = null;
  this.guiChildren = [];  
  this.bgColor = "rgba(0,0,0,0.2)";
  this.name = name;

  this.enter_flag = false;
  this.tooltip_flag = false;
  this.tooltip_text = "";
  this.tooltip_delay = 1000;
  this.tooltip_tm = null;
  this.tooltip_display = false;
  this.tooltip_x = 50;
  this.tooltip_y = 0;
  this.tooltip_width = 100;
  this.tooltip_height = 15;
  this.tooltip_font_size = this.tooltip_height;
  this.bgColorTT = this.bgColorTT;


  this.transform       = [ [ 1, 0, 0], [0, 1, 0], [0, 0, 1] ];
  this.world_transform = [ [ 1, 0, 0], [0, 1, 0], [0, 0, 1] ];
  this.inv_transform   = [ [ 1, 0, 0], [0, 1, 0], [0, 0, 1] ];
  this.inv_world_transform = [ [ 1, 0, 0], [0, 1, 0], [0, 0, 1] ];

  //this.pickCallback = null;
}

guiRegion.prototype.init = function ( x, y, w, h )
{
  this.width = w;
  this.height = h;
  this.move(x, y);
}

guiRegion.prototype.handleEvent = function(ev)
{
  if (this.parent)
    if ("handleEvent" in this.parent)
      this.parent.handleEvent(ev);
}

/*
guiRegion.prototype.registerPickCallback = function(f)
{
  console.log("guiRegion, registering cb");
  console.log(f);

  this.pickCallback = f;
}
*/

guiRegion.prototype.setWorldMatrix = function ()
{
  // local transform
  this.transform     = [ [ 1, 0, this.x ],
                         [ 0, 1, this.y ],
                         [ 0, 0, 1 ] ];

  this.inv_transform = [ [ 1, 0, -this.x ],
                         [ 0, 1, -this.y ],
                         [ 0, 0, 1 ] ];

  if ( this.parent == null ) 
  {
    this.world_transform     = [ [ 1, 0, this.x ], 
                                 [ 0, 1, this.y ], 
                                 [ 0, 0, 1 ] ];
    this.inv_world_transform = [ [ 1, 0, -this.x ], 
                                 [ 0, 1, -this.y ], 
                                 [ 0, 0, 1 ] ];

    return this.world_transform;
  }   

  this.world_transform     = numeric.dot ( this.parent.setWorldMatrix (), this.transform );   
  this.inv_world_transform = numeric.dot ( this.inv_transform, this.parent.inv_world_transform);
  return this.world_transform;
}

guiRegion.prototype.move = function ( x, y )
{
  this.x = x;
  this.y = y;
  this.setWorldMatrix ();
   
  for (var ind in this.guiChildren ) { 
    cx = this.guiChildren[ind].x;
    cy = this.guiChildren[ind].y;
    this.guiChildren[ind].move ( cx, cy );
   }
}

guiRegion.prototype.draw = function()
{
  g_painter.drawRectangle( 0, 0, this.width, this.height,  
                           0, "rgb(0,0,0)", 
                           true, this.bgColor );

  if (this.tooltip_display) {
    g_painter.drawRectange( this.tooltip_x, this.tooltip_y,
                            this.tooltip_width, this.tooltip_height,
                            0, "rgba(128,128,128,0.5)",
                            true, this.bgColorTT);
    var tx = this.tooltip_x;
    var ty = this.tooltip_y;
    var sz = this.tooltip_height;
    var p = [ [ 0, 0], [ 0, sz/2 ], [ -sz/2, 0] ];
    g_painter.drawBarePolygon( p, tx, ty, this.bgColorTT );
  }

}

guiRegion.prototype.drawChildren = function()
{
  /* g_painter.drawRectangle( this.x, this.y, this.width, this.height, 
                           0, "rgb(0,0,0)", 
                           true, "rgba(0,0,0, 0.2)" );*/
  M = this.world_transform;
  g_painter.context.setTransform( M[0][0], M[1][0], M[0][1], M[1][1], M[0][2], M[1][2] );  
  this.draw ();

  for (var ind in this.guiChildren ) {
    if (this.guiChildren[ind].visible) {
        this.guiChildren[ind].drawChildren();
    }
  }


}

// I don't think this is the greatest, but x,y are in canvas
// co-ordinates.  Apply the inverse transformation to x,y
// to transform them to local co-ordinates.
//
guiRegion.prototype.hitTest = function(x, y)
{
  var u = numeric.dot( this.inv_world_transform, [x,y,1] );

  if ( (0 <= u[0]) && (u[0] <= this.width) &&
       (0 <= u[1]) && (u[1] <= this.height) )
  {

    for (var ind in this.guiChildren ) 
    {
      if (this.guiChildren[ind].visible) 
      {
        var r = this.guiChildren[ind].hitTest(x, y);
        if (r) return r;
      }
    }

    return this;
  }

  return null;
}

guiRegion.prototype.tooltip_func = function() {
  this.tooltip_tm = null;
  this.tooltip_display = true;
  g_painter.dirty_flag = true;
}


guiRegion.prototype.mouseEnter = function(x,y) {
  if (this.tooltip_flag) {
    this.tooltip_tm = setTimeout( (function(xx) { return function() { xx.tooltip_func(); } })(this), this.tooltip_delay );
  }

  this.enter_flag = true;
  r = this.hitTest(x, y);
  if (r)
    return r.mouseEnter();
}

guiRegion.prototype.mouseLeave = function(x,y) {
  this.enter_flag = false;

  if (this.tooltip_display) {
    g_painter.dirty_flag = true;
  }
  this.tooltip_display = false;
  if (this.tooltip_tm) {
    clearTimeout(this.tooltip_tm);
  }

  for (var ind in this.guiChildren) {
    if (this.guiChildren[ind].enter_flag) {
      this.guiChildren[ind].mouseLeave();
    }
  }

}

guiRegion.prototype.mouseMove = function( x, y )
{
  r = this.hitTest(x, y);

  for (var ind in this.guiChildren) {
    if (this.guiChildren[ind].hitTest(x,y)) {
      if (!this.guiChildren[ind].enter_flag) {
        this.guiChildren[ind].mouseEnter();
      }
    } else if (this.guiChildren[ind].enter_flag) {
      this.guiChildren[ind].mouseLeave();
    }
  }

  if (r == this) 
    return this;
  else if (r)
    return r.mouseMove(x, y);

  return r;
}

guiRegion.prototype.mouseDown = function( button, x, y )
{
  r = this.hitTest(x, y);
  if (r == this) 
    return this;
  else if (r)
  {
    return r.mouseDown(button, x, y);
  }

  return r;
}

guiRegion.prototype.doubleClick = function( ev, x, y )
{

  r = this.hitTest(x, y);
  if (r == this) 
    return this;
  else if (r)
    return r.doubleClick(ev);

  return r;
}

guiRegion.prototype.mouseWheel = function(delta)
{
  console.log("dummy mousewheel");
}

guiRegion.prototype.mouseWheelXY = function(delta, x, y)
{

  r = this.hitTest(x, y);
  if (r == this) 
    return this;
  else if (r)
  {
    if (typeof r.mouseWheelXY !== 'undefined')
      return r.mouseWheelXY(delta, x, y);
  }

  return r;
}

//-- keyboard callbacks

guiRegion.prototype.keyDown = function( keycode, ch, ev )
{
  console.log("guiRegion.keyDown", keycode, ch, ev);
}

guiRegion.prototype.keyUp = function( keycode, ch, ev )
{
  console.log("guiRegion.keyUp", keycode, ch, ev);
}

guiRegion.prototype.keyPress = function( keycode, ch, ev )
{
  console.log("guiRegion.keyPress", keycode, ch, ev);
}



guiRegion.prototype.addChild = function( child )
{
   
   this.guiChildren.push ( child );
   child.parent = this;

   child.setWorldMatrix();
}
