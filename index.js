import express from 'express'
import mysql from 'mysql2/promise'
import { myConfig } from './configDb.js'



const app=express()
app.use(express.json())


let connection

try {
    connection=mysql.createPool(myConfig)
    //egy teszt mert a connectionPool() csak létrehozza a pool objektumot, de nem ellenőrzni hogy létezike az adatbázis
    await connection.execute('select 1')
    console.log('Sikeres adatbázis kapcsolódás....');
    
} catch (error) {
    console.log('HIBAAAAAA',error);
    process.exit(1)//leállítja a programot mert az alkalmazás nem tudja megnyitni az adatbázist
}

//kategóriák lekérsezése:
app.get('/api/categories',async (req,resp)=>{
    try {
        const sql='SELECT id,name FROM categories order by name'
        const [rows]=await connection.execute(sql)
        resp.status(200).send(rows)
        
    } catch (error) {
        console.log(error);
        
    }
})

app.get('/api/options/:categId',async (req,resp)=>{
    const {categId}=req.params
    try {
        const sql=`SELECT options.id,options.name,options.descr,options.image,
        categories.name as categ_name from options,categories
where options.categ_id=categories.id and categories.id=? order by options.name`
        const [rows]=await connection.execute(sql,[categId])
        resp.status(200).send(rows)
        
    } catch (error) {
        console.log(error);
        
    }
})

app.get('/api/result/:categId',async (req,resp)=>{
    const {categId}=req.params
    try {
       const sql=`select categories.name as categ_name,options.name,count(votes.user_id) votes_count
        from categories,options,votes
        where categories.id=options.categ_id and options.id=votes.option_id
        and categories.id=?
        GROUP by votes.option_id
        order by votes_count DESC`
        const [rows]=await connection.execute(sql,[categId])
        resp.status(200).send(rows)
        
    } catch (error) {
        console.log(error);
        
    }
})

app.get('/api/check/:categId/:userId',async (req,resp)=>{
    const {categId,userId}=req.params
    try {
       const sql=`SELECT categories.name as categ_name,votes.id as votes_id,votes.user_id 
            from categories,options,votes 
            where categories.id=options.categ_id and votes.option_id=options.id
            and votes.user_id=? and categories.id=?`
        const [rows]=await connection.execute(sql,[userId,categId])
        if(rows.length==0) resp.json({has_voted:false})
        else resp.json({has_voted:true})
        
    } catch (error) {
        console.log(error);
        
    }

})

app.post('/api/users/identify', async (req, resp) => {
    const username = String(req.body.username || '').trim()
    if (!username) return resp.status(400).json({msg: 'Add meg a neved!'})
    try {
        const [existing] = await connection.execute('SELECT id, username FROM users WHERE username = ? LIMIT 1', [username])
        if (existing.length) return resp.json(existing[0])
        const [result] = await connection.execute('INSERT INTO users (username) VALUES (?)', [username])
        resp.status(201).json({id: result.insertId, username})
    } catch (error) {
        console.log(error)
        resp.status(500).json({msg: 'Nem sikerült a felhasználó azonosítása.'})
    }
})

app.post('/api/votes',async (req,resp)=>{
    const {optionId,userId}=req.body
    try {
        const [options] = await connection.execute('SELECT categ_id FROM options WHERE id = ?', [optionId])
        if (!options.length) return resp.status(400).json({msg: 'Nincs ilyen szavazási lehetőség.'})
        const [previous] = await connection.execute(`SELECT votes.id FROM votes, options
            WHERE votes.option_id = options.id AND options.categ_id = ? AND votes.user_id = ? LIMIT 1`, [options[0].categ_id, userId])
        if (previous.length) return resp.status(409).json({msg: 'Ebben a kategóriában már szavaztál.'})
        const sql=`insert into votes (user_id,option_id) values (?,?)`
        await connection.execute(sql,[userId,optionId])
        resp.status(201).json({msg:'A szavazatodat sikeresen rögzítettük!'})

    } catch (error) {
        console.log(error);
        resp.status(500).json({msg:'Hiba!!!!'})
    }

})

const port =8000
app.listen(port,()=>console.log(`Server listening on port: ${port}...`))