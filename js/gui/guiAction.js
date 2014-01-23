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

function guiAction( name ) 
{
  this.constructor ( name )   

  //this.bgColor = "rgba( 255, 0, 0, 0.2 )";
  this.bgColor = "rgba( 0, 0, 0, 0.2 )";

  this.width = 100;
  this.height = 20;
  //this.width = 120;
  //this.height = 32;

  this.move(10, 100);



  // grouped wire functions (wire, bus, etc)
  //
  var w = new guiDropIcon( this.name + ":dropaction", this.width, this.height, true );
  w.addIcon( this.name + ":foo", this._make_text_draw_function("foo") );
  w.addIcon( this.name + ":bar" , this._make_text_draw_function("bar") );
  w.move(0, 0);

  this.dropAction = w;
  this.addChild( w );


  this.move(300,5);

}
guiAction.inherits ( guiRegion );

guiAction.prototype._make_text_draw_function = function( txt )
{
  var t = this;
  return function()
  {
    g_painter.drawText(txt.toString(), 0, t.height/2, "rgba(0,0,0,0.5)", 12, 0, "L", "C");
  }

}


// children will be in weird places, so don't confine it to the box of the
// guiAction.
//
guiAction.prototype.hitTest = function(x, y)
{

  var u = numeric.dot( this.inv_world_transform, [x,y,1] );

  for (var ind in this.guiChildren )
  {
    if (this.guiChildren[ind].visible)
    {
      var r = this.guiChildren[ind].hitTest(x, y);
      if (r) return r;
    }
  }

  return null;


  if ( (0 <= u[0]) && (u[0] <= this.width) &&
       (0 <= u[1]) && (u[1] <= this.height) )
  {
    //console.log( "guiRegion: " + this.name + " hit\n");
    return this;
  }
  
  return null;
}

guiAction.prototype._handleUnitEvent = function(ev)
{

  if (ev.owner == this.name + ":imperial")
  {
    console.log("  imperial");
  }
  else if (ev.owner == this.name + ":metric")
  {
    console.log("  metric");
  }

}

guiAction.prototype._handleSpacingEvent = function(ev)
{

  if (ev.owner == this.name + ":50") 
  {
    console.log("50");
  }
  else if (ev.owner == this.name + ":25") 
  {
    console.log("25");
  }

  else if (ev.owner == this.name + ":20") 
  {
    console.log("20");
  }

  else if (ev.owner == this.name + ":10") 
  {
    console.log("10");
  }

  else if (ev.owner == this.name + ":5") 
  {
    console.log("5");
  }

  else if (ev.owner == this.name + ":2") 
  {
    console.log("2");
  }

  else if (ev.owner == this.name + ":1") 
  {
    console.log("1");
  }

}


guiAction.prototype._eventMouseDown = function( ev )
{
  if (ev.owner == this.name + ":nav")
  {
    console.log("  handing over to toolNav (1)");
    g_schematic_controller.tool = new toolNav();
    return;
  }

  else if ( ev.owner.match(/:(imperial|metric)$/) )
  {
    this._handleUnitEvent(ev);
  }
  else if ( ev.owner.match(/:(\d+)$/) )
  {
    this._handleSpacingEvent(ev);
  }

  else if (ev.owner == this.name + ":dropunit:tab")
  {
    console.log("  unit tab!");

    // hide (or show) the tabs from other tools that stick out below it
    //
    //this.dropConn.iconTab.visible = !this.dropConn.iconTab.visible;
    //if ( this.dropConn.showDropdown ) this.dropConn.toggleList();

  }

  else if (ev.owner == this.name + ":dropgrid:tab")
  {
    console.log("  grid tab");

    //if ( this.dropWire.showDropdown ) this.dropWire.toggleList();
    //g_painter.dirty_flag = true;
  }

}

guiAction.prototype.handleEvent = function(ev)
{
  if ( ev.type == "mouseDown" )
    return this._eventMouseDown(ev);
  else if ( ev.type == "doubleClick" )
    return this._eventDoubleClick(ev);


}

guiAction.prototype.draw = function()
{

}


