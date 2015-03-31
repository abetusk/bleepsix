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

function guiTextbox( name )
{
  this.constructor(name);

  // debugging...
  this.uniq = parseInt(256.0*Math.random());
  //this.bgColor = "rgba(" + this.uniq + ",0,0," + "0.2)";
  //this.bgColor = "rgba(0,0," + this.uniq +",0.7)";
  //this.bgColor = "rgba(" + this.uniq +",0,0,0.2)";
  this.bgColor = "rgba(150,150,150,0.2)";
  //this.borderColor = "rgba(255,255,255,0.2)";
  this.borderColor = "rgba(55,55,55,0.2)";

  this.drawShape = null;

  this.textCallback = null;

  /*
  this.borderTop = 5;
  this.borderBottom = 15;
  this.borderSize = 5;
  */
  this.borderTop = 0;
  this.borderBottom = 0;
  this.borderSize = 0;

  this.text = "";
  this.textSize = 14;
  this.textMaxLength = 64;
  this.text_cursor = 0;

  this.textHeight = this.textSize;
  this.textWidth = this.textHeight * 0.6;

  this.button = new guiIcon( name + ":button" );
  this.button.init( 5, this.textSize + 5, 10, 10 );
  //this.addChild( this.button );

  this.width = this.textWidth * 20 + 2*this.borderSize ;

  //this.height = this.textHeight + this.button.height + this.borderTop + this.borderBottom;
  this.height = this.textHeight + this.borderTop + this.borderBottom;

}
guiTextbox.inherits( guiRegion );

guiTextbox.prototype.init = function(x, y, w, h )
{
  this.width = w;
  this.height = h;
  this.move(x,y);

  //this.button.init( 5, this.textSize + 5, 10, 10 );
}

guiTextbox.prototype.keyDown = function(keycode, ch, ev)
{
  console.log("guiTextbox.keyDown: got ch: " + ch);
}

guiTextbox.prototype.handleEevent = function(ev)
{
  console.log("guiTextbox.keyDown: got event: ");
  console.log(ev);
}


guiTextbox.prototype.mouseDown = function(button, x, y)
{
  var ev = { type: "mouseDown", owner: this.name, ref: this, button : button, x : x, y : y };
  this.parent.handleEvent(ev);
  return true;
}

guiTextbox.prototype.mouseUp = function(button, x, y)
{
  console.log("guiTextbox.mouseUp(" + this.name + "): " + button + " " + x + " " + y);

  //var ev = { type: "mouseDown", owner: this.name, ref: this, button : button, x : x, y : y };
  //this.parent.handleEvent(ev);

  return true;
}

guiTextbox.prototype.doubleClick = function(ev, x, y)
{
  var ev = { type: "doubleClick", owner: this.name, button : ev.button, x : x, y : y };

  this.parent.handleEvent(ev);

  return true;
}

//-- Keyboard functions

guiTextbox.prototype._mv_cursor = function( ds )
{
  this.text_cursor += ds;
  if (this.text_cursor<0)
    this.text_cursor=0;
  if (this.text_cursor > this.text.length)
    this.text_cursor=this.text_length;
}

guiTextbox.prototype.registerTextCallback = function( f )
{
  this.textCallback = f;
}

guiTextbox.prototype.keyPress = function(keycode, ch, ev)
{
  if ((keycode >= 20) && (keycode <= 126))
  {
    this.text += ch;
    this._mv_cursor(+1);

    if (this.textCallback) { this.textCallback( this.text ); }

    g_painter.dirty_flag = true;
  }

  return true;
}


guiTextbox.prototype.keyDown = function(keycode, ch, ev)
{
  var pass_key = true;

  // esc
  //
  if (keycode == 27)
  {

  }

  // backspace
  //
  else if (keycode == 8)
  {
    pass_key = false;

    var p = this.text_cursor;

    if (p>0) {
      this._mv_cursor(-1);
      p = this.text_cursor;
      var new_text = this.text.slice(0, p) + this.text.slice(p+1,this.text.length);
      this.text = new_text;

      if (this.textCallback) { this.textCallback( this.text ); }

      g_painter.dirty_flag=true;
    }
  }

  // 37 - left
  else if (keycode == 37)
  {
    this._mv_cursor(-1);
  }

  // 39 - right
  else if (keycode == 39)
  {
    this._mv_cursor(+1);
  }

  // 38 - up
  else if (keycode == 38)
  {
    console.log("...history-");
  }

  // 40 - down
  else if (keycode == 40)
  {
    console.log("...history+");
  }




  return pass_key;

}

guiTextbox.prototype.keyUp = function(keycode, ch, ev)
{
  console.log("guiTextbox.keyUp:", keycode, ch, ev);
  return true;
}

//--

guiTextbox.prototype.draw = function()
{
  g_painter.drawRectangle( 0, 0, this.width, this.height,  
                           2, this.borderColor,
                           true, this.bgColor );

  g_painter.drawText( this.text, 2, 2, "rgba(0,0,0,0.5)", this.textSize, 0, "L", "T" );
}

