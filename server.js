const express = require('express');
const app = express();
const bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({ extended: true }));
const MongoClient = require('mongodb').MongoClient;
const methodOverride = require('method-override');
app.use(methodOverride('_method'));
app.set('view engine', 'ejs');

app.use(express.static('public'));

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
    db.collection('counter').findOne({ name: '개시물갯수' }, function (error, result) {
      let totalCount = result.totalPost;
      db.collection('post').insertOne({ _id: totalCount + 1, title: req.body.title, date: req.body.date, detail: req.body.detail }, function (error, result) {
        console.log('저장완료');
        db.collection('counter').updateOne({ name: '개시물갯수' }, { $inc: { totalPost: 1 } }, function () {
        })
      });
    });
  });
});

app.get('/', function (req, res) {
  res.render('home.ejs')
});

app.get('/write', function (req, res) {
  res.render('write.ejs')
});

app.get('/list', function (req, res) {
  db.collection('post').find().toArray(function (error, result) {
    res.render('list.ejs', { posts: result });
  });
});

app.get('/detail/:id', function (req, res) {
  db.collection('post').findOne({ _id: parseInt(req.params.id) }, function (error, result) {
    res.render('detail.ejs', { data: result });
  })
});

app.delete('/delete', function(req, res){
  req.body._id = parseInt(req.body._id);
  db.collection('post').deleteOne(req.body, function(error, result){
    console.log("삭제완료");
    res.status(200).send({ message: "삭제에 성공했습니다"});
  })
});

app.get('/edit/:id', function (req, res) {
  console.log(req.body.id)
  db.collection('post').findOne({ _id: parseInt(req.body.id) }, function(error, result){
    res.render('edit.ejs', { data: result });
  });
});

app.put('/edit', function(req, res) {
  db.collection('post').updateOne({ _id: parseInt(req.body.id) }, { $set: {title: req.body.title, date: req.body.date, detail: req.body.detail} }, function(error, result){
    console.log("수정완료")
    res.redirect('/list');
  })
});