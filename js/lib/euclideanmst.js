var EuclideanMST;


if (typeof module !== 'undefined')
{
  var Delaunay = require("./delaunay");
  var Kruskal = require("./kruskal");
}


(function() {
  "use strict";

  EuclideanMST = {
    euclideanMST : function ( vertices, metric )
    {

      var tri = Delaunay.triangulate(vertices);

      var edges = [];
      var edge_seen = {};

      for (var i=0; i<tri.length; i+=3)
      {
        var e = [ tri[i], tri[i+1], tri[i+2] ];
        e.sort();

        var a = e[0];
        var b = e[1];
        var c = e[2];

        var key = "" + a + "," + b;
        if ( !(key in edge_seen) )
          edges.push( [a,b] );
        edge_seen[key] = 1;

        key = "" + b + "," + c;
        if ( !(key in edge_seen) )
          edges.push( [b,c] );
        edge_seen[key] = 1;

        key = "" + a + "," + c;
        if ( !(key in edge_seen) )
          edges.push( [a,c] );
        edge_seen[key] = 1;

      }

      var mst = 
        Kruskal.kruskal( 
            vertices, 
            edges, 
            metric
        );

      return mst;

    }

  };

  if ( typeof module !== 'undefined' )
    module.exports = EuclideanMST;
})();


