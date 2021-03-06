var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
const models = require("./models");
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var cluster = require('cluster');
var env = process.env.NODE_ENV || "development";
const sessionAuth = require("./middleware/sessionAuth.js")
var index = require('./routes/index');
var users = require('./routes/users');
var products = require('./routes/products');
var transactions = require('./routes/transactions'); 
var categories = require('./routes/categories'); 

var app = express();
const initmiddleware = (app) => {
  app.use(function(req, res, next) {
  res.setHeader("Access-Control-Allow-Headers", ["Access-Control-Allow-Origin", 'X-SESSION-KEY', 'Content-Type', 'Cache-Control']);
  res.setHeader("Access-Control-Allow-Origin", "*");
  next();
});

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: false
}));


app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/users/otp', sessionAuth);
app.use('/authenticate', sessionAuth);
}

const initroutes = (app) => {
app.all('/', (req, res) => {
  res.send("UP")
});

app.use('/users', users);
app.use('/products', products);
app.use('/transactions', transactions);
app.use('/categories', categories);


app.get('/authenticate', function(req, res) {
  res.send({error: false,
  session: "active"})
});

app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});
// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};
  // render the error page
  res.status(err.status || 500);
  res.render('error', { title: "Not Found"});
});
}
const startserver = (app) => {
var port = process.env.PORT || 3000;
app.listen(port);
console.log(`Server Started on Port: ${port} at ${new Date().toLocaleString()}`);
}

if (cluster.isMaster) {
var numWorkers = require('os').cpus().length
// DB.DBinit();
models.sequelize.sync()
  .then(() => {
    console.log('Master cluster setting up ' + numWorkers + ' workers...');
    if (env === "development")
      cluster.fork();
    else
      for (var i = 0; i < numWorkers; i++) {
        cluster.fork();
      }
  })
  .catch((err) => {
    console.error("Error: " + err)
  })
cluster.on('online', function(worker) {
  console.log('Worker ' + worker.process.pid + ' is online');
});

cluster.on('exit', function(worker, code, signal) {
  console.log('Worker ' + worker.process.pid + ' died with code: ' + code + ', and signal: ' + signal);
  console.log('Starting a new worker');
  cluster.fork();
});
} else {
var app = express();
app.all('/pid', function(req, res) {
  res.send('process ' + process.pid + ' says hello!').end();
}) //can be removed
initmiddleware(app);
initroutes(app);
startserver(app);
module.exports = app;
}
