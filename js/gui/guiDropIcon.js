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

function guiDropIcon( name, width, height, verticalFlag, leftFlag )
{
  this.constructor(name);

  verticalFlag = ( (typeof verticalFlag !== 'undefined') ? verticalFlag : false );
  leftFlag = ( (typeof leftFlag !== 'undefined') ? leftFlag : false );

  // debugging...
  this.uniq = parseInt(256.0*Math.random());
  //this.bgColor = "rgba(" + this.uniq + ",0,0," + "0.2)";
  //this.bgColor = "rgba(0,0," + this.uniq +",0.7)";
  //this.bgColor = "rgba(0," + this.uniq +",0,0.5)";
  this.bgColor = "rgba(0,0,0,0.2)";
  this.fgColor = "rgb(0,0,0)";
  this.divColor = "rgba(0,0,0,0.2)";

  this.width = width;
  this.height = height;

  this.iconWidth = width;
  this.iconHeight = height;

  if (verticalFlag)
  {
    this.tabWidth = width;
    this.tabHeight= height/3;
  }
  else
  {
    this.tabWidth = width/3;
    this.tabHeight = height;
  }

  this.mainIcon = null
  this.mainIconDraw = null

  this.iconList = [];
  this.iconDraw = [];

  this.iconListOffset = this.iconHeight / 2;

  this.tabName = null;


  this.iconTab = null;
  this.iconTabDraw = null;

  this.selected = false;
  this.vertical = verticalFlag;
  this.right = !leftFlag;
  this.showDropdown = false;

  this.tooltip_texts = {};
}
guiDropIcon.inherits( guiRegion );

guiDropIcon.prototype._icon_tab_draw_right = function()
{
  var x = 0;
  var y = this.iconWidth/3;
  var w = this.iconWidth/3;
  var h = this.iconWidth - y;

  //var color = "rgba(0,0,0, 0.2)";
  var color = this.bgColor;

  var path = [ [0, 0], [x+w, y], [x+w, y+h] , [0, y+h] ];
  g_painter.drawBarePolygon( path, 0, 0, color );

  var l = (y+h)/5;
  //g_painter.line( 0, l, 0, 4*l, "rgba(0,0,0,0.2)", 1 );
  g_painter.line( 0, l, 0, 4*l, this.divColor, 1 );

}

guiDropIcon.prototype._icon_tab_draw_left = function()
{
  var x = 0;
  var y = this.iconWidth/3;
  var w = this.iconWidth/3;
  var h = this.iconWidth - y;

  var color = this.bgColor;

  var path = [ [w, 0], [w, y+h], [0, y+h] , [0, y] ];
  g_painter.drawBarePolygon(path, 0, 0, color);

  var l = (y+h)/5;
  g_painter.line( 0, l, 0, 4*l, this.divColor, 1 );

}

guiDropIcon.prototype._icon_tab_draw_bottom = function()
{
  var x = 0;
  var y = 0;
  var w = this.tabWidth;
  var h = this.tabHeight;
  var of = this.tabHeight;

  //var color = "rgba(0,0,0, 0.2)";
  var color = this.bgColor;

  var path = [ [0, 0], [x+w, 0], [x+w-of, y+h] , [x+of, y+h] ];
  g_painter.drawBarePolygon( path, 0, 0, color );

  var l = (x+w)/5;
  //g_painter.line( l, y, 4*l, y, "rgba(0,0,0,0.2)", 1 );
  g_painter.line( l, y, 4*l, y, this.divColor, 1 );

}

guiDropIcon.prototype.addIcon = function(name, draw, alt_tooltip_text)
{
  var x = 0;
  var y = 0;

  if (this.vertical)
  {
    x = 0;
    y = this.iconHeight * (this.iconList.length + 1);
  }
  else
  {
    if (this.right) {
      x = this.iconWidth;
      y = this.iconHeight * this.iconList.length + this.iconListOffset;
    } else {
      x = -this.iconWidth;
      y = this.iconHeight * this.iconList.length + this.iconListOffset;
    }
  }

  var ic = new guiIcon(name);
  this.iconDraw = draw;
  ic.init(x, y, this.iconWidth, this.iconHeight );
  ic.visible = false;
  ic.drawShape = draw;
  ic.bgColor = this.bgColor;

  if (typeof alt_tooltip_text !== "undefined") {
    this.tooltip_texts[name] = alt_tooltip_text;
  }

  if (this.iconList.length == 0)
  {
    this.mainIcon = new guiIcon(name);
    this.mainIcon.init( 0, 0, this.width, this.height );
    this.mainIcon.visible = true;
    this.mainIcon.drawShape = draw;
    this.mainIcon.bgColor = this.bgColor;
    this.addChild( this.mainIcon );

    this.iconTab = new guiIcon(this.name + ":tab");

    if (this.vertical)
    {
      this.iconTabDraw = (function(a) { return function() { a._icon_tab_draw_bottom();} })(this) ;
      this.iconTab.init(0, this.iconHeight, this.tabWidth, this.tabHeight);
    }
    else
    {
      if (this.right) {
        this.iconTabDraw = (function(a) { return function() { a._icon_tab_draw_right();} })(this) ;
        this.iconTab.init(x, 0, this.tabWidth, this.tabHeight);
      } else {
        this.iconTabDraw = (function(a) { return function() { a._icon_tab_draw_left();} })(this) ;
        this.iconTab.init(-this.tabWidth, 0, this.tabWidth, this.tabHeight);
      }
    }
    this.iconTab.draw = this.iconTabDraw;
    this.iconTab.visible = true;

    this.tabName = this.name + ":tab";
    this.addChild(this.iconTab);
  }

  this.iconList.push(ic);
  this.addChild(ic);
}

guiDropIcon.prototype.hitTest = function(x, y)
{
  var u = numeric.dot( this.inv_world_transform, [x,y,1] );

  for (var ind in this.guiChildren )
  {
    if (this.guiChildren[ind].visible)
    {
      var r = this.guiChildren[ind].hitTest(x, y);
      if (r) { return r; }
    }
  }

  return null;
}

guiDropIcon.prototype._positionTab = function()
{

  if (this.vertical)
  {
    if (this.showDropdown)
    {
      this.iconTab.init(  0, (this.iconList.length + 1)* this.iconHeight,
                          this.iconWidth, this.iconHeight/3 );
      this.iconTab.draw =  (function(a) { return function() { a._icon_tab_draw_bottom();} })(this) ;
    }
    else
    {
      this.iconTab.init( 0, this.iconHeight,
                         this.iconWidth, this.iconHeight/3 );
      this.iconTab.draw =  (function(a) { return function() { a._icon_tab_draw_bottom();} })(this) ;
    }

  }
  else
  {

    if (this.showDropdown)
    {

      if (this.right) {
        this.tabHeight = this.iconHeight/3;
        this.tabWidth = this.iconWidth;
        this.iconTab.init(  this.iconWidth, this.iconList.length * this.iconHeight + this.iconListOffset,
                            this.iconWidth, this.iconHeight/3 );
        this.iconTab.draw =  (function(a) { return function() { a._icon_tab_draw_bottom();} })(this) ;
      } else {
        this.tabHeight = this.iconHeight/3;
        this.tabWidth = this.iconWidth;
        this.iconTab.init( -this.iconWidth, this.iconList.length * this.iconHeight + this.iconListOffset,
                            this.iconWidth, this.iconHeight/3 );
        this.iconTab.draw =  (function(a) { return function() { a._icon_tab_draw_bottom();} })(this) ;
      }
    }
    else
    {

      if (this.right) {
        this.tabHeight = this.iconHeight;
        this.tabWidth = this.iconWidth/3;
        this.iconTab.init( this.iconWidth, 0,
                           this.iconWidth/3, this.iconHeight );
        this.iconTab.draw =  (function(a) { return function() { a._icon_tab_draw_right();} })(this) ;
      } else {
        this.tabHeight = this.iconHeight;
        this.tabWidth = this.iconWidth/3;
        this.iconTab.init( -this.iconWidth/3, 0,
                           this.iconWidth/3, this.iconHeight );
        this.iconTab.draw =  (function(a) { return function() { a._icon_tab_draw_left();} })(this) ;
      }

    }

  }

}

guiDropIcon.prototype.toggleList = function()
{

  this.showDropdown = !this.showDropdown;

  for (var ind in this.iconList)
  {
    this.iconList[ind].visible = !this.iconList[ind].visible;
  }

  this._positionTab();

  g_painter.dirty_flag = true;

}

guiDropIcon.prototype.expand = function()
{
  this.showDropdown = true;
  for (var ind in this.iconList)
    this.iconList[ind].visible = true;
  this._positionTab();
  g_painter.dirty_flag = true;
}

guiDropIcon.prototype.contract = function()
{
  this.showDropdown = false;
  this.iconTab.visible = true;
  for (var ind in this.iconList)
    this.iconList[ind].visible = false;
  this._positionTab();
  g_painter.dirty_flag = true;
}

guiDropIcon.prototype.contractSlim = function()
{
  this.showDropdown = false;
  this.iconTab.visible = false;
  for (var ind in this.iconList)
    this.iconList[ind].visible = false;
  this._positionTab();
  g_painter.dirty_flag = true;
}


guiDropIcon.prototype.activateList = function()
{
  for (var ind in this.iconList)
    this.iconList[ind].visible = true;
}

guiDropIcon.prototype.deactivateList = function()
{
  for (var ind in this.iconList)
    this.iconList[ind].visible = false;
}

//guiDropIcon.prototype.mouseDown( button, x, y ) { }

guiDropIcon.prototype.handleEvent = function(ev)
{

  if (ev.owner == this.tabName)
  {
    this.toggleList();
  }
  else
  {

    if (this.showDropdown)
    {

      if (ev.owner != this.tabName)
      {
        this.mainIcon.name = ev.ref.name;
        this.mainIcon.drawShape = ev.ref.drawShape;

        if (ev.ref.name in this.tooltip_texts) {
          this.tooltip_text = this.tooltip_texts[ev.ref.name];
        }

        this.toggleList();
      }
    }

  }

  // After we fiddle with dropdowns and such, pass
  // event up to parent
  //
  this.parent.handleEvent(ev);
}

guiDropIcon.prototype.draw = function()
{
  //if (this.showDropdown || this.selected )
  if (this.selected)
   g_painter.drawRectangle( 0, 0, this.width, this.height,  
                           1, this.fgColor ); 
                           //1, "rgb(0,0,0)")
                           //true, this.bgColor );

  if (this.tooltip_display) {
    this.tooltip_width = this.tooltip_text.length * this.tooltip_font_size/1.6;
    g_painter.drawRectangle( this.tooltip_x, this.tooltip_y,
                             this.tooltip_width, this.tooltip_height,
                             0, "rgba(128,128,128,0.5)",
                             true, this.bgColor);
    g_painter.drawText( this.tooltip_text, this.tooltip_x, this.tooltip_y,
                        this.fgColor, this.tooltip_font_size, 0, 'L', 'T');
                        
    var tx = this.tooltip_x;
    var ty = this.tooltip_y;
    var sz = this.tooltip_height;
    var p = [ [ 0, sz/4], [ 0, 3*sz/4 ], [ -sz/2, sz/2] ];
    g_painter.drawBarePolygon( p, tx, ty, this.bgColor );
  }

}

