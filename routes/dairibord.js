const express = require('express');
const router = express.Router();

var request = require('request');
var url1 = 'https//localhost:3000';
var url2 = 'https://localhost:3000';

var appPhoneNumber = '263788108777@c.us';

// Load chat model
const Messages = require('../models/message');
const Contacts= require('../models/contacts');
const Contents= require('../models/contents');
const Menu = require('../models/menu');
const Stages=require('../models/stages');
const PreviousStages=require('../models/previousstages');

//route to add new menu line
router.post('/saveMenu/', function (req, res) {
    var data=req.body;
    var menu = new Menu({
        stage:data.stage,
        itemName:data.itemName,
        parent:data.parent,
        option:data.option,
        nextStage:data.nextStage,
    });
    // Save the new menu
    menu.save(function (error) {
        if(error){
            console.error("write error: " + error.message);
            res.send(err);
        }else{
            console.log("new menu saved " );
            res.send(data);
        };
    });
    
});

router.post('/saveContent/', function (req, res) {
    var data=req.body;
    var contents = new Contents({
        id:data.id,
        content:data.content,
        title:data.title,
        keywords:data.keywords,
        image:data.image
    });
    // Save the new menu
    contents.save(function (error) {
        if(error){
            console.error("write error: " + error.message);
            res.send(err);
        }else{
            console.log("new contents saved " );
            res.send(data);
        };
    });
    
});

// Handle POST request
router.post('/', function (req, res) {
    // console.log('in webhook');  
    var data = req.body; // New messages in the "body" variable
    //console.log(data);
    //for (var i = 0; i < data.messages.length; i++) { // For each message
    if (data){
            console.log('Incoming message Type:'+data.type+' From:'+ data.user+' text >>'+data.text);
            Messages.create(data, function (err, data){
                if (err) console.log('Message not saved',err)
                }
            );
            if (data.user!=appPhoneNumber && data.user!='status@broadcast') {
                //1. Check if first message

              

                const sendInitialMessage = async function(message){
                    var txt = await getMenuText('A',message);
                    res.send( [{
                        "text": txt,
                        "type": "message"
                    }])
                }
                
                const finalResponse = async function(message){
                    responseText= await analyseResponse(message);
                    console.log("RESPONSE::",responseText);
                        res.send( [{
                            "text": responseText.msg,
                            "type": "message"
                        }])
                }
                finalResponse(data);

                const askForName = async function(message){
                    data =  await Menu.find({stage: 'ASK'});
                   //console.log('menu',data);
                   var txt = '';
                   if (data){
                       if (data.length>0){
                         data.forEach((item)=>{
                            txt += item.itemName + '\n';
                         })
                       }
                    }
                    finalResponse(txt);
                }

                const checkMyResponse = async function(txt){
                    if (typeof(txt)==='string'){
                        if (txt){
                            if (txt.indexOf('Still getting data on this') > 0) {
                                var msg = await getMenuText('A',message);
                                finalResponse(msg);         
                            }
                        }
                    }
                }
                
            }
      
    }
    //res.send('ok');
});




const getSalutation = async function(message){
    name = await getContactName(message);
    return 'Ok! *' + name + '*,\n I am here to assist you on any information you may need to know about *Dairibord*.\n\n';
}

function isBackButton(message){
    txt = message.text;
    //remove special characters
    txt = txt.replace(/[^\w\s]/gi, ' ');
    txt = txt.toUpperCase().trim();
    if ((txt == '#')||(txt == 'BACK')){
        return true;
    } else {
        return false;
    }
}

const  analyseResponse = async function(message, func){
    // get last stage
    var first = await firstMessage(message);
    if (first == true){
        askForName(message);
        return; 
    }
    var stage = await getLastStage(message);
    if (stage == 'ASK'){
       var txt = 'Hi! *' + message.text + '*\n';
        saveContactName(message,message.text);
        txt += 'I am very pleased to meet you.\n\n';
        
        var txt1 = await getMenuText('A',message);
        txt += txt1;
        return txt;
    }
    if (isGreeting(message.text) == true) {
        var txt = await getMenuText('A',message);
    } else if (isBackButton(message) == true){
        console.log('BACK');
        var newStage = await getPreviousStage(message);
        console.log('Prev Stage:', newStage);
        if (typeof(newStage === 'object')){
            var txt = await getStageText(newStage, message);
            //var txt = await getMenuText(newStage.stage,message);
        } else {
            var txt = await getMenuText('A',message);
        }
        checkMyResponse(txt);
    }
    else {
        var opt = await isMenuOption(stage,message);
        //console.log('opt',opt);
        if (opt>0) { 
            // implies that the option is available on the list of presented menu options
            var newStage = await getNextMenu(stage,opt);
            //console.log('Next Stage:' +newStage);
            var txt = await getMenuText(newStage,message);
            checkMyResponse(txt);
        } else if (opt == 0) { // implies that the option is NOT available on the list of presented menu options
            //check if it's a content option
            var msg = '';
            if ((stage == 'content')||(stage == 'menu')){
               msg = await processContentOption(message);
               checkMyResponse(msg);
            }
            if (msg =='') {
                //else, present first menu
                var msg = await getMenuText('A',message);
            }
        } else if (opt == -1) {
            //implies that the response is not a number therefore
            // 1. search for the response in the list of menu options
            var txt = await getMenuFromText(message);
            checkMyResponse(txt);
            if (txt === '') {
            // 2. search for the response in the content
                var msg = await getContentFromText(message);
                if ( msg != '') {
                    checkMyResponse(msg);
                } else {
                    //invalid response therefore, present first menu
                    var msg = await getMenuText('A',message);
                }
            }
        }
    }   
    return txt;
}



function isGreeting(txt){
    //remove special characters
    txt = txt.replace(/[^\w\s]/gi, ' ');
    txt = txt.toUpperCase().trim();
    if  ((txt === 'HI')||(txt === 'HELLO')||(txt==='HIE')||(txt=='YO')||(txt=='MENU')){
        return true;
    } else {
        return false;
    }
}

const isMenuOption = async function (stage, message){
    txt = message.text;
    //remove special characters
    txt = txt.replace(/[^\w\s]/gi, ' ');
    txt = txt.toUpperCase().trim();
    var opt = parseInt(txt);
    //console.log('stage',stage,'opt',opt);
    if (!isNaN(opt)){
        var option = await getOpt(stage,opt);
        return option;
    } else {
        return -1;
    }
}

const processContentOption = async function (message){
    txt = message.text;
    //remove special characters
    txt = txt.replace(/[^\w\s]/gi, ' ');
    txt = txt.toUpperCase().trim();
    var opt = parseInt(txt);
    console.log('processContentOption','opt',opt);
    if (!isNaN(opt)){
        var phoneNumber = getPhoneNumber(message);
        // var stages = new Stages;
        var contentId = null;
        st =  await Stages.findById(phoneNumber)
        if (st){
            if (st.details){
                st.details.forEach((item)=>{
                    if (opt == item.option){
                        contentId = item.contentId;
                    }
                })
            }
            console.log('contentId',contentId);
            if (contentId){
                if (st.stage == 'content') {
                   // saveStage(message,'A');
                    return await getContentById(contentId);
                } else if (st.stage == 'menu') {
                    return await getMenuById(contentId,message);
                }
            }
        }
        
        return '';
    } else {
        return '';
    }
}

const getOpt=async function(stage,opt){
    data = await Menu.findOne({'parent': stage, 'option': opt});
        if (data){
            return data.option;
         }
            return 0;
}

const getStageText = async function(stage, message){
    var msg = '';
    if (stage.details){
        stage.details.forEach((d)=>{
            msg += d.option + '. ' + d.title + '\n'
        })
        msg += '#. Back\n\n';
        msg += 'Please select your option from the list given above.'
        m={"msg":msg,"img":""};
        saveStage(message,stage.stage,stage.details);
        return m;
    } else if (typeof(stage) === 'string'){
        return await getMenuText('A',message);
    }
    
}

const  getNextMenu=async function(stage, option){
   var txt = '';
   data = await Menu.findOne({'parent': stage, 'option': option});
       if (data){
           //console.log('nextstage',data.stage);
           return data.stage;
        } else {
            return 0;
        }      
}

const  getMenuFromText=async function(message){
    var txt = message.text;
    data = await Menu.find({
        $text: { $search: txt , $language: 'english'}
      });
      if (data){
            if (data.length ==0){
                return '';
            } else if (data.length == 1) {
                return await getMenuText(data[0].stage,message);
            } else if (data.length>1){
                //Get array of titles
                var msg = '';
                var lastmsg = '';
                stageDetails = [];
                var n = 0;
                data.forEach((item)=>{
                    if (item.itemName) {
                        n++;
                        msg += n +'. ' + item.itemName + '\n';
                        stageDetails.push({option: n, contentId: item._id, title: item.itemName});
                        lastmsg = '*'+ item.itemName + '*\n' ;
                    }
                });
                if (n == 1){
                    return lastmsg;
                } else if (n > 1){
                    saveStage(message,'menu',stageDetails);
                    msg += '#. Back\n\n';
                    msg += 'Please select your option from the list given above.'
                    return msg;
                } 
            }
        } else {
            return '';
        }
 }

const  getPreviousStage=async function(message){
    var stage;
    data = await PreviousStages.find({'phoneNumber': getPhoneNumber(message)}, null, {sort: '-created', limit: 2});
        if (data){
            //console.log(data);
            var k = data.length;
            data.forEach((s)=>{
                //console.log('k=',k);
                if ((s.stage == 'A')||(k == 1)){
                  stage = s;
                }
                k--;
            });
         }
         if (stage){
             return stage;
        } else
         return 'A';
 }

function getPhoneNumber(message){
    // check the message if private or group
    // return a split phone number
    var phone = message.user;
    if (phone.indexOf('@c.us') > 0) {
        // number is private so strip it
        var new_phone = phone.replace('@c.us', '');
        return new_phone;
    } else {
        return 0;
    }
}

const firstMessage = async function(message){
    //check if person is in DB and store if not
    data =  await Contacts.findOne({'phoneNumber':getPhoneNumber(message)});
    
    if (data){
        console.log('Data',data);
        return false;
    } else {
        console.log('Saving New contact');
        contact = new Contacts({'phoneNumber':getPhoneNumber(message)});
        contact.save();
        return true;         
    }
};

const getContactName = async function(message){
    data =  await Contacts.findOne({'phoneNumber':getPhoneNumber(message)});
    var name = '';
    if (data){
        name = data.name;
    }

    if ((name == undefined)||(name == '')) {
        name = message.senderName;
    }
    return name;
   
}

const saveContactName = async function(message,name){
    //check if person is in DB and store if not
    data =  await Contacts.findOne({'phoneNumber':getPhoneNumber(message)});
    
    if (data){
        Contacts.updateOne({_id:data._id},
            {
                    name: name,
                    phoneNumber: getPhoneNumber(message),
                    senderName: message.senderName
            }, function (err,data){
                if (err) console.log('Contact not updated',err)
            });     
        return;
    } else { // insert new contact
        //console.log('Saving contact');
        contact = new Contacts({'phoneNumber':getPhoneNumber(message), 'name': name, 'senderName': message.senderName});
        contact.save();
        return;         
    }
};

function dbtest(){
    Menu.find({},function (err, docs) {
        console.log(docs);

        if(err){
            console.log(err);
        }
    
    });  
}



const  getMenuText= async function(stage, message){
   //var menu = new Menu;
   var txt = '';
   var m={"msg":"","img":""};
   if (stage == 'A'){
       txt += await getSalutation(message);
   }
   txt += 'To make it easy kindly reply with an option below:\n';
//    return 'Test msg';
   //console.log('stage',stage);
   data =  await Menu.find({parent: stage});
   //console.log('menu',data);
   if (data){
       if (data.length>0){
           var stageDetails = [];
           data.forEach((menuItem)=>{
               txt += '\n' + menuItem.option + '. ' + menuItem.itemName;
               stageDetails.push({option: menuItem.option, title: menuItem.itemName});
		        //console.log(txt);
           });
           if (stage != 'A'){
               // Add Back
               txt += '\n#. Back\n\n'; 
           } else {
               txt += "\n\nif your option is not above kindly type *Enquiry*"
           }
           if (stage){
                saveStage(message,stage, stageDetails);
            }
            m={"msg":txt,"img":""};
           return m;
           
        } else {
            console.log('No Menu found');
            var txt = await getContent(stage,message);
            m={"msg":txt,"img":""};
            return txt;
        }
    } else {

    }
};

const getContent = async function(stage, message){
    console.log('getContent',stage);
    data = await Contents.find({id: stage});
    var m={"msg":"","img":""};
    if (data){
        if (data.length ==0){
            return 'Still getting data on this.... Will update you shortly.';
          } else if (data.length == 1) {
               var msg = '';var img='';
               if (data[0].title){
                   msg = '*'+ data[0].title.trim() + '*\n'
               }
               if(data[0].image){
                   img=data[0].image;
               }
               msg += data[0].content;
               m={"msg":msg,"img":img};
               return m;
           } else if (data.length>1){
               //Get array of titles
               var msg = '';
               var lastmsg = '';
               stageDetails = [];
               var n = 0;
               data.forEach((item)=>{
                   if (item.title) {
                       n++;
                       msg += n +'. ' + item.title + '\n';
                       stageDetails.push({option: n, contentId: item._id, title: item.title});
                       lastmsg = '*'+ item.title.trim() + '*\n' + item.content;
                   }
               });
               if (n == 1){
                    m={"msg":lastmsg,"img":""};
                   return m;
               } else if (n > 1){
                   saveStage(message,'content',stageDetails);
                   msg += '#. Back\n\n';
                   msg += 'Please select your option from the list given above.'
                   m={"msg":msg,"img":""};
                   return m;
               } 
           }
    } else {
        return 'Still getting data on this topic.... Will update you shortly.';
    }
}

const getContentById = async function(contentId){
    data = await Contents.findById(contentId);
    if (data){
        var msg = '';
        if (data.title){
            msg = '*'+ data.title.trim() + '*\n'
        }
        msg += data.content;
        return msg;
    } else {
        return 'Still getting data on this topic.... Will update you shortly.';
    }
}

const getMenuById = async function(contentId, message){
    data = await Menu.findById(contentId);
    if (data){
        return await getMenuText(data.stage,message);
    } else {
        return 'Still getting data on this topic.... Will update you shortly.';
    }
}

const getContentFromText = async function(message){
    var txt = message.text
    data = await Contents.find({
        $text: { $search: txt , $language: 'english'}
      });
    if (data.length == 0){
        var msg = 'Could not find any information on what you have asked.\n';
        msg += 'Your enquiry has been forwarded to Customer Services.\n';
        msg = await getMenuText('A',message);
        var m={
            "msg":msg,
            "img":""
        }
        return m;
    } else if (data.length == 1){
        var msg = ''; var img='';
        if (data[0].title){
            msg = '*'+ data[0].title.trim() + '*\n'
        }
        if(data[0].image){
            img=data[0].image;
        }
        msg += data[0].content;
        var m={
            "msg":msg,
            "img":img
        }
        return m;
    } else if (data.length > 1){
        //Get array of titles
        var msg = '';
        var lastmsg = '';
        var m={
            "msg":msg,
            "img":img
        }
        stageDetails = [];
        var n = 0;
        data.forEach((item)=>{
            if (item.title) {
                n++;
                msg += n +'. ' + item.title + '\n';
                stageDetails.push({option: n, contentId: item._id, title: item.title});
                lastmsg = '*'+ item.title.trim() + '*\n' + item.content;
            }
        });
        if (n == 1){
            m={"msg":lastmsg,"img":""};
            return m;
        } else if (n > 1){
            saveStage(message,'content',stageDetails);
            msg += '#. Back\n\n';
            msg += 'Please select your option from the list given above.'
            m={"msg":msg,"img":""};
            return m;
        }
    }
}




const  getLastStage=async function(message){
    var phoneNumber = getPhoneNumber(message);
   // var stages = new Stages;
   st =  await Stages.findById(phoneNumber)
        if (st){
            return st.stage;
        }else {
            return 'A';
        }
}

function saveStage(message, stage, stageDetails){
    var id = getPhoneNumber(message);
    if (stageDetails){
        details = stageDetails;
    } else {
        details = [];
    }
    Stages.findById(id).then((data)=>{
        if (data){
            Stages.updateOne({_id:id},
                {
                        stage: stage,
                        phoneNumber: getPhoneNumber(message),
                        name: message.senderName,
                        details: details
                }, function (err,data){
                    if (err) console.log('Stage not updated',err)
                });        
        } else {// insert
            Stages.create(
                {
                    _id : getPhoneNumber(message),
                    stage: stage,
                    phoneNumber: getPhoneNumber(message),
                    name: message.senderName,
                    details: details
                }, function (err, data){
                    if (err) console.log('Stage not saved',err)
                }
            );
        }
    });
    PreviousStages.create({
        stage: stage,
        phoneNumber: getPhoneNumber(message),
        name: message.senderName,
        msg: message.text,
        details: details
    }, function (err, data){
        if (err) console.log('PreviousStage not saved',err)
    })
}



 module.exports = router;
