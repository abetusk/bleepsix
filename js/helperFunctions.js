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

function meowmeow()
{
  console.log("\n" +
      '                                 _______ ' + " \n " +
      '            /\\       /\\        /       \\ ' + " \n " +
      '           /  \\_____/  \\      |  /\\/\\   | ' + " \n " +
      '          | ^  !   !  ^ |     |  \\  /   |' + " \n " +
      '         -| /\\   .   /\\ |-    |   \\/    | ' + " \n " +
      '         -|             |-   /_________/' + " \n " +
      '           \\___;___;___/     ' + " \n " +
      '                                ____    _    ____  ' + " \n " +
      '  _ __ ___   ___  _____      __/ ___|  / \\  |  _ \\ ' + " \n " +
      ' | \'_ ` _ \\ / _ \\/ _ \\ \\ /\\ / / |     / _ \\ | | | |' + " \n " +
      ' | | | | | |  __/ (_) \\ V  V /| |___ / ___ \\| |_| |' + " \n " +
      ' |_| |_| |_|\\___|\\___/ \\_/\\_/  \\____/_/   \\_\\____/ ' + " \n " +
      '                                                   ' + " \n " );

}

function successSnapshotPicture(x,y,z)
{
  /*
  console.log("successSnapshotPicture");

  console.log("x:");
  console.log(x);

  console.log("y:");
  console.log(y);

  console.log("z:");
  console.log(z);
  */

  //window.open("https://google.com", "_blank"); 
  //window.focus();


  // NOPE!
  // chrome as a "security" "feature" does not allow this
  // to happen.  I'm unsure as to how it exactly knows,
  // but somehow the custody chain gets tainted and it knows
  // this callback did not originate from the button press
  // and so blocks the popup/new window by default.
  //
  /*
  if ( "id" in x )
  {
    window.open("https://localhost/bleepsix/pic.html?id=" + x.id );
    window.focus();
  }
  */

}

/*
function downloadFile()
{
  var json_data = g_schematic_controller.schematic.kicad_sch_json;
  var container = { "type" : "createKiCADSchematic", data: json_data };
  var str_data = JSON.stringify( container );

  $.ajax({
    url: "cgi/bleepsixDataManager.py",
    type: 'POST',
    data: str_data,
    //success: schJsonDlTest,
    success: schJSONDownload,
    error: function(jqxhr, status, err) { console.log(jqxhr); console.log(status); console.log(err); }

    });


}
*/

function takeSnapShotPicture()
{
  //console.log("takeSnapShotPicture");

  var canvas = document.getElementById( g_canvas );
  var img = canvas.toDataURL("image/png");

  clientToken = guid();

  //var container = { "type" : "createPNG", data: img };
  var container = { 
    "type" : "createPNG", 
    data: img, 
    userId : $.cookie('userId'), 
    sessionId : $.cookie('sessionId'),
    clientToken : clientToken

  };

  var str_data = JSON.stringify( container );

  $.ajax({
    url: "meowDataManager.py",
    type: 'POST',
    data: str_data,
    success: successSnapshotPicture,
    error: function(jqxhr, status, err) { 
      console.log("meowDataManager ERROR"); 
      console.log(jqxhr); 
      console.log(status); 
      console.log(err); 
    }
  });

  handleSnap( clientToken );
}

/*
 * The idea is that the client will generate a clientId that will be used
 * to associate the newly created picture to the client request.
 *
 * The order of operations is:
 *   user clicks button to snap
 *   clientToken is generated
 *   ajax query is sent to the server to generate the snapshot (picture) 
 *     with the newly generated clientToken
 *   new window is opened
 *
 *   in the new client window (cw), it will inheret a sessionId and the userId
 *   cw now does long polling, with the clientToken (and sessionId and userId for authentication)
 *     to see if the picture is ready.
 *   When (and if) it's ready, server gives back the picId, which cw will then
 *     use to request the picture (in the iframe with a separate request)
 *     and rewrite the url.
 *
 *
 *   
 *
 *
 *
 *
 *
 */
function handleSnap( clientToken ) 
{
  //console.log("snap...");
  window.open("pic?action=handoff&clientToken=" + clientToken );
  window.focus();

}


function goHome( )
{

  window.open("portfolio");
  window.focus();

}
