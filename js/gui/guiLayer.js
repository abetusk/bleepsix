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

function guiLayer( name ) 
{
  this.constructor(name);

  this.bgColor = "rgba(200,200,200, 0.6)";
  //this.bgColor = "rgba(255,255,255, 0.3)";

  this.border = 10;

  this.height = 500;
  this.width = 150;

  this.myname = "foo";

  var guilist = new guiList("guiLayer:list" );
  guilist.init( this.border, this.border, this.width, this.height );
  //guilist.move( this.border,this.border);

  guilist.indexN = 50;
  guilist.updateList();


  var foo = this;
  guilist.registerPickCallback( function(data) { foo.listPick(data); }  );

  this.addChild( guilist );

  for (var i=0; i < guilist.indexN; i++)
  {
    this.guiChildren[0].addList( "i" + i, "name" + i );
    this.guiChildren[0].add( "i:" + i + "::", "foo" + i, "dat" + i, "i" + i );
  }


  this.height += 4*this.border ;
  this.width  += 2*this.border ;
  this.move(300, 25);

  g_painter.dirty_flag = true;

}
guiLayer.inherits ( guiRegion );

guiLayer.prototype.listPick = function(list_ele)
{
  if (list_ele.type == "element")
  {
    this.guiChildren[1].refresh();
  }
}

guiLayer.prototype.mouseDown = function(button, x, y )
{
  var u = numeric.dot( this.inv_world_transform, [x,y,1] );

  if (this.guiChildren[0].hitTest(x, y))
  {
    return this.guiChildren[0].mouseDown(button, x, y);
  }

  if ( (0 <= u[0]) && (u[0] <= this.width) &&
       (0 <= u[1]) && (u[1] <= this.height) )
  {
    console.log( "guiLayer: hit\n");
    return true;
  }

  return false;

}

guiLayer.prototype.mouseWheel = function(delta)
{
  console.log("guiLayer.mouseWheel delta " + delta);

  /*
  this.indexStart += delta;
  if (this.indexStart < 0)
    this.indexStart = 0;

  this.indexEnd = this.indexStart + this.indexN;
 */
}

/*
guiLayer.prototype.mouseWheelXY = function(delta, x, y)
{
  console.log("???");
}
*/

guiLayer.prototype.draw = function()
{

  g_painter.drawRectangle( 0, 0, this.width, this.height,  
                           0, "rgb(0,0,0)", 
                           true, this.bgColor );

                           /*
  for (var ind in this.library_list)
  {
    var sz = 15;
    g_painter.drawText( this.library_list[ind], 0, sz*ind, "rgb(128, 0, 0)", sz, 0, "L", "T" );
  }
 */

}


