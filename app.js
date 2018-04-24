var express = require('express')
const PORT = process.env.PORT || 5000
var app = express()
var mysql = require('mysql')
var myConnection = require('express-myconnection')
var config = require('./config')
var dbOptions = {
  host: config.database.host,
  user: config.database.user,
  password: config.database.password,
  port: config.database.port,
  database: config.database.db
}

app.use(myConnection(mysql, dbOptions, 'pool'))
app.set('view engine', 'ejs')

var index = require('./routes/index')

var expressValidator = require('express-validator')
app.use(expressValidator())

var bodyParser = require('body-parser')
app.use(bodyParser.urlencoded({ extended: true }))
app.use(bodyParser.json())

var methodOverride = require('method-override')
app.use(methodOverride(function(req, res){
  if(req.body && typeof req.body === 'object' && '_method' in req.body){
    var method = req.body._method
    delete req.body._method
    return method
  }
}))

var flash = require('express-flash')
var cookieParser = require('cookie-parser')
var session = require('cookie-session')
app.use(cookieParser('STA'))
app.use(session({
  secret: 'STA',
  resave: false,
  saveUninitialized: true,
  cookie: { maxAge: 60 * 60 * 1000 }
}))
app.use(flash())

app.use('/', index);
app.use(express.static(__dirname));

app.get('*', function(req, res){
  res.render('404');
})
app.listen(PORT, function(){
  console.log('Server running at port ' + PORT);
})
