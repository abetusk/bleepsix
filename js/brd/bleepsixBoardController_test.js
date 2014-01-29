// - *************************************************
// - *************************************************
// -
// -  testing
// -
// - *************************************************
// - *************************************************

bleepsixBoardController.prototype._randColor = function ()
{
  var r = Math.floor(Math.random()*256);
  var g = Math.floor(Math.random()*256);
  var b = Math.floor(Math.random()*256);

  return "rgb(" + r + "," + g + "," + b + ")";
}

 
bleepsixBoardController.prototype.hershey_font_test = function ()
{

  if (!this.board.flag_utf8_hershey_font_loaded)
  {
    console.log("hershey font not ready yet");
    return;
  }

  var line_width = [ 80, 140 ];
  var color = "rgba(255,255,255,0.8)";
  var x = 0, y = 0;
  var dx = 0, dy = 1000;
  var font = this.board.utf8_hershey_font;

  var str_a = String.fromCharCode(0x3a9);
  var str_b = String.fromCharCode(0x3a9);
  //var str_b = String.fromCharCode(21941);

  g_painter.drawTextFont( str_a, font, x, y, color, 500, 500, line_width[0], 0, "C", "C", false);

  y += 1000;

  g_painter.drawTextFont( str_b, font, x, y, color, 500, 500, line_width[0], 0, "C", "C", false);
}

bleepsixBoardController.prototype.hershey_ascii_font_test = function ()
{
  if (!this.board.flag_utf8_hershey_ascii_font_loaded)
  {
    console.log("font not ready yet");
    return;
  }


  var font = this.board.utf8_hershey_ascii_font;

  var txt = "the quick brown fox jumped over the lazy yellow dog";
  var TXT = "THE QUICK BROWN FOX JUMPED OVER THE LAZY YELLOW DOG";
  var misc = "01234567890-=`~!@#$%^&*()_+[]\\{}|;':\",./<>?";

  var color = "rgba(255,255,255,0.8)";

  var line_width = [ 80, 140 ];
  //var sizex_vec = [ 500, 600, 800];
  //var sizey_vec = [ 500, 600, 800 ];
  var sizex_vec = [ 500, 800];
  var sizey_vec = [ 500, 800 ];
  var offset_h_vec = [ "L", "C", "R" ];
  var offset_v_vec = [ "T", "C", "B" ];
  var flip_vec = [ false, true ];
  //var angle_vec = [ 0, 30, 60, 90, 120, 150, 180, -150, -120, -90, -60, -30 ];
  var angle_vec = [ 0, 30 ];

  var x = 0, y = 0;
  var dx = 0, dy = 1000;

  g_painter.drawTextFont( "M", font, x, -2*dy, color, 500, 500, line_width[0], 0, "C", "C", false);

  g_painter.drawTextFont( "mMgG", font, x, -dy, color, 500, 500, line_width[0], 0, "C", "C", false);

  for (var i=0; i<line_width.length; i++)
  {
    g_painter.drawTextFont( txt, font, x, y, color, 500, 500, line_width[i], 0, "C", "C", false);
    y += dy;
  }

  for (var i=0; i<line_width.length; i++)
  {
    g_painter.drawTextFont( TXT, font, x, y, color, 500, 500, line_width[i], 0, "C", "C", false);
    y += dy;
  }

  for (var i=0; i<line_width.length; i++)
  {
    g_painter.drawTextFont( misc, font, x, y, color, 500, 500, line_width[i], 0, "C", "C", false);
    y += dy;
  }

  var  small_text = "mMgG";

  var count = 0;
  var lf_n = 8;
  dy = 5000;

  for (var i5=0; i5<flip_vec.length; i5++)
  for (var i2=0; i2<offset_h_vec.length; i2++)
  for (var i3=0; i3<offset_v_vec.length; i3++)
  for (var i4=0; i4<angle_vec.length; i4++)
  for (var i0=0; i0<sizex_vec.length; i0++)
  for (var i1=0; i1<sizey_vec.length; i1++)
  for (var i6=0; i6<line_width.length; i6++)
  {
    var tt = "G" + String(i0) + String(i1) + String(i2) + String(i3) + String(i4) + String(i5) + String(i6);
    count++;
    //dx = g_painter._font_text_width( small_text, font, sizex_vec[i0] ) + 500;
    dx = g_painter._font_text_width( tt , font, sizex_vec[i0] ) + 500;

    g_painter.drawRectangle( x-100, y-100, 100, 100, 50 );

    //g_painter.drawTextFont( small_text, font, x, y, color, 
    g_painter.drawTextFont( tt, font, x, y, color, 
        sizex_vec[i0], sizey_vec[i1], 
        line_width[i6],
        angle_vec[i4], 
        offset_h_vec[i2], offset_v_vec[i3],
        flip_vec[i5] )

    x += dx;

    if ((count % lf_n) == 0)
    {
      x = 0;
      y += dy;
    }

  }

}

bleepsixBoardController.prototype.primitives_test = function ()
{

  var x = 1000, y = 1000, dx = 1000, dy = 1000, r = 500, ir= 200, obA = 800, obB = 600 ;
  var lw = 50;
  var color = "";

  var gray_color = "rgb(128,128,128)";

  color = this._randColor();
  g_painter.fillCircle( x, y, r, color );

  x += dx;
  color = this._randColor();
  g_painter.strokeCircle( x, y, r, lw, color );

  //--

  x += dx;
  color = this._randColor();
  g_painter.fillCircleHoleCircle( x, y, r, x, y, ir, color );

  x += dx;
  color = this._randColor();
  g_painter.fillCircleHoleOblong( x, y, r, obA, obB, color );

  x += dx;
  color = this._randColor();
  g_painter.fillCircleHoleOblong( x, y, r, obB, obA, color );

  //--

  x += dx;
  color = this._randColor();
  g_painter.strokeCircleHoleCircle( x, y, r, x, y, ir, lw, color );

  x += dx;
  color = this._randColor();
  g_painter.strokeCircleHoleOblong( x, y, r, obA, obB, lw, color );

  x += dx;
  color = this._randColor();
  g_painter.strokeCircleHoleOblong( x, y, r, obB, obA, lw, color );


  //--
  x += dx;
  color = this._randColor();
  g_painter.circleHoleCircle( x, y, r, ir, lw, gray_color, color );

  x += dx;
  color = this._randColor();
  g_painter.circleHoleOblong( x, y, r, obA, obB, lw, gray_color, color );

  x += dx;
  color = this._randColor();
  g_painter.circleHoleOblong( x, y, r, obB, obA, lw, gray_color, color );

  //-- 

  x += dx;
  color = this._randColor();
  g_painter.circleHoleCircle( x, y, r, ir, 0, gray_color, color );

  x += dx;
  color = this._randColor();
  g_painter.circleHoleOblong( x, y, r, obA, obB, 0, gray_color, color );

  x += dx;
  color = this._randColor();
  g_painter.circleHoleOblong( x, y, r, obB, obA, 0, gray_color, color );

  //-- 

  x += dx;
  color = this._randColor();
  g_painter.circleHoleCircle( x, y, r, ir, lw, gray_color );

  x += dx;
  color = this._randColor();
  g_painter.circleHoleOblong( x, y, r, obA, obB, lw, gray_color );

  x += dx;
  color = this._randColor();
  g_painter.circleHoleOblong( x, y, r, obB, obA, lw, gray_color );


  // -- oblong tests

  y += dy;
  x = 1000;

  color = this._randColor();
  g_painter.fillOblong( x, y, obA, obB, color);

  x += dx;
  color = this._randColor();
  g_painter.fillOblong( x, y, obB, obA, color);

  x += dx;
  color = this._randColor();
  g_painter.strokeOblong( x, y, obA, obB, lw, color);

  x += dx;
  color = this._randColor();
  g_painter.strokeOblong( x, y, obB, obA, lw, color);

  //--

  var ibA = 300;
  var ibB = 100;

  x += dx;
  color = this._randColor();
  g_painter.fillOblongHoleCircle( x, y, obA, obB, x, y, ir, color );

  x += dx;
  color = this._randColor();
  g_painter.fillOblongHoleCircle( x, y, obB, obA, x, y, ir, color );

  x += dx;
  color = this._randColor();
  g_painter.fillOblongHoleOblong( x, y, obA, obB, x, y, ibA, ibB, color );

  x += dx;
  color = this._randColor();
  g_painter.fillOblongHoleOblong( x, y, obA, obB, x, y, ibB, ibA, color );

  x += dx;
  color = this._randColor();
  g_painter.fillOblongHoleOblong( x, y, obB, obA, x, y, ibA, ibB, color );

  x += dx;
  color = this._randColor();
  g_painter.fillOblongHoleOblong( x, y, obB, obA, x, y, ibB, ibA, color );


  x += dx;
  color = this._randColor();
  g_painter.strokeOblongHoleCircle( x, y, obA, obB, x, y, ir, lw, color );

  x += dx;
  color = this._randColor();
  g_painter.strokeOblongHoleCircle( x, y, obB, obA, x, y, ir, lw, color );

  x += dx;
  color = this._randColor();
  g_painter.strokeOblongHoleOblong( x, y, obA, obB, x, y, ibA, ibB, lw, color );

  x += dx;
  color = this._randColor();
  g_painter.strokeOblongHoleOblong( x, y, obA, obB, x, y, ibB, ibA, lw, color );

  x += dx;
  color = this._randColor();
  g_painter.strokeOblongHoleOblong( x, y, obB, obA, x, y, ibA, ibB, lw, color );

  x += dx;
  color = this._randColor();
  g_painter.strokeOblongHoleOblong( x, y, obB, obA, x, y, ibB, ibA, lw, color );


  //--
  
  x = 1000; y += dy;

  x += dx;
  color = this._randColor();
  g_painter.oblongHoleCircle( x, y, obA, obB, ir, lw, gray_color, color );

  x += dx;
  color = this._randColor();
  g_painter.oblongHoleCircle( x, y, obB, obA, ir, 0, gray_color, color );

  x += dx;
  color = this._randColor();
  g_painter.oblongHoleCircle( x, y, obB, obA, ir, lw, gray_color )

  //--

  x = 1000; y += dy;

  x += dx;
  color = this._randColor();
  g_painter.oblongHoleOblong( x, y, obA, obB, ibA, ibB, lw, gray_color, color );

  x += dx;
  color = this._randColor();
  g_painter.oblongHoleOblong( x, y, obA, obB, ibB, ibA, lw, gray_color, color );

  x += dx;
  color = this._randColor();
  g_painter.oblongHoleOblong( x, y, obB, obA, ibA, ibB, lw, gray_color, color );

  x += dx;
  color = this._randColor();
  g_painter.oblongHoleOblong( x, y, obB, obA, ibB, ibA, lw, gray_color, color );

  x += dx;
  color = this._randColor();
  g_painter.oblongHoleOblong( x, y, obA, obB, ibA, ibB, 0, gray_color, color );

  x += dx;
  color = this._randColor();
  g_painter.oblongHoleOblong( x, y, obA, obB, ibB, ibA, 0, gray_color, color );

  x += dx;
  color = this._randColor();
  g_painter.oblongHoleOblong( x, y, obB, obA, ibA, ibB, 0, gray_color, color );

  x += dx;
  color = this._randColor();
  g_painter.oblongHoleOblong( x, y, obB, obA, ibB, ibA, 0, gray_color, color );

  x += dx;
  color = this._randColor();
  g_painter.oblongHoleOblong( x, y, obA, obB, ibA, ibB, lw, gray_color);

  x += dx;
  color = this._randColor();
  g_painter.oblongHoleOblong( x, y, obA, obB, ibB, ibA, lw, gray_color);

  x += dx;
  color = this._randColor();
  g_painter.oblongHoleOblong( x, y, obB, obA, ibA, ibB, lw, gray_color);

  x += dx;
  color = this._randColor();
  g_painter.oblongHoleOblong( x, y, obB, obA, ibB, ibA, lw, gray_color);


  // rect tests

  var rA = 900;
  var rB = 800;

  x = 1000; y += dy;

  color = this._randColor();
  g_painter.fillRect( x, y, rA, rB, color );

  x += dx;
  color = this._randColor();
  g_painter.fillRect( x, y, rB, rA, color );

  x += dx;
  color = this._randColor();
  g_painter.strokeRect( x, y, rA, rB, lw, color );

  x += dx;
  color = this._randColor();
  g_painter.strokeRect( x, y, rB, rA, lw, color );

  //--

  x += dx;
  color = this._randColor();
  g_painter.fillRectHoleCircle( x, y, rA, rB, x, y, ir, color );

  x += dx;
  color = this._randColor();
  g_painter.fillRectHoleCircle( x, y, rB, rA, x, y, ir, color );

  x += dx;
  color = this._randColor();
  g_painter.strokeRectHoleCircle( x, y, rA, rB, x, y, ir, lw, color );

  x += dx;
  color = this._randColor();
  g_painter.strokeRectHoleCircle( x, y, rB, rA, x, y, ir, lw, color );


  //--

  x += dx;
  color = this._randColor();
  g_painter.fillRectHoleOblong( x, y, rA, rB, x, y, ibA, ibB, color );

  x += dx;
  color = this._randColor();
  g_painter.fillRectHoleOblong( x, y, rA, rB, x, y, ibB, ibA, color );

  x += dx;
  color = this._randColor();
  g_painter.fillRectHoleOblong( x, y, rB, rA, x, y, ibA, ibB, color );

  x += dx;
  color = this._randColor();
  g_painter.fillRectHoleOblong( x, y, rB, rA, x, y, ibB, ibA, color );



  x += dx;
  color = this._randColor();
  g_painter.strokeRectHoleOblong( x, y, rA, rB, x, y, ibA, ibB, lw, color );

  x += dx;
  color = this._randColor();
  g_painter.strokeRectHoleOblong( x, y, rA, rB, x, y, ibB, ibA, lw, color );

  x += dx;
  color = this._randColor();
  g_painter.strokeRectHoleOblong( x, y, rB, rA, x, y, ibA, ibB, lw, color );

  x += dx;
  color = this._randColor();
  g_painter.strokeRectHoleOblong( x, y, rB, rA, x, y, ibB, ibA, lw, color );


  //--

  x = 1000; y += dy;

  x += dx;
  color = this._randColor();
  g_painter.rectHoleCircle( x, y, rA, rB, ir, lw, gray_color, color );


  x += dx;
  color = this._randColor();
  g_painter.rectHoleCircle( x, y, rB, rA, ir, lw, gray_color, color );


  x += dx;
  color = this._randColor();
  g_painter.rectHoleCircle( x, y, rA, rB, ir, 0, gray_color, color );

  x += dx;
  color = this._randColor();
  g_painter.rectHoleCircle( x, y, rB, rA, ir, 0, gray_color, color );

  x += dx;
  color = this._randColor();
  g_painter.rectHoleCircle( x, y, rA, rB, ir, lw, gray_color );

  x += dx;
  color = this._randColor();
  g_painter.rectHoleCircle( x, y, rB, rA, ir, lw, gray_color );


  //-- 

  x = 1000; y += dy;

  x += dx;
  color = this._randColor();
  g_painter.rectHoleOblong( x, y, rA, rB, ibA, ibB, lw, gray_color, color );

  x += dx;
  color = this._randColor();
  g_painter.rectHoleOblong( x, y, rA, rB, ibB, ibA, lw, gray_color, color );


  x += dx;
  color = this._randColor();
  g_painter.rectHoleOblong( x, y, rB, rA, ibA, ibB, lw, gray_color, color );

  x += dx;
  color = this._randColor();
  g_painter.rectHoleOblong( x, y, rB, rA, ibB, ibA, lw, gray_color, color );


  x += dx;
  color = this._randColor();
  g_painter.rectHoleOblong( x, y, rA, rB, ibA, ibB, 0, gray_color, color );

  x += dx;
  color = this._randColor();
  g_painter.rectHoleOblong( x, y, rA, rB, ibB, ibA, 0, gray_color, color );


  x += dx;
  color = this._randColor();
  g_painter.rectHoleOblong( x, y, rB, rA, ibA, ibB, 0, gray_color, color );

  x += dx;
  color = this._randColor();
  g_painter.rectHoleOblong( x, y, rB, rA, ibB, ibA, 0, gray_color, color );


  x += dx;
  color = this._randColor();
  g_painter.rectHoleOblong( x, y, rA, rB, ibA, ibB, lw, gray_color );

  x += dx;
  color = this._randColor();
  g_painter.rectHoleOblong( x, y, rA, rB, ibB, ibA, lw, gray_color );


  x += dx;
  color = this._randColor();
  g_painter.rectHoleOblong( x, y, rB, rA, ibA, ibB, lw, gray_color );

  x += dx;
  color = this._randColor();
  g_painter.rectHoleOblong( x, y, rB, rA, ibB, ibA, lw, gray_color );

}

