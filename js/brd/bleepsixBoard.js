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


var bleepsixBoardHeadless = false;

if (typeof module !== 'undefined')
{
  bleepsixBoardHeadless = true;

  var numeric = require("../lib/numeric.js");
  var bleepsixAux = require("../lib/aux.js");

  var guid = bleepsixAux.guid;
  var s4 = bleepsixAux.s4;
  var simplecopy = bleepsixAux.simplecopy;

  var boardParameter = require("./bleepsixBoardParameter.js");
  
  if (typeof g_parameter === "undefined")
  {
    g_parameter = new boardParameter();
  }


}
else
{
  g_parameter = new bleepsixBoardParameter();
}

function bleepsixBoard()
{
  this.net          = {};
  this.netlist      = {};

  this.kicad_brd_json = { "element":[] , "units" : "deci-mils" };

  //console.log("STARTING:", this.kicad_brd_json );

  this.displayable = true;

  this.queued_display_footprint_count = 0;

  this.reference_number = {};
  this.ref_lookup = {};

  this.log = [];
  this._id = 1;

  this.debug = false;

  this.layer_color = [];

  for (var i=0; i<64; i++)
  {
    this.layer_color[i] = "rgba(255,255,255,0.8)" ;
  }

  this.layer_color[28] = "rgba(255, 255,   0, 0.4)";
  this.layer_color[21] = "rgba(  0, 255, 255, 0.4)";
  this.layer_color[20] = "rgba(255,   0, 255, 0.4)";
  this.layer_color[15] = "rgba(255,   0,   0, 0.4)";
  this.layer_color[0]  = "rgba(  0, 255,   0, 0.4)";

  this.flag_draw_ratsnest               = true;

  this.flag_draw_ratsnest_shimmer       = true;
  //this.flag_draw_ratsnest_shimmer       = false;

  this.flag_draw_ratsnest_shimmer_active= false;
  this.draw_ratsnest_shimmer_delay      = 10000;  // ms
  this.draw_ratsnest_shimmer_duration   = 500;   // ms
  this.draw_ratsnest_shimmer_last_time  = new Date();
  this.draw_ratsnest_shimmer_p = 0;

  this.flag_utf8_hershey_ascii_font_loaded = false;
  this.utf8_hershey_ascii_font = null;

  this.flag_utf8_hershey_font_loaded = false;
  this.utf8_hershey_font = null;

  //this.flag_draw_bounding_box = true;
  this.flag_draw_bounding_box = false;


  this.flag_text_zoom_speedup = true;
  //this.flag_text_zoom_speedup = false;

  this.display_text_zoom_threshold = 10; 

  //this.flag_display_net_name = false;
  this.flag_display_net_name = true;

  //this.draw_id_text_flag = true;
  this.draw_id_text_flag = false;

  //this.flag_bounding_box_speedup = true;
  this.flag_bounding_box_speedup = false;


  this.net_name_text_color = "rgba(255,255,255,0.8)";
  this.pad_text_color = "rgba(255,255,255,0.8)";

  this.debug_geom = [];
  this.debug_pgns = [];
  this.debug_cgeom = [];

  this.debug_point = [];
  this.debug_edge = [];

  this.highlight_net = [];
  this.highlight_net_flag = false;


  //if (!headless)
  if (!bleepsixBoardHeadless)
  {
    this.initBGL();
  }

  this._initBoardNet();

  this.boardProperties = { zoneDisplayable : true };
}

if (typeof module !== 'undefined')
{
  global.bleepsixBoard = bleepsixBoard;
}

bleepsixBoard.prototype._load_hershey_ascii_font = function( json_font )
{
  //console.log("hershey ascii font, got:");
  //console.log(json_font);

  this.utf8_hershey_ascii_font = json_font;
  this.flag_utf8_hershey_ascii_font_loaded = true;

  var font = this.utf8_hershey_ascii_font ;
  //console.log("sf : " + font.scale_factor);
}

bleepsixBoard.prototype._load_hershey_font = function( json_font )
{
  //console.log("hershey font, got:");
  //console.log(json_font);

  this.utf8_hershey_font = json_font;
  this.flag_utf8_hershey_font_loaded = true;
}

bleepsixBoard.prototype._load_hershey_font_error = function( jqxhr, textStatus, error )
{
  console.log("bleepsixBoard.prototype._load_hershey_ascii_font: " + textStatus);
  console.log(jqxhr);
  console.log(error);
}

bleepsixBoard.prototype.init = function( paint )
{
  this.painter = paint;

  // load ascii font


  //DEBUG
  //console.log("bleepsixBoard.init...");

  var brd = this;
  $.ajaxSetup({ cache : false });
  $.getJSON( "json/utf8_hershey_ascii.json",
    ( function() {
        return function(data) {
          brd._load_hershey_ascii_font(data);
        }
      }
    )()
  ).fail(
    ( function() {
        return function(jqxhr, textStatus, error) {
          brd._load_hershey_font_error(jqxhr, textStatus, error);
        }
      }
    )()
  );

  // TODO: load full utf8 font (if needed)

  $.ajaxSetup({ cache : false });
  $.getJSON( "json/utf8_hershey.json",
    ( function() {
        return function(data) {
          brd._load_hershey_font(data);
        }
      }
    )()
  ).fail(
    ( function() {
        return function(jqxhr, textStatus, error) {
          brd._load_hershey_font_error(jqxhr, textStatus, error);
        }
      }
    )()
  );


}

bleepsixBoard.prototype.clear = function() 
{
  this.net          = {};
  this.netlist      = {};

  this.boundingBox  = {};
  this.position     = {};
  this.orientation  = {};
}

bleepsixBoard.prototype._createId = function( parent_id )
{
  var id_str;
  var id = String( guid() );

  if ( typeof parent_id !== 'undefined' ) 
  {
    id_str = parent_id + "," + id;
  }
  else
  {
    id_str = id;
  }

  this.id++;
  return id_str;
}

bleepsixBoard.prototype.getReferenceName = function( comp_ref )
{
  var ref_name = "";
  if ( comp_ref && comp_ref.text && (comp_ref.text.length > 0) &&
       ( comp_ref.text[0].reference ) )
  {
    ref_name = comp_ref.text[0].reference;
  }
  var ref_num = 1;

  if (ref_name in this.reference_number)
  {
    ref_num = ++this.reference_number[ref_name];
  }
  else
  {
    this.reference_number[ref_name] = ref_num;
  }

  return ref_name + ref_num.toString();
}

bleepsixBoard.prototype.findElement = function( id )
{

  for (var ind in this.kicad_brd_json["element"])
  {
    var ele = this.kicad_brd_json["element"][ind];

    if (id == ele["id"])
      return { "id":id, "ref":ele };
  }

  return null;
}


bleepsixBoard.prototype.remove = function( id_ref )
{
  var ele;
  var id = id_ref.id;
  var ref = id_ref.ref;

  for (var ind in this.kicad_brd_json["element"] )
  {
    ele = this.kicad_brd_json["element"][ind];

    if (id == ele["id"])
    {

      var e = this.kicad_brd_json["element"].pop();
      if ( ind < this.kicad_brd_json["element"].length )
        this.kicad_brd_json["element"][ind] = e;

      delete this.ref_lookup[id];
      if (ref.type == "module")
      {
        for (var t_ind in ref.text)
        {
          if (ref.text[t_ind].id in this.ref_lookup)
          {
            delete this.ref_lookup[ ref.text[t_ind].id ];
          }
        }

        for (var p_ind in ref.pad)
        {
          if (ref.pad[p_ind].id in this.ref_lookup)
          {
            delete this.ref_lookup[ ref.pad[p_ind].id ];
          }
        }
      }

      if (!bleepsixBoardHeadless)
        g_painter.dirty_flag = true;
      return;

    }

  }

}

bleepsixBoard.prototype.flip = function( id_ref , swap_layer0, swap_layer1 )
{
  var ref = id_ref.ref;
  var type = ref.type;

  swap_layer0 = swap_layer0 ;
  swap_layer1 = swap_layer1 ;

  if (type != "module")
  {
    console.log("ERROR: bleepsixBoard.flip: not flipping module");
    return;
  }

  //this.rotateAboutPoint( [ id_ref ], ref.x, ref.y, Math.PI );
  this.moduleFlipY( id_ref );

  for (var ind in ref.text)
  {
    ref.text[ind].flag = ( (ref.text[ind].flag == "M") ? "N" : "M" );

    if (parseInt(ref.text[ind].layer) == 21)
      ref.text[ind].layer = 20;
    else if (parseInt(ref.text[ind].layer) == 20)
      ref.text[ind].layer = 21;

  }

  for (var ind in ref.art)
  {

    if (parseInt(ref.art[ind].layer) == 21)
      ref.art[ind].layer = 20;
    else if (parseInt(ref.art[ind].layer) == 20)
      ref.art[ind].layer = 21;

  }

  for (var p_ind in ref.pad)
  {
    var layer_mask = ref.pad[p_ind].layer_mask;
    var bits = parseInt(layer_mask, 16);
    var new_bits = bits;

    // zero out both position
    new_bits &= (~ ( (1<<swap_layer0) | (1<<swap_layer1) ) );
    if (bits & (1 << swap_layer0))
      new_bits |= (1 << swap_layer1);
    if (bits & (1 << swap_layer1))
      new_bits |= (1 << swap_layer0); 


    /*
    if (bits & (1<<swap_layer0))
    {
      new_bits &= (~(1<<swap_layer0));
      new_bits |= (1<<swap_layer1);
    }

    if (bits & (1<<swap_layer1))
    {
      new_bits &= (~(1<<swap_layer1));
      new_bits |= (1<<swap_layer0);
    }
    */

    //DEBUG
    /*
    console.log(">>>>>> FLIP", bits.toString(16), "-->", new_bits.toString(16) );
    console.log( swap_layer0, swap_layer1 );
    console.log( swap_layer0, swap_layer1 );
    var x = 1<<swap_layer0;
    var y = 1<<swap_layer1;
    console.log( x.toString(16), y.toString(16) );
    */

    ref.pad[p_ind].layer_mask = new_bits.toString(16);

  }

}

bleepsixBoard.prototype.rotate90 = function( id_ref , ccw_flag )
{
  /*
  var x = parseFloat( id_ref.ref.x );
  var y = parseFloat( id_ref.ref.y );
  this.rotateAboutPoint90( [ id_ref ] , x, y, ccw_flag);
  */

  var com = this.centerOfMass( [ id_ref ] );
  this.rotateAboutPoint90( [ id_ref ] , com.x, com.y, ccw_flag);
}

bleepsixBoard.prototype.centerOfMass = function ( id_refs )
{
  var x = 0, y = 0, n = 0

  if ( id_refs.length == 0 ) return null;

  for (var ind in id_refs)
  {
    ref = id_refs[ind]["ref"];
    type = ref["type"];

    if (type == "module") 
    {
      x += parseInt( ref["x"] );
      y += parseInt( ref["y"] );

    }
    else if ( type == "track" )
    {
      x += ( parseInt( ref["x0"] ) + parseInt( ref["x1"] ) ) / 2;
      y += ( parseInt( ref["y0"] ) + parseInt( ref["y1"] ) ) / 2;
    }
    else if ( type == "drawsegment" )
    {
      // worried about arcs...x1, y1 are an actual point on the arc?
      if ( ref["shape"] == "line" )
      {
        x += ( parseInt( ref["x0"] ) + parseInt( ref["x1"] ) ) / 2;
        y += ( parseInt( ref["y0"] ) + parseInt( ref["y1"] ) ) / 2;
      }
      else if ( (ref["shape"] == "arc") || (ref["shape"] == "circle") )
      {
        x += parseInt( ref["x"] ) ;
        y += parseInt( ref["y"] ) ;
      }
    }

  }

  return { "x" :  (x / id_refs.length), "y" : (y / id_refs.length) } ;

}

bleepsixBoard.prototype._clampAngle = function ( ang )
{
  var twoPi = 2.0*Math.PI;
  var q = Math.floor(ang / twoPi);

  if (ang > 0.0)
    ang = ang - Math.floor( ang / twoPi ) * twoPi;
  else
    ang = ang + Math.floor( -ang / twoPi) * twoPi;

  return ang;

}

//  flip the module across the X=0 (local) line
// 
bleepsixBoard.prototype.moduleFlipY = function ( id_ref )
{
  var X = [ [1,0],[0,-1] ];
  var id = id_ref.id;
  var ref = id_ref.ref;

  /*
  console.log(id_ref, id, ref );
  console.log(ref);
  console.log(ref.text);
  */

  for (var ind in ref.text)
  {
    var t = ref.text[ind];
    var v_t = numeric.dot( X, [ parseFloat( t.x ), parseFloat( t.y ) ] );

    t.x = v_t[0];
    t.y = v_t[1];
  }


  for (var ind in ref.pad)
  {
    var p = ref.pad[ind];
    var v_t = numeric.dot( X, [ parseFloat( p.posx ), parseFloat( p.posy ) ] );
    p.posx = v_t[0];
    p.posy = v_t[1];
  }


  for (var ind in ref.art)
  {
    var a = ref.art[ind];
    var shape = a.shape;

    if (shape == "segment") 
    {
      var v_t = numeric.dot( X, [ parseFloat( a.startx ), parseFloat( a.starty ) ] );
      a.startx = v_t[0];
      a.starty = v_t[1];

      v_t = numeric.dot( X, [ parseFloat( a.endx ), parseFloat( a.endy ) ] );
      a.endx = v_t[0];
      a.endy = v_t[1];
    }

    if ( (shape == "circle") ||
         (shape == "arc") )
    {
      var v_t = numeric.dot( X, [ parseFloat( a.x ), parseFloat( a.y ) ] );
      a.x = v_t[0];
      a.y = v_t[1];
    }

    if (shape == "arc")
    {
      var sa = this._clampAngle( parseFloat( a.start_angle ) );
      var da = this._clampAngle( parseFloat( a.angle ) );

      var new_sa = - ( sa + da );
      a.start_angle = this._clampAngle( new_sa );
    }

  }

}

bleepsixBoard.prototype.rotateAboutPoint = function ( id_refs, x, y, rad_angle, ccw_flag )
{
  ccw_flag = ( typeof ccw_flag !== 'undefined' ? ccw_flag : true );

  x = parseInt(x);
  y = parseInt(y);

  var rot_angle = ( ccw_flag ? -rad_angle : rad_angle );
  var R = this._R(rot_angle);

  for (var ind in id_refs)
  {

    var ref = id_refs[ind].ref;

    if ( ref.type == "module" )
    {

      // local rotation
      //
      ref.angle += rot_angle;
      if      (ref.angle >  Math.PI ) ref.angle -= 2.0 * Math.PI;
      else if (ref.angle < -Math.PI ) ref.angle += 2.0 * Math.PI;
      ref.orientation = Math.floor( ref.angle * 1800.0 / Math.PI );

      var v = [ ref.x - x, ref.y - y ];
      var v_r = numeric.dot( R, v );

      ref.x = v_r[0] + x;
      ref.y = v_r[1] + y;

      for (var ind in ref.text)
      {
        ref.text[ind].angle += rot_angle;
        ref.text[ind].angle = this._angleMod( ref.text[ind].angle );
        //ref.text[ind].orientation = 180.0 * ref.text[ind].angle / Math.PI;
        //ref.text[ind].orientation = 1800.0 * ref.text[ind].angle / Math.PI;
        ref.text[ind].rotation = 1800.0 * ref.text[ind].angle / Math.PI;
      }

      for (var ind in ref.pad)
      {
        ref.pad[ind].angle += rot_angle;
        ref.pad[ind].angle = this._angleMod( ref.pad[ind].angle );
        //ref.pad[ind].orientation = 180.0 * ref.pad[ind].angle / Math.PI;
        ref.pad[ind].orientation = 1800.0 * ref.pad[ind].angle / Math.PI;
      }

    }
    else if ( ( ref.type == "track" ) ||
              ( ref.type == "drawsegment" ) )
    {

      var p = [ [ ref.x0 - x, ref.y0 - y ],
                [ ref.x1 - x, ref.y1 - y ] ];

      var p_r = numeric.transpose( numeric.dot( R, numeric.transpose(p) ) );
      ref.x0 = p_r[0][0] + x;
      ref.y0 = p_r[0][1] + y;

      ref.x1 = p_r[1][0] + x;
      ref.y1 = p_r[1][1] + y;

    }

  }

}

bleepsixBoard.prototype.rotateAboutPoint90 = function ( id_refs, x, y, ccw_flag )
{
  this.rotateAboutPoint(id_refs, x, y, -Math.PI/2, ccw_flag );
}

//-----------------------------------

bleepsixBoard.prototype.toCacheName = function( name )
{
  //return encodeURIComponent( encodeURIComponent( name ) ) ;
  return (name);
}

//-----------------------------------

bleepsixBoard.prototype._line_point_intersect = function( l0, l1, p, w )
{
  var eps = 0.00001;

  if ( ( Math.abs( p.x - l0.x ) < w ) &&
       ( Math.abs( p.y - l0.y ) < w ) )
    return true;

  if ( ( Math.abs( p.x - l1.x ) < w ) &&
       ( Math.abs( p.y - l1.y ) < w ) )
    return true;

  if ( (l0.x == l1.x) && (l0.y == l1.y) )
    return false;

  var dx = l1.x - l0.x;
  var dy = l1.y - l0.y;
  var d2 = ( (dx*dx) + (dy*dy) );
  
  if (d2 < eps) 
  {
    return false;
  }

  var t =  ( dx * (p.x - l0.x) + dy * (p.y - l0.y) ) / d2

  if ((t < 0.0) || (t>1.0)) return false;

  var lp = { x : l0.x + t*dx, y: l0.y + t*dy };

  var d = Math.sqrt( (lp.x - p.x)*(lp.x - p.x) + (lp.y - p.y)*(lp.y - p.y) );

  if (d < w)
    return true;

  return false;

}

bleepsixBoard.prototype.pickCZone = function( ele, x, y )
{
  var zcorner = ele.zcorner;

  if (zcorner.length < 2)
    return null;


  for (var i=1; i<zcorner.length; i++)
  {
    var l0 = { x : parseFloat(zcorner[i-1].x), y : parseFloat(zcorner[i-1].y) };
    var l1 = { x : parseFloat(zcorner[i].x), y : parseFloat(zcorner[i].y) };
    var p = { x : parseFloat(x) , y : parseFloat(y) };
    var w = parseFloat(ele.min_thickness);

    if ( this._line_point_intersect( l0, l1, p, w ) )
    {
      /*
      console.log("czone " + i + " picked!");
      console.log( l0 );
      console.log( l1 );
      console.log(p);
      console.log(w);
      console.log(ele);
      */

      return { id : ele.id, ref : ele, type : "czone" }
    }


  }

  return null;
}

bleepsixBoard.prototype.pickLine = function( ele, x, y )
{
  var type = ele.type;
  if ( (type != "track") &&
       (type != "drawsegment") )
  {
    console.log("WARNING: bleepsixBoard.pickLine not a track or line segment, returning");
    return null;
  }


  var l0 = { x : parseFloat(ele.x0), y : parseFloat(ele.y0) };
  var l1 = { x : parseFloat(ele.x1), y : parseFloat(ele.y1) };
  var p = { x : parseFloat(x) , y : parseFloat(y) };
  var w = parseFloat(ele.width);

  // Without this division, this gives a bit of a buffer
  // to pick the lines.  Since they're so skinny,
  // this is desirable.  For vias, they're already
  // big circles, so we can restrict the bounding box
  // to just encompass the element proper.
  //
  if (ele.shape != "track")
    w /= 2;

  if ( this._line_point_intersect( l0, l1, p, w ) )
    return { id : ele.id, ref : ele, type : type }

  return null;

}


bleepsixBoard.prototype.pickElement = function( ele, x, y )
{
  var bbox = ele["bounding_box"];

  var type = ele["type"]
  var id = ele["id"];

  // czones are special as they are a unit that has
  // line segments within.  We need to go through
  // and see if they hit any of the 
  //if (ele.type == "czone")
  //  return this.pickElementCZone(ele, x, y);

  if ( typeof bbox === 'undefined' )
  {
    //if ( ele.type != 'czone' )
    //{
      console.log("ERROR: undefined bbox");
      console.log(ele);
    //}
    return;
  }

  var x0 = bbox[0][0];
  var y0 = bbox[0][1];
  var w = bbox[1][0] - bbox[0][0];
  var h = bbox[1][1] - bbox[0][1];

  var x1 = x0 + w;
  var y1 = y0 + h;

  var name = ele["name"];

  var r_ref = null;
  if ( ( x <= x1 ) && ( x >= x0 ) &&
       ( y <= y1 ) && ( y >= y0 ) )
    r_ref = { "id":ele["id"], "ref":ele };

  if (r_ref && (type == "drawsegment"))
  {
    if ((ele.shape == "circle") || (ele.shape == "arc"))
    {
      return r_ref;
    }
  }

  if (r_ref && ((type == "track") || (type == "drawsegment")) )
    return this.pickLine(ele, x, y);

  if (r_ref && (type == "czone"))
    return this.pickCZone(ele, x, y);


  return r_ref;

}



// precedence is module right now
//
bleepsixBoard.prototype.pick = function(x, y)
{

  var brd = this.kicad_brd_json["element"];
  var id_ref;
  var id_ref_save = null;

  for (var ind in brd)
  {
    id_ref = this.pickElement( brd[ind], x, y );
    if (id_ref) 
    {
      if (id_ref["ref"]["type"] == "module")
        return id_ref;
      else id_ref_save = id_ref;
    }
  }

  return id_ref_save;

}

// return an array of all elements within bounding box
//
bleepsixBoard.prototype.pickAll = function(x, y)
{

  var ar = [];
  var brd = this.kicad_brd_json["element"];
  var id_ref;

  for (var ind in brd)
  {
    id_ref = this.pickElement( brd[ind], x, y );
    if (id_ref) 
      ar.push( id_ref );
  }

  return ar;

}

// return an array of all elements within bounding box
//
bleepsixBoard.prototype.pickPads = function(x, y)
{

  var ar = [];
  var brd = this.kicad_brd_json["element"];

  for (var ind in brd)
  {
    if (brd[ind].type != "module") 
      continue;

    var ref = brd[ind];
    var pads = ref.pad;

    for (var p_ind in pads)
    {
      var pad = pads[p_ind];

      if (!("bounding_box" in pad))
        continue;

      var bbox = pads[p_ind].bounding_box;


      var x0 = bbox[0][0];
      var y0 = bbox[0][1];
      var w = bbox[1][0] - bbox[0][0];
      var h = bbox[1][1] - bbox[0][1];

      var x1 = x0 + w;
      var y1 = y0 + h;

      if ( ( x <= x1 ) && ( x >= x0 ) &&
           ( y <= y1 ) && ( y >= y0 ) )
      {
        var id_ref = { id: brd[ind].id, ref : brd[ind], 
                       pad_id: pad.id, pad_ref: pad };

        ar.push( id_ref );
      }

    }


  }

  return ar;

}


// return an array of all elements within bounding box
//
bleepsixBoard.prototype.pickBox = function(x0, y0, x1, y1)
{

  var ar = [];
  var brd = this.kicad_brd_json["element"];

  bbox = [ [ x0, y0 ], [ x1, y1] ];

  for (var ind in brd)
  {
    var type = brd[ind].type;

    if ( type == "track" ) 
    {
      var r = brd[ind];
      var l0 = { x : parseFloat(r.x0) , y : parseFloat(r.y0) };
      var l1 = { x : parseFloat(r.x1) , y : parseFloat(r.y1) };

      if (this._box_line_intersect( bbox, l0, l1 ) )
        ar.push( { "id" : brd[ind].id , "ref" : brd[ind] } );
    }

    else if (type == "drawsegment")
    {
      var shape = brd[ind].shape;

      if (shape == "line")
      {
        var r = brd[ind];
        var l0 = { x : parseFloat(r.x0) , y : parseFloat(r.y0) };
        var l1 = { x : parseFloat(r.x1) , y : parseFloat(r.y1) };

        if (this._box_line_intersect( bbox, l0, l1 ) )
          ar.push( { "id" : brd[ind].id , "ref" : brd[ind] } );
      }

      else if (shape == "arc")
      {
        if (this._box_box_intersect( brd[ind]["bounding_box"], bbox ))
        {
          ar.push( { "id" : brd[ind]["id"], "ref": brd[ind] } );
        }
      }

      else if (shape == "circle")
      {
        if (this._box_box_intersect( brd[ind]["bounding_box"], bbox ))
        {
          ar.push( { "id" : brd[ind]["id"], "ref": brd[ind] } );
        }
      }

    }

    else if (type == "module")
    {
      if (this._box_box_intersect( brd[ind]["bounding_box"], bbox ))
      {
        ar.push( { "id" : brd[ind]["id"], "ref": brd[ind] } );
      }
    }

  }

  return ar;

}

bleepsixBoard.prototype.relativeMoveElement = function( id_ref, dx, dy )
{
  dx = parseInt(dx);
  dy = parseInt(dy);

  ref = id_ref["ref"];
  type = ref.type;

  if (type == "module") 
  {
    ref["x"] = parseInt(ref["x"]) + dx;
    ref["y"] = parseInt(ref["y"]) + dy;

  }

  else if ( type == "drawsegment" )
  {
    var shape = ref.shape;

    if (shape == "line")
    {
      ref.x0 = parseInt( ref.x0 ) + dx ;
      ref.y0 = parseInt( ref.y0 ) + dy ;
      ref.x1 = parseInt( ref.x1 ) + dx ;
      ref.y1 = parseInt( ref.y1 ) + dy ;
    }

    else if (shape == "arc")
    {
      ref.x = parseInt( ref.x ) + dx ;
      ref.y = parseInt( ref.y ) + dy ;
    }

    else if (shape == "circle")
    {
      ref.x = parseInt( ref.x ) + dx ;
      ref.y = parseInt( ref.y ) + dy ;
    }


  }

  //else if ( ( type == "drawsegment") ||
  //          ( type == "track") )
  else if ( type == "track" )
  {

    ref.x0 = parseInt( ref.x0 ) + dx ;
    ref.y0 = parseInt( ref.y0 ) + dy ;
    ref.x1 = parseInt( ref.x1 ) + dx ;
    ref.y1 = parseInt( ref.y1 ) + dy ;

  }
  else if (type == "czone")
  {
    ref.tainted = true;

    var zcorner = ref.zcorner;
    for (var i=0; i<zcorner.length; i++)
    {
      zcorner[i].x = parseFloat(zcorner[i].x) + dx;
      zcorner[i].y = parseFloat(zcorner[i].y) + dy;
    }

    var polyscorners = ref.polyscorners;
    for (var i=0; i<polyscorners.length; i++)
    {
      polyscorners[i].x0 = parseFloat(polyscorners[i].x0) + dx;
      polyscorners[i].y0 = parseFloat(polyscorners[i].y0) + dy;
    }

  }
  else
  {
    console.log("bleepsixBoard.relativeMoveElement move of type '" + type + "' unhandled");
  }

}

//--------------
//
// Net functions
//
//--------------

bleepsixBoard.prototype._initBoardNet = function()
{

  this.kicad_brd_json["equipot"] = [ { net_name : "", net_number : 0 } ];
  this.kicad_brd_json["net_code_map"] = { "0" : "" };
  this.kicad_brd_json["net_name_map"] = { "" : 0 };
  this.kicad_brd_json["net_code_airwire_map"] = { "0" : [] };

  this.kicad_brd_json["brd_to_sch_net_map"] = {};
  this.kicad_brd_json["sch_to_brd_net_map"] = {};

  this.kicad_brd_json["sch_pin_id_net_map"] = {};

  /*
$NCLASS
Name "Default"
Desc "This is the default net class."
Clearance 0.254
TrackWidth 0.3048
ViaDia 1.19888
ViaDrill 0.635
uViaDia 0.508
uViaDrill 0.127
AddNet ""
AddNet "/CLK"
AddNet "/MISO"
AddNet "/MOSI"
AddNet "/RST"
AddNet "GND"
AddNet "N-000006"
AddNet "N-000008"
AddNet "N-000009"
AddNet "N-000010"
AddNet "N-000011"
AddNet "N-000024"
AddNet "N-000025"
AddNet "N-000027"
AddNet "N-000030"
AddNet "N-000031"
AddNet "VCC"
$EndNCLASS
*/

  // Holds information about clearance, via/drill sizes for different nets.
  // Default should always exist.  Stuff in some reasonable (?) values here (for now?).
  this.kicad_brd_json["net_class"] = {
    "Default" : {
      "name" : "Default",
      "description" : "This is the default net class.",
      "unit" : "deci-thou",
      "track_width" : g_parameter.traceWidth,
      "clearance" : g_parameter.clearance,
      "via_diameter" : g_parameter.viaWidth,
      "via_drill_diameter" : g_parameter.viaDrillWidth,
      "uvia_diameter" : g_parameter.uViaWidth,
      "uvia_drill_diameter" : g_parameter.uViaWidth,
      "net" : [ ] 
    }
  };

}

bleepsixBoard.prototype.getNetName = function( netcode )
{
  if ( !( "equipot" in this.kicad_brd_json ) )
  {
    this._initBoardNet();
  }

  if ( netcode in this.kicad_brd_json["net_code_map"] )
    return this.kicad_brd_json["net_code_map"][netcode];

  return undefined;
}


bleepsixBoard.prototype.renameNet = function( stale_netcode, new_netcode )
{
  var new_netname = this.kicad_brd_json.net_code_map[ new_netcode ];
  var renamed_ids = [];

  var brd = this.kicad_brd_json["element"];
  for (var ind in brd)
  {
    var ele = brd[ind];

    if (ele.type == "track")
    {
      if (ele.netcode == stale_netcode)
      {
        ele.netcode = new_netcode;

        renamed_ids.push( ele.id );
      }
    }
    else if (ele.type == "module")
    {
      var pad_list = ele.pad;
      for (var pad_ind in pad_list)
      {
        var pad = pad_list[pad_ind];

        if (pad.net_number == stale_netcode)
        {

          //DEBUG
          //console.log("renaming pad: ", pad);

          pad.net_number = new_netcode;
          pad.net_name = new_netname;

          renamed_ids.push( pad.id );
        }
      }
    }

  }

  var schpin_map = this.kicad_brd_json.sch_pin_id_net_map;
  this.updateSchematicNetcodeMap( schpin_map );

  return renamed_ids;

}

// We will use two points, potentially at different layers,
// to seed the net split.
//
// Go through and collect points into a hash where
// tracks end or pads are centered.  'Flood fill'
// to figure out which groupings each is in.
// If a track/pad is in a grouping, it guarantees
// it is of the same net as others in the group, but
// does not necessarily mean tracks/pads are different
// if they're not in the same grouping.
//
// Once initial groupings are established, do a bounding
// box test for the bounding box of each of the groupings.
// If the bounding box does not intersect, we know for
// certain that groupings are distinct and we can split
// the net (rename one).
//
// If bbox's intersect, then we need to do a more complicated
// geometry intersection test.  For this, we linearize
// the gemoetry, and do a boolean test of the appropriate
// geometry.  Depending on the test results, we know whether
// to keep the nets untouched or create a new one and
// rename the elements in one of the groups.
//
// Genearlizes to more than one group.  Worst case
// O(n^2), so we'll have to come back to it if it 
// turns out to be too slow.
//
//

/*
bleepsixBoard.prototype.splitNet = function( orig_netcode,
                                             x0, y0, layer0,
                                             x1, y1, layer1 )
{
  var group_name = 1;
  var net_ele_list = [];
  var net_ele_point_hash = {};

  var brd = this.kicad_brd_json["element"];
  for (var ind in brd)
  {
    var ele = brd[ind];
    if (ele.type == "track")
    {

      if ( parseInt(ele.netcode) != orig_netcode )
        continue;

      var x = parseFloat( ele.x0 ).toFixed(8);
      var y = parseFloat( ele.y0 ).toFixed(8);
      var key = x + ":" + y ;

      //var layer = parseInt( ele.layer ) & 0xf;
      //var key = x + ":" + y + ":" + layer ;

      if (key in net_ele_point_hash)
        net_ele_point_hash[key].push(ele);
      else
        net_ele_point_hash[key] =  [ ele ]

      if ( ele.shape == "through" ) continue;
      if ( ele.shape == "blind" )   continue;

      x = parseFloat( ele.x0 ).toFixed(8);
      y = parseFloat( ele.y0 ).toFixed(8);
      key = x + ":" + y ;

      //layer = ((parseInt( ele.layer ) & 0xf0) >> 4);
      //key = x + ":" + y + ":" + layer;

      if (key in net_ele_point_hash)
        net_ele_point_hash[key].push( { type: "track", ref: ele } );
      else
        net_ele_point_hash[key] =  [ { type: "track", ref: ele } ]

    }
    else if (ele.type == "module")
    {
      var pads = ele.pad;
      for (var pad_ind in pads)
      {
        var pad = pads[pad_ind];

        if ( parseInt(pad.net_number) != orig_netcode )
          continue;

        var x = parseFloat( pad.posx ).toFixed(8);
        var y = parseFloat( pad.posy ).toFixed(8);
        var key = x + ":" + y ;

        if (key in net_ele_point_hash)
          net_ele_point_hash[key].push( { type: "pad", ref: ele, pad_ref: pad } );
        else
          net_ele_point_hash[key] =  [ { type: "pad", ref: ele, pad_ref : pad } ]

      }
    }

  }
}
*/

bleepsixBoard.prototype.mergeNets = function( netcode0, netcode1 )
{
  if ((netcode0 <= 0) || (netcode1 <= 0)) return;

  if ( parseInt(netcode0) == parseInt(netcode1) )
    return;

  var netname0 = this.kicad_brd_json.net_code_map[ String(netcode0) ];
  var netname1 = this.kicad_brd_json.net_code_map[ String(netcode1) ];

  var net_array = [ netname0, netname1 ].sort();

  var stale_netcode = netcode0;
  var new_netcode = netcode1;

  if (netname0 == net_array[0])
  {
    stale_netcode = netcode1;
    new_netcode = netcode0;
  }

  var renamed_ids = this.renameNet( stale_netcode, new_netcode );

  this.removeNet( stale_netcode );

  var schpin_map = this.kicad_brd_json.sch_pin_id_net_map;
  this.updateSchematicNetcodeMap( schpin_map );

  return { net_number: new_netcode, renamed_ids : renamed_ids } ;

}

bleepsixBoard.prototype._genNetName = function()
{
  this.default_net_prefix = "N-";

  var equipot = this.kicad_brd_json.equipot;

  var new_net_code = -1;
  var new_base_net_name = -1;
  for (var ind in equipot)
  {
    if ( parseInt( equipot[ind].net_number ) > new_net_code )
    {
      new_net_code = parseInt( equipot[ind].net_number ) 

      var s = "0" + equipot[ind].net_name;
      var n = parseInt( s.replace( /[^0-9]*/g, '' ), 10 );
      if (n > new_base_net_name)
        new_base_net_name = n;

    }
  }

  new_base_net_name += 1;
  var z = Array( 6 - (String(new_base_net_name).length) ).join('0');

  //console.log( this.default_net_prefix + ", " + z + ", " + new_base_net_name);

  return this.default_net_prefix + z + String(new_base_net_name);
}

// Return a new netcode and netname as an object with net_number and net_name as keys.
// Passing in an undefined for netcode and netname will automatically allocate them.
//
bleepsixBoard.prototype.genNet = function( netcode, netname )
{

  this.default_net_prefix = "N-";

  if (typeof netcode === 'undefined' )
  {
    if (!("equipot" in this.kicad_brd_json ))
      this._initBoardNet();

    var equipot = this.kicad_brd_json.equipot;

    var new_net_code = -1;
    for (var ind in equipot)
      if ( parseInt( equipot[ind].net_number ) > new_net_code )
        new_net_code = parseInt( equipot[ind].net_number ) 

    netcode = new_net_code + 1;
    netname = this._genNetName();
  }

  if (typeof netname === 'undefined')
    netname = this._genNetName();

  return { net_number: netcode, net_name: netname };
}

bleepsixBoard.prototype.removeNet = function( netcode, netname )
{

  var net_name;
  var net_ind;
  var n ;

  var brd = this.kicad_brd_json;

  var eqp = brd.equipot;
  n = eqp.length;
  for (net_ind=0; net_ind < n; net_ind++)
  {
    if ( eqp[net_ind].net_number == netcode )
      break;
  }

  if (net_ind == n)
  {
    console.log("ERROR: bleepsixBoard.removeNet: could not find netocde " + netcode + " in equipot");
    console.trace();
    return false;
  }

  if ( netcode in brd.net_code_map )
  {
    net_name = brd.net_code_map[ netcode ];
  }
  else
  {
    console.log("ERROR: bleepsixBoard.removeNet: could not find netocde " + netcode + " in net_code_map");
    console.trace();
    return false;
  }

  if ( !(net_name in brd.net_name_map) )
  {
    console.log("ERROR: bleepsixBoard.removeNet: could not find name " + net_name + " in net_code_map");
    console.trace();
    return false;
  }

  var e = eqp.pop();
  if ( net_ind < eqp.length )
  {
    eqp[net_ind] = e;
  }

  delete brd.net_code_map[ netcode ];
  delete brd.net_name_map[ net_name ];

  var schpin_map = this.kicad_brd_json.sch_pin_id_net_map;
  this.updateSchematicNetcodeMap( schpin_map );

  return true;
}

bleepsixBoard.prototype.addNet = function( netcode, netname )
{
  var netinfo = this.genNet( netcode, netname );

  this.kicad_brd_json.equipot.push( netinfo );
  this.kicad_brd_json.net_code_map[ netinfo.net_number ] = netinfo.net_name;
  this.kicad_brd_json.net_name_map[ netinfo.net_name   ] = netinfo.net_number;

  var schpin_map = this.kicad_brd_json.sch_pin_id_net_map;
  this.updateSchematicNetcodeMap( schpin_map );

  return netinfo;
}


//-----------------


bleepsixBoard.prototype.addCZone = function( pnts, netcode, layer, polyscorners, id )
{
  polyscorners = ((typeof polyscorners !== 'undefined' ) ? polyscorners : null );

  //var id = this._createId();
  id = ( (typeof id !== 'undefined') ? id : this._createId() );

  var czone = {};
  //czone.id = this._createId();
  czone.id = id;
  czone.netcode = netcode;
  czone.layer = layer;
  czone.name = this.kicad_brd_json.net_name_map[ netcode ];
  czone.pad_option = "T";
  czone.hatching_option = "E";
  czone.zsmoothing_y = 0;
  czone.zsmoothing_x = 0;
  czone.timestamp = "52918F4C";  //DUMMY!

  czone.corner_count = pnts.length;
  czone.zcorner = [];
  for (var i in pnts)
    czone.zcorner.push( { x: pnts[i][0], y: pnts[i][1] } );

  czone.arc = 16;
  czone.thermal_stub_width = 200.0;
  czone.antipad_thickness = 200.0;
  czone.clearance = 200.0;
  czone.type = "czone";
  czone.min_thickness = 100.0;
  czone.fill = "0";

  czone.polyscorners = [];
  if (polyscorners)
  {
    for (var i in polyscorners)
    {
      var pc = polyscorners[i];
      czone.polyscorners.push( { x0 : pc[0], y0: pc[1], x1: 0, y1: 0 } );
    }
  }

  czone.F = "F";

  this.kicad_brd_json.element.push(czone);

}

bleepsixBoard.prototype.addTrack = function(x0, y0, x1, y1, width, layer, netcode, id)
{
  //var id = this._createId();
  id = ( (typeof id !== 'undefined') ? id : this._createId() );

  netcode = ( (typeof netcode !== 'undefined') ? netcode : 0 );
  if (netcode <= 0) netcode = 0;

  var track = {};

  track["id"] = id;
  track["type"] = "track";

  track["x0"] = x0;
  track["y0"] = y0;
  track["x1"] = x1;
  track["y1"] = y1;

  track["status"] = "400000";
  track["netcode"] = netcode;
  track["layer"] = layer;
  track["shape_code"] = 0;
  track["shape"] = "track";
  track["extra"] = "";
  track["timestamp"] = "0";
  track["width"] = width;

  //this.updateTrackBoundingBox( track );
  this.updateLineBoundingBox( track );

  this.kicad_brd_json["element"].push(track);

  return id;
}

bleepsixBoard.prototype.addDrawSegment = function(x0, y0, x1, y1, width, layer, id )
{
  //var id = this._createId();
  id = ( (typeof id !== 'undefined') ? id : this._createId() );

  var drawsegment = {};

  drawsegment["id"] = id;
  drawsegment["type"] = "drawsegment";

  drawsegment["x0"] = x0;
  drawsegment["y0"] = y0;
  drawsegment["x1"] = x1;
  drawsegment["y1"] = y1;

  drawsegment["status"] = "0";
  drawsegment["layer"] = layer;

  drawsegment["shape_code"] = "0";
  drawsegment["shape"] = "line";
  drawsegment["angle"] = "900";
  drawsegment["timestamp"] = "0";
  drawsegment["width"] = width;

  //this.updateTrackBoundingBox( drawsegment );
  this.updateLineBoundingBox( drawsegment );

  this.kicad_brd_json["element"].push(drawsegment);

  return id;
}

bleepsixBoard.prototype.addDrawArcSegment = function(x, y, r, start_angle, end_angle, width, layer, id )
{
  id = ( (typeof id !== 'undefined') ? id : this._createId() );

  var drawsegment = {};

  drawsegment["id"] = id;
  drawsegment["type"] = "drawsegment";

  drawsegment["x"] = x;
  drawsegment["y"] = y;
  drawsegment["r"] = r;
  drawsegment["start_angle"] = start_angle;
  drawsegment["angle"] = end_angle - start_angle;

  drawsegment["status"] = "0";
  drawsegment["layer"] = layer;

  drawsegment["shape_code"] = "0";
  drawsegment["shape"] = "arc";
  drawsegment["shape_code"] = "2";
  drawsegment["counterclockwise_flag"] = true;

  //drawsegment["angle"] = "900";

  drawsegment["timestamp"] = "0";
  drawsegment["width"] = width;

  //this.updateTrackBoundingBox( drawsegment );
  this.updateLineBoundingBox( drawsegment );

  this.kicad_brd_json["element"].push(drawsegment);

  return id;
}

bleepsixBoard.prototype.addVia = function(x, y, width, layer0, layer1, netcode, id)
{

  netcode = ( (typeof netcode !== 'undefined') ? netcode : 0 );
  if (netcode <= 0) netcode = 0;

  //var id = this._createId();
  id = ( (typeof id !== 'undefined') ? id : this._createId() );

  var track = {};

  track["id"] = id;
  track["type"] = "track";

  track["x0"] = x;
  track["y0"] = y;
  track["x1"] = x;
  track["y1"] = y;

  track["status"] = "400000";
  track["netcode"] = netcode;

  // KiCAD documentation lies.  I don't know what this should be.  '15' appears
  // to be through hole via from layer 0 to 15...
  //
  track["layer"] = ((parseInt(layer0)<<4) & 0xf) | (parseInt(layer1) & 0xf);

  track["shape_code"] = 3;
  track["shape"] = "through";
  track["extra"] = "";
  track["timestamp"] = "0";
  track["width"] = width;

  //this.updateTrackBoundingBox( track );
  this.updateLineBoundingBox( track );

  this.kicad_brd_json["element"].push(track);

  return id;
}

bleepsixBoard.prototype.updateFootprintData = function( json_module,  id, text_ids, pad_ids )
{
  text_ids = ((typeof text_ids !== 'undefined') ? text_ids : [ this._createId(id), this._createId(id) ] );
  var use_pad_id = ((typeof pad_ids !== 'undefined') ? true : false );

  var pos ;

  for (pos=0; pos < this.kicad_brd_json.element.length; pos++)
  {
    if ( id == this.kicad_brd_json.element[pos].id )
      break;
  }

  if (pos == this.kicad_brd_json.element.length)
  {
    console.log("ERROR: bleepsixBoard.updateFootprintData: could not find id " + id );
  }

  var ref = this.refLookup(id);
  var old_ref = simplecopy( ref );

  this.refDelete( ref.id );

  this.kicad_brd_json.element[pos] = simplecopy( json_module );
  ref = this.kicad_brd_json.element[pos];


  ref["id"] = id;
  ref["x"] = old_ref.x;
  ref["y"] = old_ref.y;
  ref["type"] = "module";


  ref.text[0].id = text_ids[0];
  ref.text[1].id = text_ids[1];

  if ("pad" in ref)
    for (var pad_ind in ref["pad"])
    {
      if (use_pad_id)
      {
        ref.pad[pad_ind].id = pad_ids[pad_ind];
      }
      else 
      {
        ref.pad[pad_ind].id = this._createId(id);
      }
    }

  var angle = 0;
  var R = this._R( angle );
  var bbox = 
    numeric.transpose( 
      numeric.dot( R, numeric.transpose( ref["bounding_box"]) ) );
  bbox[0][0] += old_ref.x;
  bbox[0][1] += old_ref.y;

  bbox[1][0] += old_ref.x;
  bbox[1][1] += old_ref.y;
  ref["bounding_box"] = bbox;



}

bleepsixBoard.prototype.addFootprintData = function( json_module, x, y, id, text_ids, pad_ids )
{
  id = ( (typeof id !== 'undefined') ? id : this._createId() );
  text_ids = ((typeof text_ids !== 'undefined') ? text_ids : [ this._createId(id), this._createId(id) ] );
  var use_pad_id = ((typeof pad_ids !== 'undefined') ? true : false );

  //angle = ( typeof angle !== 'undefined' ? angle : 0.0 );

  angle = parseFloat( json_module.angle );

  x = parseFloat(x);
  y = parseFloat(y);

  //var id = this._createId();

  //var footprint_entry = {}
  //$.extend( true, footprint_entry, json_module );
  footprint_entry = simplecopy( json_module );

  footprint_entry["id"] = id;
  //footprint_entry["angle"] = angle;
  //footprint_entry["orientation"] = 180.0 * parseFloat(footprint_entry.angle) / Math.PI;
  footprint_entry["x"] = x;
  footprint_entry["y"] = y;
  footprint_entry["type"] = "module";

  if ( !footprint_entry.text ) {
    footprint_entry.text = [ {}, {} ];
  }

  if ( footprint_entry.text.length < 1 ) {
    footprint_entry.text.push( { "text" : "" } );
  }

  if ( footprint_entry.text.length < 2 ) {
    footprint_entry.text.push( { "text" : "" } );
  }

  footprint_entry.text[0].id = text_ids[0];
  footprint_entry.text[1].id = text_ids[1];

  if ("pad" in footprint_entry)
    for (var pad_ind in footprint_entry["pad"])
    {
      if (use_pad_id)
      {
        footprint_entry.pad[pad_ind].id = pad_ids[pad_ind];
      }
      else 
      {
        footprint_entry.pad[pad_ind].id = this._createId(id);
      }

      /*
      // EXPERIMENTAL
      var net_obj = this.genNet();
      footprint_entry.pad[pad_ind].net_name = net_obj.net_name;
      footprint_entry.pad[pad_ind].net_number = net_obj.net_number;
      */

    }

  var R = this._R( angle );
  var bbox = 
    numeric.transpose( 
      numeric.dot( R, numeric.transpose( footprint_entry["bounding_box"]) ) );
  bbox[0][0] += x;
  bbox[0][1] += y;

  bbox[1][0] += x;
  bbox[1][1] += y;
  footprint_entry["bounding_box"] = bbox;

  this.kicad_brd_json["element"].push( footprint_entry );

  //DEBUG
  //console.log( this.kicad_brd_json );

  if (!bleepsixBoardHeadless)
    g_painter.dirty_flag = true;

}

// ------
// helper module drawing functions
// ------
 
bleepsixBoard.prototype.drawFootprintSegment = function( art_entry, x, y )
{
  var sx = parseFloat( art_entry["startx"] );
  var sy = parseFloat( art_entry["starty"] );
  var ex = parseFloat( art_entry["endx"] );
  var ey = parseFloat( art_entry["endy"] );

  var line_width = parseFloat( art_entry["line_width"] );
  var layer = parseInt( art_entry["layer"] );
  var color = this.layer_color[layer];

  //g_painter.line( sx + x, sy + y, ex + x, ey + y, "rgb(0, 160, 160)", line_width);
  g_painter.line( sx + x, sy + y, ex + x, ey + y, color, line_width);

}

bleepsixBoard.prototype.drawFootprintCircle = function( art_entry, x, y )
{
  var cx = parseFloat( art_entry["x"] );
  var cy = parseFloat( art_entry["y"] );
  var r = parseFloat( art_entry["r"] );


  var line_width = parseFloat( art_entry["line_width"] );
  var layer = parseInt( art_entry["layer"] );
  var color = this.layer_color[layer];

  //g_painter.circle( cx + x, cy + y, r, line_width, "rgb(0,160,160)" );
  g_painter.circle( cx + x, cy + y, r, line_width, color );
}

bleepsixBoard.prototype.drawFootprintArc = function( art_entry, x, y )
{
  var cx = parseFloat( art_entry["x"] );
  var cy = parseFloat( art_entry["y"] );
  var r = parseFloat( art_entry["r"] );

  var sa = parseFloat( art_entry["start_angle"] );
  var da = parseFloat( art_entry["angle"] );

  if (da > 2.0*Math.PI)
    da -= 2.0 * Math.PI;

  var line_width = parseFloat( art_entry["line_width"] );
  var layer = parseInt( art_entry["layer"] );
  var color = this.layer_color[layer];

  g_painter.drawArc( cx + x, cy + y, r, sa, sa+da, false, line_width, color );
}

//---------------

bleepsixBoard.prototype._draw_pad_circle_text = function( pad_entry, x, y, glob_rad_ang )
{

  var name = pad_entry["name"];

  var cx = parseFloat(pad_entry.posx);
  var cy = parseFloat(pad_entry.posy);
  var sizex = parseFloat(pad_entry.sizex);
  var sizey = parseFloat(pad_entry.sizey);


  var loc_rad_ang = this._angleMod( parseFloat( pad_entry.angle ) );
  var loc_deg_ang = -loc_rad_ang * 180.0 / Math.PI;
  var g_deg_ang = glob_rad_ang * 180.0 / Math.PI;
  
  var fin_angle = -g_deg_ang;
  var fin_deg_angle = this._findTextDegAngle( 0, -g_deg_ang );
  var fin_rad_angle = fin_deg_angle * Math.PI / 180.0;

  //var sizex  = parseFloat( pad_entry.sizex );

  var text_size = 0.5*sizex;
  var orig_text_height = text_size;
  var orig_text_width = orig_text_height * 0.6;

  var net_number = parseInt( pad_entry["net_number"] );

  var d = sizex;
  var r = d / 2;

  if ( this.flag_display_net_name && 
       (net_number > 0) )
  {
    var net_name_len = pad_entry.net_name.length;

    var net_name_char_width = d / (net_name_len + 3) ;
    var net_name_char_height = net_name_char_width / 0.6;

    net_name_char_height = Math.min( net_name_char_height, r/2 );

    var du = numeric.dot( this._R( fin_rad_angle ), [0, r/2]  )
    var dv = numeric.dot( this._R( fin_rad_angle ), [0, -r/2]  )


    g_painter.drawText( pad_entry.net_name, 
                       cx + x + du[0], 
                       cy + y + du[1],
                       this.net_name_text_color,
                       //"rgba(255,255,255,0.5)", 
                       net_name_char_height, 
                       fin_angle, "C", "C" );

    g_painter.drawText( name, 
                       cx + x + dv[0], 
                       cy + y + dv[1],
                       this.pad_text_color,
                       //"rgba(255,255,255,0.5)", 
                       text_size, 
                       fin_angle , "C", "C");

  }
  else
  {
    if ( (this.flag_text_zoom_speedup) &&
         ((text_size * g_painter.zoom )  < this.display_text_zoom_threshold) )
        return;

    g_painter.drawText( name, 
                        cx + x, 
                        cy + y, 
                        "rgba(255,255,255,0.5)", 
                        text_size, 
                        fin_angle , "C", "C");
  }


}

bleepsixBoard.prototype._draw_pad_circle = function( pad_entry, x, y, glob_rad_ang, ghostFlag )
{
  ghostFlag = ( ( typeof ghostFlag === 'undefined' ) ? false : ghostFlag );

  glob_rad_ang = ( (typeof glob_rad_ang !== 'undefined') ? glob_rad_ang : 0.0 );

  var cx = parseFloat(pad_entry.posx);
  var cy = parseFloat(pad_entry.posy);
  var sizex = parseFloat(pad_entry.sizex);
  var sizey = parseFloat(pad_entry.sizey);

  var ang = parseFloat(pad_entry.angle);

  var layer_mask = parseInt( pad_entry["layer_mask"], 16);
  var color = "rgba(255,255,255, 0.5)";

  if ( (layer_mask & 1) && (layer_mask & (1<<15)) )
    color = "rgba(255,255,0,0.5)";
  else if (layer_mask & 1)
    color = this.layer_color[0];
  else if (layer_mask & (1<<15))
    color = this.layer_color[15];

  if (ghostFlag) color = "rgba(255,255,255,0.25)";

  var name = pad_entry.name;

  //****
  ang = this._angleMod( ang - glob_rad_ang );
  //****

  var tx = cx + x;
  var ty = cy + y;
  g_painter.context.translate( tx, ty );
  g_painter.context.rotate( -ang );

  var drill_diam = parseFloat( pad_entry.drill_diam );

  if (drill_diam > 0.5)
  {
    var drill_x = parseFloat( pad_entry.drill_x );
    var drill_y = parseFloat( pad_entry.drill_y );

    if ( (!( "drill_shape" in pad_entry )) ||
         (pad_entry.drill_shape == "circle") )
    {
      g_painter.fillCircleHoleCircle( 0, 0, sizex/2, drill_x, drill_y, drill_diam/2, color );
    }
    else if (pad_entry.drill_shape == 'oblong')
    {
      var iox = parseFloat( pad_entry.drill_hole_extra_x );
      var ioy = parseFloat( pad_entry.drill_hole_extra_y );
      g_painter.fillCircleHoleOblong( 0, 0, sizex/2, drill_x, drill_y, iox, ioy, color );
    }


  }
  else
  {
    g_painter.fillCircle( 0, 0, sizex/2, color );
  }


  g_painter.context.rotate( ang );
  g_painter.context.translate( -tx, -ty );
}

//---------------


bleepsixBoard.prototype._draw_pad_rect_text = function( pad_entry, x, y, glob_rad_ang )
{
  var name = pad_entry["name"];

  var cx = parseFloat(pad_entry.posx);
  var cy = parseFloat(pad_entry.posy);
  var sizex = parseFloat(pad_entry.sizex);
  var sizey = parseFloat(pad_entry.sizey);

  //var sizex = parseFloat( pad_entry.sizex );
  //var sizey = parseFloat( pad_entry.sizey );

  var loc_rad_ang = this._angleMod( parseFloat( pad_entry.angle ) );
  var loc_deg_ang = -loc_rad_ang * 180.0 / Math.PI;
  var g_deg_ang = glob_rad_ang * 180.0 / Math.PI;
  
  var fin_angle = -glob_rad_ang;

  var major_len = 1, minor_len = 1;

  if ( sizey > sizex )
  {
    if (sizey < 1.5*sizex) text_size = 0.5*sizex;
    else                   text_size = sizex;
    var a = loc_deg_ang + 90;
    fin_angle = this._findTextDegAngle( a, g_deg_ang );

    major_len = sizey;
    minor_len = sizex;
  }
  else
  {
    if (sizex < 1.5*sizey) text_size = 0.5 * sizey;
    else                   text_size = sizey;
    fin_angle = this._findTextDegAngle( loc_deg_ang, g_deg_ang );

    major_len = sizex;
    minor_len = sizey;
  }

  var fin_deg_angle = fin_angle;
  var fin_rad_angle = fin_deg_angle * Math.PI / 180.0;


  var net_number = parseInt( pad_entry["net_number"] );

  if ( this.flag_display_net_name && 
       (net_number > 0) )
  {
    var fudge = -5;
    var net_name_len = pad_entry.net_name.length;

    var net_name_char_width = major_len / (net_name_len + 3) ;
    var net_name_char_height = net_name_char_width / 0.6 ;

    net_name_char_height = Math.min( net_name_char_height, minor_len/2 );

    var du = numeric.dot( this._R( -fin_rad_angle ), [0,  (minor_len/4) - fudge ]  )
    var dv = numeric.dot( this._R( -fin_rad_angle ), [0, -(minor_len/4) - fudge ]  )

    g_painter.drawText( pad_entry.net_name, 
                       cx + x + du[0], 
                       cy + y + du[1],
                       this.net_name_text_color,
                       //"rgba(255,255,255,0.5)", 
                       net_name_char_height, 
                       fin_angle, "C", "C" );

    g_painter.drawText( name, 
                       cx + x + dv[0], 
                       cy + y + dv[1],
                       this.pad_text_color,
                       //"rgba(255,255,255,0.5)", 
                       net_name_char_height, 
                       fin_angle , "C", "C");

  }
  else
  {
    if ( (this.flag_text_zoom_speedup) &&
         ((text_size * g_painter.zoom )  < this.display_text_zoom_threshold) )
        return;

    g_painter.drawText( name, cx + x, cy + y, "rgba(255,255,255,0.5)", text_size, fin_angle , "C", "C");
  }


}

bleepsixBoard.prototype._draw_pad_rect = function( pad_entry, x, y, glob_rad_ang, ghostFlag )
{
  ghostFlag = ( ( typeof ghostFlag === 'undefined' ) ? false : ghostFlag );

  glob_rad_ang = ( (typeof glob_rad_ang !== 'undefined') ? glob_rad_ang : 0.0 );

  var cx = parseFloat(pad_entry.posx);
  var cy = parseFloat(pad_entry.posy);
  var sizex = parseFloat(pad_entry.sizex);
  var sizey = parseFloat(pad_entry.sizey);

  var ang = parseFloat(pad_entry.angle);

  var layer_mask = parseInt( pad_entry["layer_mask"], 16);
  var color = "rgba(255,255,255, 0.5)";

  if ( (layer_mask & 1) && (layer_mask & (1<<15)) )
    color = "rgba(255,255,0,0.5)";
  else if (layer_mask & 1)
    color = this.layer_color[0];
  else if (layer_mask & (1<<15))
    color = this.layer_color[15];

  if (ghostFlag) color = "rgba(255,255,255,0.25)";

  var name = pad_entry.name;

  //****
  ang = this._angleMod( ang + glob_rad_ang );
  //****

  var tx = cx + x;
  var ty = cy + y;
  g_painter.context.translate( tx, ty );
  g_painter.context.rotate( -ang );

  var drill_diam = parseFloat( pad_entry.drill_diam );

  if (drill_diam > 0.5)
  {
    var drill_x = parseFloat( pad_entry.drill_x );
    var drill_y = parseFloat( pad_entry.drill_y );

    if ( (!( "drill_shape" in pad_entry )) ||
         (pad_entry.drill_shape == "circle") )
    {
      g_painter.fillRectHoleCircle( 0, 0, sizex, sizey, drill_x, drill_y, drill_diam/2, color );
    }
    else if (pad_entry.drill_shape == 'oblong')
    {
      var iox = parseFloat( pad_entry.drill_hole_extra_x );
      var ioy = parseFloat( pad_entry.drill_hole_extra_y );
      g_painter.fillRectHoleOblong( 0, 0, sizex, sizey, drill_x, drill_y, iox, ioy, color );
    }


  }
  else
  {
    g_painter.fillRect( 0, 0, sizex, sizey, color );
  }


  g_painter.context.rotate( ang );
  g_painter.context.translate( -tx, -ty );
}

//---------------


bleepsixBoard.prototype._draw_pad_oblong_text = function( pad_entry, x, y, glob_rad_ang )
{
  var name = pad_entry["name"];

  var cx = parseFloat(pad_entry.posx);
  var cy = parseFloat(pad_entry.posy);
  var sizex = parseFloat(pad_entry.sizex);
  var sizey = parseFloat(pad_entry.sizey);

  //var sizex = parseFloat( pad_entry.sizex );
  //var sizey = parseFloat( pad_entry.sizey );

  var loc_rad_ang = this._angleMod( parseFloat( pad_entry.angle ) );
  var loc_deg_ang = -loc_rad_ang * 180.0 / Math.PI;
  var g_deg_ang = glob_rad_ang * 180.0 / Math.PI;
  
  var fin_angle = -g_deg_ang;

  var major_len = 1, minor_len = 1;

  if ( sizey > sizex )
  {
    if (sizey < 1.5*sizex) text_size = 0.5*sizex;
    else                   text_size = sizex;
    var a = loc_deg_ang + 90;
    fin_angle = this._findTextDegAngle( a, g_deg_ang );

    major_len = sizey;
    minor_len = sizex;
  }
  else
  {
    if (sizex < 1.5*sizey) text_size = 0.5 * sizey;
    else                   text_size = sizey;
    fin_angle = this._findTextDegAngle( loc_deg_ang, g_deg_ang );

    major_len = sizex;
    minor_len = sizey;
  }

  var fin_deg_angle = fin_angle;
  var fin_rad_angle = fin_deg_angle * Math.PI / 180.0;

  var net_number = parseInt( pad_entry["net_number"] );

  if ( this.flag_display_net_name && 
       (net_number > 0) )
  {
    var fudge = -5;
    var net_name_len = pad_entry.net_name.length;

    var net_name_char_width = major_len / (net_name_len + 3) ;
    var net_name_char_height = net_name_char_width / 0.6 ;

    net_name_char_height = Math.min( net_name_char_height, minor_len/2 );

    var du = numeric.dot( this._R( -fin_rad_angle ), [0,  (minor_len/4) - fudge ]  )
    var dv = numeric.dot( this._R( -fin_rad_angle ), [0, -(minor_len/4) - fudge ]  )

    g_painter.drawText( pad_entry.net_name, 
                       cx + x + du[0], 
                       cy + y + du[1],
                       this.net_name_text_color,
                       //"rgba(255,255,255,0.5)", 
                       net_name_char_height, 
                       fin_angle, "C", "C" );

    g_painter.drawText( name, 
                       cx + x + dv[0], 
                       cy + y + dv[1],
                       this.pad_text_color,
                       //"rgba(255,255,255,0.5)", 
                       net_name_char_height, 
                       fin_angle , "C", "C");

  }
  else
  {
    if ( (this.flag_text_zoom_speedup) &&
         ((text_size * g_painter.zoom )  < this.display_text_zoom_threshold) )
        return;

    g_painter.drawText( name, cx + x, cy + y, "rgba(255,255,255,0.5)", text_size, fin_angle , "C", "C");
  }


}

bleepsixBoard.prototype._draw_pad_oblong = function( pad_entry, x, y, glob_rad_ang, ghostFlag )
{
  ghostFlag = ( ( typeof ghostFlag === 'undefined' ) ? false : ghostFlag );

  glob_rad_ang = ( (typeof glob_rad_ang !== 'undefined') ? glob_rad_ang : 0.0 );

  var cx = parseFloat(pad_entry.posx);
  var cy = parseFloat(pad_entry.posy);
  var sizex = parseFloat(pad_entry.sizex);
  var sizey = parseFloat(pad_entry.sizey);

  var ang = parseFloat(pad_entry.angle);

  var layer_mask = parseInt( pad_entry["layer_mask"], 16);
  var color = "rgba(255,255,255, 0.5)";

  if ( (layer_mask & 1) && (layer_mask & (1<<15)) )
    color = "rgba(255,255,0,0.5)";
  else if (layer_mask & 1)
    color = this.layer_color[0];
  else if (layer_mask & (1<<15))
    color = this.layer_color[15];

  if (ghostFlag) color = "rgba(255,255,255,0.25)";

  var name = pad_entry.name;

  //****
  ang = this._angleMod( ang + glob_rad_ang );
  //****

  var tx = cx + x;
  var ty = cy + y;
  g_painter.context.translate( tx, ty );
  g_painter.context.rotate( -ang );

  var drill_diam = parseFloat( pad_entry.drill_diam );

  if (drill_diam > 0.5)
  {
    var drill_x = parseFloat( pad_entry.drill_x );
    var drill_y = parseFloat( pad_entry.drill_y );

    if ( (!( "drill_shape" in pad_entry )) ||
         (pad_entry.drill_shape == "circle") )
    {
      g_painter.fillOblongHoleCircle( 0, 0, sizex, sizey, drill_x, drill_y, drill_diam/2, color );
    }
    else if (pad_entry.drill_shape == 'oblong')
    {
      var iox = parseFloat( pad_entry.drill_hole_extra_x );
      var ioy = parseFloat( pad_entry.drill_hole_extra_y );
      g_painter.fillOblongHoleOblong( 0, 0, sizex, sizey, drill_x, drill_y, iox, ioy, color );
    }


  }
  else
  {
    g_painter.fillOblong( 0, 0, sizex, sizey, color );
  }


  g_painter.context.rotate( ang );
  g_painter.context.translate( -tx, -ty );
}


bleepsixBoard.prototype._angleDegMod = function( deg )
{
  var q = Math.floor( deg / 360 );
  deg -= q * 360;

  if (deg >= 180 ) return deg - 360;
  if (deg < -180 ) return deg + 360;
  return deg;
}

// Figures out text orientation
// Cut points are at 90 and -90, at which point text orientation reverses.
// At 0 and 180, text is horizontal.  At 90 and -90, text has top to the left,
// bottom to the right.
//
bleepsixBoard.prototype._feq = function( a, b)
{
  return Math.abs( a-b ) < 0.001;
}

bleepsixBoard.prototype.getPadCenter = function( mod, pad )
{
  var mod_x = parseFloat(mod.x);
  var mod_y = parseFloat(mod.y);
  var mod_a = parseFloat(mod.angle);

  var px = parseFloat( pad.posx );
  var py = parseFloat( pad.posy );

  var p_r = numeric.dot( this._R( mod_a ), [px, py] );


  return { x : p_r[0] + mod_x, y : p_r[1] + mod_y };

}

bleepsixBoard.prototype._findTextDegAngle = function( loc_deg_ang, glob_deg_ang )
{
  loc_deg_ang = this._angleDegMod( loc_deg_ang );
  glob_deg_ang = this._angleDegMod( glob_deg_ang );

  /*
  if ((loc_deg_ang == 90) || (loc_deg_ang == -90))       loc_deg_ang = -90;
  else if ((loc_deg_ang==180) || (loc_deg_ang == -180))  loc_deg_ang = 0;
  else if (loc_deg_ang > 90)                             loc_deg_ang -= 180;
  else if (loc_deg_ang < -90)                            loc_deg_ang += 180;
 */
  if ( (this._feq(loc_deg_ang,  90)) || 
       (this._feq(loc_deg_ang, -90)))
    loc_deg_ang = -90;
  else if ((this._feq(loc_deg_ang,  180)) || 
           (this._feq(loc_deg_ang, -180)))
    loc_deg_ang = 0;
  else if (loc_deg_ang >  90)
    loc_deg_ang -= 180;
  else if (loc_deg_ang < -90)
    loc_deg_ang += 180;

  loc_deg_ang -= glob_deg_ang;

  if (loc_deg_ang >  180) loc_deg_ang -= 360;
  if (loc_deg_ang < -180) loc_deg_ang += 360;

  return loc_deg_ang;

}

// Footprint pad angle applied after posisiont.  So, to place a pad,
//   move to position posx, posy, then apply the rotation.  
//
// In our rendering, we've applied the rotation for the part
//   at the top layer before pad placement, so we need to take into
//   account the rotation that's already occured (as in 'rotate back')
//   and then apply any further rotation the pad has.
//
// g_rad_angle ccw
//
bleepsixBoard.prototype.drawFootprintPad = function( pad_entry, x, y, g_rad_ang, ghostFlag )
{
  ghostFlag = ( ( typeof ghostFlag === 'undefined' ) ? false : ghostFlag );


  var name = pad_entry["name"];
  var shape = pad_entry["shape"];
  var g_rad_ang = ( typeof g_rad_ang !== 'undefined' ? g_rad_ang : 0.0 );

  var drill_diam = parseFloat(pad_entry["drill_diam"]);

  var cx = parseFloat(pad_entry["posx"]);
  var cy = parseFloat(pad_entry["posy"]);
  var sizex = parseFloat(pad_entry["sizex"]);
  var sizey = parseFloat(pad_entry["sizey"]);

  var fp_x = cx - sizex/2;
  var fp_y = cy - sizey/2;
  var sx = cx - sizex/2;
  var sy = cy - sizey/2;

  var layer_mask = parseInt( pad_entry["layer_mask"], 16);
  var color = "rgba(255,255,255, 0.5)";

  if ( (layer_mask & 1) && (layer_mask & (1<<15)) )
    color = "rgba(255,255,0,0.5)";
  else if (layer_mask & 1)
    color = this.layer_color[0];
  else if (layer_mask & (1<<15))
    color = this.layer_color[15];

  if (ghostFlag) color = "rgba(255,255,255,0.25)";


  // TODO: other shapes
  // and holes (clear through)

  if      ( shape == "rectangle" ) 
  { 
    //g_painter.drawRectangle( fp_x + x, fp_y + y, sizex, sizey, 0, null, true, "rgba(255,0,0,0.3)"  );  
    //g_painter.drawRectangle( fp_x + x, fp_y + y, sizex, sizey, 0, null, true, color );  

    this._draw_pad_rect( pad_entry, x, y, g_rad_ang, ghostFlag );

    if (!ghostFlag)
      this._draw_pad_rect_text( pad_entry, x, y, g_rad_ang );
  }
  else if ( shape == "circle" )
  {
    //g_painter.circle( cx + x, cy + y, sizex/2, 0, null, true, color );  

    this._draw_pad_circle( pad_entry, x, y, g_rad_ang, ghostFlag);

    if (!ghostFlag)
      this._draw_pad_circle_text( pad_entry, x, y, g_rad_ang );
  }
  else if ( shape == "oblong" )
  {
    this._draw_pad_oblong( pad_entry, x, y, g_rad_ang, ghostFlag );

    if (!ghostFlag)
      this._draw_pad_oblong_text( pad_entry, x, y, g_rad_ang );
  }


  // WILL NEED to update to better adapt text size to 
  // pad sizes.  I don't know how KiCAD is doing this really...
  // it looks like if one dimension is much larger than the 
  // other (twice maybe?) then it takes the text size to be
  // the minimum.  But if not (that is, it's squre or close to it), 
  // then it doesn't scale the text to the edges.  Maybe half in that
  // case?
  // 
  //


  /*
  var loc_rad_ang = this._angleMod( parseFloat( pad_entry.angle ) );
  var loc_deg_ang = -loc_rad_ang * 180.0 / Math.PI;
  var g_deg_ang = g_rad_ang * 180.0 / Math.PI;
  
  var fin_angle = -g_deg_ang;

  if ( (shape == "rectangle") || 
       (shape == "oblong") )
  {

    if ( sizey > sizex )
    {
      if (sizey < 1.5*sizex) text_size = 0.5*sizex;
      else                   text_size = sizex;
      //fin_angle = this._findTextDegAngle( loc_deg_ang - 90, g_deg_ang );
      var a = loc_deg_ang + 90;
      fin_angle = this._findTextDegAngle( a, g_deg_ang );

      //console.log("sizey > sizex: fin_angle: " + fin_angle + ", locangle: " + a + ", globangle: " + g_deg_ang );

    }
    else
    {
      if (sizex < 1.5*sizey) text_size = 0.5 * sizey;
      else                   text_size = sizey;
      fin_angle = this._findTextDegAngle( loc_deg_ang, g_deg_ang );
    }

  }
  else if (shape == "circle")
  {
    text_size = 0.5*sizex;
  }

  var net_number = parseInt( pad_entry["net_number"] );

  if ( this.flag_display_net_name && 
       (net_number > 0) )
  {
    var net_name_len = pad_entry.net_name.length;

    //g_painter.drawText( pad_entry.net_name, cx + x, cy + y, "rgba(255,255,255,0.5)", text_size, fin_angle, "C", "C" );
    //g_painter.drawText( name, cx + x, cy + y, "rgba(255,255,255,0.5)", text_size, fin_angle , "C", "C");

  }
  else
  {
    if ( (this.flag_text_zoom_speedup) &&
         ((text_size * g_painter.zoom )  < this.display_text_zoom_threshold) )
        return;

    //g_painter.drawText( name, cx + x, cy + y, "rgba(255,255,255,0.5)", text_size, fin_angle , "C", "C");
  }
 */

}

bleepsixBoard.prototype.drawFootprint = function( data, x, y, rad_angle, draw_f01, ghostFlag )
{
  ghostFlag = ( ( typeof ghostFlag === 'undefined' ) ? false : ghostFlag );


  draw_f01 = ( typeof draw_f01 !== 'undefined' ? draw_f01 : false );
  debug_flag = ( typeof debug_flag !== 'undefined' ? debug_flag : false );

  var ind, p_ind;
  var name = data["name"];
  var art = data["art"];
  var pad = data["pad"];

  var ang = parseFloat( data["angle"] );

  // experimental:
  ang += rad_angle;

  x = parseFloat(x);
  y = parseFloat(y);

  g_painter.context.translate(x, y);
  g_painter.context.rotate( -ang );  // ang is ccw, html5 expects cw

  // we're going to need to worry about the order of operations as filling rectangles might
  // overwrite the inside
  //

  // Art can pick up the transform to display.  As such, it doesn't need knowledge
  // about the current transform, the angle, etc.
  //
  if (!ghostFlag)
  {
    for (ind in art)
    {

      var shape = art[ind]["shape"];

      if       ( shape == "segment" )   { this.drawFootprintSegment( art[ind], 0, 0 ); }
      else if  ( shape == "circle" )    { this.drawFootprintCircle( art[ind], 0, 0 );  }
      else if  ( shape == "arc" )       { this.drawFootprintArc( art[ind], 0, 0 );  }
      //else if  ( shape == "obround" )   { this.drawFootprintCircle( art[ind], x, y, orientation ); 
      //else if  ( shape == "trapeze" )   { this.drawFootprintCircle( art[ind], x, y, orientation ); 

    }
  }


  // Text and pads on the other, have text that displays text that tries to be vertical/right readable.
  // This means we have to take special care when displaying them to make sure they get rendered
  // proplerly, and this is why we need to pass in the current angle and whether the part is flipped
  // or not.
  //
  if (draw_f01)
  {
    if ("text" in data) {
      if (data["text"].length > 0 )
        this.drawFootprintTextField( data["text"][0], 0, 0, -ang );
      if (data["text"].length > 1 )
        this.drawFootprintTextField( data["text"][1], 0, 0, -ang );
    }
  }

  if ( data.unknownFlag )
  {
    this.drawFootprintTextField( data.unknownText, 0, 0, -ang );

  }
  
  var text_offset = parseInt( data["text_offset"] );

  var viewbox =  [ [ g_painter.view.x1, g_painter.view.y1 ],
                   [ g_painter.view.x2, g_painter.view.y2 ] ];


  for (ind in pad)
  {

    // TODO: footprint library window doesn't render pads properly 
    // when this flag is set.
    if (this.flag_bounding_box_speedup)
      if ("bounding_box" in pad[ind])
        if (!(this._box_box_intersect( viewbox, pad[ind].bounding_box )))
          continue;

    // holes: http://www.storminthecastle.com/2013/07/24/how-you-can-draw-regular-polygons-with-the-html5-canvas-api/
    // pass in cw angles (in radians)
    this.drawFootprintPad( pad[ind], 0, 0, -ang, ghostFlag );
  }

  g_painter.context.rotate( ang );
  g_painter.context.translate(-x, -y);

  //if (this.draw_bounding_box_flag)
  if (this.flag_draw_bounding_box)
  {
    this.drawBoundingBox( data["bounding_box"] );

    if ( "coarse_bounding_box" in data)
      this.drawBoundingBox( data["coarse_bounding_box"], "rgba(120,255,255,0.3)" , 40 );


    for (var pad_ind in data["pad"])
      if ( "bounding_box" in data["pad"][pad_ind] )
        this.drawBoundingBox( data["pad"][pad_ind].bounding_box );

  }

  if (this.draw_id_text_flag)
  {
    var bb = data["bounding_box"];
    g_painter.drawText( data.id, bb[1][0], bb[1][1], "rgba(255,255,255,0.3)", 50, 0.0, "L", "C" );
  }

}


// might be crufty...will have to come back to it
//
bleepsixBoard.prototype.drawBoardText = function( text )
{

  if (!text["visible"])
    return;

  var layer = parseInt( text["layer"] );
  var x = parseInt( text["x"] );
  var y = parseInt( text["y"] );
  var a = parseFloat( text["angle"] );
  var s = text["text"];
  var sizex = parseInt( text["sizex"] );
  var sizey = parseInt( text["sizey"] );

  var font_height = sizey;

  //var width = parseInt( text["penwidth"] );
  var width = parseInt( text["width"] );

  var color = this.layer_color[layer];
  var angle_deg = parseFloat( text["angle"] ) * 180.0 / Math.PI;

  var texts = s.split( "\n" );
  d_offset = numeric.dot( this._R(-a), [ 0, sizey ] );
  offset = [0,0];

  for (var ind in texts)
  {
    g_painter.drawText( texts[ind], x + offset[0], y + offset[1], color, font_height, angle_deg, "C", "C" );
    offset[0] += d_offset[0];
    offset[1] += d_offset[1];
  }

}

// restricts to [-pi , pi)
//
bleepsixBoard.prototype._angleMod = function( rad )
{
  var q = Math.floor( rad / (2.0 * Math.PI) );
  var r = rad - (q*2.0*Math.PI);

  if (r >= Math.PI) return r - (2.0*Math.PI);
  if (r < -Math.PI) return r + (2.0*Math.PI);

  return r;
}



// All oriented text fields display for vertical reading when
// 0 or 180 degrees.  When the angle crosses -90 or 90 degrees,
// the orienation flips from one to the other.
// At the -90 and 90, text is rendered to have top pointing to
// the left, and bottom pointing to the right.
// 
// Text fields (as far as I understand) have the angle information
// needed to display without needing information from a higher
// level.
//
// Though the text field has the angle that it's rotated at, to
// draw, we've rotated at the render level, se we need to pass in
// the angle in order to compensate.
//
// To be clear: g_rad_ang should only be used internally.  To rotate
// the module (and thus the text fields), the modules internal
// angle and sub fields (such as text) should be modified via,
// say, rotationAboutPoint
//
bleepsixBoard.prototype.drawFootprintTextField = function( text_field, fp_x, fp_y, g_rad_ang )
{
  //var flag = ( (typeof flag !== 'undefined') ? flag : 'N' );

  ghostFlag = ( ( typeof ghostFlag === 'undefined' ) ? false : ghostFlag );

  if (! text_field["visible"]) 
    return;

  var flag = text_field.flag;
  var is_flipped = false;
  if (flag == 'M') is_flipped = true;


  var s = text_field["text"];
  var x = parseFloat( text_field["x"] );
  var y = parseFloat( text_field["y"] );
  var line_width = parseFloat( text_field["penwidth"] );
  var sizex = parseFloat( text_field["sizex"] );
  var sizey = parseFloat( text_field["sizey"] );

  var layer = parseInt( text_field["layer"] );
  var color = this.layer_color[layer];

  if (ghostFlag) color = "rgba(255,255,255,0.25)";

  var loc_rad_ang = this._angleMod( parseFloat(text_field.angle) );
  var loc_deg_ang = -loc_rad_ang * 180.0 / Math.PI ;
  var g_deg_ang = g_rad_ang * 180.0 / Math.PI;

  var text_size = sizey;

  loc_deg_ang = this._findTextDegAngle( loc_deg_ang, g_deg_ang );

  color = "rgba(255,255,255,0.7)";

  if ( text_field["flag"].match(/M/) )
    color = "rgba(0,0,255,0.7)";

  //g_painter.drawText( s , fp_x + x, fp_y + y, color, text_size, loc_deg_ang, "C", "C", is_flipped);

  if (this.flag_utf8_hershey_ascii_font_loaded)
    g_painter.drawTextFont( s , 
        this.utf8_hershey_ascii_font,
        fp_x + x, fp_y + y, 
        color, 
        sizex, sizey,
        //sizey, sizex,
        line_width,
        loc_deg_ang, 
        "C", "C", 
        is_flipped);

  else
    console.log("ERROR: bleepsixBoard.drawFootprintTextField: font error");
}


bleepsixBoard.prototype.drawBoardTrack = function( ele, ghostFlag  )
{
  ghostFlag = ( ( typeof ghostFlag === 'undefined' ) ? false : ghostFlag );

  var layer = parseInt( ele["layer"] );
  var shape = ele["shape"] ;

  var x0 = parseFloat( ele["x0"] );
  var y0 = parseFloat( ele["y0"] );

  var x1 = parseFloat( ele["x1"] );
  var y1 = parseFloat( ele["y1"] );

  var width = parseInt( ele["width"] );
  var text_size = width * 0.9;

  var color = this.layer_color[layer];

  if (ghostFlag) color = "rgba(255,255,255,0.25)";

  // bounding box draw
  //
  if (this.flag_draw_bounding_box)
    g_painter.line( ele.x0, ele.y0, ele.x1, ele.y1, "rgba(255,255,255,0.4)", 2*width );


  // track/via draw
  //
  if ( shape == "track" )
    g_painter.line( x0, y0, x1, y1, color, width );
  else if (shape == "through")  //via
    g_painter.circle( x0, y0, width/2, 0, color, true, "rgba(255,255,255,0.4)");


  // draw text 
  //
  var fudge = 5;
  var text_height = width;
  var netcode = parseInt( ele.netcode );


  // Draw ID before any of the return checks if the flag is set.
  //
  if (this.draw_id_text_flag)
  {
    var bb = ele["bounding_box"];
    g_painter.drawText( ele.id, bb[1][0], bb[1][1], "rgba(255,255,255,0.3)", 50, 0.0, "L", "C" );
  }



  if (netcode == 0) return;

  if (!this.flag_display_net_name)
    return;

  if ( (this.flag_text_zoom_speedup) &&
       ((text_size * g_painter.zoom )  < this.display_text_zoom_threshold) )
    return;


  var net_name = this.kicad_brd_json.net_code_map[netcode];

  if (!net_name) return;

  var text_char_width = text_height * 0.6;
  var text_len = net_name.length * text_char_width;

  if (text_len == 0) return;

  var x = x0, y = y0;

  var track_len = 0;
  var ang = 0.0;

  if (shape == "track")
  {
    if ( x0 == x1 )
    {
      ang = -90.0;
      track_len = Math.abs(y0 - y1);
      x = x0 + fudge;
      y = y0 + (y1 - y0) / 2;
    }
    else if (y0 == y1)
    {
      track_len = Math.abs(x0 - x1);
      y = y0+fudge;
      x = x0 + (x1 - x0)/2;
    }
    else
      return

    if ( track_len < (2 * text_len) ) return;
  }
  else if (shape == "through")
  {
    text_height = width / (net_name.length + 3);
  }
  else  // unknown property
  {
    return;
  }

  g_painter.drawText( net_name, 
                      x, y, 
                      this.net_name_text_color,
                      text_height,
                      ang, "C", "C" );


}

bleepsixBoard.prototype.drawBoardSegment = function( ele )
{
  ghostFlag = ( ( typeof ghostFlag === 'undefined' ) ? false : ghostFlag );
  if (ghostFlag) color = "rgba(255,255,255,0.25)";

  var layer = parseInt( ele["layer"] );
  var color = this.layer_color[layer];
  var shape = ele["shape"];

  var x0 = parseFloat( ele["x0"] );
  var y0 = parseFloat( ele["y0"] );

  var x1 = parseFloat( ele["x1"] );
  var y1 = parseFloat( ele["y1"] );

  var width = parseFloat( ele["width"] );

  if (ghostFlag) color = "rgba(255,255,255,0.25)";

  //if (layer == 28) color = "rgba(255,255,0,0.4)";

  if (shape == "line")
  {
    g_painter.line(x0, y0, x1, y1, color, width);

    if (this.flag_draw_bounding_box)
      g_painter.line( ele.x0, ele.y0, ele.x1, ele.y1, "rgba(255,255,255,0.4)", 2*width );

  }
  else if (shape == "circle")
  {
    var x = parseFloat( ele.x );
    var y = parseFloat( ele.y );
    var r = parseFloat( ele.r );

    g_painter.circle( x, y, r, width, color );

    if (this.flag_draw_bounding_box)
      this.drawBoundingBox( ele.bounding_box );

  }
  else if (shape == "arc")
  {
    var x = parseFloat( ele.x );
    var y = parseFloat( ele.y );
    var r = parseFloat( ele.r );

    var sa = parseFloat( ele.start_angle );
    var ang = parseFloat( ele.angle );
    var ccw_flag = ele.counterclockwise_flag;

    g_painter.drawArc( x, y, r, sa, sa + ang, ccw_flag, width, color );

    if (this.flag_draw_bounding_box)
      this.drawBoundingBox( ele.bounding_box );

  }

  if (this.draw_id_text_flag)
  {
    var bb = ele["bounding_box"];
    g_painter.drawText( ele.id, bb[1][0], bb[1][1], "rgba(255,255,255,0.3)", 50, 0.0, "L", "C" );
  }



}

bleepsixBoard.prototype.drawBoardCZone = function( ele )
{
  ghostFlag = ( ( typeof ghostFlag === 'undefined' ) ? false : ghostFlag );


  var n = ele.zcorner.length;
  for (var ind=0; ind < ele.zcorner.length; ind++)
  {
    var p0 = ele.zcorner[ind];
    var p1 = ele.zcorner[(ind + 1)%n];
    g_painter.line( p0.x, p0.y, p1.x, p1.y, "rgba(255,255,255,0.4)", 100 );
  }

  if (this.boardProperties.zoneDisplayable)
  {
    var pgn = [];
    var pc = ele.polyscorners;
    var layer = parseInt(ele.layer);

    var color = ( ( typeof this.layer_color[layer] !== 'undefined' ) ? this.layer_color[layer] : "rgba(255,0,0,0.3)" );
    if (ghostFlag) color = "rgba(255,255,255,0.25)";

    if (pc.length > 0 )
    {
      for (var i=0; i < pc.length; i++)
      {
        pgn.push( [ pc[i].x0, pc[i].y0 ] );
      }
      //g_painter.drawBarePolygon( pgn, 0, 0, "rgba(255,0,0,0.3)" );
      g_painter.drawBarePolygon( pgn, 0, 0, color );

      //g_painter.drawPolygon( pgn, 0, 0, 
      //                       "rgba(255,0,0,0.3)", true,
      //                       ele.min_thickness, true
      //                     );
    }
  }

  return;

  for (var ind=1; ind < ele.zcorner.length; ind++)
  {
    var p0 = ele.zcorner[ind-1];
    var p1 = ele.zcorner[ind];
    g_painter.line( p0.x, p0.y, p1.x, p1.y, "rgba(255,255,255,0.4)", 100 );
  }

  if (ele.zcorner.length > 1)
  {
    var k = ele.zcorner.length-1;
    g_painter.line( ele.zcorner[0].x, ele.zcorner[0].y,
                    ele.zcorner[k].x, ele.zcorner[k].y,
                    "rgba(255,255,255,0.4)", 100);
  }

  for (var ind=1; ind < ele.polyscorners.length; ind++)
  {
    var p0 = ele.polyscorners[ind-1];
    var p1 = ele.polyscorners[ind];
    g_painter.line( p0.x0, p0.y0, p1.x0, p1.y0, "rgba(255,255,255,0.2)", 100 );
  }

  /*
  if (ele.polyscorners.length > 1)
  {
    var k = ele.polyscorners.length-1;
    g_painter.line( ele.polyscorners[0].x, ele.polyscorners[0].y,
                    ele.polyscorners[k].x, ele.polyscorners[k].y,
                    "rgba(255,255,255,0.4)", 100);
  }
 */

}

bleepsixBoard.prototype.drawBoardModule = function( ele, ghostFlag )
{

  var x = parseFloat( ele["x"] );
  var y = parseFloat( ele["y"] );
  var orientation = parseFloat( ele["orientation"] );
  var rad_angle = parseFloat( ele["angle"] );

  //this.drawFootprint( ele, x, y, rad_angle );
  //this.drawFootprint( ele, x, y, 0 );
  this.drawFootprint( ele, x, y, 0, true, ghostFlag );

}


bleepsixBoard.prototype.tick = function()
{

  this.flag_draw_ratsnest_shimmer_active = false;
  if (this.flag_draw_ratsnest_shimmer)
  {

    var d = new Date();
    var msec = (d.getTime() - this.draw_ratsnest_shimmer_last_time.getTime());

    if (msec > this.draw_ratsnest_shimmer_delay)
    {

      var a = msec - this.draw_ratsnest_shimmer_delay;
      var p = a / this.draw_ratsnest_shimmer_duration;

      // reset time, we're done
      if (p >= 1.0)
      {
        this.draw_ratsnest_shimmer_last_time = d;
        g_painter.dirty_flag = true;
      }
      else
      {

        this.flag_draw_ratsnest_shimmer_active = true;
        this.draw_ratsnest_shimmer_p = p;
        g_painter.dirty_flag = true;

      }
    }
  }

}

bleepsixBoard.prototype.drawElement = function( ele )
{
  var type = ele.type;

  if      ( type == "track" )         { this.drawBoardTrack( ele ); }
  else if ( type == "drawsegment" )   { this.drawBoardSegment( ele ); }
  else if ( type == "module" )        { this.drawBoardModule( ele ); }
  else if ( type == "text" )          { this.drawBoardText( ele ); }
  else if ( type == "czone" )         { this.drawBoardCZone( ele ); }
  else {
    console.log("ERROR: bleepsixBoard.drawElement: unhandled draw type: " + type);
  }

}


bleepsixBoard.prototype.drawGhostElement = function( ele )
{
  var type = ele.type;

  if      ( type == "track" )         { this.drawBoardTrack( ele, true ); }
  else if ( type == "drawsegment" )   { this.drawBoardSegment( ele, true ); }
  else if ( type == "module" )        { this.drawBoardModule( ele, true ); }
  else if ( type == "text" )          { this.drawBoardText( ele, true ); }
  else if ( type == "czone" )         { this.drawBoardCZone( ele, true  ); }
  else {
    console.log("ERROR: bleepsixBoard.drawElement: unhandled draw type: " + type);
  }

}



bleepsixBoard.prototype.drawBoard = function()
{
  this.updateBoundingBox();
  //this.updateRatsNest(undefined, undefined, this.kicad_brd_json.brd_to_sch_net_map );

  var brd = this.kicad_brd_json;
  var ele_list = brd.element;

  var viewbox = [ [ g_painter.view.x1, g_painter.view.y1 ],
                  [ g_painter.view.x2, g_painter.view.y2 ] ];

  for (var ind in ele_list)
  {

    type = ele_list[ind]["type"];

    if ( ("hideFlag" in ele_list[ind]) &&
         ele_list[ind].hideFlag )
    {
      continue;
    }

    if ( this.flag_bounding_box_speedup)
    {
      if ( "coarse_bounding_box" in ele_list[ind])
      {
        if ( !this._box_box_intersect( viewbox, ele_list[ind].coarse_bounding_box ) )
        {
          continue;
        }
      }
    }

    this.drawElement( ele_list[ind] );

  }

  for (var ind in this.debug_point)
  {
    g_painter.drawPoint( this.debug_point[ind].X, 
                         this.debug_point[ind].Y , 
                         "rgba(255,128,64,0.8)" );
  }

  for (var ind in this.debug_edge)
  {
    var g = this.debug_edge[ind];
    g_painter.line( g[0][0], g[0][1], g[1][0], g[1][1], "rgba(128,128,128,1.0)", 10 );
  }

  for (var ind in this.debug_geom)
  {
    g_painter.drawPath( this.debug_geom[ind], 0, 0, "rgba(255,128,64,0.8)", 20 );
  }

  for (var ind in this.debug_cgeom)
  {
    g_painter.drawPath( this.debug_cgeom[ind].pnts, 0, 0, this.debug_cgeom[ind].color, 20 );
  }

  for (var ind in this.debug_pgns)
  {
    var pgn = this.debug_pgns[ind];
    var color = "rgba(128,255,64,0.8)";
    if (ClipperLib.Clipper.Orientation( pgn ))
      color = "rgba(128,64,255,0.8)";
    g_painter.drawPath( this._pgn2pnt(pgn), 0, 0, color, 20 );
  }

  if (this.highlight_net_flag)
  {
    g_painter.drawBarePolygons( this.highlight_net,
                                0, 0,
                                "rgba(255,255,255,0.5)");
  }

  if (this.flag_draw_ratsnest)
  {
    var brd = this.kicad_brd_json;
    for (var nc in brd.net_code_airwire_map)
    {
      for (var ind in brd.net_code_airwire_map[nc])
      {
        var lin = brd.net_code_airwire_map[nc][ind];

        if ( this.flag_draw_ratsnest_shimmer && 
             this.flag_draw_ratsnest_shimmer_active )

        {
              g_painter.drawGradientLine( lin.x0, lin.y0,
                                          lin.x1, lin.y1,
                                          30,
                                          "rgba(255,255,255,0.6)",
                                          "rgba(255,255,255,0.8)",
                                          this.draw_ratsnest_shimmer_p,
                 -10000, -10000, 10000, 10000 );

        }
        else
        {
          g_painter.line( lin.x0, lin.y0, lin.x1, lin.y1, "rgba(255,255,255,0.6)", 30);
        }
      }
    }
  }
}



bleepsixBoard.prototype.drawBoundingBox = function( b, color, width )
{
  color = ( typeof color !== 'undefined' ? color : "rgba(255,255,255,0.5)" );
  width = ( typeof width !== 'undefined' ? width : 20 );
  var w = b[1][0] - b[0][0];
  var h = b[1][1] - b[0][1];

  g_painter.drawRectangle( b[0][0], b[0][1], w, h, width, color );
}

bleepsixBoard.prototype.updateTextBoundingBox = function( text_entry ) 
{

  var x = parseFloat( text_entry.x );
  var y = parseFloat( text_entry.y );

  var sx = parseFloat( text_entry.sizex );
  var sy = parseFloat( text_entry.sizey );

  var l = text_entry.text.length;

  var xm = -sx * l/2;
  var ym =  sx ;

  var xM =  sx * l/2;
  var yM =  sx ;

  if (!("bounding_box" in text_entry))
    text_entry.bounding_box = [ [0,0],[0,0] ];

  if (!("coarse_bounding_box" in text_entry))
    text_entry.coarse_bounding_box = [ [0,0],[0,0] ];

  text_entry.bounding_box[0][0] = xm + x;
  text_entry.bounding_box[0][1] = ym + y;
  text_entry.bounding_box[1][0] = xM + x;
  text_entry.bounding_box[1][1] = yM + y;

  text_entry.coarse_bounding_box[0][0] = xm + x;
  text_entry.coarse_bounding_box[0][1] = ym + y;
  text_entry.coarse_bounding_box[1][0] = xM + x;
  text_entry.coarse_bounding_box[1][1] = yM + y;

}

bleepsixBoard.prototype.updatePointBoundingBox = function( pnt_entry )
{
  var ds = 50;

  var x = parseFloat( pnt_entry["x"] );
  var y = parseFloat( pnt_entry["y"] );

  var bbox = [ [0,0],[0,0] ];

  bbox[0][0] = x - ds;
  bbox[0][1] = y - ds;
  bbox[1][0] = x + ds;
  bbox[1][1] = y + ds;

  pnt_entry["bounding_box"] = bbox;
}


bleepsixBoard.prototype.updateLineBoundingBox = function( line_entry ) 
{
  var ds = 50;
  var eps = 5;

  var x0 = parseFloat( line_entry["x0"] );
  var y0 = parseFloat( line_entry["y0"] );

  var x1 = parseFloat( line_entry["x1"] );
  var y1 = parseFloat( line_entry["y1"] );

  var mx = Math.min(x0, x1);
  var my = Math.min(y0, y1);

  var Mx = Math.max(x0, x1);
  var My = Math.max(y0, y1);

  var w = parseFloat( line_entry["width"] );
  var shape = line_entry["shape"];

  var bbox = [ [mx, my], [Mx, My] ];
  if ( (shape == "track") ||
       (shape == "through") ||
       (shape == "line") )
  {

    bbox[0][0] -= w;
    bbox[0][1] -= w;

    bbox[1][0] += w;
    bbox[1][1] += w;

  }

  if ("bounding_box" in line_entry)
  {
    line_entry.bounding_box[0][0] = bbox[0][0];
    line_entry.bounding_box[0][1] = bbox[0][1];
    line_entry.bounding_box[1][0] = bbox[1][0];
    line_entry.bounding_box[1][1] = bbox[1][1];
  }
  else
  {
    line_entry["bounding_box"] = bbox;
  }

  if ( !("coarse_bounding_box" in line_entry) )
    line_entry["coarse_bounding_box"] = [ [0,0],[0,0] ];

  line_entry.coarse_bounding_box[0][0] = bbox[0][0] ;
  line_entry.coarse_bounding_box[0][1] = bbox[0][1] ;
  line_entry.coarse_bounding_box[1][0] = bbox[1][0] ;
  line_entry.coarse_bounding_box[1][1] = bbox[1][1] ;

}



// Make 2d rotation matrix with ang being the counter clockwise rotation
// angle in radians.
// (convenience function)
//
//  For use with numeric.  Numeric expects column vectors, so the below
//  is really:
//
//  | cos(ang)  -sin(ang) |
//  | sin(ang)   cos(ang) |
//
bleepsixBoard.prototype._R = function( ang )
{
  return [ [ Math.cos(ang), Math.sin(ang) ], [ -Math.sin(ang), Math.cos(ang) ] ];
}

// Transpose (and inverse) of _R above
//
//  For use with numeric.  Numeric expects column vectors, so the below
//  is really:
//
//  |  cos(ang)  sin(ang) |
//  | -sin(ang)  cos(ang) |
//
bleepsixBoard.prototype._Rt = function( ang )
{
  return [ [ Math.cos(ang), -Math.sin(ang) ], [ Math.sin(ang), Math.cos(ang) ] ];
}

// update bounding boxes are different from finds.  the 'find' methods find
// the initial bounding box, which doesn't need to be recalculated every time.
// The 'update' methods taking into account position and rotation.

bleepsixBoard.prototype.updateDrawSegmentBoundingBox = function( ele )
{

  var R = this._R(ang);
  var X = [ [ parseFloat( ele["x0"] ), parseFloat( ele["y0"] ) ],
            [ parseFloat( ele["x1"] ), parseFloat( ele["y1"] ) ] ];

  var Y = numeric.transpose( numeric.dot( R, numeric.transpose(X) ) );

  var xm = Math.min( x + Y[0][0], x + Y[1][0] );
  var ym = Math.min( y + Y[0][1], y + Y[1][1] );

  var xM = Math.max( x + Y[0][0], x + Y[1][0] );
  var yM = Math.max( y + Y[0][1], y + Y[1][1] );

  var bbox = ele["bounding_box"];
  bbox[0][0] = xm;
  bbox[0][1] = ym;

  bbox[1][0] = xM;
  bbox[1][1] = yM;


}

bleepsixBoard.prototype.updateModuleCircleBoundingBox = function( art_entry, x, y, ang ) 
{
  var transform = this._R(ang);
}

bleepsixBoard.prototype.updateModuleTextFieldBoundingBox = function( text_entry, x, y, ang ) 
{
  var transform = this._R(ang);
}

bleepsixBoard.prototype.updateModulePadBoundingBox = function( pad_entry, x, y, ang ) 
{
  var transform = this._R(ang);
}

bleepsixBoard.prototype.updateCZoneBoundingBox = function( mod_entry ) 
{
}

bleepsixBoard.prototype.updateModuleBoundingBox = function( mod_entry ) 
{
  this._find_footprint_bounding_box( mod_entry );

  return;

  var x = parseFloat( mod_entry["x"] );
  var y = parseFloat( mod_entry["y"] );
  var ang = parseFloat( mod_entry["angle"] );

  var Rt = this._Rt(ang);

  var bbox = mod_entry["bounding_box"];
  var coarse_bbox = mod_entry["coarse_bounding_box"];

  var b = [ [ bbox[0][0], bbox[0][1] ],
            [ bbox[1][0], bbox[0][1] ],
            [ bbox[1][0], bbox[1][1] ],
            [ bbox[0][0], bbox[1][1] ] ];

  var b_r = numeric.dot( b, Rt  );

  var xm = Math.min( b_r[0][0], b_r[1][0], b_r[2][0], b_r[3][0] );
  var ym = Math.min( b_r[0][1], b_r[1][1], b_r[2][1], b_r[3][1] );

  var xM = Math.max( b_r[0][0], b_r[1][0], b_r[2][0], b_r[3][0] );
  var yM = Math.max( b_r[0][1], b_r[1][1], b_r[2][1], b_r[3][1] );

  bbox[0][0] = xm + x;
  bbox[0][1] = ym + y;

  bbox[1][0] = xM + x;
  bbox[1][1] = yM + y;

  coarse_bbox[0][0] = bbox[0][0];
  coarse_bbox[0][1] = bbox[0][1];
  coarse_bbox[1][0] = bbox[1][0];
  coarse_bbox[1][1] = bbox[1][1];

  for (var ind in mod_entry.text)
  {
    //continue;

    var text_entry = mod_entry.text[ind];
    var sx = parseFloat( text_entry.sizex );
    var sy = parseFloat( text_entry.sizey );

    var tx = parseFloat ( text_entry.x );
    var ty = parseFloat ( text_entry.y );

    var l = text_entry.text.length ;

    coarse_bbox[0][0] =  Math.min( coarse_bbox[0][0], x + tx - (sx*l/2) );
    coarse_bbox[0][1] =  Math.min( coarse_bbox[0][1], y + ty - sx )
    coarse_bbox[1][0] =  Math.max( coarse_bbox[1][0], x + tx + (sx*l/2) );
    coarse_bbox[1][1] =  Math.max( coarse_bbox[1][1], y + ty + sx )

  }

}

bleepsixBoard.prototype.load_part = function(name, data)
{
  // decorate with type
  data.type = "module";

  // footprint_cache is the cache of footprint modules
  //
  g_footprint_cache[name] = data;

  this._find_footprint_bbox( g_footprint_cache[name] );
  
  this.queued_display_footprint_count--;

  if (this.queued_display_footprint_count == 0)
  {
    this.displayable = true;
    g_painter.dirty_flag = true;
  }

}

bleepsixBoard.prototype.load_part_error = function(part_json, jqxr, textStatus, error)
{
  console.log( "part load error (" + part_json +"): " + textStatus + ", " + error);
}

bleepsixBoard.prototype.load_board_error = function(brd_json, jqxr, textStatus, error)
{
  console.log( "board load error (" + brd_json +"): " + textStatus + ", " + error);
}


bleepsixBoard.prototype._decorateBoardWithIds = function( )
{
  var brd = this.kicad_brd_json["element"];
  var ind;

  for (ind in brd)
  {

    if ( (!("id" in brd[ind])) ||
         ( String(brd[ind].id).length == 0 ) )
      brd[ind].id = this._createId();


    if (brd[ind]["type"] == "module")
    {

      for (var t_ind in brd[ind]["text"])
      {

        if ( (!("id" in brd[ind].text[t_ind])) ||
             ( String(brd[ind].text[t_ind].id) == 0) )
          brd[ind]["text"][t_ind].id  = this._createId( brd[ind].id );
      }

      for (var p_ind in brd[ind]["pad"])
      {
        if ( (!("id" in brd[ind].pad[p_ind])) ||
             ( String(brd[ind].pad[p_ind].id) == 0) )
          brd[ind].pad[p_ind].id = this._createId( brd[ind].id );
      }
    }

  }

}

bleepsixBoard.prototype._setupNetMappings = function()
{
  var equipot = this.kicad_brd_json["equipot"];
  var net_code_map = {};
  var net_name_map = {};

  for (var ind in equipot)
  {
    ep = equipot[ind];

    var net_code = parseInt(ep["net_number"]);
    var net_name = ep["net_name"];

    net_code_map[net_code] = net_name;
    net_name_map[net_name] = net_code;
  }

  this.kicad_brd_json["net_code_map"] = net_code_map;
  this.kicad_brd_json["net_name_map"] = net_name_map;

  //DBEUG
  //console.log("net name maps");
  //console.log(net_code_map);
  //console.log(net_name_map);
}

// Load full brd from json data (brd file assumed to be converted to json format)
//
bleepsixBoard.prototype.load_board = function( json )
{

  this.kicad_brd_json = json;

  // The board contains all information to display without need to call
  // on the footprint cache.
  //
  this._decorateBoardWithIds();
  this._setupNetMappings();

  var brd = this.kicad_brd_json["element"];

  if (!bleepsixBoardHeadless)
    g_painter.dirty_flag = true;

  for (var vind in brd)
  {
    var type = brd[vind].type;
    var ref = brd[vind];

    brd[vind].hideFlag = false;

    if      ( type == "module" )
    {
      this._find_footprint_bbox( brd[vind] );
    }
    else if ( ( type == "drawsegment" ) ||
              ( type == "track") )
    {
      this._find_line_bbox( brd[vind] )
    }
    else if ( type == "czone" )
    {
      this._find_czone_bbox( brd[vind] );
      
      //miscellaneous initialization
      //
      brd[vind].tainted = false;

    }

    if (brd[vind]["type"] != "module") continue;

    var footprint = brd[vind];

    var name = this.toCacheName( footprint["name"] );

    if (bleepsixBoardHeadless)
      continue;

    if (name in g_footprint_cache)
    {
      // nothing to do...
    }
    else
    {
      //this.displayable = false;

      //var part_json = "json/" + name + ".json";
      if ( (!(name in g_footprint_location)) &&
           ( name != 'unknown' ) )
      {
        console.log("ERROR: bleepsixBoard.load_board: " + name + " not in g_footprint_location");

        //DEBUG
        var x = g_footprint_location[name];
        console.log( x );

        continue;
        //return;
      }
      else if (name == 'unknown')
      {
        //DEBUG
        //console.log("footprint of special type 'unknown'");
        continue;
      }

      //console.log(g_footprint_location[name]);
      var part_json = g_footprint_location[name].location;

      //console.log("trying to load " + part_json);


      // A litle fancy footing here.
      // If we just created a callback via 'function(data) { controller.load_part( name, data); }',
      // this would reference the global name and data.  By forcing an evaluation, it loads
      // the current value of name and data, then scope is withdrawn and the old values stick.
      // blech, bad description, see here: 
      //   http://stackoverflow.com/questions/750486/javascript-closure-inside-loops-simple-practical-example

      //console.log("bleepsixBoard.load_board: fetching footprint: " + name +" from " + part_json);

      if (bleepsixBoardHeadless)
        continue;

      g_brdnetwork.fetchModule( 
          name, 
          part_json,

          (function(xx) {
            return function(nam,dat) { xx.load_part(nam,dat); };
          })(this),
          
          (function(xx) {
            return function(dat, jqxhr, textStatus, error) {
              xx.load_part_error(dat, jqxhr, textStatus, error);
            };
          })(this)
        );


      /*
      var Board = this;
      $.ajaxSetup({ cache : false });
      $.getJSON( part_json,
        ( function(a) {
            return function(data) {
              Board.load_part(a, data);
            }
          }
        )(name)
      ).fail(
        ( function(a) {
            return function(jqxhr, textStatus, error) {
              Board.load_part_error(a, jqxhr, textStatus, error);
            }
          }
        )(part_json)
      );			
      */

      this.queued_display_footprint_count++;

    }
  }

  /*
  // The case where all our library components are cached, we need to ask for a redraw
  //
  if (this.queued_display_footprint_count == 0)
    g_painter.dirty_flag = true;
   */

}


if (typeof module !== 'undefined')
{
  module.exports = bleepsixBoard;
}
