const express = require('express');
const router = express.Router();

var request = require('request');
var url1 = 'https//localhost:3000';
var url2 = 'https://localhost:3000';

var appPhoneNumber = '263788108777@c.us';
var system='status@broadcast'; 

// Load chat model
const Messages = require('../models/message');
const Contacts= require('../models/contacts');
const Contents= require('../models/contents');
const Menu = require('../models/menu');
const Stages=require('../models/stages');
const Images = require('../models/images');
const PreviousStages=require('../models/previousstages');

var images     = require('../images');

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
    var time = new Date().getTime() / 1000;
    if (data){
        if (data.user!=appPhoneNumber && data.user!=system) {
            //log incoming message
            console.log('Incoming message Type:'+data.type+' From:'+ data.user+' text >>'+data.text);
            var myMessage={
                type:data.type,
                author:data.user,
                body:data.text,
                fromMe:false,
                chatId:data.user,
                time:time,
                text:data.text,
                user: data.user
            }

            //save message to database
            Messages.create(myMessage, function (err, data){
                if (err) console.log('Message not saved',err)
                }
            );

                //1. Check if first message

                const checkMyResponse = async function(txt){
                    if (typeof(txt)==='string'){
                        if (txt){
                            if (txt.indexOf('Still getting data on this') > 0) {
                                var msg = await getMenuText('A',data);
                                finalResponse(msg);         
                            }
                        }
                    }
                }
              

                const sendInitialMessage = async function(message){
                    var txt = await getMenuText('A',message);
                    res.send( [{
                        "text": txt,
                        "type": "message"
                    }])
                }


                const  analyseResponse = async function(message, func){
                    // get last stage
                    var first = await firstMessage(message);
                    if (first == true){
                        askForName(message);
                        return; 
                    }
                    var stage = await getLastStage(message);
                    console.log("STAGE: ",stage);
                    if (stage.stage == 'ASK'){
                       var txt = 'Hi! *' + message.text + '*\n';
                        saveContactName(message,message.text);
                        txt += 'I am very pleased to meet you.\n\n';
                        
                        var m = await getMenuText('A',message);
                        m.msg = txt + m.msg;
                        //sendMessage(message, m);
                    }
                    if ((isGreeting(message.text) == true)) {
                        var m = await getMenuText('A',message);
                        //sendMessage(message, m);
                    } else if (isBackButton(message) == true){
                        console.log('BACK');
                        var newStage = await getPreviousStage(message);
                        console.log('Prev Stage:', newStage);
                        if (typeof(newStage === 'object')){
                            var m = await getStageText(newStage, message);
                            //sendMessage(message,m);
                        } else {
                            var m = await getMenuText('A',message);
                            //sendMessage(message, m);
                        }
                        checkMyResponse(m);
                    } else if (isLoggingComplaint(stage) == true){
                        console.log("Logging complaint");
                         processComplaint(message,stage);
                    }
                    else {
                        var opt = await isMenuOption(stage,message);
                        console.log('opt',opt);
                        if (opt>0) { 
                            // implies that the option is available on the list of presented menu options
                            var newStage = await getNextMenu(stage,opt);
                            console.log('Next Stage:' +newStage);
                            var m = await getMenuText(newStage,message);
                            
                            //sendMessage(message,m);
                            checkMyResponse(m);
                        } else if (opt == 0) { // implies that the option is NOT available on the list of presented menu options
                            //check if it's a content option
                            var msg = '';
                            if ((stage.stage == 'content')||(stage.stage == 'menu')){
                            txt = await processContentOption(message);
                            var m = {"msg": txt,
                                        "stage": stage.stage,
                                        "stage_type": stage.stage_type,
                                        "stageDetails": []};
                            //sendMessage(message, m);
                            checkMyResponse(msg);
                            }
                            if (msg =='') {
                                //else, present first menu
                                var msg = await getMenuText('A',message);
                                return msg
                                //sendMessage(message, msg);
                            }

                        } else if (opt == -1) {
                            //implies that the response is not a number therefore
                            // 1. search for the response in the list of menu options
                            console.log("1. search for the response in the list of menu options");
                            var txt = await getMenuFromText(message);
                            var m = {"msg": txt,
                                        "stage": stage.stage,
                                        "stage_type": stage.stage_type,
                                        "stageDetails": []};
                            console.log(m);
                            //sendMessage(message,m);
                            checkMyResponse(m);
                            if (m.msg === '') {
                            // 2. search for the response in the content
                                console.log(" 2. search for the response in the content");
                                var m = await getContentFromText(stage,message);
                                if ( m.msg != '') {
                                    return m;
                                    //sendMessage(message, m);
                                    checkMyResponse(m);
                                } else {
                                    //invalid response therefore, present first menu
                                    console.log("invalid response therefore, present first menu");
                                    txt = await getMenuText('A',message);
                                    return msg;
                                    //sendMessage(message, msg);
                                }
                            }
                        }
                
                    }   
                    return m;
                }

                
                const finalResponse = async function(message){
                    responseText= await analyseResponse(message);
                    console.log("RESPONSE::",responseText);
                    
                    if(typeof responseText != 'undefined'){
                        if(typeof responseText.msg!='undefined'){
                            if(responseText.img!==undefined && responseText.img.length>1){
                                var image=await findImage(responseText.img);
                                res.send( [{
                                    "text": responseText.msg,
                                    "type": "message",
                                    "files":[{
                                        "name":"file.jpg",
                                        "file":image.base64
                                    }]
                                }])
                            }else {
                                res.send( [{
                                    "text": responseText.msg,
                                    "type": "message"
                                }])
                            }
                        }else {
                            res.send( [{
                                "text": responseText,
                                "type": "message"
                            }])
                        }
                    }else{
                        res.send( [{
                            "text": 'Sorry... there is no information yet on this',
                            "type": "message"
                        }])
                    }
                    saveStage(myMessage,msg.stage_type,msg.stage,msg.stageDetails);
                }
                finalResponse(myMessage);

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
                    finalResponse(message);
                }

                const  processComplaint=async function(message, stage){
                    console.log("processing Complaint",message);
                    if (message.body){
                        saveComplaint(message);
                        //0. Check if the complaint is being concluded
                        if (isResponseNegative(message) == true){
                            //Send concluding msg
                            txt = 'Thank you. Your feedback is important to us';
                            m={"msg":txt,
                            "img":"",
                            "stage_type": 'menu',
                            "stage": 'A',
                            "stageDetails": []};
                            finalResponse(message);
                            //1. forward msg to agent
                            await forwardComplaints(message);
                        } else {
                            txt = "Thank you. Your complaint has been forwaded to the rightful person who will get in touch with you promptly.\n Is there anything else that you want to add?";
                            m={"msg":txt,
                            "img":"",
                            "stage_type": stage.stage_type,
                            "stage": stage.stage,
                            "stageDetails": []};
                            finalResponse(txt);
                        }
                         
                    }   
                }
               
                
            }
      
    }
    //res.send('ok');
});


 const findImage= async function(Imgname) {
    return await Images.findOne({ name:Imgname }).exec();
    
  }

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

function isDirectMessage(message){
    if (message.user.indexOf('@c.us') > 0) {
        return true;
    } else {
        return false;
    }
}



function isChangingName(message){
    txt = message.text;
    //remove special characters
    txt = txt.replace(/[^\w\s]/gi, ' ');
    txt = txt.toUpperCase().trim();
    if ((txt == 'CHANGE')||(txt == 'CHANGE MY NAME')||(txt == 'CHANGE NAME')){
        return true;
    } else {
        return false;
    }
}

function isResponseNegative(message){
    txt = message.text;
    //remove special characters
    txt = txt.replace(/[^\w\s]/gi, ' ');
    txt = txt.toUpperCase().trim();
    if ((txt == 'NO')||(txt == 'NOPE')||(txt == 'NA')){
        return true;
    } else {
        return false;
    }
}

function isLoggingComplaint(stage){
    if (stage.stage_type === 'complaint'){
        return true;
    } else {
        return false;
    }
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
        // saveStage(message,stage.stage,stage.details);
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
    console.log("MSG1:",message);
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
                    // saveStage(message,'menu',stageDetails);
                    saveStage(message,'menu','menu',stageDetails);
                    msg += '#. Back\n\n';
                    msg += 'Please select your option from the list given above.'
                    return msg;
                } 
            }
        } else {
            return '';
        }
 }



const  saveComplaint = async function(message){
    //check if person is in DB and store if not
    data =  await Contacts.findOne({'phoneNumber':getPhoneNumber(message)});
    
    if (data){
        newcomplaint = { messageId: message.id};
        if (data.complaints){
            data.complaints.push(newcomplaint);
        } else {
            data.complaints = [newcomplaint];
        }
        Contacts.updateOne({_id:data._id},
            {
                    complaints : data.complaints
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
}

const  forwardComplaints = async function(message){
    //check if person is in DB and store if not
    contact =  await Contacts.findOne({'phoneNumber':getPhoneNumber(message)});
    agents = await Agents.find();
     //formaat the message
     var name = await getContactName(message);
     var phone = getPhoneNumber(message);
     subject = '*Complaint via Dairibord Chatbot*';
     html = '<p><strong>Complaint From: </strong>' + name + '</p>';
     html += '<p><strong>Phone Number: </strong>' + phone + '</p>';
     html = '<p>' + message.body + '</p>';
     txt = '*Complaint From:* ' + name + '\n';
     txt += '*Phone Number:* ' + phone + '\n';
     //txt =  message.body + '\n'; 
    if ((contact)&&(agents)){
        if (contact.complaints){ 
            agents.forEach((agent)=>{
                sendQuickMessage(agent.phoneNumber,txt);
                contact.complaints.forEach((c)=>{
                    forwardMessage(agent.phoneNumber,c.messageId);
                });
            });
        }
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
                // saveStage(message,stage, stageDetails);
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
                //    saveStage(message,'content',stageDetails);
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

const getContentFromText = async function(stage,message){
    console.log("MSG2:",message);
    var txt = message.text
    data = await Contents.find({
        $text: { $search: txt , $language: 'english'}
      });
    if (data.length == 0){
        var msg = 'Could not find any information on what you have asked.\n';
        msg += 'Your enquiry has been forwarded to Customer Services.\n';
        msg = await getMenuText('A',message);
        // var m={
        //     "msg":msg,
        //     "img":""
        // }
        return msg;
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
            // saveStage(message,'content',stageDetails);
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

function saveStage(message,stage_type, stage, stageDetails){
    if (!stage) return;
    console.log("saving stage:",stage_type,stage);
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
                        stage_type: stage_type,
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
                    stage_type: stage_type,
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
        msg: message.body,
        details: details
    }, function (err, data){
        if (err) console.log('PreviousStage not saved',err)
    })
}




 module.exports = router;
