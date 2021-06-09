const mongoose = require('mongoose');
const Document = require("./Document");

const LOCAL_DB = 'mongodb://localhost/google-docs-clone';
const CLOUD_DB = "mongodb+srv://admin:ATLAS@cluster-0.7wvxy.gcp.mongodb.net/google-docs-clone?retryWrites=true&w=majority";

mongoose.connect(CLOUD_DB, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useFindAndModify: false,
  useCreateIndex: true
});

const _defaultValue = '';

const io = require("socket.io")(3001, {
    cors: {
        origin: "*",
        methods: ["GET","POST"]
    }
})

io.on("connection", (socket) => {
    console.log("client connected");

    socket.on('get-document',async (docId) => {
        const doc = await findOrCreate(docId);
        socket.join(docId);

        socket.emit("load-document",doc.data);

        socket.on('send-changes',(delta) => {
            socket.broadcast.to(docId).emit("recieve-changes",delta);
        })

        socket.on('save-document',async (data) => {
            await Document.findByIdAndUpdate(docId,{data})
        })
    })
});

 async function findOrCreate(id){
     if (id == null) return;
     const doc = await Document.findById(id);
     if (doc) return doc;
     return await Document.create({_id: id, data: _defaultValue});
 } 