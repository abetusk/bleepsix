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
  var bleepsixBoard = require("./bleepsixBoard_aux.js");
  module.exports = bleepsixBoard;
}



// ------
// footprint art bbox calculations
// ------


bleepsixBoard.prototype._find_footprint_art_circle_bbox  = function( mod, art_entry )
{
  var bbox = mod.bounding_box;

  var mod_x = parseFloat( mod.x );
  var mod_y = parseFloat( mod.y );
  var a = parseFloat( mod.angle );

  var x = parseFloat( art_entry["x"] );
  var y = parseFloat( art_entry["y"] );
  var r = parseFloat( art_entry["r"] );

  var v = numeric.dot( this._R(a), [x,y]);

  var tx = v[0] + mod_x;
  var ty = v[1] + mod_y;

  bbox[0][0] = Math.min( bbox[0][0], tx - r );
  bbox[0][1] = Math.min( bbox[0][1], ty - r );

  bbox[1][0] = Math.max( bbox[1][0], tx + r );
  bbox[1][1] = Math.max( bbox[1][1], ty + r );

}

bleepsixBoard.prototype._find_footprint_art_segment_bbox = function( mod, art_entry )
{

  var bbox = mod.bounding_box;

  var mod_x = parseFloat( mod.x );
  var mod_y = parseFloat( mod.y );
  var a = parseFloat( mod.angle );

  var sx = parseFloat( art_entry["startx"] );
  var sy = parseFloat( art_entry["starty"] );

  var v = numeric.dot( this._R(a), [sx,sy] );

  var tx = v[0] + mod_x;
  var ty = v[1] + mod_y;

  bbox[0][0] = Math.min( bbox[0][0], tx );
  bbox[0][1] = Math.min( bbox[0][1], ty );

  bbox[1][0] = Math.max( bbox[1][0], tx );
  bbox[1][1] = Math.max( bbox[1][1], ty );

  var ex = parseFloat( art_entry["endx"] );
  var ey = parseFloat( art_entry["endy"] );

  v = numeric.dot( this._R(a), [ex,ey] );

  tx = v[0] + mod_x;
  ty = v[1] + mod_y;

  bbox[0][0] = Math.min( bbox[0][0], tx );
  bbox[0][1] = Math.min( bbox[0][1], ty );

  bbox[1][0] = Math.max( bbox[1][0], tx );
  bbox[1][1] = Math.max( bbox[1][1], ty );

}


bleepsixBoard.prototype._update_bbox_with_point = function(bbox, x, y )
{
  x = parseFloat(x);
  y = parseFloat(y);

  bbox[0][0] = Math.min( bbox[0][0], x );
  bbox[0][1] = Math.min( bbox[0][1], y )

  bbox[1][0] = Math.max( bbox[1][0], x );
  bbox[1][1] = Math.max( bbox[1][1], y );
}


//--

// pad_entry co-ords stored in ^ y
//                             |
//                             .----> x
// (y positive).
// Need to negate to get back to screen co-ords
//
bleepsixBoard.prototype._find_footprint_pad_rectangle_bbox = function( mod, pad_entry )
{

  //if (!("bounding_box" in mod))
  //  mod.bounding_box = [ [mod.x, mod.y], [mod.x, mod.y] ];

  var mod_bbox = mod.bounding_box;

  var mod_x = parseFloat( mod.x );
  var mod_y = parseFloat( mod.y );
  var mod_a = parseFloat( mod.angle );


  var cx = parseFloat( pad_entry["posx"] );
  var cy = parseFloat( pad_entry["posy"] );
  var w = parseFloat( pad_entry["sizex"] );
  var h = parseFloat( pad_entry["sizey"] );

  var a = parseFloat( pad_entry["angle"] );

  // (effective) pad center position
  var pad_c_v = numeric.dot( this._R( mod_a ), [ cx, cy] );

  var w2 = w/2;
  var h2 = h/2;
  var x = cx - w/2;
  var y = cy - h/2;

  var pnt = [ [-w2, -h2], [  w2, -h2],
              [ w2,  h2], [ -w2,  h2] ];

  var pnt_r = numeric.dot( pnt, this._Rt( a ) );

  var xm = Math.min( pnt_r[0][0], pnt_r[1][0], pnt_r[2][0], pnt_r[3][0] );
  var ym = Math.min( pnt_r[0][1], pnt_r[1][1], pnt_r[2][1], pnt_r[3][1] );

  var xM = Math.max( pnt_r[0][0], pnt_r[1][0], pnt_r[2][0], pnt_r[3][0] );
  var yM = Math.max( pnt_r[0][1], pnt_r[1][1], pnt_r[2][1], pnt_r[3][1] );

  var tx = pad_c_v[0] + mod_x;
  var ty = pad_c_v[1] + mod_y;

  pad_entry.bounding_box = [ [ xm + tx, ym + ty ], [ xM + tx, yM + ty ] ];

  var pbbox = pad_entry.bounding_box;

  mod_bbox[0][0] = Math.min( mod_bbox[0][0], pbbox[0][0] );
  mod_bbox[0][1] = Math.min( mod_bbox[0][1], pbbox[0][1] );

  mod_bbox[1][0] = Math.max( mod_bbox[1][0], pbbox[1][0] );
  mod_bbox[1][1] = Math.max( mod_bbox[1][1], pbbox[1][1] );


}

//--

bleepsixBoard.prototype._find_footprint_pad_circle_bbox = function(mod, pad_entry)
{

  var mod_bbox = mod.bounding_box;

  var mod_x = parseFloat( mod.x );
  var mod_y = parseFloat( mod.y );
  var mod_a = parseFloat( mod.angle );

  var mod_bbox = mod.bounding_box;

  var cx = parseFloat( pad_entry["posx"] );
  var cy = parseFloat( pad_entry["posy"] );
  var d = parseFloat( pad_entry["sizex"] );
  //var unknown = parseFloat( pad_entry["sizey"] );

  var v = numeric.dot( this._R(mod_a), [ cx, cy ] );

  var d2 = d/2;

  var tx = mod_x + v[0];
  var ty = mod_y + v[1];

  pad_entry.bounding_box = [ [ tx - d2, ty - d2 ],
                             [ tx + d2, ty + d2 ] ];

  var pbbox = pad_entry.bounding_box;

  mod_bbox[0][0] = Math.min( mod_bbox[0][0], pbbox[0][0] );
  mod_bbox[0][1] = Math.min( mod_bbox[0][1], pbbox[0][1] );

  mod_bbox[1][0] = Math.max( mod_bbox[1][0], pbbox[1][0] );
  mod_bbox[1][1] = Math.max( mod_bbox[1][1], pbbox[1][1] );


}

bleepsixBoard.prototype._find_footprint_pad_bbox = function( mod, pad_entry )
{

  var shape = pad_entry["shape"];

  if      (shape == "rectangle") { this._find_footprint_pad_rectangle_bbox( mod, pad_entry ) }
  else if (shape == "circle")    { this._find_footprint_pad_circle_bbox( mod, pad_entry ) }
  else if (shape == "oblong")    { this._find_footprint_pad_rectangle_bbox( mod, pad_entry ) }
  else if (shape == "trapeze")   { this._find_footprint_pad_rectangle_bbox( mod, pad_entry ) }


}

// Again, y co-ord stored in positive y axis, negate to get to screen co-ord
//
bleepsixBoard.prototype._find_footprint_text_bbox = function( mod, text_entry )
{

  var coarse_bbox = mod.coarse_bounding_box;

  var mod_x = parseFloat( mod.x );
  var mod_y = parseFloat( mod.y );
  var a = parseFloat( mod.angle );

  var x = parseFloat( text_entry["x"] );
  var y = parseFloat( text_entry["y"] );
  var sizex = parseFloat( text_entry["sizex"] );
  var sizey = parseFloat( text_entry["sizey"] );

  var text = text_entry["text"];

  var w = sizex * text.length;
  var h = sizey;

  var pnts = [ [ x - w/2, y - h/2 ],
               [ x + w/2, y - h/2 ],
               [ x + w/2, y + h/2 ],
               [ x - w/2, y + h/2 ] ];

  var pnts_r = numeric.dot( pnts, this._Rt(a) );

  var xm = Math.min( pnts_r[0][0], pnts_r[1][0], pnts_r[2][0], pnts_r[3][0] ); 
  var ym = Math.min( pnts_r[0][1], pnts_r[1][1], pnts_r[2][1], pnts_r[3][1] ); 

  var xM = Math.max( pnts_r[0][0], pnts_r[1][0], pnts_r[2][0], pnts_r[3][0] ); 
  var yM = Math.max( pnts_r[0][1], pnts_r[1][1], pnts_r[2][1], pnts_r[3][1] ); 

  coarse_bbox[0][0] = Math.min( coarse_bbox[0][0], xm + mod_x );
  coarse_bbox[0][1] = Math.min( coarse_bbox[0][1], ym + mod_y );

  coarse_bbox[1][0] = Math.max( coarse_bbox[1][0], xM + mod_x );
  coarse_bbox[1][1] = Math.max( coarse_bbox[1][1], yM + mod_y );

  return;

}


//
bleepsixBoard.prototype._find_footprint_bbox = function( mod )
{
  var first = true;
  var art = mod["art"];
  var pad = mod["pad"];
  var text = mod["text"];


  var x = parseFloat(mod.x);
  var y = parseFloat(mod.y);

  //mod.bounding_box = [[-100,-100],[100,100]];
  mod.bounding_box = [[x,y],[x,y]];

  for ( var ind in art )
  {
    var shape = art[ind]["shape"];

    if      (shape == "circle")     { this._find_footprint_art_circle_bbox  ( mod, art[ind] ); }
    else if (shape == "segment")    { this._find_footprint_art_segment_bbox ( mod, art[ind] ); }
    //else if (shape == "rectangle")  { find_footprint_art_rectangle_bbox ( bbox, art[ind] ); }
    //else if (shape == "arc")        { find_footprint_art_arc_bbox       ( bbox, art[ind] ); }
  }

  for (var ind in pad)
  {
    this._find_footprint_pad_bbox( mod, pad[ind] );
  }

  var bbox = mod.bounding_box;

  mod.coarse_bounding_box = [[x,y],[x,y]];

  var coarse_bbox = mod.coarse_bounding_box;
  coarse_bbox[0][0] = bbox[0][0];
  coarse_bbox[0][1] = bbox[0][1];
  coarse_bbox[1][0] = bbox[1][0];
  coarse_bbox[1][1] = bbox[1][1];

  for (var ind in text)
  {
    this._find_footprint_text_bbox( mod , text[ind] );
  }

  //mod["bounding_box"] = bbox;
  //mod["coarse_bounding_box"] = coarse_bbox;

}


// --

//
//
bleepsixBoard.prototype._find_czone_bbox = function( czone )
{

  var zcorner = czone.zcorner;

  if (zcorner.length < 2)
    return;

  var xm = parseFloat(zcorner[0].x);
  var ym = parseFloat(zcorner[0].y);

  var xM = xm;
  var yM = ym;


  for (var i=1; i<zcorner.length; i++)
  {
    var x = parseFloat(zcorner[i].x);
    var y = parseFloat(zcorner[i].y);

    xm = Math.min( x, xm );
    ym = Math.min( y, ym );

    xM = Math.max( x, xM );
    yM = Math.max( y, yM );

  }

  czone.bounding_box = [[xm,ym],[xM,yM]];

}



// either a drawsegment or a track
bleepsixBoard.prototype._find_line_bbox = function( line )
{
  var w = parseFloat(line.width);

  var xm = Math.min( line.x0, line.x1 );
  var ym = Math.min( line.y0, line.y1 );

  var xM = Math.max( line.x0, line.x1 );
  var yM = Math.max( line.y0, line.y1 );

  line.bounding_box = [ [ xm - w, ym - w ], [ xM + w, yM + w ] ] ;

}

bleepsixBoard.prototype._find_drawsegment_bbox = function( drawsegment )
{
  var shape = drawsegment.shape;

  if (shape == "line")
  {

    var w = parseFloat(drawsegment.width);

    var xm = Math.min( drawsegment.x0, drawsegment.x1 );
    var ym = Math.min( drawsegment.y0, drawsegment.y1 );

    var xM = Math.max( drawsegment.x0, drawsegment.x1 );
    var yM = Math.max( drawsegment.y0, drawsegment.y1 );

    drawsegment.bounding_box = [ [ xm - w, ym - w ], [ xM + w, yM + w ] ] ;
  }

  else if (shape == "arc")
  {

    var x = parseFloat( drawsegment.x );
    var y = parseFloat( drawsegment.y );
    var r = parseFloat( drawsegment.r );
    var sa = parseFloat( drawsegment.start_angle );
    var ea = sa + parseFloat( drawsegment.angle );
    var s = ( drawsegment.counterclockwise_flag ? 1 : -1 );

    var p = [ [ x + r*Math.cos(s*sa), y + r*Math.sin(s*sa) ],
              [ x + r*Math.cos(s*ea), y + r*Math.sin(s*ea) ] ];

    var xm = x;
    var xM = x;
    var ym = y;
    var yM = y;

    for (var i in p)
    {
      if ( p[i][0] < xm ) xm = p[i][0];
      if ( p[i][0] > xM ) xM = p[i][0];
      if ( p[i][1] < ym ) ym = p[i][1];
      if ( p[i][1] > yM ) yM = p[i][1];
    }

    drawsegment.bounding_box = [ [ xm, ym ], [xM, yM] ];

  }

  else if (shape == "circle")
  {
    var x = parseFloat( drawsegment.x );
    var y = parseFloat( drawsegment.y );
    var r = parseFloat( drawsegment.r );

    drawsegment.bounding_box = [ [ x - r, y - r ], [ x + r, y + r ] ] ;
  }

}



bleepsixBoard.prototype._find_text_bbox = function( text_entry )
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



// Thank you to user [Daniel Vassallo]
// (answer from May 2 2010 at 3:50)
// http://stackoverflow.com/questions/2752349/fast-rectangle-to-rectangle-intersection
// function intersectRect(r1, r2) {
//   return !(r2.left > r1.right || 
//   r2.right < r1.left || 
//   r2.top > r1.bottom ||
//   r2.bottom < r1.top);
// }
//
// world y co-ordinate is negated
//
bleepsixBoard.prototype._box_box_intersect = function( bb0, bb1 )
{

  return !( (bb1[0][0] > bb0[1][0]) ||
            (bb1[1][0] < bb0[0][0]) ||
            (-bb1[1][1] > -bb0[0][1]) ||
            (-bb1[0][1] < -bb0[1][1]) );

}

// thank you to user [user37968] on stackoverflow.com
// (answered from Nov 15 2008 at 21:07):
// http://stackoverflow.com/questions/99353/how-to-test-if-a-line-segment-intersects-an-axis-aligned-rectange-in-2d
//
bleepsixBoard.prototype._box_line_intersect = function( bbox, l0, l1, box_fudge )
{

  box_fudge = ( (typeof box_fudge === 'undefined') ? 0 : box_fudge );

  var A = l1.y - l0.y;
  var B = l0.x - l1.x;

  var C = (l1.x*l0.y) - (l0.x*l1.y);

  var f = function(a, b) { return (A*a + B*b + C) > 0; };

  var xm = bbox[0][0] - box_fudge;
  var ym = bbox[0][1] - box_fudge;
  var xM = bbox[1][0] + box_fudge;
  var yM = bbox[1][1] + box_fudge;

  // handle degenerate line (point)
  if ( (l0.x == l1.x) && (l0.y == l1.y) )
  {
    if ( (xm <= l0.x) && (l0.x <= xM) &&
         (ym <= l0.y) && (l0.y <= yM) )
      return true;
  }


  var s0 = f( xm, ym );
  var s1 = f( xM, yM );
  var s2 = f( xM, ym );
  var s3 = f( xm, yM );

  if ( (s0 == s1) && (s1 == s2) && (s2 == s3) )
    return false;

  if ( ((l0.x < bbox[0][0]) && (l1.x < bbox[0][0])) ||
       ((l0.x > bbox[1][0]) && (l1.x > bbox[1][0])) ||
       ((l0.y < bbox[0][1]) && (l1.y < bbox[0][1])) ||
       ((l0.y > bbox[1][1]) && (l1.y > bbox[1][1])) )
    return false;
  return true;

}

// When initial loading a board, call with 'ele' undefined (i.e. updateBoundingBox() ).
// Otherwise call with individual element that should have it's bounding box updated.
//
bleepsixBoard.prototype.updateBoundingBox = function( ele )
{
  if ( typeof ele == 'undefined' )
  {
    var ind;
    var brd = this.kicad_brd_json["element"];

    for (ind in brd)
    {
      if      ( brd[ind]["type"] == "module")       { this._find_footprint_bbox( brd[ind] ); }
      else if ( brd[ind]["type"] == "track")        { this._find_line_bbox( brd[ind] ); }
      //else if ( brd[ind]["type"] == "drawsegment")  { this._find_line_bbox( brd[ind] ); }
      else if ( brd[ind]["type"] == "drawsegment")  { this._find_drawsegment_bbox( brd[ind] ); }
      else if ( brd[ind]["type"] == "text")         { this._find_text_bbox( brd[ind] ); }
      else if ( brd[ind]["type"] == "czone")        { this._find_czone_bbox( brd[ind] );  }

      //else if ( brd[ind]["type"] == "czone")        { this.updateCZoneBoundingBox( brd[ind] ); }
      else                                          { console.log("updateBoundingBox: " + brd[ind]["type"] + " unknown"); }

    }

  }
  else
  {
    var t = ele["type"];

    if      (t == "module")       { this._find_footprint_bbox( ele ); }
    else if (t == "track")        { this._find_line_bbox( ele ); }
    //else if (t == "drawsegment")  { this._find_line_bbox( ele ); }
    else if (t == "drawsegment")  { this._find_drawsegment_bbox( ele ); }
    else if (t == "text")         { this._find_text_bbox( ele ); }
    else if (t == "czone")        { this._find_czone_bbox( ele );  }

    else                          { console.log("udpateBoundingBox: " + t + " unknown"); }
  }

}

