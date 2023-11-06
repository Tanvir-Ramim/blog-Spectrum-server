const express=require('express')
const cors=require('cors')
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config()
const app=express()
const port=process.env.PORT || 5000


// middleware 
app.use(cors())
app.use(express.json())
// assignment11
// I1JD4pJrdcX3h8oh


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.sikjemj.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();
        const blogCollection=client.db('Blog_Spectrum').collection('All_Blog')

       app.get('/recentBlog',async(req,res)=>{
          try{
            const result= await blogCollection.find().sort({currentTime:-1}).limit(6) .toArray()
            return res.send(result)
          }
          catch{
            return res.send({error:true})
          }
       })
       

       app.get('/allBlog',async(req,res)=>{
            try
            {
                  const data=req.query.value
                  if(data){
                    console.log(data)
                    const query={category: data}
                    const result=await blogCollection.find(query).toArray()
                    console.log(result)
                    return res.send(result)
                  }
               
                 const result= await blogCollection.find().toArray()
                 return res.send(result)
            }
            catch{
              return res.send({error:true})
            }
       })

       app.get('/details/:id',async(req,res)=>{
          try{
            const id=req.params.id
            const query={_id: new ObjectId(id)}
            const result=await blogCollection.findOne(query)
            return res.send(result)
          }
          catch{
            return res.send({error:true})
          }

       })
  

       app.post('/addBlog',async(req,res)=>{
        try{
         const info=req.body
         const currentTime=new Date()
         info.currentTime=currentTime
         const result= await blogCollection.insertOne(info)
         
         return res.send(result)
        }
        catch{
            return res.send({error:true})
        }
    })

    app.put('/updateInfo',async(req,res)=>{
            try{
              const info=req.body 
              const filter={_id : new ObjectId(info.id) }
              const options = { upsert: true };
              const {titleNew,categoryNew,shortDescriptionNew,urlNew,longDescriptionNew}=info 
               const updateInfo={
                   $set:{
                    title:titleNew,
                    category:categoryNew, 
                    url:urlNew,
                    longDescription: longDescriptionNew,
                    shortDescription: shortDescriptionNew
                   }
               }
              const result= await blogCollection.updateOne(filter,updateInfo,options)
              return res.send(result)
            }
            catch{
              return res.send({error:true})
            }
        
    })









    
    // Send a ping to confirm a successful connection
    // await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);


app.get('/',(req,res)=>{
       res.send('BLog Spectrum is running')
})

app.listen(port,()=>{
      console.log(`Blog Spectrum Server is running on Port: ${port}`)  
})