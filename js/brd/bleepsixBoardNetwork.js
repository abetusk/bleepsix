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


  var p = this;
  this.socket.on('connect', 
      function() { console.log("connect!"); p.init();  });
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
    console.log("  bleepsixBoardNetwork.slowSync syncing!");

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

  console.log("bleepsixBoardNetwork.init: got projectId: " + this.projectId );

  //this.boardId = $.cookie("boardId");

  // No userId or sessionId, we assume an anonymous connection
  //
  if ( ( typeof this.userId     === 'undefined' ) ||
       ( typeof this.sessionId  === 'undefined' ) )
  {
    //this.userId = -1;
    //this.sessionId = -1;
    this.anonymous = true;

    console.log("getting anonymous credentials (emitting 'anonymouscreate')");

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
  console.log("userId: " + this.userId + ", sessionId: " + this.sessionId );

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

      console.log("have recentProjectId, authentication most recent project id " + this.projectId);

      this.socket.emit("projectauth", { userId: this.userId, sessionId:this.sessionId, projectId: this.projectId });
      return;
    }

    // get the most recent project
    // if no most recent project, create a random one
    //

    console.log("CHECKPOINT");

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
    console.log("projectauth emit");

    this.usingUrlProjectFlag = true;
    this.socket.emit("projectauth", { userId: this.userId, sessionId:this.sessionId, projectId: this.projectId});
  }

}

bleepsixBoardNetwork.prototype.loadStartupProject = function( data )
{
  console.log("loadStartupProject");
  console.log(data);

  if ((data) && (data.type == "success"))
  {

    //console.log("emitting schauth from loadStartupProject");
    console.log("projectauth emit from loadStartupProject");

    this.projectId = data.projectId;

    this.socket.emit("projectauth", { userId: this.userId, sessionId:this.sessionId, projectId: this.projectId });


  }
}


bleepsixBoardNetwork.prototype.newprojectResponse = function( data )
{
  console.log("newprojectResponse:");
  console.log(data);


  if (!data)
  {
    console.log("bleepsixBoardNetowrk.newprojectResponse: error occured: got null data");
    return;
  }

  var typ = data.type;
  var stat = data.status;
  var msg = data.message;
  var projId = data.projectId;

  if ((typ != "response") || (stat != "success"))
  {
    console.log("bleepsixBoardNetowrk.newprojectResponse: error occured: got '" + msg + "'");
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


bleepsixBoardNetwork.prototype.projectauthResponse = function( data )
{
  console.log("projectauthResponse:");
  //console.log(data);

  this.fail_count++;
  if (this.fail_count >= this.fail_max)
  {
    console.log("ERROR: bleepsixBoardNetwork.projectauthResponse  too many tries, bailing out");
    console.log(data);
    return;
  }

  console.log( "fail_count: " + this.fail_count + " / " + this.fail_max );

  if (data && (data.type == "response") && (data.status == "success") )
  {
    this.projectName = data.projectName;

    console.log("userId: " + this.userId);
    console.log("sessionid: " + this.sessionId);
    console.log("projectId: " + this.projectId);
    console.log("projectName: " + this.projectName);

    $.cookie("recentProjectId",     data.projectId, {expires:365, path:'/', secure:true });
    g_board_controller.project_name_text = this.userName + " / " + this.projectName;

    this.projectsnapshot();
  }
  else if ( (this.usingRecentProjectFlag) ||
            (this.usingUrlProjectFlag) )
  {

    if (this.usingUrlProjectFlag)
    {
      window.history.replaceState( {}, 'title', '/bleepsix_sch' );
    }

    // We don't have a valid userid/sessionid, login anonymously
    //
    if ( data.message.match(/thentication failure/) )
    {
      console.log("authentication failure, issuing an anonymouscreate request");

      this.socket.emit( "anonymouscreate" );
      return;
    }

    console.log("DEBUG: bleepsixBoardNetwork.projectauthResponse " +
        "authentication failed, issuing a 'startupProject' request");


    var container = {
      type : "startupProject",
      userId : this.userId,
      sessionId : this.sessionId,
      data: "nop"
    };

    var xx = this;
    var str_data = JSON.stringify( container );

    console.log("sending to meowDataManager");
    console.log(str_data);

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


bleepsixBoardNetwork.prototype.projectsnapshotResponse = function( data )
{
  console.log("projectsnapshot response:");
  //console.log(data);

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
    console.log("projectsnapshot response error, got data:");
    console.log(data);
    return;
  }

  //console.log("projectsnapshotResponse data:");
  //console.log(data.json_sch);
  //console.log(data.json_brd);


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

  g_board_controller.board.load_board( json_brd );
  g_board_controller.schematic.load_schematic( json_sch );

}

bleepsixBoardNetwork.prototype.projectflushResponse = function( data )
{
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

  console.log("emitting projectflush , msg:");
  console.log(msg);

  this.socket.emit( "projectflush", msg );
}

bleepsixBoardNetwork.prototype.projectop = function( msg )
{

  console.log("");
  console.log(" emitting projectop");
  console.log(msg);

  this.socket.emit("projectop", { userId: this.userId, sessionId: this.sessionId, projectId: this.projectId, op : msg } );
}

bleepsixBoardNetwork.prototype.projectopResponse = function( msg )
{
  console.log("bleepsixBoardNetwork.projectopResponse:");
  console.log(msg);

  if (msg.type == "op")
  {
    //console.log("op neutered ");

    console.log("applying op (directly to board op)");
    //g_board_controller.opCommand( msg.op );
    g_board_controller.op.opCommand( msg.op );
  }

}



bleepsixBoardNetwork.prototype.anonymousCreateResponse = function( data )
{
  console.log("anonymousCreateResponse:");
  console.log(data);

  if (!data) { console.log("bleepsixBoardNetwork.anonymouseCreateResponse: ERROR: data NULL!"); return; }

  if ( (data.type == "response") && 
       (data.status == "success") )
  {
    console.log("anonymous create success!");

    this.userId = data.userId;
    this.sessionId = data.sessionId;
    this.projectId = data.projectId;

    console.log("setting cookies");
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

// push a 'keyframe'
//
/*
bleepsixBoardNetwork.prototype.fullpush = function()
{
  var container = { 
    userId : this.userId,
    sessionId: this.sessionId,
    boardId: this.boardId,
    type:"fullpush",
    sch_json: g_board_controller.kicad_sch_json
  };

  this.socket.emit( "schfullopush", container );

}
*/

/*
// handle logout event
//
bleepsixBoardNetwork.prototype.logout = function()
{
  window.location.href = 'login';
}


// Failed authentication tracer message
//
bleepsixBoardNetwork.prototype.meowResponse = function( data )
{
  console.log("meow (authentication) failure, got:");
  console.log(data);


  // So, authentication failed...should we create a new anonymous
  // account?
  //
  this.socket.emit( "anonymouscreate" );

  return;

}

// We send out a 'meow' message and expect a 'mew' response if the authentication
// worked.  This tells us the session is authenticated 
// and we can send update requests to the server
//
bleepsixBoardNetwork.prototype.mewResponse = function( data )
{
  if (!data)
  {
    console.log("NULL data in mewResponse");
    return;
  }

  if ( (data.status == "success") && (data.type == "response" ) )
  {
    this.connected = true;
    this.authenticated = true;

    console.log("mew response received");
    console.log("session authenticated, will send updates");

    if ( typeof this.boardId === 'undefined' )
    {

      console.log("user logged in but no current board.  asking for new project");
      this.socket.emit("newproject", { userId : this.userId, sessionId : this.sessionId } );
      return;

    }

    console.log("using board id: " + this.boardId);
    this.initialized = true;

  }
  else
  {
    console.log("mew failure, got:");
    console.log(data);
  }
}


bleepsixBoardNetwork.prototype.update = function( msg )
{
  this.messageq.push( msg );

  if (!this.connected)
  {
    console.log("bleepsixBoardNetwork.update: not connected, returning");
    return;
  }

  while (this.messageq.length > 0)
  {
    var m = this.messageq.shift();
    this.socket.emit( "schupdate", { userId: this.userId, sessionId: this.sessionId, data: msg } );
  }

}

bleepsixBoardNetwork.prototype.load = function( boardId )
{
  if (!this.connected)
  {
    console.log("bleepsixBoardNetwork.load: not connected, cannot load");
    return;
  }

  this.socket.emit( "schget", { userId: this.userId, sessionId : this.sessionid, boardId : boardId } );
}

*/


