
function successSnapshotPicture(x,y,z)
{
  console.log("successSnapshotPicture");
  console.log(x);
  console.log(y);
  console.log(z);

  //window.open("https://google.com", "_blank"); 
  //window.focus();
}

function takeSnapShotPicture()
{
  console.log("boink");

  var canvas = document.getElementById( g_canvas );
  var img = canvas.toDataURL("image/png");

  console.log(img);

  var container = { "type" : "createPNG", data: img };
  var str_data = JSON.stringify( container );

  $.ajax({
    url: "cgi/bleepsixDataManager.py?foo=bar&baz=blah",
    type: 'POST',
    data: str_data,
    success: successSnapshotPicture,
    error: function(jqxhr, status, err) { console.log(jqxhr); console.log(status); console.log(err); }
  });

  handleSnap();
}

function handleSnap() 
{
  console.log("snap...");
  window.open("https://google.com");
  window.focus();
}
