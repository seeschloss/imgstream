
var http = require('https');

var lastid = 0;

exports.feeds = {
    popular: {
        title: 'instagram',
        period: 10000,
        host: 'api.instagram.com',
        port: '443',
        path: '/v1/media/popular?client_id=fc59897fc975418aa8d028a288f404e6',
        //path: '/v1/media/popular?access_token=350465694.f59def8.e8da9ff7f7eb425c855180f3b4c50b3a',
        method: 'GET'
    }
};

exports.enable = function(callback) {
    for (var i in exports.feeds) {
        var feed = exports.feeds[i];
        setTimeout((function(feed) {return function() {
            exports.poll(feed, function(items) {
                callback(items, feed.title);
            });}})(feed),
            Math.random() * feed.period / 10);
        setInterval((function(feed) {return function() {
            exports.poll(feed, function(items) {
                callback(items, feed.title);
            });}})(feed),
            feed.period);
    }
}

exports.poll = function(feed, callback) {
    var request = http.request(feed, function(res) {
        res.setEncoding('utf8');
        var body = '';
        res.on('data', function(chunk) {
            body += chunk;
        });
        res.on('end', function() {
            try {
                var json = JSON.parse(body);
                processStream(json.data, callback);
            }
            catch (e) {
                console.log('Exception handling Instagram items');
                console.log(e);
            }
        });
    });
    request.end();
    request.on('error', function(error) {
        console.log(error);
    });
}

var processStream = function(items, callback) {
    var newItems = Array();

    var latest = lastid;

    for (var i in items) {
        var item = items[i];
        if (item.type == 'image' && item.created_time > lastid) {
            latest = Math.max(item.created_time, latest);
            var geo = undefined;
            if (undefined != item.location) {
                geo = {latitude: item.location.latitude, longitude: item.location.longitude};
            }
            newItems.push({
                title: (undefined != item.caption) ? item.caption.text : '',
                thumbnail: item.images.thumbnail.url,
                link: item.images.standard_resolution.url,
                width: item.images.standard_resolution.width,
                height: item.images.standard_resolution.height,
                geo: geo
            });
        }
    }

    newItems.sort(function(a, b) {
        return a.created_time - b.created_time;
    });

    callback(newItems);

    lastid = latest;
}
