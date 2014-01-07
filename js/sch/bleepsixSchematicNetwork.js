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

function bleepsixSchematicNetwork( serverURL )
{

  serverURL = ( (typeof serverURL === 'undefined') ? 'https://localhost' : serverURL );

  this.socket = null;
  this.serverURL = serverURL;
  this.connected = false;
  this.userId = null;
  this.sessionId = null;

  this.messageq = [];

  this.socket = io.connect( this.serverURL );


  var p = this;
  this.socket.on('connect', 
      function() { console.log("connect!"); p.init( $.cookie("userId"), $.cookie("sessionId"));  });
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
      function(data) { p.handleMewResponse( data ); } );
  this.socket.on( "meow", 
      function(data) { p.handleMeowResponse( data ); } );
  this.socket.on( "schget", 
      function(data) { p.handleSchgetResponse( data ); } );
  this.socket.on( "schupdate", 
      function(data) { p.handleSchupdateResponse( data ); } );

}

bleepsixSchematicNetwork.prototype.init = function( userId, sessionId )
{

  console.log("init..." + userId + ", " + sessionId );

  this.conncted = false;
  this.userId = userId;
  this.sessionId = sessionId;
  this.socket.emit( "meow", { userId : this.userId, sessionId: this.sessionId  });
}

bleepsixSchematicNetwork.prototype.handleSchgetResponse = function( data )
{
  console.log("schget response, got:");
  console.log(data);
}

bleepsixSchematicNetwork.prototype.handleSchupdateResponse = function( data )
{
  console.log("schupdate response, got:");
  console.log(data);
}

// Failed authentication tracer message
//
bleepsixSchematicNetwork.prototype.handleMeowResponse = function( data )
{
  console.log("meow failure, got:");
  console.log(data);
}

// We send out a 'meow' message and expect a 'mew' response if the authentication
// worked.  This tells us the session is authenticated (that is, we are
// connected) and we can send update requests to the server
//
bleepsixSchematicNetwork.prototype.handleMewResponse = function( data )
{
  if (!data)
  {
    console.log("NULL data in handleMewResponse");
    return;
  }
  if ( (data.status == "success") && (data.type == "response" ) )
  {
    this.connected = true;

    console.log("mow response received");
    console.log("session authenticated, will send updates");
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



