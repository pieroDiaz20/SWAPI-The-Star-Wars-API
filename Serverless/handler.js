'use strict';
const axios = require('axios');
const aws = require('aws-sdk');
const express = require('express');
const serverless = require('serverless-http');
const bodyParser = require('body-parser');

const app = express();
const START_TABLE = process.env.START_TABLE;
const IS_OFFLINE = process.env.IS_OFFLINE;
let dynamoDB;  

if(IS_OFFLINE === true){dynamoDB = new aws.DynamoDB.DocumentClient({ region:'localhost',endpoint:'http://localhost:8000' }); 
                  }else{ dynamoDB = new aws.DynamoDB.DocumentClient();}

app.use(bodyParser.urlencoded({extended: true})); 

app.get('/planetasAPI',async(req,res)=>{

  req = await axios.get('https://swapi.py4e.com/api/planets/');

  const respt = req.data.results.map(planetas =>({
    planeta              :planetas.name,
    clima                :planetas.climate,
    terreno              :planetas.terrain,
    poblacion            :planetas.population

    }));
  console.log(respt);

  res.json(respt);

});


app.get('/planetasyAPI',async(req,res)=>{
  req = await axios.get('https://swapi.py4e.com/api/planets/');
  const respt = req.data.results.map(planetas =>({
    planeta              :planetas.name,
    clima                :planetas.climate,
    poblacion            :planetas.population,
    terreno              :planetas.terrain
    

    }));
  const data ={ TableName: START_TABLE }
  dynamoDB.scan(data,(error,results)=>{
    if(error){
      res.status(400).json({msg:' Error al acceder a los datos '});
    }else{
      //const pla= results.Items.map(element =>({planeta:element.planeta,clima:element.clima,terreno:element.terreno,poblacion:element.poblacion}));
      const pla= results.Items.map(element =>{const {id,...resto}=element; return resto;} );
      res.status(200).json({planetas:[pla,respt]})
    }
  });
})

app.get('/planetas',(req,res)=>{
  
  const data ={ TableName: START_TABLE }
  dynamoDB.scan(data,(error,results)=>{
    if(error){
      res.status(400).json({msg:' Error al acceder a los datos '});
    }else{
      const {Items}= results;
      res.status(200).json({success:true,Items})
    }
  });
})
app.post('/addPlaneta',(req,res)=>{
  const { id, planeta, clima, terreno,poblacion } = req.body;
  const params = { TableName: START_TABLE, Item:{ id, planeta, clima, terreno, poblacion} }

  dynamoDB.put(params,(error)=>{
    if(error){console.log(error.message); res.status(400).json({msg:'Error al registrar el planeta'});
    }else{ res.status(201).json({ id, planeta, clima, terreno, poblacion }); }
  });
});
module.exports.generic = serverless(app);
