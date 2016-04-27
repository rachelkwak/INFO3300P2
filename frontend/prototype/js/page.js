function show(id) {
    forEach(id, function(id) {
        setStyle(document.getElementById(id), 'display', '');
    });
}
function hide(id) {
    forEach(id, function(id) {
        setStyle(document.getElementById(id), 'display', 'none');
    });
}

function forEach(args, fn) {
    if (typeof args == "object") {
        for (var i = 0, argLen = args.length; i < argLen; i++) {
            forEach(args[i], fn);
        }
    } else {
        fn(args);
    }
}

function setStyle(el, property, value) {
    el.style[property] = value;
}

function clickMain(){
    clearCluster();
    show('text1'); 
    hide('text2');
    show('main_popup');
    hide('cluster_popup');
}

function clickCluster(){
    callCluster();
    show('text2'); 
    hide('text1');
    show('cluster_popup');
    hide('main_popup');
}

clickMain();
