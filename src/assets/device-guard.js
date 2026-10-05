(() => {
 const policy=window.BEIJING_ACCESS;
 if(!policy?.desktopOnly)return;
 const mobile=()=>/Android|iPhone|iPad|iPod|Mobile|IEMobile|Opera Mini|BlackBerry|Kindle|Silk/i.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1)||innerWidth<policy.minimumDesktopWidth;
 function check(){if(mobile()&&!location.pathname.endsWith('/so-no-computador.html'))location.replace(new URL('so-no-computador.html',location.href).href);}
 check();window.addEventListener('resize',check);
})();
