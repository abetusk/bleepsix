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

//var __icon_width = 20;
var __icon_width = 24;

function guiToolbox( name ) 
{
  this.constructor ( name )   

  //this.bgColor = "rgba( 255, 0, 0, 0.2 )";
  this.bgColor = "rgba( 0, 0, 255, 0.2 )";

  //this.width = 25;
  //this.iconWidth = 20;
  this.iconWidth = __icon_width;
  this.width = this.iconWdith + 5;

  this.height = 4* this.iconWidth;
  this.iconHeight = this.iconWidth;

  this.tabHeight = this.iconWidth;
  this.tabWidth = this.width - this.iconWidth;

  //this.move(10, 100);
  //this.move(100, 200);

  var cur_y = 0;
  var sz = this.iconWidth;


  // iconNav is just a simple guiIcon
  //
  this.iconNav = new guiIcon( name + ":nav" );
  this.iconNav.init( 0, cur_y, sz, sz);
  //this.iconNav.draw = _draw_nav_icon;
  this.iconNav.drawShape = _draw_nav_icon;
  this.iconNav.bgColor = "rgba(0,0,0, 0.0)";
  this.addChild( this.iconNav );

  cur_y += this.iconNav.height;


  // grouped wire functions (wire, bus, etc)
  //
  //var w = new guiDropIcon( this.name + ":dropwire", 20, 20 );
  var w = new guiDropIcon( this.name + ":dropwire", this.iconWidth , this.iconWidth );
  w.addIcon( this.name + ":wire", _draw_wire_icon );
  w.addIcon( this.name + ":bus" , _draw_bus_icon );
  w.move(0, cur_y);

  this.dropWire = w;
  this.addChild( w );

  cur_y += w.height;



  //var u = new guiDropIcon( this.name + ":dropconn", 20, 20 );
  var u = new guiDropIcon( this.name + ":dropconn", this.iconWidth , this.iconWidth );
  u.addIcon( this.name + ":noconn", _draw_noconn_icon );
  u.addIcon( this.name + ":conn", _draw_conn_icon );
  u.move(0, cur_y);

  this.dropConn = u;
  this.addChild( u );


  this.dropConn.selected = false;
  this.dropWire.selected = false;
  this.iconNav.selected = true;

  //this.move(20,30);
  //this.move(40,100);

}

function _draw_nav_icon()
{
  var sz = 10;
  var sx = __icon_width/2-sz/2, sy = __icon_width/2-sz/2;

  var r = parseInt(8 * __icon_width /10);
  g_imgcache.draw( "cursor", 3, 1, r, r );

  //g_painter.drawRectangle( sx, sy, sz, sz, 0, "rgb(0,0,0)", true, "rgb(128,128,128)");
  g_painter.drawRectangle( 0, 0, __icon_width, __icon_width, 0, "rgb(0,0,0)", true, "rgba(0,0,0,0.2)");


}

function _draw_grid_tab_icon()
{
  var x = 0;
  var y = __icon_width/3;
  var w = __icon_width/3;
  var h = __icon_width - y;

  var color = "rgba(0, 0, 255, 0.2)";

  var path = [ [0, 0], [x+w, y], [x+w, y+h] , [0, y+h] ];
  g_painter.drawBarePolygon( path, 0, 0, color );
}


function _draw_gridinch_icon()
{
  g_painter.drawText("in", 3, 3, "rgba(0,0,0,0.5)", 12, 0, "L", "T");
  //g_painter.drawRectangle( 0, 0, 30, 30, 0, "rgb(0,0,0)", true, "rgba(0,0,0,0.1)");
  //g_painter.drawRectangle( 1, 1, 29, 29, 1, "rgba(0,0,0,0.5)");
  g_painter.drawRectangle( 0, 0, __icon_width, __icon_width, 0, "rgb(0,0,0)", true, "rgba(0,0,0,0.2)");
}

function _draw_gridmm_icon()
{
  g_painter.drawText("mm", 6, 8, "rgba(0,0,0,0.5)", 15, 0, "L", "T");
}


function _draw_wire_icon()
{
  var sx = __icon_width/6, sy = __icon_width/3, dx = __icon_width/3, dy = __icon_width/3;
  var color = "rgba(0,138,0,0.6)", width = 2;
  var bgColor = "rgb(255,255,255,0.1)";

  g_painter.line( sx,    sy,    sx+dx,    sy,    color, width);
  g_painter.line( sx+dx, sy,    sx+dx,    sy+dy, color, width);
  g_painter.line( sx+dx, sy+dy, sx+2*dx,  sy+dy, color, width);
}

function _draw_bus_icon()
{
  var sx = __icon_width/3, sy = __icon_width/3, dx = __icon_width/3, dy = __icon_width/3;
  var dx0 = __icon_width/6;
  var color = "rgb(0,0,138)";
  var width = 2;
  var bgColor = "rgb(255,255,255,0.1)";

  g_painter.line( sx,    sy,    sx+dx0,    sy,    color, width);
  g_painter.line( sx+dx0, sy,    sx+dx0,    sy+dy, color, width);
  g_painter.line( sx+dx0, sy+dy, sx+dx + dx0,  sy+dy, color, width);
}

function _draw_noconn_icon()
{
  //var mx = 15, my = 15, dx = 5, dy = 5;
  var mx = __icon_width/2, my = __icon_width/2, dx = __icon_width/6, dy = __icon_width/6;
  var color = "rgba(0,0,138,0.6)";
  var width = 2;

  g_painter.line( mx-dx, my-dy, mx+dx, my+dy, color, width );
  g_painter.line( mx-dx, my+dy, mx+dx, my-dy, color, width );

}

function _draw_conn_icon()
{
  //var mx = 10, my = 10, r = 3;
  var mx = 12, my = 12, r = 3;
  var color = "rgba(0,138,0, 0.5)";
  var width = 2;

  g_painter.circle( mx, my, r, width, color, true, color);

}

function _draw_conn_tab_icon()
{
  var x = 0;
  var y = __icon_width/3;
  var w = __icon_width/3;
  var h = __icon_width - y;

  var color = "rgba(0, 0, 255, 0.2)";

  var path = [ [0, 0], [x+w, y], [x+w, y+h] , [0, y+h] ];
  g_painter.drawBarePolygon( path, 0, 0, color );
}

guiToolbox.inherits ( guiRegion );

guiToolbox.prototype.defaultSelect = function()
{
  this.dropConn.selected = false;
  this.dropWire.selected = false;
  this.iconNav.selected = true;

  var ele = document.getElementById("canvas");
  ele.style.cursor = "auto";
}

/*
guiToolbox.prototype.wireSelect = function()
{
  this.dropConn.selected = false;
  this.dropWire.selected = false;
  this.iconNav.selected = true;

  var ele = document.getElementById("canvas");
  ele.style.cursor = "auto";
}

guiToolbox.prototype.busSelect = function()
{
  this.dropConn.selected = false;
  this.dropWire.selected = false;
  this.iconNav.selected = true;

  var ele = document.getElementById("canvas");
  ele.style.cursor = "auto";
}

guiToolbox.prototype.connSelect = function()
{
  this.dropConn.selected = false;
  this.dropWire.selected = false;
  this.iconNav.selected = true;

  var ele = document.getElementById("canvas");
  ele.style.cursor = "auto";
}

guiToolbox.prototype.noconnSelect = function()
{
  this.dropConn.selected = false;
  this.dropWire.selected = false;
  this.iconNav.selected = true;

  var ele = document.getElementById("canvas");
  ele.style.cursor = "auto";
}
*/


// children will be in weird places, so don't confine it to the box of the
// guiToolbox.
//
guiToolbox.prototype.hitTest = function(x, y)
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

guiToolbox.prototype._handleWireEvent = function(ev)
{

  //this.iconConnTab.visible = true;
  this.dropConn.iconTab.visible = true;

  if (ev.owner == this.name + ":wire")
  {

    console.log("  handing over to toolWire (grid)");
    g_controller.tool = new toolWire(0, 0, false);

    this.dropWire.selected = true;

    this.dropConn.selected = false;
    this.iconNav.selected = false;


    g_painter.dirty_flag = true;

  }
  else if (ev.owner == this.name + ":bus")
  {
    console.log("  handing over to toolWire (grid)");
    //g_controller.tool = new toolWire();
    //this.dropWire.selected = true;
    g_painter.dirty_flag = true;
  }

}


guiToolbox.prototype._handleConnEvent = function(ev)
{
  if (ev.owner == this.name + ":conn")
  {
    console.log("  handing over to toolConn");
    g_controller.tool = new toolConn(0, 0, "connection");

    this.dropConn.selected = true;

    this.dropWire.selected = false;
    this.iconNav.selected = false;

    g_painter.dirty_flag = true;
  }
  else if (ev.owner == this.name + ":noconn")
  {
    console.log("  handing over to toolConn");
    g_controller.tool = new toolConn(0, 0, "noconn");

    this.dropConn.selected = true;

    this.dropWire.selected = false;
    this.iconNav.selected = false;

    g_painter.dirty_flag = true;

  }

}


guiToolbox.prototype._eventMouseDown = function( ev )
{
  if (ev.owner == this.name + ":nav")
  {
    console.log("  handing over to toolNav (2)");

    var ele = document.getElementById("canvas");
    ele.style.cursor = "auto";


    g_controller.tool = new toolNav();

    this.iconNav.selected = true;

    this.dropConn.selected = false;
    this.dropWire.selected = false;

    g_painter.dirty_flag = true;

    return;
  }

  else if ( ev.owner.match(/:(wire|bus)$/) )
  {
    this._handleWireEvent(ev);
  }
  else if ( ev.owner.match(/:(conn|noconn)$/) )
  {
    this._handleConnEvent(ev);
  }

  else if (ev.owner == this.name + ":dropwire:tab")
  {
    console.log("  wire tab!");

    // hide (or show) the tabs from other tools that stick out below it
    //
    this.dropConn.iconTab.visible = !this.dropConn.iconTab.visible;

    if ( this.dropConn.showDropdown )
      this.dropConn.toggleList();

  }

  else if (ev.owner == this.name + ":dropconn:tab")
  {
    console.log("  conn tab");

    if ( this.dropWire.showDropdown )
      this.dropWire.toggleList();

    g_painter.dirty_flag = true;
  }

}

guiToolbox.prototype._eventDoubleClick = function( ev )
{
  if (ev.owner == this.name + ":conn")
  {
    console.log("  handing over to toolConn('connection', 'persist')");
    g_controller.tool = new toolConn( 0, 0, "connection", "persist");
    return;
  }
  else if (ev.owner == this.name + ":noconn")
  {
    console.log("  handing over to toolConn('noconn', 'persist')");
    g_controller.tool = new toolConn( 0, 0, "noconn", "persist");
    return;
  }
}

guiToolbox.prototype.handleEvent = function(ev)
{
  if ( ev.type == "mouseDown" )
    return this._eventMouseDown(ev);
  else if ( ev.type == "doubleClick" )
    return this._eventDoubleClick(ev);


}

guiToolbox.prototype.draw = function()
{

}


