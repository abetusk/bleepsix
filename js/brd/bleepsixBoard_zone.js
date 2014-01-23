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

if (typeof module !== 'undefined')
{
  var bleepsixBoard = require("./bleepsixBoard_ratsnest.js");
  module.exports = bleepsixBoard;
}


// zone functions for bleepsixBoard
//
//

bleepsixBoard.prototype._make_edge_key = function ( x0, y0, x1, y1 )
{
  var scale = 1000000000;

  var pnt0, pnt1;

  var fx0 = Math.floor( scale * x0 );
  var fy0 = Math.floor( scale * y0 );

  var fx1 = Math.floor( scale * x1 );
  var fy1 = Math.floor( scale * y1 );

  var str_x0 = (scale*parseFloat(x0)).toFixed(0);
  var str_y0 = (scale*parseFloat(y0)).toFixed(0);

  var str_x1 = (scale*parseFloat(x1)).toFixed(0);
  var str_y1 = (scale*parseFloat(y1)).toFixed(0);

  var key = null;

  if ( fx0 <= fx1 )
  {
    if (fx0 == fx1)
    {
      if (fy0 < fy1)
        key = str_x0 + ":" + str_y0 + ";" + str_x1 + ":" + str_y1;
      else
        key = str_x1 + ":" + str_y1 + ";" + str_x0 + ":" + str_y0;
    }
    else
        key = str_x0 + ":" + str_y0 + ";" + str_x1 + ":" + str_y1;
  }
  else
    key = str_x1 + ":" + str_y1 + ";" + str_x0 + ":" + str_y0;

  return key;

}

bleepsixBoard.prototype._make_pgns_from_pnts_r = function ( res, contour, cur_idx )
{
  var pgn = [];

  while ( cur_idx < contour.length )
  {
    pgn.push( contour[cur_idx] );

    if ( contour[cur_idx].edge_weight > 0 )
      cur_idx = this._make_pgns_from_pnts_r( res, contour, cur_idx+1 );
    else if (contour[cur_idx].edge_weight < 0)
      break;

    cur_idx++;
  }

  if (pgn.length > 2)
    res.push(pgn);
  return cur_idx;

}

bleepsixBoard.prototype._make_pgns_from_pnts = function ( pnts )
{

  var point_hash = {};
  var edge_hash = {};

  var contour = [ ];

  var tp = pnts[ pnts.length - 1 ];
  pnts.splice(0,0, tp );

  for (var i=1; i<pnts.length; i++)
  {

    var edge_key = this._make_edge_key( pnts[i-1][0], pnts[i-1][1], pnts[i][0], pnts[i][1] );

    if (edge_key in edge_hash)
    {
      var idx = edge_hash[edge_key].pos[0];
      edge_hash[edge_key].pos.push( i-1 );
      contour.push( { X : pnts[i-1][0], Y: pnts[i-1][1], edge_weight : -1, jumplist : [ idx, i ] } );
      contour[idx].edge_weight = 1;
      contour[idx].jumplist.push( i );
    }
    else
    {
      edge_hash[edge_key] = { pos : [ i-1 ] };
      contour.push( { X : pnts[i-1][0], Y: pnts[i-1][1], edge_weight : 0, jumplist: [ i ]  } );
    }

  }

  var n = pnts.length;
  contour.push( { X : pnts[n-1][0] , Y: pnts[n-1][1], edge_weight: 0, jumplist: [ n-1 ] } );


  var res = [];
  this._make_pgns_from_pnts_r( res, contour, 0 );

  return res;

}


bleepsixBoard.prototype._make_thermal_pad_rect_geometry = function( mod, pad, thickness, distance )
{
  var inset = 5;
  var pgns = [];

  var t2 = parseFloat(thickness)/2.0;

  // clockwise points for thermal connectors

  var mod_x = parseFloat( mod.x );
  var mod_y = parseFloat( mod.y ); 
  var mod_a = parseFloat( mod.angle );

  var pad_x = parseFloat( pad.posx );
  var pad_y = parseFloat( pad.posy ); 
  var pad_a = parseFloat( pad.angle );

  var sx = parseFloat( pad.sizex );
  var sy = parseFloat( pad.sizey );

  var sx2 = sx/2;
  var sy2 = sy/2;

  inset = Math.min( sx2, sy2 );
  var d = parseFloat(distance);
  var dx = d + sx2 + 2;  // the +2 is to try account for roundoff when rotation 
  var dy = d + sy2 + 2;  // (it's a fudge factor)

  // wtf, ccw
  //
  var p = [ [   0, -t2 ], [ dx, -t2 ], [  dx,  t2 ], [  0,   t2 ],  // right con.
            [  t2,   0 ], [-t2,   0 ], [ -t2, -dy ], [  t2, -dy ], // bottom con.
            [   0, -t2 ], [  0,  t2 ], [ -dx,  t2 ], [ -dx, -t2 ],  // left con.
            [ -t2,   0 ], [ t2,   0 ], [  t2,  dy ], [ -t2,  dy ]  // top con.
              ];

  // javascript clipper lib documenation clearly says, cw, 
  // but it really wants ccw....
  /*
   *
  var p = [ [   0,  t2 ], [ dx,  t2 ], [  dx, -t2 ], [  0,  -t2 ],  // right con.
            [ -t2,   0 ], [ t2,   0 ], [  t2, -dy ], [ -t2, -dy ], // bottom con.
            [   0,  t2 ], [  0, -t2 ], [ -dx, -t2 ], [ -dx,  t2 ],  // left con.
            [  t2,   0 ], [-t2,   0 ], [ -t2,  dy ], [  t2,  dy ]  // top con.
              ];
              */

  var p_t         = numeric.dot( p, this._Rt( pad_a ) );
  var pad_center  = numeric.dot( this._R( mod_a ), [pad_x, pad_y] );

  for (var k in p_t)
  {
    p_t[k][0] += mod_x + pad_center[0];
    p_t[k][1] += mod_y + pad_center[1];
  }

  var pgns = [];

  for (var p_i=0; p_i<4; p_i++)
  {
    var pgn = [];
    for (var pos=0; pos<4; pos++)
    {
      var k = p_i*4 + pos;
      pgn.push( { X : p_t[k][0], Y: p_t[k][1] } );
    }
    pgns.push(pgn);
  }

  return pgns;

}

bleepsixBoard.prototype._make_thermal_pad_oblong_geometry = function( mod, pad, thickness, distance )
{
  return this._make_thermal_pad_rect_geometry(mod, pad, thickness, distance);
}

bleepsixBoard.prototype._make_thermal_pad_circle_geometry = function( mod, pad, thickness, distance )
{
  var inset = 5;
  var pgns = [];

  var t2 = parseFloat(thickness)/2.0;
  var d = parseFloat(distance);

  // clockwise points for thermal connectors

  var mod_x = parseFloat( mod.x );
  var mod_y = parseFloat( mod.y ); 
  var mod_a = parseFloat( mod.angle );

  var pad_x = parseFloat( pad.posx );
  var pad_y = parseFloat( pad.posy );
  var pad_d = parseFloat( pad.sizex );

  var pad_r = pad_d/2;

  inset = pad_r;

  var L = d + pad_r + 1;

  var base_rect = [ [ 0, -t2 ], [ L, -t2], [L, t2], [0,t2] ];

  var p = [];

  p.push( numeric.dot( base_rect, this._Rt( (Math.PI/4.0) + mod_a ) ) );
  p.push( numeric.dot( base_rect, this._Rt( (3.0*Math.PI/4.0) + mod_a ) ) );
  p.push( numeric.dot( base_rect, this._Rt( (5.0*Math.PI/4.0) + mod_a ) ) );
  p.push( numeric.dot( base_rect, this._Rt( (7.0*Math.PI/4.0) + mod_a ) ) );

  var pad_center  = numeric.dot( this._R( mod_a ), [pad_x, pad_y] );
  var cx = pad_center[0] + mod_x;
  var cy = pad_center[1] + mod_y;

  var pgns = [];

  for (var i in p)
  {
    var pgn = [];
    for (var j in p[i])
      pgn.push( { X: p[i][j][0] + cx, Y: p[i][j][1] + cy } );
    pgns.push(pgn);
  }

  //console.log("circle pgns:");
  //console.log(pgns);

  return pgns;

}


// TODO: trapeze
bleepsixBoard.prototype._make_thermal_pad_geometry = function( mod, pad, thickness, distance )
{
  var type = pad.type;
  var shape = pad.shape;
  var t = thickness;
  var d = distance;

  if      (shape == "oblong")    return this._make_thermal_pad_oblong_geometry(mod,pad,t,d);
  else if (shape == "rectangle") return this._make_thermal_pad_rect_geometry(mod,pad,t,d);
  else if (shape == "circle")    return this._make_thermal_pad_circle_geometry(mod,pad,t,d);
  else {
    console.log("bleepsixBoard._make_thermal_pad_geometry: ERROR: shape " + shape + " not supported");
  }

  return null;

}

// This will need to be refactored at some point, but for now, it's all here.
// 
// 
bleepsixBoard.prototype.fillCZone = function( czone )
{
  var netcode = parseInt(czone.netcode);
  var net_name = this.kicad_brd_json.net_code_map[netcode];
  var layer = parseInt(czone.layer);
  var ds = 10;

  // I for 'solid', 
  // T for X (th) or + (smd), 
  // H for THT (through thermal, solid smd),
  // N or '' for none (connected via trace)
  //
  var thermal_relief_flag = czone.pad_option;  

  //console.log("czone net: " + net_name + ", layer: " + layer + ", thermal relief: " + thermal_relief_flag );

  var sub_pgns = [];
  var base_pgns = [];
  var base_pgns_no_pads = [];  // and no tracks as well...
  var thermal_pgns = [];

  var brd = this.kicad_brd_json['element'];
  for (var brd_ind in brd)
  {
    var ele = brd[brd_ind];
    var type = ele.type;

    // Collect geometry for the net so we can do intersection tests.
    // Construct thermal geometry if appropriate.
    //

    if ( type == "track" )
    {
      var shape = ele.shape;
      var track_layer = parseInt(ele.layer);

      if ( (shape == "track") &&
           (track_layer != layer) )
        continue;

      // exclude it from our offseting and intersection and save it for
      // later intersection tests.
      //
      if (parseInt(ele.netcode) == netcode)
      {
        var p = this._build_element_polygon( { type:"track", ref: ele, id: ele.id } );
        base_pgns.push(p);
        //base_pgns_no_pads.push(p);
        continue;
      }

      // add the offsetted track to the geometry list to remove from the zone
      //
      var pgn = this._build_element_polygon( { type: "track", ref: ele, id: ele.id } );
      this._clip_offset( sub_pgns, [ pgn ], parseFloat(czone.clearance) + parseFloat(czone.min_thickness) );

    }
    else if (type == "drawsegment")
    {
      if ( parseInt(ele.layer) == 28 )
      {

        // add the offsetted pcb edges to the geometry list to remove from the zone
        //
        var pgn = this._build_element_polygon( { type: "drawsegment", ref: ele, id: ele.id } );
        this._clip_offset( sub_pgns, [ pgn ], parseFloat(czone.clearance) + parseFloat(czone.min_thickness) );

      }
    }
    else if (type == "czone" )
    {
      if ( parseInt(ele.layer) != layer )
        continue;

      if ( ele.polyscorners.length < 2)
        continue;

      console.log("conzidering czone...");
      console.log( ele );
      console.log("polyscorners");
      console.log( ele.polyscorners );

      var pnts = [];
      var pc = ele.polyscorners;
      for (var i in pc)
        pnts.push( [ parseFloat( pc[i].x0 ), parseFloat( pc[i].y0 ) ] );

      var pgns = this._make_pgns_from_pnts( pnts );

      console.log("got pgns:");
      console.log(pgns);

      this._clip_offset( sub_pgns, pgns, parseFloat(czone.clearance) + parseFloat(czone.min_thickness) );


    }
    else if (type == "module" )
    {
      var pads = ele.pad;
      for (var ind in pads)
      {
        var pad = pads[ind];

        // keep it for later intersection testing.  We exclude or keep
        // it from the zone removal depending on the thermal relief option
        // ( to be iplemented, testing thermal relief default now )
        //
        if (parseInt(pad.net_number) == netcode)
        {

          // skip it if it's not on this layer
          if ( (parseInt(pad.layer_mask, 16) & (1<<layer)) == 0 )
            continue;

          var p = this._build_element_polygon( { type: "pad", ref: ele, pad_ref: pad, id: pad.id } );
          base_pgns.push(p);

          // calcualte thermal pads if the flag is set to 'T' or if it's a through
          // hole and flag is set to 'H'
          //
          if ( (thermal_relief_flag == 'T') ||
               ( (thermal_relief_flag == 'H') && (parseFloat(pad.drill_diam) > 0) ) )
          {

            //console.log("getting pad thermal geometry");
            var t = parseFloat(czone.min_thickness);
            var c = parseFloat(czone.clearance);
            var t_pgns = this._make_thermal_pad_geometry(ele, pad, t, c+t/2 + 1);

            for (var i in t_pgns)
            {
              thermal_pgns.push(t_pgns[i]);

            }

          }

          // (I)gnore?  don't add at all
          else if (thermal_relief_flag == 'I')
          {
          }

          // else skip over it, which has the effect of
          // letting the zone go over the pad. (no thermal
          // relief).
          //
          else
          {
            continue;
          }
        }

        // add the offsetted polygon to our geometry list for later zone subtraction
        //
        var pgn = this._build_element_polygon( { type: "pad", ref: ele, pad_ref: pad, id: pad.id } );
        this._clip_offset( sub_pgns, [ pgn ], parseFloat(czone.clearance) + parseFloat(czone.min_thickness) );

      }

    }

  }

  // collect all the geometry that are of the same net for the zone we're creating
  // 
  var base_pgns_union = [];
  this._clip_union( base_pgns_union, base_pgns );

  var base_pgns_no_pads_union = [];
  this._clip_union( base_pgns_no_pads_union, base_pgns_no_pads );


  // this is mostly my ignorence of how clipper works, but instead of 
  // worrying about holes not within boundaries, I'm going to collect
  // all holes and explicitely do the difference for each goemtry,
  // then do an intersection test to make sure we want to keep the pour.
  //
  
  // zone boundary geometry
  //
  var zcorner = czone.zcorner;
  var czone_pgn = [];
  for (var i in zcorner)
    czone_pgn.push( { X : parseFloat(zcorner[i].x), Y: parseFloat(zcorner[i].y) } );

  // Speeds up computation and 'fattens' zones
  //
  czone_pgns = [ czone_pgn ];
  //sub_pgns = ClipperLib.Lighten(sub_pgns, 10 );
  //czone_pgns = ClipperLib.Lighten( czone_pgns, 10 );

  sub_pgns = ClipperLib.Lighten(sub_pgns, 5 );
  czone_pgns = ClipperLib.Lighten( czone_pgns, 5 );


  // Subtract appropriate geometry from zone polygon and
  // offset.
  //
  var rop_pgns = [];
  var rop_pgns_offset = [];
  this._clip_difference(  rop_pgns, czone_pgns , sub_pgns );

  this._clip_offset( rop_pgns_offset, rop_pgns, parseFloat(czone.min_thickness)/2.0 );

  // Clean it up and reduce point count.
  // Clipper lib has some problems with artifacts...this helps reduce them.
  //
  //var polygons = ClipperLib.Clean( rop_pgns_offset, 1 );  // might do nothing...check it out later
  var polygons = ClipperLib.Clean( rop_pgns_offset, 5 );  // might do nothing...check it out later
  //polygons = ClipperLib.Lighten(polygons, 10 );
  polygons = ClipperLib.Lighten(polygons, 5 );

  var pgn_boundaries = [];
  var pgn_holes = [];
  for (var i=0; i<polygons.length; i++)
  {
    if (!ClipperLib.Clipper.Orientation( polygons[i] ))
    {
      polygons[i].reverse();
      pgn_holes.push( polygons[i] );
    }
    else
    {
      pgn_boundaries.push( polygons[i] );
    }

  }

  // We can't have floating holes, so collect all boundaries and
  // the holes that are inside them.
  // yes yes, it's O(n^2)
  //
  var zone_pwh_vec = [];
  for (var i=0; i<pgn_boundaries.length; i++)
  {
    var pwh = [];
    pwh.push( pgn_boundaries[i] );
    for (var j=0; j<pgn_holes.length; j++)
    {
      var v = this._pgn_inside_test( pgn_boundaries[i], pgn_holes[j] );
      if ( v )
        pwh.push( pgn_holes[j] );
    }
    zone_pwh_vec.push(pwh);
  }

  // we're keeping references to the holes and we reversed them to do 
  // some checking, go through our holes array and reverse them again 
  // (holes need to be ccw).
  //
  for (var i in pgn_holes)
    pgn_holes[i].reverse();

  // collect the final possible zone regions.
  //
  var f_zone_pwh_vec = [];
  for (var i in zone_pwh_vec)
  {
    f_zone_pwh_vec.push( [] );
    this._clip_union( f_zone_pwh_vec[i], zone_pwh_vec[i] );
  }

  // Now we need to figure out which f_zone_pwh's to discard (if any).
  // Go through each f_zone_pwh, test against the thermal pads (if any)
  // and test against the appropriate net.  If there are any intersections,
  // keep it, otherwise, discard.
  //

  var final_zone = [];
  for (var i in f_zone_pwh_vec)
  {
    var intersects = false;
    var thermal_idx = [];

    for ( var j in thermal_pgns)
    {
      if ( this._pgn_intersect_test( f_zone_pwh_vec[i], [ thermal_pgns[j] ] ) )
      {
        intersects = true;
        thermal_idx.push(j);
      }
      else
      {
      }
    }

    var t_union = f_zone_pwh_vec[i];
    if (intersects)
    {

      var collected_pgns = [];
      for (var j in thermal_idx)
      {
        var idx = thermal_idx[j];
        collected_pgns.push( thermal_pgns[idx] );
      }

      for (var j in f_zone_pwh_vec[i])
        collected_pgns.push( f_zone_pwh_vec[i][j] );

      t_union = [];
      this._clip_union( t_union, collected_pgns );
    }

    if ( this._pgn_intersect_test( t_union, base_pgns_union ) )
    {
      var pgns = [];
      var collected_pgns = [];
      for (var j in t_union )
        collected_pgns.push( t_union[j] );
      for (var j in base_pgns_no_pads_union )
        collected_pgns.push( base_pgns_no_pads_union[j] );
      this._clip_union( pgns , collected_pgns );

      t_union = pgns;
      intersects = true;
    }

    if (intersects)
      final_zone.push( t_union );

  }

  var final_zone_union = [];
  var final_union = [];
  for (var i in final_zone)
    for (var j in final_zone[i])
      final_union.push( final_zone[i][j] );

  this._clip_union( final_zone_union, final_union );

  // We finally have our zone geometry, now to convert to a single
  // unbroken path so that it can be displayed (and it's KiCAD
  // 'polyscorners' compatible).
  var final_polyscorners = [];

  var endpoints = [];
  for (var i in final_zone_union)
  {

    var pgn = final_zone_union[i];

    if (pgn.length > 2)
    {
      for (var j=0; j<pgn.length; j++) 
        final_polyscorners.push( { x0: pgn[j].X, y0 : pgn[j].Y, x1: 0, y1: 0 } );

      endpoints.push( { x0: pgn[0].X, y0 : pgn[0].Y, x1: 0, y1: 0 } );
      final_polyscorners.push( { x0: pgn[0].X, y0 : pgn[0].Y, x1: 0, y1: 0 } );
    }
  }

  for (var i = endpoints.length-1; i>=0; i--)
    final_polyscorners.push( endpoints[i] );

  czone.polyscorners = final_polyscorners;

  g_painter.dirty_flag = true;

}


// 
// Boolean Geometry Language
// setup and functions.
//
bleepsixBoard.prototype.setupBGL = function(data)
{

  this.bgl_grammar = data;

  //console.log("setupBGL:");
  //console.log(this.bgl_grammar);

  this.parserBGL = PEG.buildParser( this.bgl_grammar );
  console.log("built BGL grammar");
}

bleepsixBoard.prototype.initBGL = function()
{

  this.bgl_grammar = null;
  foo = this;

  $.ajax( {
    url : "data/bgl.peg",
    success : function(data) { console.log("got bgl grammar successfully"); foo.setupBGL(data);  }
  } );

}

bleepsixBoard.prototype.parseBGL = function( statement )
{
  var parse_tree = null;

  try {
    parse_tree  = this.parserBGL.parse( statement );
  }
  catch (e)
  {
    console.log("bleepsixBoard.parseBGL: ERROR: could not parse '" + statement + "': " + e.message );
    return null;
  }

  console.log(parse_tree);

  return null;
  return this.runBGL( parse_tree );

}

bleepsixBoard.prototype.highlightNet = function( net_name )
{
  var pgns = this.getBGLVar( net_name );
  this.highlight_net.length = 0;
  for (var i in pgns)
    this.highlight_net.push( this._pgn2pnt(pgns[i]) );
  this.highlight_net_flag = true;
  g_painter.dirty_flag = true;
}

bleepsixBoard.prototype.highlightNets = function( net_names )
{
  this.highlight_net.length = 0;
  for (var n in net_names)
  {
    var net_name = net_names[n];
    var pgns = this.getBGLVar( net_name );
    for (var i in pgns)
      this.highlight_net.push( this._pgn2pnt(pgns[i]) );
  }
  this.highlight_net_flag = true;
  g_painter.dirty_flag = true;
}

bleepsixBoard.prototype.unhighlightNet = function( net_name )
{
  this.highlight_net_flag = false;
  g_painter.dirty_flag = true;
}


bleepsixBoard.prototype.getBGLVar = function( bgl_name )
{
  var rop_pgns = [],
      pgns = [];

  if ( (typeof this.kicad_brd_json.net_name_map[bgl_name]) === "undefined"  )
  {
    console.log("could not find netname, returning");
    return null;
  }

  var netcode = parseInt(this.kicad_brd_json.net_name_map[bgl_name]);

  var brd = this.kicad_brd_json["element"];
  for (var ind in brd)
  {
    var ele = brd[ind];
    var type = ele.type;

    if (ele.type == "track")
    {
      if ( parseInt(ele.netcode) == netcode)
      {
        //console.log("pushing track..");
        pgns.push( this._build_element_polygon( { ref: ele, id : ele.id, type : "track" } ) );
        continue;
      }
    }
    else if (ele.type == "module")
    {
      for ( var pad_ind in ele.pad )
      {
        if ( parseInt( ele.pad[pad_ind].net_number ) == netcode )
        {
          //console.log("pushing pad..");
          var pad = ele.pad[pad_ind];
          pgns.push( this._build_element_polygon( { ref: ele, pad_ref: pad, id : pad.id, type: "pad" } ) );
        }
      }
    }

  }

  this._clip_union( rop_pgns, pgns );

  return rop_pgns;
}

bleepsixBoard.prototype.debugBGL = function( bgl_name )
{

  var geom_pgns = this.getBGLVar( bgl_name );

  for (var ind in geom_pgns)
  {
    this.debug_geom.push( this._pgn2pnt( geom_pgns[ind] ) );
  }

}


bleepsixBoard.prototype.runBGL = function( parse_tree )
{

  if (pare_tree.length != 3 )
  {
    console.log("bleepsixBoard.runBGL: ERROR: entry has length != 3 (" + parse_tree.length + ")" );
    return null;
  }

  var left_ele = parse_tree[0];
  var op = parse_tree[1];
  var right_ele = parse_tree[2];

  var left_geometry = null;
  var right_geometry = null;

  if ( typeof left_ele === "string" )
    left_geometry = this.getBGLVar( left_ele );
  else
    left_geometry = this.runBGL( left_ele );

  if (typeof right_ele === "string" )
    right_geometry = this.getBGLVar( right_ele );
  else
    right_geometry = this.runBGL( right_ele );

  var rop_pgns = [];

  if ((!left_geometry) || (!right_geometry))
    return null;

  if ( op == "-" )
    this._clip_difference( rop_pgns, left_geometry, right_geometry );
  else if (op == '+')
    this._clip_union( rop_pgns, left_geometry, right_geometry );
  else if (op == "*" )
    this._clip_intersect( rop_pgns, left_geometry, right_geometry );
  else if (op == "^" )
    this._clip_xor( rop_pgns, left_geometry, right_geometry );
  else if (op == ">")
    this._clip_offset( rop_pgns, left_geometry, offset );
  else
  {
    console.log("bleepsixBoard.runBGL: ERROR: unknown op '" + op + "'");
    return null;
  }

}

