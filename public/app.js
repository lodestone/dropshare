(function () {
  "use strict";

  console.log('Hello from DropShare!');

  var $ = require('ender')
    , request = require('ahr2')
    , pure = require('pure').$p
    , sequence = require('sequence')()
    ;

  function handleDrag(ev) {
    console.log('handledrag');
    //ev.stopPropagation();
    ev.preventDefault();
  }

  function handleDrop(ev) {
    console.log('I think you might have dropped something...')
    
    ev.preventDefault();
    // handles both drop and file input change events
    var files = this.files || ev.dataTransfer.files
      , i
      , file
      , meta = []
      ;

    if (!files) {
      console.log('... looks drag-n-drop like litter to me.');
      return;
    }

    if (!files.length) {
      alert('looks like you tried to drop a folder, but your browser doesn\'t support that yet');
      return;
    }

    for (i = 0; i < files.length; i += 1) {
      file = files[i];
      console.log(files[i]);
      meta.push({
          "type": file.type
        , "name": file.name || file.fileName
        , "size": file.size || file.fileSize
        , "lastModifiedDate": file.lastModifiedDate
        , "path": file.mozFullPath || file.webkitRelativePath
      });
      //file.xyz = 'something';
      // XXX append to dom
      // $()
      $('#uploadlist').append('<li class=\'file-info\'><span class=\'name\'>' + file.name + '</span></li>');
    }

    console.log(JSON.stringify(files));


    request.post('/files/new', {}, meta).when(function (err, ahr, data) {
      var formData = new FormData()
        ;

      formData.append('secret', data.secret)
      data.forEach(function (token, j) {
        var file = files[j];
        formData.append(token, file);
        console.log('formData append', token, file.name);
        $($('#uploadlist li')[j]).append('<span class=\'id\'>' + token + '</span>');
        $($('#uploadlist li')[j]).append('<a href="/files/' + token + '/' + file.name + '">' + location.protocol + '//' + location.host + '/files/' + token + '/' + file.name + '</a>');
      });

      // "global" upload queue
      sequence.then(function () {
        request.post('/files', {}, formData).when(function (err, ahr, data2) {
          data.forEach(function (token, j) {
            $($('#uploadlist li')[j]).append('<span class=\'remove-file\'>Delete</span>');
          });
        });
      });
    });
  }

  function onMouseMove(ev) {
    chooser.css({ top: ev.pageY - 10, left: ev.pageX - 10 });
    var pos = chooser.offset();
    pos.right = pos.left + pos.width;
    // since a child is following us,
    // the mouseout event doesn't work as well as hoped
    if (
           (ev.pageX > parentPos.right)
        || (ev.pageY > parentPos.bottom)
        || (ev.pageY < parentPos.top)
        || (ev.pageX < parentPos.left)
       ) {
      //$('input').css({ top: (parentPos.top + parentPos.bottom) / 2, left: parentPos.left + 15 });
      // TODO put far out -1000, -1000
      chooser.css({ top: 10, left: 10 });
    }
    //console.log(ev.pageX, ev.pageY);
  }

  function onMouseLeave(ev) {
    chooser.css({ top: -1000, left: -1000 });
  }

  function onRemoveFile(ev) {
    var id = $(this).closest('.file-info').find('.id').text().trim()
      , imSure = confirm('Are you sure you want to delet this?')
      ;

    if (!imSure) {
      return;
    }

    request.delete(location.protocol + '//' + location.host + '/files/' + id).when(function (err, ahr, data) {
      console.log('prolly deleted:', err, ahr, data);
    });
  }

  var parentPos 
    , chooser
    ;

  function addHandlers() {
    console.log('adding handlers');
    
    parentPos = $('#dropzone').offset();
    chooser = $('input#filechooser[type=file]');
    parentPos.right = parentPos.left + parentPos.width;
    parentPos.bottom = parentPos.top + parentPos.height;

    $('body').delegate('#filechooser', 'change', handleDrop);

    $('body').delegate('#dropzone', 'dragover', handleDrag);
    $('body').delegate('#dropzone', 'drop', handleDrop);
    $('body').delegate('#dropzone', 'mousemove', onMouseMove);
    $('body').delegate('#dropzone', 'mouseleave', onMouseLeave);
    $('body').delegate('.remove-file', 'click', onRemoveFile)
  }




  $.domReady(addHandlers);

}());
