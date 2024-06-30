// jshinteversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ =require("lodash");

const app = express();
app.set('view engine','ejs');

app.use(bodyParser.urlencoded({extended:true}));
app.use(express.static("public"));

mongoose.connect("mongodb://127.0.0.1:27017/checklistDB");
const itemsSchema = {
    name:String 
};
const Item = mongoose.model("Item",itemsSchema);
const item1 = new Item({
    name:"This is your checklist"
});
const item2 = new Item({
    name:"Add or remove items from your checklist"
});
const item3 = new Item({
    name:"make your own customised list"
});
const defaultItems = [item1,item2,item3];
const listSchema = {
    name:String,
    items:[itemsSchema]
};
const List = mongoose.model("list",listSchema);

app.get("/",function(req,res){
    Item.find({})
    .then(foundItems => {
        if(foundItems.length==0){
            Item.insertMany(defaultItems).then(function(){
                console.log("successfully saved items to DB");
            }).catch(function(err){
                console.log(err);
            });
            res.redirect("/");
        }
        else{
            res.render("list",{listTitle:"Today",newListItems:foundItems});
        }
    })
    .catch(function(err){
        console.log(err);
    })
});

app.get("/:customListName",function(req,res){
    const customListName = _.capitalize(req.params.customListName);
    List.findOne({name:customListName}).then(function(foundList){
        if(!foundList){
            const list = new List({
                name:customListName,
                items:defaultItems
            });
            list.save();
            res.redirect("/"+customListName);
        }
        else{
            res.render("list",{listTitle:foundList.name,newListItems:foundList.items});
        }
    }).catch(function(err){
        console.log(err);
    });
});

app.post("/",function(req,res){
    const itemName = req.body.newItem;
    const listName = req.body.list;
    const item = new Item({
        name:itemName
    });
    if(listName=="Today"){
        item.save();
        res.redirect("/");
    }
    else{
        List.findOne({name:listName}).then(function(foundList){
            foundList.items.push(item);
            foundList.save();
            res.redirect("/"+listName);
        });
    }
});

app.post("/delete",function(req,res){
    const checkedItemId = req.body.checkbox;
    const listName = req.body.listName;
    if(listName=="Today"){
        Item.findByIdAndRemove(checkedItemId)
        .then(function(){
            console.log("successfully deleted");
            res.redirect("/");
        })
        .catch(function(err){
            console.log(err);
        });
    }
    else{
        List.findOneAndUpdate({name:listName},{$pull:{items:{_id:checkedItemId}}})
        .then(function(foundList){
            res.redirect("/"+listName);
        })
        .catch(function(err){
            console.log(err);
        });
    }
});

app.listen(3000,function(){
    console.log("server started");
});