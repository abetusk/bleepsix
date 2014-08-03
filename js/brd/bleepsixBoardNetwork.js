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

/*
 * This class is intended to encapsulate the functions
 * to send periodic updates and communcation back to the
 * central server.
 *
 * We will make a persistent socket.io connection and send
 * board updates for automatic saving.
 *
 */

/* The hope is that we can keep the session information and
 * network communication localized to this class.
 *
 * This class assumes cookies are setup (along with the aux.js
 * file loaded for some other functions).  This will set cookies
 * appropriately and worry about the network (socket.io) connection.
 *
 * Hopefully gutting this class (or just not including it) in the main
 * app will have no effect on core functionality.  Download should
 * also be separate because it pushes the local json description
 * to a cgi that then gets processed and downloaded.  Though
 * files should be saved and loaded through this facility, boards
 * should be stored local to the browser and be able to be pushed 
 * without this class functioning.
 *
 */


function bleepsixBoardNetwork( serverURL )
{

  serverURL = ( (typeof serverURL === 'undefined') ? 'https://localhost' : serverURL );

  this.socket = null;
  this.serverURL = serverURL;
  this.connected = false;
  this.userId = null;
  this.userName = null;
  this.sessionId = null;
  this.projectId = null;
  this.projectName = null;

  //this.boardId = null;

  this.messageq = [];

  this.newProjectFlag = false;

  this.anonymous = false;
  this.authenticated = false;
  this.initialized = false;
  this.connected = false;

  this.socket = io.connect( this.serverURL );

  this.fail_count = 0;
  this.fail_max = 20;

  this.json_brd = null;
  this.json_sch = null;


  var p = this;
  this.socket.on('connect', 
      function() { /* console.log("connect!"); */ p.init();  });
  this.socket.on('connect_error', 
      function(x,y) { console.log("connect_error?"); console.log(x); console.log(y); });
  this.socket.on('connect_timeout', 
      function(x,y) { console.log("connect_timeout?"); console.log(x); console.log(y); });

  this.socket.on('reconnect', 
      function(x,y) { console.log("reconnect?"); console.log(x); console.log(y); });
  this.socket.on('reconnect_error', 
      function(x,y) { console.log("reconnect_error?"); console.log(x); console.log(y); });
  this.socket.on('reconnect_timeout', 
      function(x,y) { console.log("reconnect_timeout?"); console.log(x); console.log(y); });

  this.socket.on('disconnect', 
      function(x,y) { console.log("disconnect!"); p.connected = false; });

  this.socket.on('error', 
      function(x,y) { console.log("error?"); console.log(x); console.log(y); });

  /*
  this.socket.on( "mew", 
      function(data) { p.mewResponse( data ); } );
  this.socket.on( "meow", 
      function(data) { p.meowResponse( data ); } );
      */

  /*
  this.socket.on( "newproject", 
      function(data) { p.newprojectResponse( data ); } );
      */

  this.socket.on( "projectauth",
      function(data) { p.projectauthResponse( data ); } );
  this.socket.on( "projectsnapshot",
      function(data) { p.projectsnapshotResponse( data ); } );
  this.socket.on( "projectflush", 
      function(data) { p.projectflushResponse( data ); } );
  this.socket.on( "projectop", 
      function(data) { p.projectopResponse( data ); } );

  this.socket.on( "anonymouscreate", 
      function(data) { p.anonymousCreateResponse( data ); } );


  this.socket.on( "debug", 
      function(data) { console.log("got debug message:"); console.log(data); });



  //setInterval( function() { p.slowSync(); }, 3000 );

}

bleepsixBoardNetwork.prototype.slowSync = function()
{
  if (g_board_controller.boardUpdate)
  {
    this.projectflush();

    g_board_controller.fadeMessage( "saved" );
    g_board_controller.boardUpdate = false;
  }

}


bleepsixBoardNetwork.prototype.clear  = function ( )
{
  this.socket = null;
  this.serverURL = null;
  this.userId = null;
  this.userName = null;
  this.sessionId = null;
  this.projectId = null;
  this.projectName = null;

  //this.boardId = null;

  this.messageq = [];

  this.connected = false;
  this.newProjectFlag = false;

  this.anonymous = false;
  this.authenticated = false;
  this.initialized = false;
  this.connected = false;

  this.usingRecentSchematiFlag = false;
  this.usingUrlSchematiFlag = false;

  this.dirty_flag = false;

}


// If we get called, we know we've got a connection
//
// If we have a boardId, use it, else create a new one
// If we have a userId and sessionId, use it, else
//   try to get an anonymous account
//
bleepsixBoardNetwork.prototype.init = function()
{
  this.connected = true;

  this.userId       = $.cookie("userId");
  this.sessionId    = $.cookie("sessionId");
  this.userName     = $.cookie("userName");

  //this.boardId = $(document).getUrlParam("sch");
  //if (!this.boardId)
  //  this.boardId = undefined;

  this.projectId = $(document).getUrlParam("project");
  if (!this.projectId)
    this.projectId = undefined;

  // No userId or sessionId, we assume an anonymous connection
  //
  if ( ( typeof this.userId     === 'undefined' ) ||
       ( typeof this.sessionId  === 'undefined' ) )
  {
    this.anonymous = true;

    // this will create an anonymous user, create a sessionId for the
    // anonymous user and create a new project with a projectId 
    // for us to use.
    //
    this.socket.emit( "anonymouscreate" );
    return;
  }

  // Else we've got a userId and sessionId, so we need to see if the userId
  // and sessionId are actually valid.  Send a 'meow' probe and wait for a
  // 'mew' response to proceed.
  //
  //DEBUG
  //console.log("userId: " + this.userId + ", sessionId: " + this.sessionId );

  // If we don't have a projectId, then we emit a meow and will 
  // request a new projectId on authenticated 'mew' response.
  // Otherwise, will generate an anonymous login.
  //
  if ( typeof this.projectId === 'undefined')
  {
    if ($.cookie("recentProjectId"))
    {
      this.projectId = $.cookie("recentProjectId");
      this.usingRecentProjectFlag = true;

      //g_board_controller.guiLibrary.fetchFootprintList( this.userId, this.sessionId, this.projectId );
      g_board_controller.guiFootprintLibrary.fetchModuleLibrary( this.userId, this.sessionId, this.projectId );
      load_footprint_location( this.userId, this.sessionId, this.projectId );

      this.socket.emit("projectauth", { userId: this.userId, sessionId:this.sessionId, projectId: this.projectId });
      return;
    }

    // get the most recent project
    // if no most recent project, create a random one
    //

    //console.log("CHECKPOINT");

    var container = {
      type : "startupProject",
      userId : this.userId,
      sessionId : this.sessionId,
      data: "nop"
    };

    var xx = this;
    var str_data = JSON.stringify( container );
    $.ajax({
      type: "POST",
      url: "meowDataManager.py",
      data: str_data,
      success: function(data) { xx.loadStartupProject(data); },
      error: function( jqxhr, status, err) {
        console.log("error posting load recent project");
        console.log(jqxhr);
        console.log(status);
        console.log(err);
      }
    });

  }
  else
  {
    this.usingUrlProjectFlag = true;
    this.socket.emit("projectauth", { userId: this.userId, sessionId:this.sessionId, projectId: this.projectId});
  }

}

bleepsixBoardNetwork.prototype.loadStartupProject = function( data )
{

  if ((data) && (data.type == "success"))
  {
    this.projectId = data.projectId;

    this.socket.emit("projectauth", { userId: this.userId, sessionId:this.sessionId, projectId: this.projectId });


  }
}


bleepsixBoardNetwork.prototype.newprojectResponse = function( data )
{

  if (!data)
  {
    console.log("ERROR: bleepsixBoardNetowrk.newprojectResponse: got null data");
    return;
  }

  var typ = data.type;
  var stat = data.status;
  var msg = data.message;
  var projId = data.projectId;

  if ((typ != "response") || (stat != "success"))
  {
    console.log("ERROR: bleepsixBoardNetowrk.newprojectResponse: got '" + msg + "'");
    return;
  }

  this.projectId    = projId;
  $.cookie("recentProjectId",   this.projectId,   {expires:365, path:'/', secure:true });

  var msg = {};
  msg.userId        = this.userId;
  msg.sessionId     = this.sessionId;
  msg.projectId     = this.projectId;

  this.socket.emit( "projectsnapshot", msg );
}


//------------------------

bleepsixBoardNetwork.prototype.startLoadWaterfall = function()
{
  var cb = (function(xx) { 
    return function(data) { 
      xx.loadLocationWaterfall( data );
    } ;
  })(this);

  g_board_controller.guiFootprintLibrary.fetchModuleLibrary( this.userId, this.sessionId, this.projectId, cb );
}

bleepsixBoardNetwork.prototype.loadLocationWaterfall = function(data)
{
  g_board_controller.guiFootprintLibrary.load_webkicad_module_json(data);

  var cb = (function(xx) {
    return function(data) {
      xx.loadBoardWaterfall(data);
    };
  })(this);

  load_footprint_location( this.userId, this.sessionId, this.projectId, cb );
}

bleepsixBoardNetwork.prototype.loadBoardWaterfall = function(data)
{
  g_footprint_location = data;
  g_footprint_location_ready = true;

  this.loadBoardWaterfallEnd();

}

bleepsixBoardNetwork.prototype.loadBoardWaterfallEnd = function()
{

  if (this.json_brd && this.json_sch) {
    this.refreshBoardState( this.json_brd, this.json_sch );
  } else {

    console.log("board, waiting for json_brd and json_sch to be non-null");
    setTimeout( (function() { return function() { xx.loadBoardWaterfallEnd(); } })(this), 500 );

  }

}


//------------------------

bleepsixBoardNetwork.prototype.projectauthResponse = function( data )
{

  this.fail_count++;
  if (this.fail_count >= this.fail_max)
  {
    console.log("ERROR: bleepsixBoardNetwork.projectauthResponse  too many tries, bailing out");
    console.log(data);
    return;
  }

  if (data && (data.type == "response") && (data.status == "success") )
  {
    this.projectName = data.projectName;

    $.cookie("recentProjectId",     data.projectId, {expires:365, path:'/', secure:true });
    g_board_controller.project_name_text = this.userName + " / " + this.projectName;

    this.startLoadWaterfall();
    //g_board_controller.guiFootprintLibrary.fetchModuleLibrary( this.userId, this.sessionId, this.projectId );
    //load_footprint_location( this.userId, this.sessionId, this.projectId );

    this.projectsnapshot();
  }
  else if ( (this.usingRecentProjectFlag) ||
            (this.usingUrlProjectFlag) )
  {

    if (this.usingUrlProjectFlag)
    {
      window.history.replaceState( {}, 'title', '/bleepsix_brd' );
    }

    // We don't have a valid userid/sessionid, login anonymously
    //
    if ( data.message.match(/thentication failure/) )
    {
      this.socket.emit( "anonymouscreate" );
      return;
    }

    var container = {
      type : "startupProject",
      userId : this.userId,
      sessionId : this.sessionId,
      data: "nop"
    };

    var xx = this;
    var str_data = JSON.stringify( container );

    $.ajax({
      type: "POST",
      url: "meowDataManager.py",
      data: str_data,
      success: function(data) { xx.loadStartupProject(data); },
      error: function( jqxhr, status, err) {
        console.log("error posting load recent project");
        console.log(jqxhr);
        console.log(status);
        console.log(err);
      }
    });

  }

}

bleepsixBoardNetwork.prototype.projectsnapshot = function()
{
  var msg = {};
  msg.userId = this.userId;
  msg.sessionId = this.sessionId;
  msg.projectId = this.projectId;
  this.socket.emit( "projectsnapshot", msg );
}

bleepsixBoardNetwork.prototype.fetchModule = function( name, location, callback, callback_err )
{

  if (typeof callback_err === 'undefined')
  {
    callback_err = (function(a) {
      return function(jqxhr, textStatus, error) {
        callback_err(a, jqxhr, textStatus, error);
      };
    })(location);
  }

  var req = { op: "MOD_ELE", name: name, location: location };
  if ( (this.userId) &&
       (this.sessionId) &&
       (this.projectId) )
  {
    req.userId = this.userId;
    req.sessionId = this.sessionId;
    req.projectId = this.projectId;
  }

  $.ajaxSetup({ cache : false });

  $.ajax({
    url: "cgi/libmodmanager.py",
    type: "POST",
    data: JSON.stringify(req),
    success:
    ( function(a) {
        return function(data) {
          callback(a, data);
        }
      }
    )(name),
    error:
    ( function(a) {
        return function(jqxhr, textStatus, error) {
          callback_err(a, jqxhr, textStatus, error);
        }
      }
    )(location)
  });

}

bleepsixBoardNetwork.prototype.refreshBoardState = function( json_brd, json_sch )
{
  this.json_brd = json_brd;
  this.json_sch = json_sch;

  g_board_controller.board.load_board( json_brd );
  g_board_controller.schematic.load_schematic( json_sch );

  var netop = { source: "brd", destination: "sch" };
  netop.scope = "local";

  netop.action = "update";
  netop.type = "schematicnetmap";
  g_board_controller.op.opCommand( netop );

  var map = g_board_controller.board.kicad_brd_json.brd_to_sch_net_map;
  g_board_controller.board.updateRatsNest( undefined, undefined, map );

}

bleepsixBoardNetwork.prototype.projectsnapshotResponse = function( data )
{

  if (!data)
  {
    console.log("projectsnapshot response error, got null data");
    return;
  }

  var typ = data.type;
  var stat = data.status;
  var rmsg = data.message;
  var data = data.data;

  if ( (typ != "response") || (stat != "success") )
  {

    console.log("ERROR: projectsnapshot response error, got data:");
    console.log(data);
    return;
  }

  try {
    var json_sch = JSON.parse(data.json_sch);
    var json_brd = JSON.parse(data.json_brd);
  }
  catch (err)
  {
    console.log("ERROR: parse error:");
    console.log(err);
    return;
  }

  this.refreshBoardState( json_brd, json_sch );

  /*
  g_board_controller.board.load_board( json_brd );
  g_board_controller.schematic.load_schematic( json_sch );

  var netop = { source: "brd", destination: "sch" };
  //netop.scope = msg.scope;
  netop.scope = "local";

  netop.action = "update";
  netop.type = "schematicnetmap";
  g_board_controller.op.opCommand( netop );

  var map = g_board_controller.board.kicad_brd_json.brd_to_sch_net_map;
  g_board_controller.board.updateRatsNest( undefined, undefined, map );
  */

}

bleepsixBoardNetwork.prototype.projectflushResponse = function( data )
{
  //DEBUG
  console.log("projectflushResponse:");
  console.log(data);
}



bleepsixBoardNetwork.prototype.projectflush = function( data )
{
  var msg = {};
  msg.userId = this.userId;
  msg.sessionId = this.sessionId;
  msg.projectId = this.projectId;

  msg.json_sch = JSON.stringify( g_board_controller.schematic.kicad_sch_json ); 
  msg.json_brd = JSON.stringify( g_board_controller.board.kicad_brd_json ); 

  this.socket.emit( "projectflush", msg );
}

bleepsixBoardNetwork.prototype.projectop = function( msg )
{
  this.socket.emit("projectop", { userId: this.userId, sessionId: this.sessionId, projectId: this.projectId, op : msg } );
}

bleepsixBoardNetwork.prototype.projectopResponse = function( msg )
{

  if (msg.type == "op")
  {
    g_board_controller.op.opCommand( msg.op );
  }

}



bleepsixBoardNetwork.prototype.anonymousCreateResponse = function( data )
{

  if (!data) { console.log("bleepsixBoardNetwork.anonymouseCreateResponse: ERROR: data NULL!"); return; }

  if ( (data.type == "response") && 
       (data.status == "success") )
  {

    this.userId = data.userId;
    this.sessionId = data.sessionId;
    this.projectId = data.projectId;

    $.cookie("userId",      this.userId,    {expires:365, path:'/', secure:true });
    $.cookie("sessionId",   this.sessionId, {expires:365, path:'/', secure:true });
    $.cookie("userName", "anonymous", {expires:365, path:'/', secure:true });

    this.userName = "anonymous";

    $.cookie("recentProjectId",     this.projectId,   {expires:365, path:'/', secure:true });

    this.socket.emit("projectauth", { userId: this.userId, sessionId:this.sessionId, projectId: this.projectId });


  }
  else
  {
    console.log("bleepsixBoardNetwork.anonymousCreateResponse: ERROR: got data:");
    console.log(data);
  }


}

