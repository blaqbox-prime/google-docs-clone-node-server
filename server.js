const mongoose = require('mongoose');
const Document = require("./Document");
const dotenv = require('dotenv');
dotenv.config();


const port = process.env.PORT;
const LOCAL_DB = 'mongodb://localhost/google-docs-clone';

mongoose.connect(process.env.CLOUD_DB, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useFindAndModify: false,
  useCreateIndex: true
}); 

const _defaultValue = '';

const io = require("socket.io")(port, {
    cors: {
        origin: "*",
        methods: ["GET","POST"]
    }
})

io.on("connection", (socket) => {
    console.log("client connected");

    socket.on('get-document',async (docId, author) => {
        const doc = await findOrCreate(docId, author);
        socket.join(docId);

        socket.emit("load-document",doc.data);

        socket.on('send-changes',(delta) => {
            socket.broadcast.to(docId).emit("recieve-changes",delta);
        })

        socket.on('save-document',async (data, author) => {
            let doc = await Document.findById(docId);
            if(author !== doc.creator && doc.collaborators.includes(author) == false){
                doc.collaborators.push(author);
                doc.save();
            }
            await Document.findByIdAndUpdate(docId,{data})
        })
    })
});

 async function findOrCreate(id, creator){
    //  if doc doesn't have an Id return'
     if (id == null) return; 
    //  if doc is found return document 
     const doc = await Document.findById(id);
     if (doc) return doc;
    //  If doc has ID and is not in db. Create Doc in db
     return await Document.create({_id: id, creator: creator ,data: _defaultValue});
 } 

 async function getCollabDocs(collaborator){
     let docs = await Document.find({collaborators: {$in: [collaborator]}});
     return docs;
 }

 async function getMyDocs(creator){
    // sample creator = prime@gmail.com
    let docs = await Document.find({creator: creator});
    return docs;
 }


// Express App for API Calls ==============================
const cors = require('cors');
const express = require('express');
const {json} = require('express');
const app = express();

app.use(json());
app.use(cors());

app.listen(5000,()=>{
    console.log('API SERVER RUNNING @ http://localhost:5000')
});

app.get('/:user/documents', async function(req, res){
    const user = req.params.user;
    const docs = await getMyDocs(user);
    const collabs = await getCollabDocs(user);
    
    res.json([...docs,...collabs]);
});

app.delete('/:id/delete', async function(req,res){
    console.log(req.params);
    const id = req.params.id;
    try{
        const deleted = await Document.findByIdAndDelete(id);
        res.json(deleted);

    }catch(err){
        console.log(err);
        res.json(err);
    }

})