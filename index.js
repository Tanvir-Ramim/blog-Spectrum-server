const express=require('express')
const cors=require('cors')
const jwt=require('jsonwebtoken')
const cookieParser = require('cookie-parser')
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config()
const app=express()
const port=process.env.PORT || 5000


// middleware 
app.use(cors({
    origin:['http://localhost:5173'],
    credentials:true
}))
app.use(express.json())
app.use(cookieParser())

const verify= async(req,res,next)=>{
  const token=req?.cookies?.token;
  if(!token){
    return res.status(401).send({message: 'Unauthorized access'})
  }
   jwt.verify (token,process.env.ACCESS_TOKEN_SECRET,(error,decoded)=>{
      if(error){
        return res.status(401).send({message: 'Unauthorized access'})
      }
      req.user=decoded
      next()
  }
  )

}

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
    // blogCollection
        const blog_Spectrum=client.db('Blog_Spectrum')
        const blogCollection=blog_Spectrum.collection('All_Blog')
        const wishListCollection=blog_Spectrum.collection('WishList')
        const commentSCollection=blog_Spectrum.collection('Comment_Collection')
        
        // jwt
        app.post('/jwt', async(req,res)=>{
          const user=req.body 
          const token=jwt.sign(user,process.env.ACCESS_TOKEN_SECRET,{expiresIn:'5h'})
          res
          .cookie('token',token,{
             httpOnly: true,
             secure: true,
             sameSite:'none'
          })
          .send({success: true})
   })
   app.post('/jwtRemove',async(req,res)=>{
    const user=req.body 
    console.log('logging Out', user)
    res.clearCookie('token',{maxAge:0}).send({success:true})
})

            // get


            app.get('/comment',async(req,res)=>{
                 try{
                  
                   const searchId=req.query.oldId
                  const query={oldId: searchId}
                    const result=await commentSCollection.find(query).toArray()
                    return res.send(result)
                 }
                 catch{
                  return res.send({error:true})
                 }
            })
        
            app.get('/wishList',verify, async (req, res) => {
              if(req.user.email !== req.query.email){
                   return res.status(401).send({message:'forbidden access'})
              }
              let query = {};
              if (req.query?.email) {
                  query = { email: req.query.email }
              }
              const result = await wishListCollection.find(query).toArray();
              res.send(result);
          })



       app.get('/recentBlog',async(req,res)=>{
          try{
            const result= await blogCollection.find().sort({currentTime:-1}).limit(6) .toArray()
            return res.send(result)
          }
          catch{
            return res.send({error:true})
          }
       })
       app.get('/topBlog',async(req,res)=>{
            try{
              const result = await blogCollection.aggregate([
                {
                  $addFields: {
                    length: { $strLenCP: "$longDescription" }
                  }
                },
                {
                  $sort: { length: -1 }
                },
                {
                  $limit: 5
                }
              ]).toArray();
              return res.send(result);
            }
            catch{
              return res.send({error:true})
            }
       })
        app.get('/search',async(req,res)=>{
             try{
              const data=req.query.value
              const query={title: data}
                    const result=await blogCollection.find(query).toArray()
                
                    return res.send(result)
             }
             catch{
               
             }
        })

       app.get('/allBlog',async(req,res)=>{
            try
            {
                  const data=req.query.value
                  if(data){
                   
                    const query={category: data}
                    const result=await blogCollection.find(query).toArray()
                
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
       

        // post api
         
        app.post('/comment',async(req,res)=>{
             try{
                  const commentInfo=req.body
                  if(!commentInfo?.comment){
                    return  res.send({empty:3})
                  }
                   const result=await commentSCollection.insertOne(commentInfo)
                   return res.send(result)
             }
             catch{
              return res.send({error:true})
             }
        })
         
         app.post('/wishlist',async (req,res)=>{
               try{
                const listInfo=req.body
               const isExist=await wishListCollection.findOne(listInfo)
               if(isExist){
                 return res.send({error:3})
               }
               const result=await wishListCollection.insertOne(listInfo)
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

  //  delete 
   app.delete('/deleteWish/:id',async(req,res)=>{
         try{
                const id=req.params.id;
                const query={_id:new ObjectId(id)}
                const result=await wishListCollection.deleteOne(query)
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