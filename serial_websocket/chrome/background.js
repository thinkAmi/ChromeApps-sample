chrome.app.runtime.onLaunched.addListener(function(){
  chrome.app.window.create('window.html', {
    'bounds': {
      'width': 250,
      'height': 200, 
      'top': 0,
      'left': 600
    }
  });
});