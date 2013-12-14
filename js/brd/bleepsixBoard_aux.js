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



// Get a list of possible intersections by considering bounding box intersections.
// This gives us a shorter list of possible connections that's faster than
// doing complex boolean intersection operations for all of the geometry 
// in the board.
//
bleepsixBoard.prototype._find_possible_track_intersections = function( tracks )
{
  var brd = this.kicad_brd_json["element"];

  var hit_element_list = [];

  var tx = parseFloat( tracks[0].x0 );
  var ty = parseFloat( tracks[0].y0 );
  var w = parseFloat( tracks[0].width );

  var track_bbox_list = [];

  for (var track_ind in tracks)
  {
    var track = tracks[track_ind];

    var track_bbox = [ [ tx-w,ty-w], [tx+w,ty+w] ];
    this._update_bbox_with_point( track_bbox, track.x0-w, track.y0-w );
    this._update_bbox_with_point( track_bbox, track.x0+w, track.y0+w );
    this._update_bbox_with_point( track_bbox, track.x1-w, track.y1-w );
    this._update_bbox_with_point( track_bbox, track.x1+w, track.y1+w );

    track_bbox_list.push( track_bbox );
  }

  for (var brd_ind in brd)
  {

    var type = brd[brd_ind].type;
    var ref = brd[brd_ind];

    if (type == "module") 
    {

      var skip_flag = true;
      for (var t_ind in track_bbox_list)
      {
        if ( this._box_box_intersect( track_bbox_list[t_ind], ref.bounding_box ) )
        {
          skip_flag = false;
          break;
        }
      }

      if (skip_flag) 
        continue;

      for (var pad_ind in ref.pad)
      {

        for (var t_ind in track_bbox_list)
        {
          if (this._box_box_intersect( track_bbox_list[t_ind], ref.pad[pad_ind].bounding_box))
          {
            var hit_ele = { ref: ref, type: "pad", name: ref.pad[pad_ind].name, pad_ref: ref.pad[pad_ind],
                            id: ref.pad[pad_ind].id  };
            hit_element_list.push( hit_ele );
            break;
          }
        }

      }
    }
    else if (type == 'track')
    {

      for (var t_ind in track_bbox_list)
      {

        tx = parseFloat( ref.x0 );
        ty = parseFloat( ref.y0 );
        var tbbox = [ [tx-w,ty-w],[tx+w,ty+w] ];
        this._update_bbox_with_point( tbbox, ref.x1-w, ref.y1-w );
        this._update_bbox_with_point( tbbox, ref.x1+w, ref.y1+w );

        if (this._box_box_intersect( track_bbox_list[t_ind], tbbox ))
        {
           var hit_ele = { ref:ref, type: "track", id: ref.id };
           hit_element_list.push( hit_ele );
           break;
        }

      }

    }

  }

  return hit_element_list;

}

bleepsixBoard.prototype._build_element_polygon = function( ele )
{
  var ds = 10;
  var type = ele.type;
  var pgn = [];

  if ( (type == "track") || (type == "drawsegment") )
  {
    this._make_segment( pgn, ele.ref, ds );
    return pgn;
  }

  if (type != "pad") return null;

  var ref = ele.ref;
  var pad = ele.pad_ref;
  var shape = pad.shape;

  var mod_ang = parseFloat( ref.angle );
  var mod_x = parseFloat( ref.x );
  var mod_y = parseFloat( ref.y );

  var pad_ang = parseFloat( pad.angle );
  var pad_x = parseFloat( pad.posx );
  var pad_y = parseFloat( pad.posy );

  var pad_sx = parseFloat( pad.sizex );
  var pad_sy = parseFloat( pad.sizey );

  var u = numeric.dot( this._R( mod_ang ), [pad_x, pad_y] );
  u[0] += mod_x;
  u[1] += mod_y;

  if (shape == "rectangle")
    pgn = this._realize_rect( u[0], u[1], pad_sx, pad_sy, pad_ang, ds );
  else if (shape == "oblong")
    pgn = this._realize_oblong( u[0], u[1], pad_sx, pad_sy, pad_ang, ds );
  else if (shape == "circle")
    pgn = this._realize_circle( u[0], u[1], pad_sx/2, pad_ang, ds );
  else if (shape == "trapeze")
  {
    console.log("bleepsix_netops.splitNet: trapeze not implemented");
  }

  //this.debug_geom.push( this._pgn2pnt( pgn ) );

  return pgn;


}

bleepsixBoard.prototype._build_non_net_polygons = function( net_code, net_name, hit_ar )
{
  var ds = 10;
  var pgns = [];

  for (var ind in hit_ar)
  {

    // COME BACK TO THIS...
    // build_non_net_polygons isn't really considering net names...figure
    // out what we wanted here and if we really need to filter
    // by net_code/net_name
    //
    /*
    var pgn = this._build_element_polygon( hit_ar[ind] );
    pgns.push(pgn);
    continue;
    */

    // TODO: skip over if nets not the smae.
    // for now, we're considering everything for testing purposes.
    //
    if ( hit_ar[ind].type == "pad")
    {
      var ref = hit_ar[ind].ref;
      var pad = hit_ar[ind].pad_ref;

      var mod_ang = parseFloat( ref.angle );
      var mod_x = parseFloat( ref.x );
      var mod_y = parseFloat( ref.y );

      var pad_ang = parseFloat( pad.angle );
      var pad_x = parseFloat( pad.posx );
      var pad_y = parseFloat( pad.posy );

      var pad_sx = parseFloat( pad.sizex );
      var pad_sy = parseFloat( pad.sizey );

      var u = numeric.dot( this._R( mod_ang ), [pad_x, pad_y]  );
      u[0] += mod_x;
      u[1] += mod_y;

      if (pad.shape == "rectangle")
      {
        var pgn = this._realize_rect( u[0], u[1], pad_sx, pad_sy, pad_ang, ds );
        pgns.push( pgn );
      }
      else if (pad.shape == "oblong")
      {
        var pgn = this._realize_oblong( u[0], u[1], pad_sx, pad_sy, pad_ang, ds );
        pgns.push( pgn );
      }
      else if (pad.shape == "circle")
      {
        var pgn = this._realize_circle( u[0], u[1], pad_sx/2, pad_ang, ds );
        pgns.push( pgn );
      }
      else if (pad.shape == "trapeze")
      {
        console.log("bleepsix._build_non_net_polygons: trapeze not implemented");
      }

    }
    else if ( hit_ar[ind].type == "track" )
    {
      var ref = hit_ar[ind].ref;
      var seg = [];
      this._make_segment( seg, ref, 10 );
      pgns.push( seg );
    }
  }

  return pgns;
}

// Test for a track path to see if it intersects with
// other tracks or pads (on the current layer) in the 
// board.
//
// 
//
bleepsixBoard.prototype.trackBoardIntersect = function( tracks, debug_flag )
{
  debug_flag = ( (typeof debug_flag !== 'undefined') ? debug_flag : false );
  //console.log("bleepsixBoard.trackIntersect:");

  if (tracks.length == 0) 
    return false;

  // first test for bounding box intersection
  var hit_ele_list = this._find_possible_track_intersections( tracks, debug_flag );

  if (debug_flag)
  {
    console.log("initial filter:");
    console.log(hit_ele_list);
  }

  //console.log("hit_ele_list: " );
  //console.log(hit_ele_list);

  // if we have none, no possibility for intersections
  if (hit_ele_list.length == 0)
    return [];


  // clipper wants outer boundary clockwise 
  // holes counter clockwise
  // Orientation = true  -> clockwise
  // Orientation = false -> counter clockwise
  // are you _sure_??

  var track_pgns = [];
  var track_pgns_u = []
  var intersect_geom = [];
  var non_net_pgns = [];

  // We have bounding box collisions, so collect all
  // non net pad and track geometries.
  //
  var pgns = this._build_non_net_polygons( 0, 0, hit_ele_list );

  if (debug_flag)
  {
  }

  //console.log("non net polygons");
  //console.log(pgns);

  // Construct track geometry
  //
  for (var ind in tracks)
  {
    track_pgns.push( [] );
    this._make_segment( track_pgns[ind] , tracks[ind], 10 );

    if (debug_flag)
    {
      console.log( ClipperLib.Clipper.Orientation( track_pgns[ind] )  );
      this.debug_geom.push( this._pgn2pnt( track_pgns[ind] ) );
    }

  }

  this._clip_union( non_net_pgns, pgns );
  this._clip_union( track_pgns_u, track_pgns );
  this._clip_intersect( intersect_geom, track_pgns_u, non_net_pgns );

  // If the intersection is non empty, we have a true collision.
  //
  if (intersect_geom.length == 0)
    return [];

  // find out who we got a single intersection with
  //
  var ret_hit_ele = [];

  for (var ind in hit_ele_list)
  {

    var tst_intersect = [];

    var pgn_list = this._build_non_net_polygons(0, 0, [ hit_ele_list[ind] ] );
    this._clip_intersect( tst_intersect, track_pgns_u,  pgn_list  );


    //console.log("testing: " + ind );
    //console.log(pgn_list);
    //console.log(tst_intersect);

    if (tst_intersect.length > 0)
    {
      //console.log("GOT: " + ind);
      //console.log( hit_ele_list[ind] );

      ret_hit_ele.push( hit_ele_list[ind] );

    }
  }

  // Debugging: show intersection polygons
  //
  if (debug_flag)
  {
    for (var ind in intersect_geom)
      this.debug_geom.push( this._pgn2pnt( intersect_geom[ind] ) );
  }

  if (ret_hit_ele.length > 0)
    return ret_hit_ele;

  return [];

}

// ------------------------------ nodejs includes
/*
var numeric = require('./numeric.js');
var sprintf = require('./sprintf.js').sprintf;
var clipper = require('./clipper.js');
*/



// ------------------------ auxiliary functions

//---

// helper
//function clip_union( rop_pgns, pgns)
bleepsixBoard.prototype._clip_union = function( rop_pgns, pgns)
{
  var clpr = new ClipperLib.Clipper();
  var joinType = ClipperLib.JoinType.jtRtound;
  var fillType = ClipperLib.PolyFillType.pftPositive;
  var subjPolyType = ClipperLib.PolyType.ptSubject;
  var clipPolyType = ClipperLib.PolyType.ptClip;
  var clipType = ClipperLib.ClipType.ctUnion;

  clpr.AddPolygons( pgns, subjPolyType );
  clpr.Execute( clipType, rop_pgns, fillType, fillType);
}

bleepsixBoard.prototype._clip_intersect = function( rop_pgns, pgnsA, pgnsB )
{
  var clpr = new ClipperLib.Clipper();
  var joinType = ClipperLib.JoinType.jtRtound;
  var fillType = ClipperLib.PolyFillType.pftPositive;
  var subjPolyType = ClipperLib.PolyType.ptSubject;
  var clipPolyType = ClipperLib.PolyType.ptClip;
  var clipType = ClipperLib.ClipType.ctIntersection;

  clpr.AddPolygons( pgnsA, subjPolyType );
  clpr.AddPolygons( pgnsB, clipPolyType );

  clpr.Execute(clipType, rop_pgns, fillType, fillType );

}

bleepsixBoard.prototype._clip_difference = function( rop_pgns, pgnsA, pgnsB )
{
  var clpr = new ClipperLib.Clipper();
  var joinType = ClipperLib.JoinType.jtRtound;
  var fillType = ClipperLib.PolyFillType.pftPositive;
  var subjPolyType = ClipperLib.PolyType.ptSubject;
  var clipPolyType = ClipperLib.PolyType.ptClip;
  var clipType = ClipperLib.ClipType.ctDifference;

  clpr.AddPolygons( pgnsA, subjPolyType );
  clpr.AddPolygons( pgnsB, clipPolyType );

  clpr.Execute(clipType, rop_pgns, fillType, fillType );

}

bleepsixBoard.prototype._clip_xor = function( rop_pgns, pgnsA, pgnsB )
{
  var clpr = new ClipperLib.Clipper();
  var joinType = ClipperLib.JoinType.jtRtound;
  var fillType = ClipperLib.PolyFillType.pftPositive;
  var subjPolyType = ClipperLib.PolyType.ptSubject;
  var clipPolyType = ClipperLib.PolyType.ptClip;
  var clipType = ClipperLib.ClipType.ctXor;

  clpr.AddPolygons( pgnsA, subjPolyType );
  clpr.AddPolygons( pgnsB, clipPolyType );

  clpr.Execute(clipType, rop_pgns, fillType, fillType );

}


//---

// make counter clockwise rectangle with rounded edges (that is, an obround)
//
bleepsixBoard.prototype._make_segment = function( seg, line, ds  )
{
  ds = ( (typeof ds !== 'undefined') ? ds : 1 );

  seg.length = 0;

  var eps = 0.0001;
  var w2 = line.width/2;

  var p0 = [ line.x0, line.y0 ];
  var p1 = [ line.x1, line.y1 ];

  var u10 = numeric.sub( p1, p0 );

  var l = numeric.norm2( u10 );
  if (l < eps)   // not a oblong but a circle
  {
    var s = 2.0 * Math.PI * w2 ;
    var n = Math.floor( s / ds );
    for (var i=0; i<n; i++)
    {
      var ang = 2.0 * Math.PI * i / n ;
      var tx = w2 * Math.cos( ang );
      var ty = w2 * Math.sin( ang );
      seg.push( { X: p0[0] + tx, Y: p0[1] + ty } );
    }

    return;
  }

  u10 = numeric.mul( w2 / l, u10 );

  var u01 = [ -u10[0] , -u10[1] ];

  var R90  = [ [ 0,  1], [-1, 0] ]; // ccw -90 (cw 90)
  var Rm90 = [ [ 0, -1], [ 1, 0] ];  //ccw 90

  var pgn = [];

  var a0 = numeric.add( p0, numeric.dot( Rm90, u01 ) );
  var a1 = numeric.add( p0, numeric.dot( R90, u01 ) );

  var b0 = numeric.add( p1, numeric.dot( Rm90, u10 ) );
  var b1 = numeric.add( p1, numeric.dot( R90, u10 ) );

  var s = Math.PI * w2 ;
  var n = Math.floor( s / ds );

  for (var i=0; i<n; i++)
  {
    var theta = Math.PI * i / n;
    var tv = numeric.sub( a1, p0 );
    var Ra = this._R(-theta);

    var tp = numeric.add(p0, numeric.dot(Ra, tv));
    seg.push( { X: tp[0], Y: tp[1] } );
  }
  seg.push( { X: a0[0], Y: a0[1] } );

  for (var i=0; i<n; i++)
  {
    var theta = Math.PI * i / n;

    var tv = numeric.sub( b1, p1 );
    var Ra = this._R(-theta);

    var tp = numeric.add(p1, numeric.dot(Ra, tv));
    seg.push( { X: tp[0], Y: tp[1] } );
  }
  seg.push( { X: b0[0], Y: b0[1] } );

}


//--

bleepsixBoard.prototype._clip_offset = function( ofs_pgns, inp_pgns, ds )
{
  //var joinType = ClipperLib.JoinType.jtMiter;  // jtSquare, jtRound
  //var joinType = ClipperLib.JoinType.jtSquare;  // jtSquare, jtRound
  var joinType = ClipperLib.JoinType.jtRound;  // jtSquare, jtRound
  var miterLimit = 10;
  var autoFix = true;

  var clpr = new ClipperLib.Clipper();

  var t_pgns = clpr.OffsetPolygons( inp_pgns, ds, joinType, miterLimit, autoFix );

  for (var ind in t_pgns)
  {
    ofs_pgns.push(t_pgns[ind]);
  }

}

// test whether polygon A is inside B.  
// Note: the boundaries for pgnA and pgnB *must* be disjoint.
//   That is, either pgnA is wholly in pgnB, pgnB is wholly in pgnA or
//   they are disjoint.  This isn't meant for polygons whose boundaries
//   intersect.
//
bleepsixBoard.prototype._pgn_inside_test= function( pgnA, pgnB )
{
  var local_eps = 0.0005;

  if ( !this._pgn_intersect_test( [ pgnA ], [pgnB] ) )
    return false;

  var pgns = [];
  this._clip_intersect( pgns, [ pgnA ], [ pgnB ] );
  
  var areaA = ClipperLib.Clipper.Area( pgnA );
  var areaB = ClipperLib.Clipper.Area( pgnB );

  var boundaryArea = ClipperLib.Clipper.Area( pgns[0] );

  if ( Math.abs(areaA - boundaryArea) < local_eps) 
    return false;
  return true;

}


//--


bleepsixBoard.prototype._pgn_intersect_test = function( listA, listB )
{
  var uA = [], uB = [];
  var iAB = [];

  this._clip_union( uA, listA );
  this._clip_union( uB, listB );
  this._clip_intersect( iAB, uA, uB );

  return iAB.length > 0;

}

bleepsixBoard.prototype.__radian = function( deg ) { return deg * Math.PI / 180.0 ; }
bleepsixBoard.prototype.__degree = function( rad ) { return rad * 180.0 / Math.PI; }

/*
function _R(ang)
{
  var ca = Math.cos(ang);
  var sa = Math.sin(ang);
  return [ [ ca, -sa ], [ sa, ca ] ];
}

function _Rt( ang )
{
  var ca = Math.cos(ang);
  var sa = Math.sin(ang);
  return [ [ ca, sa ], [ -sa, ca ] ];
}
*/

bleepsixBoard.prototype._polygon2point = function(pnt, pgn)
{
  pnt.length = 0;
  for (var i=0; i<pgn.length; i++)
    pnt.push( [ pgn[i].X, pgn[i].Y ] );
}

bleepsixBoard.prototype._pgn2pnt = function(pgn)
{
  var pnt = [];
  this._polygon2point(pnt, pgn);
  return pnt;
}

bleepsixBoard.prototype._point2polygon = function(pgn, pnt)
{
  pgn.length = 0 ;
  for (var i=0; i<pnt.length; i++)
  {
    pgn.push( { X : pnt[i][0], Y : pnt[i][1] } );
  }
}

// returns polygon
bleepsixBoard.prototype._pnt2pgn = function(pnt)
{
  var pgn = [];
  this._point2polygon(pgn, pnt);
  return pgn;
}

bleepsixBoard.prototype._realize_translate = function(pnt, x, y )
{
  for (var i=0; i<pnt.length; i++)
  {
    pnt[i][0] += x;
    pnt[i][1] += y;
  }
}

bleepsixBoard.prototype._realize_circle = function(x, y, r, ang, ds )
{
  var pnt = [];

  ang = ( (typeof ang !== 'undefined' ) ? ang : 0.0 );
  ds = ( (typeof ds !== 'undefined') ? ds : 1 );

  var n = Math.floor( 2.0 * Math.PI * r / ds );
  for (var i=0; i<n; i++)
  {
    var theta = 2.0 * Math.PI * i / n;
    pnt.push( [ r * Math.cos(theta), r * Math.sin(theta) ] );
  }

  pnt = numeric.dot( pnt, this._Rt(ang) );
  this._realize_translate(pnt, x, y);
  return this._pnt2pgn(pnt);
}

bleepsixBoard.prototype._realize_rect = function( x, y, w, h, ang )
{
  ang = ( (typeof ang !== 'undefined' ) ? ang : 0.0 );

  var w2 = w/2, h2 = h/2;
  var pnt = [ [ - w2,  - h2],
              [ + w2,  - h2],
              [ + w2,  + h2],
              [ - w2,  + h2] ];

  pnt = numeric.dot( pnt, this._Rt(ang) );
  this._realize_translate(pnt, x, y);
  return this._pnt2pgn(pnt);
}

bleepsixBoard.prototype._realize_oblong = function( x, y, obx, oby, ang, ds  )
{
  ang = ( (typeof ang !== 'undefined' ) ? ang : 0.0 );
  ds = ( (typeof ds !== 'undefined') ? ds : 1 );

  var pnt = [];

  var r = ( (obx > oby ) ? (oby/2) : (obx/2) );
  var l = ( (obx > oby ) ? (obx - oby) : (oby - obx) );
  var l2 = l/2;

  var n2 = Math.floor( Math.PI * r / ds );

  if ( obx > oby )
  {
    pnt.push( [ -l2, -r ] );
    pnt.push( [  l2, -r ] );

    for (var i=0; i<n2; i++)
    {
      var theta = Math.PI * i / n2;
      theta -= Math.PI / 2.0;
      pnt.push( [  + l2 + r*Math.cos(theta),  + r*Math.sin(theta) ] );
    }

    pnt.push( [  l2, r ] );
    pnt.push( [ -l2, r ] );

    for (var i=0; i<n2; i++)
    {
      var theta =  Math.PI * i / n2;
      theta += Math.PI / 2.0;
      pnt.push( [  -l2 + r*Math.cos(theta),  r*Math.sin(theta) ] );
    }

  }
  else
  {
    pnt.push( [  r, -l2 ] );
    pnt.push( [  r,  l2 ] );

    for (var i=0; i<n2; i++)
    {
      var theta = Math.PI * i / n2;
      pnt.push( [ r*Math.cos(theta),  l2 + r*Math.sin(theta) ] );
    }

    pnt.push( [ -r,  l2 ] );
    pnt.push( [ -r, -l2 ] );

    for (var i=0; i<n2; i++)
    {
      var theta =  Math.PI * i / n2;
      theta += Math.PI;
      pnt.push( [  r*Math.cos(theta),  -l2 + r*Math.sin(theta) ] );
    }

  }

  pnt = numeric.dot( pnt, this._Rt(ang) );
  this._realize_translate(pnt, x, y);
  return this._pnt2pgn(pnt);

}




/*
//---------------------------- TESTING

var ang = -Math.PI / 3.0;
var rop = [];

var r0 = realize_rect( 20, 20, 100, 100, ang );
var r1 = realize_rect( 50, 50,  20, 200, ang);


clip_union( rop, [ r0, r1] );

for (var i in rop)
{
  ppnts(rop[i]);
}


process.exit();


//---------------------------- TESTING

var ang = -Math.PI / 3.0;

var r0 = realize_rect( 20, 20, 100, 100, ang );
var r1 = realize_rect( 50, 50, 20, 200 , ang);


var r2 = realize_rect( 100, 100, 300, 10, ang );

var a = intersection_test( [ r0, r1 ], [ r2] );

ppnts(r0);
ppnts(r1);
ppnts(r2);

console.log("#got " + a);



process.exit();


//---------------------------- TESTING

function ppnt(x, y)
{
  console.log( x.toFixed(6) + " " + y.toFixed(6) );
}

function ppnts( p )
{
  //for (var i in p) { ppnt(p[i][0], p[i][1] ); }
  for (var i in p) { ppnt(p[i].X, p[i].Y ); }
  console.log("\n");
}

var x = 100, y = 100, dx = 100, dy = 100, dA = 80, dB = 30, r = 50;
var theta = Math.PI/3.0;




pnt = realize_circle( x, y, r ); 
ppnts(pnt);

x +=dx;
pnt = realize_circle( x, y, r, 0, 40 ); 
ppnts(pnt);

x +=dx;
pnt = realize_circle( x, y, r, theta, 40 ); 
ppnts(pnt);

x +=dx;
pnt = realize_circle( x, y, r, theta, 20 ); 
ppnts(pnt);




y += dy;
x = 100;

pnt = realize_rect( x, y, dA, dB );
ppnts(pnt);

x += dx
pnt = realize_rect( x, y, dB, dA );
ppnts(pnt);

x += dx
pnt = realize_rect( x, y, dA, dB, theta );
ppnts(pnt);

x += dx
pnt = realize_rect( x, y, dB, dA, theta );
ppnts(pnt);




x = 100;
y += dy;

pnt = realize_oblong( x, y, dA, dB );
ppnts(pnt);

x += dx;
pnt = realize_oblong( x, y, dB, dA);
ppnts(pnt);

x += dx
pnt = realize_oblong( x, y, dA, dB, theta );
ppnts(pnt);

x += dx;
pnt = realize_oblong( x, y, dB, dA, theta );
ppnts(pnt);

x += dx
pnt = realize_oblong( x, y, dA, dB, theta, 5 );
ppnts(pnt);

x += dx;
pnt = realize_oblong( x, y, dB, dA, theta, 5 );
ppnts(pnt);

*/