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

//app.use(bodyParser.urlencoded({extended: true})); 
app.use(bodyParser.json()); 

app.get('/planetasyAPI',async(req,res)=>{
  req = await axios.get('https://swapi.py4e.com/api/planets');
  const respt = req.data.results.map(planetas =>({
    nombre               : planetas.name,
    periodo_de_rotacion  : planetas.rotation_period,              
    periodo_orbital      : planetas.orbital_period,  
    diametro             : planetas.diameter,  
    climatizado          : planetas.climate,      
    gravedad             : planetas.gravity,  
    terreno              : planetas.terrain,  
    superficie_del_agua  : planetas.surface_water,              
    poblacion            : planetas.population,    
    residentes           : planetas.residents,    
    peliculas            : planetas.films,  
    creado               : planetas.created,
    editado              : planetas.edited,  
    url                  : planetas.url
    }));
  const data ={ TableName: START_TABLE }
  await dynamoDB.scan(data,(error,results)=>{
    if(error){
      res.status(400).json({msg:' Error al acceder a los datos '});
    }else{
      //const pla= results.Items.map(element =>({planeta:element.planeta,clima:element.clima,terreno:element.terreno,poblacion:element.poblacion}));
      const pla= results.Items.map(element =>{const {id,...resto}=element; return resto;} );
      res.status(200).json({planetas:[pla,respt]})
    }
  });
});
app.post('/addPlaneta',async(req,res)=>{
  const{id,nombre, periodo_de_rotacion,periodo_orbital,diametro,climatizado ,gravedad,terreno,
        superficie_del_agua, poblacion,residentesId,peliculasId,creado,editado,url} = req.body;
  const residentes=residentesId.map(resident=> {return `https://swapi.py4e.com/api/people/${resident}`;});
  const peliculas =peliculasId.map(pelis=>{return `https://swapi.py4e.com/api/films/${pelis}`;})
        console.log(nombre)
  const params = { TableName: START_TABLE, Item:{ id, nombre,periodo_de_rotacion,periodo_orbital,diametro,
        climatizado ,gravedad,terreno,superficie_del_agua, poblacion,residentes,peliculas,creado,editado,url} }
     
    await dynamoDB.put(params,(error)=>{
    if(error){console.log(error.message); res.status(400).json({msg:'Error al registrar el planeta'});
    }else{ res.status(201).json({ id, nombre, periodo_de_rotacion,periodo_orbital,diametro, climatizado ,
      gravedad,terreno,superficie_del_agua, poblacion,residentes,peliculas,creado,editado,url }); }
  });
});
module.exports.generic = serverless(app);
