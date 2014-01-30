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

var brdControllerHeadless = false;
if (typeof module !== 'undefined')
{
  brdControllerHeadless = true;
  var bleepsixSchematic = require("../sch/bleepsixSchematicNode.js");
  var bleepsixBoard = require("./bleepsixBoardNode.js");
}



function bleepsixBoardController() {
  this.canvas = null;
  this.context = null;

  this.board = new bleepsixBoard();
  this.schematic = new bleepsixSchematic();

  this.mouse_left_down = false;
  this.mouse_center_down = false;
  this.mouse_right_down = false;

  this.mouse_start_x = 0;
  this.mouse_start_y = 0;
  this.mouse_cur_x = 0;
  this.mouse_cur_y = 0;

  this.queued_display_module = 0;

  if (!brdControllerHeadless)
  {
    this.tool = new toolBoardNav ();
  }
  
  this.moving = false;
  this.movingFootprintLibrary = false;
  //this.movingToolbox = false;
  //this.movingGrid = false;
  //this.movingAction = false;

  this.movingDebug = false;

  this.capState = "unknown";

  var controller = this;
  //setInterval( function() { controller.redraw() } , 50 );

  // HARD CODED FOR DEMO.  REMOVE ASAP
  //g_painter.adjustPan( -4000, -1500);
  if (!brdControllerHeadless)
  {
    g_painter.adjustPan( 0, 0);
  }

  this.op = new bleepsixSchBrdOp( this.schematic, this.board );

  this.display_text_flag = true;
  this.display_text = "bloop";

  this.boardUpdate = false;

  this.project_name_text_flag = true;
  this.project_name_text = "no name";

  var d = new Date();
  var curt = d.getTime();

  this.action_text_flag = true;
  this.action_text = "init";
  this.action_text_fade = { sustainDur : 1500, dropoffDur : 500, T :0 , lastT : curt };

  this.drawSnapArea = false;
}



bleepsixBoardController.prototype.fadeMessage = function ( msg )
{
  var d = new Date();
  var curt = d.getTime();

  this.action_text = msg;
  this.action_text_fade.T = 0;
  this.action_text_fade.lastT = curt;
}



bleepsixBoardController.prototype.redraw = function ()
{

  var action_text_touched = false;
  var action_text_val = 0.0;

  var at_s = 0.4;

  if (this.action_text_flag)
  {
    if ( this.action_text_fade.T < this.action_text_fade.sustainDur )
    {
      action_text_val = at_s ;
      action_text_touched = true;
    }
  else if (this.action_text_fade.T < ( this.action_text_fade.sustainDur + this.action_text_fade.dropoffDur) )
  {
    var t = this.action_text_fade.sustainDur + this.action_text_fade.dropoffDur - this.action_text_fade.T;
    action_text_val = at_s * t / this.action_text_fade.dropoffDur;
    action_text_touched = true;
  }
  else
    action_text_touched = false;

    if (action_text_touched)
    {
      g_painter.dirty_flag = true;
      var d = new Date();
      var curt = d.getTime();
      var dt = curt - this.action_text_fade.lastT;
      this.action_text_fade.T += dt;
      this.action_text_fade.lastT = curt;
    }

  }



  if (this.board.displayable)
    this.board.tick();

  if ( g_painter.dirty_flag )
  {
    g_painter.startDrawColor();

    g_painter.drawGrid();



    //DEBUG
    //this.primitives_test();
    //this.hershey_ascii_font_test();
    //this.hershey_font_test();
    //DEBUG



    if (this.board.displayable) 
      this.board.drawBoard();

    this.tool.drawOverlay();

    g_painter.endDraw ();

	g_painter.context.setTransform ( 1, 0, 0, 1, 0, 0 );


    // One of these drawChildren calls doesn't clean up after themselves
    // leading me to clean up after them and reset the transform.
    //
    this.guiToolbox.drawChildren();
    this.guiGrid.drawChildren();


	//this.root.drawChildren ();
    //this.guiBoardPalette.drawChildren();
    //this.guiLayer.drawChildren();
    //this.guiModule.drawChildren();
    //this.guiGrid.drawChildren();
    //this.guiAction.drawChildren();




    //
    //------------------------
    //
    // Draw text graphics
    //

	g_painter.context.setTransform ( 1, 0, 0, 1, 0, 0 );

    if (this.display_text_flag )
      g_painter.drawText(this.display_text, 10, 680, "rgba(255,255,255,0.5)", 15);

    if (this.project_name_text_flag)
      g_painter.drawText(this.project_name_text, 30, 10, "rgba(255,255,255,0.5)", 15);


    if (action_text_touched)
      g_painter.drawText(this.action_text, 10, 650, "rgba(255,255,255," + action_text_val + ")", 15);


    if (this.drawSnapArea)
    {
      var lw = 5;
      var ww = 900 + 2*lw;
      var hh = 525 + 2*lw;
      var xx = 50 - lw;
      var yy = 50 - lw;

      g_painter.drawRectangle( xx, yy, ww, hh, lw, "rgba(255,255,255,0.4)", false );
    }

    //
    //------------------------
    //



	g_painter.context.setTransform ( 1, 0, 0, 1, 0, 0 );

    // guiFootprintLibrary leaves the transform matrix (I think)
    // in a bad state.  Need to look at this to make sure it plays
    // nice with the other gui elements.  For now leave it.
    //
    this.guiFootprintLibrary.drawChildren();

    g_painter.dirty_flag = false;

  }

}

bleepsixBoardController.prototype.canvas_coords_from_global = function( x, y ) 
{
  var rect = this.canvas.getBoundingClientRect();
  var rl = rect.left;
  var rt = rect.top;

  var scrollx = window.scrollX;
  var scrolly = window.scrollY;


  return [ x - rl - scrollx, y - rt - scrolly ];
}

bleepsixBoardController.prototype.mouseEnter = function( x, y ) 
{
  //console.log('mouseenter: ' + x + ", " + y );
}

bleepsixBoardController.prototype.mouseLeave = function( x, y ) 
{
  //console.log('mouseleave: ' + x + ", " + y );
}



bleepsixBoardController.prototype.keyDown = function( keycode, ch, ev )
{
  if (typeof this.tool.keyDown !== 'undefined' )
  {
    r = this.tool.keyDown( keycode, ch, ev );
  }

}


bleepsixBoardController.prototype.keyDown = function( keycode, ch, ev )
{
  if ( ch == 'G' ) {      
      this.moving = !this.moving;
  }
  else if (ch == 'O')
  {
    this.movingLibrary = !this.movingLibrary;
  }
  else if (ch == 'P')
  {
    this.movingToolbox = !this.movingToolbox;
  }
  else if (ch == 'I')
  {
    this.movingGrid = !this.movingGrid;
  }
  else if (ch == 'U')
  {
    this.movingAction = !this.movingAction;
  }
  else if (ch == 'Y')
    {
      this.movingDebug = !this.movingDebug;
    }

  else if (ch == '9')
  {
    console.log("adding 'R' component to palette");

    //var guicomp = new guiPaletteComponent( "test", "R" );
    //this.guiPalette.addChild( guicomp );

    g_painter.dirty_flag = true;
  }

  var r = true;

  if (typeof this.tool.keyDown !== 'undefined' )
  {
    r = this.tool.keyDown( keycode, ch, ev );
  }

  return r;

}

bleepsixBoardController.prototype.keyPress = function( keycode, ch, ev )
{
  console.log( "keyPress: " + keycode + " " + ch  );

  if (typeof this.tool.keyPress !== 'undefined' )
    this.tool.keyPress( keycode, ch, ev );
}


bleepsixBoardController.prototype.mouseDown = function( button, x, y ) 
{

  if (this.guiFootprintLibrary.hitTest(x,y))
  {
    this.guiFootprintLibrary.mouseDown(button, x, y);
    return;
  }

  /*
  if (this.guiLayer.hitTest(x,y))
  {
    this.guiLayer.mouseDown(button, x, y);
    return;
  }
  */


  /*
  if (this.guiPalette.hitTest(x, y))
  {
    console.log(" gui component hit, letting it handle it");
    return;
  }
  */

  if (this.guiToolbox.hitTest(x,y))
  {
    this.guiToolbox.mouseDown(button, x, y);
    return;
  }

  if (this.guiGrid.hitTest(x,y))
  {
    this.guiGrid.mouseDown(button, x, y);
    return;
  }

  /*
  if (this.guiAction.hitTest(x,y))
  {
    this.guiAction.mouseDown(button, x, y);
    return;
  }
 */

  //DEBUGGING
  /*
  if (this.guiTextboxTest.hitTest(x,y))
  {
    this.guiTextboxTest.mouseDown(button, x, y);
    return;
  }
  */

  /*
  for (var ind in this.guiChild)
  {
    if ( (typeof this.guiChild[ind].hitTest !== 'undefined') &&
         (this.guiChild[ind].hitTest(x, y)) )
    {
      if (typeof this.guiChild[ind].mouseDown !== 'undefined' )
        this.guiChild[ind].mouseDown(button, x, y);
      return;
    }
  }
 */

  if (typeof this.tool.mouseDown !== 'undefined' )
  {
    this.tool.mouseDown ( button, x, y );
  }
}

bleepsixBoardController.prototype.doubleClick = function( e )
{
  console.log("double click");

  if (this.guiToolbox.hitTest( this.mouse_cur_x, this.mouse_cur_y ))
  {
    this.guiToolbox.doubleClick( e, this.mouse_cur_x, this.mouse_cur_y  );
    return;
  }

  if (typeof this.tool.doubleClick !== 'undefined' )
    this.tool.doubleClick( e, this.mouse_cur_x, this.mouse_cur_y )
}

bleepsixBoardController.prototype.mouseUp = function( button, x, y ) 
{
  if (typeof this.tool.mouseUp !== 'undefined' )
    this.tool.mouseUp ( button, x, y );
}

bleepsixBoardController.prototype.mouseMove = function( x, y ) 
{
  this.mouse_cur_x = x;
  this.mouse_cur_y = y;

  if (this.movingFootprintLibrary)
    this.guiFootprintLibrary.move(x, y);

  if (this.movingLayer)
    this.guiLayer.move(x, y);


  /*
  if ( this.moving ) 
    this.guiPalette.move(x, y);

  if (this.movingLibrary)
    this.guiLibrary.move(x, y);

  if (this.movingToolbox)
    this.guiToolbox.move(x,y);

  if (this.movingGrid)
    this.guiGrid.move(x,y);
  
  if (this.movingAction)
    this.guiAction.move(x,y);
   */

  //if (this.movingDebug) this.guiTextboxTest.move(x,y);

  
  if (typeof this.tool.mouseMove !== 'undefined' )
    this.tool.mouseMove ( x, y );
}

bleepsixBoardController.prototype.mouseDrag = function( dx, dy ) 
{

  if (typeof this.tool.mouseDrag !== 'undefined' )
    this.tool.mouseDrag ( x, y );
}

bleepsixBoardController.prototype.mouseWheel = function( delta )
{
  var x = this.mouse_cur_x;
  var y = this.mouse_cur_y;

  if (this.guiFootprintLibrary.hitTest(x, y))
  {
    this.guiFootprintLibrary.mouseWheelXY(delta, x, y);
  }

  /*
  else if (this.guiLayer.hitTest(x, y))
  {
    this.guiLayer.mouseWheelXY(delta, x, y);
  }
  */

  else if (typeof this.tool.mouseWheel !== 'undefined' )
  {
    this.tool.mouseWheel ( delta );
  }

}

bleepsixBoardController.prototype.init = function( canvas_id ) 
{
  this.canvas = $("#" + canvas_id)[0];
  this.context = this.canvas.getContext('2d');

  /* hmm, guiPalette needs to know about g_controller.... */
  //this.guiPalette = new guiPalette( "palette" );
  //this.guiPalette.move( (g_painter.width - this.guiPalette.width)/4, g_painter.height - this.guiPalette.height );

  this.guiToolbox = new guiBoardToolbox( "toolbox" );
  this.guiToolbox.move( 0, 200);

  //this.guiGrid = new guiGrid( "toolbox", "rgba(255,255,255,0.4)", undefined, "rgba(255,255,255,0.2)" );
  this.guiGrid = new guiGrid( "toolbox", "rgba(255,255,255,0.5)", undefined, "rgba(255,255,255,0.2)" );
  this.guiGrid.move(0,0);

  this.guiFootprintLibrary = new guiFootprintLibrary( "library" );
  this.guiFootprintLibrary.move( g_painter.width - this.guiFootprintLibrary.width, 0);

  //this.guiToolbox = new guiBoardToolbox( "toolbox" );
  //this.guiToolbox.move(0,200);
  //this.guiToolbox.defaultSelect();

  




  // overlay (layer) hide/show and other information 
  // need to work on it, we'll come back to it
  //
  //this.guiLayer = new guiLayer( "layer" );
  //this.guiLayer.move( 5, 5 );

  //this.guiGrid = new guiGrid("grid");
  //this.guiGrid.move(50,50);

  //this.guiLibrary = new guiLibrary( "library" );
  //this.guiLibrary.move( g_painter.width - this.guiLibrary.width, 0);

  //this.guiModule = new guiModule ( "module" );
  //this.guiModule.move( g_painter.width - this.guiModule.width, 0);

  //this.guiAction= new guiAction( "action" );
  //this.guiAction.move( g_painter.width/2, 0);

  //this.guiTextboxTest = new guiTextbox( "test" );
  //this.guiTextboxTest.move( g_painter.width/2, g_painter.height/2);


  var controller = this;

  $(canvas_id).focus( function(ev) {
    console.log('focus');
    //console.log(ev);
  });

  $(canvas_id).mouseup( function(e) {
    var xy = controller.canvas_coords_from_global( e.pageX, e.pageY );
    controller.mouseUp( e.which , xy[0], xy[1] );
  });

  $(canvas_id).mousedown( function(e) {
    var xy = controller.canvas_coords_from_global( e.pageX, e.pageY );

    //coords = controller.canvas.relMouseCoords( e );
    //controller.mouseDown( e.which, coords["x"], coords["y"] );
    controller.mouseDown( e.which, xy[0], xy[1] );
  });

  $(canvas_id).mouseover( function(e) {
    //console.log("mouse over");
    //console.log(e);
  });

  $(canvas_id).mouseenter( function(e) {

    //console.log("enter");
    var xy = controller.canvas_coords_from_global( e.pageX, e.pageY );
    controller.mouseEnter( xy[0], xy[1] );
  });

  $(canvas_id).mouseleave( function(e) {
    var xy = controller.canvas_coords_from_global( e.pageX, e.pageY );
    controller.mouseLeave( xy[0], xy[1] );
  });

  $(canvas_id).mousemove( function(e) {
    //console.log('mousemove');
    var xy = controller.canvas_coords_from_global( e.pageX, e.pageY );
    controller.mouseMove( xy[0], xy[1] );
  });

  $(canvas_id).mousewheel( function(e, delta, detlax, deltay) {
    controller.mouseWheel( delta );
    return false;
  });

  $(canvas_id).click( function(e) {
    //console.log('click');
  });

  $(canvas_id).dblclick( function(e) {
    controller.doubleClick(e);
  });

  $(canvas_id).keydown( function(e) {
    var key = ( e.which ? e.which : e.keyCode );
    var ch = String.fromCharCode(key);

    //console.log('keydown: ' + ch);
    //console.log ( "... " + e.shiftKey );

    this.capState = $(window).capslockstate("state");

    //console.log("controller keydown: capState: " + this.capState);

    return controller.keyDown( e.keyCode, ch, e );
  });

  $(canvas_id).keyup( function(e) {
    var key = e.which;
    var ch = String.fromCharCode(key);

    //console.log('keyup ' + ch);
    //controller.keyUp( key, ch);

    //controller.keyUp( e.keyCode, ch, e );
  });

  $(canvas_id).resize( function(e) {
    console.log("resize");
    console.log(e);
  });

  $(canvas_id).keypress( function(e) {
    var key = e.which;
    var ch = String.fromCharCode(key);
    controller.keyPress( key, ch, e );
  });



  $(window).bind("capsOn", function(e) {
    //console.log("caps on");
    controller.capState = "on";
  });

  $(window).bind("capsOff", function(e) {
    //console.log("caps off");
    controller.capState = "off";
  });

  $(window).bind("capsUnknown", function(e) {
    //console.log("caps unknown");
    controller.capState = "unknown";
  });

  $(window).capslockstate();



  /*
   (function(){
      var doCheck = true;
      var check = function(){
        console.log("check");
      };
      window.addEventListener("resize",function(){
        if(doCheck){
          check();
          doCheck = false;
          setTimeout(function(){
            console.log("settimeout");
            doCheck = true;
            check();
          },500)
        }
      });
   })();
  */

  // get rid of right click menu popup
  $(document).bind("contextmenu", function(e) { return false; });

  // put focus on the canvas
  $(canvas_id).focus();

  // do first draw  
  g_painter.dirty_flag = true;
  
  // give to schematic
  this.board.init ( g_painter );
}

if (typeof module !== 'undefined')
{
  module.exports = bleepsixBoardController;
}
