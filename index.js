var util = require('util');
var querystring  = require('querystring'),
  https   = require('https'),
    URL   = require('url');


function XboxLive(baseUrl, gamertag, email, password)
{
  this.baseUrl = baseUrl + '/%s/%s';
  this.gamertag = gamertag;
  this.login = {
    email: email,
    password: password
  };
  this.locale = 'en_GB';
  
  this.urls = {
    gamertag      : 'gamertag/%s',
    games         : 'games',
    achievements  : 'achievements/%s',
    game          : 'gameinfo/%s'
  }
}

XboxLive.prototype.profile = function(callback)
{
  var url = util.format(this.urls.gamertag, this.gamertag);
  this.get(url, callback);
}

XboxLive.prototype.games = function(callback)
{
  var url = this.urls.games;
  this.getSecure(url, callback);
}

XboxLive.prototype.achievements = function(gameId, callback)
{
  var url = util.format(this.urls.achievements, gameId);
  this.getSecure(url, callback);
}

XboxLive.prototype.game = function(gameId, callback)
{
  var url = util.format(this.urls.game, gameId);
  this.get(url, callback);
}

XboxLive.prototype.get = function(url, callback)
{
  this._send(url, null, 'GET', callback);
}

XboxLive.prototype.getSecure = function(url, callback)
{
  this._send(url, this.login, 'GET', callback);
}

XboxLive.prototype._send = function(url, login, method, callback)
{
  //build the URL
  var url = this._buildUrl(url);
  
  //perform transforms on the url data to make it work
  var parsedUrl = URL.parse(url, true);
  if(!method) method = 'GET';
  if(parsedUrl.protocol == 'https:' && !parsedUrl.port) parsedUrl.port = 443;
  
  //set up the post data if it's required
  var data = '';
  if(login){
    data = querystring.stringify(login);
  }
  
  //the basic headers that are required
  var headers = {};
  headers['Host'] = parsedUrl.host;
  headers['Content-Length'] = data.length;
  
  //set up the request
  var resultData = '';
  var options = {
    host       : parsedUrl.hostname,
    port       : parsedUrl.port,
    path       : parsedUrl.pathname,
    method     : method,
    headers    : headers,
    rejectUnauthorized: false
  };
  
  if(data){
    options.path = options.path+'?'+data;
  }
  
  //initiate the connection
  request = https.request(options, function httpsConnectionResponseHandler(res){
    res.addListener('data', function httpsConnectionResponseData(chunk){
      resultData += chunk;
    });
    res.addListener('end', function httpsConnectionResponseEnd() {
      if(res.statusCode == 500){
        callback('Error', null, res);
      } else if(resultData){
        var result = JSON.parse(resultData);
        callback(null, JSON.parse(resultData).data, res);
      } else {
        callback(null, null, res);
      }
    });
  });
  
  //send the data
  request.write(data);
  
  //catch an error
  request.on('error', function httpsConnectionResponseError(e){
    callback(e);
  });
  request.end();
}

XboxLive.prototype._buildUrl = function(path){
  return util.format(this.baseUrl, this.locale, path);
}

XboxLive.prototype.setLocale = function(locale)
{
  this.locale = locale;
}

exports.XboxLive = XboxLive;
