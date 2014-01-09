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
 * schematic updates for automatic saving.
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
 * files should be saved and loaded through this facility, schematics
 * should be stored local to the browser and be able to be pushed 
 * without this class functioning.
 *
 */


bleepsixSchematicNetwork.prototype.clear  = function ( )
{
  this.socket = null;
  this.serverURL = null;
  this.userId = null;
  this.sessionId = null;
  this.schematicId = null;

  this.messageq = [];

  this.connected = false;
  this.newSchematicFlag = false;

  this.anonymous = false;
  this.authenticated = false;
  this.initialized = false;
  this.connected = false;


}

function bleepsixSchematicNetwork( serverURL )
{

  serverURL = ( (typeof serverURL === 'undefined') ? 'https://localhost' : serverURL );

  this.socket = null;
  this.serverURL = serverURL;
  this.connected = false;
  this.userId = null;
  this.sessionId = null;
  this.schematicId = null;

  this.messageq = [];

  this.newSchematicFlag = false;

  this.anonymous = false;
  this.authenticated = false;
  this.initialized = false;
  this.connected = false;

  this.socket = io.connect( this.serverURL );


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

  this.socket.on( "mew", 
      function(data) { p.mewResponse( data ); } );
  this.socket.on( "meow", 
      function(data) { p.meowResponse( data ); } );

  this.socket.on( "newproject", 
      function(data) { p.newprojectResponse( data ); } );
  this.socket.on( "schauth",
      function(data) { p.schauthResponse( data ); } );
  this.socket.on( "schsnapshot",
      function(data) { p.schsnapshotResponse( data ); } );
  this.socket.on( "schfullpush", 
      function(data) { p.schfullpushResponse( data ); } );

  this.socket.on( "anonymous", 
      function(data) { p.anonymousResponse( data ); } );

  /*

  console.log("testing");

  var msg = { 
    userId : $.cookie("userId"),
    sessionId : $.cookie("sessionId"),
    schematicId: "d59281cf-1e74-4b65-f1b4-dc65f6d08e95",
    json_sch : "{ element: [ ] }"
  };

  */

  //console.log(msg);
  //this.socket.emit( "anonymous", msg );
  //this.socket.emit( "newproject", msg );
  //this.socket.emit( "schauth", msg );
  //this.socket.emit( "schfullpush", msg );

  /*
  this.socket.on( "schget", 
      function(data) { p.handleSchgetResponse( data ); } );
  this.socket.on( "schupdate", 
      function(data) { p.handleSchupdateResponse( data ); } );
      */

}

// If we get called, we know we've got a connection
//
// If we have a schematicId, use it, else create a new one
// If we have a userId and sessionId, use it, else
//   try to get an anonymous account
bleepsixSchematicNetwork.prototype.init = function()
{
  this.connected = true;

  this.userId       = $.cookie("userId");
  this.sessionId    = $.cookie("sessionId");

  this.schematicId = $(document).getUrlParam("sch");
  if (!this.schematicId)
    this.schematicId = undefined;

  console.log("bleepsixSchematicNetwork.init: got schematicId: " + this.schematicId );

  //this.schematicId = $.cookie("schematicId");

  // No userId or sessionId, we assume an anonymous connection
  //
  if ( ( typeof this.userId     === 'undefined' ) ||
       ( typeof this.sessionId  === 'undefined' ) )
  {
    //this.userId = -1;
    //this.sessionId = -1;
    this.anonymous = true;

    console.log("getting anonymous credentials");

    // this will create an anonymous user, create a sessionId for the
    // anonymous user and create a new project with a schematicId 
    // for us to use.
    //
    this.socket.emit( "anonymous" );
    return;
  }

  // Else we've got a userId and sessionId, so we need to see if the userId
  // and sessionId are actually valid.  Send a 'meow' probe and wait for a
  // 'mew' response to proceed.
  //
  console.log("userId: " + this.userId + ", sessionId: " + this.sessionId );

  // If we don't have a schematicId, then we emit a meow and will 
  // request a new schematicId on authenticated 'mew' response.
  // Otherwise, will generate an anonymous login.
  //
  if ( typeof this.schematicId === 'undefined')
  {
    console.log("no schematicId, emitting meow");
    this.socket.emit( "meow", { userId : this.userId, sessionId: this.sessionId  });
  }
  else
  {
    console.log("emitting schauth");
    this.socket.emit("schauth", { userId: this.userId, sessionId:this.sessionId, schematicId: this.schematicId });
  }

}


bleepsixSchematicNetwork.prototype.newprojectResponse = function( data )
{
  console.log("newprojectResponse:");
  console.log(data);


  if (!data)
  {
    console.log("bleepsixSchematicNetowrk.newprojectResponse: error occured: got null data");
    return;
  }

  var typ = data.type;
  var stat = data.status;
  var msg = data.message;
  var projId = data.projId;
  var schId = data.schId;
  var brdId = data.brdId;

  if ((typ != "response") || (stat != "success"))
  {
    console.log("bleepsixSchematicNetowrk.newprojectResponse: error occured: got '" + msg + "'");
    return;
  }

  //$.cookie("schematicId",   schId,  { path: '/', secure: true } );
  //$.cookie("boardId",       schId,  { path: '/', secure: true } );
  //$.cookie("projectId",     projId, { path: '/', secure: true } );

  this.projectId    = projId;
  this.schematicId  = schId;
  this.boardId      = brdId;

  var msg = {};
  msg.userId        = this.userId;
  msg.sessionId     = this.sessionId;
  msg.schematicId   = this.schematicId;

  this.socket.emit( "schsnapshot", msg );
}


bleepsixSchematicNetwork.prototype.schauthResponse = function( data )
{
  console.log("authschResponse:");
  console.log(data);

  console.log("userId: " + this.userId);
  console.log("sessionid: " + this.sessionId);
  console.log("schematicId: " + this.schematicId);

  this.schsnapshot();
  //this.socket.emit("schsnapshot", { userId: this.userId, sessionId : this.sessionId, schematicId: this.schematicId });
}

bleepsixSchematicNetwork.prototype.schsnapshot = function()
{
  var msg = {};
  msg.userId = this.userId;
  msg.sessionId = this.sessionId;
  msg.schematicId = this.schematicId;
  this.socket.emit( "schsnapshot", msg );
}


bleepsixSchematicNetwork.prototype.schsnapshotResponse = function( data )
{
  console.log("snapshot response:");
  console.log(data);

  if (!data)
  {
    console.log("schsnapshot response error, got null data");
    return;
  }

  console.log("data:");

  var typ = data.type;
  var stat = data.status;
  var rmsg = data.message;
  var data = data.data;

  if ( (typ != "response") && (stat != "success") )
  {
    console.log("schsnapshot response error, got data:");
    console.log(data);
    return;
  }

  //console.log(data);

  var json_data = JSON.parse(data);
  console.log(json_data);

  g_controller.schematic.load_schematic(json_data);

  //g_controller.schematic

}

bleepsixSchematicNetwork.prototype.schfullpushResponse = function( data )
{
  console.log("schfullpushResponse:");
  console.log(data);
}



bleepsixSchematicNetwork.prototype.schfullpush = function( data )
{
  var msg = {};
  msg.userId = this.userId;
  msg.sessionId = this.sessionId;
  msg.schematicId = this.schematicId;
  msg.json_sch = JSON.stringify( g_controller.schematic.kicad_sch_json ); 

  console.log("emitting schfullpush, msg:");
  console.log(msg);

  this.socket.emit( "schfullpush", msg );
}

bleepsixSchematicNetwork.prototype.anonymousResponse = function( data )
{
  console.log("anonymousResponse:");
  console.log(data);
}

// push a 'keyframe'
//
/*
bleepsixSchematicNetwork.prototype.fullpush = function()
{
  var container = { 
    userId : this.userId,
    sessionId: this.sessionId,
    schematicId: this.schematicId,
    type:"fullpush",
    sch_json: g_controller.kicad_sch_json
  };

  this.socket.emit( "schfullopush", container );

}
*/

// handle logout event
//
bleepsixSchematicNetwork.prototype.logout = function()
{
  window.location.href = 'https://localhost/bleepsix/cgi/login';
}

// Handle schauth response
//
bleepsixSchematicNetwork.prototype.handleSchauthResponse = function( data )
{

  if (!data)
  {
    console.log("error on schauth (null data)");
    return;
  }

  if ( data.type == "response" && data.status == "success" )
  {
    console.log("schauth successfull!");

    this.autheneticated = true;
    this.initialized = true;

  }
  else
  {
    console.log("schauth failed!  generate anonymous user");

    this.socket.emit("schanonymous");
  }

}

// Handle schget response
//
bleepsixSchematicNetwork.prototype.handleSchgetResponse = function( data )
{
  console.log("schget response, got:");
  console.log(data);
}

// Handle schget response
//
bleepsixSchematicNetwork.prototype.handleSchupdateResponse = function( data )
{
  console.log("schupdate response, got:");
  console.log(data);
}

// Failed authentication tracer message
//
bleepsixSchematicNetwork.prototype.meowResponse = function( data )
{
  console.log("meow (authentication) failure, got:");
  console.log(data);


  // So, authentication failed...should we create a new anonymous
  // account?
  //
  this.socket.emit( "anonymous" );

  return;

}

// We send out a 'meow' message and expect a 'mew' response if the authentication
// worked.  This tells us the session is authenticated 
// and we can send update requests to the server
//
bleepsixSchematicNetwork.prototype.mewResponse = function( data )
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

    if ( typeof this.schematicId === 'undefined' )
    {

      console.log("user logged in but no current schematic.  asking for new project");
      this.socket.emit("newproject", { userId : this.userId, sessionId : this.sessionId } );
      return;

    }

    console.log("using schematic id: " + this.schematicId);
    this.initialized = true;

  }
  else
  {
    console.log("mew failure, got:");
    console.log(data);
  }
}


bleepsixSchematicNetwork.prototype.update = function( msg )
{
  this.messageq.push( msg );

  if (!this.connected)
  {
    console.log("bleepsixSchematicNetwork.update: not connected, returning");
    return;
  }

  while (this.messageq.length > 0)
  {
    var m = this.messageq.shift();
    this.socket.emit( "schupdate", { userId: this.userId, sessionId: this.sessionId, data: msg } );
  }

}

bleepsixSchematicNetwork.prototype.load = function( schematicId )
{
  if (!this.connected)
  {
    console.log("bleepsixSchematicNetwork.load: not connected, cannot load");
    return;
  }

  this.socket.emit( "schget", { userId: this.userId, sessionId : this.sessionid, schematicId : schematicId } );
}



