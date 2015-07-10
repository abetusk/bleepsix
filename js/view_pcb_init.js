
var drawing = true,
    running = true,
    mouseDown = false,
    visible = true;

var g_msec = 1;
var frame = 0;
var lastTime = new Date();

var g_snapgrid = null;
var g_painter = null;
var g_board_controller = null; 

var g_brdnetwork = null;
var g_controller = null;

var g_imgcache = null;

var g_canvas = "canvas";
var g_context = null;


var g_show_fps = false;

function canvasFocus()
{
  var c = document.getElementById("canvas");
  c.focus();
}

function goToProject() {

  var s = location.search.replace('?', '').split('&').map(function(val){
    return val.split('=');
  });

  var viewUserId = $(document).getUrlParam('user');
  if (!viewUserId)
    viewUserId = undefined;

  var projectId = $(document).getUrlParam('project');
  if (!projectId)
    projectId = undefined;

  url = "project?projectId=" + projectId;
  window.open( url );
  window.focus();


}


function position_html_button_elements(w, h) {
  var top = [ "3px", "0px", "0px", "0px" ];
  var tf = [ 0, 0, 0, 0 ];

  var left = [ "0px", "50px", "100px", "150px" ];
  var base_left = [ 500, 700, 750, 900 ];

  for (var i=0; i<base_left.length; i++) {
    var offset = (1200-w);
    if (offset < 0) offset = 0;
    left[i] = String( base_left[i] - offset ) + 'px';
  }

  if (w<1000) {
    top = [ "38px", "35px", "35px", "35px" ];
    left = [ "70px", "100px", "130px", "180px"  ]
  }

  ele = document.getElementById('projectButton');
  ele.style.top = top[0];
  ele.style.left = left[0];

  //ele = document.getElementById('downloadButton');
  //ele.style.top = top[2];
  //ele.style.left = left[2];

  //ele = document.getElementById('snapButton');
  //ele.style.top = top[3];
  //ele.style.left = left[3];

}

function loop() {

  frame = frame + 1;
  if ( frame >= 30 ) {
    var d = new Date();
    g_msec = (d.getTime() - lastTime ) / frame;
    lastTime = d;
    frame = 0;
  }

  if (g_show_fps)
  {
    var container = document.querySelector( 'section' );
    container.innerHTML = "FPS: " + (1000.0/g_msec);
  }

  g_board_controller.redraw();
  requestAnimationFrame( loop );

}

$(document).ready( function() {

  var s = location.search.replace('?', '').split('&').map(function(val){
    return val.split('=');
  });

  /*
  var projectId = null;
  if (s.length > 0)
  {
    if (s[0][0] == "project") { projectId = s[0][1]; }
  }
  */

  var viewUserId = $(document).getUrlParam('user');
  if (!viewUserId)
    viewUserId = undefined;

  var projectId = $(document).getUrlParam('project');
  if (!projectId)
    projectId = undefined;

  bleepsixSchematicHeadless = true;

  meowmeow();

  var cvs = document.getElementById('canvas');
  cvs.onselectstart = function() { return false; }

  g_snapgrid = new snapGrid(true, "deci-mil", 50);

  g_painter = new bleepsixRender( "canvas" );
  g_painter.setGrid ( 1 );

  // Put in 'viewMode' so we don't even try to alter
  // board state.
  //
  g_board_controller = new bleepsixBoardController( true );
  g_board_controller.init( "canvas" );
  g_context = g_board_controller.context;

  // for view, just disable the rats nest view
  g_board_controller.board.flag_draw_ratsnest = false;

  g_controller = g_board_controller;


  var img_base = "img";
  g_imgcache = new imageCache();
  g_imgcache.add( "cursor", img_base + "/cursor_custom_base_s24.png" );
  g_imgcache.add( "cursor:wire", img_base + "/cursor_custom_wire_s24.png" );
  g_imgcache.add( "cursor:bus", img_base + "/cursor_custom_bus_s24.png" );
  g_imgcache.add( "cursor:conn", img_base + "/cursor_custom_conn_s24.png" );
  g_imgcache.add( "cursor:noconn", img_base + "/cursor_custom_noconn_s24.png" );


  requestAnimationFrame( loop, 1 );




  if ( (typeof viewUserId !== "undefined") && 
       (typeof projectId !== "undefined") )
  {
    load_footprint_location( viewUserId, null, projectId );
    load_component_location( viewUserId, null, projectId );
  }
  else
  {
    load_footprint_location();
    load_component_location();
  }

  position_html_button_elements( 1200, 700 );

  // camera snapshot
  //
  $( "#snapElement" ).hover(
    function() {
      g_board_controller.drawSnapArea = true;
      g_painter.dirty_flag = true;
    },
    function() {
      g_board_controller.drawSnapArea = false;
      g_painter.dirty_flag = true;
    }
  );

  g_brdnetwork = new bleepsixBoardNetwork( MEOWURL, true );
  //g_brdnetwork = null;

  canvasFocus();

  var w = $(window).width();
  var h = $(window).height();
  var canv = document.getElementById('canvas');
  canv.width = w;
  canv.height = h;
  g_painter.setWidthHeight( w, h );

  position_html_button_elements( w, h );
  g_board_controller.resize(w,h);

  $(window).resize( function(ee) {
    var w = $(window).width();
    var h = $(window).height();
    var canv = document.getElementById('canvas');
    canv.width = w;
    canv.height = h;
    g_painter.setWidthHeight( w, h );

    position_html_button_elements( w, h );
    g_board_controller.resize(w,h,ee);
  });


  if (projectId)
  {
    var container = { "type" : "brdJSON", "projectId" : projectId };
    var str_data = JSON.stringify( container );
    $.ajax({
      url: "bleepsixDataManager.py",
      type: 'POST',
      data: str_data,
      success: function(xx) {
        g_board_controller.board.load_board(xx.json_brd);
        g_board_controller.project_name_text = xx.userName + " / " + xx.projectName;

        _view_pcb_recenter();

      },
      error: function(jqxhr, status, err) { console.log(jqxhr); console.log(status); console.log(err); }
    });
  }

});

function _view_pcb_recenter()
{
  var width = 1600, height = 1600;
  var bbox = g_board_controller.board.getBoardBoundingBox();
  var cx = (bbox[0][0] + bbox[1][0])/2.0;
  var cy = (bbox[0][1] + bbox[1][1])/2.0;

  var dx = (bbox[1][0] - bbox[0][0]);
  var dy = (bbox[1][1] - bbox[0][1]);

  var dmax = ( (dx<dy) ? dy : dx );
  var viewmax = ( (width < height) ? height : width );

  var f = dmax / viewmax;
  if (f < 4) f = 4;

  var brd_fudge = 2.0;
  f *= brd_fudge;

  g_painter.setView( cx, cy, 1/f );
}


if ( !window.requestAnimationFrame ) {
  window.requestAnimationFrame = ( function() {
  
  return window.webkitRequestAnimationFrame ||
  window.mozRequestAnimationFrame ||
  window.oRequestAnimationFrame ||
  window.msRequestAnimationFrame ||
  function( callback, element ) {
    window.setTimeout( callback, 1000 );
  };
  
  } )();
}

function brdJSONDownload( json_container )
{
  var msg_type = json_container["type"];
  if (msg_type != "id")
  {
    console.log("error, expected id, got: " + msg_type);
    console.log(json_container);
    return;
  }

  // fiddle with iframe to send a download request
  //
  var id = json_container["id"];
  var ifrm = document.getElementById( "downloadFrame" );

  url = "bleepsixDownloadManager.py?id=" + id;
  if ("name" in json_container)
  {
    url += '&name=' + json_container["name"]
  }
  ifrm.src = url;
}

function initiateDownload( json_container )
{
  var msg_type = json_container["type"];
  if (msg_type != "id")
  {
    console.log("error, expected id, got: " + msg_type);
    console.log(json_container);
    return;
  }

  // fiddle with iframe to send a download request
  //
  var id = json_container["id"];
  var ifrm = document.getElementById( "downloadFrame" );

  url = "bleepsixDownloadManager.py?id=" + id;
  if ("name" in json_container)
  {
    url += '&name=' + json_container["name"]
  }
  ifrm.src = url;
}

function downloadProject( )
{
  var projectId = ( g_brdnetwork ? g_brdnetwork.projectId : undefined );

  if (typeof projectId !== "undefined")
  {
    var form_data = { "projectId" : projectId }

    $.ajax({
      url: "downloadProject.py",
      type: 'POST',
      data: form_data,
      success: initiateDownload,
      error: function(jqxhr, status, err) { console.log(jqxhr); console.log(status); console.log(err); }
    });

  }
  else
  {

    var sch_data = g_schematic_controller.schematic.kicad_sch_json ;
    var brd_data = g_schematic_controller.board.kicad_brd_json ;

    var container = { "type" : "downloadProject", board: brd_data, schematic: sch_data };
    var str_data = JSON.stringify( container );

    $.ajax({
      url: "bleepsixDataManager.py",
      type: 'POST',
      data: str_data,
      success: initiateDownload,
      error: function(jqxhr, status, err) { console.log(jqxhr); console.log(status); console.log(err); }
    });

  }
  
}

function populateIframe(id,path)
{
  var ifrm = document.getElementById(id);
  ifrm.src = "bleepsixDownloadManager.php?path=" + path;
}


