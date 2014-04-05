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


var bleepsixTabCommunicationHeadless = false;
if ( typeof module !== 'undefined')
{
  bleepsixTabCommunicationHeadless = true;
  var bleepsixAux = require("../lib/aux.js");
  var guid = bleepsixAux.guid;
  var s4 = bleepsixAux.s4;
  var simplecopy = bleepsixAux.simplecopy;
}

function bleepsixTabCommunication()
{
  this.id = null;
  this.message = null;
  this.lastMessage = null;
}


bleepsixTabCommunication.prototype.setId = function( id )
{
  this.id = id;
}

bleepsixTabCommunication.prototype.addMessage = function( msg )
{

  if (this.id)
  {
    //$.cookie( "meowmsg:" + this.id, msg );
    localStorage.setItem( "meowmsg:" + this.id, msg );
  }
  else
  {
    console.log("WARNING: bleepsixTabCommunication.addMessage, id not set");
  }

}

bleepsixTabCommunication.prototype.hasNewMessage = function()
{
  //this.message = $.cookie( "meowmsg:" + this.id );
  this.message = localStorage.getItem( "meowmsg:" + this.id );

  //console.log(">>> " + this.lastMessage + ", " + this.message );

  return this.lastMessage != this.message ;
}

bleepsixTabCommunication.prototype.removeMessage = function( msg )
{

  if (this.id)
  {
    $.removeCookie( "meowmsg:" + this.id, msg );
    this.message = null;
    this.lastMessage = null;
  }
  else
  {
    console.log("WARNING: bleepsixTabCommunication.removeMessage, id not set");
  }

}

bleepsixTabCommunication.prototype.processMessage = function( msg )
{

  if (this.id)
  {
    //var x = $.cookie( "meowmsg:" + this.id );
    var x = localStorage.getItem( "meowmsg:" + this.id );
    this.lastMessage = x;
    return x;
  }
  else
  {
    console.log("WARNING: bleepsixTabCommunication.processMessage, id not set");
  }


}

bleepsixTabCommunication.prototype.peekMessage = function()
{

  if (this.id)
  {
    //return $.cookie( "meowmsg:" + this.id );
    return localStorage.getItem( "meowmsg:" + this.id );
  }
  else
  {
    console.log("WARNING: bleepsixTabCommunication.peekMesssage, id not set");
  }

}


