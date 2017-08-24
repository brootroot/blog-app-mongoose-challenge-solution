const chai = require('chai');
const chaiHttp = require('chai-http');
const faker = require('faker');
const mongoose = require('mongoose');
const moment = require('moment');

const should = chai.should();

const { BlogPost } = require('../models.js');
const { app, runServer, closeServer } = require('../server.js');
const { TEST_DATABASE_URL } = require('../config.js');

chai.use(chaiHttp);

function seedTestData() {
  console.log('Seeding test data');
  const seedData = [];

  for (let i = 0; i < 10; i++) {
    seedData.push(generateTestData());
  }
  return BlogPost.insertMany(seedData);
}

function generateTestData() {
  return {
    author: {
      firstName: faker.name.firstName(),
      lastName: faker.name.lastName()
    },
    title: faker.commerce.productName(),
    content: faker.lorem.sentences(),
    created: new Date()
  };
}

function tearDownDb() {
  console.log('Deleting database...');
  return mongoose.connection.dropDatabase();
}

describe('Allows CRUD activites on Blog-Post API', function() {
  before(function() {
    return runServer(TEST_DATABASE_URL);
  });

  beforeEach(function() {
    return seedTestData();
  });

  afterEach(function() {
    return tearDownDb();
  });

  after(function() {
    return closeServer();
  });

  describe('GET endpoint', function() {
    it('should return all database posts', function() {
      let res;
      return chai
        .request(app)
        .get('/posts')
        .then(function(_res) {
          res = _res;
          res.should.have.status(200);
          res.body.should.have.length.of.at.least(1);
          return BlogPost.count();
        })
        .then(function(count) {
          res.body.should.have.lengthOf(count);
        });
    });

    it('should return posts with the right properties', function() {
      let resPost;
      return chai
        .request(app)
        .get('/posts')
        .then(function(res) {
          res.should.have.status(200);
          res.should.be.json;
          res.body.should.be.a('array');
          res.body.should.have.length.of.at.least(1);

          res.body.forEach(function(item) {
            item.should.be.a('object');
            item.should.have.keys(
              'id',
              'author',
              'content',
              'title',
              'created'
            );
          });
          resPost = res.body[0];
          return BlogPost.findById(resPost.id);
        })
        .then(function(post) {
          resPost.id.should.equal(post.id);
          resPost.author.should.equal(
            `${post.author.firstName} ${post.author.lastName}`
          );
          resPost.content.should.equal(post.content);
          resPost.title.should.equal(post.title);
          const realDate = moment(resPost.created).format(
            'MMMM Do YYYY, h:mm:ss a'
          );
          const dbDate = moment(post.created).format('MMMM Do YYYY, h:mm:ss a');
          realDate.should.equal(dbDate);
        });
    });
  });

  describe('POST endpoint', function() {
    it('should add a new post to the database', function() {
      const newPost = generateTestData();
      return chai
        .request(app)
        .post('/posts')
        .send(newPost)
        .then(function(res) {
          res.should.have.status(201);
          res.should.be.json;
          res.body.should.be.a('object');
          res.body.should.include.keys(
            'id',
            'author',
            'content',
            'title',
            'created'
          );
          res.body.id.should.not.be.null;
          res.body.author.should.equal(
            `${newPost.author.firstName} ${newPost.author.lastName}`
          );
          res.body.content.should.equal(newPost.content);
          res.body.title.should.equal(newPost.title);
          const bodyDate = moment(res.body.created).format('MMMM Do YY');
          const newPostDate = moment(newPost.created).format('MMMM Do YY');
          bodyDate.should.equal(newPostDate);
          return BlogPost.findById(res.body.id);
        })
        .then(function(post) {
          post.authorName.should.equal(
            `${newPost.author.firstName} ${newPost.author.lastName}`
          );
          post.content.should.equal(newPost.content);
          post.title.should.equal(newPost.title);
          const postDate = moment(post.created).format('MMMM Do YY');
          const newPostDate = moment(newPost.created).format('MMMM Do YY');
          postDate.should.equal(newPostDate);
        });
    });
  });

  describe('PUT endpoint', function() {
    it('should update a post', function() {
      const updateData = {
        title: 'Updated post'
      };

      return BlogPost.findOne()
        .exec()
        .then(function(post) {
          updateData.id = post.id;
          return chai
            .request(app)
            .put(`/posts/${updateData.id}`)
            .send(updateData);
        })
        .then(function(res) {
          res.should.have.status(201);

          return BlogPost.findById(updateData.id).exec();
        })
        .then(function(post) {
          post.title.should.equal(updateData.title);
        });
    });
  });

  describe('DELETE endpoint', function() {
    it('should delete a post', function() {
      let post;
      return BlogPost.findOne()
        .exec()
        .then(function(_post) {
          post = _post;
          return chai.request(app).delete(`/posts/${post.id}`);
        })
        .then(function(res) {
          res.should.have.status(204);
          return BlogPost.findById(post.id).exec();
        })
        .then(function(_post) {
          should.not.exist(_post);
        });
    });
  });
});
