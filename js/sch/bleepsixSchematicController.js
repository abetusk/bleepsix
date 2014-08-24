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

var schControllerHeadless = false;
if ( typeof module !== 'undefined')
{
  schControllerHeadless = true;
  var bleepsixSchematic = require("./bleepsixSchematicNode.js");
  var bleepsixBoard = require("../brd/bleepsixBoardNode.js");
  var bleepsixSchBrdOp = require("../lib/bleepsixSchBrdOp.js");
  var bleepsixAux = require("../lib/aux.js");

  var guid = bleepsixAux.guid;
  var s4 = bleepsixAux.s4;

  var g_schnetwork = null;
}

function bleepsixSchematicController() {
  this.canvas = null;
  this.context = null;

  this.type = "schematic";

  // classes controlled
  this.toolKit = null;
  this.toolLibrary = null;
  //this.palette = null;

  this.schematic = new bleepsixSchematic();
  this.board = new bleepsixBoard();

  /*
  // Global index.  Will be updated by communcation back to central DB. 
  // Initially set to -1 to indicate we don't know what the absolute index is.
  //
  this.opHistoryIndex = -1;  

  // local parameters for unde/redo history.
  //
  this.opHistoryStart = 0;
  this.opHistoryEnd = -1;

  this.opHistory = [];
  */
  this.op = new bleepsixSchBrdOp( this.schematic, this.board );

  //this.palette = new guiPalette();

  this.mouse_left_down = false;
  this.mouse_center_down = false;
  this.mouse_right_down = false;

  this.mouse_start_x = 0;
  this.mouse_start_y = 0;
  this.mouse_cur_x = 0;
  this.mouse_cur_y = 0;

  this.queued_display_component = 0;

  if (!schControllerHeadless)
  {
    this.tool = new toolNav ();
    this.tabCommunication = new bleepsixTabCommunication();
  }
  
  this.moving = false;
  this.movingLibrary = false;
  this.movingToolbox = false;
  this.movingGrid = false;
  this.movingAction = false;

  this.movingDebug = false;

  this.capState = "unknown";

  this.display_text_flag = true;
  this.display_text = "bleep";

  this.schematicUpdate = false;

  this.project_name_text_flag = true;
  this.project_name_text = "no name";

  var d = new Date();
  var curt = d.getTime();

  this.action_text_flag = true;
  this.action_text = "init";
  this.action_text_fade  = { sustainDur : 1500, dropoffDur : 500, T : 0, lastT: curt };

  this.drawSnapArea = false;
}

bleepsixSchematicController.prototype.opCommand = function ( msg )
{
  var delComponentList = [];
  if ((msg.action == "delete") && (msg.type == "group"))
  {

    for (var ind in msg.id)
    {
      var sch_ele_ref = this.schematic.refLookup( msg.id[ind] );
      if (sch_ele_ref.type != "component") continue;
      delComponentList.push( { id: msg.id[ind], type: sch_ele_ref.type } );
    }

  }

  this.op.opCommand( msg );
  this.schematicUpdate = true;

  if (!schControllerHeadless)
    g_painter.dirty_flag = true;

  if (!("scope" in msg))
    msg.scope = "network";

  if (g_schnetwork && (msg.scope == "network") )
  {
    g_schnetwork.projectop( msg );
  }


  // If we've added a component, we need to add an 'unknown'
  // footprint to the board side
  //
  if ( (msg.action == "add") && (msg.type == "componentData") )
  {

    var comp_ref = this.schematic.refLookup( msg.id );

    if ( (!comp_ref.reference.match( /^#PWR/ )) &&
         (!comp_ref.reference.match( /^#FLG/ )) )
    {

      var module = 
        this.board.makeUnknownModule( 1000, 
                                      comp_ref.id, 
                                      [ comp_ref.text[0].id, comp_ref.text[1].id ] );
      module.text[0].text = comp_ref.text[0].text;
      module.text[0].visible = comp_ref.text[0].visible;

      module.text[1].text = comp_ref.text[1].text;
      module.text[1].visible = comp_ref.text[1].visible;

      var brdop = { source: "sch", destination: "brd" };
      brdop.scope = msg.scope;
      brdop.action = msg.action;
      brdop.type = "footprintData";
      brdop.data = { footprintData: module , x: 0, y: 0 };
      brdop.id = comp_ref.id;
      brdop.idText = [ comp_ref.text[0].id, comp_ref.text[1].id ] ;
      this.op.opCommand( brdop );

      if ( g_schnetwork && (msg.scope == "network") )
      {
        g_schnetwork.projectop( brdop );
      }

    }

  }

  // We change the reference or name, we should propagate it through
  // to the board side.
  //
  else if ((msg.action == "update") && (msg.type == "edit"))
  {
    console.log("update edit NOT IMPLEMENTED YET");
    /*
    var comp_ref = this.schematic.refLookup( msg.id );
    var module = 
      this.board.makeUnknownModule( 1000, 
                                    comp_ref.id, 
                                    [ comp_ref.text[0].id, comp_ref.text[1].id ] );
    module.text[0].text = comp_ref.text[0].text;
    module.text[0].visible = comp_ref.text[0].visible;

    module.text[1].text = comp_ref.text[1].text;
    module.text[1].visible = comp_ref.text[1].visible;

    var brdop = { source: "sch", destination: "brd" };
    brdop.scope = msg.scope;
    brdop.action = msg.action;
    brdop.type = "footprintData";
    brdop.data = { footprintData: module , x: 0, y: 0 };
    brdop.id = comp_ref.id;
    brdop.idText = [ comp_ref.text[0].id, comp_ref.text[1].id ] ;
    this.op.opCommand( brdop );
    */

  }

  // Delete the component -> delete the footprint
  //
  else if ((msg.action == "delete") && (msg.type == "group"))
  {

    var brdop = { source: "sch", destination: "brd" };
    brdop.scope = msg.scope;
    brdop.action = msg.action;
    brdop.type = "group";
    brdop.id = [];
    brdop.data = { element : [] }

    for ( var ind in delComponentList )
    {
      brdop.id.push( delComponentList[ind].id );
      var clonedData = simplecopy( this.board.refLookup( delComponentList[ind].id ) );
      brdop.data.element.push( clonedData );
    }

    if (brdop.id.length > 0)
    {
      this.op.opCommand( brdop );
      if ( g_schnetwork && (msg.scope == "network") )
        g_schnetwork.projectop( brdop );
    }


  }

  // After all udpates and delete, propagate the net information .
  // Order is important as the board needs to have it's sister
  // schematic updated with the netmap.
  //
  //TESTING

  //var sch_net_code_map = this.schematic.constructNet();

  this.schematic.constructNet();
  var sch_net_code_map = this.schematic.getPinNetMap();

  var net_op = { source: "sch", destination: "sch" };
  net_op.action = "update";
  net_op.type = "net";
  net_op.data = sch_net_code_map;

  //console.log("TESTING");
  //console.log(net_op);
  this.op.opCommand( net_op );

  var brd_net_op = { source: "sch", destination: "brd" };
  brd_net_op.action = "update";
  brd_net_op.type = "schematicnetmap";
  //brd_net_op.data = sch_net_code_map;
  this.op.opCommand( brd_net_op );

  if (g_schnetwork && (msg.scope == "network") )
  {

    g_schnetwork.projectop( net_op);
    g_schnetwork.projectop( brd_net_op);

  }



  /*
  if (   ((msg.action == "add") ||
          (msg.action == "delete"))
      && ((msg.type == "componentData") ||
          (msg.type == "component") ||
          (msg.type == "group")) )
  {
    console.log("ref_lookup:");
    console.log( this.schematic.ref_lookup );
    console.log( this.schematic.kicad_sch_json );
    console.log("  returned id " + msg.id + ", got ref:");

    var comp_ref = this.schematic.refLookup( msg.id );
    console.log(comp_ref);

    var module = 
      this.board.makeUnknownModule( 1000, 
                                    comp_ref.id, 
                                    [ comp_ref.text[0].id, comp_ref.text[1].id ] );
    console.log("created unknown module:");
    console.log(module);

    module.text[0].text = comp_ref.text[0].text;
    module.text[0].visible = comp_ref.text[0].visible;

    module.text[1].text = comp_ref.text[1].text;
    module.text[1].visible = comp_ref.text[1].visible;

    var brdop = { source: "sch", destination: "brd" };
    brdop.scope = msg.scope;
    brdop.action = msg.action;
    brdop.type = "footprintData";
    brdop.data = { footprintData: module , x: 0, y: 0 };
    brdop.id = comp_ref.id;
    brdop.idText = [ comp_ref.text[0].id, comp_ref.text[1].id ] ;
    this.op.opCommand( brdop );

    if ( g_schnetwork && (msg.scope == "network") )
    {
      g_schnetwork.projectop( brdop );
    }

    console.log("finishing up controller opCommand, checking module existence");
    console.log( this.board.refLookup( comp_ref.id ) );
    console.log( this.board.refLookup( module.id ) );

  }
  */

}


//--------------------------------------

bleepsixSchematicController.prototype.highlightBoardNetsFromSchematic= function ( sch_ncs )
{
  var sch = this.schematic.kicad_sch_json.element;
  var msg = "";

  for (var ii in sch_ncs )
  {
    var sch_nc = sch_ncs[ii];
    if (msg.length > 0) msg += ".";
    msg += sch_nc.toString();
  }

  if ( msg.length > 0 )
    this.tabCommunication.addMessage( "brd:" + g_schnetwork.projectId, msg );
  else
    this.tabCommunication.addMessage( "brd:" + g_schnetwork.projectId, "" );
}


//--------------------------------------

bleepsixSchematicController.prototype.opUndo = function ( )
{
  this.op.opUndo();
  this.schematicUpdate = true;
  g_painter.dirty_flag = true;
}

bleepsixSchematicController.prototype.opRedo = function ( )
{
  this.op.opRedo();
  this.schematicUpdate = true;
  g_painter.dirty_flag = true;
}



bleepsixSchematicController.prototype.fadeMessage = function ( msg )
{
  var d = new Date();
  var curt = d.getTime();

  this.action_text = msg;
  this.action_text_fade.T = 0;
  this.action_text_fade.lastT = curt;
}

bleepsixSchematicController.prototype.redraw = function ()
{
  var action_text_touched = false;
  var action_text_val = 0.0;

  var at_s = 0.4;

  if ( g_schnetwork )
  {
    if ( g_schnetwork.projectId )
    {
      //this.tabCommunication.setId( "sch:" + g_schnetwork.projectId );
      var channelName = "sch:" + g_schnetwork.projectId;

      if (this.tabCommunication.hasNewMessage( channelName ))
      {
        msg = this.tabCommunication.processMessage( channelName );

        if (msg.length > 0)
          this.schematic.highlightNet( msg.split('.') );
        else
          this.schematic.unhighlightNet();

        g_painter.dirty_flag = true;
      }
    }
  }


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


  if ( g_painter.dirty_flag )
  {
    g_painter.startDraw();
    g_painter.drawGrid();

    if (this.schematic.displayable)
      this.schematic.drawSchematic ();

    this.tool.drawOverlay();

    g_painter.endDraw ();
	
    g_painter.context.setTransform ( 1, 0, 0, 1, 0, 0 );
    this.guiPalette.drawChildren();

    this.guiToolbox.drawChildren();
    this.guiLibrary.drawChildren();

    this.guiGrid.drawChildren();

    g_painter.context.setTransform ( 1, 0, 0,  1, 0, 0 );

    if (this.display_text_flag)
      g_painter.drawText(this.display_text, 10, 680, "rgba(0,0,0,0.4)", 15);

    if (this.project_name_text_flag)
      g_painter.drawText(this.project_name_text, 30, 10, "rgba(0,0,0,0.4)", 15);


    if (action_text_touched)
      g_painter.drawText(this.action_text, 10, 650, "rgba(0,0,0," + action_text_val + ")", 15);

    g_painter.dirty_flag = false;

    g_painter.context.setTransform ( 1, 0, 0, 1, 0, 0 );

    if (this.drawSnapArea)
    {
      var lw = 5;
      var ww = 900 + 2*lw;
      var hh = 525 + 2*lw;
      var xx = 50 - lw;
      var yy = 50 - lw;

      g_painter.drawRectangle( xx, yy, ww, hh, lw, "rgba(0,0,0,0.2)", false );
    }


  }

}

/*
function relMouseCoords(ev)
{
  var totalOffsetX = 0;
  var totalOffsetY = 0;
  var canvasX = 0;
  var canvasY = 0;
  var currentElement = this;

  do {
    totalOffsetX += currentElement.offsetLeft - currentElement.scrollLeft;
    totalOffsetY += currentElement.offsetTop - currentElement.scrollTop;
  }
  while (currentElement = currentElement.offsetParent);

  canvasX = ev.pageX - totalOffsetX;
  canvasY = ev.pageY - totalOffsetY;

  return { x : canvasX, y : canvasY };
}

HTMLCanvasElement.prototype.relMouseCoords = relMouseCoords;
*/

bleepsixSchematicController.prototype.canvas_coords_from_global = function( x, y ) 
{
  var rect = this.canvas.getBoundingClientRect();
  var rl = rect.left;
  var rt = rect.top;

  var scrollx = window.scrollX;
  var scrolly = window.scrollY;

  return [ x - rl - scrollx, y - rt - scrolly ];
}

bleepsixSchematicController.prototype.mouseEnter = function( x, y ) 
{
}

bleepsixSchematicController.prototype.mouseLeave = function( x, y ) 
{
}



bleepsixSchematicController.prototype.keyDown = function( keycode, ch, ev )
{
  if (typeof this.tool.keyDown !== 'undefined' )
  {
    r = this.tool.keyDown( keycode, ch, ev );
    return r;
  }

}


bleepsixSchematicController.prototype.keyDown = function( keycode, ch, ev )
{
  if ( ch == 'G' ) {      
      //this.moving = !this.moving;
  }
  else if (ch == 'O')
  {
    //this.movingLibrary = !this.movingLibrary;
  }
  else if (ch == 'P')
  {
    //this.movingToolbox = !this.movingToolbox;
  }
  else if (ch == 'I')
  {
    //this.movingGrid = !this.movingGrid;
  }
  else if (ch == 'U')
  {
    //this.movingAction = !this.movingAction;
  }
  else if (ch == 'Y')
  {
    //this.movingDebug = !this.movingDebug;
  }

  /*
  else if (ch == '9')
  {
    console.log("adding 'R' component to palette");

    var guicomp = new guiPaletteComponent( "test", "R" );
    this.guiPalette.addChild( guicomp );

    g_painter.dirty_flag = true;
  }
  */

  var r = true;

  if (typeof this.tool.keyDown !== 'undefined' )
  {
    r = this.tool.keyDown( keycode, ch, ev );
  }

  return r;

}

bleepsixSchematicController.prototype.keyPress = function( keycode, ch, ev )
{
  //console.log( "keyPress: " + keycode + " " + ch  );

  if (typeof this.tool.keyPress !== 'undefined' )
    this.tool.keyPress( keycode, ch, ev );
}


bleepsixSchematicController.prototype.mouseDown = function( button, x, y ) 
{


  //this.root.hitTest(x, y);

  if (this.guiPalette.hitTest(x, y))
  {
    //console.log(" gui component hit, letting it handle it");
    return;
  }

  if (this.guiLibrary.hitTest(x,y))
  {
    this.guiLibrary.mouseDown(button, x, y);
    return;
  }

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
    this.tool.mouseDown ( button, x, y );
}

bleepsixSchematicController.prototype.doubleClick = function( e )
{
  if (this.guiToolbox.hitTest( this.mouse_cur_x, this.mouse_cur_y ))
  {
    this.guiToolbox.doubleClick( e, this.mouse_cur_x, this.mouse_cur_y  );
    return;
  }

  if (typeof this.tool.doubleClick !== 'undefined' )
    this.tool.doubleClick( e, this.mouse_cur_x, this.mouse_cur_y )
}

bleepsixSchematicController.prototype.mouseUp = function( button, x, y ) 
{
  if (typeof this.tool.mouseUp !== 'undefined' )
    this.tool.mouseUp ( button, x, y );
}

bleepsixSchematicController.prototype.mouseMove = function( x, y ) 
{
  this.mouse_cur_x = x;
  this.mouse_cur_y = y;

  if ( this.moving ) 
    this.guiPalette.move(x, y);

  if (this.movingLibrary)
    this.guiLibrary.move(x, y);

  if (this.movingToolbox)
    this.guiToolbox.move(x,y);

  if (this.movingGrid)
    this.guiGrid.move(x,y);
  
  /*
  if (this.movingAction)
    this.guiAction.move(x,y);
    */

  //if (this.movingDebug) this.guiTextboxTest.move(x,y);

  
  if ( this.schematic.displayable )
  {
    if (typeof this.tool.mouseMove !== 'undefined' )
      this.tool.mouseMove ( x, y );
  }
}

bleepsixSchematicController.prototype.mouseDrag = function( dx, dy ) 
{

  if (typeof this.tool.mouseDrag !== 'undefined' )
    this.tool.mouseDrag ( x, y );
}

bleepsixSchematicController.prototype.mouseWheel = function( delta )
{
  var x = this.mouse_cur_x;
  var y = this.mouse_cur_y;

  if (this.guiLibrary.hitTest(x, y))
  {
    this.guiLibrary.mouseWheelXY(delta, x, y);
  }
  else if (typeof this.tool.mouseWheel !== 'undefined' )
  {
    this.tool.mouseWheel ( delta );
  }

}

bleepsixSchematicController.prototype.init = function( canvas_id ) 
{
  this.canvas = $("#" + canvas_id)[0];
  this.context = this.canvas.getContext('2d');

  /* hmm, guiPalette needs to know about g_controller.... */
  this.guiPalette = new guiPalette( "palette" );
  this.guiPalette.move( (g_painter.width - this.guiPalette.width)/4, g_painter.height - this.guiPalette.height );

  this.guiToolbox = new guiToolbox( "toolbox" );

  this.guiToolbox.move( 0, 200);
  this.guiToolbox.defaultSelect();

  this.guiGrid = new guiGrid( "grid", "rgba(0,0,0,0.2)" );
  this.guiGrid.move(0,0);

  //EXPERIMENTAL
  //this.guiLibrary = new guiLibrary( "library" );

  /*
  var userId = $.cookie("userId");
  var sessionId = $.cookie("sessionId");
  var projectId = $.cookie("recentProjectId");
  */
  var userId = ( g_schnetwork ? g_schnetwork.userId : undefined );
  var sessionId = ( g_schnetwork ? g_schnetwork.sessionId : undefined );
  var projectId = ( g_schnetwork ? g_schnetwork.projectId : undefined );
  this.guiLibrary = new guiLibrary( "library", userId, sessionId, projectId );

  this.guiLibrary.move( g_painter.width - this.guiLibrary.width, 0);

  var controller = this;

  $(canvas_id).focus( function(ev) {
  });

  $(canvas_id).mouseup( function(e) {
    var xy = controller.canvas_coords_from_global( e.pageX, e.pageY );
    controller.mouseUp( e.which , xy[0], xy[1] );
  });

  $(canvas_id).mousedown( function(e) {
    var xy = controller.canvas_coords_from_global( e.pageX, e.pageY );
    controller.mouseDown( e.which, xy[0], xy[1] );
  });

  $(canvas_id).mouseover( function(e) {
  });

  $(canvas_id).mouseenter( function(e) {
    var xy = controller.canvas_coords_from_global( e.pageX, e.pageY );
    controller.mouseEnter( xy[0], xy[1] );
  });

  $(canvas_id).mouseleave( function(e) {
    var xy = controller.canvas_coords_from_global( e.pageX, e.pageY );
    controller.mouseLeave( xy[0], xy[1] );
  });

  $(canvas_id).mousemove( function(e) {
    var xy = controller.canvas_coords_from_global( e.pageX, e.pageY );
    controller.mouseMove( xy[0], xy[1] );
  });

  $(canvas_id).mousewheel( function(e, delta, detlax, deltay) {
    controller.mouseWheel( delta );
    return false;
  });

  $(canvas_id).click( function(e) {
  });

  $(canvas_id).dblclick( function(e) {
    controller.doubleClick(e);
  });

  $(canvas_id).keypress( function(e) {
  });

  $(canvas_id).keydown( function(e) {
    var key = ( e.which ? e.which : e.keyCode );
    var ch = String.fromCharCode(key);

    this.capState = $(window).capslockstate("state");

    return controller.keyDown( e.keyCode, ch, e );
  });

  $(canvas_id).keyup( function(e) {
    var key = e.which;
    var ch = String.fromCharCode(key);
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
    controller.capState = "on";
  });

  $(window).bind("capsOff", function(e) {
    controller.capState = "off";
  });

  $(window).bind("capsUnknown", function(e) {
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
  this.schematic.init ( g_painter );
}

if (typeof module !== 'undefined')
{
  module.exports = bleepsixSchematicController;
}
