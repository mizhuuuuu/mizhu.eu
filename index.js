(function(){
  var gallery = document.getElementById('gallery');
  var modal = document.getElementById('video-modal');
  var videoContainer = document.getElementById('video-container');

  function openVideo(videoId) {
    if (!modal || !videoContainer || !videoId) return;
    var src = 'https://www.youtube.com/embed/' + encodeURIComponent(videoId) + '?autoplay=1&rel=0';
    videoContainer.innerHTML = '<iframe width="560" height="315" src="' + src + '" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>';
    modal.hidden = false;
  }

  function closeModal() {
    if (!modal || !videoContainer) return;
    modal.hidden = true;
    videoContainer.innerHTML = '';
  }

  if (modal) {
    modal.addEventListener('click', function(e){ if (e.target.hasAttribute('data-close')) closeModal(); });
    document.addEventListener('keydown', function(e){ if (e.key === 'Escape') closeModal(); });
  }

  if (!gallery) return;

  fetch('assets/work.json')
    .then(function(res){ return res.json(); })
    .then(function(works){
      if (!Array.isArray(works)) return;
      works.forEach(function(item){
        var tile = document.createElement('div');
        tile.className = 'swap';
        tile.setAttribute('role', 'button');
        tile.setAttribute('tabindex', '0');
        if (item.videoId) tile.dataset.videoId = item.videoId;

        var imgStatic = document.createElement('img');
        imgStatic.className = 'static';
        imgStatic.src = item.staticSrc;
        imgStatic.alt = item.title;

        var imgAnimate = document.createElement('img');
        imgAnimate.className = 'animate';
        imgAnimate.src = item.animateSrc;
        imgAnimate.alt = item.title + ' animation';
        imgAnimate.setAttribute('aria-hidden', 'true');

        tile.appendChild(imgStatic);
        tile.appendChild(imgAnimate);

        tile.addEventListener('click', function(){
          var vid = tile.dataset.videoId;
          if (!vid) return;
          openVideo(vid);
        });
        tile.addEventListener('keydown', function(e){
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            var vid = tile.dataset.videoId;
            if (!vid) return;
            openVideo(vid);
          }
        });

        gallery.appendChild(tile);
      });
    })
    .catch(function(){ /* no-op */ });
})();


