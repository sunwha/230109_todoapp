const express = require('express');
const app = express();
const bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({ extended: true }));
const MongoClient = require('mongodb').MongoClient;
app.set('view engine', 'ejs');

var db;
MongoClient.connect('mongodb+srv://sona:sunwha7717@cluster0.fgghxz4.mongodb.net/?retryWrites=true&w=majority', function (error, client) {
  if (error) return console.log(error);

  db = client.db('todoapp');

  // db.collection('post').insertOne({name: 'Sona', age: 20}, function(error, result){
  //   console.log('저장 완료');
  // });

  app.listen(8080, function () {
    console.log('listening on 8080');
  });

  app.post('/add', function (req, res) {
    res.send("전송완료");
    db.collection('counter').findOne({ name: '개시물갯수'}, function(error, result){
      let totalCount = result.totalPost;
      db.collection('post').insertOne({ _id: totalCount + 1, title: req.body.title, date: req.body.date, detail: req.body.detail }, function(error, result){
        console.log('저장완료');
        db.collection('counter').updateOne({ name: '개시물갯수' }, { $inc : { totalPost: 1 }}, function(){
        })
      });
    });
  });
});

app.get('/', function (req, res) {
  res.sendFile(__dirname + '/index.html');
});

app.get('/write', function (req, res) {
  res.sendFile(__dirname + '/write.html');
});

app.get('/list', function(req, res){
  db.collection('post').find().toArray(function(error, result){
    console.log(result)
    res.render('list.ejs', { posts: result });
  });
});