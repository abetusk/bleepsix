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

var __icon_width = 24;

function guiBoardToolbox( name, bgColor  ) 
{
  bgColor = ((typeof bgColor !== 'undefined') ? bgColor : "rgba(255,255,255,0.4)" );
  this.constructor ( name )   

  //this.bgColor = "rgba( 0, 0, 255, 0.2 )";
  this.bgColor = bgColor;

  this.iconWidth = __icon_width;
  this.width = this.iconWdith + 5;

  this.height = 4* this.iconWidth;
  this.iconHeight = this.iconWidth;

  this.tabHeight = this.iconWidth;
  this.tabWidth = this.width - this.iconWidth;

  var cur_y = 0;
  var sz = this.iconWidth;


  // iconNav is just a simple guiIcon
  //
  this.iconNav = new guiIcon( name + ":nav" );
  this.iconNav.init( 0, cur_y, sz, sz);
  this.iconNav.drawShape = _draw_nav_icon;
  this.iconNav.bgColor = bgColor;
  this.iconNav.fgColor = "rgb(255,255,255)";
  this.addChild( this.iconNav );

  cur_y += this.iconNav.height;


  // grouped trace functions (trace, via, etc(?))
  //
  var w = new guiDropIcon( this.name + ":droptrace", this.iconWidth , this.iconWidth );
  w.bgColor = bgColor;
  w.fgColor = "rgb(255,255,255)";
  w.divColor = "rgba(255,255,255,0.2)";
  w.addIcon( this.name + ":trace", _draw_trace_icon );
  w.addIcon( this.name + ":via" , _draw_via_icon );
  w.move(0, cur_y);

  this.dropTrace = w;
  this.addChild( w );

  cur_y += w.height;



  // grouped art functions (edge, box, arcs, circles, etc.)
  //
  var u = new guiDropIcon( this.name + ":dropedge", this.iconWidth , this.iconWidth );
  u.bgColor = bgColor;
  u.fgColor = "rgb(255,255,255)";
  u.divColor = "rgba(255,255,255,0.2)";
  u.addIcon( this.name + ":edge", _draw_edge_icon );
  u.addIcon( this.name + ":box", _draw_box_icon );
  u.addIcon( this.name + ":circle", _draw_circle_icon );
  u.addIcon( this.name + ":arc", _draw_arc_icon );
  u.addIcon( this.name + ":roundedbox", _draw_roundedbox_icon );
  u.addIcon( this.name + ":inroundedbox", _draw_inroundedbox_icon );
  u.move(0, cur_y);

  this.dropEdge = u;
  this.addChild( u );

  cur_y += u.height;

  // zone
  //

  // text
  //


  // dimension
  //


  this.dropEdge.selected = false;
  this.dropTrace.selected = false;
  this.iconNav.selected = true;

}

function _draw_nav_icon()
{
  var sz = 10;
  var sx = __icon_width/2-sz/2, sy = __icon_width/2-sz/2;

  var r = parseInt(8 * __icon_width /10);
  g_imgcache.draw( "cursor", 3, 1, r, r );

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


function _draw_trace_icon()
{
  var sx = __icon_width/5, sy = __icon_width/3;
  var dx = __icon_width/5, dy = __icon_width/3;
  var color = "rgba(0,255,0,0.45)", width = 4;

  var p = [ [ 0,     0 ], 
            [ dx,    0 ],
            [ 2*dx, dy ],
            [ 3*dx, dy ] ];

  g_painter.drawPath( p, sx, sy, color, width, false);

}

function _draw_via_icon()
{
  var sx = __icon_width/2, sy = __icon_width/2;
  var color = "rgba(255,255,255,0.4)";
  var r = __icon_width/4;

  g_painter.circle( sx, sy, r, 0, color, true, color );

}

function _draw_edge_icon()
{
  var mx = __icon_width/2, my = __icon_width/2;
  var dx = __icon_width/5, dy = __icon_width/5;
  var color = "rgba(255,255,0,0.6)";
  var width = 4;

  g_painter.line( mx+dx, my-dy, mx-dx, my+dy, color, width );
}

function _draw_box_icon()
{
  var mx = __icon_width/2, my = __icon_width/2;
  var dx = __icon_width/6, dy = __icon_width/6;
  var color = "rgba(0,0,138,0.6)";
  var width = 2;

  g_painter.line( mx, my-dy, mx, my+dy, color, width );
}

function _draw_circle_icon()
{
  var mx = __icon_width/2, my = __icon_width/2;
  var dx = __icon_width/6, dy = __icon_width/6;
  var color = "rgba(0,0,138,0.6)";
  var width = 2;

  g_painter.line( mx, my-dy, mx, my+dy, color, width );
}

function _draw_arc_icon()
{
  var mx = __icon_width/2, my = __icon_width/2;
  var dx = __icon_width/6, dy = __icon_width/6;
  var color = "rgba(0,0,138,0.6)";
  var width = 2;

  g_painter.line( mx, my-dy, mx, my+dy, color, width );
}

function _draw_roundedbox_icon()
{
  var mx = __icon_width/2, my = __icon_width/2;
  var dx = __icon_width/6, dy = __icon_width/6;
  var color = "rgba(0,0,138,0.6)";
  var width = 2;

  g_painter.line( mx, my-dy, mx, my+dy, color, width );
}

function _draw_inroundedbox_icon()
{
  var mx = __icon_width/2, my = __icon_width/2;
  var dx = __icon_width/6, dy = __icon_width/6;
  var color = "rgba(0,0,138,0.6)";
  var width = 2;

  g_painter.line( mx, my-dy, mx, my+dy, color, width );
}


guiBoardToolbox.inherits ( guiRegion );

guiBoardToolbox.prototype.defaultSelect = function()
{
  this.dropEdge.selected = false;
  this.dropTrace.selected = false;
  this.iconNav.selected = true;

  var ele = document.getElementById("canvas");
  ele.style.cursor = "auto";
}

guiBoardToolbox.prototype.traceSelect = function()
{
  this.dropEdge.selected = false;
  this.dropTrace.selected = true;
  this.iconNav.selected = false;

  var ele = document.getElementById("canvas");
  ele.style.cursor = "url('img/cursor_custom_wire_s24.png') 4 3, cursor";
}

guiBoardToolbox.prototype.edgeSelect = function()
{
  this.dropEdge.selected = true;
  this.dropTrace.selected = false;
  this.iconNav.selected = false;

  var ele = document.getElementById("canvas");
  ele.style.cursor = "url('img/cursor_custom_wire_s24.png') 4 3, cursor";
}


// children will be in weird places, so don't confine it to the box of the
// guiBoardToolbox.
//
guiBoardToolbox.prototype.hitTest = function(x, y)
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

guiBoardToolbox.prototype._handleTraceEvent = function(ev)
{

  this.dropEdge.iconTab.visible = true;

  if (ev.owner == this.name + ":trace")
  {

    console.log("  handing over to toolTrace (grid)");
    g_board_controller.tool = new toolTrace(0, 0, false);

    this.dropTrace.selected = true;

    this.dropEdge.selected = false;
    this.iconNav.selected = false;


    g_painter.dirty_flag = true;

  }
  else if (ev.owner == this.name + ":via")
  {
    console.log("  handing over to toolTrace (grid)");
    g_painter.dirty_flag = true;
  }

}


guiBoardToolbox.prototype._handleEdgeEvent = function(ev)
{
  if (ev.owner == this.name + ":conn")
  {
    console.log("  handing over to toolConn");
    g_board_controller.tool = new toolConn(0, 0, "connection");

    this.dropEdge.selected = true;

    this.dropTrace.selected = false;
    this.iconNav.selected = false;

    g_painter.dirty_flag = true;
  }
  else if (ev.owner == this.name + ":noconn")
  {
    console.log("  handing over to toolConn");
    g_board_controller.tool = new toolConn(0, 0, "noconn");

    this.dropEdge.selected = true;

    this.dropTrace.selected = false;
    this.iconNav.selected = false;

    g_painter.dirty_flag = true;

  }

}


guiBoardToolbox.prototype._eventMouseDown = function( ev )
{
  if (ev.owner == this.name + ":nav")
  {
    console.log("  handing over to toolBoardNav (2)");

    var ele = document.getElementById("canvas");
    ele.style.cursor = "auto";


    g_board_controller.tool = new toolBoardNav();

    this.iconNav.selected = true;

    this.dropEdge.selected = false;
    this.dropTrace.selected = false;

    g_painter.dirty_flag = true;

    return;
  }

  else if ( ev.owner.match(/:(trace|via)$/) )
  {
    this._handleTraceEvent(ev);
  }
  else if ( ev.owner.match(/:(edge|box|circle|arc|roundedbox|inroundedbox)$/) )
  {
    this._handleEdgeEvent(ev);
  }

  else if (ev.owner == this.name + ":droptrace:tab")
  {
    console.log("  trace tab!");

    // hide (or show) the tabs from other tools that stick out below it
    //
    this.dropEdge.iconTab.visible = !this.dropEdge.iconTab.visible;

    if ( this.dropEdge.showDropdown )
      this.dropEdge.toggleList();

  }

  else if (ev.owner == this.name + ":dropedge:tab")
  {
    console.log("  edge tab");

    if ( this.dropTrace.showDropdown )
      this.dropTrace.toggleList();

    g_painter.dirty_flag = true;
  }

}

guiBoardToolbox.prototype._eventDoubleClick = function( ev )
{
  if (ev.owner == this.name + ":conn")
  {
    console.log("  handing over to toolConn('connection', 'persist')");
    //g_board_controller.tool = new toolConn( 0, 0, "connection", "persist");
    return;
  }
  else if (ev.owner == this.name + ":noconn")
  {
    console.log("  handing over to toolConn('noconn', 'persist')");
    //g_board_controller.tool = new toolConn( 0, 0, "noconn", "persist");
    return;
  }
}

guiBoardToolbox.prototype.handleEvent = function(ev)
{
  if ( ev.type == "mouseDown" )
    return this._eventMouseDown(ev);
  else if ( ev.type == "doubleClick" )
    return this._eventDoubleClick(ev);


}

guiBoardToolbox.prototype.draw = function()
{

}


