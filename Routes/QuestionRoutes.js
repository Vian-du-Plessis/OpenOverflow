const express = require('express');
const Question = require("../models/questionSchema");
const User = require("../models/userSchema");
const tags = require('../models/tagsSchema');
const questionSchema = require('../models/questionSchema');
const answerSchema = require('../models/answerSchema');
const userSchema = require('../models/userSchema');
const { updateOne } = require('../models/questionSchema');
const router = express();
var mongoose = require('mongoose');
const { ObjectId } = require('mongodb');

router.patch('/api/resolveQuestion', async (req, res) => {
    let {answerId, questionId, answerUser} = req.body;
    
    const answeredUser = await User.findOne({
        _id: answerUser
    }).select('username')

    const question = await Question.updateOne({
        _id: questionId,
        "answers._id": answerId
    }, {
        $set: {
            answeredBy: {
                _id: answeredUser._id,
                username: answeredUser.username,
                date: new Date()
            },
            resolved: true,
            'answers.$.resolved': true
        }
    })

    if(!question){
        return res.status(400).json({msg: 'Question could not be marked as resolved'})
    } else {
        return res.send(true)
    }
});

router.patch('/api/unResolveQuestion', async (req, res) => {
    let {answerId, questionId} = req.body;

    const question = await Question.updateOne({
        _id: questionId,
        "answers._id": answerId
    }, {
        $set: {
            answeredBy: {},
            resolved: false,
            'answers.$.resolved': false
        }
    })

    if(!question){
        return res.status(400).json({msg: 'Question could not be marked as resolved'})
    } else {
        return res.send(true)
    }
});


router.post('/api/askquestion', async (req, res) => {
    let { title, author, question, code, tags, Images } = req.body;

    // Find the details of the user that asked the question
    const user = await User.findOne({
        _id: author,
    }).select(['username', 'userImage']);

    author = user

    const doc = new Question({ title, author, question, code, tags, Images });
    await doc.save();

    res.send(doc._id);
});

router.get('/api/questions', async (req, res) => {
    const questions = await Question.find().sort({ postedDate: -1 });
    res.json(questions);
});

router.get('/api/question/:id', async (req, res) => {
    let id = req.params.id;

    const question = await Question.findOne({
        _id: id,
    })

    res.status(200).json(question)
});

router.patch('/api/question/answer/:userId/:questionId', async (req, res) => {
    let user = req.params.userId;
    let question = req.params.questionId;
    const { answer, code, Images } = req.body;

    const selectedUser = await User.findOne({
        _id: user,
    }).select('username');

    const Question = await questionSchema.findById(question)

    Question.answers.push({
        "user": selectedUser,
        "answer": answer,
        "questionId": question,
        "code": code,
        "images": Images
    })

    Question.save();
    res.send(true)
});

router.patch('/api/answerquestion/:id', async (res, req) => {
    let id = req.params.question

    const question = await Question.findOne({
        _id: id
    })

    res.status(200).json(question)
})

router.patch('/api/addComment/:id', async (req, res) => {
    let {comment, user} = req.body

    const addComment = await Question.findById(req.params.id)
    const auth = await User.findOne({
        _id: user,
    }).select('username');

    addComment.comments.push(
        {
            user: auth,
            comment: comment
        }
    )

    if (!addComment) {
        res.status(400).json({ msg: "Comment could not be pushed", state: false })
    }
    addComment.save()
    res.status(200).json({ msg: addComment, state: true })
});

router.patch('/api/votes/:type', async (req, res) => {
    let {questionId, upVotes, downVotes} = req.body
    let type = req.params.type;

    const editQuestion = await Question.findById(questionId);
    if(type == 'up') {
        editQuestion.rating++;
        editQuestion.votes.up = upVotes;
        editQuestion.votes.down = downVotes;
        editQuestion.save();
        res.send(true);
    } else if(type == 'down') {
        editQuestion.rating--;
        editQuestion.votes.up = upVotes;
        editQuestion.votes.down = downVotes;
        editQuestion.save();
        res.send(true);
    }
});

router.patch('/api/questionVote/:type', async (req, res) => {
    let {questionId, upVotes, downVotes} = req.body;
    let type = req.params.type;

    if(type == 'up') {
        const question = await Question.updateOne({
            _id: questionId
        }, {
            $inc: {rating: 1},
            $set: {
                'votes.up': upVotes, 
                'votes.down': downVotes, 
            }
        })

        if(!question){
            return res.status(400).json({msg: 'Question vote was not updated'})
        } else {
            return res.send(true)
        }
    } else if(type == 'down') {
        const question = await Question.updateOne({
            _id: questionId
        }, {
            $inc: {rating: -1},
            $set: {
                'votes.up': upVotes, 
                'votes.down': downVotes, 
            }
        })

        if(!question){
            return res.status(400).json({msg: 'Question vote was not updated'})
        } else {
            return res.send(true)
        }
    }
});

router.patch('/api/answerVote/:type', async (req, res) => {
    let {questionId, answerId, upVotes, downVotes} = req.body;
    let type = req.params.type;

    if(type == 'up') {
        const answer = await Question.updateOne({
            _id: questionId,
            "answers._id": answerId
        },{
            $inc:{'answers.$.rating': 1},
            $set:{
                'answers.$.votes.up': upVotes,
                'answers.$.votes.down': downVotes
            }
        })
        
        if(!answer){
            return res.status(400).json({msg: 'Answer vote was not updated'})
        } else {
            return res.send(true)
        }
    } else if(type == 'down') {
        const answer = await Question.updateOne({
            _id: questionId,
            "answers._id": answerId
        },{
            $inc:{'answers.$.rating': -1},
            $set:{
                'answers.$.votes.up': upVotes,
                'answers.$.votes.down': downVotes
            }
        })
    
        if(!answer){
            return res.status(400).json({msg: 'Answer vote was not updated'})
        } else {
            return res.send(true)
        }
    }
});

router.patch('/api/flagComment', async (req, res) => {
    let {questionId, commentId, flags, flagged} = req.body;

    const comment = await Question.updateOne({
        _id: questionId,
        "comments._id": commentId
    }, {
        $set: {
            'comments.$.flags': flags,
            'comments.$.flagged': flagged
        }
    })

    if(!comment){
        return res.status(400).json({msg: 'Comment was not updated'})
    } else {
        return res.send(true);
    }
});

// Get flagged comments 
router.get('/api/getflagged', async (req, res) =>{
    const questions =await Question.find( { 'comments.flagged' : { $all:  true  } } )
    if(!questions){
        return res.status(404).json({msg: "No Questions were found"})
    }

    return res.status(200).json(questions)
});

router.get('/api/getUnAnswered', async (req, res) => {
    const questions = await Question.find({
        'answers': {$not: { $elemMatch: { $exists: true } } }
    }).sort({postedDate: 1})

    console.log(questions)
    res.send(questions)
});

//Delete flagged comment 
router.patch('/api/deleteComment/:id/:questionId' , async (req, res) =>{
    let commentId = req.params.id
    let questionId = req.params.questionId
    
    const question = await Question.findOne( { _id : questionId})

    if(!question){
        res.status(400).json("comment not found")
    }

    const comment = await Question.updateOne({
        _id: questionId,
        "comments._id": commentId
    },{
        $pull:{'comments':{_id: commentId}}
    })

    if(!comment){
        return res.status(400).json({msg: 'Comment was not updated'})
    }
    
    return res.send(true)
});

router.patch('/api/deleteQuestion/:questionId', async (req, res) => {
    let questionId = req.params.questionId;

    const question = await Question.deleteOne(ObjectId(questionId));

    if(!question) {
        return res.status(400).json({msg: 'Question was not deleted'});
    }

    return res.send(true);
});


router.get('/api/gettoprated', async (req, res) =>{
    const topRated = await Question.find().sort({rating: -1}).limit(3)

    if(!topRated){
        return res.status(400).json({msg: 'Data not found'})
    }
    return res.status(200).json(topRated)
});

//Finding similiar questions

router.get('/api/getsimiliar/:tag/:id', async(req, res) =>{
    const tag = req.params.tag
    const curr = req.params.id
    const similiar = await Question.find( { tags: { $all: [ tag ] } } ).limit(3)

    if(!similiar){
       return  res.status(404).json({msg: "No similiar Tags"})
    }

    return res.status(200).json(similiar)
});

router.get('/api/test', async (req, res) => {
    const comments = await Question.find({
        _id: ObjectId('636789819f8183027f24fcf6'),
        "comments._id": ObjectId('6367fe5929cac5e529c9e2f9')
    })
    res.send(comments)
});

module.exports = router; 